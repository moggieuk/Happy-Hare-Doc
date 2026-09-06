# Macro Customization

## Concept

Happy Hare drives most customizable activities through gcode macros - tip
forming, parking moves, consumption counters, the pause/resume
flow, all of it. Every one of those macros is designed to be customized
without editing Happy Hare's own shipped files, which are overwritten on
every upgrade.

There are two distinct ways to customize behavior, and picking the right one
matters:

1. **Extension** - add your own macro to run alongside the default logic,
   leaving the original behavior intact. This is the recommended approach
   for almost everything, and it's what the rest of this page covers.
2. **Replacement** - point Happy Hare at a completely different macro
   instead of the default one. Reach for this only when extension genuinely
   isn't enough (tip forming is the common case).

Both methods are configured in files Happy Hare treats as yours -
`mmu_macro_vars.cfg` for extension hooks, `mmu.cfg`/`mmu_parameters.cfg` for
macro replacement - so your customization survives an upgrade even though
the macros it hooks into don't.

## Method 1: Extension

Most `variable_user_*_extension` variables in `mmu_macro_vars.cfg` name a
macro of your own that runs **after** the default logic, with the same
parameters the original callback macro received. Leave one blank (the
default) and nothing extra happens; set it to your macro's name and it runs
every time.

```ini
variable_user_print_state_changed_extension : 'MY_MACRO'
```

Each hook lives in the `_MMU_*_VARS` block for the macro group it extends -
knowing which group owns which hook is the useful part, since the wiki this
site replaces only ever listed them as one flat list:

