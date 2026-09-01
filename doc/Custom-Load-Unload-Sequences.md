# Custom Load/Unload Sequences

## Concept

Happy Hare's own internal logic handles filament loading and unloading for
every supported MMU design. For an unusual build that logic doesn't quite
fit, the whole load/unload sequence can be replaced with your own gcode
macros instead - built from the same composable movement commands the
internal logic itself is built from.

This is genuinely the deepest level of customization Happy Hare offers, and
it comes with a matching amount of responsibility: your macro becomes
responsible for handling every starting position filament could be in, and
for keeping Happy Hare's own idea of where the filament is in sync as it
moves. Reach for it only once the lighter option below doesn't cover what
you need.

!!! warning
    Rewriting the sequence is expert-level customization. Read this whole
    page - especially the state machine below - before changing anything,
    and keep a backup of a working config to fall back to.

## Two levels of customization

Most customization needs are met by a much lighter mechanism: a set of
callback macros that fire at fixed points around every load/unload,
regardless of any other setting on this page -
`_MMU_PRE_LOAD`, `_MMU_POST_LOAD`, `_MMU_PRE_UNLOAD`, `_MMU_POST_FORM_TIP`,
`_MMU_POST_UNLOAD`, `_MMU_POST_PRELOAD`, and `_MMU_ERROR`. Each one calls out
to a `user_*_extension` gcode macro variable defined in
`mmu_macro_vars.cfg` if you set one - the toolchange parking/z-hop/retract
behavior, timelapse-frame capture on load, and per-operation park
positions are all controlled through this same file's `_MMU_SEQUENCE_VARS`
section (see [Macro Variables: Sequence/parking](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars)
for the full list), without touching the sequence at all. This is the
right place to start: adding a nozzle-wipe after loading, or injecting
logic for an MMU-mounted cutter after unload, rarely needs more than one
of these hooks.

The sequence override covered by the rest of this page is the level below
that - a wholesale replacement of the movement logic itself, for a design
esoteric enough that the callback hooks genuinely aren't enough.

## The filament position state machine

Both the internal logic and any custom sequence macro track filament
position as a single state, exposed as
[`printer.mmu.filament_pos`](Reference-Printer-Variables.md#core-state). A custom
sequence must be able to complete correctly from *any* of these states -
especially on unload, which can be called with filament anywhere along the
path:

| Value | State | Notes |
|---|---|---|
| `-1` | `UNKNOWN` | |
| `0` | `UNLOADED` | |
| `1` | `HOMED_GATE` | Only reachable if a gate sensor is fitted |
| `2` | `START_BOWDEN` | |
| `3` | `IN_BOWDEN` | |
| `4` | `END_BOWDEN` | |
| `5` | `HOMED_ENTRY` | Only reachable if an extruder entry sensor is fitted |
| `6` | `HOMED_EXTRUDER` | |
| `7` | `PAST_EXTRUDER` | |
| `8` | `HOMED_TS` | Only reachable if a toolhead sensor is fitted |
| `9` | `IN_EXTRUDER` | Past the toolhead sensor |
| `10` | `LOADED` | Homed to the nozzle |

The state machine itself isn't extensible - a custom sequence works
entirely by calling the step commands below in the right order for a given
starting state, and explicitly setting the state as it goes. It also needs
to respect the context it's called with (for example, the requested
`LENGTH` may come from a test-load call, not a real toolchange) - the
default sequence below is the reference for how to do that correctly.

## The default sequence macros

`_MMU_LOAD_SEQUENCE` and `_MMU_UNLOAD_SEQUENCE`, shipped in
`mmu_sequence.cfg`, reproduce the internal logic exactly using the same
composable step commands documented below - they exist as a working
starting point to copy and adapt, not as macros you're expected to edit in
place (the file is treated as read-only and gets overwritten on upgrade).

The load sequence branches on how far the filament already got, then walks
forward through the remaining steps:

```text
_MMU_STEP_LOAD_GATE                      # only if fully unloaded
_MMU_STEP_LOAD_BOWDEN LENGTH={length}    # only if short of the end of the bowden
_MMU_STEP_HOME_EXTRUDER                  # only if HOME_EXTRUDER=1 and not yet homed
_MMU_STEP_LOAD_TOOLHEAD                  # only if not SKIP_EXTRUDER=1
```

