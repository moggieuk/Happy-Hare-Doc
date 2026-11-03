# Feature: State Persistence

## Concept

Almost everything Happy Hare tracks survives a restart: which gate is
selected, how far filament is loaded, the gate map, the TTG map,
EndlessSpool groups, statistics, and calibration - even the selector's
physical position, so a design that needs homing doesn't have to re-home on
every restart. This is a genuine time-saver, but it comes with one
responsibility: if you physically touch the MMU while it's powered off
(swap a spool, move the selector by hand), the saved state no longer
matches reality until you correct it - with
[`MMU_RECOVER`](Reference-Commands.md#mmu_recover), or by re-homing with
[`MMU_HOME`](Reference-Commands.md#mmu_home).

Happy Hare helps here where it can: on startup, if fitted sensors (an
extruder-entry sensor especially) disagree with the saved filament
position, it automatically reconciles state to match what the sensors
actually report, rather than trusting a stale save blindly.

Everything persisted lives in the file used by Klipper's `[save_variables]`
object, normally `mmu_vars.cfg`. Klipper uses one variables file, which can also
hold your own saved variables. Changes are
batched and written out shortly after they happen, rather than on every
single update. On startup, Happy Hare checks the file for a sanity-check
marker before trusting it, and refuses to start with a clear error if that
check fails, rather than silently running with an empty or corrupted state.

!!! note
    The file can be edited by hand if you really need to, but treat it
    carefully - a corrupted or malformed entry can stop Happy Hare from
    starting at all.

### Changing units and gate counts

Saved spool assignments, filament attributes, tool mappings, EndlessSpool groups
and sensor disables follow surviving units and their local gates when units
are renamed or reordered, or gate counts change. New gates receive defaults;
removed gates lose their data. Selection is retained only if its gate identity
and global index survive and the tool is still valid. Unload before changes
that renumber gates.

Record renames through the installer rather than editing unit names by hand.
The installer records the intended change in configuration; Happy Hare migrates
the actual loaded saved state at startup. Ambiguous unrecorded renames or a
saved migration checkpoint absent from the configuration history stop startup
instead of guessing spool assignments. Restore matching configuration and
saved state together. See [Multiple MMU Units](GettingStarted-Multi-Unit.md#backups-and-saved-state).

### Using your own variables file

If your printer already defines `[save_variables]`, enable **Use your own
[save_variables]?** in **Paths & Services**, and set **save_variables path** to
the same `filename` as your section. Happy Hare then omits its generated
section. Keep the path and your section consistent; duplicate sections otherwise
merge and the last `filename` wins.

## Startup status

Setting `log_startup_status: 1` in `mmu_parameters.cfg` (or running
[`MMU_STATUS`](Reference-Commands.md#mmu_status) at any time) shows a visual
summary of exactly what was recovered:

```{.text .console-output}
Unit : -------------------- unit0 ---------------------|
Gate :  |0  |1  |2  |3  |4  |5  |6  |7  |8  |
Tools:  |T0 |T1 |T2 |T4 | - |T5 |T6 |T7 |T8 |
Avail:  | B | B | S | ? | - | ? | W | ? | B |
Selct: ~~~~~~~~~~~~~~~~~~~~[T2]~~~~~~~~~~~~~~~~~~~~
MMU [T2] >>> [En] >>>>>>> [Ex] >> [Ts] >> [Nz] LOADED (@0.0 mm)
```

This example: filament is loaded and available in gates 0-2, 6 and 8; gate 2
is currently selected (and remapped to `T2`, most likely because it was
loaded into what the slicer thinks is a different tool); gate 6 is
configured as a waste/eject gate (`W`); gates 3-5 and 7 haven't been loaded
yet this session (`?`) or are genuinely empty (`-`); and filament is fully
loaded all the way to the nozzle. `S` means filament is being pulled
straight from the spool (slower first load), `B` means it's already
buffered from a previous load/unload (faster). On a multi-unit machine each
unit gets its own block in this display, side by side.

## Commands

Resetting specific pieces of state, rather than everything:

```text
MMU_RESET CONFIRM=1           # Reset gate/TTG/EndlessSpool maps and current selection/position back to defaults
MMU_STATS RESET=1             # Reset swap and gate statistics only (not consumption counters - see below)
MMU_TTG_MAP RESET=1           # Reset just the tool-to-gate mapping
MMU_ENDLESS_SPOOL RESET=1     # Reset just the EndlessSpool groups
MMU_GATE_MAP RESET=1          # Reset filament type/color/availability for every gate
MMU_RECOVER                   # Reconcile saved state against what's actually loaded (see Troubleshooting)
```

Full parameter reference: [`MMU_RESET`](Reference-Commands.md#mmu_reset). It
requires `CONFIRM=1` - without it, nothing happens beyond a warning, since
this clears a lot of state at once. It deliberately leaves swap/gate
statistics and consumption counters alone -
[`MMU_STATS RESET=1`](Feature-Statistics-Counters.md) is the separate
command for those.

[`MMU_CHECK_GATE`](Reference-Commands.md#mmu_check_gate) is the other
command worth knowing here - it physically inspects gates (all, or a
selection) for filament presence and updates their recorded availability,
which is the practical way to reconcile the saved gate map against reality
after handling the MMU while it was off.

## Tuning

Defaults for the maps above can be preset in `mmu.cfg`, so a reset restores
*your* starting point rather than a blank one:

```ini
default_gate_status          : 1, 0, 1, 2, 2, -1, -1, 0, 1
default_gate_vendor          : eSun, Prusa, ...
default_gate_filament_name   : one, two, three, ...
default_gate_material        : PLA, ABS, ABS, ...
default_gate_color           : red, black, yellow, ...
default_gate_temperature     : 210, 240, 235, ...
default_gate_spool_id        : 3, 2, 1, ...
default_gate_speed_override  : 100, 100, 100, ...
default_ttg_map              : 0, 1, 2, 3, ...
default_endless_spool_groups : 0, 1, 2, 3, ...
```

Each list's length must match your gate count. Left commented out (the
default), a reset falls back to plain pass-through: every tool maps to the
gate of the same number, every gate's status is unknown, and every gate is
in its own EndlessSpool group (i.e. not grouped with anything).

For a design with a physical selector, `startup_home_selector: 1` in
`mmu_parameters.cfg` forces a home on startup if nothing is currently
loaded, then reselects whichever gate was last in use - useful if you'd
rather always start from a known physical position than trust the saved
one. Leaving it at the default (`0`) trusts the saved selector position
instead, which is what makes homing-on-every-restart unnecessary in the
first place; running [`MMU_MOTORS_OFF`](Reference-Commands.md#mmu_motors_off)
explicitly discards that saved position and does force a re-home next time
the selector needs to move. `startup_reset_ttg_map` (also
`mmu_parameters.cfg`) resets the TTG map on every startup if you'd rather
never carry a remap between sessions.

## Troubleshooting

- **The MMU was touched while powered off, and the saved state is wrong** -
  run [`MMU_RECOVER`](Reference-Commands.md#mmu_recover) to reconcile it, or
  [`MMU_CHECK_GATE`](Reference-Commands.md#mmu_check_gate) to physically
  re-inspect gates and refresh their availability.
- **Startup automatically changed the recovered state** - this is Happy
  Hare noticing a mismatch between the saved filament position and what a
  fitted sensor (extruder entry, most commonly) actually reports, and
  correcting itself rather than trusting a stale save - not a fault.
- **Klipper rejects an old statistics entry containing `np.float64(...)`** -
  back up the variables file, then replace those wrappers with plain numeric
  values or remove the affected statistics entry. New saves use plain numbers,
  but Klipper rejects an already-corrupted file before Happy Hare can repair it.

- **A gate seems permanently unreachable** - remember tools can be remapped
  many-to-one (deliberately, e.g. for a monochrome print); check the TTG map
  isn't why a gate looks unused.
- **Don't confuse this with `MMU_DUMP_VARS`** - that dumps the *live*
  in-memory printer status object (see [Printer
  Variables](Reference-Printer-Variables.md)), not the persisted file this page
  describes; they usually agree, but only the persisted file survives a
  restart.

## See also

- [Command Reference: `MMU_RESET`](Reference-Commands.md#mmu_reset)
- [Command Reference: `MMU_RECOVER`](Reference-Commands.md#mmu_recover)
- [Command Reference: `MMU_CHECK_GATE`](Reference-Commands.md#mmu_check_gate)
- [Command Reference: `MMU_STATUS`](Reference-Commands.md#mmu_status)
- [Feature: Gate/TTG Maps](Feature-Gate-TTG-Maps.md)
- [Feature: EndlessSpool & Runout Detection](Feature-Endless-Spool-Runout.md)
- [Feature: Statistics & Consumption Counters](Feature-Statistics-Counters.md)
- [Printer Variables](Reference-Printer-Variables.md) - the live equivalent of the state this page persists

---

