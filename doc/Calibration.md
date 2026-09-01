# Calibration

Happy Hare ships with sensible defaults for every supported MMU, but a
handful of dimensions are physical to *your* build - how far your gear
stepper actually turns per millimeter of filament, exactly where your
selector needs to park, how long your particular bowden tube is. No
default can know these in advance; that's what calibration is for.

This page explains which of the steps below actually apply to your MMU,
which are worth doing versus safe to skip for now, and the order to do
them in. Each step then has its own page with the full command reference
and worked examples.

## Which steps apply to your MMU

Whether a step applies at all is determined by your MMU's **selector
mechanism** - see [What Is an MMU?](Conceptual-MMU.md#selector-mechanisms)
for the full Type-A/Type-B/Type-C breakdown and the vendor table. In short:

- **Type-A** (shared gear stepper, moving selector - ERCF, Tradrack, BTT
  ViViD, 3D Chameleon, HTLF, Low Rider, MMX, MMX6, Pico MMU) needs selector
  calibration; the gear stepper is shared across gates so there's normally
  only one rotation distance to set.
- **Type-B** (gear-per-gate, no moving selector - Box Turtle, 3MS, Angry
  Beaver, EMU, KMS, Night Owl, QuattroBox) has nothing to calibrate for a
  selector, but each gate's own gear stepper can need its own rotation
  distance.
- **Type-C** (gear-per-gate *and* a moving selector - no vendor default yet,
  custom builds only) needs both: selector calibration from the Type-A list
  below, plus per-gate gear calibration from the Type-B list.

| Step | Command(s) | Applies to | Necessity |
|---|---|---|---|
| Selector position | [`MMU_CALIBRATE_SELECTOR`](Calibration-Selector.md), [`MMU_SERVO`](Calibration-Selector.md), [`MMU_CALIBRATE_SERVO_SELECTOR`](Calibration-Selector.md), [`MMU_CALIBRATE_ROTARY_SELECTOR`](Calibration-Selector.md), [`MMU_CALIBRATE_SELECTOR_INDEXES`](Calibration-Selector.md) | Type-A/Type-C only - not applicable to Type-B | **Mandatory** where it applies - no default position exists |
| Gear rotation distance | [`MMU_CALIBRATE_GEAR`](Calibration-Gear.md), [`MMU_CALIBRATE_GATE`](Calibration-Gear.md) | Every MMU | Recommended, but skippable everywhere by default - see Autotuning below |
| Encoder resolution | [`MMU_CALIBRATE_ENCODER`](Calibration-Encoder.md) | Only if an encoder is fitted (standard on ERCF; optional/vendor-dependent elsewhere) | Nagged-for-by-default on ERCF only; skippable everywhere else |
| Bowden length | [`MMU_CALIBRATE_BOWDEN`](Calibration-Bowden.md) | Every MMU | Required unless auto-calibrated - no MMU type ships a default |
| Toolhead dimensions | [`MMU_CALIBRATE_TOOLHEAD`](Calibration-Toolhead.md) | Every MMU | Optional if a known toolhead/extruder was picked during install; otherwise needs a toolhead sensor |
| Sync-feedback sensor | [`MMU_CALIBRATE_PSENSOR`](Feature-Sync-Feedback-Buffer.md#calibrating-a-proportional-sensor) | Only with a sync-feedback buffer's analog (proportional) sensor fitted | Optional - a feature-specific calibration, covered on its own Feature page |

## Autotuning and auto-calibration

Two related but distinct ideas, both controlled by `mmu_parameters.cfg`
settings exposed in `menuconfig`'s **Calibration and Autotuning** screen:

- **Auto calibration** runs a measurement automatically, once, the first
  time it's needed - after that it behaves exactly as if you'd run the
  calibration command yourself.
- **Autotuning** keeps adjusting a value continuously during normal
  operation, refining it a little on every load/unload rather than
  settling on one number.

| Setting | What it does | Default |
|---|---|---|
| `autocal_bowden_length` | Auto-calibrate bowden length the first time it's needed, instead of requiring [`MMU_CALIBRATE_BOWDEN`](Calibration-Bowden.md) up front | **On** for Box Turtle, EMU, KMS, and BTT ViViD (their stock builds ship an extruder-entry sensor or a sync-feedback buffer with compression/proportional sensing); off elsewhere, but fitting an extruder-entry sensor unlocks it on any MMU |
| `autotune_bowden_length` | Continuously refine the bowden length over time | Off for every MMU type - fully opt-in |
| `skip_cal_rotation_distance` | Skip [`MMU_CALIBRATE_GEAR`](Calibration-Gear.md), relying on the installed default rotation distance | **On** (skippable) for every MMU type, no exceptions |
| `autotune_rotation_distance` | Continuously refine each gate's rotation distance from sync-feedback or encoder telemetry | Off for every MMU type - fully opt-in |
| `skip_cal_encoder` | Skip [`MMU_CALIBRATE_ENCODER`](Calibration-Encoder.md), relying on the installed default encoder resolution | **On** (skippable) for every type *except ERCF* (off) |

A `skip_cal_*` setting doesn't stop the MMU from working either way - it
only changes whether Happy Hare nags at boot ("not calibrated") until you
run the command (`0`), or quietly accepts the vendor default forever
(`1`, the default nearly everywhere). Note that `skip_cal_encoder`'s
exception is ERCF specifically, not "any encoder-equipped design" - KMS
and QuattroBox both ship with an encoder and still default to skippable.

## Recommended order

If you're calibrating for the first time, do it in this order - later
steps depend on earlier ones being right, and re-running an earlier step
invalidates everything after it:

<pre class="hh-mermaid">
graph LR
    A[Selector<br/>if Type-A/C] --> B[Gear<br/>rotation distance]
    B --> C[Encoder<br/>if fitted]
    C --> D[Bowden<br/>length]
    D --> E[Per-gate gear<br/>if variable]
    F[Toolhead<br/>independent, anytime] --- B
</pre>

Concretely: if you re-run `MMU_CALIBRATE_GEAR`, you must also re-run
encoder, bowden, and possibly per-gate calibration afterward - all three
depend on the gear's rotation distance being settled first. Selector
calibration and toolhead calibration can both be safely redone at any
time; neither one cascades into the others.

Every calibration command supports `SAVE=0`, which runs the full
measurement and reports the result without persisting it - useful for
checking a step is working before committing to it.

## Where results are stored

Every calibration command persists its result into `mmu_vars.cfg` via
Klipper's `[save_variables]`:

| Variable | Set by |
|---|---|
| `mmu_selector_offsets` | [`MMU_CALIBRATE_SELECTOR`](Calibration-Selector.md) |
| `mmu_selector_bypass` | [`MMU_CALIBRATE_SELECTOR`](Calibration-Selector.md) `BYPASS=1` |
| `mmu_servo_angles` | [`MMU_SERVO`](Calibration-Selector.md) / [`MMU_CALIBRATE_SERVO_SELECTOR`](Calibration-Selector.md) |
| `mmu_gear_rotation_distances` | [`MMU_CALIBRATE_GEAR`](Calibration-Gear.md) / [`MMU_CALIBRATE_GATE`](Calibration-Gear.md) |
| `mmu_encoder_resolution` | [`MMU_CALIBRATE_ENCODER`](Calibration-Encoder.md) |
| `mmu_calibration_bowden_lengths` | [`MMU_CALIBRATE_BOWDEN`](Calibration-Bowden.md) |
| `mmu_calibration_clog_length` | [`MMU_CALIBRATE_BOWDEN`](Calibration-Bowden.md) (when an encoder is fitted) |

None of these need hand-editing - each one is written by its own
calibration command, and `RESET=1` on that same command clears it back to
the installed default.

## See also

- [What Is an MMU?](Conceptual-MMU.md#selector-mechanisms) - the Type-A/B/C taxonomy this page builds on
- [Config Parameters](Reference-Parameters.md#calibration-and-autotune) - every setting mentioned above, in full
- [Command Reference](Reference-Commands.md) - every `MMU_CALIBRATE_*` command's full parameter list
