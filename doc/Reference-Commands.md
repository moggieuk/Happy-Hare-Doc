# Command Reference

Every `MMU_*` command Happy Hare provides - generated directly from the
same help text `<CMD> HELP=1` prints at a real printer, so it's always
in sync with what you'll actually see. Internal/developer-only commands
(individual loading/unloading steps, raw stress-test tooling) are
deliberately not here - see [Developer Command
Reference](Dev-Command-Reference.md) in the Developer Guide instead.

## GENERAL

### MMU

*Enable/Disable functionality (resets state when re-enabled)*

**Parameters**

```{.text .console-output}
ENABLE = [0|1]
```

```{.text .console-output}
Examples:
MMU ENABLE=1 ...Enable Happy Hare and reset MMU state
MMU ENABLE=0 ...Disable Happy Hare (motors released, no MMU operations possible)
```

### MMU_CALC_PURGE_VOLUMES

*Calculate purge volume matrix based on filament color overriding slicer tool map import*

**Parameters**

```{.text .console-output}
MIN        = #    Minimum purge volume (mm^3)
MAX        = #    Maximum purge volume (mm^3)
MULTIPLIER = #    Scale multiplier (float)
SOURCE     = [gatemap|slicer]  Color source to build matrix from
```

```{.text .console-output}
Examples:
MMU_CALC_PURGE_VOLUMES SOURCE=gatemap MULTIPLIER=1.1 ...calc purge matrix colors defined in the gate map with scaling
MMU_CALC_PURGE_VOLUMES SOURCE=slicer MIN=50          ...calc purge matrix colors defined by slicer with minimum
(Use MMU_SLICER_TOOL_MAP PURGE_MAP=1 to see result)
```

### MMU_CHANGE_TOOL

*Perform a tool swap (called from Tx command)*

**Parameters**

```{.text .console-output}
QUIET                 = [0|1]
STANDALONE            = [0|1]
RESTORE               = [0|1]
SKIP_TIP              = [0|1]
SKIP_PURGE            = [0|1]
NEXT_POS              = X,Y              (optional; only used when restore_xy_pos is 'next')
TOOL                  = #(int)
GATE                  = #(int)
SLICER_PURGE          = #(mm)            (optional; captures the slicer calculated purge volume)
SLICER_RETRACTION     = #(mm)            (optional; captures the slicer retraction length)
SLICER_FW_RETRACTION  = true|false|0|1   (optional; captures the slicer firmware retraction setting. Ignored if not enabled in printer)
```

```{.text .console-output}
Examples:
MMU_CHANGE_TOOL TOOL=2              ...Change to tool 2 (equivalent to running T2)
MMU_CHANGE_TOOL TOOL=0 STANDALONE=1 ...Change to tool 0 forcing standalone tip forming/purging (not slicer)
MMU_CHANGE_TOOL GATE=3              ...Change to whichever tool is mapped to gate 3 (UI driven)
```

### MMU_CHECK_GATE

*Automatically inspects gate(s), parks filament and marks availability*

**Parameters**

```{.text .console-output}
QUIET  = [0|1]
TOOLS  = comma,separated,tools
GATES  = comma,separated,gates
TOOL   = t (single tool)
GATE   = g (single gate)
ALL    = [0|1]
```

```{.text .console-output}
Examples:
MMU_CHECK_GATE             ...Check the current gate
MMU_CHECK_GATE ALL=1       ...Check every gate and update availability
MMU_CHECK_GATE GATES=0,2,4 ...Check gates 0, 2 and 4
MMU_CHECK_GATE TOOL=1      ...Check the gate mapped to tool 1
```

### MMU_EJECT

*Ejects filament from MMU on chosen gate. If current gate then performs unload first if not already unloaded*

**Parameters**

```{.text .console-output}
GATE          = #(int)
FORCE         = [0|1]
EXTRUDER_ONLY = [0|1]
SKIP_TIP      = [0|1]
RESTORE       = [0|1]
```

```{.text .console-output}
Examples:
MMU_EJECT        ...Eject filament from current gate
MMU_EJECT GATE=5 ...Eject filament on gate 5
```

### MMU_ENCODER

*Display encoder position and stats or reset position*

**Parameters**

```{.text .console-output}
POS    = #(float) Sets the encoder as close as possible to specified position (subject to resolution)
VALUE  = #(float) Alias for POS=
QUIET  = 1 for less verbose output
(no parameters for status)
```

```{.text .console-output}
Examples:
MMU_ENCODER         ...Report current encoder position and status
MMU_ENCODER POS=0   ...Reset the encoder position counter to (approximately) zero
MMU_ENCODER POS=100 ...Set the encoder as close as possible to position 100mm
```

### MMU_ENDLESS_SPOOL

*Diplay or Manage EndlessSpool functionality and groups*

**Parameters**

```{.text .console-output}
ENABLE = [0|1]
QUIET  = [0|1]
RESET  = [0|1]
GROUPS = comma separated list of group membership
```

```{.text .console-output}
Examples:
MMU_ENDLESS_SPOOL GROUPS=1,1,1,1   ...Put all four gates into same endless spool group
MMU_ENDLESS_SPOOL RESET=1          ...Reset to default grouping. Typically each gate is in own group
MMU_ENDLESS_SPOOL ENABLE=0 QUIET=1 ...Disable endspool feature supressing console/log output
```

### MMU_ESPOOLER

*Direct control of espooler or display of current status*

**Parameters**

```{.text .console-output}
UNIT      = #(int)|_name_ Specify unit by name or number. OMIT if GATE supplied
ALLOFF    = [0|1] Quick way to turn all espoolers off
TRIGGER   = [0|1] Fire in-print trigger for testing
BURST     = [0|1] Jog in direction of OPERATION (assist|rewind) using configured burst duration and power
DURATION  = [0-10] Override duration of PWM signal (seconds) for burst operations
GATE      = g Specify gate to operate on (defaults to current gate)
LOOSEN    = [0|1] Quick way to loosen filament on spool
OPERATION = [assist|off|print|rewind] Set espooler operation mode
POWER     = [0-100] Override default % power to apply to espooler motor
QUIET     = [0|1] Used to suppress console/log output
RESET     = [0|1] Turn of in-print assist
TIGHTEN   = [0|1] Quick way to tighten filament on spool
(no parameters for status report)
```

```{.text .console-output}
Examples:
MMU_ESPOOLER                         ...Report espooler status
MMU_ESPOOLER GATE=2 TIGHTEN=1        ...Tighten filament on the spool at gate 2
MMU_ESPOOLER GATE=2 BURST=1 POWER=50 ...Jog espooler on gate 2 in the current operation direction at 50% power
MMU_ESPOOLER GATE=2 OPERATION=rewind ...Set gate 2 espooler to rewind (in-print) mode
MMU_ESPOOLER ALLOFF=1                ...Turn all espoolers off
```

### MMU_FLOWGUARD

*Enable/disable FlowGuard (clog-tangle detection)*

**Parameters**

```{.text .console-output}
UNIT   = #(int)|_name_|ALL Specify unit by name, number or all-units (optional if single unit)
ENABLE = [1|0] Enable/disable FlowGuard clog/tangle detection
(no parameters for status report)
```

