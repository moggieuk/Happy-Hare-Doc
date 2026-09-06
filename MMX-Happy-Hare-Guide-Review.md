# Review of the CN3D MMX Happy Hare Guide

Reviewed page: [MMX Happy Hare Setup — CN3D Docs](https://docs.cn3d.eu/en/projects/mmx/happy-hare)

Overall, this is a friendly and useful project-specific introduction. I
understand wanting an MMX-owned walkthrough, especially for assembly and
wiring. However, much of the Happy Hare installation material duplicates the
upstream documentation, and several sections currently describe older
configuration practices.

The MMX guide would be strongest if it retained control of the MMX-specific
assembly, wiring and hardware details while linking to the Happy Hare
documentation for installer behavior, configuration management, backup,
recovery and calibration commands.

## Architecture

The description of MMX as a four-gate servo-cam selector is correct. However,
ERCF and Tradrack do not share that selector mechanism: they use a linear
carriage with a separate grip servo.

See [What Is an MMU?](https://moggieuk.github.io/Happy-Hare-Doc/Conceptual-MMU/#which-vendors-use-which-mechanism).

## Running the Installer

`./install.sh -i` is valid, but a new installation can simply run:

```bash
./install.sh
```

The first run opens `menuconfig` automatically. The table of sequential
“installer questions” would be more accurate if presented as menu choices,
because Happy Hare v4 uses a dynamic `menuconfig` interface rather than the old
question-and-answer installer flow.

See:

- [Installation](https://moggieuk.github.io/Happy-Hare-Doc/Installation/)
- [Menuconfig](https://moggieuk.github.io/Happy-Hare-Doc/GettingStarted-Installer-Configurator/)

## Pin Configuration

Users should not create EBB42 pin aliases in `mmu.cfg`. Happy Hare v4’s board
profile generates fully qualified pins such as `unit0:PD0` directly. Wiring
changes belong in **Pins / TMC** inside `menuconfig`.

For the reference BTT EBB42 v1.2 wiring, the generated values are:

| Function | Generated pin |
|---|---|
| Gear UART | `unit0:PA15` |
| Gear step | `unit0:PD0` |
| Gear direction | `unit0:PD1` |
| Gear enable | `!unit0:PD2` |
| Selector servo | `unit0:PB9` |
| Entry sensors 0–3 | `^unit0:PB7`, `^unit0:PB5`, `^unit0:PB6`, `^unit0:PB8` |
| Shared exit sensor | `^unit0:PB4` |
| NeoPixel | `unit0:PD3` |

If the physical build differs from this reference, the user should enter the
pins from the hardware they actually built rather than copying these values
blindly.

## Filament Sensors

The four PB7/PB5/PB6/PB8 switches should be enabled under **MMU Features /
Additions → Filament sensors** as **gate/lane entry sensors**. They become
`mmu_entry_0` through `mmu_entry_3`.

PB4 is an important distinction. In the reference design it is located after
the selector and before the shared Bowden path, so Happy Hare treats it as the
**shared exit sensor**, not a toolhead sensor. It provides the MMX gate-homing
reference.

Commenting it out to avoid a false “filament loaded” indication hides a wiring,
pull-up or inversion problem and leaves the MMX without its intended homing
sensor. `MMU_SENSORS` should be used to diagnose the switch instead:

```text
MMU_SENSORS
```

See [Hardware Validation: Filament Sensors](https://moggieuk.github.io/Happy-Hare-Doc/Hardware-Validation/#filament-sensors).

## Selector and Sync-Feedback Settings

Selecting the MMX profile already sets the following appropriate defaults:

- `ServoSelector`
- Four gates
- MG-996R selector servo
- MMX starting servo angles
- Gear ratio and motor currents
- LED capability

A normal MMX also leaves sync feedback disabled automatically. Neither
`selector_type` nor `sync_feedback_enabled` needs to be hand-edited in the
generated configuration.

Optional hardware such as a sync-feedback buffer, encoder or eSpooler should
only be enabled when it is physically fitted.

## Selector Calibration

The recommendation to use `MMU_GRIP`, `MMU_RELEASE` and
`MMU_CALIBRATE_SERVO_SELECTOR` is correct. Servo alignment must be verified
gate by gate because MMX has no physical selector zero mark.

Typical calibration commands are:

```text
MMU_CALIBRATE_SERVO_SELECTOR
MMU_CALIBRATE_SERVO_SELECTOR ANGLE=83
MMU_CALIBRATE_SERVO_SELECTOR GATE=0 SINGLE=1
```

See [Servo-cam Selector Calibration](https://moggieuk.github.io/Happy-Hare-Doc/Calibration-Selector/#servo-cam-selectors).

## Mainsail and Fluidd

Mainsail and Fluidd integrate directly with Happy Hare. Updating the interface
is sensible if the MMU panel is missing, but access to the panel should not be
treated as the only way to validate the hardware. Sensor, motor and selector
checks can all be performed from the Klipper console.

See [Mainsail / Fluidd](https://moggieuk.github.io/Happy-Hare-Doc/Mainsail-Fluidd-Integration/).

## Automatic Backups and Recovery

A manual configuration backup is unnecessary before running the Happy Hare
installer. Every normal installer run automatically creates a timestamped
backup of the existing MMU configuration.

Users can list and recover available configurations with:

```bash
cd ~/Happy-Hare
./install.sh -i --prev
```

The installer lists the current configuration first and timestamped backups
from newest to oldest. When an older backup is selected, the installer first
preserves the configuration being replaced, restores the selected directory
and opens the recovered choices in `menuconfig`.

See [Recovering Configuration from a Backup](https://moggieuk.github.io/Happy-Hare-Doc/GettingStarted-Installer-Configurator/#recovering-configuration-from-a-backup).

## Returning to a Preserved Happy Hare v3 Installation

If an MMX installation was upgraded from v3, the upgrade preserves the
original configuration as `mmu.V3`. The clean return procedure is:

```bash
cd ~/Happy-Hare
./install.sh -d
cp -a ~/printer_data/config/mmu.V3 ~/printer_data/config/mmu
./install.sh -b v3
```

The uninstall step automatically backs up the active v4 configuration, removes
the installed v4 modules and configuration, and leaves `mmu.V3` intact. Using
`cp -a` rather than moving the directory keeps the original v3 backup
available. The final command switches the checkout and Moonraker update manager
to the `v3` branch and runs the v3 installer against the restored configuration.

Printers using a custom installer `-c` path must substitute that configuration
directory for `~/printer_data/config`. If several `mmu.V3-*` directories exist,
the correct saved v3 state should be identified before copying it. The copy
must not be run over an existing `mmu` directory.

See [Upgrading from v3 to v4](https://moggieuk.github.io/Happy-Hare-Doc/Upgrade-v3-v4/#return-to-v3-after-completing-a-v4-setup).

## Recommendation

The CN3D guide provides valuable MMX-specific context and is worth retaining,
particularly for assembly, power and wiring. For maintainability, I recommend
keeping the Happy Hare portion focused on the few MMX-specific choices:

1. Select the original four-gate MMX profile, not MMX6.
2. Select the controller and connection actually fitted.
3. Enable the four entry sensors and the PB4 shared exit sensor.
4. Review the fully qualified pins generated by `menuconfig`.
5. Validate sensors, gear direction and every servo gate.
6. Link to the upstream Happy Hare pages for general installation, backup,
   recovery and calibration behavior.

For comparison and as an upstream reference, see the
[AI-generated Happy Hare MMX Getting Started guide](https://moggieuk.github.io/Happy-Hare-Doc/GettingStarted-MMX/).
