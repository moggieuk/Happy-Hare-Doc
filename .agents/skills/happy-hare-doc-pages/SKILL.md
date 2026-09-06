---
name: happy-hare-doc-pages
description: Use whenever editing, adding, or reviewing a page under doc/ in the Happy-Hare-Doc repo, or regenerating menuconfig screenshots / doc/Reference-Commands.md. Covers this Zensical-based site's locked-in style conventions (admonition syntax, code-fence language, footer, no [TOC]/mermaid, no version narrative, no developer references outside the Developer Guide), the Feature-page and Macro-page templates, and the make shots / make command_reference workflows. Trigger this for requests like "add a Feature page for X", "port this wiki page", "regenerate the screenshots", "update the command reference", "why doesn't this admonition have an icon", or any doc/*.md edit — even if the requester has never heard of this skill or read TOC.md.
---

# Happy Hare doc pages

This repo's real style guide is `TOC.md` at the repo root (2800+ lines —
don't read the whole thing). This skill exists so you don't have to: it
names the stable section of TOC.md to read, plus the handful of conventions
that fail **silently** (no build warning, no lint error) often enough to be
worth stating here directly.

**Anti-drift rule:** new site-wide structural decisions get recorded in
`TOC.md`'s stable section (see below), never invented or edited in this
skill. The list below is a "most commonly violated" cheat sheet, not the
source of truth — if this skill and `TOC.md` ever disagree, `TOC.md` wins
and this skill is stale and needs a fix. Line numbers below drift every
time that section grows - re-run the `grep` if anything looks off rather
than trusting a stale number, and fix the number here while you're at it.

## Which parts of TOC.md to actually read