```{.text .console-output}
Examples:
MMU_FLOWGUARD          ...Report FlowGuard clog/tangle detection status
MMU_FLOWGUARD ENABLE=1 ...Enable FlowGuard detection on the active unit
MMU_FLOWGUARD ENABLE=0 UNIT=ALL ...Disable FlowGuard detection on all units
```

### MMU_GATE_MAP

*Display or define the type and color of filaments on each gate*

**Parameters**

```{.text .console-output}
QUIET        = 1 To minimize console reporting
RESET        = 1 To reset specified GATE/GATES filament attributes to configured defaults
GATES        = g,g,g comma separated list of gates; required with RESET unless GATE is used
GATE         = g Specify a single gate; required with RESET unless GATES is used
BYPASS       = 1 Set filament attributes for the bypass
NEXT_SPOOLID = id Specify the spoolman id of the next filament loaded - automatically assigned (0 to cancel)
NAME         = # Filament name
MATERIAL     = # Material type
VENDOR       = # Filament vendor/brand name
COLOR        = # Filament color as w3c name or RRGGBB or RRGGBBaa (without #)
SPOOLID      = # Optionally the spoolman ID for the filament (don't need to specify other attributes)
TEMP         = # Default temperature of filament
SPEED        = % Speed override (use <100 for soft TPU types)
RFID         = # Single hexadecimal RFID tag UID read at the gate (blank to clear)
AVAILABLE    = [-1|0|1|2] Filament availability: Unknown | Empty | Available | Available from filament buffer
(no parameters for status report)
```

```{.text .console-output}
Examples:
MMU_GATE_MAP GATES=0,1,2,3 AVAILABLE=1      ...Mark gates 0-3 as having filament available
MMU_GATE_MAP GATE=5 COLOR=red MATERIAL=pla  ...Set filament attributes for gate 5
MMU_GATE_MAP NEXT_SPOOLID=45                ...Automatically mark the next spool preloaded or loaded with spoolman id 45
MMU_GATE_MAP GATE=0 SPEED=50                ...Set load/unload speed of gate 0 to 50% - great for TPU!
MMU_GATE_MAP GATE=0 RFID=E2003412           ...Record the RFID tag read for the spool loaded in gate 0
MMU_GATE_MAP RESET=1 GATES=4,5              ...Reset gates 4 and 5 to defaults configured in mmu.cfg
```

### MMU_GRIP

*Grip filament in current gate*

### MMU_HEATER

*Control MMU heater(s) and filament drying cycle*

**Parameters**

```{.text .console-output}
UNIT            = #(int) Optional if only one unit fitted to printer
STOP            = [0|1] Turn off heater and drying cycle
DRYING_DATA     = [0|1] Dump configured drying data for filament types
DRY             = [0|1] Disable/enable filament heater for filament drying cycle
TIMER           = #(mins) Force drying time
TEMP            = #(degrees) Force temperature
HUMIDITY        = % Terminate drying when humidty goal is reached
GATES           = g1,g2 Gates to control ONLY IF MMU has per-gate heaters/dryers
ROTATE          = [0|1] Rotate spool (requires eSpooler and explicit GATES)
ROTATE_INTERVAL = #(mins) How often to rotate spools when drying (requires eSpooler)
VENT_INTERVAL   = #(mins) How often to call 'vent' macro in drying cycle
(no parameters for status report)
```

```{.text .console-output}
Examples:
MMU_HEATER TEMP=50                             ...Set heater temperature or adjusts if in drying cycle
MMU_HEATER DRY=1                               ...Dry with intelligent temperature/time recommended from 'drying_data'
MMU_HEATER DRY=1 TEMP=50 TIMER=240 HUMIDITY=12 ...Initiate drying cycle at 50°C for 240 minutes with 12% humidity goal
MMU_HEATER STOP=1                              ...Stop current drying cycle
MMU_HEATER DRY=1 ROTATE=1 GATES=1,3            ...Start drying cycle on gates 1 & 3 periodically rotating them (requires espooler)
MMU_HEATER DRYING_DATA=1                       ...List the current drying data database
MMU_HEATER DRY=1 VENT_INTERVAL=10              ...Initiate drying cycle calling vent macro every 10 minutes
With per-gate heaters:
MMU_HEATER DRY=1 GATES=0,2,3                   ...Drying cycle on gates 0,2 & 3 (subject to max simultaneous heaters)
MMU_HEATER TEMP=45 GATES=0,1                   ...Turn heaters on for gates 0 & 1
```

### MMU_HELP

*Display the complete set of MMU commands and function*

**Parameters**

```{.text .console-output}
PARAMS    = [0|1] Show parameter help and supplemental examples
ALL       = [0|1] Show all user commands categories
GENERAL   = [0|1] Regular MMU commands (DEFAULT ON)
TESTING   = [0|1] Calibration and testing commands
STEPS     = [0|1] Advanced load/unload sequence and steps commands
MACROS    = [0|1] Print start/end or slicer macros (defined in mmu_software.cfg)
CALLBACKS = [0|1] Callbacks macros (defined in mmu_sequence.cfg, mmu_state.cfg)
INTERNAL  = [0|1] Internal commands/macros (Caution!)
OTHER     = [0|1] Alias or not categorised
CMD       = _cmd_ Show help on command (same as _cmd_ HELP=1)
(without parameters it will summarize just major commands)
```

```{.text .console-output}
Examples:
MMU_HELP ALL=1                                   ...Summerize all user commands
MMU_HELP PARAMS=1                                ...Summerize basic commands showing parameters and examples
MMU_HELP GENERAL=0 TESTING=1 PARAMS=1            ...Provide details help on all testing/calibration commands
MMU_HELP INTERNAL=1 PARAMS=1                     ...You are a developer? Caution!
```

### MMU_HOME

*Home the MMU selector*

**Parameters**

```{.text .console-output}
UNIT         = #(int)|_name_|ALL Specify unit by name, number or all-units (optional if single unit)
TOOL         = #(int) Optionally select tool number after homing
SKIP_HOMED   = [0|1]  Skip homing of units that are already homed
(no parameters: home selector on single unit setup and select T0)
```

```{.text .console-output}
Examples:
MMU_HOME UNIT=ALL              ...Home all mmu units with selector kinimatics
MMU_HOME UNIT=ALL SKIP_HOMED=1 ...Home only units that are not already homed
MMU_HOME UNIT=1              ...Home unit 1
```

### MMU_LED

*Manage mode of operation of optional MMU LED's*

**Parameters**

```{.text .console-output}
ENABLE        = [0|1] Enable/disable
ANIMATION     = [0|1] Enable/disable animations
EXIT_EFFECT   = [off|gate_status|filament_color|slicer_color|r,g,b|_effect_]
ENTRY_EFFECT  = [off|gate_status|filament_color|slicer_color|r,g,b|_effect_]
STATUS_EFFECT = [off|on|filament_color|slicer_color|r,g,b|_effect_]
LOGO_EFFECT   = [off|r,g,b|_effect_]
REFRESH       = [0|1] Force refresh of LED
QUIET         = [0|1] Don't report non-essential status
UNIT          = #(int)|_name_ Specify unit by name, number else will operate on all-units
(no parameters for status report)
```

```{.text .console-output}
Examples:
MMU_LED EXIT_EFFECT=filament_color LOGO_EFFECT=(.5,0,0) ...Set exit effect to filament_color and logo to dim red
MMU_LED ANIMATION=0 UNIT=1                              ...Turn off animation for LED's on unit 1
MMU_LED ENABLE=0                                        ...Turn off LED's
```

