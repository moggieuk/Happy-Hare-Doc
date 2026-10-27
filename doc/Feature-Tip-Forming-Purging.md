# Feature: Tip Forming and Purging

## Concept

Every toolchange needs two things done well: a clean filament **tip** (no
blobs, no long hairs - a good tip looks like a tiny spear) so the next load
doesn't jam, and a **purge** big enough to clear the old color/material
out of the nozzle without wasting excessive filament.

<p align="center">
  <img src="Feature-Tip-Forming-Purging/good_tips.png" alt="Well-formed filament tips, free of blobs or hairs" width="30%">
</p>

Each has the same three-way choice, and they're independent of each other:

- **Tip forming**: Happy Hare's own standalone macro (`_MMU_FORM_TIP`), a
  toolhead-mounted filament cutter (`_MMU_CUT_TIP`) instead of forming a tip
  at all, or leave it to the slicer's own in-print tip-forming.
- **Purging**: Happy Hare's own standalone macro (`_MMU_PURGE`), an add-on
  purge system like [Purge: Blobifier](Macro-Blobifier.md), or leave it
  to the slicer's wipe tower.

There's also a separate, *additive* cutting option: a servo-driven cutter
mounted at the MMU itself (EREC-style) rather than at the toolhead - see
[Servo Cutter](#servo-cutter-mmu-mounted) below. It trims the tip after
unload; you still form a decent tip beforehand the normal way.

## Hardware Setup

Two independent menus, both unconditional (every MMU type gets them):

<p align="center">
  <img src="Feature-Tip-Forming-Purging/tip-forming-cutting.png" alt="Tip Forming / Cutting screen: servo cutter off, standalone tip forming selected and forced" width="85%">
</p>

| Setting | Purpose |
|---|---|
| `Have servo cutter at MMU?` | The additive EREC-style cutter - see [Servo Cutter](#servo-cutter-mmu-mounted) |
| `Happy Hare tip forming/cutting method` | `_MMU_FORM_TIP` / cut (needs a toolhead cutter fitted) / slicer-controlled / custom macro |
| `Happy Hare controlled in-print tip forming/cutting` | Forces standalone tip forming even during a print (on by default) - turn off only if the slicer is genuinely handling it |
| `Extruder tip forming current` | 100-150%, extra torque for the rapid tip-forming moves; 100 disables the boost |

<p align="center">
  <img src="Feature-Tip-Forming-Purging/purging.png" alt="Purging screen: Blobifier off, simple bucket purge selected" width="85%">
</p>

| Setting | Purpose |
|---|---|
| `Have Blobifier?` | See [Purge: Blobifier](Macro-Blobifier.md) |
| `Happy Hare purging method` | `_MMU_PURGE` / Blobifier / slicer wipe tower / custom macro |
| `Happy Hare controlled in-print purge` | Forces standalone purging even during a print - turn the slicer's wipe tower off if you enable this |
| `Extruder purge current` | Same idea as tip-forming current, for purge moves |

These produce, in `mmu.cfg`'s general parameters (not the file literally
named `mmu_parameters.cfg`):

```ini
force_form_tip_standalone : 1              # 1 = always standalone tip forming (turn the slicer's off)
form_tip_macro             : _MMU_FORM_TIP  # or _MMU_CUT_TIP, BLOBIFIER, or your own
extruder_form_tip_current  : 100
slicer_tip_park_pos        : 0              # Only matters if the slicer forms tips instead

force_purge_standalone   : 0                # 0 = slicer's wipe tower in-print, standalone otherwise
purge_macro               : ''               # Blank = no standalone purge; set to _MMU_PURGE, BLOBIFIER, ...
extruder_purge_current    : 100
```

### Servo Cutter (MMU-mounted)

An MMU-end cutter (the classic EREC design, or similar) trims the tip
*after* unload, rather than replacing tip forming - you still want
`form_tip_macro: _MMU_FORM_TIP` so a decent tip exists going into the cut.
Enabling it under **Tip Forming / Cutting** adds a servo pin prompt and
generates `[mmu_servo cut_servo]` in `mmu.cfg`; its own tuning (open/close
angles, feed/cut length, cut attempts) lives in `mmu_macro_vars.cfg`'s
[`_MMU_SERVO_CUTTER_VARS`](Reference-Macro-Vars.md#servo-cutter-mmu-mounted-_mmu_servo_cutter_vars).
See [Tip Shaping: MMU Cutting](Macro-Servo-Cutter.md) for the build/wiring side.

## Parameter Setup

### Tuning tip forming

The default `_MMU_FORM_TIP` macro (`mmu_form_tip.cfg`) works similarly to
PrusaSlicer/SuperSlicer's own tip-forming, so their multi-material filament
profiles are a reasonable starting point even if you're not using slicer
tip forming at all - add a Prusa printer + MMU preset from the system
presets, then pick the **MMU** printer specifically (not **Single**); its
filament presets tagged **@MMU** in the name are the multi-material ones
with real tip-forming settings behind them:

<p align="center">
  <img src="Feature-Tip-Forming-Purging/prusa_starting_point.png" alt="PrusaSlicer MMU printer/filament preset picker" width="55%">
</p>

Pick the filament type you're tuning for (PLA, ABS, PETG, ...) and use its
Multimaterial section settings as your own starting point:

<p align="center">
  <img src="Feature-Tip-Forming-Purging/prusa_tip_params.png" alt="PrusaSlicer toolchange tip-forming parameters" width="40%">
</p>

Its tuning variables live in `mmu_macro_vars.cfg`'s
[`_MMU_FORM_TIP_VARS`](Reference-Macro-Vars.md#tip-forming-_mmu_form_tip_vars)
section. Tuning by hand:

1. Remove the bowden tube at the toolhead so you can feed filament directly.
2. Cut a ~400mm fragment of the filament you're tuning, heat the extruder,
   and hold the fragment to the gears:

    ```text
    MMU_LOAD EXTRUDER_ONLY=1
    ```

3. Extrude a few mm by hand to prime, then:

    ```text
    MMU_TEST_FORM_TIP
    ```

    This runs the tip-forming macro and ejects the result for inspection.

4. Adjust one variable at a time on the command line - changes are sticky
   for the session:

    ```text
    MMU_TEST_FORM_TIP cooling_moves=5 unloading_speed=15
    ```

5. Re-insert the fragment (`MMU_LOAD EXTRUDER_ONLY=1` again) and repeat.
   Expect this to take a few dozen attempts to converge.

!!! tip
    With an extruder-entry sensor fitted, select the
    [bypass](Feature-Filament-Bypass.md) before tuning and turn on
    `bypass_autoload` - inserting the fragment then loads it automatically
    for the next attempt, no `MMU_LOAD` needed each time.

!!! warning "Important"
    Values set with `MMU_TEST_FORM_TIP`/`MMU_TEST_CONFIG` only last until
    Klipper restarts. Copy anything you want to keep into
    `mmu_macro_vars.cfg`.

Full parameter reference: [`MMU_TEST_FORM_TIP`](Reference-Commands.md#mmu_test_form_tip).

### Toolhead cutter (`_MMU_CUT_TIP`)

Instead of tuning a tip-forming macro at all, a toolhead-mounted filament
cutter can just cut the tip cleanly and skip the forming step entirely -
switch to it with `form_tip_macro: _MMU_CUT_TIP` in `mmu.cfg`.

- **Advantages**: a clean, hair-free tip every time, with none of the
  fiddly per-filament tuning tip forming needs; works the same regardless
  of filament type.
- **Trade-offs**: it's extra hardware to build and wire in the first place,
  the blade itself is a consumable that eventually needs replacing, and if
  the cutter lives in the toolhead, cutting there wastes a little more
  filament and time during the purge than a clean-formed tip would.

If the blade sits before the extruder gears rather than between the gears
and the nozzle, see [Cutter before the
extruder](Macro-Toolhead-Tip-Cutting.md#cutter-before-the-extruder).

Mechanically, a toolhead cutter is normally triggered by moving the
toolhead itself into a fixed position that presses a depressor or servo arm
against the cutter's own activation mechanism - rather than the cutter
having its own motor. The routine Happy Hare drives around that move looks
roughly like this: on seeing a toolchange, the toolhead moves to the prime
tower (or wherever purging happens) and runs a few cooling moves to firm up
the filament so the cut doesn't leave it stringy; the filament is then
positioned for the cut - tuned to leave the minimum practical length behind
while still getting a clean cut; the toolhead moves to a staging position
just outside the actual cut point, then makes a slow approach into the cut,
a quick cutting move, a quick retract, and a slow return to staging.
Unload, load of the next filament, purge, and resume follow as normal.

!!! tip
    The only variables you're expected to tune for this live in
    `mmu_macro_vars.cfg`'s cutter section, one at a time, same approach as
    tip-forming tuning above.

### Unload validation

The shared `toolhead_unload_test` setting in `mmu.cfg` controls extra unload
validation: `0` preserves existing behavior, `1` warns, and `2` treats failure
as an error (pausing during a print). Begin with `1` and verify your toolhead
dimensions before enabling `2`. Homing travel limits do not change.

With a toolhead or extruder-entry sensor, Happy Hare compares the distance
needed to clear it with the expected distance from the tip park position.
After a reported cut, an overrun greater than half the remaining fragment
suggests a missed cut. This check is skipped for fragments under 2 mm, or when
an extruder-entry buffer can absorb that difference. After tip forming or a
slicer tip, the allowance is `toolhead_unload_safety_margin`, plus buffer travel
for extruder-entry homing. Incorrect sensor-to-nozzle dimensions can therefore
cause false warnings. Expected and actual distances are recorded in the debug
log.

Without a sensor, the existing encoder check is used where applicable. The
proportional-buffer-only validation currently always passes; enabling this
option does not provide missed-cut detection on that path.

### Residual filament temperature

For the initial print load or a standalone load with Happy Hare-controlled
purging, Happy Hare remembers the residual filament temperature per extruder.
If needed, it unloads and purges at that higher temperature, then restores the
incoming filament temperature; during a print it waits for cooldown. For
example, a PLA load at 220°C after PC at 270°C purges the residual PC at 270°C
before returning to 220°C. Unknown residual temperatures retain the normal
behavior.

Mid-print toolchanges remain under slicer temperature control. Slicer-controlled,
skipped or missing purges do not trigger residual heating. Standalone unloads
and tip tests also keep their normal temperature behavior.

### Purge volumes

Slicers offer purge volumes three ways - a simple per-tool unload/load
value, a full N×N matrix for precise per-pair control, or an automatic
pigment-percentage calculation - each a tradeoff between setup effort and
waste:

<table>
  <tr>
    <td align="center">
      <img src="Feature-Tip-Forming-Purging/manual_purging_volumes.png" alt="PrusaSlicer simple per-tool purge volume panel" width="90%">
    </td>
    <td align="center">
      <img src="Feature-Tip-Forming-Purging/matrix_purging_volumes.png" alt="PrusaSlicer full N by N purge volume matrix" width="90%">
    </td>
  </tr>
</table>

The manual and matrix options are both set directly in the slicer, with no
Happy Hare involvement. PrusaSlicer/SuperSlicer also offer a fourth,
automatic option: enabling **Advanced wiping volume** (under **Printer
Settings → Single Extruder MM Setup**) lets the slicer calculate purge
volume from each filament's **pigment percentage** (0-1) instead of a fixed
number - tune the percentage per filament to fine-tune the result. If you
use the same base filament profile for several colors, you'll need to
duplicate that profile per color so each can carry its own pigment
percentage, and make sure the right profile is selected for each tool.

Happy Hare can also calculate its own matrix from filament colors, as an
alternative to any of the slicer's own methods - typically run from your
print-start macro:

```text
MMU_CALC_PURGE_VOLUMES SOURCE=gatemap MULTIPLIER=1.1     # From the gate map's (or Spoolman's) colors
MMU_CALC_PURGE_VOLUMES SOURCE=slicer MIN=50              # From the slicer's own tool colors, floored at 50mm3
```

```{.text .console-command}
MMU_CALC_PURGE_VOLUMES SOURCE=gatemap MULTIPLIER=1.1
```

```{.text .console-output}
Purge map updated. Use 'MMU_SLICER_TOOL_MAP PURGE_MAP=1' to view
```

Full parameter reference: [`MMU_CALC_PURGE_VOLUMES`](Reference-Commands.md#mmu_calc_purge_volumes).
Volumes default to a 0-800mm³ range unless overridden with `MIN=`/`MAX=`.
View the result with `MMU_SLICER_TOOL_MAP PURGE_MAP=1` (or
`SPARSE_PURGE_MAP=1` to drop toolchanges that can't actually occur in the
loaded print) - each cell is the calculated purge volume, in mm³, for that
row-to-column transition:

```{.text .console-command}
MMU_SLICER_TOOL_MAP PURGE_MAP=1
```

```{.text .console-output}
Purge Volume Map (mm^3):
To -> T0   T1   T2   T3   T4   T5   T6   T7   T8
T0    -   129  230  192  221  221  223  480  223
T1   316   -   210  155  393  393  325  606  325
T2   383  179   -   189  354  354  195  551  195
T3   322   78  143   -   359  359  264  570  264
T4   133  155  124  165   -    -   165  354  165
T5   133  155  124  165   -    -   165  354  165
T6   314  224   98  212  352  352   -   541   -
T7   102  122  120  116   65   65  111   -   111
T8   314  224   98  212  352  352   -   541   -
```

`printer.mmu.toolchange_purge_volume` is the number your own purge logic
should actually read during a toolchange - it's the sum of the matrix value
above, any [extra purge for a material change](#extra-purge-on-a-material-change),
[toolhead residual filament](#toolhead-calibration-and-toolhead_ooze_reduction), and any
filament left behind by a cut tip, not just the matrix on its own.

### Extra purge on a material change

Every purge volume matrix, whether from the slicer or from
`MMU_CALC_PURGE_VOLUMES`, is based on **color**. A change between two
filaments of the same color, say black ABS to black PLA, gets almost no
purge, yet the ABS left in the melt zone can stop the next layers sticking.
Changing to a different material needs extra filament to flush the old one
out, whatever the colors.

`purge_material_change_volume` (in `mmu_parameters.cfg`, or **Extra purge on
material change** in the menuconfig **Purging** menu) is an extra volume, in
mm³, that Happy Hare adds to the suggested purge whenever a toolchange
changes material. It defaults to `0` (off):

```ini
purge_material_change_volume: 150
```

The suggested purge for each toolchange is then built from:

```text
toolchange_purge_volume = color volume (purge matrix)
                        + purge_material_change_volume (only if the material changes)
                        + residual filament left in the extruder
                        (raised to purge_change_min_volume if smaller - see below)
```

!!! note
    `MMU_CALC_PURGE_VOLUMES MULTIPLIER=` and `MIN=` can't do this job.
    `MULTIPLIER` scales the color volume, and a same-color change has a color
    volume of almost zero, so scaling it still gives almost nothing. `MIN`
    raises every change, including small color changes between the same
    material.

#### How "different material" is decided

Happy Hare compares the material it last loaded **and purged** into the
extruder (remembered across restarts) with the material of the gate it is
about to load. The material is only recorded once a load and its purge
finish, including any purge run from the post-load macro
(`user_post_load_extension`), so if a purge fails and the toolchange is
retried, the retry still purges the extra. Materials are
free-form names from your gate map, Spoolman or NFC tags, so each is reduced
to a **material family**: the leading name, ignoring case, up to the first
space, `-`, `+`, `_` or `/`.

| Material name | Family |
|---|---|
| `PLA`, `PLA Silk`, `PLA-CF`, `PLA+`, `pla basic` | `PLA` |
| `PETG`, `PETG-CF` | `PETG` |
| `ABS`, `ABS-GF` | `ABS` |
| empty or `unknown` | none |

The extra purge is added when the families are different. A change between
a known and an unknown material also counts, because Happy Hare can't tell
whether the old material has been flushed out. A change between two unknown
materials doesn't, so leaving every material unset never adds the extra.
Name your materials consistently (`MMU_GATE_MAP GATE=n MATERIAL=PLA`,
Spoolman or NFC tags) for this to work.

#### Worked examples

With `purge_material_change_volume: 150`:

| Toolchange | Color volume | Material extra | Why |
|---|---|---|---|
| black PLA → white PLA | from the matrix | `0` | Same family |
| black ABS → black PLA | almost `0` | `150` | Different families |
| red PETG → blue PLA | from the matrix | `150` | Different families, added to the color volume |
| red PLA → blue PLA Silk | from the matrix | `0` | `PLA Silk` is in the `PLA` family |
| unknown → PLA (or PLA → unknown) | from the matrix | `150` | Only one material is known |
| unknown → unknown | from the matrix | `0` | Neither material is known |

The debug breakdown in `mmu.log` shows each part. For black ABS to black PLA,
with 12mm of residual filament:

```{.text .console-output}
Suggested purge volume of 178.9mm³ calculated from:
- toolhead_residual_filament: 5.0mm
- filament_remaining (previous cut fragment): 7.0mm
- slicer purge volume for toolchange T0 > T1: 0.0mm³
- material change: 150.0mm³
```

Both built-in purge macros include the extra: `_MMU_PURGE` purges
`toolchange_purge_volume`, and [Blobifier](Macro-Blobifier.md) adds
`printer.mmu.toolchange_material_purge_volume` to the volume it reads from
the matrix (not scaled by its `purge_length_modifier`). Blobifier also purges
the extra when the tool stays the same but its gate now holds a different
material. An explicit Blobifier `PURGE_LENGTH=` is used as given. A custom
purge macro should read `toolchange_purge_volume`, or add
`toolchange_material_purge_volume` if it works from the matrix itself.

### Minimum purge volume

Some loads need almost no purge by the numbers but still need a primed
nozzle: a change between two filaments of the same color and material, or an
[EndlessSpool](Feature-Endless-Spool-Runout.md) switch to an identical spool
after a runout. The purge matrix gives `0` for these.

`purge_change_min_volume` (in `mmu_parameters.cfg`, or **Minimum purge
volume** in the menuconfig **Purging** menu) is the smallest volume, in mm³,
Happy Hare suggests after any load. If the color volume, material extra and
residual add up to less, `toolchange_purge_volume` is raised to it. It
defaults to `0` (off):

```ini
purge_change_min_volume: 100
```

| Toolchange | Color volume | Material extra | Suggested purge |
|---|---|---|---|
| black PLA → black PLA (or EndlessSpool to an identical spool) | `0` | `0` | `100` (the minimum) |
| black ABS → black PLA | `0` | `150` | `150` + residual |
| red PLA → blue PLA | `230` | `0` | `230` + residual |

With `purge_material_change_volume: 150`, the minimum only changes the first
row. When the minimum is used, the `mmu.log` breakdown ends with
`- raised to minimum purge: 100.0mm³`.

`_MMU_PURGE` and custom macros reading `toolchange_purge_volume` get the
minimum automatically. [Blobifier](Macro-Blobifier.md) also has its own
`purge_length_minimum` (in mm) and uses whichever of the two minimums is
larger. Both apply even when the tool doesn't change and when `PURGE_LENGTH=`
is given. The current value is available to macros as
`printer.mmu.purge_change_min_volume`.

### Purging without a wipe tower

A dedicated purge system (like [Purge: Blobifier](Macro-Blobifier.md))
lets you disable the slicer's wipe tower entirely - it still needs a purge
volume matrix to work from, which can come from any of: Happy Hare's own
[g-code preprocessing](Feature-Gcode-Preprocessing.md) of the slicer's
matrix, `MMU_SLICER_TOOL_MAP PURGE_VOLUMES=...` directly, or
`MMU_CALC_PURGE_VOLUMES` above. All three end up in
`printer.mmu.slicer_tool_map.purge_volumes` for your macros to read:

!!! tip
    Getting the matrix out of the slicer in the first place is a two-step
    dance: **enable wipe tower** first to unlock the purge-volume matrix
    editor and configure it, *then* disable **enable wipe tower** again
    once you're happy with the values - the slicer still writes the
    configured matrix into the g-code even with the tower itself off. Leave
    it disabled from the start and there's no matrix to edit at all.

```text
MMU_SLICER_TOOL_MAP PURGE_VOLUMES=70                                    # One value for every transition
MMU_SLICER_TOOL_MAP PURGE_VOLUMES=70,70,70,70,70,70,70,70,70            # N values - one per tool's "to" column
MMU_SLICER_TOOL_MAP PURGE_VOLUMES=70,70,70,...                         # NxN (or 2xN, see Command Reference) - full matrix
```

A flat `PURGE_VOLUMES=70` fills every transition with the same value:

```{.text .console-command}
MMU_SLICER_TOOL_MAP PURGE_MAP=1
```

```{.text .console-output}
Purge Volume Map:
To -> T0   T1   T2   T3   T4   T5   T6   T7   T8
T0    -   140  140  140  140  140  140  140  140
T1   140   -   140  140  140  140  140  140  140
T2   140  140   -   140  140  140  140  140  140
T3   140  140  140   -   140  140  140  140  140
T4   140  140  140  140   -   140  140  140  140
T5   140  140  140  140  140   -   140  140  140
T6   140  140  140  140  140  140   -   140  140
T7   140  140  140  140  140  140  140   -   140
T8   140  140  140  140  140  140  140  140   -
```

(A single input value of `70` still shows as `140` per cell above - the
displayed total is the sum of both tools' contribution to that transition,
consistent with how the manual per-tool unload/load volumes combine.)

!!! note
    If your slicer is set up with fewer tools than your MMU has gates,
    `NUM_SLICER_TOOLS=` trims the displayed matrix to match. Tool numbering
    is always zero-based (`T0` first) to match the g-code itself, regardless
    of what a slicer's own UI happens to label its first tool.

### Toolhead calibration and `toolhead_ooze_reduction`

Correct purge volumes still assume the toolhead's own geometry
(`toolhead_extruder_to_nozzle`, `toolhead_sensor_to_nozzle`,
`toolhead_residual_filament` - all in `mmu.cfg`'s toolhead settings) is
calibrated accurately. `toolhead_residual_filament` in particular - how
much filament is naturally left behind in the extruder after ejection - is
often bigger than expected (2-3mm on a low-flow extruder, 12-15mm on a
high-flow one), and is worth calibrating properly before reaching for the
setting below as a band-aid.

`toolhead_ooze_reduction` is a small final adjustment on top of that,
tunable live mid-print:

```text
MMU_TEST_CONFIG toolhead_ooze_reduction=1
```

<p align="center">
  <img src="Feature-Tip-Forming-Purging/toolhead_ooze_reduction.png" alt="A purge tower with blobs/gaps at different toolhead_ooze_reduction values from -3 to 8mm, with +1mm marked as correct" width="60%">
</p>

Blobs on the purge tower after a load mean the value is too low (more
reduction needed); a big gap after a load means it's too high. A working
value is usually small, ±3mm at most, once the toolhead geometry and
`toolhead_residual_filament` are actually correct - needing a large or
negative value is itself a sign one of those two is off, not that this
setting needs to compensate further. Persist the final value in `mmu.cfg`
once you're happy with it.

## Commands

```text
MMU_TEST_FORM_TIP                        # Run the tip-forming macro standalone, for tuning
MMU_TEST_PURGE LAST_TOOL=0 NEXT_TOOL=3   # Run the standalone purge macro for a specific tool transition
MMU_CALC_PURGE_VOLUMES SOURCE=gatemap    # Recalculate the purge matrix from current filament colors
MMU_SLICER_TOOL_MAP PURGE_MAP=1          # View the current purge volume matrix
MMU_TEST_CONFIG toolhead_ooze_reduction=1
```

Full parameter reference:
[`MMU_TEST_FORM_TIP`](Reference-Commands.md#mmu_test_form_tip),
[`MMU_TEST_PURGE`](Reference-Commands.md#mmu_test_purge),
[`MMU_CALC_PURGE_VOLUMES`](Reference-Commands.md#mmu_calc_purge_volumes),
[`MMU_SLICER_TOOL_MAP`](Reference-Commands.md#mmu_slicer_tool_map).

## Printer variables exposed

`printer.mmu.toolchange_purge_volume`, `.toolchange_material_purge_volume`,
`.slicer_purge`, `.slicer_tool_map.purge_volumes`, `.extruder_filament_remaining`,
and `.filament_remaining`/`.filament_remaining_color`/`.filament_remaining_material`
(residual/cut-fragment tracking) - see [Printer Variables: extruder / filament
remaining](Reference-Printer-Variables.md#extruder-filament-remaining).
`printer.mmu.action` also includes `Forming Tip`/`Cutting Tip`/`Cutting
Filament`/`Purging` states while each of these runs.

## Troubleshooting

- **Tip forming needs 40-50 attempts and still isn't right** - normal;
  tuning by feel is genuinely slow, which is exactly why a filament cutter
  exists as an alternative. Change one variable at a time.
- **Blobs on the purge tower after a load** - lower
  `toolhead_ooze_reduction`, but check `toolhead_residual_filament` and the
  toolhead's own geometry settings first if the needed change is large.
- **Big gaps on the purge tower after a load** - raise
  `toolhead_ooze_reduction` instead.
- **Wasting a lot of filament on purging** - review whether you're using
  the slicer's simple per-tool volumes (least efficient) versus the full
  matrix or Happy Hare's own color-based calculation.
- **Switched to a toolhead cutter but tips are still being formed the old
  way** - `form_tip_macro` needs to actually be changed to `_MMU_CUT_TIP`;
  simply having `MMU_HAS_TOOLHEAD_CUTTER` fitted doesn't switch it
  automatically unless that was the default chosen in menuconfig.

## See also

- [Command Reference: `MMU_TEST_FORM_TIP`](Reference-Commands.md#mmu_test_form_tip)
- [Command Reference: `MMU_TEST_PURGE`](Reference-Commands.md#mmu_test_purge)
- [Command Reference: `MMU_CALC_PURGE_VOLUMES`](Reference-Commands.md#mmu_calc_purge_volumes)
- [Command Reference: `MMU_SLICER_TOOL_MAP`](Reference-Commands.md#mmu_slicer_tool_map)
- [Purge: Blobifier](Macro-Blobifier.md) / [Tip Shaping: MMU Cutting](Macro-Servo-Cutter.md) - Blobifier and the MMU cutter build/wiring
- [Feature: G-code Preprocessing](Feature-Gcode-Preprocessing.md) - `!purge_volumes!` and friends
- [Feature: Gate/TTG Maps](Feature-Gate-TTG-Maps.md) - the slicer tool map this all reads from
- [Feature: Filament Bypass](Feature-Filament-Bypass.md) - the tip-forming tuning timesaver
- [Feature: Sync-Feedback Buffer](Feature-Sync-Feedback-Buffer.md) - `sync_form_tip`/`sync_purge`

---
