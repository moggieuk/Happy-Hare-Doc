/* Copyright (C) 2022-2026 Paul Morgan */
/* MMU servo cutter: mmu_servo_cutter.cfg, default single cut attempt. */
(function () {
  "use strict";
  const stages = [
    [...window.HHTipCuttingScene.stages[0]],
    [...window.HHTipCuttingScene.stages[1]],
    ['Unload the outgoing filament', 'toolhead_extruder_to_nozzle: 72', 'Withdraw the tip to the entry sensor, keeping its cone and hair. Residual filament stays in the nozzle.'],
    ['MMU unloading filament', 'user_post_unload_extension: SERVO_CUTTER_ACTION', 'Withdraw the tip through the Bowden to the MMU. The servo-cutter macro then starts from this unloaded position.'],
    ['Open the cutter', 'servo_open_angle: 10 · servo_duration: 1.5 · servo_idle_time: 1.8', 'Move the bowden and blade together. The Bowden clears the MMU outlet and the blade reaches the ready position beside the filament path. Allow the configured servo settling time.'],
    ['Feed the tip past the blade', 'feed_length: 48 · cut_length: 10', 'Advance 48 + 10 = 58 mm from the unloaded position, exposing the old tip beyond the cutter.'],
    ['Close the cutter', 'servo_closed_angle: 70 · servo_duration: 1.5 · servo_idle_time: 1.8', 'Move the blade and Bowden farther left together to cut the 10 mm tip. The detached tip and hair eject to the side and fade.'],
    ['Rip retract 1 mm', '_MMU_STEP_MOVE MOVE=-1 · cut_attempts: 1', 'After the cut, retreat 1 mm to pull the remaining filament away from the blade. The blade and Bowden stay in their cutting position during this move.'],
    ['Return the blade and Bowden', '_MMU_EVENT EVENT="filament_cut"', 'Record one filament-cut event. Clear the blade and realign the Bowden with the MMU. The blade clearance is schematic; the servo finishes at its closed setting.'],
    ['Return to the unloaded position', '_MMU_STEP_SET_FILAMENT STATE=2 · _MMU_STEP_UNLOAD_GATE', 'Retract the freshly cut end to the previous unloaded position. The exact parking movement depends on the gate configuration.'],
    ['Finish the action', 'M400', 'Wait for movement to finish. The cut tip has been discarded and the remaining filament is back at its unloaded position.']
  ];
  const base = window.HHTipCuttingScene;
  const macroStageCount = stages.length;
  const incoming = base.stages.slice(8).map(stage => [...stage]);
  incoming[3][2] = 'Advance 62 − 3 − 2 = 57 mm from the toolhead sensor. Only the residual remains in the hotend; the MMU offcut has been discarded.';
  incoming[5][0] = 'Purge residual filament';
  incoming[5][2] = 'The incoming filament pushes residual melt through the nozzle before the color transition and new-color purge.';
  stages.push(...incoming);
  window.HHAnimations.register('servo-cutter', {
    title: 'MMU servo cutting after unload',
    height: 460,
    secondsPerStage: 3,
    stages,
    stageTiming: stages.map((_, i) => i < 2 ? {...base.stageTiming[i]} : i >= macroStageCount ? {...base.stageTiming[i - macroStageCount + 8]} : ({seconds: [5.5, 4, 4, 4, 3, 4, 4, 2.5, 3, 3, 2][i], moveStart: 0.12, moveEnd: 0.85})),
    legend: [['outgoing', 'Outgoing filament / offcut / residual'], ['incoming', 'Incoming filament']],
    render(svg, position, width, motion = {}) {
      width = Math.max(700, width);
      const index = Math.min(stages.length - 1, Math.floor(position)), t = position - index;
      const loading = index >= macroStageCount;
      const i = loading ? 13 : index < 2 ? index : index >= 9 ? index + 2 : index + 1;
      // Reuse the actual toolhead/MMU drawing, including all shared dimensions.
      base.render.call(loading ? {...base, hideCutter: true, formedUnload: true, formedPark: 42, residualRetracted: true} : base, svg, loading ? index - macroStageCount + 8 + t : i < 2 ? i + t : 1.999999, width, loading || i < 2 ? motion : {moving: false});
      svg.querySelector('[data-part="blade"]')?.remove();
      for (const label of svg.querySelectorAll('[data-part="reference-label"]')) {
        if (label.textContent.startsWith('Blade position')) { label.nextElementSibling.remove(); label.remove(); }
      }
      const x = width * 0.42, mx = x + Math.min(230, width * 0.30);
      const y = h => 350 - h * 2.8;
      const gearY = y(22) + 56 - 60, bladeY = gearY - 75;
      const scale = 75 / 48;
      // One carriage displacement drives both the Bowden outlet and blade.
      // Opening brings the blade to the filament edge; closing crosses it.
      const cutProgress = i === 7 ? Math.min(1, t / 0.65) : 0;
      const carriageShift = i === 5 ? 19.4*t : i === 6 ? 19.4
        : i === 7 ? 19.4 + 19*cutProgress : i === 8 ? 38.4 : i === 9 ? 38.4*(1-t) : 0;
      const cut = i > 7 || (i === 7 && t >= 0.65);
      const tube = svg.querySelector('[data-part="bowden"]');
      const filament = svg.querySelector('[data-part="bowden-filament"]');
      const feed = svg.querySelector('[data-part="feed"]');
      const length = tube.getTotalLength();
      const origin = tube.getPointAtLength(0);
      let shoulder = 0;
      if (i >= 3 && !loading) {
        svg.querySelector('[data-part="cut-fragment-tip"]')?.remove();
        svg.querySelector('[data-part="tension-arrow"]')?.remove();
        for (const text of svg.querySelectorAll('text')) {
          if (text.textContent === 'MMU tensions; extruder holds') text.remove();
        }
        if (i >= 4) svg.querySelector('[data-part="synced"]')?.remove();
        // One continuous path carries the additive cone and hair around the bend.
        shoulder = i === 3 ? -(y(42 + 38*t)-y(90))
          : i === 4 ? -28 + (length+28)*t : length;
        if (i >= 6) shoulder = length - (i === 6 ? 58*scale*t : i === 7 ? (cut ? 48 : 58)*scale : i === 8 ? (48-t)*scale : i < 11 ? 47*scale : i === 11 ? 47*scale*(1-t) : 0);
        if (i === 3 || (i === 4 && shoulder < 0)) feed.setAttribute('height', Math.max(0,-shoulder));
        else feed.remove();
        const start = Math.max(0, Math.min(1,shoulder/length));
        filament.setAttribute('stroke-dasharray', `${(1-start)*1000} 1000`);
        filament.setAttribute('stroke-dashoffset', -start*1000);
        if (i >= 5) {
          filament.remove();
          const crown = (x+mx)/2, tipX = mx-carriageShift;
          const d = `M${x},${y(90)} C${x},44 ${crown-60},30 ${crown},30 C${mx-35},30 ${tipX},95 ${tipX},170 V${bladeY} M${mx},${bladeY} V${gearY}`;
          tube.setAttribute('d',d);
          tube.nextElementSibling.setAttribute('d',d);
          const end = gearY - (length-shoulder);
          tube.nextElementSibling.insertAdjacentHTML('afterend', `<rect data-part="servo-feed" x="${mx-5}" y="${end}" width="10" height="${Math.max(0,gearY-end)}" fill="var(--hh-outgoing)"/>`);
        }
        // Match sensor state to the exiting filament, including reverse homing.
        for (const sensor of svg.querySelectorAll('[data-part="sensor"]')) {
          const present = i===3 && 42+38*t < Number(sensor.dataset.height)-0.0001;
          sensor.setAttribute('fill', present?'var(--hh-sensor-active)':'var(--hh-surface)');
          sensor.setAttribute('stroke',present?'var(--hh-sensor-active)':'var(--hh-metal)');
        }
        const travel = i===3 ? -38*t : i===4 ? -38-250*t : i===6 ? -288+58*t : i===7 ? -230 : i===8 ? -230-t : i===11 ? -231-47*t : i>=12 ? -278 : i>=9 ? -231 : -288;
        for (const [part, delta] of [['mmu-gear',travel],['gear-spoke',i===3?-38*t:-38]]) {
          svg.querySelectorAll(`[data-part="${part}"]`).forEach((gear,j)=>{
            const initial=Number(gear.dataset.angle), side=j===0?-1:1;
            const angle=initial+(part==='mmu-gear'?side:-side)*delta*2.8/15;
            gear.setAttribute('transform',`translate(${(part==='mmu-gear'?mx:x)+side*20} ${part==='mmu-gear'?gearY:y(72)}) rotate(${angle*180/Math.PI})`);
          });
        }
      }
      if (loading) {
        for (const [part, delta] of [['mmu-gear',22],['gear-spoke',12]]) {
          svg.querySelectorAll(`[data-part="${part}"]`).forEach((gear,j)=>{
            const side=j===0?-1:1;
            const angle=Number(gear.dataset.angle)+(part==='mmu-gear'?side:-side)*delta*2.8/15;
            gear.setAttribute('transform',`translate(${(part==='mmu-gear'?mx:x)+side*20} ${part==='mmu-gear'?gearY:y(72)}) rotate(${angle*180/Math.PI})`);
          });
        }
      }
      const tip = (pointAt, distance, growth=1) => {
        const c=pointAt(distance), p=pointAt(distance-7*growth), a=pointAt(distance-.25), b=pointAt(distance+.25);
        const norm=Math.hypot(b.x-a.x,b.y-a.y)||1, nx=-(b.y-a.y)/norm, ny=(b.x-a.x)/norm;
        const left=pointAt(distance-7*growth-33.6*growth);
        return `<g data-part="servo-tip"><path d="M${c.x+5*nx},${c.y+5*ny} Q${p.x+3*nx},${p.y+3*ny} ${p.x},${p.y} Q${p.x-3*nx},${p.y-3*ny} ${c.x-5*nx},${c.y-5*ny} Z" fill="var(--hh-outgoing)"/><path data-part="servo-hair" d="M${p.x+.8*nx},${p.y+.8*ny} Q${left.x+nx},${left.y+ny} ${left.x},${left.y} Q${left.x-nx},${left.y-ny} ${p.x-.8*nx},${p.y-.8*ny} Z" fill="var(--hh-outgoing)"/></g>`;
      };
      if (i>=3 && !cut && !loading) {
        const pointAt = d => i>=5 ? {x:mx,y:gearY-(length-d)} : d<0 ? {x:origin.x,y:origin.y-d} : tube.getPointAtLength(Math.min(length,d));
        svg.insertAdjacentHTML('beforeend',tip(pointAt,shoulder));
      }
      if (i === 7 && cut && !loading) {
        const eject = Math.min(1, (t-0.65)/0.35);
        const fall=140*eject*eject, dx=100*eject;
        const offcutX=mx+dx, end=bladeY-10*scale+fall;
        const clip=svg.dataset.sceneId+'-offcut';
        svg.insertAdjacentHTML('beforeend',`<defs><clipPath id="${clip}"><rect width="${width}" height="424"/></clipPath></defs><g data-part="offcut" opacity="${1-eject}" clip-path="url(#${clip})"><rect x="${offcutX-5}" y="${end}" width="10" height="${10*scale}" fill="var(--hh-outgoing)"/>${tip(d=>({x:offcutX,y:end+d}),0)}</g>`);
      }
      // The blade strokes in, then clears the path before filament retracts.
      const bladeX=mx+35.4-carriageShift;
      svg.insertAdjacentHTML('beforeend',`<g data-part="servo-cutter"><rect class="hh-animation-structure" x="${mx+45}" y="${bladeY-49}" width="32" height="23" rx="4"/><text class="hh-animation-label" x="${mx+61}" y="${bladeY-57}" text-anchor="middle">Servo</text><path d="M${mx+61},${bladeY-37} L${bladeX+13},${bladeY}" stroke="var(--hh-metal)" stroke-width="3"/><path d="M${bladeX-8},${bladeY} l32,-5 v10 Z" fill="var(--hh-metal)"/><text class="hh-animation-label" x="${mx+88}" y="${bladeY}" dominant-baseline="middle">Blade position</text><path d="M${mx+62},${bladeY} H${mx+82}" stroke="var(--hh-border)"/></g>`);
      if (!loading && i>=3 && motion.moving && [3,4,6,8,11].includes(i)) {
        const down=[4,8,11].includes(i), ax=i===3?x+90:mx-130, ay=i===3?y(72):gearY;
        svg.insertAdjacentHTML('beforeend',`<path d="M${ax},${ay+(down?-18:18)} V${ay+(down?18:-18)} m-5,${down?-7:7} l5,${down?7:-7} l5,${down?-7:7}" fill="none" stroke="var(--hh-text)" stroke-width="2"/><text class="hh-animation-label" x="${ax}" y="${ay+36}" text-anchor="middle">${i===6?'Advance':i===8?'Retreat 1mm':'Unload'}</text>`);
      }
    }
  });
})();