### MMU_LOAD

*Loads filament on current tool/gate or optionally loads just the extruder for bypass or recovery usage (EXTRUDER_ONLY=1)*

**Parameters**

```{.text .console-output}
EXTRUDER_ONLY = [0|1]
SKIP_PURGE    = [0|1]
RESTORE       = [0|1]
```

```{.text .console-output}
Examples:
MMU_LOAD                 ...Load filament from current gate
MMU_LOAD SKIP_PURGE=1    ...Load filament from current gate skipping purge macro
MMU_LOAD EXTRUDER_ONLY=1 ...Load filament into extruder (assumes filament is at extruder entrance)
```

### MMU_LOG

*Logs messages in MMU log*

**Parameters**

```{.text .console-output}
MSG   = _text_
ERROR = [0|1]
DEBUG = [0|1]
```

```{.text .console-output}
Examples:
MMU_LOG MSG="Loading complete"         ...Write an informational message to console and mmu.log
MMU_LOG MSG="Gate 3 is empty" ERROR=1  ...Write an error message
MMU_LOG MSG="entering load sequence" DEBUG=1 ...Write a debug-level message (only shown when debugging enabled)
```

### MMU_MOTORS_OFF

*Turn off all MMU motors and servos*

```{.text .console-output}
Examples:
MMU_MOTORS_OFF ...Turn off all MMU motors and servos so the mechanism can be moved by hand
```

### MMU_MOTORS_ON

*Turn on all MMU motors and servos*

```{.text .console-output}
Examples:
MMU_MOTORS_ON ...Re-energize all MMU motors and servos
```

### MMU_NFC

*Control and inspect the MMU NFC/RFID readers*

**Parameters**

```{.text .console-output}
SHARED   = [0|1] Target the unit's shared reader
GATE     = #(int) Target the reader for this gate (implies the unit)
GATES    = g,g,g Target multiple gates' readers (don't mix with GATE/SHARED)
UNIT     = #(int)/name Only needed to disambiguate multiple units with shared readers
ENABLE   = [0|1] Top-level on/off for the reader (re-inits when enabled)
READ     = [0|1] Read the addressed reader once and report the UID
DEEP     = [0|1] With READ=1, also parse and report the tag metadata (ignores nfc_deep_read setting)
REGISTER = [0|1] Read tag (implies READ=1 DEEP=1) and resolve it in Spoolman (may auto-create). Shared reader: report-only, Per-gate: updates gate map
APPEND   = [0|1] With REGISTER=1 on a gate that already has a spool assigned, bind the newly scanned tag onto that spool instead of resolving/auto-creating (e.g. a second tag on the same spool)
INIT     = [0|1] (Re)initialize the addressed reader
RELEASE  = [0|1] Release the current target on the addressed reader
INIT_ALL = [0|1] (Re)initialize every reader on every unit
DETAILS  = [0|1] Include actual cached tag UIDs in the status report
(no parameters for status report of all readers)
```

```{.text .console-output}
Examples:
MMU_NFC                        ...Report status of all readers (which have a cached tag)
MMU_NFC DETAILS=1              ...As above but show the actual cached UIDs
MMU_NFC SHARED=1 ENABLE=0      ...Disable the shared reader
MMU_NFC GATE=3 READ=1          ...Read the reader on gate 3 and report the result
MMU_NFC SHARED=1 READ=1 DEEP=1 ...Read the shared reader and report the parsed tag metadata
MMU_NFC SHARED=1 REGISTER=1    ...Read tag and resolve/register it in Spoolman (report only, no assignment)
MMU_NFC GATE=2 REGISTER=1      ...Read tag on gate 2 and apply to the gate map (as if auto-scanned)
MMU_NFC GATE=2 REGISTER=1 APPEND=1 ...Read a 2nd tag on gate 2 and bind it onto the spool already assigned there
MMU_NFC GATE=2 INIT=1          ...(Re)initialize the reader on gate 2
MMU_NFC GATES=0,1,2,3 ENABLE=0 ...Disable selected per-gate readers
MMU_NFC INIT_ALL=1             ...Re-initialize every reader on all units
```

### MMU_NFC_SCAN

*Read the NFC/RFID spool tag for a gate by jogging filament to its reader*

**Parameters**

```{.text .console-output}
GATE = #(int) Gate to scan (default: current gate)
```

```{.text .console-output}
Jogs the filament within the unit's 'nfc_gate_jog_scan_window' until the spool's
RFID tag reaches the gate's reader, reads it, then re-parks the filament.
Examples:
MMU_NFC_SCAN        ...Jog and scan the RFID/NFC tag on the current gate
MMU_NFC_SCAN GATE=2 ...Jog and scan the RFID/NFC tag on gate 2
```

### MMU_PAUSE

*Pause the current print and lock the MMU operations*

**Parameters**

```{.text .console-output}
MSG            = _text_
FORCE_IN_PRINT = [0|1]
```

```{.text .console-output}
Examples:
MMU_PAUSE                          ...Pause the MMU and enter the error/recovery state
MMU_PAUSE MSG="Filament tangle"    ...Pause with a custom reason shown to the user
MMU_PAUSE FORCE_IN_PRINT=1         ...Pause using in-print behaviour even when not detected as printing
```

### MMU_PRELOAD

*Preloads filament at specified or current gate*

**Parameters**

```{.text .console-output}
GATE = #(int)
```

```{.text .console-output}
Examples:
MMU_PRELOAD        ...Preload filament into the current gate
MMU_PRELOAD GATE=3 ...Preload filament into gate 3
```

### MMU_RECOVER

*Recover MMU tool/gate/filament state*

**Parameters**

```{.text .console-output}
TOOL   = t Optionally force the assignment of specified tool number
GATE   = g Optionally force the assignment of the specified gate number (fixes TTG map)
BYPASS = 1 Used to force the assignment of the bypass Tool/Gate
LOADED = [0|1] Force unloaded or loaded (in the extruder) state
STRICT = 1 If auto-recovering state, allows extended tests including extruder heating
(no parameters for automatic filament position recovery)
```

```{.text .console-output}
Examples:
MMU_RECOVER               ...automatically recover filament position
MMU_RECOVER LOADED=1      ...to indicate filament is in the extruder
MMU_RECOVER TOOL=2 GATE=3 ...to indicate T2 is currently loaded from gate 3
```

### MMU_RELEASE

*Ungrip filament in current gate*

### MMU_RESET

*Forget persisted state and re-initialize defaults*

**Parameters**

```{.text .console-output}
CONFIRM = [0|1]  Must be set to 1 to proceed
```

```{.text .console-output}
Examples:
MMU_RESET CONFIRM=1  ...reset all persisted MMU state back to defaults
```

### MMU_SELECT

*Select the specified logical tool (following TTG map) or physical gate*

**Parameters**

```{.text .console-output}
TOOL   = #(int) Logical tool index (0..num_gates-1)
GATE   = #(int) Physical gate index (0..num_gates-1)
BYPASS = [0|1]
QUIET  = [0|1]
(must specify TOOL, GATE, or BYPASS)
```

