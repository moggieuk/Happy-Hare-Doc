// Mermaid diagram rendering - deliberately NOT via pymdownx.superfences' custom-fence
// mechanism. TOC.md's "Zensical rough edges" documents that path as non-deterministic
// across clean rebuilds (a ```mermaid fence rendered a real diagram in roughly 1 of 4
// rebuilds and fell back to raw source text as plain paragraph content the other 3,
// with no build warning either way) - and traced the flakiness to the fence-extraction
// machinery itself, not to Mermaid or to Zensical's page-render cache generally (plain
// syntax-highlighted fences hit the identical bug with no Mermaid involved at all).
//
// So diagrams here are written directly as raw HTML (`<pre class="hh-mermaid">...</pre>`,
// passed through untouched by the already-enabled md_in_html extension) rather than as
// ```mermaid fences - there is no fence-extraction step for that markup to race on, since
// the diagram source reaches the browser as plain text every time.
//
// Deliberately NOT class="mermaid": mermaid.min.js's own default behavior auto-scans
// for exactly that class and self-renders it on the page's FIRST load, via its own
// DOMContentLoaded listener registered the instant the CDN script itself loads - i.e.
// before this file (loaded after it) even runs, so calling mermaid.initialize({
// startOnLoad: false}) here is already too late to stop that first pass. Confirmed
// directly: on a fresh load, document.querySelectorAll('pre.mermaid') was already 0 and
// 'div.mermaid' already 6 by the time ANY of our own code could have run - mermaid's
// auto-render had already converted and emptied every node, hit the layout race below,
// and hung with no data-processed ever set and no console output, since nothing was
// listening for or retrying that pass. class="hh-mermaid" keeps every node invisible to
// that auto-scan; this file's own document$ subscription (passing nodes explicitly to
// mermaid.run()) is the only render path that ever touches them.
//
// Two further timing issues found while getting this working, both confirmed directly
// (not guessed at) by comparing an immediate in-callback call against the same call
// made manually a moment later against the identical elements:
//
//   1. document$ fires MORE THAN ONCE for a single cold load. A simple in-progress
//      boolean flag does not stop the second firing from also starting - both ran
//      concurrently and corrupted each other's in-flight DOM measurements. Fixed with
//      a real serial queue on `window`, not a script-local closure variable - this
//      script's top-level code has itself been observed running more than once against
//      the same window/DOM, and a closure-local queue only serializes firings within
//      ITS OWN execution, not against a second execution's queue.
//   2. Calling mermaid.run() the INSTANT document$ fires reliably failed ("Cannot read
//      properties of null (reading 'getBBox')") on every diagram, every time - mermaid
//      measures text via a temporary SVG element immediately on call, and calling
//      before the browser has actually laid out the just-swapped content leaves that
//      measurement with nothing real to read. IMPORTANT: a flat setTimeout delay
//      looked like it fixed this (no thrown/rejected error, an <svg> present in every
//      node) but did NOT reliably - mermaid swallows the SAME underlying failure
//      internally on some runs and renders its own "Syntax error in text" placeholder
//      SVG instead of rejecting, which still satisfies a bare 'svg present' check while
//      showing the reader nothing useful. Confirmed directly: mermaid.parse() on the
//      exact same source that produced an error placeholder said it was syntactically
//      valid, and a fresh manual mermaid.run() a moment later rendered the real diagram
//      fine - so it really is the same render-before-layout race as the thrown case,
//      just a silent variant of it. Checking for `svg` presence alone is therefore NOT
//      a valid success check - check for the absence of
//      svg[aria-roledescription="error"] specifically.
//
// Fix: wait on a real readiness signal (fonts loaded, at least one full layout/paint
// cycle done) rather than a guessed timeout, AND explicitly detect mermaid's silent
// error placeholder afterwards and retry those specific nodes once - belt and
// suspenders, since the placeholder case proved a plain "did it throw" check is not
// trustworthy for this failure mode.
//
// requestAnimationFrame never fires while the page is hidden (backgrounded/inactive
// tab) - confirmed directly (document.hidden === true, a raf2() call left pending
// indefinitely in that state). A user who opens this page in a background tab would
// hit that same stall, not just a test tool - so raf2() races against a fallback
// timeout rather than being awaited unconditionally; either one resolving is enough.
function hhMermaidReady() {
  var raf2 = function () {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  };
  var fallback = function () {
    return new Promise(function (resolve) { setTimeout(resolve, 300); });
  };
  var fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  return fontsReady.then(function () {
    return Promise.race([raf2(), fallback()]);
  });
}

function hhMermaidIsError(node) {
  var svg = node.querySelector("svg");
  return !!svg && svg.getAttribute("aria-roledescription") === "error";
}

if (typeof mermaid !== "undefined") {
  mermaid.initialize({ startOnLoad: false });

  // Queued on window, not a local closure variable: this script's top-level code
  // has been observed to execute more than once against the same window/DOM, and
  // mermaid.run() is not safe to call concurrently against overlapping nodes from
  // two independent queues - a closure-local queue only serializes firings within
  // ITS OWN execution, not against a second execution's queue.
  document$.subscribe(function () {
    window.__hhMermaidQueue = (window.__hhMermaidQueue || Promise.resolve())
      .then(hhMermaidReady)
      .then(function () {
        // Our own attribute, not mermaid's "data-processed" - nothing else scans
        // for or sets data-hh-processed, so its meaning is fully in our control.
        var pending = Array.prototype.filter.call(
          document.querySelectorAll(".hh-mermaid"),
          function (n) { return !n.hasAttribute("data-hh-processed"); }
        );
        if (!pending.length) return;

        // Cache the original source now, before mermaid mutates the node - needed to
        // restore and retry a node that comes back as a silent error placeholder.
        pending.forEach(function (n) {
          if (!n.hasAttribute("data-hh-mermaid-src")) {
            n.setAttribute("data-hh-mermaid-src", n.textContent);
          }
          n.setAttribute("data-hh-processed", "true");
        });

        return mermaid.run({ nodes: pending }).then(function () {
          var failed = pending.filter(hhMermaidIsError);
          if (!failed.length) return;
          console.warn("hh-mermaid: " + failed.length +
                       " diagram(s) hit the render-before-layout race - retrying once");
          failed.forEach(function (n) {
            n.textContent = n.getAttribute("data-hh-mermaid-src");
          });
          return hhMermaidReady().then(function () {
            return mermaid.run({ nodes: failed });
          });
        });
      })
      .catch(function (e) {
        // Fail visibly in the console rather than silently leaving raw diagram
        // source (or a blank element) on the page with no explanation.
        console.error("hh-mermaid: render failed", e && e.message);
      });
  });
}
