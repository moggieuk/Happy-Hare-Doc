# Feature: Statistics & Consumption Counters

## Concept

Happy Hare tracks two independent kinds of numbers:

- **Swap and gate statistics** - detailed timing for every phase of every
  toolchange (both lifetime totals and the current job), plus a per-gate
  quality assessment - all built in, always recorded, no setup required.
- **Consumption counters** - a simple user-defined counting/warning
  framework for anything you want to track and be reminded about, like a
  filament cutter blade that dulls after a few thousand cuts.

Both live behind a single command, `MMU_STATS`.

## Commands

### Swap statistics

```text
MMU_STATS                # Summary: swap timing table, pause time, toolchange count
MMU_STATS DETAIL=1       # Add per-gate load/unload timing and slippage/failure detail
MMU_STATS TOTAL=1        # Force the lifetime-totals table even mid-print
MMU_STATS RESET=1        # Reset swap and gate statistics back to zero
```

Full parameter reference: [`MMU_STATS`](Reference-Commands.md#mmu_stats). A
plain `MMU_STATS` looks something like this (columns/rows shown are the
shipped defaults - see Tuning below for customizing them):

```{.text .console-output}
+-----------+----------+-------------------+----------+
|  114(46)  |unloading |      loading       | complete |
|   swaps   |    -     |   -    |   post    |   swap   |
+-----------+----------+--------+-----------+----------+
|     total |    47:19 |  37:11 |     33:39 |  2:00:38 |
|       avg |     0:24 |   0:19 |      0:17 |     1:03 |
|  this job |    10:27 |   8:29 |      8:30 |    28:02 |
|       avg |     0:13 |   0:11 |      0:11 |     0:36 |
|      last |     0:12 |   0:10 |      0:14 |     0:39 |
+-----------+----------+--------+-----------+----------+

11:43:27 spent paused over 10 pauses (All time)
8:15:38 spent paused over 3 pauses (This job)
114 / 220 toolchanges
Number of swaps since last incident: 105 (Record: 1111)
```

The header's `114(46)` is total swaps, with this job's count in brackets.
The toolchange line shows `<done> / <slicer total>` once a slicer tool map
with a known total is loaded, or just a plain count otherwise. Columns are
grouped in two tiers: an `unloading`/`loading`/`complete` phase across the
top, and the specific timing (`-` for the main move, `post` for what
happens after it) underneath - useful for spotting which step of a swap is
taking longer than expected. Exact spacing shifts with your data and
`console_stat_columns` selection; treat the layout above as illustrative
rather than a literal byte-for-byte transcript.

`MMU_STATS RESET=1` clears swap totals and gate statistics back to zero -
it does **not** touch consumption counters; reset those individually (see
below).

### Gate statistics

Every gate also gets a quality assessment, drawn from load/unload timing and
(if an encoder is fitted) slippage tracking:

```{.text .console-output}
Gate Statistics:
0:😎, 1:😃, 2:😊, 3:😐, 4:😟, 5:😢, 6:😱, 7:-, 8:-
```

(`-` means the gate has no recorded activity yet.) `DETAIL=1` adds the raw
numbers behind that assessment, per gate:

```{.text .console-output}
Gate 0: Load: 1234.5mm (slippage: 0.3%); Unload: 1180.2mm (slippage: 0.4%); Failures: (load: 0 unload: 0 pauses: 0); Quality: 99.7%
```

The `slippage`/`quality` figures only appear for a gate with an
[encoder](Feature-Encoder.md) fitted; load/unload failure and pause counts
are tracked for every gate regardless.

!!! note
    Don't chase a perfect score on every gate - a summary trends back
    towards good on its own once whatever caused a rough patch is fixed, no
    reset needed. Treat it as a comparison between gates rather than an
    absolute target; a gate that's noticeably worse than its neighbors is
    the one worth investigating (calibration, friction, or a move speed
    that's too aggressive for that particular gate).

### Consumption counters

A counter tracks any consumable you want reminders about. Worked example -
a filament cutter blade rated for about 4000 cuts:

```text
MMU_STATS COUNTER=cutter_blade LIMIT=4000 WARNING="You may need to replace your cutting blade"
```

Then, wherever the consumable actually gets used (typically a macro call):

```text
MMU_STATS COUNTER=cutter_blade INCR=1
```

!!! warning "Important"
    Always run the `LIMIT=`/`WARNING=` setup command once *before* the
    first `INCR=1` - creating a counter this way starts it at `0` and does
    not apply that same call's increment. It's harmless to re-run the setup
    command later (it doesn't reset the count), so a simple macro can just
    always call it before incrementing.

Crossing the limit logs a warning (and, if the counter was set up with
`PAUSE=1`, pauses the print):

```{.text .console-output}
Warning: You may need to replace your cutting blade
Count cutter_blade (4001) above limit 4000
Use 'MMU_STATS COUNTER=cutter_blade RESET=1' to reset
```

Check current counts, reset, or delete a counter you no longer need:

```text
MMU_STATS SHOWCOUNTS=1                       # List every counter
MMU_STATS COUNTER=cutter_blade RESET=1       # Reset just this one counter to 0
MMU_STATS COUNTER=cutter_blade LIMIT=-1      # Temporarily disable its limit check
MMU_STATS COUNTER=cutter_blade DELETE=1      # Remove it entirely
```

```{.text .console-command}
MMU_STATS SHOWCOUNTS=1
```

```{.text .console-output}
Consumption counters:
Count cutter_blade: 568 (limit 4000)
```

Counters persist across restarts until explicitly deleted.

!!! note
    Happy Hare may add more built-in preset counters (varying by MMU type
    and which options you have enabled) in future versions - this page only
    describes the fully user-defined counter mechanism available today.
    Two of the pieces for a couple of obvious ones already exist as plain
    config values - `mmu_macro_vars.cfg`'s `_MMU_STATE_VARS` section ships
    a `servo_down_limit` and a `cutter_blade_limit` (see [Macro Variables:
    State change hooks](Reference-Macro-Vars.md#state-change-hooks-_mmu_state_vars))
    - but neither is wired to an actual counter automatically; you'd still
    set one up yourself with `MMU_STATS COUNTER=...` as above, just reusing
    Happy Hare's own suggested limit value.

### Where statistics and counters are stored

Both swap/gate statistics and consumption counters are persisted the same
way as everything else Happy Hare needs to remember between restarts: in
its Klipper `[save_variables]` file, typically `mmu_vars.cfg`.

!!! warning
    `mmu_vars.cfg` can be hand-edited directly, but be careful - corrupting
    it can leave Happy Hare unable to start.

## Tuning

The swap-statistics table's columns and rows, and how gate quality is
displayed, are configured in `mmu.cfg`'s `[mmu_parameters]` section (not the
file literally named `mmu_parameters.cfg`):

```ini
log_statistics             : 1        # 1 = log the table on every toolchange (default), 0 = still recorded, just not printed
console_stat_columns       : unload, load, post_load, total   # Any of: pre_unload, form_tip, unload, post_unload, pre_load, load, purge, post_load, total
console_stat_rows          : total, total_average, job, job_average, last
console_always_output_full : 1        # 1 = always show the full table, 0 = only outside a print
console_gate_stat          : emoticon # string | percentage | emoticon
console_show_colored_text  : 1        # 1 = color console output where supported, 0 = plain monochrome text
console_show_filament_color: 1        # 1 = show a colored "swatch" for filament, 0 = a plain asterisk instead
```

Trim `console_stat_columns`/`console_stat_rows` to shrink the table - useful
if you're displaying it somewhere space-constrained, like a KlipperScreen
popup. `console_gate_stat` swaps the gate-statistics line between the
emoji version above, a plain string (`poor`/`good`/`perfect`/...), or a
percentage. `console_show_colored_text`/`console_show_filament_color` sit in
the same config section but aren't specific to this page - they affect
color and swatch use across Happy Hare's console output generally,
including gate-map listings elsewhere on this site.

## Troubleshooting

- **`MMU_STATS RESET=1` didn't clear a consumption counter** - by design;
  it only resets swap/gate statistics. Reset a specific counter with
  `MMU_STATS COUNTER=<name> RESET=1`.
- **A brand new counter's first `INCR=1` didn't seem to count** - the setup
  command (`LIMIT=`/`WARNING=`) must run before the first increment; see the
  warning above.
- **Gate statistics look wrong for gates with no encoder** - slippage and
  quality are encoder-only; a gate without one only tracks load/unload
  failures and pauses, which is expected, not a fault.

## See also

- [Command Reference: `MMU_STATS`](Reference-Commands.md#mmu_stats)
- [Feature: Encoder](Feature-Encoder.md) - the source of gate slippage/quality data
- [Feature: EndlessSpool & Runout Detection](Feature-Endless-Spool-Runout.md) - a runout pause adds to that gate's pause count
- [Macro: State Change Hooks](Macro-State-Change-Hooks.md) - the
  `servo_down_limit`/`cutter_blade_limit` maintenance thresholds a
  hand-wired counter here can use
- [Printer Variables](Reference-Printer-Variables.md#core-state) - `num_toolchanges`/`slicer_tool_map.total_toolchanges`, the only part of this feature exposed as a printer variable; everything else is console/log only

---
