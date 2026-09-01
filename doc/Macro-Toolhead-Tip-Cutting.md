# Macro: Toolhead Tip Cutting

## What it does

An alternative to filament-movement tip forming: a toolhead-mounted cutter
trims the tip cleanly instead, skipping the forming step (and its
per-filament tuning) entirely. See [Feature: Tip Forming and
Purging](Feature-Tip-Forming-Purging.md#toolhead-cutter-_mmu_cut_tip) for
the concept, trade-offs, and the cut routine itself - this page covers the
variables behind it. For worked toolhead-parking examples around a cutter
specifically, see [Toolchange Movement: Tip Cutting
Options](Toolchange-Movement.md#tip-cutting-options).

## Where it's applied

`_MMU_CUT_TIP`, defined in `mmu_cut_tip.cfg`. Active once
`form_tip_macro: _MMU_CUT_TIP` in `mmu.cfg`, which itself only becomes an
available choice once a toolhead cutter is enabled (**Toolhead
sensors/settings → Has toolhead cutter?** in menuconfig) - that's a
separate, MMU-wide capability flag (`MMU_HAS_TOOLHEAD_CUTTER`) from the
choice of tip-forming method itself.

## Configuration

<p align="center">
  <img src="Macro-Toolhead-Tip-Cutting/toolhead-tip-cutting.png" alt="menuconfig: Toolhead tip cutting (_MMU_CUT_TIP) screen, showing blade/pin geometry, cut speeds, and gantry servo settings" width="85%">
</p>

`_MMU_CUT_TIP_VARS` in `mmu_macro_vars.cfg`, reachable from menuconfig's
**Macro Variables → Toolhead tip cutting (\_MMU_CUT_TIP)** screen shown
above, once the capability flag above is on. Full variable table: [Macro
Variables: Toolhead tip cutting](Reference-Macro-Vars.md#toolhead-tip-cutting-_mmu_cut_tip_vars).
Tune the same one-variable-at-a-time way as tip forming (see [Feature: Tip
Forming and Purging](Feature-Tip-Forming-Purging.md#tuning-tip-forming)) -
the variables themselves just live in this different section.

A few worth knowing about specifically, since they've moved since older
guides on this topic:

- **`pin_loc_xy`**/**`pin_loc_compressed_xy`** are the depressor pin's real
  and fully-compressed X,Y coordinates - both toolhead-specific and not
  something to copy from another build.
- **`cutting_axis`** (`x` or `y`) and **`cut_axis_steppers`**/
  **`cut_stepper_current`** are genuinely new settings: which axis the cut
  motion happens on, and an optional temporary current boost (up to ~150%)
  on the steppers doing the cutting move.
- **`cut_iterations`** (new) repeats the cut - raise it if your cutter
  struggles with a particular filament.
- **`pushback_length`** pushes the cut fragment back into the hotend so it
  can't cause a future clog - a PTFE-tube-length-plus-a-few-mm starting
  point, not the couple of millimeters that might look sufficient at first
  glance.

## See also

- [Feature: Tip Forming and Purging](Feature-Tip-Forming-Purging.md#toolhead-cutter-_mmu_cut_tip) -
  concept, trade-offs, and the cut routine
- [Toolchange Movement: Tip Cutting Options](Toolchange-Movement.md#tip-cutting-options) -
  worked parking examples for a toolhead cutter
- [Macro Variables: Toolhead tip cutting](Reference-Macro-Vars.md#toolhead-tip-cutting-_mmu_cut_tip_vars) -
  every `_MMU_CUT_TIP_VARS` setting in full
- [Macro: Tip Forming](Macro-Tip-Forming.md) - the default alternative this
  macro replaces
- [Macro: Servo Cutter](Macro-Servo-Cutter.md) - a different, MMU-mounted
  cutter that trims *after* unload instead, additive rather than a
  replacement for either of the above

---
