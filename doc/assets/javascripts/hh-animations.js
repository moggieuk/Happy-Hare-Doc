// cspell:ignore valuetext
/* Shared, dependency-free player for documentation animations. */
(function () {
  "use strict";
  const scenes = new Map();
  const players = new Map();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let nextId = 0;

  function mount(root, scene) {
    const id = "hh-animation-" + (++nextId);
    root.classList.add("hh-animation");
    root.innerHTML = `
      <div class="hh-animation-controls">
        <button type="button" data-action="play">Play sequence</button>
        <button type="button" data-action="previous">Previous</button>
        <button type="button" data-action="next">Next</button>
      </div>
      <h4 class="hh-animation-stage" aria-live="polite"></h4>
      <svg role="img" class="hh-animation-diagram"></svg>
      <div class="hh-animation-legend"></div>
      <div class="hh-animation-parameters" aria-live="polite"><code></code></div>
      <div class="hh-animation-detail"></div>
      <label for="${id}">Sequence position</label>
      <input id="${id}" type="range" min="0" step="0.001" value="0">
      <p class="hh-animation-caption"></p>`;
    const find = selector => root.querySelector(selector);
    const play = find('[data-action="play"]');
    const previous = find('[data-action="previous"]');
    const next = find('[data-action="next"]');
    const svg = find("svg");
    const slider = find("input");
    const stage = find(".hh-animation-stage");
    const parameters = find("code");
    const detail = find(".hh-animation-detail");
    const end = scene.stages.length - 0.001;
    slider.max = end;
    svg.style.height = scene.height + "px";
    svg.setAttribute("aria-label", scene.title);
    find(".hh-animation-caption").textContent = scene.caption;
    for (const [kind, label] of scene.legend || []) {
      const item = document.createElement("span");
      const swatch = document.createElement("b");
      swatch.className = "hh-animation-swatch hh-animation-" + kind;
      swatch.textContent = "━";
      swatch.setAttribute("aria-hidden", "true");
      item.append(swatch, " " + label);
      find(".hh-animation-legend").append(item);
    }
    let position = 0, playing = false, lastTime = null, frameId = null;
    let lastStage = -1, highlight = null;

    function draw() {
      const index = Math.floor(position);
      if (lastStage !== index) {
        stage.textContent = `${index + 1} / ${scene.stages.length} · ${scene.stages[index][0]}`;
        parameters.textContent = scene.stages[index][1];
        detail.textContent = scene.stages[index][2];
        slider.setAttribute("aria-valuetext", stage.textContent);
        if (lastStage >= 0 && !reducedMotion.matches) {
          if (highlight) highlight.cancel();
          highlight = parameters.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 650 });
        }
        lastStage = index;
      }
      scene.render(svg, reducedMotion.matches ? index + 0.999 : position, svg.clientWidth || 320);
      slider.value = position;
      previous.disabled = position === 0;
      next.disabled = position >= scene.stages.length - 1;
    }
    function pause() {
      playing = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      lastTime = null;
      play.textContent = position >= end ? "Replay sequence" : "Play sequence";
    }
    function tick(now) {
      if (!root.isConnected || document.hidden) { pause(); return; }
      if (lastTime !== null) position = Math.min(end, position + Math.min(100, now - lastTime) / (scene.secondsPerStage * 1000));
      lastTime = now;
      draw();
      if (position >= end) pause();
      if (playing) frameId = requestAnimationFrame(tick);
    }
    play.addEventListener("click", () => {
      if (playing) { pause(); return; }
      if (position >= end) position = 0;
      playing = true;
      play.textContent = "Pause";
      frameId = requestAnimationFrame(tick);
    });
    previous.addEventListener("click", () => { pause(); position = Math.max(0, Math.floor(position) - 1); draw(); });
    next.addEventListener("click", () => { pause(); position = Math.min(end, Math.floor(position) + 1); draw(); });
    slider.addEventListener("input", () => { pause(); position = Number(slider.value); draw(); });
    const observer = new ResizeObserver(draw);
    observer.observe(svg);
    players.set(root, { pause, destroy() { pause(); observer.disconnect(); if (highlight) highlight.cancel(); } });
    draw();
  }
  function refresh() {
    for (const [root, player] of players) {
      if (!root.isConnected) { player.destroy(); players.delete(root); }
    }
    document.querySelectorAll("[data-hh-animation]").forEach(root => {
      const scene = scenes.get(root.dataset.hhAnimation);
      if (scene && !players.has(root)) mount(root, scene);
    });
  }
  window.HHAnimations = {
    register(name, scene) { scenes.set(name, scene); refresh(); }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) players.forEach(player => player.pause());
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh);
  else refresh();
  if (typeof document$ !== "undefined") document$.subscribe(refresh);
})();
