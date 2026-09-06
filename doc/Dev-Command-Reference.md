# Developer Command Reference

The commands [Command Reference](Reference-Commands.md) leaves out -
individual loading/unloading steps and internal machinery, generated
the same way from the same real `HELP_BRIEF`/`HELP_PARAMS`/
`HELP_SUPPLEMENT` source. Not part of the supported user interface;
useful when working on Happy Hare itself.

`_MMU_TEST` specifically has its own deep-dive - see [Developer Test
Command](Dev-Test-Command.md) for what its ~25 sub-tests actually do
and which ones are safe to run casually. This page has only its flat
parameter list, same as every other command below.

## STEPS

### _MMU_STEP_HOME_EXTRUDER

*User composable loading step: Home to extruder sensor or entrance through collision detection*

```{.text .console-output}
Examples:
_MMU_STEP_HOME_EXTRUDER ...Home filament to the extruder entrance (sensor or collision detection)
```

### _MMU_STEP_HOMING_MOVE

*User composable loading step: Generic homing move*

**Parameters**

```{.text .console-output}
(see MMU_TEST_HOMING_MOVE HELP=1 for options)
```

```{.text .console-output}
Examples:
_MMU_STEP_HOMING_MOVE MOVE=50 ENDSTOP=extruder STOP_ON_ENDSTOP=1 ...Home up to 50mm onto the extruder entry sensor
_MMU_STEP_HOMING_MOVE MOVE=100 MOTOR=gear ENDSTOP=encoder STOP_ON_ENDSTOP=1 ...Home the gear motor up to 100mm using the encoder
```

### _MMU_STEP_LOAD_BOWDEN

*User composable loading step: Smart loading of bowden*

**Parameters**

```{.text .console-output}
LENGTH    = mm   Override the default calibrated bowden length)
START_POS = mm   Postion of filament past the gate homing point at start of move
```

```{.text .console-output}
Examples:
_MMU_STEP_LOAD_BOWDEN            ...Load the bowden using the calibrated length
_MMU_STEP_LOAD_BOWDEN LENGTH=650 ...Load 650mm of bowden instead of the calibrated length
```

### _MMU_STEP_LOAD_GATE

*User composable loading step: Move filament from gate to start of bowden*

```{.text .console-output}
Examples:
_MMU_STEP_LOAD_GATE ...Load filament from the gate to the start of the bowden (used in custom load sequences)
```

### _MMU_STEP_LOAD_TOOLHEAD

*User composable loading step: Toolhead loading*

**Parameters**

```{.text .console-output}
EXTRUDER_ONLY   = [0|1] Extruder only load (e.g. when in bypass)
```

```{.text .console-output}
Examples:
_MMU_STEP_LOAD_TOOLHEAD                 ...Load filament from the extruder entrance into the nozzle
_MMU_STEP_LOAD_TOOLHEAD EXTRUDER_ONLY=1 ...Load the extruder only (e.g. when using bypass)
```

### _MMU_STEP_MOVE

*User composable loading step: Generic move*

**Parameters**

```{.text .console-output}
(see MMU_TEST_MOVE HELP=1 for options)
```

```{.text .console-output}
Examples:
_MMU_STEP_MOVE MOVE=50                    ...Move filament 50mm on the gear motor
_MMU_STEP_MOVE MOVE=100 MOTOR=gear+extruder ...Move filament 100mm with the gear synced to the extruder
```

### _MMU_STEP_SET_ACTION

*User composable loading step: Set action state*

**Parameters**

```{.text .console-output}
RESTORE = [0|1]   Set to restore previous action state
STATE   = _state_ Set action state and save previous for restore operation
```

```{.text .console-output}
Examples:
_MMU_STEP_SET_ACTION STATE=1   ...Set the action state (e.g. 1 = Loading; values are ACTION_* constants) saving the previous
_MMU_STEP_SET_ACTION RESTORE=1 ...Restore the previously saved action state
```

### _MMU_STEP_SET_FILAMENT

*User composable loading step: Set filament position state*

**Parameters**

```{.text .console-output}
STATE   = _state_ Filament position state
SILENT  = [0|1]   Set to suppress logging of new position
```

