# Understanding MMU State

Before moving filament or recovering from a problem, it helps to separate
four questions:

| Question | Command |
|---|---|
| What machine is active, what does Happy Hare believe, and which movement sequences will it use? | [`MMU_STATUS SHOWCONFIG=1`](Reference-Commands.md#mmu_status) |
| What filament does Happy Hare believe is in each physical gate? | [`MMU_GATE_MAP`](Reference-Commands.md#mmu_gate_map) |
| Which physical gate will each logical tool use? | [`MMU_TTG_MAP`](Reference-Commands.md#mmu_ttg_map) |
| What are the fitted filament sensors reporting right now? | [`MMU_SENSORS`](Reference-Commands.md#mmu_sensors) |

Run without any modifying parameters, all four are read-only reports. Taken
together, they distinguish a configuration problem from an incorrect map,
stale tracked state, or a physical sensor that disagrees with reality.

!!! tip
    Run `MMU_STATUS SHOWCONFIG=1` after changing a setting with
    `MMU_TEST_CONFIG`, or after enabling or disabling a sensor. Its preload,
    load, and unload descriptions are calculated from the configuration and
    sensor availability currently in effect, so they show the resulting
    behavior rather than merely listing settings.

## A Box Turtle snapshot

The following snapshot is from a four-gate Box Turtle. T0 and gate 0 are
selected, filament is preloaded and parked in every gate, and no filament is
loaded into the bowden or extruder. Your report will differ with the MMU
design, fitted sensors, calibration, maps, and current filament position.

### Machine state and configured sequences

```{.text .console-command}
MMU_STATUS SHOWCONFIG=1
```

```{.text .console-output}
MMU: Happy Hare v4.0.0 controlling 1 units:
● BoxTurtle-0, a BoxTurtle v1.0 (gates 0-3)
└ Connected to extruder: extruder
└ Selector Type: VirtualSelector.

Print state is INITIALIZED. Tool T0 selected on gate #0
MMU gear stepper at 100% current and is NOT SYNCED to extruder
Sync feedback indicates filament in bowden is: TENSION (not currently active)
Filament positon believed to be: UNLOADED AND PARKED

PRELOAD SEQUENCE:
- Filament preloads by homing a maximum of 200.0mm (gate_preload_homing_max) to MMU_EXIT sensor, with up to 2 attempts
- Filament is parked by moving 10.0mm (gate_preload_parking_distance) from the preload endstop
- RFID/NFC scanning during preload is OFF; no per-gate readers are configured

LOAD SEQUENCE:
- Filament loads into gate from parked position by homing a maximum of 300.0mm (gate_homing_max) to mmu_shared_exit sensor
- Bowden is loaded with a fast 680.0mm (calibrated_bowden_length:700.0 - bowden_load_homing_buffer:20.0) move
- Filament finds extruder entrance by homing a maximum of 120.0mm (bowden_load_homing_buffer:20.0 + extruder_homing_max:100.0) to FILAMENT_COMPRESSION sensor and then moving -4.0mm (buffer_range:8.0 / 2) to center sync-feedback buffer
- Extruder (synced) loads by moving 68.0mm (toolhead_extruder_to_nozzle:72.0 - toolhead_residual_filament:2.0 - toolhead_ooze_reduction:0.0 - toolchange_retract:2.0 - filament_remaining:0.0) to the nozzle
- Purging is always managed by Happy Hare using '_MMU_PURGE' macro with extruder purging current of 100%
- Filament in bowden will be adjusted a maximum of 8.0mm to neutralize tension

UNLOAD SEQUENCE:
- Tip is always formed by Happy Hare using '_MMU_FORM_TIP' macro after initial retract of 2.0mm (toolchange_retract) with extruder current of 100%
- Extruder (optionally synced) unloads by moving 82.0mm (toolhead_extruder_to_nozzle:72.0 + toolhead_unload_safety_margin:10.0) less tip-cutting reported park position to exit extruder
- Bowden is unloaded with a fast 660.0mm (calibrated_bowden_length:700.0 - bowden_unload_homing_buffer:40.0) move
- Filament finds gate by homing a maximum of 340.0mm (bowden_unload_homing_buffer:40.0 + gate_homing_max:300.0) to mmu_shared_exit sensor
- Filament is parked by moving -100.0mm (gate_parking_distance) from the gate endstop (mmu_shared_exit sensor)

For details on TTG and EndlessSpool groups add 'DETAIL=1'

Gate : | 0 | 1 | 2 | 3 |
Tools: |T0 |T1 |T2 |T3 |
Avail: |■■■|■■■|■■■|■■■|
Selct: |\▼/|~~~~~~~~~~~~ T0
[T0] ■◉■■◉■┈◯┈┈┈┈┈┈┈┈ [◁ ▷] ┈┈┈┈┈┈┈Ex┈┈┈┈┈┈┈┤Nz UNLOADED 50.0mm
```

The report has three layers:

- **Machine and active state** identifies the MMU unit, attached extruder,
  selector type, print state, selection, motor synchronization, sync-feedback
  state, and tracked filament position.
- **Preload, load, and unload sequences** describe the exact decisions and
  calculated distances the current setup will use. The parameter names and
  values in parentheses make this especially useful while tuning. A
  different sensor layout can produce a substantially different route.
- **Compact state display** relates gates, tools, availability, selection,
  and tracked filament position. Here the selection marker is under gate 0,
  T0 maps to that gate, and the final line shows filament parked at the gate
  rather than loaded through the bowden.

Add `DETAIL=1` when you also want the Tool-to-Gate map and EndlessSpool
groups included in the status report:

```text
MMU_STATUS SHOWCONFIG=1 DETAIL=1
```

## Reading the compact state displays

The compact table and filament-path line answer different questions. The
table covers every unit and gate; the path line covers only the currently
selected tool and gate. Read the table first to establish the selection,
then read the path from the selected gate on the left toward the nozzle on
the right.

The following two examples are independent snapshots: the table has T8
selected, while the path line begins with T9.

### Unit, gate, tool, and availability table

```{.text .console-output}
Unit : ----------------- unit0 -----------------   ----- unit1 -----
Gate : | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |Byp|   | 9 | 10| 11| 12|
Tools: |T0 |T1 |T2 |T3 |T4 |T5 |T6 |T7 |T8 | - |   |T9 |T10|T11|T12|
Avail: |■■■|■■■| - |■■■|■?■|■?■|■■■|■?■|■?■|   |   |■■■|■■■| - | - |
Selct: ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|\▼/|~~~~   ~~~~~~~~~~~~~~~~~ T8
```

Each four-character column describes one physical gate:

| Row | How to read it |
|---|---|
| `Unit` | The dashed headings group gates by MMU unit. Here unit0 owns gates 0-8 and the bypass; unit1 owns gates 9-12. This row is omitted on a single-unit machine. |
| `Gate` | Global physical gate numbers. They remain unique across units. `Byp` is the direct filament-bypass path, attached to unit0 in this example. |
| `Tools` | The logical tool currently mapped to each physical gate by the TTG map. The bypass has no logical tool, so it shows `-`. If several tools map to one gate, the short column can end in `+`; use `MMU_TTG_MAP` to see the complete mapping. |
| `Avail` | Happy Hare's gate-availability state, supplemented by filament-color swatches when colored console output is enabled. This is tracked state; it is not itself a live sensor reading. |
| `Selct` | Selector state and the one active gate. The tool printed at the far right is the selected logical tool. |

The availability cells use the center character to distinguish state:

| Cell | Meaning |
|---|---|
| `■■■` | Filament is known to be available. Run `MMU_GATE_MAP` to distinguish **On spool** from **Buffered**. |
| `■?■` | Availability is unknown. The outer squares are color swatches or visual framing, not proof that filament is present. |
| ` - ` | The gate is recorded as empty. |
| `W` | A configured EndlessSpool waste/eject gate; the exact width depends on console formatting. |
| blank bypass cell | No filament is currently tracked as loaded through the bypass. |

In the selection row, `~` means that unit's selector is homed and `X` means
it is not homed. `|\▼/|` points at the active physical gate; the triangle is
rendered in that gate's filament color when possible. In this snapshot gate
8 is selected on unit0, its TTG mapping is T8, and unit1 has no selected
gate. The table also shows gates 2, 11, and 12 as empty, gates 4, 5, 7, and
8 as unknown, and the remaining gates as available.

### Filament position line

```{.text .console-output}
[T9] ■◉■■◉■┈┈┈┈┈┈┈┈┈┈ [◁ ▷] ┈┈┈┈┈┈┈Ex┈┈┈◯┈┈┈┤Nz UNLOADED 0.0mm
```

Read this from left to right:

| Part | Meaning |
|---|---|
| `[T9]` | The selected logical tool. Its TTG-mapped physical gate and owning unit supply the path being drawn. `[BYPASS]` or `[T?]` can appear instead. |
| `■` | Filament is known or inferred to occupy that part of the path. With colored output, the line uses the selected filament's color. |
| `┈` | Filament has not reached that part of the path, or Happy Hare has no evidence that it has. |
| `◉` / `◯` | A fitted filament sensor is triggered / open. Gate-area sensors appear in physical order; use `MMU_SENSORS` to match the markers to their exact names. |
| `[◁ ▷]` | The sync-feedback buffer. Outward arrows show the tension-side switch; inward arrows show compression. The blank center here means sync feedback is not currently active. When active, the center can show `T`, `C`, or `N`; a proportional sensor can show a number, while `x` means disabled and `?` means indeterminate. |
| `Ex` / `Nz` | Extruder and nozzle landmarks. The open `◯` between them in this example is the fitted toolhead sensor. |
| `UNLOADED` | Happy Hare's discrete tracked filament state. Unloaded means parked at the gate, not necessarily absent—the solid gate-side segment and triggered gate sensors are therefore expected. Other reports can show `EMPTY`, `UNKNOWN`, `LOADED`, `▷▷▷` while loading, or `◁◁◁` while unloading. |
| `0.0mm` | The MMU drive's tracked stepper coordinate, not an independent measurement of the filament tip. With encoder validation enabled, a separate `(e:...mm)` measurement appears for comparison. |

This example says that T9 is selected, filament is parked across the fitted
gate sensors, and nothing extends into the bowden, extruder, or nozzle. The
toolhead sensor is open. The tension-side buffer switch is physically
triggered, but the empty center of `[◁ ▷]` shows that sync feedback is
inactive because filament is not loaded through the buffer.

!!! note "Sync-feedback forms"
    The buffer segment combines the physical switch position (the arrows)
    with the controller's interpretation (the center). These are the common
    forms:

    | Form | Meaning |
    |---|---|
    | `[◁ ▷]` | Tension-side switch triggered; blank center means sync feedback is currently inactive. |
    | `[ ▷ ◁ ]` | Compression-side switch triggered; sync feedback inactive. |
    | <code>[&nbsp;&nbsp;&nbsp;]</code> | Neither digital switch triggered; sync feedback inactive (three spaces between the brackets). |
    | `[◁T▷]` | Active and reporting tension. |
    | `[ ▷C◁ ]` | Active and reporting compression. |
    | `[ N ]` | Active and neutral. |
    | `[-0.4 ]` | Proportional-sensor value. The normalized range is `-1.0` (tension) through `0.0` (neutral) to `1.0` (compression). |
    | `[ x ]` | Sync feedback is disabled. |
    | `[ ? ]` | The state is indeterminate. |

    `x`, `?`, and the state letters can also appear between outward or
    inward arrows when a digital switch is physically triggered; for
    example, `[◁x▷]` means the tension switch is triggered while feedback
    is disabled. A tension-only sensor can only produce the outward-arrow
    side, a compression-only sensor the inward-arrow side, and a dual sensor
    either. See [Sync-Feedback Buffer](Feature-Sync-Feedback-Buffer.md) for
    the supported sensor hardware.

    The exact path length and glyph style vary with the fitted sensors and
    the console's bold/color settings. Trust the landmarks and sensor
    markers, not a fixed character position copied from another MMU design.

## What is loaded in each gate

`MMU_GATE_MAP` describes the physical gates. Availability and filament
attributes belong to a gate even when the TTG map sends a differently
numbered tool there.

```{.text .console-command}
MMU_GATE_MAP
```

```{.text .console-output}
Gates / Filaments:
0 (■■■) [T0]:    On spool;  TPU   | 226°C | #14BA5E | Prusa TPU HF [SELECTED]
1 (■■■) [T1]:    On spool;  TPU   | 240°C | #9B4BCE | Prusa TPU Silk
2 (■■■) [T2]:    On spool;  PLA+  | 228°C | #474EE2 | KVS PLA+ Matte
3 (■■■) [T3]:    On spool;  ABS   | 229°C | #4B3E86 | Bambu Labs ABS Basic
```

Each row identifies the physical gate, availability, mapped tool, material,
temperature, color, and filament name. `[SELECTED]` agrees with the gate 0
selection in `MMU_STATUS`. Depending on your integrations and settings, the
report can also include Spoolman, RFID, and speed-override information.

If the filament attributes are wrong but the physical sensors are correct,
the gate map is the layer to fix. See [Gate/TTG Maps](Feature-Gate-TTG-Maps.md)
for updating it directly or through Spoolman.

## Which gate each tool will use

Slicer g-code requests logical tools (`T0`, `T1`, and so on); the TTG map
resolves each request to a physical gate.

```{.text .console-command}
MMU_TTG_MAP
```

```{.text .console-output}
TTG Map:
T0 -> Gate 0(■■■) [SELECTED]
T1 -> Gate 1(■■■)
T2 -> Gate 2(■■■)
T3 -> Gate 3(■■■)
```

This is a straight-through map: each tool uses the same-numbered gate. A
remapped printer might instead show `T0 -> Gate 3`; that is valid and does
not mean the gate map is wrong. Use `MMU_TTG_MAP DETAIL=1` to include
EndlessSpool groups.

## What the sensors see

`MMU_SENSORS` reports the raw state of every fitted filament sensor. The
names and number of sensors depend on the hardware.

```{.text .console-command}
MMU_SENSORS
```

```{.text .console-output}
filament_compression  --> Open
filament_tension      --> TRIGGERED
mmu_entry_0           --> TRIGGERED
mmu_entry_1           --> TRIGGERED
mmu_entry_2           --> TRIGGERED
mmu_entry_3           --> TRIGGERED
mmu_exit_0            --> TRIGGERED
mmu_exit_1            --> TRIGGERED
mmu_exit_2            --> TRIGGERED
mmu_exit_3            --> TRIGGERED
mmu_shared_exit       --> Open
```

In this snapshot, the entry and exit sensors for every gate are triggered,
which is consistent with all four filaments being preloaded and parked. The
shared exit is open, consistent with nothing entering the bowden. The
sync-feedback tension switch is triggered, but `MMU_STATUS` explicitly says
feedback is not currently active because no filament is loaded through it.

Treat a sensor report as physical evidence, not as a command to change
Happy Hare's tracked state. If a sensor reading is unexpected, inspect the
filament and switch first. The [Sensors](Feature-Sensors.md) page covers
naming, testing, and temporarily disabling a faulty sensor.

## Cross-checking the reports

The most useful information is often where two views agree—or fail to:

| Check | What agreement looks like in this snapshot |
|---|---|
| Selection | `MMU_STATUS`, `MMU_GATE_MAP`, and `MMU_TTG_MAP` all identify T0 on gate 0 as selected. |
| Preloaded gates | The gate map says filament is available and each gate's entry/exit sensors are triggered. |
| Bowden state | `MMU_STATUS` says unloaded and parked; `mmu_shared_exit` is open. |
| Tool routing | The `Tools` row and `MMU_TTG_MAP` both show a straight T0→gate 0 through T3→gate 3 map. |

If the reports disagree:

- Run [`MMU_CHECK_GATE`](Reference-Commands.md#mmu_check_gate) to physically
  check filament presence and refresh gate availability.
- Use [`MMU_RECOVER`](Reference-Commands.md#mmu_recover) when the tracked
  selection or filament position does not match reality.
- Correct `MMU_GATE_MAP` when the spool attributes or availability are
  wrong, and `MMU_TTG_MAP` when a tool points to the wrong gate.
- Investigate an unexpected `MMU_SENSORS` reading as a filament, wiring, or
  switch problem before disabling that sensor.

## See also

- [Operation](Operation.md)
- [Feature: Gate/TTG Maps](Feature-Gate-TTG-Maps.md)
- [Feature: Sensors](Feature-Sensors.md)
- [Feature: State Persistence](Feature-State-Persistence.md)
- [Command Reference](Reference-Commands.md)

---
