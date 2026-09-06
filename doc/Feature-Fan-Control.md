# Feature: Fan Control

## Concept

Automatic, hysteresis-based control for ventilation or electronics-cooling
fans fitted to the MMU unit itself - not the printer's part-cooling fan.
Happy Hare polls the selected temperature source and switches a fan on at
the upper threshold and off at the lower threshold, so it does not chatter
at one boundary temperature.

Each managed fan can use either of these sources:

- **Environment sensor** - the enclosure temperature sensor configured for
  the unit or gate.
- **MCU temperature** - the MMU controller's CPU-temperature sensor.

At least one of those temperature sources must be configured before
menuconfig offers managed fans. `MMU_FAN` can then change the source,
thresholds, automatic-control state or forced mode at runtime.

Two hardware layouts are supported:

- **Shared fan** - one fan for the whole MMU unit. This is the common case.
- **Per-gate fans** - a gate-aligned list of fans for modular designs such
  as EMU; each fan can have its own mode, source and temperature range.

!!! info "Managed fans and heater fans are different"
    A managed fan is a `[fan_generic]` controlled by `MMU_FAN`. A heater fan
    is a Klipper `[heater_fan]` tied directly to an enclosure heater and is
    configured with the heater instead. `MMU_FAN` does not control heater
    fans.

## Hardware Setup

Enable **MMU Features / Additions → Enable managed fan(s)?**. The option is
available when either **Has environment sensor(s)?** or **Create MCU CPU
sensor(s)?** is enabled.

<p align="center">
  <img src="Feature-Fan-Control/fan-config.png" alt="Managed fan hardware configuration: maximum power, kick-start time and shared fan pin" width="80%">
</p>

| Setting | Purpose |
|---|---|
| `Fan maximum power` | Cap on PWM power, `0.1`-`1.0` (default `1.0` = 100%) |
| `Fan kick start time` | Seconds to run at full power before settling to target speed - helps a fan that struggles to start from a low duty cycle (default `0.5`) |
| `Fan pin` | Shared fan output; leaving it blank creates no manageable fan |

A shared layout generates both the Klipper fan and its association with the
MMU unit in `mmu_hardware.cfg`:

```ini
[mmu_unit unit0]
fan            : _unit0_fan

[fan_generic _unit0_fan]
pin             : PB5
max_power       : 1.0
kick_start_time : 0.5
```

On a per-gate layout, open **Per-gate config → Gate N config**, enable
**Managed cooling fan**, then enter **Fan h/w config**. Each gate has its
own pin, maximum power and kick-start time; leave the fan disabled on gates
without one. The generated unit association preserves blank positions so
the list remains aligned with the gate numbers:

```ini
[mmu_unit unit0]
fans           : _unit0_fan0, _unit0_fan1, , _unit0_fan3

[fan_generic _unit0_fan0]
pin             : PB5
max_power       : 1.0
kick_start_time : 0.5
```

## Parameter Setup

<p align="center">
  <img src="Feature-Fan-Control/fan-controls.png" alt="Managed fan defaults: temperature source, on and off thresholds, polling interval, automatic control and startup mode" width="80%">
</p>

The **Managed fan defaults** menu writes these settings to
`mmu_parameters.cfg`:

```ini
default_fan_temperature_source : environment  # environment or mcu
default_fan_on_temp            : 49.0         # °C - switch on at or above this
default_fan_off_temp           : 47.0         # °C - switch off at or below this
fan_polling_time               : 5.0          # Seconds between checks
fan_control_enabled            : 1            # 1=enabled, 0=disabled and fans off
fan_forced                     : 2            # 0=OFF, 1=ON, 2=AUTO
```

`default_fan_on_temp` must be greater than or equal to
`default_fan_off_temp`. The gap between them is the hysteresis band. Every
fan begins with these defaults; per-gate source and threshold changes made
with `MMU_FAN` remain independent until Happy Hare restarts.

## Commands

```text
MMU_FAN                                      # Status for the current unit
MMU_FAN UNIT=unit1                           # Status for another unit
MMU_FAN ENABLE=1                             # Enable automatic management
MMU_FAN ENABLE=0                             # Disable management and turn all unit fans off
MMU_FAN FAN_FORCED=1                         # Force all managed fans on
MMU_FAN FAN_FORCED=0 GATE=2                  # Force gate 2's fan off
MMU_FAN FAN_FORCED=2 GATES=1,2               # Return gates 1 and 2 to AUTO
MMU_FAN SOURCE=mcu GATE=2                    # Use gate 2's MCU temperature
MMU_FAN SOURCE=default GATE=2                # Restore gate 2's configured source
MMU_FAN ON_TEMP=60 OFF_TEMP=58 GATE=2        # Change gate 2's AUTO range
```

`GATE=` and `GATES=` are only valid for a per-gate fan layout. Without either,
an action applies to every managed fan on the selected unit. Runtime changes
are not written back to the config files, so a restart restores the
menuconfig defaults.

Full parameter reference: [`MMU_FAN`](Reference-Commands.md#mmu_fan).

A bare call reports the controller state, effective AUTO range and each fan's
mode, speed, source and current temperature:

```{.text .console-command}
MMU_FAN
```

```{.text .console-output}
MMU fan control for unit0: ENABLED
AUTO range in force: OFF <= 47.0°C, ON >= 49.0°C; polling 5.0s
Fan (_unit0_fan): AUTO, 0%, source environment: 31.4°C
```

## Printer variables exposed

The unit metadata exposes `fan` for a shared fan or the gate-aligned `fans`
list for a per-gate layout. See
[printer.mmu_machine](Reference-Printer-Variables.md#printermmu_machine).

The underlying `[fan_generic]` objects also expose Klipper's usual fan
status, including their current `speed`.

## Tuning

Start with a generous hysteresis band - for example, ON at `49°C` and OFF at
`47°C` - and a polling interval of several seconds. If the fan cycles too
often, lower the OFF threshold rather than raising the polling rate. Select
the temperature source that represents what the fan is protecting: enclosure
temperature for ventilation, MCU temperature for controller cooling.

## Troubleshooting

- **`No manageable fans on this unit`** - confirm a fan pin is configured,
  select the intended `UNIT=`, and restart Klipper after regenerating the
  configuration.
- **A requested source is unavailable** - enable and configure that
  environment or MCU sensor for the same unit or gate, then restart Klipper.
- **A fan never turns on in AUTO** - confirm `ENABLE=1`, return it to AUTO
  with `FAN_FORCED=2`, check the reported source temperature, and verify the
  ON threshold is reachable.
- **A fan cycles too often** - widen the hysteresis band by lowering the OFF
  threshold. Keep ON greater than or equal to OFF; inverted values are
  rejected.
- **`GATE=` or `GATES=` is rejected** - those selectors require a per-gate
  fan layout. A shared fan always applies to its entire unit.

## See also

- [Feature: Environment Manager](Feature-Environment-Manager.md) - enclosure temperature sensors
- [Parameters](Reference-Parameters.md#fan-management) - generated fan defaults
- [`MMU_FAN` command reference](Reference-Commands.md#mmu_fan) - complete syntax

---
