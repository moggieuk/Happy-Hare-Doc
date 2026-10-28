/* Copyright (C) 2022-2026 Paul Morgan */
/* Cutter-after-extruder example from Macro-Toolhead-Tip-Cutting.md.
 * Heights are mm above the internal nozzle reference. Melt mixing is schematic.
 */
window.HHAnimations.register("tip-cutting-purge", {
  title: "Tip cutting and purging",
  secondsPerStage: 3.4,
  height: 460,
  legend: [["outgoing", "Outgoing filament / cut tip / residual"],
           ["incoming", "Incoming filament"]],
  stages: [
 ['Toolchange retract → park','park_toolchange: …, 2','Example parking retract: 2 mm; residual melt represented by 2 mm of filament.'],
 ['Macro retract out of the melt zone','retract_length: 42 · toolhead_residual_filament: 2','The tip reaches 42 mm above the nozzle reference; prior retraction is accounted for.'],
 ['Cut at the blade','blade_pos: 52 · cut_iterations: 1','52 − 42 = 10 mm of cut filament remains below the blade.'],
 ['Rip retract, then release the blade','rip_length: 2','Hold the blade pressed while retracting 2 mm, then release it; the cut fragment stays in place.'],
 ['Push the fragment into the hotend','pushback_length: 25','The first 2 mm close the rip gap; the fragment moves down to 19–29 mm.'],
 ['Return after pushback','pushback_dwell_time · pushback_length: 25','After any configured dwell, the upstream filament returns; the fragment stays in the hotend.'],
 ['Unload the outgoing filament','toolhead_extruder_to_nozzle: 72','The MMU withdraws the outgoing filament to the entry sensor. Cut filament and residual melt remain.'],
 ['MMU unloading filament','MMU toolchange','The outgoing filament travels quickly from the entry sensor through the Bowden to the MMU gears.'],
 ['MMU loading filament','MMU toolchange','The MMU advances the next filament quickly through the Bowden to the entry sensor.'],
 ['Advance to the extruder gears','toolhead_extruder_to_nozzle: 72','Slow down after the entry sensor and advance to the extruder gears.'],
 ['Home the incoming filament','toolhead_sensor_to_nozzle: 62','The next filament advances to the toolhead sensor, above the retained fragment.'],
 ['Complete the toolhead load','toolhead_residual_filament: 2 · toolhead_ooze_reduction: 0','Advance 62 − 10 − 2 − 2 = 48 mm from the sensor, bringing the 10 mm cut fragment against the retracted residual; the 2 mm toolchange retract is still preserved.'],
 ['Undo the 2 mm toolchange retract','park_toolchange: …, 2 · purge_macro: _MMU_PURGE','The simple purge macro advances the final 2 mm withheld during loading, advancing the touching fragment and residual together before purging.'],
 ['Purge residual filament and cut fragment','purge_macro: _MMU_PURGE · extruder_purge_speed','New filament pushes residual melt and the cut fragment through the nozzle.'],
 ['Flush the color transition','printer.mmu.toolchange_purge_volume','Suggested purge includes retained material plus the color purge and applicable material-change allowance.'],
 ['Purge the new filament','purge_material_change_volume · purge_change_min_volume','Continue extruding the new color after the retained material clears; the amount shown is illustrative.'],
 ['Toolchange retract after purge','park_toolchange: …, 2 · purge_macro: _MMU_PURGE','The simple purge macro restores the 2 mm toolchange retraction after purging.'],
 ['Purge waste drops away','Purge complete','Illustrative waste removal: the strand and collected purge fall clear of the nozzle.']
 ],
  // Each step may pause before and after its motion. Times are explanatory,
  // not printer dwell settings. Empty-path steps deliberately separate colors.
  stageTiming: [
    {seconds: 5.5, moveStart: 0.2, moveEnd: 0.65},
    {seconds: 4, moveStart: 0.15, moveEnd: 0.8},
    {seconds: 4, moveStart: 0.2, moveEnd: 0.8},
    {seconds: 5.5, moveStart: 0.2, moveEnd: 0.65},
    {seconds: 5, moveStart: 0.2, moveEnd: 0.75},
    {seconds: 5, moveStart: 0.25, moveEnd: 0.75},
    {seconds: 4, moveStart: 0.1, moveEnd: 0.8},
    {seconds: 3},
    {seconds: 4, moveStart: 0, moveEnd: 0.8},
    {seconds: 3, moveStart: 0.15, moveEnd: 0.85},
    {seconds: 4, moveStart: 0.2, moveEnd: 0.8},
    {seconds: 5, moveStart: 0.15, moveEnd: 0.75},
    {seconds: 5.5, moveStart: 0.2, moveEnd: 0.65},
    {seconds: 3.2, moveStart: 0.1, moveEnd: 0.95},
    {seconds: 4, moveStart: 0.05, moveEnd: 0.95},
    {seconds: 2.4, moveStart: 0.05, moveEnd: 0.85},
    {seconds: 3, moveStart: 0.2, moveEnd: 0.7},
    {seconds: 2, moveStart: 0.1, moveEnd: 0.8}
  ],
  render(svg, position, width, motion = {}) {
    // Keep the two mechanisms legible as one schematic on narrow screens.
    width = Math.max(700, width);
    const displayStage = Math.min(this.stages.length - 1, Math.floor(position));
    const slowEntry = displayStage === 9;
    const stage = displayStage >= 10 ? displayStage - 1 : displayStage;
    // Preserve mechanism step numbers across the two MMU travel holds.
    const i = slowEntry ? 6 : stage < 7 ? stage : stage < 9 ? 6 : stage - 2;
    const waiting = stage === 7 || stage === 8 || slowEntry;
    const phase = position - displayStage;
    const t = waiting ? 1 : phase;
    const interpolate = (a, b, fraction) => a + (b - a) * fraction;
    const y = height => 350 - height * 2.8;
    const x = width * 0.42;
    let end = 2, fragmentTop = 52, fragmentBottom = 42;
    let fragment = false, incoming = false, residual = 2, blade = 0;
    if (i === 0) end = interpolate(2, 4, t);
    if (i === 1) end = interpolate(4, 42, t);
    if (i === 2) {
      end = t < 0.5 ? 42 : 52;
      fragment = t >= 0.5;
      blade = Math.min(1, t * 2);
    }
    if (i === 3) {
      const rip = Math.min(1, t / 0.65);
      end = interpolate(52, 54, rip);
      fragment = true;
      blade = t <= 0.75 ? 1 : Math.max(0, 1 - (t - 0.75) / 0.25);
    }
    if (i === 4) {
      end = interpolate(54, 29, t);
      fragment = true;
      const shift = Math.max(0, 25 * t - 2);
      fragmentTop = 52 - shift;
      fragmentBottom = 42 - shift;
    }
    if (i >= 5) { fragment = true; fragmentTop = 29; fragmentBottom = 19; end = 54; }
    if (i === 5) end = interpolate(29, 54, t);
    if (i === 6) end = interpolate(54, 80, t);
    // Treat the schematic Bowden as 240 mm of travel beyond the body top.
    // One continuous distance carries each end across the entry and gear stops.
    if (stage === 7) end = 80 + 250 * phase;
    if (stage === 8) { incoming = true; end = 330 - 250 * phase; }
    if (slowEntry) { incoming = true; end = 80 - 8 * phase; }
    if (i === 7) { incoming = true; end = interpolate(72, 62, t); }
    if (i === 8) {
      incoming = true;
      end = interpolate(62, 14, t);
      const shift = Math.max(0, 29 - end);
      fragmentTop = 29 - shift;
      fragmentBottom = 19 - shift;
    }
    if (i === 9) { incoming = true; end = interpolate(14, 12, t); fragmentTop = end; fragmentBottom = end - 10; }
    if (i >= 10) {
      incoming = true;
      const advance = i === 10 ? t * 12 : 12;
      end = Math.max(0, 12 - advance);
      fragmentTop = Math.max(0, 12 - advance);
      fragmentBottom = Math.max(0, 2 - advance);
      residual = Math.max(0, 2 - advance);
      fragment = fragmentTop > 0;
    }
    const rect = (xx, yy, w, h, fill, extra = '') =>
      `<rect x="${xx}" y="${yy}" width="${w}" height="${Math.max(0, h)}" fill="${fill}" ${extra}/>`;
    const label = (xx, yy, text, extra = '') =>
      `<text class="hh-animation-label" x="${xx}" y="${yy}" ${extra}>${text}</text>`;
    this.nextScene = this.nextScene || 0;
    if (!svg.dataset.sceneId) svg.dataset.sceneId = `hh-cut-scene-${++this.nextScene}`;
    const boreClip = svg.dataset.sceneId + '-bore';
    const wasteClip = svg.dataset.sceneId + '-waste';
    let s = `<defs><clipPath id="${boreClip}"><path d="M${x - 5},${y(90)} H${x + 5} V339 L${x + 1.5},354 V357 H${x - 1.5} V354 L${x - 5},339 Z"/></clipPath><clipPath id="${wasteClip}"><rect x="0" y="357" width="${width}" height="67"/></clipPath></defs>`;
    s += `<title>Tip cutting and purging: ${this.stages[displayStage][0]}</title>`;
    // A continuous Bowden centerline runs from the toolhead to the MMU.
    // Normalized dash lengths expose a single moving filament end, so the
    // color never changes until the old filament has reached the MMU.
    const mmuX = x + Math.min(230, width * 0.30);
    const mmuY = y(22) + 56 - 60;
    const crownX = (x + mmuX) / 2;
    const bowden = `M${x},${y(90)} C${x},44 ${crownX - 60},30 ${crownX},30 C${mmuX - 35},30 ${mmuX},95 ${mmuX},170 V${mmuY}`;
    s += rect(mmuX - 78, mmuY - 65, 156, 125, 'var(--hh-surface)', 'class="hh-animation-structure" rx="8"');
    s += label(mmuX - 60, mmuY - 40, 'MMU');
    s += `<path data-part="bowden" d="${bowden}" fill="none" stroke="var(--hh-border)" stroke-width="16"/>`;
    s += `<path d="${bowden}" fill="none" stroke="var(--hh-surface)" stroke-width="13"/>`;
    const bowdenStart = waiting ? Math.max(0, Math.min(1, (end - 90) / 240)) : 0;
    const bowdenColor = stage >= 8 ? 'var(--hh-incoming)' : 'var(--hh-outgoing)';
    s += `<path data-part="bowden-filament" data-start="${bowdenStart}" d="${bowden}" fill="none" stroke="${bowdenColor}" stroke-width="10" pathLength="1000" stroke-dasharray="${(1 - bowdenStart) * 1000} 1000" stroke-dashoffset="${-bowdenStart * 1000}"/>`;
    const tailGradient = svg.dataset.sceneId + '-mmu-tail';
    s += `<defs><linearGradient id="${tailGradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bowdenColor}"/><stop offset="0.2" stop-color="${bowdenColor}"/><stop offset="1" stop-color="${bowdenColor}" stop-opacity="0"/></linearGradient></defs>`;
    s += rect(mmuX - 5, mmuY, 10, 24, `url(#${tailGradient})`, 'data-part="mmu-filament-tail"');
    s += label(mmuX, mmuY + 39, 'Gear stepper', 'text-anchor="middle"');
    s += rect(x - 12, y(90), 24, y(3) - y(90), 'var(--hh-surface)', 'class="hh-animation-structure"');
    s += rect(x - 37, y(22), 74, 56, 'var(--hh-surface)', 'class="hh-animation-structure" rx="5"');
    const references = [
      [80, ['Entry sensor · 80'], width < 440 ? -17 : -7],
      [72, ['Extruder gears · 72'], width < 440 ? -22 : -6],
      [62, ['Toolhead sensor · 62'], width < 440 ? -2 : -7],
      [52, ['Blade position · 52'], -7],
      [0, ['Nozzle reference · 0'], 20]
    ];
    for (const [height, lines, offset] of references) {
      const guideY = y(height) - (width < 440 && height === 80 ? 13 : 0);
      s += `<line class="hh-animation-line" x1="8" x2="${x - 42}" y1="${guideY}" y2="${guideY}"/>`;
      lines.forEach((text, line) => { s += label(8, y(height) + offset + line * 14, text); });
    }
    // Accumulated downward travel, independent of the cut-end coordinate.
    // Extruder gears run throughout toolhead unloading, even after the end
    // clears them, then hold until the incoming filament reaches the gears.
    let travel = 0;
    if (i === 0) travel = -2 * t;
    if (i === 1) travel = -2 - 38 * t;
    if (i === 2) travel = -40;
    if (i === 3) travel = -40 - 2 * Math.min(1, t / 0.65);
    if (i === 4) travel = -42 + 25 * t;
    if (i === 5) travel = -17 - 25 * t;
    if (i === 6) travel = stage === 6 ? -42 - 26 * t : -68;
    if (i === 7) travel = -60 + Math.max(0, 72 - end);
    if (i === 8) travel = -50 + 48 * t;
    if (i === 9) travel = -2 + 2 * t;
    if (i === 10) travel = 12 * t;
    if (i === 11) travel = 12 + 30 * t;
    if (i === 12) travel = 42 + 18 * t;
    if (i === 13) travel = 60 - 2 * t;
    if (i === 14) travel = 58;
    // Preserve the extra unloading rotation through all subsequent steps.
    if (i >= 7) travel -= 8;
    // MMU travel is continuous across the toolhead/Bowden handoff. The
    // long Bowden traverse turns these gears faster than toolhead homing.
    let mmuTravel = i >= 7 ? travel + 8 : travel;
    if (stage === 6) mmuTravel = -42 - 26 * t;
    if (stage === 7) mmuTravel = -68 - 250 * phase;
    if (stage === 8) mmuTravel = -318 + 250 * phase;
    if (stage === 9) mmuTravel = -60 + 72 - end;
    if (slowEntry) mmuTravel = -68 + 8 * phase;
    for (const direction of [-1, 1]) {
      const center = mmuX + direction * 20;
      // Feed direction is upward at the MMU and downward at the toolhead.
      const angle = direction * mmuTravel * 2.8 / 15;
      s += `<g data-part="mmu-gear" data-angle="${angle}" transform="translate(${center} ${mmuY}) rotate(${angle * 180 / Math.PI})"><circle class="hh-animation-structure" r="15"/><path d="M-11,0 H11 M0,-11 V11" stroke="var(--hh-text)"/><circle r="3" fill="var(--hh-metal)"/></g>`;
    }
    // Retain the last drive mode through stationary holds and blade actions.
    // Derive it from sequence position so scrubbing and reverse steps agree:
    // MMU-only travel disengages sync; toolhead homing engages it again.
    const synced = displayStage < 7 || displayStage >= 10;
    if (synced) {
      const syncX = mmuX + 49;
      const syncY = mmuY - 47;
      s += `<g data-part="synced" aria-label="Extruder and MMU gears synced"><g transform="translate(${syncX} ${syncY}) rotate(-35)" fill="none" stroke="var(--hh-incoming)" stroke-width="2.2" stroke-linecap="round"><rect x="-12" y="-5" width="15" height="10" rx="5"/><rect x="-3" y="-5" width="15" height="10" rx="5"/></g>`;
      s += label(syncX, syncY + 21, 'Synced', 'text-anchor="middle"');
      s += '</g>';
    }
    // Radius 15, centers at +/-20: inner edges touch the 10px filament.
    for (const direction of [-1, 1]) {
      const center = x + direction * 20;
      s += `<circle class="hh-animation-structure" cx="${center}" cy="${y(72)}" r="15"/>`;
      const angle = -direction * travel * 2.8 / 15;
      s += `<g data-part="gear-spoke" data-angle="${angle}" transform="translate(${center} ${y(72)}) rotate(${angle * 180 / Math.PI})"><path d="M-11,0 H11 M0,-11 V11" stroke="var(--hh-text)"/><circle r="3" fill="var(--hh-metal)"/></g>`;
    }
    s += `<path class="hh-animation-structure" d="M${x - 15},${y(3)} L${x + 15},${y(3)} L${x + 4},354 V359 H${x - 4} V354 Z"/>`;
    // Visual seams distinguish separate pieces without changing the example's
    // physical lengths. The enlarged residual stays fixed during the first pull.
    const closing = i === 10 ? Math.min(1, t / 0.15) : i > 10 ? 1 : 0;
    const seam = 1;
    const gap = seam * (1 - closing);
    const residualHeight = 18 * residual / 2;
    // Toolchange retraction shifts the entire retained melt upward. Loading
    // brings the fragment to it; the unretract advances both together.
    const residualLift = i < 9 ? 5.6 : i === 9 ? 5.6 * (1 - t) : 0;
    const residualTop = y(0) - residualHeight - residualLift;
    // Make space for the visually enlarged residual by translating the whole
    // fragment and its pushing filament, never clipping the fragment shorter.
    const clearance = 18 - 2 * 2.8 + seam;
    const loadOffset = i === 8 ? clearance * Math.min(1, Math.max(0, (19 - fragmentBottom) / 15))
      : i === 9 ? clearance : i === 10 ? clearance * (1 - t) : 0;
    const fragmentVisualTop = y(fragmentTop) - loadOffset;
    const fragmentVisualBottom = y(fragmentBottom) - loadOffset;
    let feedBottom = y(end) - loadOffset;
    if (i === 0) feedBottom = 357 - 5.6 * t;
    if (i === 1) feedBottom = interpolate(351.4, y(42), t);
    if (i === 13) feedBottom = 357 - 5.6 * t;
    if (i === 14) feedBottom = 351.4;
    if (fragment) feedBottom = Math.min(feedBottom, fragmentVisualTop - gap);
    if (i > 1 && residual > 0) feedBottom = Math.min(feedBottom, residualTop - gap);
    // Sensor state follows actual filament geometry, including the endpoint
    // that stops on a sensor. Pulses use elapsed stage time, independently of
    // the held mechanism geometry, and finish within the post-motion hold.
    for (const height of [80, 62]) {
      const reverseHomeOff = height === 80 && ((displayStage === 6 && phase >= 0.99999) || displayStage === 7);
      const present = !reverseHomeOff && feedBottom >= y(height) - 0.001;
      const pulseStage = height === 80 ? [6, 8].includes(displayStage) : displayStage === 10;
      const elapsed = motion.stageProgress ?? phase;
      const pulse = pulseStage && elapsed >= 0.8 ? Math.min(1, (elapsed - 0.8) / 0.16) : 1;
      s += rect(x + 14, y(height) - 4, 10, 8,
        present ? 'var(--hh-sensor-active)' : 'var(--hh-surface)',
        `data-part="sensor" data-height="${height}" data-triggered="${present}" rx="2" stroke="${present ? 'var(--hh-sensor-active)' : 'var(--hh-metal)'}" stroke-width="1.5"`);
      if ((present || reverseHomeOff) && pulse < 1) {
        s += `<circle data-part="sensor-pulse" cx="${x + 19}" cy="${y(height)}" r="${7 + 10 * pulse}" fill="none" stroke="var(--hh-sensor-active)" stroke-width="2" opacity="${1 - pulse}"/>`;
      }
    }
    s += `<g clip-path="url(#${boreClip})">`;
    // As extrusion begins, seams close and the retained material forms a
    // continuous column through the nozzle. Color blending starts afterward.
    if (i >= 10 && i <= 12) {
      // Close the seams by extending opaque geometry, never by fading a
      // bridge over the empty space. Preserve the two shrinking gaps until shut.
      const meltStart = fragment ? fragmentVisualTop : feedBottom;
      const meltEnd = residual > 0 ? residualTop - gap : 357;
      s += rect(x - 5, meltStart, 10, meltEnd - meltStart, 'var(--hh-outgoing)', 'data-part="melt-bridge"');
      if (i > 10) {
        const blend = i === 11 ? t * t * (3 - 2 * t) : 1;
        s += rect(x - 5, 350, 10, 7, 'var(--hh-incoming)', `opacity="${blend}"`);
      }
    }
    if (end < 90) s += rect(x - 5, y(90), 10, feedBottom - y(90), incoming ? 'var(--hh-incoming)' : 'var(--hh-outgoing)', 'data-part="feed"');
    if (fragment) {
      const bottom = i >= 10 && residual > 0 ? Math.min(fragmentVisualBottom, residualTop - gap) : fragmentVisualBottom;
      s += rect(x - 5, fragmentVisualTop, 10, bottom - fragmentVisualTop, 'var(--hh-cut)', 'data-part="fragment"');
    }
    // Height is enlarged for visibility; width matches every other filament.
    if (residual > 0 && i > 0) {
      // During extrusion the old material exits through the nozzle; its lower
      // edge must stay at the outlet rather than retract as its amount shrinks.
      const visibleResidualHeight = i >= 10 ? 357 - residualTop : residualHeight + 7 * residual / 2;
      s += rect(x - 5, residualTop, 10, visibleResidualHeight, 'var(--hh-residual)', 'data-part="residual"');
    }
    s += '</g>';
    if (residual > 0 && (i > 1 || (i === 1 && feedBottom < residualTop - seam))) {
      s += label(x - 57, 321, 'Residual', 'text-anchor="end" dominant-baseline="middle"');
      s += `<path data-part="residual-pointer" d="M${x - 53},321 H${x - 42} L${x - 7},${residualTop + residualHeight / 2}" fill="none" stroke="var(--hh-text)"/>`;
    }
    const bladeX = x + 15 - 28 * blade;
    s += `<path data-part="blade" data-pressed="${blade}" d="M${bladeX},${y(52)} l42,-5 v10 Z" fill="var(--hh-metal)"/>`;
    if (i >= 3 && i <= 9) {
      const middle = y((fragmentTop + fragmentBottom) / 2) - loadOffset;
      s += `<path d="M${x + 10},${middle} h27" stroke="var(--hh-text)"/>`;
      s += label(x + 45, middle + 4, 'Cut tip 10mm');
    }
    const direction = [0, 1, 3, 5, 6, 13].includes(i) ? -1 : [4, 7, 8, 9, 10, 11, 12].includes(i) ? 1 : 0;
    if (motion.moving && direction && !waiting && !(i === 3 && t >= 0.65)) {
      const arrowX = x + 90;
      const start = direction < 0 ? 129 : 90;
      const finish = direction < 0 ? 90 : 129;
      s += `<g data-part="motion-arrow" fill="none" stroke="var(--hh-text)" stroke-width="2.5"><path d="M${arrowX},${start} V${finish} m-5,${-direction * 7} l5,${direction * 7} l5,${-direction * 7}"/></g>`;
      const twoLineLabel = i === 4 ? ['Pushback', 'extrude']
        : i === 9 ? ['Undo', 'retract']
        : i >= 10 && i <= 12 ? ['Purge', 'extrude']
        : i === 1 ? ['Macro', 'retract']
        : i === 0 || i === 13 ? ['Toolchange', 'retract'] : null;
      if (twoLineLabel) {
        s += label(arrowX, y(72) - 7, twoLineLabel[0], 'text-anchor="middle" dominant-baseline="middle"');
        s += label(arrowX, y(72) + 7, twoLineLabel[1], 'text-anchor="middle" dominant-baseline="middle"');
      } else s += label(arrowX, y(72), i === 3 ? 'Rip retract' : direction < 0 ? 'Retract' : 'Extrude', 'text-anchor="middle" dominant-baseline="middle"');
    }
    if (i === 6 || stage === 8 || i === 7) {
      s += label(8, 45, stage === 8 || slowEntry || i === 7 ? 'MMU loading filament' : 'MMU unloading filament');
      if (waiting) {
        s += label(8, 62, stage === 7 ? 'Entry sensor → MMU gears' : slowEntry ? 'Entry sensor → extruder gears' : 'MMU gears → entry sensor');
        s += label(8, 76, 'Retained tip stays below.');
      }
    }
    if (i >= 10) {
      // Deposited material keeps its color: old material collects at the
      // bottom, blended material follows, and new material lands on top.
      const smooth = value => { const v = Math.max(0, Math.min(1, value)); return v * v * (3 - 2 * v); };
      const amount = i === 10 ? t * 0.35 : i === 11 ? 0.35 + t * 0.4 : i === 12 ? 0.75 + t * 0.25 : 1;
      const drop = i === 14 ? 110 * t * t : 0;
      s += `<g clip-path="url(#${wasteClip})"><g data-part="purge-waste" transform="translate(0 ${drop})">`;
      const blendAt = deposited => smooth((deposited - 0.35) / 0.4);
      const mix = fraction => `color-mix(in srgb, var(--hh-incoming) ${fraction * 100}%, var(--hh-outgoing))`;
      const layers = Math.max(0, (amount - 0.04) / 0.96 * 12);
      for (let layer = 0; layer < Math.ceil(layers); layer++) {
        const fraction = Math.min(1, layers - layer);
        const height = 418 - layer * 3.2;
        const radius = 23 - layer * 1.75;
        const blend = blendAt(0.04 + layer / 12 * 0.96);
        const coil = `M${x},${height} C${x - radius},${height - 5} ${x - radius},${height + 5} ${x},${height + 2} S${x + radius * 1.6},${height - 3} ${x},${height - 3}`;
        const reveal = `fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="${fraction * 100} 100"`;
        // A shaded lower edge and narrow upper highlight round each deposited
        // strand without changing its material color or deposition timing.
        s += `<path d="${coil}" ${reveal} stroke="color-mix(in srgb, ${mix(blend)}, black 28%)" stroke-width="5.8" transform="translate(0 0.5)"/>`;
        s += `<path data-part="purge-layer" data-blend="${blend}" d="${coil}" ${reveal} stroke="${mix(blend)}" stroke-width="4.6"/>`;
        s += `<path d="${coil}" ${reveal} stroke="color-mix(in srgb, ${mix(blend)}, white 38%)" stroke-width="1.1" transform="translate(0 -1.2)"/>`;
      }
      const landing = 418 - Math.max(0, layers - 1) * 3.2;
      const falling = Math.min(1, amount / 0.04);
      const tip = 357 + (landing - 357) * falling;
      // Keep the outlet straight. A short curve with sideways control points
      // folds across itself when extrusion starts, making a false wide blob.
      const stemEnd = Math.min(tip, 365);
      const strand = `M${x},357 V${stemEnd}` + (tip > stemEnd
        ? ` C${x - 3},${stemEnd + (tip - stemEnd) / 3} ${x + 4},${stemEnd + (tip - stemEnd) * 2 / 3} ${x},${tip}` : '');
      s += `<path data-part="purge-stream" data-blend="${blendAt(amount)}" d="${strand}" fill="none" stroke="${mix(blendAt(amount))}" stroke-width="3"/>`;
      s += '</g></g>';
      s += label(8, 448, i === 10 ? 'Residual filament exits' : i === 11 ? 'Old → new color' : i === 12 ? 'New color collects on top' : i === 13 ? 'Toolchange retract after purge' : 'Purge complete');
    }
    svg.innerHTML = s;
    svg.setAttribute('viewBox', `0 0 ${width} 460`);
  }
});
