/* Copyright (C) 2022-2026 Paul Morgan */
/* Cutter-after-extruder example from Macro-Toolhead-Tip-Cutting.md.
 * Heights are mm above the internal nozzle reference. Melt mixing is schematic.
 */
window.HHTipCuttingScene = {
  title: "Tip cutting and purging",
  secondsPerStage: 3.4,
  height: 460,
  legend: [["outgoing", "Outgoing filament / cut tip / residual"],
           ["incoming", "Incoming filament"]],
  stages: [
 ['Toolchange retract → park','park_toolchange: …, 2','Example parking retract: 2 mm; residual melt represented by 3 mm of filament.'],
 ['Macro retract out of the melt zone','retract_length: 42 · toolhead_residual_filament: 3','The tip reaches 42 mm above the nozzle reference; prior retraction is accounted for.'],
 ['Cut at the blade','blade_pos: 52 · cut_iterations: 1','52 − 42 = 10 mm of cut filament remains below the blade.'],
 ['Rip retract, then release the blade','rip_length: 2','Hold the blade pressed while retracting 2 mm, then release it; the cut fragment stays in place.'],
 ['Push the fragment into the hotend','pushback_length: 25','The first 2 mm close the rip gap; the fragment moves down to 19–29 mm.'],
 ['Return after pushback','pushback_dwell_time · pushback_length: 25','After any configured dwell, the upstream filament returns; the fragment stays in the hotend.'],
 ['Unload the outgoing filament','toolhead_extruder_to_nozzle: 72','The MMU withdraws the outgoing filament to the entry sensor. Cut filament and residual melt remain.'],
 ['MMU unloading filament','MMU toolchange','The outgoing filament travels quickly from the entry sensor through the Bowden to the MMU gears.'],
 ['MMU loading filament','MMU toolchange','The MMU advances the next filament quickly through the Bowden to the entry sensor.'],
 ['Advance to the extruder gears','toolhead_extruder_to_nozzle: 72','Slow down after the entry sensor and advance to the extruder gears.'],
 ['Home the incoming filament','toolhead_sensor_to_nozzle: 62','The next filament advances to the toolhead sensor, above the retained fragment.'],
 ['Complete the toolhead load','toolhead_residual_filament: 3 · toolhead_ooze_reduction: 0','Advance 62 − 10 − 3 − 2 = 47 mm from the sensor, bringing the 10 mm cut fragment against the retracted residual; the 2 mm toolchange retract is still preserved.'],
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
    // Keep the Bowden empty for one second before loading the next filament.
    {seconds: 4, moveStart: 0, moveEnd: 0.75},
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
    const rawStage = Math.min(this.stages.length - 1, Math.floor(position));
    const before = !!this.beforeExtruder;
    const tension = before && rawStage === 2;
    const displayStage = before && rawStage >= 3 ? rawStage - 1 : rawStage;
    const slowEntry = displayStage === 9;
    const stage = displayStage >= 10 ? displayStage - 1 : displayStage;
    // Preserve mechanism step numbers across the two MMU travel holds.
    const i = slowEntry ? 6 : stage < 7 ? stage : stage < 9 ? 6 : stage - 2;
    const waiting = stage === 7 || stage === 8 || slowEntry;
    const phase = position - rawStage;
    const t = waiting ? 1 : phase;
    const interpolate = (a, b, fraction) => a + (b - a) * fraction;
    const y = height => 350 - height * 2.8;
    const x = width * 0.42;
    let end = 2, fragmentTop = 52, fragmentBottom = 42;
    let fragment = false, incoming = false, residual = 3, blade = 0;
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
      end = interpolate(62, 15, t);
      const shift = Math.max(0, 29 - end);
      fragmentTop = 29 - shift;
      fragmentBottom = 19 - shift;
    }
    if (i === 9) { incoming = true; end = interpolate(15, 13, t); fragmentTop = end; fragmentBottom = end - 10; }
    if (i >= 10) {
      incoming = true;
      const advance = i === 10 ? t * 13 : 13;
      end = Math.max(0, 13 - advance);
      fragmentTop = Math.max(0, 13 - advance);
      fragmentBottom = Math.max(0, 3 - advance);
      residual = Math.max(0, 3 - advance);
      fragment = fragmentTop > 0;
    }
    if (this.formedUnload) {
      fragment = false;
      if (i === 6 && stage === 6) end = interpolate(this.formedPark, 80, t);
      if (i === 8) end = interpolate(62, 5, t);
      if (i === 9) end = interpolate(5, 3, t);
      if (i >= 10) {
        const advance = i === 10 ? 3 * t : 3;
        end = Math.max(0, 3 - advance);
        residual = Math.max(0, 3 - advance);
      }
    }
    if (before) {
      if (i === 1) end = interpolate(4, 51, t);
      if (i === 2) {
        end = tension || t < 0.5 ? 51 : 85;
        fragment = !tension && t >= 0.5;
        fragmentTop = 85; fragmentBottom = 51;
        blade = tension ? 0 : Math.min(1, t * 2);
      }
      if (i === 3) {
        end = 85;
        const rip = Math.min(1, t / 0.65);
        fragmentTop = 85 - rip; fragmentBottom = 51 - rip;
      }
      if (i === 4) {
        end = 85 - 35 * t;
        const shift = Math.max(1, 35 * t);
        fragmentTop = 85 - shift; fragmentBottom = 51 - shift;
      }
      if (i === 5 || i === 6) {
        fragmentTop = 50; fragmentBottom = 16;
        end = i === 5 ? interpolate(50, 85, t) : 85;
        if (stage === 7) end = 85 + 245 * phase;
        if (stage === 8) { incoming = true; end = 330 - 250 * phase; }
        if (slowEntry) { incoming = true; end = 80 - 8 * phase; }
      }
      if (i === 7) { fragmentTop = 50; fragmentBottom = 16; }
      if (i === 8) {
        end = interpolate(62, 39, t);
        const shift = Math.max(0, 50 - end);
        fragmentTop = 50 - shift; fragmentBottom = 16 - shift;
      }
      if (i === 9) {
        end = interpolate(39, 37, t);
        fragmentTop = end; fragmentBottom = end - 34;
      }
      if (i >= 10) {
        const advance = i === 10 ? t * 37 : 37;
        end = Math.max(0, 37 - advance);
        fragmentTop = end; fragmentBottom = Math.max(0, 3 - advance);
        residual = Math.max(0, 3 - advance); fragment = end > 0;
      }
    }
    const rect = (xx, yy, w, h, fill, extra = '') =>
      `<rect x="${xx}" y="${yy}" width="${w}" height="${Math.max(0, h)}" fill="${fill}" ${extra}/>`;
    const label = (xx, yy, text, extra = '') =>
      `<text class="hh-animation-label" x="${xx}" y="${yy}" ${extra}>${text}</text>`;
    const sharedScene = window.HHTipCuttingScene;
    sharedScene.nextScene = sharedScene.nextScene || 0;
    if (!svg.dataset.sceneId) svg.dataset.sceneId = `hh-cut-scene-${++sharedScene.nextScene}`;
    const boreClip = svg.dataset.sceneId + '-bore';
    const wasteClip = svg.dataset.sceneId + '-waste';
    let s = `<defs><clipPath id="${boreClip}"><path d="M${x - 5},${y(90)} H${x + 5} V339 L${x + 1.5},354 V357 H${x - 1.5} V354 L${x - 5},339 Z"/></clipPath><clipPath id="${wasteClip}"><rect x="0" y="357" width="${width}" height="67"/></clipPath></defs>`;
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
    if (tension) {
      const tensionMarker = svg.dataset.sceneId + '-tension-arrow';
      s += `<defs><marker id="${tensionMarker}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1,1 L8,5 L1,9" fill="none" stroke="var(--hh-text)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;
      s += `<path data-part="tension-arrow" d="M${x + 22},95 C${x + 22},65 ${crownX - 45},50 ${crownX},50 C${mmuX - 55},50 ${mmuX - 22},90 ${mmuX - 22},135" fill="none" stroke="var(--hh-text)" stroke-width="2" stroke-dasharray="5 4" marker-start="url(#${tensionMarker})" marker-end="url(#${tensionMarker})"/>`;
    }
    const tailGradient = svg.dataset.sceneId + '-mmu-tail';
    s += `<defs><linearGradient id="${tailGradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bowdenColor}"/><stop offset="0.2" stop-color="${bowdenColor}"/><stop offset="1" stop-color="${bowdenColor}" stop-opacity="0"/></linearGradient></defs>`;
    s += rect(mmuX - 5, mmuY, 10, 24, `url(#${tailGradient})`, 'data-part="mmu-filament-tail"');
    s += label(mmuX, mmuY + 39, 'Gear stepper', 'text-anchor="middle"');
    s += rect(x - 12, y(90), 24, y(3) - y(90), 'var(--hh-surface)', 'class="hh-animation-structure"');
    s += rect(x - 37, y(22), 74, 56, 'var(--hh-surface)', 'class="hh-animation-structure" rx="5"');
    const references = [
      [80, 'Entry sensor · 80'],
      [72, 'Extruder gears · 72'],
      [62, 'Toolhead sensor · 62'],
      [before ? 85 : 52, before ? 'Blade position · 85' : 'Blade position · 52'],
      [0, 'Nozzle reference · 0']
    ];
    for (const [height, text] of references) {
      if (this.hideCutter && text.startsWith('Blade position')) continue;
      const guideY = y(height);
      s += label(8, guideY, text, 'data-part="reference-label" text-anchor="start" dominant-baseline="middle"');
      s += `<line data-part="reference-line" class="hh-animation-line" x1="150" x2="${x - 42}" y1="${guideY}" y2="${guideY}"/>`;
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
    if (i === 8) travel = -50 + 47 * t;
    if (i === 9) travel = -3 + 2 * t;
    if (i === 10) travel = -1 + 13 * t;
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
    if (before) {
      if (i === 0) travel = -2 * t;
      if (i === 1) travel = -2 - 47 * t;
      if (i === 2) travel = -49;
      if (i === 3) travel = -49 + Math.min(1, t / 0.65);
      if (i === 4) travel = -48 + 35 * t;
      if (i === 5) travel = -13 - 35 * t;
      if (i === 6) travel = -48;
      if (i === 7) travel = -48 + 10 * t;
      if (i === 8) travel = -38 + 23 * t;
      if (i === 9) travel = -15 + 2 * t;
      if (i === 10) travel = -13 + 37 * t;
      if (i === 11) travel = 24 + 30 * t;
      if (i === 12) travel = 54 + 18 * t;
      if (i === 13) travel = 72 - 2 * t;
      if (i === 14) travel = 70;
      mmuTravel = travel;
      if (i === 2) mmuTravel = tension ? -49 - 10 * t : -59;
      if (i === 3) mmuTravel = -59;
      if (i === 4) mmuTravel = -59 + 35 * t;
      if (i === 5) mmuTravel = -24 - 35 * t;
      if (i === 6) {
        mmuTravel = -59;
        if (stage === 7) mmuTravel = -59 - 245 * phase;
        if (stage === 8) mmuTravel = -304 + 250 * phase;
        if (slowEntry) mmuTravel = -54 + 8 * phase;
      }
      if (i >= 7) mmuTravel = travel + 2;
    }
    if (this.formedUnload) {
      const offset = this.formedPark - 64;
      if (stage === 6) {
        travel = -52 - (80 - this.formedPark) * t;
        mmuTravel = travel;
      } else {
        const loading = i === 8 ? 10 * t : i === 9 ? 10 : i === 10 ? 10 * (1 - t) : 0;
        travel += offset + loading;
        mmuTravel += offset + loading;
      }
    }
    for (const direction of [-1, 1]) {
      const center = mmuX + direction * 20;
      // Feed direction is upward at the MMU and downward at the toolhead.
      const angle = direction * mmuTravel * 2.8 / 15;
      s += `<g data-part="mmu-gear" data-angle="${angle}" transform="translate(${center} ${mmuY}) rotate(${angle * 180 / Math.PI})"><circle class="hh-animation-structure" r="15"/><path d="M-11,0 H11 M0,-11 V11" stroke="var(--hh-text)"/><circle r="3" fill="var(--hh-metal)"/></g>`;
    }
    // Retain the last drive mode through stationary holds and blade actions.
    // Derive it from sequence position so scrubbing and reverse steps agree:
    // MMU-only travel disengages sync; toolhead homing engages it again.
    const synced = before ? (!tension && (i < 2 || i === 4 || i === 5 || i >= 7)) : displayStage < 7 || displayStage >= 10;
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
    // Formed filament meets the residual during unretract, before purging.
    const closing = this.formedUnload && i >= 9 ? (i === 9 ? t : 1)
      : i === 10 ? Math.min(1, t / 0.15) : i > 10 ? 1 : 0;
    const seam = 1;
    const gap = seam * (1 - closing);
    const residualHeight = 27 * residual / 3;
    // Toolchange retraction shifts the entire retained melt upward. Loading
    // brings the fragment to it; the unretract advances both together.
    const residualLift = this.formedUnload && !this.residualRetracted ? 0 : i < 9 ? 5.6 : i === 9 ? 5.6 * (1 - t) : 0;
    const residualTop = y(0) - residualHeight - residualLift;
    // Make space for the visually enlarged residual by translating the whole
    // fragment and its pushing filament, never clipping the fragment shorter.
    const clearance = 27 - 3 * 2.8 + (this.formedUnload ? gap : seam);
    const loadOffset = this.formedUnload && i === 8 ? clearance * Math.min(1, Math.max(0, (19 - end) / 14)) : i === 8 ? clearance * Math.min(1, Math.max(0, ((before ? 16 : 19) - fragmentBottom) / (before ? 11 : 14)))
      : i === 9 ? clearance : i === 10 ? clearance * (1 - t) : 0;
    const fragmentVisualTop = y(fragmentTop) - loadOffset;
    const fragmentVisualBottom = y(fragmentBottom) - loadOffset;
    let feedBottom = y(end) - loadOffset;
    if (i === 0) feedBottom = 357 - 5.6 * t;
    if (i === 1) feedBottom = interpolate(351.4, y(before ? 51 : 42), t);
    if (i === 13) feedBottom = 357 - 5.6 * t;
    if (i === 14) feedBottom = 351.4;
    if (fragment) feedBottom = Math.min(feedBottom, fragmentVisualTop - gap);
    if (i > 1 && residual > 0) feedBottom = Math.min(feedBottom, residualTop - gap);
    // Sensor state follows actual filament geometry, including the endpoint
    // that stops on a sensor. Pulses use elapsed stage time, independently of
    // the held mechanism geometry, and finish within the post-motion hold.
    for (const height of [80, 62]) {
      const reverseHomeOff = height === 80 && ((displayStage === 6 && phase >= 0.99999) || displayStage === 7);
      const fragmentAtSensor = fragment && fragmentVisualTop <= y(height) && fragmentVisualBottom >= y(height);
      const present = !reverseHomeOff && (feedBottom >= y(height) - 0.001 || fragmentAtSensor);
      const pulseStage = height === 80 ? (before ? [4, 8] : [6, 8]).includes(displayStage) : displayStage === 10;
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
    // The original hotend tip belongs to the future cut fragment. Keep its
    // additive cone and hair below that piece, never on the new cut face or
    // incoming filament. Full-width geometry remains the movement reference.
    if (!this.hideCutter && (fragment || i === 1 || (i === 2 && !fragment))) {
      const growth = i === 1 ? Math.min(1, t / 0.3) : 1;
      const shoulder = fragment ? fragmentVisualBottom : feedBottom;
      const tip = shoulder + 7 * growth;
      const hairLength = 12 * 2.8 * growth;
      const hairRoot = tip - 1.5 * growth;
      const fade = i === 10 ? Math.max(0, 1 - t / 0.2) : 1;
      if (growth > 0 && fade > 0) {
        s += `<g data-part="cut-fragment-tip" opacity="${fade}"><path d="M${x - 5},${shoulder} Q${x - 3},${tip - 7 * growth / 3} ${x},${tip} Q${x + 3},${tip - 7 * growth / 3} ${x + 5},${shoulder} Z" fill="var(--hh-outgoing)"/><path data-part="cut-fragment-hair" d="M${x - 0.8},${hairRoot} C${x + 0.25},${tip + hairLength / 3} ${x - 1},${tip + hairLength * 2 / 3} ${x + 0.4},${tip + hairLength} C${x - 0.6},${tip + hairLength * 2 / 3} ${x + 1.35},${tip + hairLength / 3} ${x + 0.8},${hairRoot} Z" fill="var(--hh-outgoing)"/></g>`;
      }
    }
    // Height is enlarged for visibility; width matches every other filament.
    if (residual > 0 && i > 0) {
      // During extrusion the old material exits through the nozzle; its lower
      // edge must stay at the outlet rather than retract as its amount shrinks.
      const visibleResidualHeight = i >= 10 ? 357 - residualTop : residualHeight + 7 * residual / 3;
      s += rect(x - 5, residualTop, 10, visibleResidualHeight, 'var(--hh-residual)', 'data-part="residual"');
    }
    s += '</g>';
    if (residual > 0 && (i > 1 || (i === 1 && feedBottom < residualTop - seam))) {
      s += label(x - 57, 321, 'Residual 3mm', 'text-anchor="end" dominant-baseline="middle"');
      s += `<path data-part="residual-pointer" d="M${x - 53},321 H${x - 42} L${x - 7},${residualTop + residualHeight / 2}" fill="none" stroke="var(--hh-text)"/>`;
    }
    const bladeX = x + 15 - 28 * blade;
    if (!this.hideCutter) s += `<path data-part="blade" data-pressed="${blade}" d="M${bladeX},${y(before ? 85 : 52)} l42,-5 v10 Z" fill="var(--hh-metal)"/>`;
    if (fragment && i >= 3 && i <= 9) {
      const middle = y((fragmentTop + fragmentBottom) / 2) - loadOffset;
      // Keep the callout below the fixed sensor guides and at least 24px
      // above Residual, while its pointer follows the moving fragment.
      const calloutY = Math.max(y(62) + 24, Math.min(297, middle));
      s += label(x - 57, calloutY, before ? 'Cut tip 34mm' : 'Cut tip 10mm', 'data-part="cut-tip-label" text-anchor="end" dominant-baseline="middle"');
      s += `<path data-part="cut-tip-pointer" d="M${x - 53},${calloutY} H${x - 42} L${x - 7},${middle}" fill="none" stroke="var(--hh-text)"/>`;
    }
    const direction = before && i === 3 ? 1 : before && i === 6 ? 0 : [0, 1, 3, 5, 6, 13].includes(i) ? -1 : [4, 7, 8, 9, 10, 11, 12].includes(i) ? 1 : 0;
    if (motion.moving && direction && !waiting && !(i === 3 && t >= 0.65)) {
      const arrowX = x + 90;
      const toolchangeMotion = [0, 9, 13].includes(i);
      const labelY = toolchangeMotion ? y(0) : y(72);
      const arrowOffset = toolchangeMotion ? y(0) - y(72) - 7 : 0;
      const start = (direction < 0 ? 129 : 90) + arrowOffset;
      const finish = (direction < 0 ? 90 : 129) + arrowOffset;
      s += `<g data-part="motion-arrow" fill="none" stroke="var(--hh-text)" stroke-width="2.5"><path d="M${arrowX},${start} V${finish} m-5,${-direction * 7} l5,${direction * 7} l5,${-direction * 7}"/></g>`;
      const motionLabel = i === 4 ? ['Pushback', 'extrude']
        : i === 9 ? ['Toolchange', 'unretract', '2mm']
        : i >= 10 && i <= 12 ? ['Purge', 'extrude']
        : i === 1 ? ['Macro', 'retract']
        : i === 0 || i === 13 ? ['Toolchange', 'retract', '2mm'] : null;
      if (motionLabel) {
        motionLabel.forEach((text, line) => {
          const offset = (line - (motionLabel.length - 1) / 2) * 14;
          s += label(arrowX, labelY + offset, text, 'text-anchor="middle" dominant-baseline="middle"');
        });
      } else s += label(arrowX, y(72), i === 3 ? (before ? 'Rip extrude' : 'Rip retract') : direction < 0 ? 'Retract' : 'Extrude', 'text-anchor="middle" dominant-baseline="middle"');
    }
    if (i === 6 || stage === 8 || i === 7) {
      s += label(8, 45, stage === 8 || slowEntry || i === 7 ? 'MMU loading filament' : 'MMU unloading filament');
      if (waiting) {
        s += label(8, 62, stage === 7 ? 'Entry sensor → MMU gears' : slowEntry ? 'Entry sensor → extruder gears' : 'MMU gears → entry sensor');
        s += label(8, 76, this.formedUnload ? 'Residual stays in the nozzle.' : 'Retained tip stays below.');
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
    if (tension) s += label(8, 45, 'MMU tensions; extruder holds');
    svg.innerHTML = s;
    svg.setAttribute('viewBox', `0 0 ${width} 460`);
    // Measure rendered text to keep a consistent gap before each guide line.
    svg.querySelectorAll('[data-part="reference-label"]').forEach(text => {
      text.nextElementSibling.setAttribute('x1', 8 + text.getComputedTextLength() + 6);
    });
  }
};
window.HHAnimations.register("tip-cutting-purge", window.HHTipCuttingScene);