| Hook | Lives in | Extends |
|---|---|---|
| `user_pre_initialize_extension` | [`_MMU_SOFTWARE_VARS`](Reference-Macro-Vars.md#print-startend-_mmu_software_vars) | `MMU_START_SETUP`, at the very start |
| `user_print_end_extension` | [`_MMU_SOFTWARE_VARS`](Reference-Macro-Vars.md#print-startend-_mmu_software_vars) | `MMU_END`, at the very start |
| `user_action_changed_extension` | [`_MMU_STATE_VARS`](Reference-Macro-Vars.md#state-change-hooks-_mmu_state_vars) | `_MMU_ACTION_CHANGED` |
| `user_print_state_changed_extension` | [`_MMU_STATE_VARS`](Reference-Macro-Vars.md#state-change-hooks-_mmu_state_vars) | `_MMU_PRINT_STATE_CHANGED` |
| `user_mmu_event_extension` | [`_MMU_STATE_VARS`](Reference-Macro-Vars.md#state-change-hooks-_mmu_state_vars) | `_MMU_EVENT` |
| `user_mmu_error_extension` | [`_MMU_SEQUENCE_VARS`](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars) | An MMU error condition |
| `user_pre_unload_extension` | [`_MMU_SEQUENCE_VARS`](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars) | `_MMU_PRE_UNLOAD` |
| `user_post_form_tip_extension` | [`_MMU_SEQUENCE_VARS`](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars) | `_MMU_POST_FORM_TIP` |
| `user_post_unload_extension` | [`_MMU_SEQUENCE_VARS`](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars) | `_MMU_POST_UNLOAD` |
| `user_pre_load_extension` | [`_MMU_SEQUENCE_VARS`](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars) | `_MMU_PRE_LOAD` |
| `user_post_load_extension` | [`_MMU_SEQUENCE_VARS`](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars) | `_MMU_POST_LOAD` |
| `user_post_preload_extension` | [`_MMU_SEQUENCE_VARS`](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars) | A successful gate preload |
| `user_pause_extension` | [`_MMU_CLIENT_VARS`](Reference-Macro-Vars.md#client-macros-_mmu_client_vars) | Klipper's base pause |
| `user_resume_extension` | [`_MMU_CLIENT_VARS`](Reference-Macro-Vars.md#client-macros-_mmu_client_vars) | Klipper's base resume (runs *before*, not after) |
| `user_cancel_extension` | [`_MMU_CLIENT_VARS`](Reference-Macro-Vars.md#client-macros-_mmu_client_vars) | Klipper's base `cancel_print` (runs *before*) |

One hook doesn't fit the "runs after" pattern: `user_park_move_macro`
(`_MMU_SEQUENCE_VARS`) **replaces** the default straight-line `G1 X Y` park
move rather than extending it, so you can route around an obstacle instead
of moving through it. It's called with `X=`/`Y=`/`F=`, and again with
`RESTORE=1` plus the restore coordinates when un-parking. See [Macro
Variables: Sequence/parking](Reference-Macro-Vars.md#sequenceparking-_mmu_sequence_vars)
for the full parking mechanism this sits inside.

## Method 2: Replacement

If extension genuinely isn't enough - most often because you need to change
*how* something happens rather than add a step after it - point Happy Hare
at a completely different macro by changing one of these in `mmu.cfg`:

```ini
form_tip_macro           : _MMU_FORM_TIP
purge_macro              : _MMU_PURGE
pause_macro              : PAUSE
action_changed_macro     : _MMU_ACTION_CHANGED
print_state_changed_macro: _MMU_PRINT_STATE_CHANGED
mmu_event_macro          : _MMU_EVENT
post_preload_macro       : _MMU_POST_PRELOAD
pre_unload_macro         : _MMU_PRE_UNLOAD
post_form_tip_macro      : _MMU_POST_FORM_TIP
post_unload_macro        : _MMU_POST_UNLOAD
pre_load_macro           : _MMU_PRE_LOAD
post_load_macro          : _MMU_POST_LOAD
unload_sequence_macro    : _MMU_UNLOAD_SEQUENCE
load_sequence_macro      : _MMU_LOAD_SEQUENCE
```

Full reference table (with each one's default and a one-line description):
[Parameters: Macros](Reference-Parameters.md#macros) (`form_tip_macro`/`purge_macro`
are in that page's [Tip forming](Reference-Parameters.md#tip-forming)/
[Purging](Reference-Parameters.md#purging) sections instead, alongside their other
settings).

!!! warning "Important"
    Before replacing any of these, read the macro you're replacing and the
    parameters it's called with - copy it to a new name as your starting
    point rather than writing from scratch, and rename any "helper" macros
    it calls internally too. A replacement survives upgrades (since
    `mmu.cfg` is yours), but it also won't pick up any future improvement to
    the macro it replaced unless you update it yourself. Outside of
    `form_tip_macro`/`purge_macro`, replacement is genuinely rare - reach for
    an extension hook first.

`pause_macro` in particular is rarely worth replacing - the default `PAUSE`
already does the right thing for most setups - but a few community reasons
come up often enough to be worth naming: parking above a sparse purge tower
so an MMU error doesn't stop the toolhead over a model between the tower and
the normal pause position; also sending a push notification on a filament
swap error; or passing additional static arguments into the default (or
your own) pause macro. Whatever you point `pause_macro` at, it **must**
ultimately leave the printer in a paused state - Happy Hare's own error
handling depends on that.

`unload_sequence_macro`/`load_sequence_macro` are the deepest level of
replacement Happy Hare offers - a wholesale rewrite of the load/unload
movement logic itself, gated behind `gcode_load_sequence`/
`gcode_unload_sequence`. That mechanism is big enough to have its own page:
see [Custom Load/Unload Sequences](Custom-Load-Unload-Sequences.md).

## Tip forming and tip cutting

`form_tip_macro` is the one replacement almost every MMU actually uses,
since it's how Happy Hare chooses between its two built-in standalone
tip-shaping methods. Rather than cover both here, each has its own page with
the full tuning workflow: [Tip Shaping: Forming](Macro-Tip-Forming.md)
(`_MMU_FORM_TIP`) and [Tip Shaping: Toolhead
Cutting](Macro-Toolhead-Tip-Cutting.md)
(`_MMU_CUT_TIP`).

## See also

- [Macro Variables](Reference-Macro-Vars.md) - every `variable_*` this page's
  extension hooks and the macro pages below configure, in full
- [Macro: Print Start/End](Macro-Print-Start-End.md),
  [State Change Hooks](Macro-State-Change-Hooks.md),
  [Sequence](Macro-Sequence.md), [Client](Macro-Client.md),
  [Tip Shaping: Forming](Macro-Tip-Forming.md),
  [Tip Shaping: Toolhead Cutting](Macro-Toolhead-Tip-Cutting.md),
  [Tip Shaping: MMU Cutting](Macro-Servo-Cutter.md), [Purge:
  Blobifier](Macro-Blobifier.md), [Purge: Simple](Macro-Purge.md) - the
  macro group each hook and replacement point
  above belongs to
- [Custom Load/Unload Sequences](Custom-Load-Unload-Sequences.md) - the
  deepest replacement level, for `load_sequence_macro`/`unload_sequence_macro`
- [Command Reference](Reference-Commands.md) - full parameters for every
  `MMU_*`/`_MMU_*` command named above

---