The unload sequence is the mirror image, but has to additionally decide
*how much* homing precision it can afford depending on how well the current
position is actually known:

```text
_MMU_STEP_UNLOAD_TOOLHEAD PARK_POS={park_pos}   # only if past the extruder
_MMU_STEP_UNLOAD_BOWDEN LENGTH={length}         # fast unload, if position is well known (>= END_BOWDEN)
_MMU_STEP_UNLOAD_GATE                           # ...then park in the gate
# or, if position is only loosely known (>= START_BOWDEN but < END_BOWDEN):
_MMU_STEP_UNLOAD_GATE FULL=1                    # slower full-homing unload instead, since exact position is unknown
```

!!! note
    The shipped `_MMU_UNLOAD_SEQUENCE` passes `FULL=1` to
    `_MMU_STEP_UNLOAD_BOWDEN` in the fast-unload branch above.
    `_MMU_STEP_UNLOAD_BOWDEN` doesn't have a `FULL` parameter (only
    `LENGTH`) - see the step reference below - so that argument is
    currently just ignored. Harmless as shipped (the step already runs at
    its default calibrated length either way), but worth knowing if you're
    reading this macro closely enough to copy it.

`EXTRUDER_ONLY=1` (used for bypass operation) short-circuits both sequences
to touch only the toolhead step, skipping the gate/bowden steps entirely.

## Step command reference

Every step command is a real, independently callable `MMU_*` command -
full parameters for each live in the [Developer Command
Reference](Dev-Command-Reference.md), not repeated here.

