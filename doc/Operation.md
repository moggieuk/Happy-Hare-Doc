# Operation

Day-to-day use of an MMU with Happy Hare, and what to do when a print
pauses because something needs attention.

## Console and Logging

Happy Hare is controlled mainly through Klipper command extensions, typed
directly into a console (Mainsail/Fluidd) or run from macro buttons -
[KlipperScreen](KlipperScreen.md) wraps most of this into a touchscreen UI
if you'd rather not type commands.

Every operation's result goes to both the console and a dedicated
`mmu.log` file, each independently able to show more or less detail.
Verbosity, in increasing order:

- Essential messages only
- Information messages
- Debug messages
- Trace messages

By default the console shows up to informational messages, and `mmu.log`
up to debug - a reasonable balance day to day, worth turning up temporarily
while tuning. `mmu.log` lives alongside Klipper's other log files and
rotates the same way, keeping the last 5. To disable it entirely, set
`log_file_level: -1` in `mmu.cfg`'s shared parameters (anything that
reaches the console still ends up in `klipper.log` regardless).

A separate `log_visual: 1` setting adds a compact ASCII diagram of filament
position to load/unload console output - covered below.

## Pre-Print Checks

Two commands help confirm the MMU is actually ready before a print starts:

- [`MMU_PRELOAD`](Reference-Commands.md#mmu_preload) spins the gear stepper
  (servo depressed) until filament feeds in, then parks it at the correct
  position in the gate - the recommended way to load filament by hand,
  since it can't under- or over-insert it. Gates with a pre-gate sensor run
  this automatically outside of a print when filament is detected; inserted
  filament is only *noted*, not loaded, if that happens mid-print.
- [`MMU_CHECK_GATE`](Reference-Commands.md#mmu_check_gate) checks the
  current gate (no options), every gate (`ALL=1`), or a specific one
  (`GATE=`), confirming filament is present and correctly parked, and
  updates the [gate map](Feature-Gate-TTG-Maps.md#gate-map)'s availability
  status accordingly. `TOOLS=0,3,5` (typically called from `MMU_START_CHECK`
  - see Slicer Setup) validates specifically that those
  tools are ready, pausing before the print properly starts if not.

## Print-Job State Machine

Happy Hare tracks the whole print lifecycle separately from filament position.
The current state is exposed as `printer.mmu.print_state`, which is useful for
diagnosing recovery problems and for custom macros that need to behave
differently during a print. Happy Hare also uses it to restore temperatures,
stepper current and idle-timeout settings at the correct point.

<pre class="hh-mermaid">
stateDiagram-v2
    [*] --> initialized: restart
    initialized --> started: print starts
    ready --> started: print starts
    standby --> started: print starts
    standby --> idle: MMU command wakes it
    idle --> started: print starts
    complete --> started: next print
    cancelled --> started: next print
    error --> started: next print
    started --> printing: start setup completes
    printing --> complete: successful end
    printing --> error: print error
    printing --> cancelled: CANCEL_PRINT
    printing --> pause_locked: MMU error / MMU_PAUSE
    pause_locked --> paused: MMU_UNLOCK or RESUME unlock
    paused --> printing: RESUME
    initialized --> standby: idle timeout
    ready --> standby: idle timeout
    complete --> standby: idle timeout
    cancelled --> standby: idle timeout
    error --> standby: idle timeout
    idle --> standby: idle timeout
</pre>

| State | Meaning |
|---|---|
| `initialized` | Happy Hare has completed its startup or reset initialization. |
| `started` | Print-start housekeeping is running. This is normally brief. |
| `printing` | Happy Hare is actively managing a print. |
| `pause_locked` | An MMU error or `MMU_PAUSE` has paused the print and locked normal MMU interaction until it is unlocked or resumed. |
| `paused` | `MMU_UNLOCK` has restored temperatures and timeouts so the MMU can be operated, but the print still needs `RESUME`. |
| `complete` | The print and MMU end sequence completed normally. |
| `cancelled` | `CANCEL_PRINT`, or an explicit end-state command, cancelled the job. |
| `error` | The print ended in an error state. |
| `ready` | A non-printing resting state, normally selected explicitly with `MMU_PRINT_END STATE=ready`. |
| `standby` | The printer reached its idle timeout, or the MMU was disabled. |
| `idle` | An MMU command woke Happy Hare from `standby`, but no print is active. |

The recommended [Slicer Setup](Slicer-Setup.md) already brackets a job:
`MMU_START_SETUP` calls `MMU_PRINT_START`, and `MMU_END` calls
`MMU_PRINT_END`. Automatic start/end detection is enabled by default and also
handles virtual-SD prints. A streaming integration such as OctoPrint must run
those recommended start/end macros, or custom integrations must call
`MMU_PRINT_START` and `MMU_PRINT_END` themselves. Only disable
`print_start_detection` when those explicit bookends are guaranteed.

`MMU_PRINT_END STATE=...` accepts `complete`, `error`, `cancelled`, `ready` or
`standby`; normal print-end logic uses `complete`, while `CANCEL_PRINT` uses
`cancelled` automatically.

!!! note "Pause states"
    Calling `PAUSE` directly pauses Klipper but does not put Happy Hare into
    `pause_locked`; an MMU error or `MMU_PAUSE` does. `MMU_PAUSE` outside a
    print has no effect unless `FORCE_IN_PRINT=1` is supplied for testing.

    `MMU_UNLOCK` is optional before `RESUME`. It moves `pause_locked` to
    `paused`, restoring temperatures and normal MMU interaction so the problem
    can be fixed. Calling `RESUME` while still locked performs that unlock
    automatically before returning to `printing`. The complete recovery flow
    is covered in [What Happens When the MMU Pauses](#what-happens-when-the-mmu-pauses).

## Loading and Unloading Filament

Happy Hare's load/unload sequences move filament through several phases -
gate, bowden, toolhead, nozzle - each independently tunable in
`mmu_parameters.cfg`/`mmu.cfg`, and varying with what sensors/hardware are
actually fitted. `log_visual: 1` renders each phase in a compact ASCII
diagram as it happens:

```{.text .console-output}
Loading gate 0...
1. [T0] ■■■◉┈En┈┈┈┈┈┈┈ [◁ ▷] ┈┈┈┈┈┈◯┈┈Ex┈┈┈◯┈┈┈┤Nz UNLOADED 0.0mm (e:0.0mm)
2. [T0] ■■■◉■En■■┈┈┈┈┈ [◁ ▷] ┈┈┈┈┈┈◯┈┈Ex┈┈┈◯┈┈┈┤Nz ▷▷▷ 100.0mm (e:75.4mm)
3. [T0] ■■■◉■En■■■■■■■[ ▷ ◁ ]■■■■■┈◉┈┈Ex┈┈┈◯┈┈┈┤Nz ▷▷▷ 704.6mm (e:692.2mm)
4. [T0] ■■■◉■En■■■■■■■[ ▷ ◁ ]■■■■■■◉■■Ex■■■◉┈┈┈┤Nz ▷▷▷ 742.8mm (e:739.1mm)
5. [T0] ■■■◉■En■■■■■■■[ ▷ ◁ ]■■■■■■◉■■Ex■■■◉■■■■Nz■■ LOADED 814.6mm (e:817.5mm)
6. Load of 814.6mm filament successful (adjusted encoder: 840.5mm)
7. Purging...
```

Roughly:

1. Filament in gate
2. **Gate move** - a short pull from the gate to the start of the bowden.
   With an encoder fitted, movement is confirmed by the encoder itself
   (retried up to `gate_load_attempts` times before erroring); with a gate
   sensor instead, this is a homing move to that sensor. Speed:
   `gear_short_move_speed`.
3. **Bowden move** - a fast move through the bowden tube, the calibrated
   length persisted from `MMU_CALIBRATE_BOWDEN`. Speed depends on whether
   filament is coming from the spool (`gear_load_speed`) or from a filament
   buffer (`gear_from_filament_buffer_speed`, usually faster since friction
   is lower) - see [Feature: eSpooler](Feature-Espooler.md) and
   [Feature: Sync-Feedback Buffer](Feature-Sync-Feedback-Buffer.md) for what
   "buffer" means here. With an encoder, `bowden_apply_correction` can
   auto-correct a short move greater than `bowden_allowable_encoder_delta`.
4. **Toolhead homing** - establishing a known position relative to the
   nozzle, via whichever of `extruder_homing_endstop`'s methods you have
   sensors for (`encoder`, `mmu_gear_touch`, `extruder`, `filament_compression`,
   or `none` if a toolhead sensor makes homing to the extruder unnecessary).
   A toolhead sensor is generally the most reliable option where available.
5. **Final move to the nozzle** - the last, synchronized gear+extruder
   move to the meltzone, distance defined by `toolhead_extruder_to_nozzle`
   or `toolhead_sensor_to_nozzle` depending which homing method was used.
6. Movement summary
7. **Purging** previous filament -- defined by `purge_macro`. Can be
   a simple purge into a bucket or something like Blobifier.

Unloading mirrors this in reverse, plus a tip-forming step before the
toolhead is even touched - either Happy Hare's own routine (used any time
you unload outside a print, or explicitly configured; extruder current
raised for this via `extruder_form_tip_current`, optionally with
`sync_form_tip` synchronizing the gear motor too) or the slicer's own tip
forming during a print, in which case `slicer_tip_park_pos` tells Happy
Hare where the slicer already left the filament tip.

With an encoder fitted, small movement discrepancies between commanded and
measured distance are normal (calibration accuracy, minor slippage) and not
a cause for concern below roughly 5%.

!!! tip
    [`MMU_STATUS SHOWCONFIG=1`](Understanding-Operation.md#machine-state-and-configured-sequences) prints an
    English-language description of the preload, load, and unload sequences
    exactly as your current configuration would run them, parameter values
    included - genuinely useful while tuning, and worth running once just to
    see what it says.

This is deliberately the overview level - the underlying state machine and
the `_MMU_STEP_*` commands each phase is actually built from are covered in
full in [Custom Load/Unload Sequences](Custom-Load-Unload-Sequences.md).

## What Happens When the MMU Pauses

Happy Hare pauses the print for anything it can't handle automatically -
running out of filament, a detected clog, a genuine malfunction, or simply
a misconfiguration. None of these are inherent to MMU printing generally;
a well-tuned setup can comfortably run many thousands of swaps without
incident.

On a pause:

- The toolhead lifts off the print immediately, before anything else, to
  avoid a blob.
- Your `PAUSE` macro runs - normally parking the toolhead somewhere
  convenient to work at. The Happy Hare-supplied client macros do this
  automatically; see [Installation](Installation.md#client-macros) if you
  opted out of them and are supplying your own.
- The heated bed is kept heated for `timeout_pause` seconds (longer than
  Klipper's normal idle timeout, so the bed doesn't cool and the steppers
  don't lose position while you're away from the printer), and the
  extruder for `disable_heater` seconds, both in `mmu.cfg`'s shared
  parameters.

<pre class="hh-mermaid">
graph TD
    Printing --> Paused_Error
    Paused_Error --> MMU_UNLOCK
    MMU_UNLOCK --> Fix_Problem
    Paused_Error --> Fix_Problem
    Fix_Problem --> CANCEL_PRINT
    Fix_Problem --> RESUME
    Fix_Problem --> MMU_RECOVER
    MMU_RECOVER --> RESUME
    RESUME --> Printing
    CANCEL_PRINT --> Print_Cancelled
</pre>

- If the extruder has cooled (or is about to), run
  [`MMU_UNLOCK`](Reference-Commands.md#mmu_unlock) first and give it time to
  reheat - `RESUME` does this automatically if needed, but running it
  yourself first means you're not waiting on it during the resume.
- Fix whatever caused the pause, manually or with `MMU_*` commands as
  needed.
- Decide if [state recovery](#state-recovery) is actually necessary -
  usually it isn't.
- `CANCEL_PRINT` to abandon the print, or `RESUME` to continue.

!!! tip
    `MMU_PAUSE FORCE_IN_PRINT=1` triggers this same flow on demand, useful
    for testing your parking/recovery setup without waiting for a real
    error.

## State Recovery

Happy Hare tracks filament position as a state machine (see
[Custom Load/Unload Sequences](Custom-Load-Unload-Sequences.md) for the full
state table) - is filament in the toolhead, the bowden, or nowhere at all -
and uses that to decide what a command should do next. Fixing a problem
*with* Happy Hare's own commands keeps this state correct automatically;
fixing it by hand (moving filament, swapping a gate's spool) can leave it
stale, which then surfaces as a confusing second error on `RESUME`.

[`MMU_STATUS`](Understanding-Operation.md) shows the current tracked
state - gate/tool availability, current selection, and filament position -
so you can judge whether anything needs correcting:

```{.text .console-output}
Unit : ----------------- unit0 -----------------
Gate : | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |Byp|
Tools: |T0 |T1 |T2 |T3 |T4 |T5 |T6 |T7 |T8 | - |
Avail: |■■■|■■■|■■■|■■■|■■■|■■■|■■■|■■■|■■■| ■ |
Selct: |\▼/|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ T0
[T0] ■■■◉■En■■■■■■■[ ▷ ◁ ]■■■■■■◉■■Ex■■■◉■■■■Nz■■ LOADED 814.6mm (e:817.5mm)
```

[`MMU_RECOVER`](Reference-Commands.md#mmu_recover) fixes it in most cases,
run alone or with parameters to state explicitly what's true:

```text
MMU_RECOVER                            # Re-check sensors/filament position automatically
MMU_RECOVER TOOL=0                     # Tell Happy Hare T0 is selected; still auto-detect filament position
MMU_RECOVER TOOL=5 LOADED=1            # Tell Happy Hare T5 is selected and filament is loaded, ready to print
MMU_RECOVER TOOL=1 GATE=2 LOADED=0     # Tell Happy Hare T1 is serviced by gate 2, filament unloaded
```

Tool/gate selection is left alone unless you say otherwise - only the
filament position is what gets re-checked by default. Skip this entirely
if you only ever fixed things with Happy Hare's own commands; there's
nothing to recover in that case, and running it anyway just costs a little
time re-confirming what was already correct.

!!! note
    The default automatic recovery deliberately skips some invasive checks
    that could heat the extruder unexpectedly (e.g. confirming filament
    trapped in the extruder that a toolhead sensor didn't catch). Add
    `MMU_RECOVER STRICT=1` (or set `strict_filament_recovery: 1` in `mmu.cfg`)
    to force those extra checks when you specifically suspect that kind of
    problem.

Updating the [gate map or Tool-to-Gate map](Feature-Gate-TTG-Maps.md) is
sometimes the other half of recovery - e.g. after loading different
filament into a gate by hand, or correcting a mapping mistake.

## Resuming a Print

```text
RESUME
```

Runs your own resume logic, resets the heater timeout clocks Happy Hare set
on pause, and restores the toolhead to the correct position and z-height to
continue printing - automatically unlocking first if `MMU_UNLOCK` wasn't
already run.

## Debugging Problems

- Read `mmu.log` - it carries more detail than the console shows by
  default.
- `MMU_TEST_CONFIG log_level=2` temporarily raises console verbosity to
  debug for a richer running commentary; `MMU_TEST_CONFIG
  log_file_level=3` does the same for `mmu.log`, adding trace-level detail.
- Check your slicer's own gcode - Happy Hare has only limited visibility
  into what it's doing, and a mismatch (e.g. the slicer ejecting filament
  from the extruder when Happy Hare still expects it there) shows up as an
  MMU error even though the root cause is upstream. See
  Slicer Setup.
- Tackle one problem at a time - an MMU has a lot of moving parts (quite
  literally), and chasing several symptoms simultaneously rarely converges.

## See also

- [KlipperScreen](KlipperScreen.md) / [Mainsail / Fluidd](Mainsail-Fluidd-Integration.md) -
  the same operations from a touchscreen/web UI instead of the console
- [Custom Load/Unload Sequences](Custom-Load-Unload-Sequences.md) - the full
  state machine and step-command mechanism behind the load/unload overview
  above
- [Macro: Client](Macro-Client.md) - the cancel-behavior settings and
  pause/resume/cancel extension hooks behind the shipped client macros
- [Macro: State Change Hooks](Macro-State-Change-Hooks.md) - react to
  `print_state` transitions in custom macros
- [Printer Variable Reference](Reference-Printer-Variables.md#core-state) -
  the exposed `print_state` value
- [Command Reference: `MMU_RECOVER`](Reference-Commands.md#mmu_recover)
- [Command Reference: `MMU_STATUS`](Reference-Commands.md#mmu_status)
- [Feature: Gate/TTG Maps](Feature-Gate-TTG-Maps.md)

---
