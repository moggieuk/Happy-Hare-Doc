# Hardware Validation

Run these checks after the installer has generated the Happy Hare configuration
and Klipper starts without an error, but before calibration or a first load. The
goal is simple: prove that every connected board, motor and sensor agrees with
the generated configuration before asking Happy Hare to depend on it.

!!! warning "Keep the mechanism clear"
    Remove filament from the hotend and MMU unless a step specifically asks for
    a short fragment. Keep hands clear of belts, gears, selectors and spool
    drives while a motor is enabled. Start with the short moves shown here and
    be ready to use the emergency stop if a mechanism moves toward a hard stop.

## MCU Connection

A successful Klipper restart is the first MCU test. Klipper will not reach its
ready state if an `[mcu ...]` section in `mmu_hardware.cfg` points at a board it
cannot connect to. Check the console after `RESTART` and resolve every
`Unable to connect to MCU` or shutdown message before testing motion.

### Serial connections

For a USB/serial board, list the stable device names currently available:

```bash
ls -l /dev/serial/by-id/
```

The value should match the `serial:` entry in that board's `[mcu ...]` section.
Do not substitute a transient `/dev/ttyUSB*` or `/dev/ttyACM*` name. If several
similar devices are listed, run the command before and after unplugging the MMU
controller; the entry that disappears belongs to that board.

If the expected device is absent, check board power, the USB data cable,
firmware and the communication interface selected when the firmware was built.
Once the path is correct, restart Klipper and confirm it reaches ready state.

### CANbus connections

For a CANbus board that has not yet been claimed by Klipper, query the `can0`
network from the Klipper host:

```bash
~/klippy-env/bin/python ~/klipper/scripts/canbus_query.py can0
```

A discoverable board reports a line containing its UUID:

```{.text .console-output}
Found canbus_uuid=127081e7e3c6, Application: Klipper
```

The UUID must match the `canbus_uuid:` entry in that board's `[mcu ...]`
section. If a different CAN interface is configured, use that interface in
both the query and `canbus_interface:` setting.

!!! note
    `canbus_query.py` discovers unclaimed nodes. A correctly configured board
    may stop appearing once Klipper has connected to it, so an empty query is
    not evidence of a failure after Klipper has already reached ready state.

If the board is not discovered before Klipper claims it, check its power,
firmware communication mode, CAN high/low wiring, bus termination, host CAN
interface and bitrate. If it is discovered but Klipper cannot connect, check
the copied UUID and interface first.

Some designs have more than one controller: a separate buffer MCU, one MCU per
gate, or several physical MMU units. Validate every generated `[mcu ...]`
section; one connected board does not prove the others are reachable.

