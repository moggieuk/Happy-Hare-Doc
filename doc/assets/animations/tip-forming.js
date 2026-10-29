/* Copyright (C) 2022-2026 Paul Morgan */
/* Motion follows config/macros/mmu_form_tip.cfg (source revision 6c98916e).
 * Example: 2mm prior parking retract and 3mm residual allowance; optional ramming
 * and skinnydip enabled. Tip shape and thermal effects are schematic.
 */
(function () {
  const base = window.HHTipCuttingScene;
  const ramLengths = [0.5784, 0.5834, 0.5918, 0.6169, 0.3393, 0.3363, 0.7577,
    0.8382, 0.7776, 0.1293, 0.9673, 1.0176, 0.5956, 0.4555, 1.0662];
  const ramRates = [299, 302, 306, 319, 350, 350, 392, 434, 469, 469, 501, 527, 544, 544, 552];
  const ramTotal = ramLengths.reduce((sum, length) => sum + length, 0);
  const ramSeconds = ramLengths.reduce((sum, length, i) => sum + length / (ramRates[i] / 60), 0);
  const stages = [];
  const timing = [];
  const moves = [];
  function add(title, parameters, detail, from, to, seconds, kind = 'move') {
    stages.push([title, parameters, detail]);
    const continuous = kind === 'hold' || kind === 'cool';
    timing.push({seconds: kind === 'cool' ? seconds * 0.76 : seconds,
      moveStart: continuous ? 0 : 0.12, moveEnd: continuous ? 1 : 0.88});
    moves.push({from, to, kind});
  }
  add('Toolchange retract', 'park_toolchange: …, 2',
    'The surrounding toolchange retracts 2 mm before the forming macro starts. Ramming begins from this lifted position.', 0, 2, 3, 'park-retract');
  add('Ram filament (optional)', 'ramming_volume: 23 · ramming_volume_standalone: 23',
    'Ramming starts 2 mm back from the nozzle; its first 2 mm recover that gap before material exits. The example enables all 15 increasingly fast extrusion moves. Set the applicable ramming volume to zero to skip them.', 0, 0, 4, 'ram');
  add('Separate the tip from the nozzle', 'unloading_speed_start: 80',
    'A fixed 15 mm retract separates the tip from the melt. Motion is slowed for visibility.', 0, 15, 3);
  add('Retract toward the cooling zone', 'cooling_tube_position: 35 · cooling_tube_length: 10 · unloading_speed: 18',
    'Account for 3 mm residual and 2 mm prior retract: 35 − 3 − 2 + 10 − 15 = 25 mm. Retract 70%: 17.5 mm at 18 mm/s.', 15, 32.5, 3.5);
  add('Slow the separation pull', 'unloading_speed × 0.5: 9 mm/s',
    'Retract the next 20%: 5 mm at half the configured unloading speed.', 32.5, 37.5, 2.5);
  add('Finish the separation pull', 'unloading_speed × 0.3: 5.4 mm/s',
    'Retract the last 10%: 2.5 mm, ending at the upper edge of the cooling zone.', 37.5, 40, 2.5);
  add('Set the forming temperature (optional)', 'toolchange_temp: 200 · use_fast_skinnydip: False',
    'The normal mode waits for the selected temperature before cooling moves. The wait shown is illustrative; zero disables the temperature change.', 40, 40, 2, 'hold');
  for (let cycle = 0; cycle < 4; cycle++) {
    const forward = 10 + (40 / 7) * cycle * 2;
    const backward = forward + 40 / 7;
    add(`Cooling cycle ${cycle + 1} of 4`, 'cooling_moves: 4 · cooling_tube_length: 10 · initial_cooling_speed: 10 · final_cooling_speed: 50',
      `Advance 10 mm at ${forward.toFixed(1)} mm/s, then retract 10 mm at ${backward.toFixed(1)} mm/s. Each successive stroke is faster.`, 40, 40,
      2 + 1.5 * (10 / forward + 10 / backward), 'cool');
  }
  add('Skinnydip into the melt zone (optional)', 'use_skinnydip: True · skinnydip_distance: 30 · dip_insertion_speed: 30',
    'Advance 30 mm from the cooling zone to soften fine hairs on the tip. Skinnydip is disabled by default.', 40, 10, 3);
  add('Pause in the melt zone', 'melt_zone_pause: 500 ms',
    'This example uses a 500 ms dwell; the default is zero.', 10, 10, 0.5, 'hold');
  add('Withdraw after skinnydip', 'dip_extraction_speed: 70 · skinnydip_distance: 30',
    'Retract the same 30 mm to return the formed tip to the cooling zone.', 10, 40, 2);
  add('Pause in the cooling zone', 'cooling_zone_pause: 500 ms',
    'This example uses a 500 ms cooling dwell; the default is zero.', 40, 40, 0.5, 'hold');
  add('Restore the temperature target', 'NEXT_TEMP · toolchange_temp',
    'Restore the next filament’s target, or the original temperature. The macro does not wait here.', 40, 40, 1.5, 'hold');
  const parked = 50 + ramTotal;
  add('Park the formed tip', 'parking_distance: 50 · extruder_eject_speed: 25',
    `Parking uses absolute E −50 from the macro’s initial E zero. After ${ramTotal.toFixed(2)} mm of ramming and 40 mm of retraction, it retracts another ${(parked - 40).toFixed(2)} mm.`, 40, parked, 3);
  add('Tip forming complete', 'RESTORE_GCODE_STATE',
    'The formed tip is ready for the surrounding unload sequence. FINAL_EJECT instead requests an additional 80 mm retract for testing; that alternative is not shown.', parked, parked, 2, 'hold');

  const macroStageCount = stages.length;
  const continuation = base.stages.slice(6).map(stage => [...stage]);
  continuation[0][2] = 'Withdraw the formed tip from its parked position to the entry sensor; residual melt stays in the nozzle.';
  continuation[4][2] = 'Advance the new filament from the extruder gears to the toolhead sensor before completing the load.';
  continuation[5][2] = 'Advance 62 − 3 − 2 = 57 mm from the toolhead sensor, leaving the 2 mm toolchange retract to recover before purging. There is no cut fragment.';
  continuation[6][2] = 'Recover the final 2 mm, bringing the new filament against the residual melt before purging.';
  continuation[7][0] = 'Purge residual filament';
  continuation[7][2] = 'The incoming filament pushes the residual melt through the nozzle, followed by the color transition and new-color purge.';
  stages.push(...continuation);
  timing.push(...base.stageTiming.slice(6).map(stage => ({...stage})));
  const continuationScene = {...base, hideCutter: true, formedUnload: true, formedPark: parked};

  window.HHAnimations.register('tip-forming', {
    ...base,
    title: 'Filament tip forming',
    hideCutter: true,
    legend: [['outgoing', 'Outgoing filament / residual'], ['incoming', 'Incoming filament']],
    stages,
    stageTiming: timing,
    render(svg, position, width, motion = {}) {
      const index = Math.min(stages.length - 1, Math.floor(position));
      const progress = position - index;
      if (index >= macroStageCount) {
        const tailStage = index - macroStageCount + 6;
        base.render.call(continuationScene, svg, tailStage + progress, width, motion);
        // Treat the straight toolhead and curved Bowden as one centerline.
        // Movement references the full-width shoulder; the cone is additive
        // and spans the join rather than shrinking away at the handoff.
        if (tailStage >= 6 && tailStage <= 13) {
          const feed = svg.querySelector('[data-part="feed"]');
          const tube = svg.querySelector('[data-part="bowden"]');
          const filament = svg.querySelector('[data-part="bowden-filament"]');
          const length = tube.getTotalLength();
          const origin = tube.getPointAtLength(0);
          const height = feed ? Number(feed.getAttribute('height')) : 0;
          const baseDistance = height > 0 ? -height : Number(filament.dataset.start) * length;
          // Preserve the incoming nose at purge entry, then melt it smoothly
          // into the residual while the full-width shoulder keeps advancing.
          const melt = tailStage === 13 ? progress * progress * (3 - 2 * progress) : 0;
          const tipDistance = baseDistance - 7 * (1 - melt);
          const clip = tailStage === 13 ? feed.parentElement.getAttribute('clip-path') : null;
          const pointAt = distance => distance < 0
            ? {x: origin.x, y: origin.y - distance} : tube.getPointAtLength(Math.min(length, distance));
          const tip = pointAt(tipDistance);
          const center = pointAt(baseDistance);
          const previous = pointAt(baseDistance - 0.25);
          const next = pointAt(baseDistance + 0.25);
          const norm = Math.hypot(next.x - previous.x, next.y - previous.y) || 1;
          const nx = -(next.y - previous.y) / norm * 5;
          const ny = (next.x - previous.x) / norm * 5;
          const start = Math.max(0, Math.min(1, baseDistance / length));
          filament.setAttribute('stroke-dasharray', `${(1 - start) * 1000} 1000`);
          filament.setAttribute('stroke-dashoffset', -start * 1000);
          const color = tailStage >= 8 ? 'var(--hh-incoming)' : 'var(--hh-outgoing)';
          const middle = {x: (tip.x + center.x) / 2, y: (tip.y + center.y) / 2};
          svg.insertAdjacentHTML('beforeend', `<path data-part="formed-tip" ${clip ? `clip-path="${clip}"` : ''} d="M${center.x + nx},${center.y + ny} Q${middle.x + nx * 0.45},${middle.y + ny * 0.45} ${tip.x},${tip.y} Q${middle.x - nx * 0.45},${middle.y - ny * 0.45} ${center.x - nx},${center.y - ny} Z" fill="${color}"/>`);
        }
        return;
      }
      const move = moves[index];
      let end = move.from + (move.to - move.from) * progress;
      let direction = Math.sign(move.from - move.to);
      let ram = ramTotal;
      if (move.kind === 'ram') {
        let elapsed = progress * ramSeconds;
        ram = 0;
        for (let j = 0; j < ramLengths.length; j++) {
          const duration = ramLengths[j] / (ramRates[j] / 60);
          ram += ramLengths[j] * Math.min(1, elapsed / duration);
          elapsed = Math.max(0, elapsed - duration);
        }
        end = Math.max(0, 2 - ram);
        direction = 1;
      }
      if (move.kind === 'cool') {
        const cycle = index - 7;
        const forward = 10 + 40 / 7 * cycle * 2;
        const backward = forward + 40 / 7;
        const turn = (10 / forward) / (10 / forward + 10 / backward);
        end = progress < turn ? 40 - 10 * progress / turn : 30 + 10 * (progress - turn) / (1 - turn);
        direction = progress < turn ? 1 : -1;
      }
      // Reuse the shared toolhead/MMU shell, palette, references and sensors.
      base.render.call(this, svg, 0, width, {moving: false});
      width = Math.max(700, width);
      const x = width * 0.42;
      const y = height => 350 - height * 2.8;
      const mmuX = x + Math.min(230, width * 0.30);
      const mmuY = y(22) + 56 - 60;
      const inNozzle = move.kind === 'ram' || move.kind === 'park-retract';
      const shoulderY = inNozzle ? 357 - end * 2.8 : y(end) + 7 * Math.max(0, 1 - end / 15);
      const coneLength = inNozzle ? 0 : Math.min(7, end * 2);
      const tipY = shoulderY + coneLength;
      const feed = svg.querySelector('[data-part="feed"]');
      feed.setAttribute('height', Math.max(0, shoulderY - y(90)));
      if (coneLength > 0) feed.insertAdjacentHTML('afterend', `<path data-part="formed-tip" d="M${x - 5},${tipY - coneLength} Q${x - 3},${tipY - coneLength / 3} ${x},${tipY} Q${x + 3},${tipY - coneLength / 3} ${x + 5},${tipY - coneLength} Z" fill="var(--hh-outgoing)"/>`);
      // A tapered 12mm strand stretches from the forming tip, then disappears
      // after the optional skinnydip. Elapsed time keeps its fade smooth in holds.
      const hairGrowth = index === 2 ? Math.min(1, progress / 0.3) : 1;
      const hairOpacity = index === 13 ? Math.max(0, 1 - (motion.stageProgress ?? progress) / 0.3) : 1;
      if (index >= 2 && index <= 13 && hairGrowth > 0 && hairOpacity > 0) {
        const hairLength = 12 * 2.8 * hairGrowth;
        feed.insertAdjacentHTML('afterend', `<path data-part="tip-hair" d="M${x - 0.8},${tipY} C${x + 0.25},${tipY + hairLength / 3} ${x - 1},${tipY + hairLength * 2 / 3} ${x + 0.4},${tipY + hairLength} C${x - 0.6},${tipY + hairLength * 2 / 3} ${x + 1.35},${tipY + hairLength / 3} ${x + 0.8},${tipY} Z" fill="var(--hh-outgoing)" opacity="${hairOpacity}"/>`);
      }
      const separated = index >= 2 && tipY < 322;
      if (index >= 2) feed.insertAdjacentHTML('afterend', `<rect data-part="forming-residual" x="${x - 5}" y="323" width="10" height="34" fill="var(--hh-outgoing)"/>`);
      for (const sensor of svg.querySelectorAll('[data-part="sensor"]')) {
        const present = end <= Number(sensor.dataset.height);
        sensor.dataset.triggered = present;
        sensor.setAttribute('fill', present ? 'var(--hh-sensor-active)' : 'var(--hh-surface)');
        sensor.setAttribute('stroke', present ? 'var(--hh-sensor-active)' : 'var(--hh-metal)');
      }
      const travel = move.kind === 'park-retract' ? -end : move.kind === 'ram' ? -2 + ram : -2 + ramTotal - end;
      svg.dataset.tipHeight = end;
      svg.dataset.extrusionPosition = index === 0 ? 0 : travel + 2;
      for (const [part, centerX, centerY] of [['gear-spoke', x, y(72)], ['mmu-gear', mmuX, mmuY]]) {
        svg.querySelectorAll(`[data-part="${part}"]`).forEach((gear, j) => {
          const side = j === 0 ? -1 : 1;
          const angle = (part === 'mmu-gear' ? side : -side) * travel * 2.8 / 15;
          gear.dataset.angle = angle;
          gear.setAttribute('transform', `translate(${centerX + side * 20} ${centerY}) rotate(${angle * 180 / Math.PI})`);
        });
      }
      let overlay = `<g data-part="forming-zone"><rect x="${x - 14}" y="${y(40)}" width="28" height="28" rx="4" fill="none" stroke="var(--hh-incoming)" stroke-width="2" stroke-dasharray="4 3"/><text class="hh-animation-label" x="${x - 44}" y="${y(35)}" text-anchor="end" dominant-baseline="middle">Cooling stroke · 10mm</text><path d="M${x - 37},${y(35)} H${x - 17}" stroke="var(--hh-incoming)"/></g>`;
      if (motion.moving && direction && move.kind !== 'hold') {
        const captions = move.kind === 'park-retract' ? ['Toolchange', 'retract', '2mm']
          : [move.kind === 'ram' ? 'Ram' : move.kind === 'cool' ? 'Cooling' : direction > 0 ? 'Advance' : 'Retract'];
        const ax = x + 90;
        const labelY = move.kind === 'park-retract' ? y(0) : y(72);
        const arrowOffset = captions.length === 3 ? y(0) - y(72) - 7 : 0;
        const start = (direction > 0 ? 90 : 129) + arrowOffset;
        const finish = (direction > 0 ? 129 : 90) + arrowOffset;
        overlay += `<g fill="none" stroke="var(--hh-text)" stroke-width="2.5"><path d="M${ax},${start} V${finish} m-5,${-direction * 7} l5,${direction * 7} l5,${-direction * 7}"/></g>`;
        captions.forEach((caption, line) => {
          const offset = (line - (captions.length - 1) / 2) * 14;
          overlay += `<text class="hh-animation-label" x="${ax}" y="${labelY + offset}" text-anchor="middle" dominant-baseline="middle">${caption}</text>`;
        });
      }
      if (separated) overlay += `<text class="hh-animation-label" x="${x - 57}" y="321" text-anchor="end" dominant-baseline="middle">Residual 3mm</text><path d="M${x - 53},321 H${x - 42} L${x - 7},336.5" fill="none" stroke="var(--hh-text)"/>`;
      // Keep the outlet straight; a shrinking curve can fold into a wide blob.
      const waste = index === 0 ? 0 : index === 1 ? Math.max(0, (ram - 2) / (ramTotal - 2)) : 1;
      const strandEnd = 357 + 44 * waste;
      const stemEnd = Math.min(strandEnd, 365);
      const strand = `M${x},357 V${stemEnd}` + (strandEnd > stemEnd
        ? ` C${x - 3},${stemEnd + (strandEnd - stemEnd) / 3} ${x + 4},${stemEnd + (strandEnd - stemEnd) * 2 / 3} ${x},${strandEnd}` : '');
      if (waste > 0) overlay += `<path data-part="ramming-extrusion" d="${strand}" fill="none" stroke="var(--hh-outgoing)" stroke-width="3" opacity="${index <= 1 ? 1 : Math.max(0, 1 - (index - 2 + progress) / 2)}"/>`;
      svg.insertAdjacentHTML('beforeend', overlay);
    }
  });
})();
