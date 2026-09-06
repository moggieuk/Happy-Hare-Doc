# Printer Variable Reference

Happy Hare exposes its internal state as Klipper "printer variables" - the
`printer.mmu.xxx` values you read in `gcode_macro` Jinja templates, in
`{% if %}` conditions, or from KlipperScreen/Mainsail/Fluidd panels.

If you just want to see live values on your own printer rather than read
about them, skip to [MMU_DUMP_VARS](#mmu_dump_vars) below.

## MMU_DUMP_VARS

`MMU_DUMP_VARS` (a gcode macro, not a Python command) dumps every printer
variable this page describes, straight off the running printer:

```text
MMU_DUMP_VARS
MMU_DUMP_VARS VERBOSE=1   # also include per-stepper and per-LED-segment objects
```

It works by asking Klipper's own `printer` object for every top-level name
matching a small set of prefixes - `mmu`, `mmu_machine`, `mmu_encoder *`,
`mmu_extruder *`, and with `VERBOSE=1` also `mmu_stepper *`, `mmu_leds *` -
then prints every key inside each as `printer['name'].key = value`. That
search list is itself the ground truth for which top-level printer objects
Happy Hare registers; see
[Directly-registered per-object status](#directly-registered-per-object-status)
below for what the non-`mmu`/`mmu_machine` ones are.

Because it reads `printer` directly, its output is always exactly correct for
your installed version - use it to check anything below that seems to
disagree with what you actually see.

## `printer.mmu`

The main status object. Everything in this section is `printer.mmu.<key>`
unless noted.

### Core state

| Variable | Type | Meaning |
|---|---|---|
| `enabled` | bool | Happy Hare is enabled (`MMU ENABLE=1`/`0`) |
| `num_gates` | int | Total gates across all units |
| `is_homed` | bool | True only when **every** unit's selector is homed |
| `print_state` | string | `initialized` \| `standby` \| `idle` \| `started` \| `printing` \| `pause_locked` \| `paused` \| `complete` \| `cancelled` \| `error` \| `ready` |
| `unit` | int | Currently selected unit, `-1` if none |
| `tool` | int | Currently selected tool, `-1` unknown, `-2` bypass |
| `gate` | int | Currently selected gate (or the gate about to be selected, mid-toolchange), `-1` unknown |
| `active_filament` | dict | `filament_name`, `material`, `vendor`, `color`, `spool_id`, `temperature` for the current gate; `{}` if none selected |
| `num_toolchanges` | int | Toolchanges performed so far this print |
| `last_tool` / `next_tool` | int | Tool indices either side of an in-progress toolchange |
| `slicer_purge` | float | Slicer-supplied purge volume for the in-progress toolchange |
| `toolchange_purge_volume` | float | Suggested purge volume (mm³) for the current toolchange |
| `last_toolchange` | string | Short description, similar to the `M117` display |
| `operation` | string | `''` \| `load` \| `unload` \| `toolchange` \| `runout` \| `pause` \| `cancel` \| `complete` |
| `filament` | string | `Loaded` \| `Unloaded` \| `Unknown` - coarse summary of `filament_pos` |
| `filament_position` | float | Filament position in mm along the current move |
| `filament_pos` | int | Fine-grained filament position, `-1` unknown to `10` fully loaded in the extruder (11 named positions in total) |
| `filament_direction` | int | `1` load, `-1` unload, `0` unknown |
| `pending_spool_id` | int | Spoolman spool ID that will auto-assign to the next filament inserted, `-1` if none pending |
| `tool_extrusion_multipliers` / `tool_speed_multipliers` | list[float] | Current `M221`/`M220` multipliers, one per tool |
| `action` | string | `Idle` \| `Loading` \| `Unloading` \| `Loading Ext` \| `Exiting Ext` \| `Forming Tip` \| `Cutting Tip` \| `Heating` \| `Checking` \| `Homing` \| `Selecting` \| `Cutting Filament` \| `Purging` \| `Preload` \| `Unknown` |
| `sync_drive` | bool | Gear stepper currently synced to the extruder |
| `reason_for_pause` | string | Why the MMU is paused; `''` when not paused |
| `spoolman_support` | string | `off` \| `readonly` \| `push` \| `pull` |
| `bowden_progress` | int | 0-100% while a bowden move is in progress, `-1` otherwise |
| `print_start_detection` | bool | Whether Happy Hare auto-detects print start (for slicers/wrappers like Klippain that don't call the MMU print-start hook) |

### Gate and tool maps

All per-gate lists here are indexed by the same global gate number used
everywhere else (contiguous across units, see `printer.mmu_machine` below).

| Variable | Type | Meaning |
|---|---|---|
| `ttg_map` | list[int] | Gate assigned to each tool |
| `endless_spool_groups` | list[int] | EndlessSpool group membership per tool |
| `endless_spool_enabled` | int | `0` off, `1` on |
| `gate_status` | list[int] | Per gate: `-1` unknown, `0` empty, `1` available, `2` available from buffer |
| `gate_filament_name` | list[string] | Filament name per gate |
| `gate_material` | list[string] | Material per gate |
| `gate_vendor` | list[string] | Filament vendor per gate |
| `gate_color` | list[string] | Color name per gate |
| `gate_temperature` | list[int] | Print temperature per gate |
| `gate_spool_id` | list[int] | Spoolman spool ID per gate |
| `gate_speed_override` | list[int] | Per-gate speed override (%) |
| `gate_spool_rfid` | list | Per-gate RFID/NFC tag UID, if read |
| `gate_color_rgb` | list[tuple] | `(r, g, b)` floats `0.0`-`1.0` per gate |
| `slicer_tool_map` | dict | See below |
| `slicer_color_rgb` | list[tuple] | `(r, g, b)` floats `0.0`-`1.0`, slicer-supplied, one per gate |

`slicer_tool_map` shape:

```text
slicer_tool_map
  .tools.<tool_num>
    .name         {string}  filament name
    .color        {string}  "RRGGBB" or "RRGGBBAA", no leading #
    .material     {string}  material type
    .temp         {int}     print temperature
    .in_use       {bool}    referenced by this print
  .referenced_tools    {list}  tool numbers used in this print
  .initial_tool        {int}
  .purge_volumes       {list}  N×N purge volume matrix
  .total_toolchanges   {int}
  .skip_automap        {bool}  one-shot: skip automap for this print
```

### Extruder / filament remaining

| Variable | Type | Meaning |
|---|---|---|
| `extruder_filament_remaining` | float | Residual + cut filament left in the extruder, including any configured `toolhead_residual_filament` |
| `filament_remaining` | float | Same, without the configured residual constant |
| `filament_remaining_color` | string | Color of that residual filament, for UI display |

### Sync feedback, FlowGuard and tangle prevention

Present when the active unit has a sync-feedback buffer and/or an encoder;
`{}` on a unit with neither.

| Variable | Type | Meaning |
|---|---|---|
| `sync_feedback_state` | string | `compressed` \| `expanded` \| `neutral` \| `disabled` |
| `sync_feedback_enabled` | bool | Sync feedback currently active |
| `sync_feedback_bias_raw` | float | Raw sensor bias, rounded to 2dp |
| `sync_feedback_bias_modelled` | float | Modelled/smoothed bias, rounded to 2dp |
| `sync_feedback_flow_rate` | float | Flow rate as seen by the buffer |
| `flowguard` | dict | `trigger`, `reason`, `level`, `max_clog`, `max_tangle`, `active`, `enabled`, and `encoder_mode` when an encoder is fitted |
| `tangle_prevention` | dict | `enabled`, `active`, `boosted`, `threshold`, `release` |

### Sensors

`sensors` is a dict keyed by sensor name, scoped to whichever sensors are
active for the currently selected gate (generic names, no gate suffix):
value is `True`/`False` if the sensor is enabled (triggered or not), or
`None` if the sensor exists but is currently disabled - see [Feature:
Sensors](Feature-Sensors.md) for how a sensor gets disabled and what that
means for the rest of Happy Hare.

### Encoder

`encoder` is only present when the active unit has one:

| Variable | Type | Meaning |
|---|---|---|
| `encoder_pos` | float | Encoder position in mm |
| `detection_length` | float | Clog-detection length |
| `min_headroom` | float | Closest clog detection came to firing on the current toolchange |
| `headroom` | float | Current headroom (distance from the trigger point) |
| `desired_headroom` | float | Configured target headroom |
| `detection_mode` | int | Clog detection mode |
| `enabled` | bool | Encoder currently enabled for clog detection |
| `flow_rate` | int | % flow rate (extruder movement vs. encoder movement) |

### Per-gate arrays merged across every unit

| Variable | Type | Meaning |
|---|---|---|
| `espooler` | list[string] | Per gate: `''` \| `off` \| `rewind` \| `assist` \| `print` - gates on a unit with no espooler report `''` |
| `drying_state` | list[string] | Per gate: `''` \| `queued` \| `active` \| `complete` \| `canceled` - gates not currently part of a drying cycle report `''` |

### NFC

`nfc` is a **list of per-unit dicts**, present only when at least one unit has
an NFC/RFID reader configured. Each entry:
`{'unit': <name>, 'polling': <bool>, 'shared': {...}|None, 'gates': {<gate>: {...}}}`,
where each reader dict is `enabled`, `active`, `alive`, `present`, `uid` (the
cached tag from the last read, not a live scan).

## `printer.mmu_machine`

The multi-unit aggregation object. `is_homed`, `unit`, `tool` etc. above
already account for multiple units; this object is for enumerating the units
themselves.

| Variable | Type | Meaning |
|---|---|---|
| `happy_hare_version` | string | Installed Happy Hare version in `<major>.<minor>.<point>` form, for example `4.0.0` |
| `num_units` | int | Number of configured `mmu_unit`s |
| `num_gates` | int | Total gates, same value as `printer.mmu.num_gates` |
| `unit_0`, `unit_1`, ... | dict | One entry per unit, see below |

Each `unit_N` dict:

| Key | Type | Meaning |
|---|---|---|
| `name`, `display_name` | string | Config name and human-readable name |
| `vendor`, `version` | string | For example `ERCF`, `1.1sb` |
| `num_gates`, `first_gate` | int | Gate count and this unit's first *global* gate number |
| `selector_type` | string | For example `LinearSelector`, `IndexedSelector`, `RotarySelector`, `ServoSelector`, `VirtualSelector` |
| `is_homed` | bool | This unit's selector only |
| `variable_rotation_distances`, `variable_bowden_lengths` | bool | Whether per-gate calibration is used |
| `require_bowden_move` | bool | Whether this unit's geometry has a bowden move at all |
| `filament_always_gripped` | bool | True for designs with no release mechanism |
| `has_bypass` | bool | This unit has a selectable bypass gate |
| `can_crossload` | bool | Filament can be pushed directly between gates on this unit |
| `multi_gear` | bool | Unit has one gear motor per gate rather than one shared |
| `filament_buffer` | bool | Filament (catchment) buffer fitted - catches loose filament on rewind, allowing faster loading speeds |
| `environment_sensor`, `filament_heater` | string | Shared object names; present only when shared sensor/heater configuration is used |
| `environment_sensors`, `filament_heaters` | list[string] | Per-gate object names; present only when per-gate sensor/heater configuration is used |
| `nfc_reader` | string | Shared reader name; present only when configured |
| `nfc_readers` | list[string] | Per-gate reader names; present only when configured |

## Directly-registered per-object status

A handful of components are registered as their own top-level Klipper printer
objects (in addition to being folded into `printer.mmu` above), named after
their config section - exactly the names `MMU_DUMP_VARS` searches for:

| Printer object | Config section | Notes |
|---|---|---|
| `printer['mmu_encoder <name>']` | `[mmu_encoder unit0]` | If fitted |
| `printer['mmu_extruder <name>']` | wraps the Klipper extruder it's bound to, e.g. `mmu_extruder extruder` | |
| `printer['mmu_stepper <name>']` | `[mmu_stepper unit0_gear]` etc. | One per gear/selector stepper |
| `printer['mmu_leds <name>']` | `[mmu_leds unit0]` | If fitted |

Use `printer.mmu.encoder` for the common case (current unit's encoder, already
resolved); reach for `printer['mmu_encoder unit0']` directly only when you
specifically need a *different* unit's encoder than the one currently active,
since Happy Hare units can have independent, differently-named encoders.

## Deprecated variables

Still present in `printer.mmu`, still computed, but superseded.

| Variable | Replaced by |
|---|---|
| `espooler_active` | `espooler` (per-gate list) |
| `runout` | `operation == "runout"` |
| `is_paused` | `print_state` |
| `is_locked` | `print_state` (alias of `is_paused`) |
| `is_in_print` | `print_state` |
| `has_bypass` (on `printer.mmu`) | `printer.mmu_machine.unit_N.has_bypass` |
| `clog_detection` | (removed capability) |
| `clog_detection_enabled` | (removed capability) |
| `endless_spool` (in the gate-map group) | `endless_spool_enabled` |

## See also

- [Developer: Klipper Events](Dev-Klipper-Events.md)

---
