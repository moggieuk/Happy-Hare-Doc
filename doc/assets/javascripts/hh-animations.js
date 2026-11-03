/* Copyright (C) 2022-2026 Paul Morgan */
// cspell:ignore valuetext noopener noreferrer
/* Shared, dependency-free player for documentation animations. */
(function () {
  "use strict";
  const logoUrl = new URL("../images/favicon.png", document.currentScript.src).href;
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
        <a class="hh-animation-brand" href="https://github.com/moggieuk/Happy-Hare" target="_blank" rel="noopener noreferrer" aria-label="Happy Hare on GitHub" title="Happy Hare on GitHub"><img class="no-floating" src="${logoUrl}" alt="" width="32" height="32"></a>
      </div>
      <h4 class="hh-animation-stage" aria-live="polite"></h4>
      <svg role="img" class="hh-animation-diagram"></svg>
      <div class="hh-animation-legend"></div>
      <div class="hh-animation-parameters" aria-live="polite"><code></code></div>
      <div class="hh-animation-detail"></div>
      <input id="${id}" type="range" aria-label="Sequence position" min="0" step="0.001" value="0">
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
    if (scene.caption) find(".hh-animation-caption").textContent = scene.caption;
    else find(".hh-animation-caption").remove();
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
      const timing = (scene.stageTiming || [])[index] || {};
      const start = timing.moveStart ?? 0;
      const finish = timing.moveEnd ?? 1;
      const fraction = position - index;
      const progress = Math.max(0, Math.min(0.999999, (fraction - start) / (finish - start)));
      scene.render(svg, index + (reducedMotion.matches ? 0.999999 : progress), svg.clientWidth || 320, {
        moving: !reducedMotion.matches && fraction >= start && fraction < finish,
        stageProgress: reducedMotion.matches ? 1 : fraction
      });
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
      if (lastTime !== null) {
        let remaining = Math.min(100, now - lastTime) / 1000;
        while (remaining > 0 && position < end) {
          const index = Math.floor(position);
          const timing = (scene.stageTiming || [])[index] || {};
          const seconds = timing.seconds ?? scene.secondsPerStage;
          const boundary = Math.min(index + 1, end);
          const consumed = Math.min(remaining, (boundary - position) * seconds);
          position = Math.min(boundary, position + consumed / seconds);
          remaining -= consumed;
        }
      }
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