| Command | Purpose |
|---|---|
| [`_MMU_STEP_LOAD_GATE`](Dev-Command-Reference.md#_mmu_step_load_gate) | Move filament from the gate to the start of the bowden |
| [`_MMU_STEP_UNLOAD_GATE`](Dev-Command-Reference.md#_mmu_step_unload_gate) | Move filament from the start of the bowden back to parked in the gate |
| [`_MMU_STEP_LOAD_BOWDEN`](Dev-Command-Reference.md#_mmu_step_load_bowden) | Smart bowden load, to the calibrated length or an override |
| [`_MMU_STEP_UNLOAD_BOWDEN`](Dev-Command-Reference.md#_mmu_step_unload_bowden) | Smart bowden unload |
| [`_MMU_STEP_HOME_EXTRUDER`](Dev-Command-Reference.md#_mmu_step_home_extruder) | Home to the extruder entrance, by sensor or collision detection |
| [`_MMU_STEP_LOAD_TOOLHEAD`](Dev-Command-Reference.md#_mmu_step_load_toolhead) | Load from the extruder entrance to the nozzle |
| [`_MMU_STEP_UNLOAD_TOOLHEAD`](Dev-Command-Reference.md#_mmu_step_unload_toolhead) | Unload from the nozzle back to the extruder entrance |
| [`_MMU_STEP_HOMING_MOVE`](Dev-Command-Reference.md#_mmu_step_homing_move) | Generic homing move on any motor/endstop combination |
| [`_MMU_STEP_MOVE`](Dev-Command-Reference.md#_mmu_step_move) | Generic (non-homing) move on any motor combination |
| [`_MMU_STEP_SET_FILAMENT`](Dev-Command-Reference.md#_mmu_step_set_filament) | Directly set the filament position state - required bookkeeping any time a custom sequence's moves diverge from the defaults above |
| [`_MMU_STEP_SET_ACTION`](Dev-Command-Reference.md#_mmu_step_set_action) | Set (and later restore) the `printer.mmu.action` status field, so UI feedback stays accurate during a custom sequence |

## Worked alternative examples

Two further examples live commented-out at the end of `mmu_sequence.cfg`,
past the default sequences - both replace only the loading side, using more
direct homing methods than the default's sensor/entry-based approach.

**Homing to a toolhead sensor**, with the gear and extruder synchronized for
the final approach:

```text
_MMU_STEP_LOAD_GATE
_MMU_STEP_LOAD_BOWDEN LENGTH={length}
_MMU_STEP_HOMING_MOVE ENDSTOP=toolhead MOVE=50 MOTOR=gear+extruder
_MMU_STEP_SET_FILAMENT STATE=8     # HOMED_TS
_MMU_STEP_MOVE MOVE=62 MOTOR=gear+extruder
_MMU_STEP_SET_FILAMENT STATE=10    # LOADED
```

**Homing on stallguard directly to the nozzle**, skipping a toolhead sensor
entirely (needs an `mmu_ext_touch` endstop defined on the extruder stepper):

```text
_MMU_STEP_LOAD_GATE
_MMU_STEP_LOAD_BOWDEN LENGTH={length}
_MMU_STEP_HOMING_MOVE ENDSTOP=mmu_ext_touch MOVE=100 MOTOR=extruder
_MMU_STEP_SET_FILAMENT STATE=10    # LOADED
```

!!! note
    The shipped `mmu_sequence.cfg`'s own commented-out version of this
    example uses `MOTOR=extruder+gear` - not one of `_MMU_STEP_HOMING_MOVE`'s
    three valid `MOTOR=` values (`gear`, `extruder`, `gear+extruder`,
    checked directly against the command's own source), so running it as
    shipped raises "Valid motor names are..." rather than homing. It's also
    the wrong choice even corrected to `gear+extruder` - `mmu_ext_touch` is
    a stallguard (virtual) endstop on the extruder, and Happy Hare's own
    move-tracing docstring calls it out as "only useful for motor=extruder"
    specifically; synced motion isn't what triggers it. A stale leftover in
    Happy Hare's own reference macro either way, not a wiki or doc error
    this time - use `MOTOR=extruder` alone, as shown above.

Two related gotchas worth knowing before writing a homing move of your own:
which endstops are even valid for a given `MOTOR=` depends on which
stepper(s) it drives - `toolhead`/`extruder` endstops work with any `MOTOR=`
that includes gear or extruder, but the two stallguard endstops are each
tied to one specific stepper alone (`mmu_gear_touch` to `MOTOR=gear`,
`mmu_ext_touch` to `MOTOR=extruder`), not to a synced combination of the
two. And a virtual (stallguard) endstop can only home in the extrude
direction - `STOP_ON_ENDSTOP=-1` (retract) is rejected outright ("Cannot
reverse home on virtual (TMC stallguard) endstop"), unlike a real physical
switch.

Both examples still lean on the same `_MMU_STEP_LOAD_GATE`/`_MMU_STEP_LOAD_BOWDEN`
building blocks for everything before the toolhead - a custom sequence
rarely needs to reinvent gate/bowden handling, only the toolhead-entry
portion that's actually unusual about the build.

## Enabling a custom sequence

Once you have a replacement `_MMU_LOAD_SEQUENCE`/`_MMU_UNLOAD_SEQUENCE`
defined in your own config (define your own copies, don't edit
`mmu_sequence.cfg` in place - it's overwritten on upgrade), switch it on:

```ini
gcode_load_sequence   : 1   # 1 = use the macro sequence, 0 = internal logic (default)
gcode_unload_sequence : 1
```

Both live in `mmu.cfg`'s shared parameters - see
[Parameters](Reference-Parameters.md#misc). If you renamed the macros themselves,
point Happy Hare at the new names with `load_sequence_macro`/
`unload_sequence_macro`, also in `mmu.cfg`.

## Troubleshooting

- **`MMU_STATUS`/`printer.mmu.filament_pos` looks wrong after a custom
  move** - a step in your sequence changed the filament's real position
  without a matching `_MMU_STEP_SET_FILAMENT` call; every move needs the
  state kept in sync explicitly, it's never inferred.
- **A raised "already loaded"/"already unloaded" error from your own
  sequence** - copy the default sequences' pattern of checking
  `FILAMENT_POS` first and raising early, rather than letting a step
  command fail deep into a move.
- **Works for a real toolchange but fails during calibration/testing** -
  the sequence macros are also called for test loads, which can pass a
  different `LENGTH` than a real toolchange would; make sure the macro
  actually uses the passed parameters rather than a hardcoded assumption.

## See also

- [Developer Command Reference](Dev-Command-Reference.md) - full parameters for every
  `_MMU_STEP_*` command
- [Parameters](Reference-Parameters.md#macros) - the lighter-weight callback macro
  settings, and the `gcode_load_sequence`/`gcode_unload_sequence` toggle
- [Macro Variables: Sequence/parking](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars) -
  every `_MMU_SEQUENCE_VARS` tuning knob (parking positions, z-hop, retract,
  extension hooks) in full
- [Printer Variables: Core state](Reference-Printer-Variables.md#core-state) - the
  `filament_pos` field this page's state machine describes

---