Jump to headings with `grep -n "^## \|^### " TOC.md` and read everything
before the first `---` divider (currently line 9 to a bit past line 300 —
that range is stable, hand-checked conventions:

- `## Structure decisions locked in` — the full list: theme, Zensical
  quirks, "no dev references" scope, buffer-terminology split, the Getting
  Started/Feature/no-[TOC] rules, etc.
- `## Macro page template`
- `## Feature page template`, including
  `### Before finishing a Feature page`

Everything from that first `---` onward is the per-page status table —
what's done, what's planned, session log. It changes every session and isn't
a convention; don't load it unless you're specifically checking a page's
status or looking for prior art on a similar page.

## What needs Happy Hare's source, and what doesn't

- Editing `doc/*.md` and running `make docs` / `make docs_build` /
  `make docs_preview`: needs nothing fetched, just this repo.
- Regenerating screenshots (`make shots`) or the Command Reference
  (`make command_reference`): needs a Happy Hare source checkout. The default
  `.happy-hare-src/` is a disposable managed cache refreshed to
  `HAPPY_HARE_REF` before every run. A checkout supplied with
  `HAPPY_HARE_SRC=/path/to/Happy-Hare` is user-owned and must be read as-is,
  never fetched, switched, or removed by the documentation workflow.
- MCU/serial-device screenshots specifically must be captured on a machine
  with **no printer attached** — the serial-device glob
  (`/dev/serial/by-id/*`) reads whatever's plugged into the machine doing the
  capture, not a fixture.

For the actual mechanics of `make shots` (sessions, seeds, `--only`, height
autofit, `CAPTURE=1` exploration) and `make command_reference`, read
`doc_tools/README.md` — its section headers are `## Generating the Command
Reference`, `## Regenerating the images`, `## Seeds`, `## One session, many
screenshots`, `## Height looks after itself`, `## Photographing an editor`,
`## Exploring, before adding a session`, `## What is not reproducible`. Don't
restate that mechanical detail here; it's already documented once, next to
the code it describes.

## Cheat sheet: conventions that fail silently

These are worth stating inline because getting them wrong doesn't error or
warn — the page just builds looking subtly wrong, and nobody notices until a
reader does.

- **Admonitions:** use the base `admonition` extension's `!!! type "Title"`
  syntax — GitHub's `[!NOTE]` style is not enabled here. Only these types are
  actually styled with an icon/colour: `note`, `tip`, `info`, `success`,
  `question`, `warning`, `danger`, `bug`, `example`, `quote`, `abstract`,
  `failure`. `!!! important` is **not** one of them — it renders with no
  icon, no colour, and no build warning. For an "Important" callout, write
  `!!! warning "Important"` (styled callout, original label preserved).
- **Code fences:** this repo uses `codehilite` (not the normal
  `pymdownx.highlight` recipe) as a deliberate workaround for a Zensical
  non-determinism bug. Match the language tag to the content: ` ```ini ` for
  `.cfg`-style config examples (`mmu_parameters.cfg`, `mmu_hardware.cfg`,
  ...), ` ```text ` for gcode command examples/lists. For a block that's
  literal console/printer output specifically (not a command you'd type,
  but what comes back), add the `console-output` class -
  ` ```{.text .console-output} ` - which renders in a distinct
  terminal-green instead of the default text colour, so real output reads
  differently at a glance from a command example or a `.cfg` block.
- **No `[TOC]` marker on any page** — the theme's own "On this page" sidebar
  makes it pure duplication.
- **No ` ```mermaid ` fenced code blocks** — non-deterministic across clean
  rebuilds. Developer Guide diagrams use plain ASCII in fenced code blocks
  instead. The one sanctioned exception is `Feature-Spoolman.md`'s raw
  `<pre class="mermaid">` HTML (not a fence) — don't take that as license to
  reintroduce fenced mermaid elsewhere.
- **Page footer:** trailing markdown is just `---`, nothing after it. Footer
  ASCII art and copyright are injected by the theme + `hh-page-nav.js`, not
  per-page markup.
- **No v3-vs-v4 narrative anywhere reader-facing, on any page** — this
  applies retroactively, including pages written before the rule existed. A
  verified fact gets stated as plain fact ("X does Y"), never as "v3 said X,
  v4 actually does Y." The only surviving exception is deprecation-status
  notation (a `Deprecated variables` table). This does **not** relax
  verifying content against v4 code before porting v3 wiki prose — it only
  changes how the verified result gets phrased.
- **No Happy Hare "developer" references outside the Developer Guide, on any
  page** — no Python class/method names, `get_status()` citations, or file
  paths, whether explaining behaviour or citing where a number comes from.
  Write "an extruder-movement monitor triggers a burst," not
  "`MmuExtruderMonitor` fires a callback which calls `advance()`." **Not**
  developer references (keep these): `mmu_parameters.cfg`/`.cfg` keys,
  `MMU_*` command names, Klipper config section names
  (`[mmu_espooler unit0]`), and Klipper API calls a reader would write
  themselves to extend Happy Hare (`printer.send_event(...)`,
  `printer.register_event_handler(...)`). The Developer Guide is the one
  place all of the above is fair game, by design.
- **Avoid explicit counts that go stale** (test counts, command counts) —
  prefer ">900 tests" / "browse the source" phrasing over a number the next
  PR will falsify.
- **Don't drop wiki illustrations, admonitions, or worked numeric examples**
  when porting a page, without a specific reason. The bar for cutting
  something is "actively wrong or superseded," not "feels long."
- **Reusing a wiki diagram:** an editable, labeled mechanism drawing (not a
  screenshot of real output) can be reused even with stale labels — add a
  corrective caption/tip. A screenshot of real UI/console output showing old
  sensor/field names is different: that's real output a v4 reader would
  never actually see, and no caption fixes that. Skip it, and say why rather
  than silently dropping it.
- **Pin aliases don't exist in v4** — `mmu_hardware.cfg` pin values are
  fully-specified `unit_mcu_name:pin_name` strings (e.g. `unit0:PA0`) filled
  in directly; there's no separate alias layer in `mmu.cfg`.
- **"Filament (catchment) buffer" and "sync-feedback buffer" are two
  different Kconfig options** (`MMU_HAS_FILAMENT_BUFFER` vs
  `MMU_HAS_SYNC_FEEDBACK_BUFFER`) — don't conflate them into one thing, and
  don't assume they're mutually exclusive; that's now per-MMU-type, verify
  against source if it matters for the page you're writing.

## Feature page template

Every page under §5 Features uses this fixed order:

1. **Concept** — illustrate it if the wiki did.
2. **Hardware Setup** — wiring table + `mmu_hardware.cfg` (and the relevant
   `mmu.cfg` pin block if any). Include a real menuconfig screenshot for the
   hardware-facing prompts if easy to capture (one `doc_tools/shots.py`
   session per feature page, `outdir` matching the page name).
3. **Parameter Setup** — `mmu_parameters.cfg` (and `mmu.cfg` where relevant).
   Keep worked numeric examples from the wiki; don't compress them to one
   line.
4. **Commands** (linked to Command Reference anchors).
5. **Printer variables exposed** — include a UI subsection with real
   screenshots/illustrations if the feature is visible in
   KlipperScreen/Mainsail/Fluidd.
6. **Tuning** — step-by-step "get this working" recipes from the wiki belong
   here even without a dedicated slot for them elsewhere.
7. **Troubleshooting**
8. **See also**

**Before finishing any Feature page (or any ported page):** proofread it
against its wiki source section-by-section, then report back what didn't
carry forward and why — even content you're confident was right to cut. The
person reviewing gets to restore anything; don't silently decide something
wasn't worth keeping.

## Macro page template

Every page under §10b Macros uses this lighter structure instead:

1. **What it does** — concept, kept brief; put hardware/workflow depth on
   the related Feature page if one exists, and cross-link rather than
   duplicate.
2. **Where it's applied** — which real macro/command this configures, and
   how it's wired in (automatically, or via a `user_*_extension`/`*_macro`
   hook).
3. **Configuration** — the real menuconfig screenshot (**Macro Variables →
   <menu>**, from a `doc_tools/shots.py` session; toggle the owning
   capability first if the group is gated), plus only the handful of
   settings worth calling out specifically. The full variable table always
   lives on `Reference-Macro-Vars.md` — never re-tabulate it here.
4. **See also**
