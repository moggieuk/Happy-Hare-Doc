# Purge: Simple

## What it does

Happy Hare's simple, standalone reference purge - a basic bucket purge you
can use as-is, or as a starting point for your own custom purge macro.
[Purge: Blobifier](Macro-Blobifier.md) is the far more capable alternative if
you want tuned blob shaping, brushing, and bucket management; this one is
deliberately minimal.

## Where it's applied

`_MMU_PURGE`, defined in `mmu_purge.cfg`. Active once `purge_macro:
_MMU_PURGE` in `mmu.cfg` (menuconfig's **Purging → Select standalone
purging option**) - if purging in-print rather than only standalone, also
turn off the slicer's own wipe tower and enable **Happy Hare controlled
in-print purging**. See [Feature: Tip Forming and
Purging](Feature-Tip-Forming-Purging.md#purge-volumes) for how the purge
length itself is calculated.

## Selecting the reference purge

Open menuconfig's **Purging --->** screen. Leave **Have Blobifier?**
disabled unless that hardware is fitted, then open **Select standalone
purging option** and choose **Simple purge into bucket**. This writes
`purge_macro: _MMU_PURGE` to `mmu.cfg`.

<p align="center">
  <img src="Macro-Purge/purging.png" alt="menuconfig Purging screen with Blobifier disabled and Simple purge into bucket selected" width="85%">
</p>

The remaining settings control when and how Happy Hare calls the macro:

| Setting | Purpose |
|---|---|
| **Happy Hare controlled in-print purge** | Leave enabled to use `_MMU_PURGE` during prints, and turn off the slicer's wipe tower. Disable it to let the slicer handle in-print purging while retaining `_MMU_PURGE` for standalone operations. |
| **Extruder purging current** | Percentage of normal extruder current to use while purging. `100` disables the boost; increase it only as needed, up to `150`. |

The reference macro does not move the toolhead to a bucket: it purges at
the current position. Configure [toolhead
parking](Toolchange-Movement.md#toolhead-movement-during-toolchange) so the
nozzle is over a suitable bucket before the macro runs.

## Configuration

<p align="center">
  <img src="Macro-Purge/purge.png" alt="menuconfig: Purge (_MMU_PURGE) screen, showing the single extruder purge speed setting" width="85%">
</p>

`_MMU_PURGE_VARS` in `mmu_macro_vars.cfg`, reachable from menuconfig's
**Macro Variables → Purge (\_MMU_PURGE)** screen shown above - genuinely
one setting, `extruder_purge_speed`: as fast as possible without the
extruder skipping steps. Extruder current for purging can also be raised
separately, in [`extruder_purge_current`](Reference-Parameters.md#purging). Full
detail: [Macro Variables: Reference
purge](Reference-Macro-Vars.md#reference-purge-_mmu_purge_vars).

## See also

- [Purge: Blobifier](Macro-Blobifier.md) - the more capable alternative
- [Feature: Tip Forming and Purging](Feature-Tip-Forming-Purging.md#purge-volumes) -
  purge volume calculation and the `purge_macro` setting
- [Macro Variables: Reference purge](Reference-Macro-Vars.md#reference-purge-_mmu_purge_vars) -
  the full variable table

---
