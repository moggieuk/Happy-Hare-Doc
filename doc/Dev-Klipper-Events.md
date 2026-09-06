# Klipper Events

Happy Hare emits Klipper events for integrations that need to react to MMU
activity. Register a handler with
`printer.register_event_handler("mmu:xxx", callback)`; the callback receives
the parameters listed below in order.

## Events

| Event | Parameters | Description |
|---|---|---|
| `mmu:mmu_paused` | - | An MMU error paused the print |
| `mmu:mmu_resumed` | - | The print resumed after an MMU error |
| `mmu:enabled` | - | `MMU ENABLE=1` |
| `mmu:disabled` | - | `MMU ENABLE=0` |
| `mmu:toolchange` | `last_tool` (int), `next_tool` (int) | A toolchange started |
| `mmu:synced` | - | The gear stepper became synced to the extruder |
| `mmu:unsynced` | - | The gear stepper became unsynced from the extruder |
| `mmu:sync_feedback` | `eventtime` (float), `state` (float, `-1.0..+1.0`) | Buffer feedback changed: tension (`-`) or compression (`+`) |
| `mmu:initialized` | - | Happy Hare controller initialization completed |
| `mmu:bootup` | - | The delayed `MMU_BOOTUP` sequence completed |
| `mmu:printing` | `eventtime` (float) | The print-state machine entered `printing` |
| `mmu:not_printing` | `eventtime` (float) | The print-state machine left `printing` |
| `mmu:tool_selected` | `tool` (int) | The selected tool changed |
| `mmu:gate_selected` | `gate` (int), `previous_gate` (int) | The selected gate changed |
| `mmu:unit_selected` | `unit` (int), `previous_unit` (int) | The selected unit changed |
| `mmu:spoolid_pending` | - | A Spoolman spool ID became pending assignment |
| `mmu:spoolid_not_pending` | `reread` (bool) | A Spoolman spool ID stopped being pending; `reread` allows the same tag to be read again immediately |
| `mmu:espooler_burst` | `gate` (int), `power` (float, `0.0..1.0`), `duration` (float), `operation` (string) | An eSpooler burst started |
| `mmu:espooler_burst_done` | `gate` (int) | An eSpooler burst finished |
| `mmu:test_gen_finished` | - | Internal - a `_MMU_TEST` generator command finished |

## See also

- [Printer Variable Reference](Reference-Printer-Variables.md)
- [Macro: State Change Hooks](Macro-State-Change-Hooks.md)

---