See [MCU Reference](Reference-Mcu.md) for supported boards, firmware settings
and flashing guidance. The [Box Turtle](GettingStarted-BoxTurtle.md#mcu-connection)
and [BTT ViViD](GettingStarted-ViViD.md#mcu-connections-two-separate-boards)
guides show serial selection for one- and two-board examples.

## Filament Sensors

Run `MMU_SENSORS` once with every filament path empty. It reports every sensor
Happy Hare knows about, including disabled sensors:

```{.text .console-command}
MMU_SENSORS
```

```{.text .console-output}
filament_compression  --> Open
filament_tension      --> Open
mmu_entry_0           --> Open
mmu_exit_0            --> Open
mmu_shared_exit       --> Open
extruder              --> Open
toolhead              --> Open
```

Your list will contain only the sensors fitted to your machine. On a multi-unit
machine, names may be qualified, for example `unit0:mmu_shared_exit`.

Use a short fragment of filament to trigger **every switch in turn**:

1. Insert the fragment far enough to operate one switch.
2. Run `MMU_SENSORS` and confirm only the intended sensor changes to
   `TRIGGERED`.
3. Remove the fragment and confirm it returns to `Open`.
4. Repeat for every entry, exit, shared-exit, extruder and toolhead sensor on
   every gate and unit.

If a switch reads backward, correct the pin inversion in menuconfig or
`mmu_hardware.cfg`. If it never changes, check the selected pin, connector and
whether the input needs a pull-up (`^`). Do not leave a safety-relevant sensor
disabled just to make this checklist pass.

The [Sensors feature](Feature-Sensors.md) explains sensor naming, multi-unit
qualification, persistent enable/disable state and shared-gate endstop safety.

## Gear Stepper Movement and Direction

First identify the gear motor without feeding filament:

```text
MMU_TEST_BUZZ_MOTOR
```

The selected gate's gear motor should make a short back-and-forth movement.
Type B/C MMUs (with a gear stepper per gate) can exercise every drive in
turn:

```text
MMU_TEST_BUZZ_MOTOR MOTOR=gears
```

Next insert a short, visible fragment of filament into the selected drive and
test actual direction:

```text
MMU_SELECT GATE=0
MMU_TEST_MOVE MOVE=50 GRIP=1
MMU_TEST_MOVE MOVE=-50 GRIP=1
```

A positive move must feed filament away from the spool and toward the
extruder. A negative move must return it toward the spool. If the directions
are reversed, invert that stepper's `dir_pin` by adding or removing `!`, then
restart Klipper and test again.

- A shared-drive design needs this test once after its selector is working.
- Type B/C MMUs need it on every gate; select each gate and repeat.
- A Type C design has both a moving selector and one drive per gate, so it
  needs every test in both this section and [Selector Validation](#selector-validation).

Direction only proves that the motor is wired coherently. Calibrate its actual
movement afterward using [Gear Rotation Distance](Calibration-Gear.md).

## Encoder Validation (if fitted)

An encoder measures distance traveled, not direction. Reset or note its
position, pull filament through it by hand, then query it again:

```text
MMU_ENCODER POS=0
MMU_ENCODER
```

Move the filament back and forth through the encoder and run `MMU_ENCODER`
again. The reading should increase in either direction. If it does not change,
check `encoder_pin`; most encoders need a pull-up (`^`), while inversion (`!`)
normally makes no difference.

This only validates wiring and pulse detection. Continue with the
[Encoder feature](Feature-Encoder.md) for setup and troubleshooting, then
[Encoder Calibration](Calibration-Encoder.md) after gear rotation distance is
correct.

## Selector Validation

Which checks apply depends on the selector mechanism. Use
[What Is an MMU?](Conceptual-MMU.md#selector-mechanisms) if you are unsure
which family your design belongs to.

| Selector mechanism | Validation |
|---|---|
| Type B / virtual selector | There is no selector motor or selector home switch. Validate every gear drive instead. |
| Linear or rotary stepper selector | Validate its home/index endstop, buzz the selector motor, home it, then select gates across its range. |
| Indexed stepper selector | Validate the index switches, home it, then select every gate so each index is exercised. |
| Servo-cam selector | Buzz the selector servo, then select every gate. There is no stepper direction pin to invert. |
| Type C | Validate the moving selector and every per-gate gear drive. |
| Fully custom macro selector | Use the hardware project's own validation sequence; there is no generic selector motion to test. |

### Physical endstops

Before homing a stepper-driven selector, move it away from its hard stops with
the motors off and query the configured endstops:

```text
MMU_MOTORS_OFF
QUERY_ENDSTOPS
```

Manually press the selector home or index switch and run `QUERY_ENDSTOPS`
again. The intended endstop must change from `open` to `TRIGGERED`, then return
to `open` when released. Correct the pin or its inversion before attempting to
home if it does not.

### Selector movement

With the mechanism clear, exercise the configured selector motor:

```text
MMU_TEST_BUZZ_MOTOR MOTOR=selector
```

For a stepper selector this makes a small back-and-forth move. For a servo-cam
selector it makes a small movement within its configured angle range. A linear
selector with a separate grip servo can test that servo too:

```text
MMU_TEST_BUZZ_MOTOR MOTOR=servo
```

For a stepper-driven selector, now home and select representative gates. A
servo-cam selector can skip `MMU_HOME` and just select the gates:

```text
MMU_HOME
MMU_SELECT GATE=0
MMU_SELECT GATE=3
```

Replace `3` with the last gate on your machine. The selector must move toward
its home/index reference when homing, stop on the expected switch, and align
cleanly at both ends of its range. If a stepper selector initially moves away
from home, correct its `dir_pin` before trying again.

This establishes movement and sensing, not accurate gate positions. Use
[Selector Calibration](Calibration-Selector.md) for the mechanism-specific
calibration commands and grip-servo positions.

## eSpooler Movement (if fitted)

Test an eSpooler with a scrap or empty spool first. A direction or power error
can unwind a full spool surprisingly quickly.

Run one short burst in each direction:

```text
MMU_ESPOOLER GATE=0 OPERATION=rewind BURST=1
MMU_ESPOOLER GATE=0 OPERATION=assist BURST=1
MMU_ESPOOLER ALLOFF=1
```

- `rewind` must take up slack onto the spool.
- `assist` must feed filament off the spool toward the MMU.
- `ALLOFF=1` is the immediate stop for every eSpooler.

Repeat for every fitted gate. If a direction is wrong, check that the gate's
`respool_motor_pin` and `assist_motor_pin` match the driver wiring and that
their active polarity is correct. Do not compensate for swapped directions by
tuning power.

See the [eSpooler feature](Feature-Espooler.md#setting-up-each-mode) for pin
configuration, power curves, burst tuning and continuous-operation tests.

## Sync-Feedback Buffer (if fitted)

Sync-feedback switches are frequently named from the buffer's visible motion
rather than from what the **filament feels**. That reverses their meaning.

!!! warning "Name the filament condition"
    **Compression** must trigger when the filament feels compression because
    excess filament is being fed into the path. On a typical buffer this makes
    the buffer physically **expand**.

    **Tension** must trigger when the filament feels tension because filament is
    being pulled taut. On a typical buffer this makes the buffer physically
    **compress**.

With no load applied, place the mechanism at its neutral position and run:

```text
MMU_SENSORS
MMU_SYNC_FEEDBACK
```

Then move the buffer by hand through both extremes and query it again at each
position. Confirm that:

- the expanded/excess-filament extreme reports `filament_compression` as
  `TRIGGERED`;
- the compressed/taut-filament extreme reports `filament_tension` as
  `TRIGGERED`;
- each switch releases again when the buffer leaves that extreme.

Some mechanisms move differently, so the physical words “expanded” and
“compressed” are only the typical geometry. The definitive labels are always
the conditions experienced by the filament. If the two conditions are
backward, swap the assignments to `compression_pin` and `tension_pin`. If one
switch is permanently triggered, correct its inversion instead.

For a proportional sensor, check that `MMU_SENSORS` reports a changing raw
value across the full travel rather than expecting two digital trigger lines.
Calibration and all single-switch, dual-switch and proportional arrangements
are covered by the
[Sync-Feedback Buffer feature](Feature-Sync-Feedback-Buffer.md).

## Understanding Movement and Homing

Happy Hare treats the MMU mechanism as a second motion system. The selector is
one axis where a moving selector exists, while filament movement is driven by
the MMU gear stepper. During loading and unloading, the gear and printer
extruder can also be coupled so both motors participate in the same move.

### Named endstops

An MMU stepper can have a normal default endstop and additional named
endstops. Filament sensors after the MMU entry automatically become named
endstops as well as visible sensors, allowing a move to home to an exit,
extruder or toolhead switch. An encoder can provide a virtual movement
endstop, while a configured TMC DIAG pin can provide a StallGuard “touch”
endstop such as `mmu_gear_touch` or `mmu_sel_touch`.

The endstop must belong to the motor that leads the homing move. For example,
an extruder StallGuard endstop is used with `MOTOR=extruder`, while an endstop
on the MMU gear rail is used with `MOTOR=gear` or `MOTOR=gear+extruder`.
Happy Hare rejects an incompatible combination and reports the valid names.

!!! warning "StallGuard is not a first-line wiring test"
    Tune physical switches and ordinary motion first. StallGuard depends on
    motor current, speed, mechanics and TMC sensitivity. A virtual StallGuard
    endstop can only home in the forward/extrude direction; it cannot be used
    for a reverse release-homing move.

`mmu_sel_touch` is normally an additional selector endstop used to detect
filament blocking a gate. A custom build can use a TMC virtual endstop as the
selector's default homing reference, but that requires careful StallGuard
tuning and zero homing retract distance. A mechanical home switch remains the
simpler validation reference where the design provides one.

### Motor combinations

[`MMU_TEST_MOVE`](Reference-Commands.md#mmu_test_move) supports these motor
choices:

| `MOTOR=` | What moves |
|---|---|
| `gear` | MMU gear stepper only |
| `extruder` | Printer extruder only, using the MMU motion path |
| `gear+extruder` | Gear leads and the extruder is coupled to it |
| `synced` | Extruder leads and the MMU gear follows it, like synchronized printing |

Use plain moves only after each motor has passed its individual direction
test. Moving the extruder may require the hotend to be at a safe extrusion
temperature when filament is present.

```text
MMU_TEST_MOVE MOVE=25 MOTOR=gear
MMU_TEST_MOVE MOVE=25 MOTOR=gear+extruder
```

[`MMU_TEST_HOMING_MOVE`](Reference-Commands.md#mmu_test_homing_move) supports
`gear`, `extruder` and `gear+extruder`—not `synced`—and stops when the named
endstop reaches the requested state:

```text
MMU_TEST_HOMING_MOVE MOVE=50 MOTOR=gear ENDSTOP=extruder STOP_ON_ENDSTOP=1
MMU_TEST_HOMING_MOVE MOVE=-50 MOTOR=gear ENDSTOP=toolhead STOP_ON_ENDSTOP=-1
```

`STOP_ON_ENDSTOP=1` homes in the forward/extrude direction until the endstop
triggers. `STOP_ON_ENDSTOP=-1` homes in reverse until a physical endstop
releases. Use short distances until the endstop and motor pairing have been
proved.

These test commands expose the same coordinated movement used by Happy Hare's
normal load and unload sequences. For advanced replacement sequences, see
[Custom Load/Unload Sequences](Custom-Load-Unload-Sequences.md); most machines
should use the built-in sequence instead.

## Validation Checklist

Use this list after working through the detailed checks above. Mark a tab
**N/A** when its mechanism or optional hardware is not fitted.

=== "Required"

    | Done | Check | Pass condition |
    |:---:|---|---|
    | ☐ | [MCU connection](#mcu-connection) | Klipper reaches ready state with every MMU-related MCU connected. |
    | ☐ | MCU identity | The selected serial device path or CANbus UUID matches every generated `[mcu ...]` section. |
    | ☐ | [Filament sensors](#filament-sensors), empty | Every fitted switch reads `Open` with an empty path. |
    | ☐ | Filament sensor triggers | Every entry, exit, shared-exit, extruder and toolhead switch changes to `TRIGGERED` with a fragment of filament, then returns to `Open`. |
    | ☐ | [Gear stepper buzz](#gear-stepper-movement-and-direction) | Every drive responds to a buzz test. |
    | ☐ | Gear stepper direction | Every drive feeds toward the extruder on a positive move and toward the spool on a negative move. |

=== "Selector"

    Type B / virtual selectors have no selector hardware to validate; mark this
    tab **N/A** for those designs.

    | Done | Check | Pass condition |
    |:---:|---|---|
    | ☐ | [Selector mechanism](#selector-validation) | The checks appropriate to the selector are complete. |
    | ☐ | Selector endstops | A stepper selector's home/index switches change state correctly before powered homing. |
    | ☐ | Selector movement | The selector homes correctly and reaches every gate, or a servo selector reaches every gate without homing. |

=== "Encoder (optional)"

    | Done | Check | Pass condition |
    |:---:|---|---|
    | ☐ | Encoder response | `MMU_ENCODER` reports a position. |
    | ☐ | Encoder movement | The count increases when filament is moved through the encoder in either direction. |

=== "eSpooler (optional)"

    | Done | Check | Pass condition |
    |:---:|---|---|
    | ☐ | Rewind | Every fitted gate responds to a short `rewind` burst and takes up slack. |
    | ☐ | Assist | Every fitted gate responds to a short `assist` burst and feeds filament toward the MMU. |
    | ☐ | Stop | `MMU_ESPOOLER ALLOFF=1` stops every eSpooler. |

=== "Sync-Feedback (optional)"

    | Done | Check | Pass condition |
    |:---:|---|---|
    | ☐ | Neutral | The buffer reports a neutral state away from either extreme. |
    | ☐ | Compression | Filament compression triggers `filament_compression`—typically when the physical buffer is expanded. |
    | ☐ | Tension | Filament tension triggers `filament_tension`—typically when the physical buffer is compressed. |
    | ☐ | Switch release | Each switch releases when the buffer leaves its extreme position. |
    | ☐ | Proportional sensor | The raw value changes smoothly across the full buffer travel. |

Continue with the [Calibration overview](Calibration.md), which lists the
required and optional calibration steps for each mechanism.

## See also

- [Feature: Sensors](Feature-Sensors.md)
- [Feature: Encoder](Feature-Encoder.md)
- [Feature: eSpooler](Feature-Espooler.md)
- [Feature: Sync-Feedback Buffer](Feature-Sync-Feedback-Buffer.md)
- [Calibration: Selector](Calibration-Selector.md)
- [Calibration: Gear Rotation Distance](Calibration-Gear.md)
- [Command Reference](Reference-Commands.md)

---
