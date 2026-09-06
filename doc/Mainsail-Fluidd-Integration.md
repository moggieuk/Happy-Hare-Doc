# Mainsail / Fluidd

Mainsail and Fluidd both integrate directly with Happy Hare: a dedicated
"MMU" panel for monitoring and operating the MMU, plus enhancements to the
existing Extruder panel for tool selection and per-tool filament color. The
maintainer's own forks -
[mainsail-happy-hare-edition](https://github.com/moggieuk/mainsail-happy-hare-edition)
and
[fluidd-happy-hare-edition](https://github.com/moggieuk/fluidd-happy-hare-edition) -
track the newest enhancements ahead of when they land in the mainline
projects, if you want the latest without waiting.

## Main Panel

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_mmu_panel.png" alt="Mainsail MMU panel" width="65%">
</p>

The MMU panel is dedicated to monitoring and operating the MMU at the
physical gate level - the Extruder panel (below) still handles day-to-day
tool selection.

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_annotated_panel.png" alt="Mainsail MMU panel, annotated" width="100%">
</p>

The general workflow is: select the gate/lane to operate on, then pick an
action. On designs with a separate gear stepper per gate, some actions are
available even on a gate that isn't currently loaded - selecting a
non-active gate opens a menu of what's possible there, such as ejecting
filament from a gate that isn't loaded:

<p align="center">
  <img src="Mainsail-Fluidd-Integration/non-selected-gate.png" alt="Actions available on a non-selected gate" width="20%">
</p>

## Tool-to-Gate Mapping

Starting a multi-color print gives the opportunity to map the tools the
slicer expects onto the MMU's physical gates; the same map can also be
edited at any time outside of a print.

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_annotated_ttg_editor.png" alt="Mainsail Tool-to-Gate editor, annotated" width="100%">
</p>

See [Feature: Gate/TTG Maps](Feature-Gate-TTG-Maps.md) for how the mapping
itself works.

## Gate Map Editor

Edits the attributes of the filament loaded in each gate directly, or links
a gate to a Spoolman spool and lets Happy Hare pull attributes from there
instead.

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_annotated_gate_editor.png" alt="Mainsail Gate Map editor, annotated" width="100%">
</p>

See [Feature: Spoolman / Filament Hub](Feature-Spoolman.md) for the Spoolman
side of this.

## Maintenance and State Recovery

If the MMU pauses and can't recover automatically, the **Recover** screen
fixes that; the **Maintenance** screen covers setup/operations specific to
your particular MMU.

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_annotated_maintenance.png" alt="Mainsail MMU maintenance panel, annotated" width="100%">
</p>

See [Operation](Operation.md#state-recovery) for what state recovery
actually does and when it's needed.

## Extruder/Filament Color

Mainsail and Fluidd both support showing extra per-extruder attributes,
which Happy Hare uses to give the "Tx" tool buttons a live color swatch. At
print start, Happy Hare reads the sliced file's tool map into its own
"Slicer Tool Map" (see [Command Reference:
`MMU_SLICER_TOOL_MAP`](Reference-Commands.md#mmu_slicer_tool_map)) and
reports it to the UI. Which color source feeds the swatch is controlled by
`t_macro_color` in `mmu.cfg`:

```ini
t_macro_color: slicer
```

| Value | Shows |
|---|---|
| `slicer` (default) | Color from the slicer's own tool map - what the slicer expects loaded |
| `allgates` | Color of every gate in the gate map, run through the current Tool-to-Gate map |
| `gatemap` | Same as `allgates`, but hides tools with no filament |
| `off` | Disables this entirely |

A three-color print (`T0`, `T1`, `T2`) with the default `slicer` setting -
unused tools show no color:

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_extruder_colors_slicer.png" alt="Mainsail extruder colors, slicer mode" width="40%">
</p>

`allgates` instead shows every gate's actual loaded color:

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_extruder_colors_allgates.png" alt="Mainsail extruder colors, allgates mode" width="40%">
</p>

`gatemap` is the same idea but hides gates with nothing loaded:

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_extruder_colors_gatemap.png" alt="Mainsail extruder colors, gatemap mode" width="40%">
</p>

`allgates`/`gatemap` both respect the Tool-to-Gate map - remapping `T0` to
gate 7 with `MMU_TTG_MAP TOOL=0 GATE=7` immediately changes `T0`'s displayed
color to whatever gate 7 has loaded:

<p align="center">
  <img src="Mainsail-Fluidd-Integration/mainsail_extruder_colors_ttg_0_7.png" alt="Mainsail extruder colors after remapping T0 to gate 7" width="40%">
</p>

!!! tip
    No Klipper restart needed to try these - change it live with
    `MMU_TEST_CONFIG t_macro_color=allgates QUIET=1`, and switch back the
    same way. Worth remembering these are **Tools**, subject to the
    Tool-to-Gate map, unlike a gate's own LED color which always reflects
    that physical gate regardless of mapping.

## See also

- [KlipperScreen](KlipperScreen.md) - the equivalent touchscreen UI
- [Feature: Gate/TTG Maps](Feature-Gate-TTG-Maps.md)
- [Feature: Spoolman / Filament Hub](Feature-Spoolman.md)
- [Command Reference: `MMU_SLICER_TOOL_MAP`](Reference-Commands.md#mmu_slicer_tool_map)
- [Command Reference: `MMU_TTG_MAP`](Reference-Commands.md#mmu_ttg_map)

---
