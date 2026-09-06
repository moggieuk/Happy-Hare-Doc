// Resize standalone interactive pinout documents to their reported height.
//
// The embedded document sends { pinconnectHeight: number } whenever its
// responsive layout changes. A value of 0 means it is using its side-by-side,
// viewport-height layout, for which the stylesheet's default height is right.
// This listener is registered once and discovers the current iframe from the
// message source, so it also works after Zensical instant-navigation swaps.
(function () {
  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;

    var data = event.data;
    if (
      !data ||
      typeof data !== "object" ||
      typeof data.pinconnectHeight !== "number" ||
      !Number.isFinite(data.pinconnectHeight)
    ) {
      return;
    }

    var frames = document.querySelectorAll("iframe.hh-pinout-embed");
    for (var i = 0; i < frames.length; i += 1) {
      if (frames[i].contentWindow !== event.source) continue;

      if (data.pinconnectHeight > 0) {
        frames[i].style.height = Math.ceil(data.pinconnectHeight) + "px";
      } else {
        frames[i].style.height = "";
      }
      break;
    }
  });
})();