```{.text .console-output}
Examples:
_MMU_STEP_SET_FILAMENT STATE=0          ...Mark filament as fully unloaded
_MMU_STEP_SET_FILAMENT STATE=10 SILENT=1 ...Mark filament as loaded without logging (values are FILAMENT_POS_* constants)
```

### _MMU_STEP_UNLOAD_BOWDEN

*User composable unloading step: Smart unloading of bowden*

**Parameters**

```{.text .console-output}
LENGTH   = mm   Override the default calibrated bowden length)
```

```{.text .console-output}
Examples:
_MMU_STEP_UNLOAD_BOWDEN            ...Unload the bowden using the calibrated length
_MMU_STEP_UNLOAD_BOWDEN LENGTH=650 ...Unload 650mm of bowden instead of the calibrated length
```

### _MMU_STEP_UNLOAD_GATE

*User composable unloading step: Move filament from start of bowden and park in the gate*

**Parameters**

```{.text .console-output}
FULL   = [0|1]
```

```{.text .console-output}
Examples:
_MMU_STEP_UNLOAD_GATE        ...Unload filament from the bowden and park in the gate (fast, minimal homing)
_MMU_STEP_UNLOAD_GATE FULL=1 ...Unload with full homing distance (use when starting position is uncertain)
```

### _MMU_STEP_UNLOAD_TOOLHEAD

*User composable unloading step: Toolhead unloading*

**Parameters**

```{.text .console-output}
EXTRUDER_ONLY   = [0|1] Extruder only unload (e.g. when in bypass)
PARK_POS        = mm    The starting position of the filament in extruder (after tip forming / retraction)
```

```{.text .console-output}
Examples:
_MMU_STEP_UNLOAD_TOOLHEAD                 ...Unload filament from the nozzle back to the extruder entrance
_MMU_STEP_UNLOAD_TOOLHEAD PARK_POS=35     ...Unload assuming the tip is parked 35mm inside the extruder
_MMU_STEP_UNLOAD_TOOLHEAD EXTRUDER_ONLY=1 ...Unload the extruder only (e.g. when using bypass)
```

## INTERNAL (CAUTION!)

### CANCEL_PRINT

*Internal wrapper around default CANCEL_PRINT command*

### CLEAR_PAUSE

*Internal wrapper around default CLEAR_PAUSE command*

### PAUSE

*Internal wrapper around default PAUSE command*

### RESUME

*Internal wrapper around default RESUME command*

### _MMU_TEST

*Internal Happy Hare developer tests*

**Parameters**

