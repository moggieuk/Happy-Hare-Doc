# Calibration: Gear Rotation Distance

Every MMU has at least one gear stepper moving filament, and like any
extruder, its accuracy depends on `rotation_distance` - how far the
stepper actually turns the filament per commanded millimeter. Gate 0
always acts as the **reference gate**: it's the one you calibrate first,
and (on designs with per-gate gears) the one every other gate is measured
against.

Until you calibrate, Happy Hare uses the installed default from
`mmu_hardware.cfg` - a reasonable starting point, but real gears vary
build to build, so accuracy improves once you measure your own.

## `MMU_CALIBRATE_GEAR` - one gate, by hand

1. Select the gate: `MMU_SELECT GATE=0`.
2. Get filament to where it emerges from the MMU - the bowden exit, or a
   combiner/splitter exit on designs like Box Turtle's Turtle Neck buffer.
   `MMU_TEST_MOVE MOVE=50` a few times to advance it into view if needed.
3. Cut the filament flush at that exit point.
4. Run a measured test move, retaining grip so the cut end doesn't slip:

    ```text
    MMU_TEST_MOVE MOVE=100 GRIP=1
    ```

5. Measure the emitted length with a ruler or calipers, then feed it back:

    ```{.text .console-command}
    MMU_CALIBRATE_GEAR MEASURED=102.5
    ```

    ```{.text .console-output}
    Gear stepper 'rotation_distance' calculated to be 23.117387 (currently: 22.7316868)
    Gear calibration for gate 0 has been saved
    ```

Happy Hare computes the new rotation distance as
`current_rd * measured / commanded` and saves it by default. Cut flush
again and re-run `MMU_TEST_MOVE` (no `GRIP=`) to confirm - it should now
move exactly the commanded distance.

A longer test move improves precision on a design where 100mm is hard to
measure accurately:

```text
MMU_TEST_MOVE MOVE=200 GRIP=1
```

```text
MMU_CALIBRATE_GEAR LENGTH=200 MEASURED=205.25
```

`RESET=1` restores the installed default for the current gate.

## `MMU_CALIBRATE_GATE` - remaining gates, automatically

If your MMU has an **encoder**, you don't need to repeat the manual
procedure above on every gate. `MMU_CALIBRATE_GATE` uses the encoder plus
gate 0's already-calibrated rotation distance as a reference to work out
each other gate's rotation distance on its own - just feed loose filament
into the target gate and run:

```{.text .console-command}
MMU_CALIBRATE_GATE GATE=1
```

```{.text .console-output}
Calibration move of 6x 400.0mm, average encoder measurement: 404.7mm - Ratio is 1.011872
Calculated gate 1 rotation_distance: 22.941324 (currently: 22.672165)
Calibration for gate 1 has been saved
```

`ALL=1` sweeps every gate in sequence (feed loose filament from gate to
gate as prompted) - this is also what the legacy alias
`MMU_CALIBRATE_GATES` runs (`MMU_CALIBRATE_GATES` is kept only for
backward compatibility; `MMU_CALIBRATE_GATE ALL=1` is the same thing).
`RESET=1 ALL=1` clears every gate's calibration except the reference gate.

This requires gate 0's rotation distance *and* the encoder itself to
already be calibrated - see [Calibration:
Encoder](Calibration-Encoder.md). If a gate's measurement comes back more
than 20% different from gate 0's, Happy Hare rejects it rather than
saving a bad value - usually a sign filament wasn't actually moving, or
gate 0 itself isn't calibrated correctly.

## Do you need to bother with every gate?

It depends on your MMU's design:

- **Tradrack** explicitly disables variable rotation distance in its
  installer profile - every gate shares gate 0's value, since its
  single-gear design can't have per-gate variation in the first place.
  There's nothing to do beyond the one reference-gate calibration.
- **Most other multi-gear designs** (ERCF, Box Turtle-family, and other
  Type-B MMUs) *can* have real gate-to-gate variation - different BMG
  gears sourced from different production runs are a common cause - so
  calibrating each gate individually, or via `MMU_CALIBRATE_GATE ALL=1`,
  genuinely improves accuracy.
- If you'd rather not calibrate every gate up front, **`autotune_rotation_distance`**
  (off by default on every MMU type) lets Happy Hare quietly refine each
  gate's rotation distance during normal use instead, using sync-feedback
  or encoder telemetry as filament actually moves - see
  [Calibration](Calibration.md#autotuning-and-auto-calibration) for where
  this fits alongside the other autotuning settings. Even with it enabled,
  running `MMU_CALIBRATE_GATE` once against a test length of filament gets
  you a good value immediately rather than waiting for it to converge.

## See also

- [Calibration](Calibration.md) - overview, order, and which steps apply to your MMU
- [Calibration: Encoder](Calibration-Encoder.md) - required before `MMU_CALIBRATE_GATE`
- [Config Parameters](Reference-Parameters.md#calibration-and-autotune) - `skip_cal_rotation_distance`/`autotune_rotation_distance` in full
- [Command Reference: `MMU_CALIBRATE_GEAR`](Reference-Commands.md#mmu_calibrate_gear)
- [Command Reference: `MMU_CALIBRATE_GATE`](Reference-Commands.md#mmu_calibrate_gate)
- [Command Reference: `MMU_TEST_MOVE`](Reference-Commands.md#mmu_test_move)