```{.text .console-output}
Examples:
MMU_SELECT TOOL=2   ...Select tool 2 (moves selector to the mapped gate but does not load)
MMU_SELECT GATE=0   ...Select physical gate 0 directly
MMU_SELECT BYPASS=1 ...Select the bypass (for direct-to-extruder loading)
```

### MMU_SENSORS

*Query, or enable/disable, sensors fitted to mmu*

**Parameters**

```{.text .console-output}
UNIT   = #(int) Specify unit else unit with active gate will be assumed
SENSOR = _sensor_name_ Target one sensor by name; alone, reports just that sensor
ENABLE = [0|1]  Persistently enable/disable the sensor named by SENSOR
```

```{.text .console-output}
Examples:
MMU_SENSORS          ...report state of every sensor on all units, including disabled ones
MMU_SENSORS UNIT=1   ...report state of active sensors on unit index 1
MMU_SENSORS SENSOR=mmu_exit_0 ...report state of just that one sensor, even if disabled
MMU_SENSORS SENSOR=unit0:mmu_shared_exit ENABLE=0 ...persistently disable that sensor (sticky across restarts)
MMU_SENSORS SENSOR=mmu_exit_0 ENABLE=1 ...persistently re-enable it
```

### MMU_SERVO

*Move MMU servo to position specified position or angle*

**Parameters**

```{.text .console-output}
UNIT   = #(int) Optional, defaults to all units
RESET  = 1      Clear saved calibration
SAVE   = 1      Save current position against pos if calibrating
POS    = [off|up|move|down]
```

### MMU_SET_LED

*Raw direct control of MMU leds for temporary changes (normally you want to use MMU_LED)*

**Parameters**

```{.text .console-output}
GATE          = #(int)
UNIT          = #(int)|_name_ Specify unit by name or number. OMIT if GATE supplied
EXIT_EFFECT   = [off|gate_status|filament_color|slicer_color|r,g,b|_effect_]
ENTRY_EFFECT  = [off|gate_status|filament_color|slicer_color|r,g,b|_effect_]
STATUS_EFFECT = [off|on|filament_color|slicer_color|r,g,b|_effect_]
LOGO_EFFECT   = [off|r,g,b|_effect_]
DURATION      = #.#(float) seconds
FADETIME      = #.#(float) seconds
```

```{.text .console-output}
Examples:
MMU_SET_LED EXIT_EFFECT=mmu_ready_orange GATE=2 DURATION=5 ...Set the exit LED on gate 2 to orange effect for 5 seconds then revert
MMU_SET_LED ENTRY_EFFECT=(1,1,1) GATE=4                    ...Set the entry LED on gate 4 to solid white until state change
```

### MMU_SLICER_TOOL_MAP

*Display or define the tools used in print as specified by slicer*

**Parameters**

```{.text .console-output}
DETAIL           = 1 Log additional details to console
PURGE_MAP        = 1 Display purge map
SPARSE_PURGE_MAP = 1 Display purge map for only toolchanges possible in print
RESET            = 1 Reset/clear slicer map
INITIAL_TOOL     = t Specify the initial tool for the print
TOTAL_TOOLCHANGES= # Configure how many toolchanges are in the print
TOOL             = t Specify tool number
MATERIAL         = _text_ Filament material type
COLOR            = _text_ Filament color
NAME             = _text_ Filament name
TEMP             = # Tool extruder temperature
USED             = [0|1] Whether tool being specified is used in print
PURGE_VOLUMES    = Command separated list of volumes (length: single, n_tool, 2x_n_tool, nxn_tool)
NUM_SLICER_TOOLS = # (optional, <= num_gates)
AUTOMAP          = [none|filament_name|spool_id|material|closest_color|color] Set automap strategy
SKIP_AUTOMAP     = 1 Skip automap for next print (one-print option)
(no parameters for status report)
```

```{.text .console-output}
Examples:
MMU_SLICER_TOOL_MAP PURGE_MAP=1                               ...Display the current purge volume matrix
--- Generally this is done by the Happy Hare print start macros ---
MMU_SLICER_TOOL_MAP INITIAL_TOOL=0                            ...Set initial tool to 0
MMU_SLICER_TOOL_MAP TOOL=0 COLOR=990304 TEMP=214 MATERIAL=pla ...Set tool 0 color, temp and type
MMU_SLICER_TOOL_MAP AUTOMAP=kkkkpla ...Set tool 0 color, temp and type
```

### MMU_SPOOLMAN

*Manage spoolman status / gate-spool assignment*

**Parameters**

```{.text .console-output}
QUIET     = [0|1] Suppress non-critical console output
SYNC      = 1 Sync the local and remote (spoolman) gate maps
CLEAR     = 1 Clear all gate/spool assignments for this printer in the spoolman db
REFRESH   = 1 Rebuild spoolman's cache of this printer's assignments, then sync (unless SYNC= is also given)
FIX       = 1 With REFRESH=, also unassign any inconsistent spool/gate pairs found (partial or duplicate assignments)
SPOOLID   = #(int) Spoolman spool id
GATE      = #(int) Gate number
PRINTER   = _name_ Show another printer's gate/spool assignments instead of this one
SPOOLINFO = [-1|spool_id] Display spoolman details for a spool (0 = the active spool)
(no parameters to show the current spoolman gate/spool assignments)
```

```{.text .console-output}
Examples:
MMU_SPOOLMAN                   ...Show the current spoolman gate/spool assignments
MMU_SPOOLMAN REFRESH=1         ...Refresh the local gate map from the spoolman database
MMU_SPOOLMAN GATE=0 SPOOLID=45 ...Assign spoolman spool id 45 to gate 0
MMU_SPOOLMAN GATE=0            ...Unassign whichever spool is on gate 0
MMU_SPOOLMAN SPOOLID=45        ...Unassign spool id 45 from whichever gate it's on
MMU_SPOOLMAN SPOOLINFO=45      ...Display spoolman details for spool id 45
MMU_SPOOLMAN SPOOLINFO=-1      ...Display spoolman details for active spool

See MMU_SPOOLMAN_TAG to register a tag/UID onto a spool record.
```

### MMU_SPOOLMAN_TAG

*Register an NFC/RFID tag UID onto a spoolman spool record*

**Parameters**

```{.text .console-output}
QUIET    = [0|1] Suppress non-critical console output
SPOOLID  = #(int) Spoolman spool id to register the tag against
GATE     = #(int)|LAST Gate whose assigned spool (RFID=) or recorded tag (REGISTER=) to use. If omitted implies current gate
RFID     = _uid_ (or comma-separated UIDs) to write onto the spool. RFID='' to clear
APPEND   = 1 Add to the existing UID(s) instead of replacing them
REGISTER = 1 Bind the gate's already-recorded UID onto SPOOLID (needs spoolman_support != pull)
```

```{.text .console-output}
Examples:
MMU_SPOOLMAN_TAG SPOOLID=45 RFID=E2003412          ...Register tag E2003412 against spool id 45 in the spoolman db (replaces any existing tags)
MMU_SPOOLMAN_TAG SPOOLID=45 RFID=E2003499 APPEND=1 ...Register a second tag on the same spool (e.g. one on each side), keeping E2003412
MMU_SPOOLMAN_TAG SPOOLID=45 RFID=''                ...Clear all tags registered against spool id 45
MMU_SPOOLMAN_TAG GATE=0 RFID=E2003412              ...Same, for whichever spool is assigned to gate 0
MMU_SPOOLMAN_TAG GATE=3 SPOOLID=87 REGISTER=1      ...Bind gate 3's already-known tag uid to newly-created spool 87
MMU_SPOOLMAN_TAG GATE=LAST SPOOLID=87 REGISTER=1   ...Bind last gate preloaded already-known tag uid to spool 87
MMU_SPOOLMAN_TAG SPOOLID=87 REGISTER=1             ...Bind currently selected gate's tag uid to spool 87

See MMU_SPOOLMAN read or change gate-spool assignment in spoolman
```