```{.text .console-output}
HELP=1 Show this help
SYNC_STATE=['compression'|'tension'|'both'|'neutral'] Set the sync state ('loop' is disabled - it busy-waits and wedges the reactor)
SYNC_EVENT=[-1.0 ... 1.0] Generate sync feedback event
SEND_PRINTING_EVENT=[0|1] Send mmu:printing or mmu:not_printing event
ACTIVATE_FLOWGUARD=[0|1] Call the flowguard activation/deactivation hooks
WRAP_CURRENT=1 Test current wrapping and restore. Params; MOTOR=gear|extruder PERCENT=%
DUMP_UNICODE=1 Display special characters used in display
RUN_SEQUENCE=1 Run through the set of sequence macros tracking time. Params: ERROR=[0|1] FORCE_IN_PRINT=[0|1]
RUN_CHANGE_SEQUENCE=1 Run toolchange-style sequence. Params: PAUSE=[0|1] NEXT_POS=['last'|'next'] FORCE_IN_PRINT=[0|1]
GET_POS=1 Fetch the current filament position state
SET_POS={pos_state} Set the current filament position state
SET_RD={gear_rd} [GATE=] Update the specified gate's rotation distance
GET_POSITION=1 Fetch the current filament position
SET_POSITION={pos} Set the current filament position
GET_EXT_POSITION=1 Fetch the current extruder position
SET_ACTION={action} Set the current action state
SYNC_LOAD_TEST=1 Hammer stepper syncing and movement. Params: LOOP={n} ENDSTOP={name} SELECT=[0|1] WAIT=[0|1]
REALISTIC_SYNC_TEST=1 Load test normal stepper syncing and movement. Params: LOOP={n} ENDSTOP={name} SELECT=[0|1] SERVO=[0|1]
QUIESCE_TEST=1 Quick test of problematic sync changes
SEL_MOVE=1 Selector move. Params: MOVE={mm} SPEED={mm/s} ACCEL={mm/s^2} WAIT=[0|1] LOOP={n}
SEL_HOMING_MOVE=1 Selector homing move. Params: MOVE={mm} SPEED={mm/s} ACCEL={mm/s^2} LOOP={n} ENDSTOP={name}
SEL_LOAD_TEST=1 Load test selector movements. Params: LOOP={n} HOME=[0|1]
TTC_TEST=1 / TTC_TEST2=1 / TTC_TEST3=1 Provoke known TTC conditions. Params: LOOP={n} MIX=[0|1] DEBUG=[0|1] WAIT=[0|1]
STEPCOMPRESS_TEST=1 Provoke stepcompress error. Params: LOOP={n} MIX=[0|1] DEBUG=[0|1] WAIT=[0|1] SELECT=[0|1] MOTOR={name} STOP_ON_ENDSTOP=[-1|0|1]
NOTE_LOAD_TELEMETRY=1 Feed load telemetry to autotune. Params: GATE={n} LENGTH={mm} TRAVEL={mm} RATIO={f}
NOTE_UNLOAD_TELEMETRY=1 Feed unload telemetry to autotune. Params: GATE={n} LENGTH={mm} TRAVEL={mm} RATIO={f}
SYNC=[0|1|2|3|gear|gear+extruder|extruder|synced]
CALC_PURGE=1 Purge volume calculator quick tests
RUNOUT=[0|1] Enable/disable runout handling
SENSOR=1 Dump sensor path checks. Params: POS={n} GATE={n} LOADING=[0|1] LOOP=[0|1]
FILAMENT_POS={n} Set filament_pos state within sync wrapper
FILAMENT_DIR=[-1|0|1] Set filament_direction to unload|still|load
ADJUST_ENCODER={delta} Adjust the encoder distance reading by delta
SET_ENCODER={dist} Set the encoder distance reading to distance
DUMP_MCU_ENDSTOPS=1 Dump steppers registered on each MCU_endstop
DUMP_ACTIVE_SENSORS=1 Dump raw active sensors map
UPDATE_STATUS={dict} Force override (update) of mmu get_status() with supplied dict. 'OFF' to remove
NFC_READ=1 Simulate an NFC tag read. Params: UID={hex} DEEP=[0|1] GATE={n}(per-gate, else shared) UNIT={n} MATERIAL= BRAND= COLOR= DETAIL= MIN_TEMP= MAX_TEMP=
NFC_FIELD=1 Classify a tag UID against the gate map (no reader, no motion). Params: GATE={n} UID={hex}
```

### __MMU_ENCODER_INSERT

*Internal encoder filament insert detection handler*

### __MMU_ENCODER_RUNOUT

*Internal encoder filament runout handler*

### __MMU_SENSOR_CLOG

*Internal MMU filament clog handler*

**Parameters**

```{.text .console-output}
EVENTTIME = #(float)
SENSOR    = _sensor_name_
```

### __MMU_SENSOR_INSERT

*Internal MMU filament insertion handler*

**Parameters**

```{.text .console-output}
EVENTTIME = #(float)
SENSOR    = _sensor_name_
GATE      = #(int)
```

### __MMU_SENSOR_REMOVE

*Internal MMU filament removal handler*

**Parameters**

```{.text .console-output}
EVENTTIME = #(float)
SENSOR    = _sensor_name_
GATE      = #(int)
```

### __MMU_SENSOR_RUNOUT

*Internal MMU filament runout handler*

**Parameters**

```{.text .console-output}
EVENTTIME = #(float)
SENSOR    = _sensor_name_
GATE      = #(int)
```

### __MMU_SENSOR_TANGLE

*Internal MMU filament tangle handler*

**Parameters**

```{.text .console-output}
EVENTTIME = #(float)
SENSOR    = _sensor_name_
```


---
