# Developer Test Command

`_MMU_TEST` is Happy Hare's grab-bag developer command - one gcode command,
registered like any other, with roughly two dozen unrelated sub-tests
selected by which parameter you pass. Its own source comment calls the
tests "raw," and that's the right way to think about it: there's no
extra safety net beyond what's described below, and several sub-tests
exist specifically to *provoke* bugs rather than avoid them.

## Why it's hidden, not disabled

The leading underscore is Klipper's plain convention for "don't list this
in help" - it doesn't show up in `MMU_HELP`, and Happy Hare doesn't
document its parameters anywhere in the normal command flow. That's the
only thing hiding it: there's no separate developer-mode build flag, no
Kconfig option that has to be enabled first. `_MMU_TEST` is registered
and fully callable on **every** Happy Hare install, same as `MMU_LOAD` or
`MMU_STATUS`. The only real gate is the same one every command has -
`MMU ENABLE=1` if the unit is currently disabled.

Unlike every real command, `_MMU_TEST` is deliberately **excluded** from
the user-facing [Command Reference](Reference-Commands.md) - not something
a regular user should stumble onto while looking up a real command. Its
generated parameter list instead lives on [Developer Command
Reference](Dev-Command-Reference.md#_mmu_test), alongside the other
internal/developer-only commands. This page is the *why* and *when*,
grouped by how much you should trust running a given option without
thinking twice.

## Introspection - safe to run anytime

These just report state; none of them move anything.

```{.text .console-command}
_MMU_TEST GET_POS=1
```

```{.text .console-output}
Filament pos state: 4 (LOADED_ENCODER)
```

```{.text .console-command}
_MMU_TEST GET_POSITION=1
```

```{.text .console-output}
Filament position: 683.2
```

```{.text .console-command}
_MMU_TEST DUMP_ACTIVE_SENSORS=1
```

```{.text .console-output}
active_sensors={'mmu_gate_0': True, 'mmu_gate_1': False, ...}
```

```{.text .console-command}
_MMU_TEST DUMP_MCU_ENDSTOPS=1
```

```{.text .console-output}
mmu_gate_0(mmu:mmu,PA3,140234...)               Steppers: gear0
```

`SENSOR=1` dumps what the sensor manager believes is fitted before/after
a given filament position, without actually moving anything - useful for
working out why a load/unload logic branch didn't trigger the sensor
check you expected:

```{.text .console-command}
_MMU_TEST SENSOR=1 POS=4 GATE=0 LOADING=1
```

```{.text .console-output}
check_all_sensors_before(4,0)=True
sensors before=['mmu_gate_0']
check_all_sensors_after(4,0)=False
sensors after=[]
```

Two more worth knowing:

- **`UPDATE_STATUS={dict}`** overrides what `get_status()` reports to
  Mainsail/Fluidd/KlipperScreen with a hand-supplied dict, without
  touching any real state - handy for testing a UI panel's rendering of
  an edge-case status without physically reproducing it. `UPDATE_STATUS=OFF`
  removes the override.
- **`NFC_READ=1`** simulates a tag scan with no reader hardware attached
  at all, injecting at the exact point a real reader hands off - every
  reader-level guard is bypassed by construction, but the real downstream
  feature gates (`nfc_deep_read`, `spoolman_support`) still apply. Useful
  for exercising the NFC → Spoolman path on a bench with no tags or
  readers wired up: `_MMU_TEST NFC_READ=1 UID=E2003412 GATE=0 DEEP=1 MATERIAL=PETG`.

## Moves real hardware - bench-test it, don't run it mid-print

These genuinely turn motors, so treat them like any other motion
command: know where the selector and filament actually are before you
run one.

- **`WRAP_CURRENT=1`** exercises the gear/extruder current-wrapping
  context manager (`MOTOR=` `PERCENT=`) - nested calls, to confirm
  currents restore correctly when one wrap ends inside another.
- **`SEL_MOVE=1`** / **`SEL_HOMING_MOVE=1`** / **`SEL_LOAD_TEST=1`** drive
  the selector directly (`MOVE=`, `SPEED=`, `ACCEL=`, `LOOP=`), bypassing
  the higher-level gate-selection logic - for isolating a selector-only
  problem from everything built on top of it.
- **`SYNC_LOAD_TEST=1`** and **`REALISTIC_SYNC_TEST=1`** both hammer
  gear/extruder sync and movement in a loop with randomized parameters
  (`LOOP=`, `ENDSTOP=`, `SELECT=`, `SERVO=`/`WAIT=`) - the closest thing
  to a stress test in this command. Both need a hot extruder and either
  a toolhead sensor or an explicit `ENDSTOP=`; read the warning each one
  logs on startup before running it. `REALISTIC_SYNC_TEST` additionally
  cross-checks tracked position against reported position every loop and
  raises `MmuError` the moment they disagree.
- **`SET_POS=`**, **`SET_POSITION=`**, **`SET_ACTION=`**, **`FILAMENT_POS=`**,
  **`FILAMENT_DIR=`** force internal state directly - filament position
  state, raw filament position, the current action, and so on - without
  the movement or checks that would normally produce that state. Good
  for reaching a specific state to test a downstream code path; bad for
  anything that then assumes the physical filament matches what you just
  told Happy Hare.
- **`ADJUST_ENCODER=`**/**`SET_ENCODER=`** nudge or overwrite the
  encoder's tracked distance directly, independent of any real filament
  movement.

## Provokes known bugs on purpose - core-team debugging only

These exist to reproduce specific, already-known failure classes in
Happy Hare's stepper-sync/homing logic. They're not something a regular
contributor needs, and a couple have sharp edges:

- **`TTC_TEST=1`** / **`TTC_TEST2=1`** / **`TTC_TEST3=1`** each drive a
  different randomized homing/move pattern (`LOOP=`, `MIX=`, `DEBUG=`,
  `WAIT=`) specifically to try to provoke a Klipper "Too Then Close"
  (TTC) timing violation in the MMU/extruder stepper sync path.
- **`STEPCOMPRESS_TEST=1`** does the same for step-compression errors
  (`LOOP=`, `MOTOR=`, `STOP_ON_ENDSTOP=`), wrapping each move in
  `DebugStepperMovement` for extra diagnostics on failure.
- **`QUIESCE_TEST=1`** runs a fixed, hand-written sequence of sync/unsync
  transitions and raw extruder moves that has previously exposed
  "quiescing" bugs around sync-state changes. Needs a hot extruder and a
  toolhead sensor (or dummies).
- **`SYNC_STATE=`** (`compression`/`tension`/`both`/`neutral`) fabricates
  sync-feedback sensor events without touching real hardware, using
  temporary phony sensors if the real ones aren't fitted or enabled.
  **`SYNC_STATE=loop` is refused outright** - its result-gathering is a
  busy-wait that blocks the single reactor greenlet, so the events it's
  waiting for can never actually arrive. That's a real, permanent
  limitation of this test, not a bug to work around by retrying.

## Sequence timing, without a real print

**`RUN_SEQUENCE=1`** and **`RUN_CHANGE_SEQUENCE=1`** run through the
pre/post-unload and pre/post-load macro hooks (timing each phase via the
same statistics machinery a real toolchange uses) without an actual
print running. `RUN_CHANGE_SEQUENCE`'s `NEXT_POS=next` also exercises the
toolhead-parking/return-position logic. Both support `ERROR=`/`PAUSE=` to
force a mid-sequence failure and confirm the pause/statistics path
behaves. Useful for timing or debugging your own macro hooks (see [Macro
Customization](Macro-Customization.md)) without slicing and printing a
real file each time.

## Feeding fake telemetry to autotune

**`NOTE_LOAD_TELEMETRY=1`**/**`NOTE_UNLOAD_TELEMETRY=1`** call the same
calibrator methods a real load/unload calls at the end of its move, but
with hand-supplied `LENGTH=`/`TRAVEL=`/`RATIO=` numbers instead of a real
measurement - the only way to exercise
[`autotune_rotation_distance`](Calibration.md#autotuning-and-auto-calibration)'s
correction logic repeatedly without physically loading and unloading
filament every time. `TRAVEL` defaults to `LENGTH` (a bare call is inert
by design); name a different `TRAVEL` to provoke a specific correction.

## The rest

A handful of narrower one-offs, each self-contained:

| Parameter | What it does |
|---|---|
| `SYNC=` | Force a specific gear/extruder sync mode directly (`0-3` or a name) |
| `RUNOUT=` | Enable/disable runout arming for a gate, bypassing the normal flow |
| `CALC_PURGE=1` | Run the purge-volume-by-color calculator against a few fixed test cases |
| `SEND_PRINTING_EVENT=` | Fire the `mmu:printing`/`mmu:not_printing` event by hand |
| `ACTIVATE_FLOWGUARD=` | Call FlowGuard's activation/deactivation hooks directly |
| `DUMP_UNICODE=1` | Print every special glyph the console/log UI can render, for a font/terminal check |

## See also

- [Developer Command Reference: `_MMU_TEST`](Dev-Command-Reference.md#_mmu_test) - the full, generated parameter list
- [Testing](Dev-Testing.md) - the fake-Klipper harness `test_mmu_dev_test.py` runs this same command against; its coverage map notes what the harness can and can't model for the stress probes above
- [Code Layout](Dev-Code-Layout.md) - where `mmu_dev_test.py` sits among the other `commands/` modules
- [Calibration](Calibration.md) - `autotune_rotation_distance`, the setting `NOTE_LOAD_TELEMETRY`/`NOTE_UNLOAD_TELEMETRY` let you exercise by hand