### MMU_STATS

*Dump and optionally reset the MMU statistics*

**Parameters**

```{.text .console-output}
RESET      = [0|1]
TOTAL      = [0|1]
DETAIL     = [0|1]
QUIET      = [0|1]
SHOWCOUNTS = [0|1]
COUNTER    = _name_
DELETE     = [0|1] (with COUNTER)
LIMIT      = #(int) (with COUNTER)
INCR       = #(int) (with COUNTER)
WARNING    = _text_ (with COUNTER)
PAUSE      = [0|1] (with COUNTER)
```

```{.text .console-output}
Examples:
MMU_STATS                          ...Show swap/job statistics summary
MMU_STATS DETAIL=1                 ...Show detailed statistics including per-gate breakdown
MMU_STATS RESET=1                  ...Reset all statistics and counters
MMU_STATS COUNTER=blade INCR=1     ...Increment a user-defined counter named 'blade'
MMU_STATS COUNTER=blade LIMIT=3000 WARNING="Replace cutter blade" ...Configure a maintenance counter with limit and warning
```

### MMU_STATUS

*Complete dump of current MMU state and important configuration*

**Parameters**

```{.text .console-output}
SHOWCONFIG = [0|1]
DETAIL     = [0|1]
```

```{.text .console-output}
Examples:
MMU_STATUS              ...Show current MMU state (gates, tool, filament position)
MMU_STATUS DETAIL=1     ...Show verbose status including per-gate detail
MMU_STATUS SHOWCONFIG=1 ...Also display the key configuration values in use
```

### MMU_SYNC_FEEDBACK

*Controls sync feedback and applies filament tension adjustments*

**Parameters**

```{.text .console-output}
UNIT           = #(int)|_name_ Implied by gate else specify name or number
ENABLE         = [1|0] enable/disable sync feedback control
RESET          = 1 reset sync controller and return RD to last known good value
ADJUST_TENSION = 1 apply correction to neutralize filament tension
AUTOTUNE       = [1|0] allow saving of autotuned rotation distance
(no parameters for status report)
```

```{.text .console-output}
Examples:
MMU_SYNC_FEEDBACK                  ...Report sync feedback controller status
MMU_SYNC_FEEDBACK ENABLE=1         ...Enable sync feedback control on the active unit
MMU_SYNC_FEEDBACK ENABLE=0         ...Disable sync feedback control
MMU_SYNC_FEEDBACK RESET=1          ...Reset the controller and restore last known good rotation distance
```

### MMU_SYNC_GEAR_MOTOR

*Sync the MMU gear motor to the extruder stepper*

**Parameters**

```{.text .console-output}
SYNC = [0|1] Specify whether to force extruder/mmu syncing out of a print
(no parameters will default SYNC=1)
```

```{.text .console-output}
Examples:
MMU_SYNC_GEAR_MOTOR        ...Sync the gear motor to the extruder (SYNC defaults to 1)
MMU_SYNC_GEAR_MOTOR SYNC=1 ...Force the gear motor synced to the extruder
MMU_SYNC_GEAR_MOTOR SYNC=0 ...Unsync the gear motor from the extruder
```

### MMU_TOOL_OVERRIDES

*Displays, sets or clears tool speed and extrusion factors (M220 & M221)*

**Parameters**

```{.text .console-output}
TOOL   = t        Specifies tool. Defaults to all tools if not specified
M220   = #(1-200) Speed multiplier percent (100 = unchanged)
M221   = #(1-200) Extrusion multiplier percent (100 = unchanged)
RESET  = [0|1]    Reset overrides to 100%% for tool (defaults to all tools if TOOL is not specified)
(no parameters for status)
```

```{.text .console-output}
Examples:
MMU_TOOL_OVERRIDES                        ...Show current per-tool speed/extrusion overrides
MMU_TOOL_OVERRIDES TOOL=2 M220=95 M221=98 ...Set tool 2 to 95% speed and 98% extrusion
MMU_TOOL_OVERRIDES RESET=1                ...Reset overrides to 100% for all tools
MMU_TOOL_OVERRIDES TOOL=2 RESET=1         ...Reset overrides to 100% for tool 2 only
```

### MMU_TTG_MAP

*aka MMU_REMAP_TTG Display or remap a tool to a specific gate and set gate availability*

**Parameters**

```{.text .console-output}
QUIET     = 1 To minimize console reporting
RESET     = 1 To reset filament attributes to configured defaults
DETAIL    = 1 Include additional details like EndlessSpool grouping
MAP       = g,g,g Comma separated list of gates where index is the tool number. For bulk update
GATE      = g 
GATE      = g Specify the gate
TOOL      = t Specify the tool
AVAILABLE = [0|1] Optionally specify the filament availablity in the gate
(no parameters for status report)
```

```{.text .console-output}
Examples:
MMU_TTG_MAP TOOL=2 GATES=5 ...Map T2 to gate 5
MMU_TTG_MAP RESET=1        ...Reset TTG map to configured default (generally, Tx > gate_x for all gates
MMU_TTG_MAP MAP=0,0,0,0    ...Quickly map all tools (on 4 gate MMU) to the same gate 0 (forced MMU print to single filament)
```

### MMU_UNLOAD

*Unloads filament and parks it at the gate or optionally unloads just the extruder (EXTRUDER_ONLY=1)*

**Parameters**

```{.text .console-output}
EXTRUDER_ONLY = [0|1] Act only on extruder (implied for bypass)
SKIP_TIP      = [0|1] Force skipping of tip forming / cutting
RESTORE       = [0|1] Set to 0 to disable restoring toolhead position after unload
```

```{.text .console-output}
Examples:
MMU_UNLOAD            ...Unload filament from current gate
MMU_UNLOAD SKIP_TIP=1 ...Unload filament from current gate skipping purge macro
```

### MMU_UNLOCK

*Wakeup the MMU prior to resume to restore temperatures and timeouts*

**Parameters**

```{.text .console-output}
(no parameters)
```

```{.text .console-output}
Examples:
MMU_UNLOCK ...Wake the MMU after an error/pause to restore heater temperatures and timeouts prior to resume
```

## CALIBRATION/TESTING

### MMU_CALIBRATE_BOWDEN

*Calibration of reference bowden length for selected gate*

**Parameters**

```{.text .console-output}
REPEATS       = #(count) Number of repetitions (default: 3, min: 1, max: 10)
SAVE          = [0|1] Save calibration (default: 1)
MANUAL        = [0|1] Use manual calibration method (default: 0)
COLLISION     = [0|1] Force collision method (requires encoder) (default: 0)
RESET         = [0|1] Clear saved bowden length (default: 0)
HOMING_MAX    = #(mm) Extruder homing maximum (default: 150)
BOWDEN_LENGTH = #(mm) Approx bowden length (slightly < actual if using COLLISION)
```

