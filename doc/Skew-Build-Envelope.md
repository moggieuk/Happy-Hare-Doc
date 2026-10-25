# Skew & Build Envelope

## Concept

Several Happy Hare macros move the toolhead to fixed places near the edge of
the machine: parking positions, the Blobifier tray, brush and shaker, and a
toolhead cutter's pin. Those coordinates are gcode coordinates, and Klipper
transforms them before the move is checked against the axis limits
(`position_min`/`position_max`):

1. The gcode offset (`SET_GCODE_OFFSET X/Y`, or `G92`) is added.
2. If `[skew_correction]` is configured and a skew profile is loaded, the
   position is skewed.
3. The result is range-checked. Anything outside the limits fails with
   `Move out of range`.

Skew correction is the one that catches people out, because the correction
grows with height:

- **XZ and YZ skew** shift X and Y in proportion to Z. A park position right
  on the Y limit can be fine at the first layer and out of range 200mm higher.
  Even a Z-only lift near the edge moves Y.
- **XY skew** shifts X in proportion to Y, so it affects positions at the back
  of the bed even at Z=0.

The shift is small per millimeter but adds up over a tall print:

| Skew angle | Shift at Z=50 | Shift at Z=150 | Shift at Z=300 |
|---|---|---|---|
| 0.1° | 0.09mm | 0.26mm | 0.52mm |
| 0.25° | 0.22mm | 0.65mm | 1.31mm |
| 0.5° | 0.44mm | 1.31mm | 2.62mm |

Whether a given axis shifts toward or away from its limit depends on the
direction of your printer's skew. Without checking, you can't tell which edge
is at risk.

