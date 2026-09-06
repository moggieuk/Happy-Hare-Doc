# Feature: G-code Preprocessing

## Concept

When a `.gcode` file is uploaded, Moonraker normally just scans it for
slicer metadata (print time, filament usage, thumbnails). Happy Hare adds a
second pass on top of that: it scans the same file for its own `!token!`
placeholders and rewrites them with real values before the file is ever
stored - similar in spirit to a slicer's own `{placeholder}` substitution,
but happening at upload time rather than at slice time, and using `!...!`
delimiters specifically so the two don't collide.

The main use is passing print-specific information into your `START_PRINT`
macro - which tools are actually used, filament colors/materials/
temperatures from the slicer, purge volumes - without having to duplicate
that information by hand or rely on a slicer placeholder that may not exist
yet (`{referenced_tools}`, for example, has been a pending PrusaSlicer
feature request for years).

This only runs for plain `.gcode` uploads from a recognized slicer
(PrusaSlicer, SuperSlicer, OrcaSlicer, or BambuStudio, detected from the
file's own generator comment) - binary G-code and `.ufp` uploads, and files
from anything else, pass through untouched. Re-uploading a file that's
already been processed is a no-op rather than a second substitution pass -
if you change your start g-code and want it re-applied, re-export from the
slicer rather than just re-uploading the same file.

## Moonraker Setup

Installed automatically as part of `moonraker.conf`'s `[mmu_server]`
section:

```ini
[mmu_server]
enable_file_preprocessor: True        # Substitute !placeholder! tokens on upload
enable_toolchange_next_pos: True      # See Next Toolhead Position below
```

Both default to `True` - set either to `False` to disable that half of the
preprocessor without removing the section entirely.

!!! warning "Important"
    Preprocessing a very large g-code file can occasionally take longer
    than Moonraker's default 20-second metadata-parsing timeout. If you see
    a Moonraker timeout error on upload, raise it in `moonraker.conf`:

    ```ini
    [file_manager]
    default_metadata_parser_timeout: 120
    ```

## Parameter Setup

One Klipper-side setting actually gates whether Happy Hare *uses* the
values this preprocessor injects - it always injects them, but whether
`MMU_CHANGE_TOOL` acts on the toolhead-position one depends on
`mmu_macro_vars.cfg`:

```ini
variable_restore_xy_pos : "next"   # last|next|none - toolhead XY behavior after a toolchange
```

Only `next` makes any use of the injected `NEXT_POS=` value described below
- see [Next Toolhead Position](#next-toolhead-position).

## Supported Placeholders

Add these to your slicer's start g-code, then read them as macro parameters
in `START_PRINT`:

| Placeholder | Substituted with |
|---|---|
| `!referenced_tools!` | Comma-separated list of tools used in the print, e.g. `0,2,5,6` - left unsubstituted (literal `!referenced_tools!`) if the file has no tool-selection line at all (see the worked example below for why that matters) |
| `!total_toolchanges!` | Count of tool-change commands the slicer emitted (excluding the initial tool). Some slicers offer their own `{total_toolchanges}` placeholder, but it isn't always supported - `!total_toolchanges!` always works. Pass it in at print start as recommended and Happy Hare keeps a running countdown of changes remaining |
| `!filament_names!` | Comma-separated filament names, one per extruder/tool |
| `!materials!` | Comma-separated material types, one per tool - also what the `material` [automap strategy](Feature-Gate-TTG-Maps.md#automatic-ttg-mapping) matches against |
| `!colors!` | Comma-separated colors, one per tool |
| `!temperatures!` | Comma-separated print temperatures, one per tool |
| `!purge_volumes!` | Comma-separated N×N purge-volume matrix - see [Tip Forming and Purging](Feature-Tip-Forming-Purging.md) |

`!filament_names!`/`!materials!`/`!colors!`/`!temperatures!`/`!purge_volumes!`
are exactly what the recommended `MMU_START_SETUP` macro (see the slicer
setup instructions) already passes into
[`MMU_SLICER_TOOL_MAP`](Reference-Commands.md#mmu_slicer_tool_map) to build
the slicer tool map - you only need to work with these placeholders directly
if you're doing something custom.

### Worked example: `!referenced_tools!`

Combined with [`MMU_CHECK_GATE`](Reference-Commands.md#mmu_check_gate), this
lets a start macro verify every gate the print needs actually has filament
before committing to the print:

```text
START_PRINT REFERENCED_TOOLS=!referenced_tools! INITIAL_TOOL={initial_tool} ...
```

```jinja
[gcode_macro START_PRINT]
gcode:
    {% set REFERENCED_TOOLS = params.REFERENCED_TOOLS|default("")|string %}
    {% set INITIAL_TOOL = params.INITIAL_TOOL|default(0)|int %}

    {% if REFERENCED_TOOLS == "!referenced_tools!" %}
        RESPOND MSG="Happy Hare gcode pre-processor is disabled"
        {% set REFERENCED_TOOLS = INITIAL_TOOL %}
    {% endif %}

    MMU_CHECK_GATE TOOLS={REFERENCED_TOOLS}
    MMU_CHANGE_TOOL STANDALONE=1 TOOL={INITIAL_TOOL}   ; Optional: load initial tool
```

!!! note
    A print that selects tool 0 at least once (the normal case for any
    Happy Hare print, even single-color) substitutes `!referenced_tools!`
    with `0`. A file with no tool-selection line at all - a genuinely
    non-MMU print run through the same printer profile - leaves the
    placeholder unsubstituted, literally `!referenced_tools!`, in the
    output. The macro above already handles both cases with the same
    check: the `{% if REFERENCED_TOOLS == "!referenced_tools!" %}` branch
    catches an unsubstituted placeholder regardless of *why* it wasn't
    substituted (preprocessor disabled, or no tools referenced), and falls
    back to `INITIAL_TOOL` either way - no separate empty-string branch
    needed. `MMU_CHECK_GATE` also restores whatever tool was loaded before
    it ran once it's done checking.

### Worked example: `!colors!`

```text
START_PRINT COLORS=!colors! ...
```

```jinja
[gcode_macro START_PRINT]
gcode:
    {% set colors = (params.COLORS|default("")|string).split(",") %}
    {% set ttg_map = printer.mmu.ttg_map %}

    {% for color in colors %}
        {% set gate = ttg_map[loop.index0] %}          ; Respect the TTG map, not a raw tool->gate assumption
        MMU_GATE_MAP GATE={gate} COLOR={color}
    {% endfor %}
```

This is a *manual* alternative shown for illustration - the recommended
`MMU_START_SETUP` macro already stores slicer colors in the slicer tool map
for you, and setting an LED segment's effect to `slicer_color` displays them
with no macro work at all. `gate_color_rgb` (gate map colors) and
`slicer_color_rgb` (slicer tool map colors) are both available as RGB
`(r, g, b)` tuples if you want to drive something other than Happy Hare's
own [LEDs](Feature-LEDs.md) with them.

Once colors are registered against the gate map this way (rather than left
in the slicer tool map), the `filament_color` effect is what displays them.
For example, to show the current gate's color on both the exit and status
LEDs:

```text
MMU_LED EXIT_EFFECT=filament_color STATUS_EFFECT=filament_color
```

## Next Toolhead Position

Happy Hare can rewrite a plain `Tx` toolchange into a form carrying the next
toolhead position, so a toolchange can end somewhere useful rather than
wherever it happened to occur:

```text
MMU_CHANGE_TOOL TOOL=2 NEXT_POS="26.456,156.4363" ; T2
```

`NEXT_POS=` only has an effect when `variable_restore_xy_pos: "next"` is set
(see Parameter Setup above) - it's harmless to leave
`enable_toolchange_next_pos: True` on either way, but nothing reads the
value unless that setting asks for it. See "return to next position" on
the toolchange-movement page for what happens with it.

## Troubleshooting

- **A placeholder shows up literally as `!something!` in a running print**
  - either `enable_file_preprocessor` is `False`, the slicer isn't one of
    the four the preprocessor recognizes, or the file is a binary
    `.bgcode`/`.ufp` upload (neither is scanned at all).
- **Changed your start g-code but the placeholders didn't update** -
  preprocessing only runs once per file; a file that's already been
  processed is skipped on re-upload. Re-export from the slicer rather than
  re-uploading the same file.
- **Moonraker reports a metadata-parsing timeout on a large file** - raise
  `default_metadata_parser_timeout` in `moonraker.conf`'s `[file_manager]`
  section (see the warning above).
- **The live status doesn't show `Purging` during the slicer's own
  wipe-tower routine** - the preprocessor injects
  `_MMU_STEP_SET_ACTION STATE=12`/`RESTORE=1` markers around that section
  automatically for a recognized slicer; on an unrecognized one, or a
  disabled preprocessor, that marking doesn't happen.

## See also

- [Command Reference: `MMU_CHECK_GATE`](Reference-Commands.md#mmu_check_gate)
- [Command Reference: `MMU_CHANGE_TOOL`](Reference-Commands.md#mmu_change_tool)
- [Command Reference: `MMU_SLICER_TOOL_MAP`](Reference-Commands.md#mmu_slicer_tool_map)
- [Feature: Gate/TTG Maps](Feature-Gate-TTG-Maps.md)
- [Feature: Tip Forming and Purging](Feature-Tip-Forming-Purging.md) - purge volumes
- [Feature: LEDs](Feature-LEDs.md)
- [Feature: Spoolman / Filament Hub](Feature-Spoolman.md) - the same `[mmu_server]` Moonraker component

---