```{.text .console-output}
Examples:
MMU_CALIBRATE_BOWDEN             ...calibrate bowden in current gate
MMU_CALIBRATE_BOWDEN MANUAL=1    ...calibrate bowden in reverse from manually placed filament at extruder gear
MMU_CALIBRATE_BOWDEN SAVE=0      ...measure bowden using default scheme but don't save the results
MMU_CALIBRATE_BOWDEN RESET=1     ...reset calibrated bowden for current gate. (allows first-time auto calibration)
```

### MMU_CALIBRATE_ENCODER

*Calibration routine for the MMU encoder*

**Parameters**

```{.text .console-output}
UNIT     = #(int)|_name_ Specify unit by name, number (optional if single unit)
LENGTH   = #(mm) Commanded distance (default: 400)
REPEATS  = #(count) Number of repetitions (default: 3, min: 1, max: 10)
SPEED    = #(mm/s) Move speed
ACCEL    = #(mm/s^2) Move accel
MINSPEED = #(mm/s) Minimum speed, speed of first repeat (default: SPEED)
MAXSPEED = #(mm/s) Maximum speed, speed of last repeat (default: SPEED)
SAVE     = [0|1] Save calibration (default: 1)
```

```{.text .console-output}
Examples:
MMU_CALIBRATE_ENCODER LENGTH=200 REPEATS=5      ...average over 5 repetitions with a move length of 200mm
MMU_CALIBRATE_ENCODER SAVE=0                    ...perform default calibration but don't save result
MMU_CALIBRATE_ENCODER MINSPEED=100 MAXSPEED=300 ...calibrate over default three moves of increasing speeds
```

### MMU_CALIBRATE_GATE

*Optional calibration of rotational distance using calibrated encoder and gate 0 reference*

**Parameters**

```{.text .console-output}
UNIT    = #(int)|_name_ Specify unit by name, number (only required if ALL=1 and multi-unit)
LENGTH  = #(mm) Commanded distance (default: 400)
REPEATS = #(count) Number of repetitions (default: 3, min: 1, max: 10)
ALL     = [0|1] Calibrate all gates (same as MMU_CALIBRATE_GATES alias)
GATE    = #(index) Gate to calibrate (defaults to current gate unless ALL=1)
SAVE    = [0|1] Save calibration (default: 1)
RESET   = [0|1] Reset gate rotation_distance
```

```{.text .console-output}
Examples:
MMU_CALIBRATE_GATE                         ...default calibration procedure of rd for current gate
MMU_CALIBRATE_GATE GATE=2 LENGTH=200       ...calibrate rd for gate 2 using a shorter than default 200mm movement
MMU_CALIBRATE_GATE ALL=1 LENGTH=200 SAVE=0 ...calibrate all gates unit in sequence, report but don't save results
MMU_CALIBRATE_GATE RESET=1                 ...reset the rotation distance for gate (or current gate) to default
MMU_CALIBRATE_GATE RESET=1 ALL=1           ...reset rd on all gates except first (reference) gate
```

### MMU_CALIBRATE_GEAR

*Calibration routine for gear stepper rotational distance of selected gate*

**Parameters**

```{.text .console-output}
MEASURED = #(mm) Measured moved distance
LENGTH   = #(mm) Commanded distance (default: 100, min: 50)
SAVE     = [0|1] Save calculated rotation_distance (default: 1)
RESET    = [0|1] Reset rotation_distance to default for selected gate (default: 0)
```

```{.text .console-output}
Examples:
MMU_CALIBRATE_GEAR MEASURED=96.5           ...measured 96.5mm on default 100mm move
MMU_CALIBRATE_GEAR LENGTH=200 MEASURED=202 ...moved 200mm and measured 202mm
MMU_CALIBRATE_GEAR RESET=1                 ...reset rotation distance for current gate to default
```

### MMU_CALIBRATE_PSENSOR

*Calibrate analog proportional sync-feedback sensor*

**Parameters**

```{.text .console-output}
MOVE = #(mm) Movement range used to search limits (default: buffer_maxrange, min: 1, max: 100)
```

```{.text .console-output}
Examples:
MMU_CALIBRATE_PSENSOR         ...perform calibration using default movement
MMU_CALIBRATE_PSENSOR MOVE=30 ...calibrate using a longer filament movement - for larger buffers
(filament must be loaded in extruder before running)
```

### MMU_CALIBRATE_ROTARY_SELECTOR

*Calibration of the selector positions or position of specified gate*

**Parameters**

```{.text .console-output}
UNIT   = #(int) Optional if only one unit fitted to printer
GATE   = #(int) Optional, default all gates on unit
SAVE   = [0|1]  Whether to persist the calibration results
SINGLE = [0|1]  Set to force the calibration of a single position only
QUICK  = [0|1]  Calibrate all offsets based on CAD geometry (good for initial setup)
```

### MMU_CALIBRATE_SELECTOR

*Calibration of the linear selector positions or position for specified gate*

**Parameters**

```{.text .console-output}
UNIT         = #(int) Optional if only one unit fitted to printer
GATE         = #(int) Optional, default all gates on unit
AUTO         = [0|1] Force fully automatic calibration (have first gate selected)
SAVE         = [0|1] Whether to persist the calibration results (default: 1)
EXTRAPOLATE  = [0|1] Whether to try to extrapolate remaining gate positions
RESET        = [0|11 To reset all calibration for MMU unit
BYPASS       = [0|1] Specify bypass gate instead of regular gate
BYPASS_BLOCK = [0|1] Special: If bypass block exists on ERCFv1.1 only
```

```{.text .console-output}
Examples:
MMU_CALIBRATE_SELECTOR GATE=8 SAVE=0         ...calibrate logical gate 8 position, display but don't save results
MMU_CALIBRATE_SELECTOR UNIT=1 BYPASS=1       ...calibrate the bypass gate position on unit 1
MMU_CALIBRATE_SELECTOR AUTO=1                ...perform fully automatic calibration of all gates (first gate selected)
MMU_CALIBRATE_SELECTOR SAVE=0                ...perform automatic calibration and show results but don't save
MMU_CALIBRATE_SELECTOR GATE=8 EXTRAPOLATE=1  ...calibrate logical gate 8 position, extrapolate other gates if possible
MMU_CALIBRATE_SELECTOR AUTO=1 BYPASS_BLOCK=2 ...auto calibrate old ERCFv1.1 with bypass block on second leg!
```

### MMU_CALIBRATE_SELECTOR_INDEXES

*Calibrate selector index gate sequence and endstop widths*

**Parameters**

```{.text .console-output}
UNIT  = #(int) Optional if only one unit fitted to printer
SAVE  = [0|1] Whether to persist the calibration results (default: 1)
RESET = [0|1] Reset selector index calibration
```

```{.text .console-output}
Examples:
MMU_CALIBRATE_SELECTOR_INDEXES         ...detect selector index gate order and endstop widths
MMU_CALIBRATE_SELECTOR_INDEXES SAVE=0  ...detect and report results but don't save
MMU_CALIBRATE_SELECTOR_INDEXES UNIT=1  ...calibrate selector indexes on unit 1
MMU_CALIBRATE_SELECTOR_INDEXES RESET=1 ...reset selector index calibration
```

### MMU_CALIBRATE_SERVO_SELECTOR

