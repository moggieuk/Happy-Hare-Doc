# Calibration: Bowden Length

Bowden length is the one calibration value **no MMU type ships a default
for** - unlike gear rotation distance or gear current, there's no
Kconfig setting for it anywhere in the installer. It's purely physical
to your build (the actual tube length between selector and extruder), so
until it's measured - by you, or automatically - Happy Hare simply
doesn't know it.

`MMU_CALIBRATE_BOWDEN` picks one of three strategies automatically, based
on what `extruder_homing_endstop` (in `mmu_parameters.cfg`) is set to:

## Sensor-based (the best method, if you have one)

If `extruder_homing_endstop` is `extruder`, `mmu_gear_touch`, or
`filament_compression`, this is the most accurate method - a real homing
sensor gives a precise stop point:

```{.text .console-command}
MMU_CALIBRATE_BOWDEN
```

```{.text .console-output}
Calibrating bowden length for gate 0 (automatic method) using mmu_gate sensor as gate reference point
Filament homed to extruder after 724.5mm movement
Calibrated bowden length is 724.5mm
```

You can give an approximate length to bound the search, though it's
rarely needed since Happy Hare defaults to a generous 2000mm:

```{.text .console-output}
MMU_CALIBRATE_BOWDEN BOWDEN_LENGTH=1500
```

## Encoder collision method

If `extruder_homing_endstop` is `encoder` (filament is driven into the
closed extruder gears and the collision is detected by the encoder no
longer counting movement), supply a `BOWDEN_LENGTH` **slightly shorter**
than the real distance - a rule of thumb is your measured selector-to-
extruder distance minus 40-50mm:

```{.text .console-command}
MMU_CALIBRATE_BOWDEN BOWDEN_LENGTH=650
```

```{.text .console-output}
Pass #1: Filament homed to extruder, encoder measured 682.3mm, filament sprung back 3.2mm
Pass #2: Filament homed to extruder, encoder measured 681.8mm, filament sprung back 3.1mm
Pass #3: Filament homed to extruder, encoder measured 680.6mm, filament sprung back 3.4mm
Recommended calibration reference is 680.2mm. Clog detection length: 16.8mm
Bowden calibration and clog detection length have been saved
```

This method also produces a starting value for FlowGuard's clog-detection
length (`flowguard_encoder_max_motion`) as a side effect, from the same
telemetry - see [Feature: FlowGuard](Feature-FlowGuard.md#tuning) to tune
that further. Happy Hare may briefly heat the extruder for this method,
so the motor has enough force to resist the collision realistically.
`REPEATS=` (default 3) controls how many passes it averages over.

## Manual method

If you have neither a homing sensor nor an encoder - just a `mmu_gate`
sensor, as on Tradrack - push filament by hand until it reaches the
extruder gears, then reverse-home off the gate sensor:

```{.text .console-output}
MMU_CALIBRATE_BOWDEN MANUAL=1
MMU_CALIBRATE_BOWDEN BOWDEN_LENGTH=1500 MANUAL=1
```

This uses Klipper's own measurement of stepper movement during the
reverse-home, rather than a sensor detecting the far end.

## Common to all three

`SAVE=0` reports the measured length without persisting it. `RESET=1`
clears the saved length for the current gate, which also re-enables
first-time auto-calibration if `autocal_bowden_length` is on (see below).
`HOMING_MAX=` (default 150mm) bounds how far the final homing move to the
extruder is allowed to travel.

Most MMUs share one bowden length across every gate; a design where gates
genuinely differ needs each one calibrated separately with the selected
gate changed between runs.

## Auto-calibration and autotuning

Two settings in `mmu_parameters.cfg` can reduce or remove the need to run
this command by hand:

- **`autocal_bowden_length`** runs this same calibration automatically the
  first time it's needed, instead of requiring you to run
  `MMU_CALIBRATE_BOWDEN` up front. It defaults **on** for Box Turtle, EMU,
  KMS, and BTT ViViD - their stock builds ship with an extruder-entry
  sensor or a sync-feedback buffer with compression/proportional sensing,
  either of which this needs to work reliably. It's off for every other
  type by default, but fitting an extruder-entry sensor unlocks it on
  any MMU, regardless of vendor.
- **`autotune_bowden_length`** (off everywhere by default, fully opt-in)
  keeps refining the bowden length continuously during normal use
  afterward, rather than settling on one first-measured value. It works
  best alongside an extruder or toolhead sensor, since that gives an
  accurate homing point close to the point being measured.

See [Calibration](Calibration.md#autotuning-and-auto-calibration) for how
these two sit alongside the other autotuning settings.

## See also

- [Calibration](Calibration.md) - overview, order, and which steps apply to your MMU
- [Feature: FlowGuard](Feature-FlowGuard.md#tuning) - `flowguard_encoder_max_motion`, seeded by this command's encoder-collision method
- [Config Parameters](Reference-Parameters.md#calibration-and-autotune) - `autocal_bowden_length`/`autotune_bowden_length` in full
- [Command Reference: `MMU_CALIBRATE_BOWDEN`](Reference-Commands.md#mmu_calibrate_bowden)
