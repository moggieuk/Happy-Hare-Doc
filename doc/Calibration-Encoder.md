# Calibration: Encoder

Only applies if your MMU has an encoder fitted - standard on ERCF, and
available as an option on several other designs (see [Feature:
Encoder](Feature-Encoder.md) for what the encoder does and how to wire
one up; this page is just the calibration command itself).

`MMU_CALIBRATE_ENCODER` measures **encoder resolution** - how many
millimeters of filament movement correspond to one encoder pulse. It
needs the current gate's gear rotation distance already calibrated (see
[Calibration: Gear](Calibration-Gear.md)) - the encoder measurement is
only as good as the gear move it's measuring against.

## Running it

Make sure filament is loaded at least as far as the encoder, then:

```{.text .console-command}
MMU_CALIBRATE_ENCODER
```

```{.text .console-output}
Calibrating over 400.0mm using 3 repeats:
Load direction: mean=368.67 stdev=0.58 min=368 max=369
Unload direction: mean=368.33 stdev=0.47 min=368 max=369
Before calibration measured length: 394.47mm
Calculated resolution of the encoder: 1.085049 (currently: 1.094543)
Encoder calibration has been saved
```

It moves filament forward and back a few times (`REPEATS=`, default 3)
over a commanded distance (`LENGTH=`, default 400mm), counts encoder
pulses each way, and derives the resolution from the discrepancy against
the already-calibrated gear move. `SAVE=0` reports the result without
persisting it - useful for a quick check.

```{.text .console-output}
MMU_CALIBRATE_ENCODER LENGTH=200 REPEATS=5
MMU_CALIBRATE_ENCODER MINSPEED=100 MAXSPEED=300
```

A shorter/longer test move can help on MMUs where the default doesn't fit
the available travel; `MINSPEED=`/`MAXSPEED=` spread the repeats across a
speed range instead of one fixed speed, which helps catch a resolution
that varies with speed.

If this step worked, `MMU_UNLOAD` should cleanly clear any residual
filament left from testing.

## Is this mandatory?

`skip_cal_encoder` in `mmu_parameters.cfg` controls whether Happy Hare
insists on this: it defaults to **off** (calibration effectively expected)
only on **ERCF** - every other encoder-equipped design, including KMS and
QuattroBox which both ship with an encoder, defaults to skippable, quietly
using the installed default resolution until you calibrate. Either way,
skipping it doesn't stop the MMU running; on ERCF it just means Happy Hare
nags at boot until you do. See
[Calibration](Calibration.md#autotuning-and-auto-calibration) for how this
setting sits alongside the others.

## See also

- [Calibration](Calibration.md) - overview, order, and which steps apply to your MMU
- [Calibration: Gear](Calibration-Gear.md) - required before this step
- [Calibration: Gear](Calibration-Gear.md#mmu_calibrate_gate-remaining-gates-automatically) - `MMU_CALIBRATE_GATE`, which uses this calibration to tune every other gate
- [Feature: Encoder](Feature-Encoder.md) - wiring, resolution concept, tuning, and troubleshooting
- [Config Parameters](Reference-Parameters.md#calibration-and-autotune) - `skip_cal_encoder` in full
- [Command Reference: `MMU_CALIBRATE_ENCODER`](Reference-Commands.md#mmu_calibrate_encoder)