*Calibration of the selector servo angle for specified gate(s)*

**Parameters**

```{.text .console-output}
UNIT    = #(int) Optional if only one unit fitted to printer
ANGLE   = #(int) Move servo to designated angle
GATE    = #(int) Specify the gate by it's global logical index
LGATE   = #(int) Speficy gate by the local mmu unit index (same as GATE with single MMU unit)
SAVE    = 1      To persist the calibration results else they will just be reported
SINGLE  = 1      To force the calibration of a single gate only
SPACING = #(int) Angle between gates for quick setting all gates
BYPASS  = 1      To specify intention to define the bypass gate angle (if fitted)
RELEASE = 1      To specify intention to define a fixed release angle
RESET   = 1      To remove calibrated settings and default to configured starting values
(no options to show the current calibration)
```

```{.text .console-output}
Examples:
MMU_CALIBRATE_SERVO_SELECTOR                           ...Report on current calibration
MMU_CALIBRATE_SERVO_SELECTOR ANGLE=83                  ...Set servo to angle of 83°
MMU_CALIBRATE_SERVO_SELECTOR GATE=5 SINGLE=1           ...Save current servo angle as position for gate 2
MMU_CALIBRATE_SERVO_SELECTOR LGATE=0 SPACING=25 SAVE=0 ...Use current angle for local gate 0, space others at 25° intervals. Report but don't save results
MMU_CALIBRATE_SERVO_SELECTOR RELEASE=1                 ...Save the current angle for a fixed release position
```

### MMU_CALIBRATE_TOOLHEAD

*Automated measurement of key toolhead parameters*

**Parameters**

```{.text .console-output}
UNIT  = #(int)|_name_ Specify unit by name, number (optional if single unit)
CLEAN = [0|1] Measure clean nozzle dimensions (after cold pull)
DIRTY = [0|1] Measure residual filament (dirty nozzle)
CUT   = [0|1] Measure blade position (hold cutter closed)
SAVE  = [0|1] Persist results in active config (default: 1)
```

```{.text .console-output}
Reminder - run with this sequence of options:
    1) CLEAN=1 with clean extruder for: toolhead_extruder_to_nozzle, toolhead_sensor_to_nozzle (and toolhead_entry_to_extruder)
    2) DIRTY=1 with dirty extruder (uncut tip fragment) for: toolhead_residual_filament (and toolhead_entry_to_extruder)
    3) CUT=1 holding blade in for: variable_blade_pos
    Desired gate should be selected but the filament unloaded
    (SAVE=0 to run without persisting results)
    Note: On Type-B MMUs you might experience noise/grinding as movement limits are explored
          (select bypass or reduce gear stepper current if a problem)
    Examples:
    MMU_CALIBRATE_TOOLHEAD CLEAN=1        ...Step 1: measure clean nozzle dimensions (after cold pull)
    MMU_CALIBRATE_TOOLHEAD DIRTY=1        ...Step 2: measure residual filament with a dirty nozzle
    MMU_CALIBRATE_TOOLHEAD CUT=1          ...Step 3: measure blade position (hold the cutter closed)
    MMU_CALIBRATE_TOOLHEAD CLEAN=1 SAVE=0 ...Measure but don't persist the result to config
```

### MMU_SOAKTEST_LOAD_SEQUENCE

*Soak test tool load/unload sequence*

**Parameters**

```{.text .console-output}
UNIT   = #(int)|_name_ Optional to constrain test to specific unit
LOOP   = #(int)        How many times to do complete T0-Tx test loops (default 1)
RANDOM = 1             Randomize tool selection (tools may be skipped)
FULL   = [0|1]         Whether to perform full load to extruder enntry or quick partial bowden load
```

```{.text .console-output}
Examples:
MMU_SOAKTEST_LOAD_SEQUENCE LOOP=2        ...Loop sequentially through all tools twice performing partial bowden load
MMU_SOAKTEST_LOAD_SEQUENCE UNIT=1 FULL=1 ...Loop through all tools on unit 1 loading filament to extruder entrance each time
```

### MMU_SOAKTEST_SELECTOR

*Soak test of selector movement*

**Parameters**

```{.text .console-output}
UNIT  = #(int) Optional if only one unit fitted to printer
LOOP  = #(int) Test loops (default 10)
GRIP  = [0|1]  Force filament gripping after selection where optional
HOME  = [0|1]  Randomized homing
```

```{.text .console-output}
Examples:
MMU_SOAKTEST_SELECTOR UNIT=1 LOOP=1000 ...make 1000 gate selections on unit 1
MMU_SOAKTEST_SELECTOR HOME=1           ...randomly home whilst testing selection on current unit
MMU_SOAKTEST_SELECTOR GRIP=1           ...force filament grip after selection (where servo/gripping available)
```

### MMU_TEST_BUZZ_MOTOR

*Simple buzz the selected motor (default gear) for setup testing*

**Parameters**

```{.text .console-output}
MOTOR = [gear|gears|<selector_motor_name>]
```

```{.text .console-output}
Examples:
MMU_TEST_BUZZ_MOTOR                ...Buzz the gear motor (default) to confirm wiring/direction
MMU_TEST_BUZZ_MOTOR MOTOR=gears    ...Buzz the gear motor at every gate in turn
MMU_TEST_BUZZ_MOTOR MOTOR=selector ...Buzz the selector motor (exact name depends on MMU type)
```

### MMU_TEST_CONFIG

*Runtime adjustment of MMU configuration for testing or in-print tweaking purposes*

**Parameters**

```{.text .console-output}
UNIT  = #(int)|_name_ Specify unit by name, number (optional if single unit or changing shared parameters))
ALL   = [0|1]  Report all parameters even if not in user configfile (i.e system default values)
QUIET = [0|1]  Suppress non essential console messages
(no parameters to dump of current settings)
```

```{.text .console-output}
Examples:
MMU_TEST_CONFIG extruder_homing_max=150 log_level=2 ...set the extruder_homing_max parameter to 150 and console logging to 2 (debug) level
MMU_TEST_CONFIG toolhead_ooze_reduction=2.5 QUIET=1 ...silently set toolhead_ooze_reduction
MMU_TEST_CONFIG UNIT=1 sync_to_extruder=1           ...turn on extruder syncing for mmu unit 1
```

### MMU_TEST_FORM_TIP

*Convenience macro for calling the standalone tip forming functionality (or cutter logic)*

**Parameters**

```{.text .console-output}
RESET         = 1     To reset macro parameters to defaults
SHOW          = [0|1]
RUN           = [0|1]
EXTRUDER_ONLY = 1     To prevent syncing with MMU
(also accepts macro variable overrides; can use 'variable_' prefix or omit it)
```

```{.text .console-output}
Examples:
MMU_TEST_FORM_TIP               ...Run the standalone tip forming sequence for tuning
MMU_TEST_FORM_TIP SHOW=1        ...Display the current tip forming macro parameters
MMU_TEST_FORM_TIP EXTRUDER_ONLY=1 ...Form a tip without syncing the MMU gear motor
MMU_TEST_FORM_TIP RESET=1       ...Reset the tip forming macro parameters to their defaults
```

### MMU_TEST_GRIP

*Test the MMU grip for a Tool*

```{.text .console-output}
Examples:
MMU_TEST_GRIP ...Exercise the filament grip/servo for the current tool to verify operation
```

