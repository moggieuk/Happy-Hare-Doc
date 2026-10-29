/* Copyright (C) 2022-2026 Paul Morgan */
/* Cutter-before-extruder example; shares mechanism rendering and styling. */
(function () {
  const base = window.HHTipCuttingScene;
  const stages = base.stages.map(stage => [...stage]);
  stages[1] = ['Macro retract out of the melt zone', 'retract_length: 51 · toolhead_residual_filament: 3', 'Retract to 51 mm above the nozzle while keeping filament gripped by the extruder.'];
  stages[2] = ['Cut above the entry sensor', 'blade_pos: 85 · cutter_before_extruder: True', 'Cut above the 80 mm entry sensor: 85 − 51 = 34 mm of filament remains in the toolhead.'];
  stages[3] = ['Rip extrude, then release the blade', 'rip_length: 1', 'The extruder alone advances the fragment 1 mm off the pressed blade, then the blade releases.'];
  stages[4] = ['Push the fragment below both sensors', 'pushback_length: 35', 'Synced pushback leaves the 34 mm fragment between 16 and 50 mm, below the gears and both sensors.'];
  stages[5] = ['Return after pushback', 'pushback_dwell_time · pushback_length: 35', 'Return the upstream filament to the blade at 85 mm; the fragment stays below the sensors.'];
  stages[6] = ['Check the cut', 'cutter_before_extruder: True', 'The entry sensor between blade and gears is clear, confirming that the cut fragment has moved away.'];
  stages[7] = ['MMU unloading filament', 'blade_pos: 85 · toolhead_extruder_to_nozzle: 72', 'Unload from the blade through the Bowden. The outgoing end is already 13 mm above the extruder gears.'];
  stages[11] = ['Complete the toolhead load', 'toolhead_residual_filament: 3 · toolhead_ooze_reduction: 0', 'Advance 62 − 34 − 3 − 2 = 23 mm, bringing the 34 mm fragment against the retracted residual.'];
  stages.splice(2, 0, ['Tension the filament', 'tension_length: 10', 'The MMU retracts to tension the filament while the extruder holds it across the blade; the tension is schematic.']);
  const stageTiming = base.stageTiming.map(timing => ({...timing}));
  stageTiming.splice(2, 0, {seconds: 3.5, moveStart: 0.15, moveEnd: 0.8});
  window.HHAnimations.register('tip-cutting-before-purge', {
    ...base,
    title: 'Tip cutting above the entry sensor and purging',
    beforeExtruder: true,
    stages,
    stageTiming
  });
})();
