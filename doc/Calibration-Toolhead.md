# Calibration: Toolhead

`MMU_CALIBRATE_TOOLHEAD` measures the toolhead geometry Happy Hare needs
for accurate loading/unloading and purge-volume calculations:
`toolhead_extruder_to_nozzle`, `toolhead_sensor_to_nozzle`,
`toolhead_entry_to_extruder`, and `toolhead_residual_filament`. The full
step-by-step procedure - cold pull, `CLEAN=1`, `DIRTY=1`, `CUT=1`, with
worked transcripts for each - lives on [Blobbing and
Stringing](Blobbing-and-Stringing.md#calibrating-the-toolhead), since
getting these dimensions right is one of the most effective ways to
reduce blobbing and stringing at toolchanges. This page covers whether
you need to run it at all, and where it fits alongside the other
calibration steps.

## Do you need to run it?

**It's optional if you picked a known toolhead/extruder combination
during install.** `menuconfig`'s **Toolhead** screen (see [Getting
Started with Box Turtle: Picking a
toolhead](GettingStarted-BoxTurtle.md#picking-a-toolhead)) lets you choose
your actual hotend/extruder combo from a list of community-measured
values, pre-filling `toolhead_extruder_to_nozzle` and
`toolhead_residual_filament` for you. If your exact combination is
listed, this is a genuinely good starting point - accurate enough for
most users without ever running the calibration command. Contributions 
to the toolhead list are always welcome! If you would like to contribute 
your parameters to this toolhead database, please visit [here](https://www.3dcoded.xyz/tipconfigs/) 
to add your parameters to future installer updates.

**It's effectively required for an unknown or heavily modified
toolhead.** If your combo isn't listed - or you picked "Other/Unknown" -
Happy Hare falls back to generic dimensions that may be noticeably off
for your specific hardware. `MMU_CALIBRATE_TOOLHEAD` is how you replace
that guess with a real measurement.

**It hard-requires a toolhead sensor.** Unlike every other calibration
command on this site, there's no manual fallback here - the command
raises an error and refuses to run at all without one. If you don't have
a toolhead sensor, your only path to more accurate values is hand-
measuring and editing the four `toolhead_*` parameters directly (see
[Config Parameters](Reference-Parameters.md) for their meaning), not a guided
command.

## Where it fits in the order

Toolhead calibration is **independent of the other steps** on
[Calibration](Calibration.md#recommended-order) - it doesn't depend on
selector, gear, encoder, or bowden calibration, and none of them depend
on it. Run it whenever convenient, and re-run it any time you change
toolhead hardware (a new hotend, a different nozzle length) without
needing to redo anything else.

## See also

- [Blobbing and Stringing: Calibrating the Toolhead](Blobbing-and-Stringing.md#calibrating-the-toolhead) - the full 5-step procedure
- [Calibration](Calibration.md) - overview, order, and which steps apply to your MMU
- [Getting Started with Box Turtle: Picking a toolhead](GettingStarted-BoxTurtle.md#picking-a-toolhead)
- [Feature: Tip Forming and Purging](Feature-Tip-Forming-Purging.md#toolhead-calibration-and-toolhead_ooze_reduction) - the manual fine-tune layered on top once calibrated
- [Command Reference: `MMU_CALIBRATE_TOOLHEAD`](Reference-Commands.md#mmu_calibrate_toolhead)