### MMU_TEST_HOMING_MOVE

*Test filament homing move to help debug setup / options*

**Parameters**

```{.text .console-output}
ALLOW_BYPASS = [0|1]  Ignore bypass check
MOVE         = mm     Specify the move distance (default 100)
ENDSTOP      = _endstop_name_
ENDSTOPS     = Comma separated list of endstops (only physical switch endstop possible)
STOP_ON_ENDSTOP = [-1|0|1] 1 for extrude, -1 for retract, 0 for don't stop
SPEED        = mm/s   Optionally override the default speed
ACCEL        = mm/s^2 Optionally override the default accelarateion
MOTOR        = [gear|extruder|gear+extruder] Select motor to operation on (default: gear)
WAIT         = [0|1]  Wait for move to complete (make move synchronous)
DEBUG        = [0|1]  Turn on developer stepper movement debugging
```

```{.text .console-output}
Examples:
MMU_TEST_HOMING_MOVE MOVE=50 ENDSTOP=extruder STOP_ON_ENDSTOP=1 ...Home up to 50mm in the extrude direction onto the extruder entry sensor
MMU_TEST_HOMING_MOVE MOVE=100 MOTOR=gear ENDSTOP=encoder STOP_ON_ENDSTOP=1 ...Home the gear motor up to 100mm using the encoder as endstop
MMU_TEST_HOMING_MOVE MOVE=-100 ENDSTOP=toolhead STOP_ON_ENDSTOP=-1 ...Home up to 100mm in the retract direction off the toolhead sensor
```

### MMU_TEST_LOAD

*For quick testing filament loading from gate to the extruder*

**Parameters**

```{.text .console-output}
FULL   = [0|1]
LENGTH = #(float) Bowden move length (when FULL=0)
```

```{.text .console-output}
Examples:
MMU_TEST_LOAD           ...Test load a short default distance from the gate
MMU_TEST_LOAD LENGTH=50 ...Test load 50mm of bowden movement from the gate
MMU_TEST_LOAD FULL=1    ...Test a full load from gate to the extruder
```

### MMU_TEST_MOVE

*Test filament move to help debug setup / options*

**Parameters**

```{.text .console-output}
ALLOW_BYPASS = [0|1]  Ignore bypass check
MOVE         = mm     Specify the move distance (default 100)
SPEED        = mm/s   Optionally override the default speed
ACCEL        = mm/s^2 Optionally override the default accelarateion
MOTOR        = [gear|extruder|gear+extruder|synced] Select motor to operation on (default: gear)
GRIP         = 1      To retain grip on filament after move for type-A testing
WAIT         = 0      Don't wait for move to complete (default 1 makes move synchronous)
DEBUG        = 1      Turn on developer stepper movement debugging
```

```{.text .console-output}
Examples:
MMU_TEST_MOVE SPEED=100                   ...Move filament default 100mm at 100mm/s speed
MMU_TEST_MOVE MOVE=50 MOTOR=gear+extruder ...Move filament 50mm sync extruder synced to gear
MMU_TEST_MOVE MOVE=100 GRIP=1             ...Move filament 100mm retaining filament grip (useful for MMU_CALIBRATE_GEAR on type-A)
```

### MMU_TEST_PURGE

*Convenience macro for calling the standalone purging macro*

**Parameters**

```{.text .console-output}
LAST_TOOL           = t
NEXT_TOOL           = t
EXTRUDER_ONLY       = 1 To prevent syncing with MMU
```

```{.text .console-output}
Examples:
MMU_TEST_PURGE                          ...Run the standalone purge macro for the current tool
MMU_TEST_PURGE LAST_TOOL=0 NEXT_TOOL=2  ...Purge using the volume calculated for a change from tool 0 to tool 2
MMU_TEST_PURGE EXTRUDER_ONLY=1          ...Purge without syncing the MMU gear motor
```

### MMU_TEST_RUNOUT

*Manually invoke the clog/runout detection logic for testing*

**Parameters**

```{.text .console-output}
TYPE = _event_type_ (optional, e.g. runout or clog)
```

```{.text .console-output}
Examples:
MMU_TEST_RUNOUT            ...Simulate a filament runout to test detection/EndlessSpool handling
MMU_TEST_RUNOUT TYPE=clog  ...Simulate a clog event instead of a runout
```

### MMU_TEST_TRACKING

*Test the tracking of gear feed and encoder sensing*

**Parameters**

```{.text .console-output}
DIRECTION   = [-1|1]   Move in retract or extruder direction
STEP        = #(float) mm of filament movement between encoder samples
SENSITIVITY = #(float) Override the default/calibrated encoder resolution
```

```{.text .console-output}
Examples:
MMU_TEST_TRACKING                    ...Run the gear-feed vs encoder tracking test
MMU_TEST_TRACKING STEP=2             ...Sample the encoder every 2mm of filament movement
MMU_TEST_TRACKING DIRECTION=-1 STEP=1 ...Test tracking in the retract direction with 1mm steps
```

## MACROS

### MMU_CHANGE_TOOL_STANDALONE

*Convenience macro for inclusion in print_start for initial tool load*

### MMU_END

*Called when ending print to finalize MMU*

### MMU_PRINT_END

*Forces clean up of state after after print end*

**Parameters**

```{.text .console-output}
IDLE_TIMEOUT = [0|1] Internally set if called by klipper idle_timeout
STATE        = [complete|error|cancelled|ready|standby] End state, defaults to complete
```

```{.text .console-output}
Call without parameters at the end of your print in the slicer's gcode end block
Examples:
MMU_PRINT_END               ...Clean up MMU state after a normal (complete) print
MMU_PRINT_END STATE=cancelled ...Clean up after a cancelled print
```

### MMU_PRINT_START

*Forces initialization of MMU state ready for print (usually automatic)*

```{.text .console-output}
Call at the start of your print in the slicer's gcode start block
Examples:
MMU_PRINT_START ...Initialize MMU state ready for a print
```

### MMU_START_CHECK

*Helper macro. Can be called to perform pre-start checks on MMU based on slicer requirements*

### MMU_START_LOAD_INITIAL_TOOL

*Helper to load initial tool if not paused*

### MMU_START_SETUP

*Called when starting print to setup MMU*

### MMU_UPDATE_HEIGHT

*Record maximum toolhead height for z-hop base (call on layer change for sequential printing)*

## CALLBACKS/HOOKS

### _MMU_ACTION_CHANGED

*Called when an action has changed*

### _MMU_EVENT

*Called when certain MMU actions occur*

### _MMU_POST_FORM_TIP

*Optional post tip forming/cutting routing*

### _MMU_POST_LOAD

*Optional post load routine for filament change*

### _MMU_POST_PRELOAD

*Optional post preload routine for filament change*

### _MMU_POST_UNLOAD

*Optional post unload routine for filament change*

### _MMU_PRE_LOAD

*Optional pre load routine for filament change*

### _MMU_PRE_UNLOAD

*Optional pre unload routine for filament change*

### _MMU_PRINT_STATE_CHANGED

*Called when print state changes*

## OTHER/ALIAS

### MMU_SELECT_BYPASS

*Select the filament bypass (alias for MMU_SELECT BYPASS=1)*

```{.text .console-output}
Examples:
MMU_SELECT_BYPASS ...Select the bypass so filament can be loaded straight into the extruder
```


---
