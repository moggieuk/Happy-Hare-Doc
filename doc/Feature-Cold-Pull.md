# Feature: Cold Pull

## Concept

A cold pull is a standard 3D-printing maintenance trick - heat the nozzle,
pack it full of filament, let it cool, then pull the solidified filament
straight out. It drags out carbon deposits and debris that build up over
time and cause under-extrusion or dark spots, and it's also the way to get
a genuinely clean, empty nozzle before [calibrating the
toolhead](Blobbing-and-Stringing.md#calibrating-the-toolhead).

`MMU_COLD_PULL` walks you through the process, timing the heating/cooling
ramp and prompting you when it's time to pull - the extruder motor assists
the actual pull, though you can disengage it and pull fully by hand if
you'd rather (some extruders, e.g. Galileo 2, have enough grip/torque to
manage without any manual help at all). It's implemented as a plain
`gcode_macro` (`config/macros/mmu_misc.cfg`), not a Python command, so it
doesn't appear on [Command Reference](Reference-Commands.md) - this page
is its documentation.

## Manual procedure

Without the macro, the same result is possible by hand:

1. Move the toolhead somewhere convenient (front-middle of the bed, well
   clear of it) and detach the bowden tube from the toolhead.
2. Open the extruder latch, manually feed in ~250mm of filament, close the
   latch.
3. Extrude 20-30mm, or until it comes out the loaded filament's actual
   color.
4. Turn the heater off and let the nozzle cool.
5. Keep the nozzle full while it's still reasonably hot by extruding 1-2mm
   occasionally.
6. Reheat to the cold-pull temperature for your material.
7. Pull the filament firmly and evenly straight out, vertically.
8. Check the result (see below).

## Using `MMU_COLD_PULL`

Guides you through the same process, with the extruder stepper assisting
the actual pull:

1. Move the toolhead clear of the bed and detach the bowden tube, as above.
2. Load ~250mm of filament to the nozzle by hand and close the latch.
3. Run `MMU_COLD_PULL MATERIAL=nylon|pla|abs|petg` (per-material defaults
   below; override any of them individually if needed).
4. Watch the console - it'll warn you when it's time to pull.
5. Pull straight up, firmly and evenly, when prompted. The extruder motor
   assists; you can also disengage it and pull fully by hand if you'd
   rather feel the correct pace yourself.

```{.text .console-command}
MMU_COLD_PULL MATERIAL=pla
```

```{.text .console-output}
Cold Pull with pull_temp=120°C, hot_temp=250°C, min_extrude_temp=160°C, cold_temp=45°C
Heating extruder to 250°C
Cleaning nozzle tip with 25mm of filament
Allowing extruder to cool...
Stuffing nozzle at 250°C
...
Waiting for extruder to completely cool to 45°C...
...
Re-warming extruder to 100°C
Get ready to pull...
>>>>> PULL NOW <<<<<
Cold pull is successful if you can see the shape of the nozzle at the filament end
```

A successful pull leaves a clean impression of the nozzle's own shape at
the filament's tip - roughly like the example on the left below for a
regular nozzle, or the right for a CHT nozzle (getting a clean CHT pull
needs the right temperature and a bit of luck):

<p align="center">
  <img src="Feature-Cold-Pull/Cold_Pull_Normal_Example.png" alt="Successful cold pull, regular nozzle" width="40%">
  <img src="Feature-Cold-Pull/Cold_Pull_CHT_Example.png" alt="Successful cold pull, CHT nozzle" width="40%">
</p>

It can take a few attempts to get a clean result.

!!! tip
    - Nylon and PLA tend to clean best; PETG/ABS often stretch and snap
      rather than pulling cleanly, and clear/unpigmented filament is
      reportedly the strongest for this.
    - Repeat as needed if the goal is a genuinely clean nozzle rather than
      just prepping for calibration.

## Parameters

Beyond `MATERIAL=`, every temperature/speed value has its own override -
useful if the defaults below don't suit your specific filament:

```{.text .console-output}
MATERIAL          = nylon|pla|abs|petg  Starting temperature profile
HOT_TEMP          = #                   Initial high temp
COLD_TEMP         = #                   Temp to cool to before pulling
MIN_EXTRUDE_TEMP  = #                   Temp above which the nozzle is kept pressurized
PULL_TEMP         = #                   Temp at which to perform the actual pull
PULL_SPEED        = # (default 10)      mm/s, extruder-assisted pull speed
CLEAN_LENGTH      = # (default 25)      mm of filament extruded to prime the nozzle
EXTRUDE_SPEED     = # (default 1.5)     mm/s for extrude operations
```

Default temperature profile per material:

| Material | hot_temp | cold_temp | pull_temp | min_extrude_temp | Suitability |
|---|---|---|---|---|---|
| NYLON | 260 | 50 | 120 | 190 | Best |
| PLA | 250 | 45 | 100 | 160 | Good |
| ABS | 255 | 50 | 120 | 190 | OK |
| PETG | 250 | 45 | 100 | 180 | OK |

`min_extrude_temp` is the temperature above which `MMU_COLD_PULL` keeps the
nozzle pressurized with filament, to keep it fully packed until it's time
to cool down for the pull.

## See also

- [Blobbing and Stringing: Calibrating the Toolhead](Blobbing-and-Stringing.md#calibrating-the-toolhead) - the calibration procedure a cold pull prepares the nozzle for
- [Command Reference: `MMU_CALIBRATE_TOOLHEAD`](Reference-Commands.md#mmu_calibrate_toolhead)
