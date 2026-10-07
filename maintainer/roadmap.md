# Documentation roadmap

Reconciled with repository files on 2026-10-01. This is a backlog, not published
navigation or a claim that every historical task is still needed. Site navigation
lives in `mkdocs.yml`. Check existing coverage before creating a new page.

## Planned work without a dedicated page

| Work | Source and next step |
|---|---|
| MMU types overview | Compare current menuconfig profiles; revisit the historical HTLF note against current source. The planned `MMU-Types-Overview.md` does not exist. |
| QuattroBox walkthrough | Use the wiki Quick Start and current menuconfig profile. `GettingStarted-QuattroBox.md` does not exist. |
| Configuration reference generators | The four planned `Configuring-mmu*.cfg.md` pages and their dedicated generators do not exist. Review overlap with `Reference-Parameters.md` and `Reference-Macro-Vars.md` before deciding whether to add generators or extend those pages. Historical source mappings are in the archive's Configuration table. |
| Troubleshooting and FAQ | The planned `Troubleshooting-and-Common-Issues.md` and `FAQ.md` do not exist. Compare the corresponding wiki pages with current Operation and Feature troubleshooting sections before deciding on new pages. |
| Community and support | `doc/Release-Notes.md` now covers v4.0.0 and the pending v4.1.0 changes. The planned `Donations.md` and `Getting-Help.md` do not exist; review existing home-page and social links before porting wiki material. |
| External link migration | Assess redirects or an old-to-new URL map for links from the wiki, README files, Discord, KlipperScreen, and videos once destination URLs are stable. |

## Publication dependencies

- Fans & Airflow, Heater & Environment Manager, and the refreshed menuconfig
  screenshots target Happy Hare `development` at `8888b228` (2026-10-07).
  These cover built-in vent control, controller fans, fan UI visibility,
  object-name encoder/buffer sharing, I2C bus selection, servo settings and
  the expanded Software Options menu. Confirm release availability
  before publishing them as released behavior. `HAPPY_HARE_REF` remains `main`;
  use the verified development commit when regenerating this material.

- Unit naming and restructuring documentation targets Happy Hare
  [PR #1277](https://github.com/moggieuk/Happy-Hare/pull/1277) and
  [PR #1281](https://github.com/moggieuk/Happy-Hare/pull/1281), verified against
  `c190474c`. Both PRs were open on 2026-10-01; confirm the merged behavior before
  publishing these pages with a release.

## Existing coverage and historical entries to reconcile

- `Understanding-Operation.md` exists and has a completed entry in the old
  Operation table. Do not carry forward the older Concepts-table verification
  flag as an outstanding task without a specific new finding.
- The print-job lifecycle is covered in `Operation.md`. The old standalone
  `Print-Job-State-Machine.md` proposal is not automatically a missing page.
- `Hardware-Configuration.md`, `Movement-and-Homing.md`, and
  `Macro-Configuration.md` are old proposed filenames, not current pages. Check
  `Hardware-Validation.md`, Calibration pages, `Macro-Customization.md`, and
  relevant Feature pages before treating their source material as missing.
- The current Reference pages exist. In particular, the Printer Variable
  Reference is maintained prose verified against source, not an existing
  automated generator. Do not infer generation support from old planning labels.

## Research requiring fresh verification

These are historical findings, not confirmed current defects or promises of work:

- The selector `servo`/`grip` status exposure question remains documented in
  `doc/Dev-Code-Layout.md`. Check current Happy Hare source before raising an
  upstream issue or changing the reference.
- The NFC research in archive session item 63 used a then-unmerged source PR
  and deferred related parameter-reference updates. Verify the current source
  and reference coverage before carrying that question forward.
- Build limitations must be retested when updating Zensical. Maintained
  workarounds live in [the tooling guide](../doc_tools/README.md#build-limitations-and-workarounds).

## Historical research and source mappings

[Documentation migration archive](archive/documentation-migration.md) preserves
the full original planning document, including every page/source mapping,
verification note, omitted-content rationale, and numbered session entry.
Its contents are frozen and may contradict current files or current guidance.
Consult it for a specific research question rather than reading it as instructions.

Maintain new writing rules in [CONTRIBUTING.md](../CONTRIBUTING.md), repository
instructions in [AGENTS.md](../AGENTS.md), tooling procedures alongside the tools,
and outstanding work here. Keep this roadmap concise by removing resolved tasks
or replacing them with links to their completed documentation.
