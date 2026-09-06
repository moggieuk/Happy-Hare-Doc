// Previous/Next page footer nav.
//
// Zensical doesn't render Material's own prev/next footer nav (checked the
// built HTML directly - no .md-footer__link markup at all, on any page).
// This rebuilds it from the already-rendered primary sidebar rather than a
// second copy of the page order: that sidebar already lists every real page
// in the same order as mkdocs.yml's nav:, mixed in with the current page's
// own on-page anchors (#heading-slug) - filtering those out by "no # in the
// href" leaves exactly the flat page list, with no separate data source to
// keep in sync.
//
// Runs on document$, not DOMContentLoaded: this theme uses instant loading
// (navigation.instant), which swaps content via history.pushState rather
// than a real page load after the first one - a plain DOMContentLoaded
// listener would only ever fire once and never run again on later
// in-app navigations. document$ is Material's own documented hook for
// exactly this (an RxJS observable that re-fires after every content swap).
//
// Aligns the Previous/Next links to the actual left/right edges of the
// content column (article.md-content__inner), not just centred in the
// full-width footer row - the row spans edge to edge (see extra.css), but
// the content column it sits under is inset by the sidebar(s) beside it,
// and Material sizes those with a fixed rem width rather than anything
// derivable from a simple CSS rule here. Measuring the real rendered
// positions and setting them as inline padding on the row is what stays
// correct regardless of which sidebar(s) are actually present (a page
// with no headings has no secondary/TOC sidebar; the primary one collapses
// into an off-canvas drawer below Material's mobile breakpoint) rather than
// hard-coding sidebar widths here and hoping they never drift out of sync
// with Material's own compiled CSS.
function syncPageNavToContent() {
  var nav = document.querySelector(".hh-page-nav");
  var article = document.querySelector("article.md-content__inner");
  if (!nav || !article) return;

  // Clear first: padding-left/right on nav itself doesn't move its own
  // border-box edges, but clearing before measuring avoids relying on that
  // subtlety being true across browsers.
  nav.style.paddingLeft = "";
  nav.style.paddingRight = "";

  var navRect = nav.getBoundingClientRect();
  var articleRect = article.getBoundingClientRect();
  nav.style.paddingLeft = Math.max(0, articleRect.left - navRect.left) + "px";
  nav.style.paddingRight = Math.max(0, navRect.right - articleRect.right) + "px";
}

var backToTopButton = null;

function updateBackToTopVisibility() {
  if (!backToTopButton) return;
  var y = window.scrollY || document.documentElement.scrollTop || 0;
  if (y > 300) {
    backToTopButton.classList.add("is-visible");
  } else {
    backToTopButton.classList.remove("is-visible");
  }
}

function ensureBackToTopButton() {
  if (backToTopButton && document.body.contains(backToTopButton)) {
    updateBackToTopVisibility();
    return;
  }

  var existing = document.querySelector(".hh-back-to-top");
  if (existing) {
    backToTopButton = existing;
    updateBackToTopVisibility();
    return;
  }

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "hh-back-to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.title = "Back to top";
  btn.textContent = "Back to Top";
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.body.appendChild(btn);
  backToTopButton = btn;
  updateBackToTopVisibility();
}

// Zensical renders the primary sidebar title as plain text beside a logo that
// already links to the site root. Make the title itself use that same URL so
// the whole "Happy Hare v4" brand block offers an obvious route home. This is
// done here rather than with a theme override because the repo deliberately
// uses Zensical's vendored templates unchanged.
function ensureSidebarHomeLink() {
  var title = document.querySelector(
    ".md-sidebar--primary nav.md-nav--primary > .md-nav__title"
  );
  if (!title || title.querySelector(".hh-sidebar-home-link")) return;

  var logoLink = title.querySelector("a.md-logo[href]");
  if (!logoLink) return;

  var titleText = Array.prototype.filter.call(title.childNodes, function (node) {
    return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
  })[0];
  if (!titleText) return;

  var homeLink = document.createElement("a");
  homeLink.href = logoLink.href;
  homeLink.className = "hh-sidebar-home-link";
  homeLink.textContent = titleText.textContent.trim();
  title.replaceChild(homeLink, titleText);
}