!!! warning "Important"
    If you use skew correction, keep boundary coordinates conservatively
    inside the build envelope, especially for positions used at higher Z. A
    coordinate placed exactly on `position_max` will almost always be beyond
    it at some height. Use [`MMU_CHECK_POSITION`](#checking-a-coordinate-mmu_check_position)
    to see how much margin a position needs.

## How Happy Hare keeps its moves in range

Happy Hare's own macros make their edge-of-machine moves with `_SAFE_G1`, an
absolute `G1` that applies the gcode offset and skew exactly as Klipper does.
If the target would end outside the axis limits, `_SAFE_G1` moves it to just
inside the limit (0.01mm). If the required correction exceeds 5 mm on any
axis, it rejects the move before movement. This cap includes the boundary inset
and any correction needed for `MAX_Z`. Moves that are
already in range are sent unchanged, so nothing changes on printers without
skew correction or an XY offset.

These moves go through `_SAFE_G1`:

- **Parking and restoring:** every [toolchange movement](Toolchange-Movement.md)
  move, including the z-hop lift and ramp, the move to each park position and
  the moves back to the print. On the way back down, the toolhead moves to the
  restore X,Y and the print height together. Any adjustment made at the lifted
  height is taken out during the descent, not as a sideways move at print height.
- **[Blobifier](Macro-Blobifier.md):** the purge row, tray, brush and shaker
  moves at the edge of the machine, including the Z rises while purging.
- **[Toolhead cutting](Macro-Toolhead-Tip-Cutting.md):** the approach to the
  pin, both cutting strokes, the return to the pin park position, the safety
  margin moves and the back-off after cutting.

The first time a move is adjusted in a print, Happy Hare logs a warning that
names the move:

```{.text .console-output}
Warning: Move to (Y356) adjusted to (Y355.056704) to stay within axis limits (Y 356.933 beyond limit 356.000).
Check your Happy Hare macros for positions or movement that exceed your build volume envelope. To allow for Klipper skew compensation (or an X,Y gcode offset) it is often necessary to move park/place coordinates slightly inside the boundary. Further automatic adjustments during this print will be logged at debug level
```

Later adjustments in the same print are written to `mmu.log` as one short line,
such as `_SAFE_G1 adjusted X100 Y356 -> Y355.06`. An adjusted move stays within the axis limits, but does not guarantee clearance
from attachments or a complete cut. The toolhead did not go exactly where it
was told. If you see the
warning, check the configured positions with `MMU_CHECK_POSITION` and move them
inside the boundary.

### Your own macros

`_SAFE_G1 X= Y= Z= F=` can be used in place of `G1` in your own macros. It takes
absolute coordinates only and leaves the current `G90`/`G91` mode unchanged. In
particular, a `user_park_move_macro` (see [Macro: Sequence](Macro-Sequence.md))
replaces Happy Hare's own park move, so it should use `_SAFE_G1` for its moves to
get the same protection.

## Cutter clearance and travel

The cutter's pin approach and cut strokes use the same bounded adjustment.
Pulling an endpoint inward can shorten the cut. The 5 mm cap is a defensive
movement limit, not a statement of your cutter's mechanical tolerance: verify
that the pin still compresses far enough to sever filament at every print height.
The cutting motor current is restored even if a movement fails.

Skew correction also changes where the toolhead physically ends up for the same
coordinates as Z changes. The depth of the cut stroke can therefore vary
slightly with print height. Make sure `pin_loc_xy`, `pin_loc_compressed_xy` and
`pin_park_dist` leave enough margin at every height you print at. Check both points
with `MMU_CHECK_POSITION` (see below).

## Checking a coordinate: `MMU_CHECK_POSITION`

[`MMU_CHECK_POSITION`](Reference-Commands.md#mmu_check_position) reports
whether an X,Y gcode coordinate stays within the axis limits at **every**
height, from Z=0 to the Z maximum, with the current XY gcode offset and a skew
profile applied. It never moves the toolhead and works whether or not the
printer is homed.

```text
MMU_CHECK_POSITION X=<x> Y=<y> [SKEW=<profile>] [ERROR=0|1]
```

- **`X`/`Y`:** the coordinate as written in your macro variables. At least one is
  required. If you give only one, the other axis is checked at both ends of its
  range, because skewed X also depends on Y.
- **`SKEW`:** a saved skew profile to check with. Klipper doesn't load a
  skew profile by itself at startup, so at idle there is usually no skew in
  effect. Name your profile here to check against it without loading it (this
  is also safe during a print). Leave it out to use whatever skew is currently
  loaded.
- **`ERROR=1`:** raise a gcode error if the position is out of range (off by default).

The first line of the report always says which skew was used: the profile you
supplied, the currently loaded profile, current factors that don't come from a
saved profile, or **no skew profile provided or loaded**. The second line shows
the gcode offset. Then each axis is either **OK**, with the machine positions it
spans across the Z range, or out of range, with the height at which it goes out
and a value that is safe at every height:

```{.text .console-command}
MMU_CHECK_POSITION X=19 Y=355 SKEW=my_skew
```
```{.text .console-output}
Skew: profile 'my_skew' (supplied) xy=0.000000 xz=0.000000 yz=-0.018666
Gcode offset: X0.00 Y0.00
Checking X19.00 Y355.00 from Z=0.0 to Z=340.0:
  X: OK (machine 19.00..19.00, limits 0.00..350.00)
  Y: exceeds maximum 356.00 by 5.35 above Z=53.6. Use Y <= 349.64 for all heights
```

Here, Y=355 works for prints up to 53.6mm tall. A park position of Y=349.64
or lower works at any height.

### Which coordinates to check

| Macro | Coordinates to check |
|---|---|
| [Toolchange Movement](Toolchange-Movement.md) | The X,Y of each `park_*` position you use, and any `pre_unload_position`, `post_form_tip_position` and `pre_load_position` |
| [Blobifier](Macro-Blobifier.md) | `Y` = Y max - `y_offset` (purge row), `Y` = Y max - `brush_y_offset` (brush), and `X` = `shaker_pos_x` if the shaker is enabled |
| [Toolhead cutting](Macro-Toolhead-Tip-Cutting.md) | The pin park point: `pin_loc_xy` with `pin_park_dist` added on the `cutting_axis`. Also the compressed point `pin_loc_compressed_xy`. Adjustments can shorten the cut, so verify mechanical travel as well |

### Checking at print start

Skew profiles are normally loaded in your start-print macro with
`SKEW_PROFILE LOAD=<profile>`. Add `MMU_CHECK_POSITION ... ERROR=1` lines straight
after that. If a position would be out of range, the print stops before the
first toolchange. That's particularly worth doing for a toolhead cutter's pin
points. With the shipped defaults (`pin_loc_xy: 14, 250`, `pin_park_dist: 5`,
`pin_loc_compressed_xy: 0.5, 250`, cutting along X), the lines are:

```text
SKEW_PROFILE LOAD=my_skew
MMU_CHECK_POSITION X=19 Y=250 ERROR=1    ; Cutter pin park point
MMU_CHECK_POSITION X=0.5 Y=250 ERROR=1   ; Cutter compressed point
```

Without `SKEW=`, the check uses the factors that are currently loaded, so it must
come after `SKEW_PROFILE LOAD`. Call your start-print macro before
`MMU_START_LOAD_INITIAL_TOOL` (see [Slicer Setup](Slicer-Setup.md#start-g-code))
so the check runs before the first toolchange.

## Troubleshooting

**A cutter move is rejected or needs excessive adjustment.** The pin park
point or compressed point may be beyond the limit at the current height.
`_SAFE_G1` refuses corrections over 5 mm; it cannot fix an incorrectly
configured cutter position. Check both
with `MMU_CHECK_POSITION ... SKEW=<profile>` and move `pin_loc_xy` /
`pin_loc_compressed_xy` inside the boundary, or add the `ERROR=1` check above to
catch it at print start.

**The adjustment warning appears in every print.** One of the positions Happy
Hare uses is beyond the limit at some height. Blobifier positions at the edge of
the machine are a common cause. The move stays inside the axis limits, but `MMU_CHECK_POSITION`
will tell you how far inside the boundary to move the position (for Blobifier,
increase `y_offset` or `brush_y_offset`) so it's no longer adjusted.

**`MMU_CHECK_POSITION` says everything is fine, but moves are still adjusted.**
Check the first line of the report. "No skew profile provided or loaded" means
the check ran without skew. Add `SKEW=<profile>` with the profile your
start-print macro loads.

## See also

- [Toolchange Movement](Toolchange-Movement.md) - park positions and the moves
  around a toolchange
- [Purge: Blobifier](Macro-Blobifier.md) - the purge positions at the edge of the
  machine
- [Tip Shaping: Toolhead Cutting](Macro-Toolhead-Tip-Cutting.md) - the pin
  pin positions and mechanical travel
- [Command Reference: `MMU_CHECK_POSITION`](Reference-Commands.md#mmu_check_position)
- [Klipper skew correction](https://www.klipper3d.org/Skew_Correction.html) -
  measuring skew and saving profiles

---