// Registered once, not inside document$.subscribe below - that callback
// re-fires (and rebuilds .hh-page-nav from scratch) on every in-app
// navigation, but this script itself only loads once, so a listener
// registered here safely covers every navigation's nav for the page's
// entire lifetime. Needed because a page/sidebar layout change that isn't
// a navigation - e.g. resizing across Material's mobile breakpoint, which
// hides the primary sidebar entirely - moves the content column without
// document$ firing again.
window.addEventListener("resize", syncPageNavToContent);
window.addEventListener("resize", updateBackToTopVisibility);
window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

document$.subscribe(function () {
  ensureSidebarHomeLink();

  // Lives inside the real theme <footer> now, not the article - prepended
  // as its first child, directly above .md-footer-meta, so it picks up the
  // footer's own full-width dark background with no styling of its own (see
  // extra.css) instead of sitting on the plain page background in a
  // separate band.
  var footer = document.querySelector("footer.md-footer");
  if (!footer) return;

  // A previous injection (from before an instant-navigation swap) would
  // otherwise still be sitting in the DOM alongside a freshly-rendered one.
  var stale = document.querySelector(".hh-page-nav");
  if (stale) stale.remove();

  var links = Array.prototype.slice.call(
    document.querySelectorAll(".md-sidebar--primary a.md-nav__link[href]")
  );

  var seen = {};
  var pages = [];
  links.forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href.indexOf("#") !== -1) return; // on-page anchor, not a real page
    var path = new URL(href, location.href).pathname;
    if (seen[path]) return;
    seen[path] = true;
    pages.push({ title: a.textContent.trim(), href: a.href, path: path });
  });

  var currentPath = location.pathname;
  var idx = pages.findIndex(function (p) {
    return p.path === currentPath;
  });
  if (idx === -1) return;

  var prev = idx > 0 ? pages[idx - 1] : null;
  var next = idx < pages.length - 1 ? pages[idx + 1] : null;
  if (!prev && !next) return;

  function makeLink(entry, dir, label) {
    var a = document.createElement("a");
    a.href = entry.href;
    a.className = "hh-page-nav__link hh-page-nav__link--" + dir;

    var labelSpan = document.createElement("span");
    labelSpan.className = "hh-page-nav__label";
    labelSpan.textContent = label;

    var titleSpan = document.createElement("span");
    titleSpan.className = "hh-page-nav__title";
    titleSpan.textContent = entry.title;

    a.appendChild(labelSpan);
    a.appendChild(titleSpan);
    return a;
  }

  var nav = document.createElement("nav");
  // Not `md-grid` any more - that only capped/centred the row to the site's
  // general chrome width, which doesn't line up with the actual content
  // column once a sidebar is involved (see syncPageNavToContent above).
  // Left as a plain full-width row; the real alignment is the inline
  // padding that function sets after this nav is in the DOM.
  nav.className = "hh-page-nav";
  nav.appendChild(prev ? makeLink(prev, "prev", "‹ Previous") : document.createElement("span"));

  // "Happy Hare Ready" ASCII art sits between the two links, not in
  // .md-footer-meta__inner alongside copyright/social - it's part of THIS
  // row, so it belongs in the same element as the row it's centred in
  // rather than a second injection into a different flex container.
  var art = document.createElement("pre");
  art.className = "hh-footer-art";
  art.textContent = "  (\\_/)\n  ( *,*)\n  (\")_(\") Happy Hare Ready";
  nav.appendChild(art);

  nav.appendChild(next ? makeLink(next, "next", "Next ›") : document.createElement("span"));

  footer.insertBefore(nav, footer.firstChild);
  syncPageNavToContent();
  ensureBackToTopButton();
});
