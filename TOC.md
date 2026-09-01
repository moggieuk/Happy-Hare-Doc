# Happy Hare v4 documentation — table of contents (planning)

This is the working plan for the new documentation site. It maps every planned page to
its source material and status, so writing sessions can pick up a page without
re-deriving context. It is a planning document, not a published page — it lives at the
repo root (not under `doc/`) specifically so it's never a candidate for publishing; see
**Session log** at the bottom for where things actually stand and how to pick this back up.

## Structure decisions locked in

- **This is a separate repo from Happy Hare's source code**, added 2026-08-06 —
  everything below (`doc/`, `doc_tools/`, this file, `mkdocs.yml`) used to live
  inside the Happy-Hare repo itself; moved out to `Happy-Hare-Doc` because `doc/`
  carries a lot of screenshots and a Happy-Hare *code* checkout has no reason to
  pull that down. `doc_tools/gen_command_reference.py` and `doc_tools/capture.py`
  still need to read Happy-Hare's source tree (`extras/mmu/**`,
  `installer/Kconfig*`) to regenerate `Reference-Commands.md`/screenshots — that
  happens via `HAPPY_HARE_SRC`. The default gitignored `.happy-hare-src/` is a
  disposable managed cache refreshed to the latest commit at the branch, tag or
  commit in `HAPPY_HARE_REF` before each source-dependent run. An explicitly
  supplied checkout is read as-is and never fetched, switched, or removed.
  `docs`/`docs_build`/`docs_preview`
  (and this repo's CI/Pages deploy) need none of that — they only render the
  `doc/*.md` and images already committed here. See the root `README.md` for the
  contributor-facing version of this, and `doc_tools/README.md` for exactly how
  the source-fetch mechanism works.
- **Layout:** flat at `doc/` root, matching `doc_tools/shots.py`'s existing
  convention — page `doc/Foo.md`, images in sibling `doc/Foo/`. No churn to the
  Box Turtle page or its sessions. `mkdocs.yml` has `docs_dir: doc` (site output
  is `./site`, Zensical's own default — deliberately left unset in the config
  rather than renamed; see the Makefile/`mkdocs.yml` comments for why).
- **Site generator: [Zensical](https://zensical.org), not mkdocs**, reading the
  same `mkdocs.yml` format ("your current settings just work" checked out in
  practice). `doc_tools/README.md` has the full rationale and the `make
  docs`/`docs_build`/`docs_preview`/`command_reference` targets. It's genuinely
  pre-1.0 (`0.0.52` on PyPI) — see **Zensical rough edges** below before
  reaching for anything fancy in a new page.
- **Theme:** Material variant `classic` (not Zensical's newer default `modern`,
  which doesn't colour the header from `primary` at all), black primary + the
  brand's own hot pink accent (`#FF69B4`-family, matching the neon-hare logo and
  HH's own console warning colour). Logo/favicon are real assets under
  `doc/assets/images/`, generated from `wiki/resources/happy_hare_logo.jpg`.
- **No `[TOC]` marker on any page** — superseded partway through: the theme's own
  "On this page" sidebar makes an inline copy pure duplication, on every page,
  not just generated ones. See `doc_tools/README.md`'s Page Conventions section.
- **No ` ```mermaid ` fenced code blocks** — tried, found non-deterministic
  across clean rebuilds, and reverted; see **Zensical rough edges**.
  Architecture diagrams in the Developer Guide are plain ASCII in fenced code
  blocks instead. `Feature-Spoolman.md` later re-introduced Mermaid via a
  different mechanism (raw `<pre class="mermaid">` HTML, not a fence) — see
  item 33 below before assuming this bullet still means "no Mermaid anywhere."
- **Getting Started scope (v1):** Box Turtle only, walked deep. Everything else gets
  a comparison table + "same pattern, different Kconfig starter" note. Multi-unit and
  additional MMUs come later as their own pages.
- **Generated vs hand-written:** Command Reference and Printer Variable Reference
  are *generated*/*code-verified* respectively from source (see §10 below) rather
  than hand-transcribed — same "code in `doc_tools/`, output in `doc/`" split
  already established for screenshots. The four Configuration Reference pages
  (§3) are still planned as generated but not yet built. Everything else is
  hand-written prose, informed by the wiki.
- **Reference-section pages are named `Reference-XXX.md`** (added 2026-08-11)
  — `Reference-Commands.md`, `Reference-Parameters.md`,
  `Reference-Macro-Vars.md`, `Reference-Printer-Variables.md`,
  `Reference-Mcu.md`. Renamed from a mix of `Foo-Reference.md`/plain `Foo.md`
  names for consistency across the nav's `Reference:` section; any future
  page added there should follow the same `Reference-XXX.md` pattern. Doesn't
  apply to Developer Guide pages, which keep that section's own `Dev-` prefix
  convention instead.
- **v3→v4 flag:** any page ported from `wiki/` gets a ⚠️ in its status table
  entry until someone verifies it against v4 code. The riskiest one flagged
  this way was the Type-A/Type-B taxonomy on `Conceptual-MMU.md` — v4's real
  selector classes (`LinearSelector`, `LinearServoSelector`, `ServoSelector`,
  `IndexedSelector`, `RotarySelector`, `VirtualSelector`, plus multi-gear
  variants, documented in `doc/Dev-Code-Layout.md`) don't map cleanly onto
  the old binary split — that page is now done (§2), rewritten around the
  real hierarchy rather than ported; see the session log for how.
- **Avoid explicit counts that go stale** (test counts, command counts). Prefer
  ">900 tests" / "browse the source" phrasing over a number that will be wrong
  by the next PR — learned the hard way when a ported "69 commands, 14 tested"
  figure turned out to already be stale (`Reference-Commands.md` now lists 88).
- **No v3-vs-v4 narrative in the reader-facing text of ANY page**, including
  ones written before this rule (added 2026-08-06, extended the same day once
  the user confirmed the rule is retroactive) — this is v4-only documentation;
  a fresh reader doesn't care what changed from a version they never used.
  This does NOT relax verifying against v4 *code* rather than porting the v3
  wiki's prose uncritically (see the counts bullet above and the whole reason
  `Feature-Espooler.md` exists) — it only means the verified result gets
  stated as plain fact, not as "v3 said X, v4 actually does Y."
  `Reference-Printer-Variables.md` has been retrofitted: removed its "What changed
  since v3" section and the "Not currently exposed here: servo/grip" aside
  (the servo/grip finding itself moved to `Dev-Code-Layout.md`, a developer
  page, rather than being lost), stripped the `Dev-Klipper-Events.md`
  table's
  `Since` column and "signature changed"/"new in v4" language, and dropped a
  stray "(unchanged from v3)". **The only meta-notation that page still
  carries is deprecation status** (the `Deprecated variables` table) — that's
  the one exception to "no version narrative" and is explicitly wanted.
- **No Happy Hare "developer" references outside the Developer Guide, on ANY
  page** (added 2026-08-06, confirmed page-genre-wide the same day — this was
  the open question below, now resolved) — no Python class/method names,
  `get_status()` citations, or file paths, whether used to *explain* behaviour
  or as a "where this number comes from" byline. Say "an extruder-movement
  monitor triggers a burst" not "`MmuExtruderMonitor` fires a callback which
  calls `advance()`"; say "The main status object" not "built by
  `MmuController.get_status()` (`extras/mmu/mmu_controller.py`)". Retrofitted
  into `Reference-Printer-Variables.md` (stripped every `Mmu*.get_status()`/file-path
  citation, the "Registered from" column, and the `FILAMENT_POS_*`/
  `TOOL_GATE_BYPASS` constant-name mentions) and `Reference-Commands.md`'s
  generator (dropped `HELP_BRIEF`/`extras/mmu/`/the "regenerate with `make
  command_reference`" maintenance note from the reader-facing intro — that
  note now only needs to exist for a doc contributor, i.e. in
  `Dev-Doc-Tooling.md`, not on the page a normal user reads for command
  syntax). `mmu_parameters`/`.cfg` keys, `MMU_*` command names, Klipper
  config section names (`[mmu_espooler unit0]`), and Klipper's own API calls
  a reader would write themselves to extend Happy Hare in Python
  (`printer.send_event(...)`, `printer.register_event_handler(...)`) are NOT
  developer references — those are exactly what the reader types/edits, keep
  them. The Developer Guide (§12) is the one place all of the above is
  fair game, by design.
- **No leading "everything below was read from..." provenance paragraph** —
  dropped from `Feature-Espooler.md`; reads like an internal QA note, not
  content for the reader. The verification habit itself doesn't change (see
  the counts/no-narrative bullets above) — it just doesn't need to announce
  itself on the page. Start Feature pages directly at `## Concept`.
- **Pin aliases don't exist in v4** — `mmu_hardware.cfg` pin values are
  fully-specified `unit_mcu_name:pin_name` strings (e.g. `unit0:PA0`) filled
  in directly from the menuconfig prompt; there is no separate alias
  indirection layer in `mmu.cfg` the way the v3 wiki described. Don't port
  the wiki's "define aliases in mmu.cfg" pattern into any new config example.
- **"Filament (catchment) buffer" and "sync-feedback buffer" are two
  different Kconfig options** (`MMU_HAS_FILAMENT_BUFFER` /
  `Kconfig.filament_buffer` vs `MMU_HAS_SYNC_FEEDBACK_BUFFER` /
  `Kconfig.sync_feedback_buffer`) — don't conflate them into "sync-feedback
  filament buffer". `Feature-Espooler.md` and `Reference-Printer-Variables.md`
  (`filament_buffer` field) both had this wrong; fixed 2026-08-06. The
  catchment buffer catches loose filament on rewind for faster loading
  speeds; sync feedback is the tension/compression buffer feeding FlowGuard
  and tangle prevention. Espooler only ever overlapped with the *catchment*
  buffer specifically, never sync feedback — **but as of the 2026-08-08
  menuconfig cleanup (item 56), that overlap is no longer software-enforced
  as a general rule.** `Kconfig.espooler`'s own
  `select UNSELECT_MMU_HAS_FILAMENT_BUFFER` (forced off when eSpooler is
  chosen) is gone; Box Turtle and BTT ViViD each hardcode their own fixed
  choice directly in their `mmu_types/Kconfig.*` instead (Box Turtle: buffer
  always off, since it ships as an eSpooler design; ViViD: both off). Every
  other MMU type can now enable both independently in menuconfig. Don't
  reintroduce "mutually exclusive" as a blanket claim on any page — verify
  per type against source if it matters.
- **The ASCII-art logo and copyright line live in the real theme footer bar,
  not the article body** (moved there 2026-08-07, see item 41 for the full
  history — originally an in-article `.hh-footer` block per page, added
  2026-08-06). The copyright line is now just `copyright:` in `mkdocs.yml`
  (Zensical's own `partials/copyright.html` renders it directly above "Made
  with Zensical", same font, for free); the ASCII art is injected by
  `hh-page-nav.js` into `.md-footer-meta__inner` between `.md-copyright` and
  `.md-social`, since that bar's markup comes from Zensical's vendored
  templates and can't be edited directly (no `overrides/` dir in this repo).
  Every page's trailing markdown is now just `---` (still renders the `<hr>`
  the Previous/Next band sits under) with nothing after it — no more
  hand-written or generated footer block to keep in sync across `doc/*.md`
  and `doc_tools/gen_command_reference.py`'s `render_page()`.
- **H2 sections get a tri-colour marker + underline site-wide**, via
  `doc/assets/stylesheets/extra.css` (`.md-typeset h2::before` + border) —
  the CSS-template equivalent of the wiki's per-heading
  `![#f03c15]![#c5f015]![#1589F0]` square images, applied automatically to
  every page (present and future) rather than per-page markup. Added
  2026-08-06 on request ("liked the visual color icons... helps provide
  visual separation").
- **Article images have rounded corners and a subtle shadow site-wide**, via
  `doc/assets/stylesheets/extra.css` (`.md-typeset img:not(.no-floating)`) —
  screenshots and illustrations float by default without affecting theme chrome
  such as the header logo or footer art. Add `class="no-floating"` to opt out;
  the home page's `index/universal_mmu_driver.png` hero is the deliberate
  exception. Slate mode uses a directional light shadow against its dark page
  background. Added 2026-08-26; opt-out scope clarified 2026-08-27.
- **Reuse a wiki diagram even if its labels are stale — but only if it's an
  editable diagram, not a screenshot of real output.** Added 2026-08-06 after
  the user pushed back on `Conceptual-MMU.md` skipping the wiki's images
  entirely: a labeled mechanism drawing (`typeA_mmu.png` etc.) still shows a
  true concept even with renamed sensor labels, and gets a corrective
  caption/tip instead of being dropped. A live Mainsail/console screenshot of
  actual sensor names (`filament_sensors.png`, `endstops.png`,
  `mmu_sensors.png`) is different — that's *real output*, and republishing it
  with old names presents something a v4 reader would never actually see, no
  caption fixes that. Skipped those three specifically, flagged why rather
  than silently dropping them.
- **Previous/Next page footer nav, Discord icon, taller header with a bigger
  logo + tagline, smaller footer ASCII-art font** — all added 2026-08-06,
  site-wide via `doc/assets/stylesheets/extra.css` +
  `doc/assets/javascripts/hh-page-nav.js` + `mkdocs.yml`'s `extra.social`.
  Two non-obvious findings if touching any of this again:
  - Zensical renders **no** prev/next footer nav at all (no
    `.md-footer__link` markup on any page, checked directly) — this isn't a
    missing config flag, it's just not implemented. `hh-page-nav.js`
    computes it client-side instead, by reading the already-rendered primary
    sidebar (which lists every real page in nav order already, mixed with
    the current page's own on-page anchors — filtering out any `href`
    containing `#` leaves exactly the flat page list, so there's no second
    copy of the nav order to keep in sync with `mkdocs.yml`). Must run on
    `document$.subscribe(...)`, not `DOMContentLoaded` — `navigation.instant`
    swaps page content via `history.pushState` after the first load, and a
    plain load-event listener never fires again after that.
  - `.md-header__title`/`.md-header__ellipsis`/`.md-header__topic` have a
    hard-coded height that's load-bearing for Material's site-name → page
    -title slide-swap-on-scroll animation — making that box itself taller
    (e.g. via a naive `::after` tagline with `display:block`) doesn't grow
    it, the extra content just overflows past `.md-header`'s own background
    and appears to spill onto the page below. The tagline is instead
    `position:absolute; top:100%` off the site-name topic specifically
    (`position:relative` added there as the anchor), so it floats below
    without affecting that box's own height/animation at all;
    `.md-header__inner` separately gets a plain `min-height` bump so there's
    header background for it to float onto.
- **The primary-sidebar "Happy Hare v4" title links to the home page**
  (added 2026-08-28) — Zensical only links the adjacent logo by default and
  emits the site-name text as a bare text node. `hh-page-nav.js` wraps that
  text in an anchor using the logo's own site-root URL on every
  `document$` update, so it continues to work with `navigation.instant` and
  does not require a vendored-template override. `extra.css` preserves the
  theme's title styling and adds the normal accent hover/focus affordance.
- **Don't drop wiki illustrations, admonitions, or worked examples without a
  specific reason** (added 2026-08-06) — the first `Feature-Espooler.md` draft
  over-compressed the ported wiki content (dropped the UI screenshots, the
  TIP/IMPORTANT callouts, and a worked numeric example) in the name of
  brevity, and the user pushed back hard. Default to carrying forward
  everything in the source wiki page that's still accurate; the bar for
  cutting something is "this is actively wrong/superseded," not "this feels
  long." See **Before finishing a Feature page** below for the process this
  produced.
- **Admonitions:** GitHub's `[!NOTE]`/`[!TIP]`/`[!IMPORTANT]`/`[!WARNING]`
  syntax doesn't work here (not enabled) — use the base `admonition` extension's
  `!!! type "Title"` instead. Material's shipped CSS only actually styles a
  fixed class list: `note`, `tip`, `info`, `success`, `question`, `warning`,
  `danger`, `bug`, `example`, `quote`, `abstract`, `failure` — `!!! important`
  renders with NO icon or colour (silently, no build warning) because
  "important" isn't one of them. Use `!!! warning "Important"` to get a
  styled callout with the original label preserved.
- **Code blocks are colourised** (added 2026-08-06) with SuperFences emitting
  `codehilite` wrappers, plus the base `codehilite` extension for traditional
  indented blocks. The site deliberately does not use Material's normal
  `pymdownx.highlight` wrappers; see **Zensical rough edges** below. Practical
  effect for page-writing: fence
  `.cfg`-style config examples with `` ```ini `` and gcode command
  examples/lists with `` ```text `` (confirmed 2026-08-13 against every real
  Feature page already on the site — an earlier note here said ` ```yaml `
  for both, which was never actually followed and has been corrected). For a
  block that's literal console/printer output specifically (not a command
  you'd type, but what comes back), add the `console-output` class -
  `` ```{.text .console-output} `` - which `extra.css` renders in a distinct
  terminal-green instead of the default text colour, so real output reads
  differently at a glance from a command example or a `.cfg` block. To join a
  command and its returned output into one visual container while preserving
  those colours, put `` ```{.text .console-command} `` immediately before the
  `console-output` fence; the stylesheet joins their touching edges.
  `pymdownx.superfences` is the sole backtick-fence processor so fences work
  inside admonitions, lists, and tabs. Do not also enable `fenced_code`: both
  extensions register the same internal processor name and SuperFences does
  not support loading them together. SuperFences' `css_class` is pinned to
  `codehilite`; the separate `codehilite` extension remains enabled for
  traditional indented/`:::lang` blocks, and `extra.css` also styles
  `.highlight` defensively for stale generated HTML.
- **"Macros" is its own top-level nav section** (added 2026-08-08, item 51),
  distinct from "Advanced Customization" — the latter is the expert-level
  internal-logic-replacement mechanism (`Custom-Load-Unload-Sequences.md`),
  while "Macros" is the far more commonly-touched layer of tuning/extending
  the gcode macros Happy Hare ships with, one page per `mmu_macro_vars.cfg`
  macro group. Placed right after Features and before Advanced Customization
  in `mkdocs.yml`'s nav (this table's own §-numbering doesn't track nav
  position — see §10a Advanced Customization's own precedent — so it's
  numbered §10b here, immediately after §10a, rather than renumbered into
  its actual nav position).

## Macro page template

Every page under §10b Macros uses a lighter, fixed structure (distinct from
the Feature page template below) — added 2026-08-08 per explicit request,
item 51:

1. What it does — concept, kept brief; a full Feature page's Concept
   section is the place for hardware/workflow depth if one exists for this
   macro group (cross-link it, don't duplicate it).
2. Where it's applied — which real macro/command this configures, and how
   it's wired in (automatically, or via a `user_*_extension`/`*_macro`
   hook you set yourself).
3. Configuration — the real menuconfig screenshot (**Macro Variables →
   <menu>**, from a `doc_tools/shots.py` session; toggle the owning
   capability first if the macro group is gated), plus only the handful of
   settings worth calling out specifically. The full variable-by-variable
   table always lives on `Reference-Macro-Vars.md` — never re-tabulate it here.
4. See also.

Screenshot note: three of these nine screens are gated behind a capability
that isn't the boxturtle seed default (`MMU_HAS_TOOLHEAD_CUTTER`,
`MMU_HAS_SERVO_CUTTER`, `MMU_HAS_BLOBIFIER`) — same "toggle it on in the
scene, same pattern as `_feature_environment_manager`/`_feature_nfc`"
approach already established for Feature pages, just applied here too.

## Feature page template

Every page under §5 Features uses this fixed section order (revised
2026-08-06 after the `Feature-Espooler.md` review — see the decisions above
and **Before finishing a Feature page** below):

1. Concept — illustrate it if the wiki did; don't drop a diagram/screenshot
   without a specific reason.
2. Hardware Setup — wiring table + `mmu_hardware.cfg` (and the relevant
   `mmu.cfg` pin-alias block if there is one). Include a real menuconfig
   screenshot for the hardware-facing prompts if one is easy to capture
   (`doc_tools/shots.py`, one session per feature page, `outdir` matching the
   page name) — readers care what they type into menuconfig and what comes
   out in `.cfg`, not the raw `Kconfig.*` source, which is why there's no
   separate "menuconfig" section any more (dropped from the original 9).
3. Parameter Setup — `mmu_parameters.cfg` (and `mmu.cfg` where a feature has
   settings there instead/also). Keep worked numeric examples from the wiki,
   don't compress them to one line.
4. Commands (linked to Command Reference anchors)
5. Printer variables exposed — include a UI subsection with real
   screenshots/illustrations if the feature has any visible representation in
   KlipperScreen/Mainsail/Fluidd.
6. Tuning — practical "how do I get this working" recipes belong here if the
   wiki had step-by-step setup walkthroughs for sub-modes; don't lose them
   just because there's no dedicated template slot for them.
7. Troubleshooting
8. See also

### Before finishing a Feature page

Before considering any Feature page (or any ported page) done, per explicit
request: **proofread it against its wiki source section-by-section**, then
report back what didn't carry forward and why — even content you're
confident was right to cut. The user reviews that list and can restore
anything. Don't silently decide something wasn't worth keeping.

---

### 0. Home

| Page | Source | Status |
|---|---|---|
| `index.md` (Home) | `README.md` + `wiki/Home.md` | **done (v2)** — see item 34 below for the full rewrite. v1's "card grid needs a new entry every time a section gains its first page" rule is retired: v2's card grid is one card per top-level nav section rather than one per page-that-happened-to-be-first, and doesn't need touching again as pages are added within an existing section — only when a genuinely new section is added, as happened when `Advanced Customization` landed, again when `Slicer & Toolchange`/`Operation` landed, and again when `Calibration` landed (item 57) (11 cards now: Getting Started, Calibration, Concepts, Features, Macros, Advanced Customization, Slicer & Toolchange, Operation, Tuning, Reference, Developer Guide - this note's own count had already drifted stale before item 57, missing Macros/Tuning, which were added without updating it; corrected here too). |

### 1. Getting Started

| Page | Source | Status |
|---|---|---|
| `Installation.md` | `wiki/Installation.md` | **done** — code-verified against the real `install.sh` (flags, usage text) and `installer/build.py`/`Kconfig.options`. Slots in before the per-type Getting Started pages, deliberately scoped to what those pages *don't* cover: cloning, the real flag reference, client macros, upgrading. Dropped the entire v3 sequential-Q&A "Creating Base Klipper Config" walkthrough (10+ screenshots) - v4 replaced that flow with `menuconfig` entirely, already covered per-type by the two `GettingStarted-*.md` pages; reusing those stale screenshots of a flow that no longer exists would have been wrong. Also dropped the nonfunctional `-r` (Repetier-Server) flag - commented out/TODO in real `install.sh`, doesn't work; corrected the client-macros mechanism from "hand-edit `printer.cfg`" to the real `menuconfig` yes/no prompt (`INSTALL_CLIENT_MACROS`); dropped the `z_hop_height_error`/`z_hop_speed` pause-mechanics paragraph since that setting doesn't exist in v4 (see item 48's `Operation.md` finding on unified parking) - deferred to `Operation.md` instead. |
| `Hardware-Validation.md` | `wiki/Hardware-Configuration.md` + `wiki/Movement-and-Homing.md` | **done** — shared post-install checklist covering MCU connectivity, every filament switch, gear direction, mechanism-specific selector checks, encoder/eSpooler/sync-feedback options, plus the current named-endstop and coordinated-motor model. Stale pin-alias and old motor-name examples were replaced with the v4 interfaces and links to the deeper Feature/Calibration pages. |
| `GettingStarted-BoxTurtle.md` | existing `doc/` page | **done**, incl. a "Picking a toolhead" step (shared toolhead/extruder geometry database, optional, reduces calibration) with two real screenshots |
| `GettingStarted-ViViD.md` | new, from `installer/mmu_types/Kconfig.vvd` + `installer/boards/custom/Kconfig.vvd` + `installer/connection/Kconfig.{mmu_mcu,buffer_mcu}` | **done** - second Getting Started page, with a real `getting-started-vivid` `doc_tools/shots.py` session (7 screenshots) for every screen except the two live serial-device-list screens (see session log for why those stay text). Covers the two-separate-MCU serial selection unique to this design, otherwise a lighter walkthrough than Box Turtle's since almost everything defaults correctly for this fully-specified design. |
| `GettingStarted-MMX.md` | new, from the v4 MMX/EBB42 menuconfig profiles plus the CN3D MMX installation and wiring guides | **done** - walks the original four-gate servo-cam MMX through the real v4 menus with seven reproducible screenshots. Corrects the external guide's alias-based manual configuration: the EBB42 profile fills fully qualified pins directly, the four PB7/PB5/PB6/PB8 switches are entry sensors, and PB4 is enabled as the shared exit/gate-homing sensor rather than treated as a toolhead sensor. Documents automatic timestamped backup recovery with `--prev` and, by explicit request, the clean uninstall/copy-`mmu.V3`/`-b v3` return path. |
| `MMU-Types-Overview.md` (comparison table: all 15 Kconfig types, selector class, gate count, status) | new, from `installer/Kconfig.mmu_types/*` | new |
| `Upgrading-from-v3.md` | `wiki/Upgrade-Notice.md`, `wiki/Change-Log.md` | rewrite for v4 |
| `GettingStarted-3MS.md` | `wiki/Quick-Start-3MS.md` | new — found during the 2026-08-07 wiki-gap audit (item 47 below), not previously on this table at all. Same genre as the two `GettingStarted-*.md` pages above (real menuconfig screenshots via `doc_tools/shots.py`, not a port of the wiki's raw command transcript). |
| `GettingStarted-QuattroBox.md` | `wiki/Quick-Start-QuattroBox.md` | new — same finding/genre as 3MS above. |
| `GettingStarted-Multi-Unit.md` | current installer multi-unit workflow | **initial draft** — conversion from a working single unit, shared and per-unit menuconfig passes, symbolic/display names, dissimilar unit types, shared encoder/buffer, bypass association, global gate/tool numbering, `UNIT=` command targeting, generated per-unit files, and reconfiguration; includes five reproducible menuconfig screenshots plus the three-unit Mainsail panel. |

### 2. Concepts

| Page | Source | Status |
|---|---|---|
| `Conceptual-MMU.md` | `wiki/Conceptual-MMU.md` | **done (v2)** — rewritten around the real v4 selector hierarchy (three research passes: sensor renames, vendor→selector mapping, combiner/EndlessSpool verification — see session log); vendor table extended well past the old wiki's ERCF/Tradrack/Box-Turtle set. v1 swapped the wiki's Type-A/B/C diagrams for ASCII to avoid their stale "pre-gate"/"gate" labels; v2 restored the real diagrams (`typeA/B/C_mmu.png`, `default_ercf/tradrack/box_turtle.png`) per user request, with a correction tip instead — kept skipping the three live sensor-list screenshots (`filament_sensors.png`, `endstops.png`, `mmu_sensors.png`), which show real old output rather than an editable diagram |
| `Understanding-Operation.md` | `wiki/Understanding-Operation.md` | ⚠️ verify |
| `Print-Job-State-Machine.md` | `wiki/Print-Job-State-Machine.md` | ⚠️ verify against `mmu_print_state_machine.py` |

### 3. Configuration

| Page | Source | Status |
|---|---|---|
| `Hardware-Configuration.md` | `wiki/Hardware-Configuration.md` | ⚠️ verify |
| `Movement-and-Homing.md` | `wiki/Movement-and-Homing.md` | ⚠️ verify |
| `Macro-Configuration.md` | `wiki/Macro-Configuration.md` | ⚠️ verify |
| `Configuring-mmu.cfg.md` | `config/base/mmu.cfg` | **generated** |
| `Configuring-mmu_hardware.cfg.md` | `config/base/mmu_hardware.cfg` | **generated** |
| `Configuring-mmu_parameters.cfg.md` | `config/base/mmu_parameters.cfg` | **generated** |
| `Configuring-mmu_macro_vars.cfg.md` | `config/base/mmu_macro_vars.cfg` | **generated** |

### 4. Calibration

Superseded the original Type-A/Type-B-split plan below (item 57) - split by
calibration *step* instead, per explicit request, since which command
applies is a hardware question (selector mechanism, encoder fitted, etc.),
not strictly a selector-class one, and per-step pages let a step's own
mandatory/recommended/optional status and autotune settings live right next
to its procedure instead of being repeated across two class-based pages.

| Page | Source | Status |
|---|---|---|
| `Calibration.md` (landing/overview) | `wiki/MMU-Calibration.md` + `installer/Kconfig.calibration` + `installer/mmu_types/*` | **done** — Type-A/B/C applicability, the 5 autotune/auto-cal settings with real empirically-resolved per-type defaults, mandatory/recommended/optional framing, calibration order/cascade (`hh-mermaid` diagram), `SAVE=0` convention, calibration-storage (`mmu_vars.cfg`) table |
| `Calibration-Selector.md` | `wiki/MMU-Calibration-TypeA.md` (selector/servo steps) | **done** — one combined page (by explicit request) for all 4 selector-calibration commands (`MMU_CALIBRATE_SELECTOR`/`_SERVO_SELECTOR`/`_ROTARY_SELECTOR`/`_SELECTOR_INDEXES`) plus `MMU_SERVO`; ported the three servo position photos from `wiki/MMU-Calibration-TypeA/` |
| `Calibration-Gear.md` | `wiki/MMU-Calibration-TypeA.md` + `-TypeB.md` (gear/gates steps) | **done** — `MMU_CALIBRATE_GEAR` + `MMU_CALIBRATE_GATE`/legacy `MMU_CALIBRATE_GATES` alias together (same underlying parameter, different granularity) |
| `Calibration-Encoder.md` | `wiki/MMU-Calibration-TypeA.md`/`-TypeB.md` (encoder step) | **done** — cross-links to `Feature-Encoder.md` rather than duplicating wiring/troubleshooting content already there |
| `Calibration-Bowden.md` | `wiki/MMU-Calibration-TypeA.md`/`-TypeB.md` (bowden step) | **done** — all three real strategies (sensor "BEST", encoder-collision, `MANUAL=1`); no MMU type ships a Kconfig default for this at all |
| `Calibration-Toolhead.md` | new | **done** — deliberately short: requirement/skip-logic only, links to `Blobbing-and-Stringing.md#calibrating-the-toolhead` for the real procedure rather than moving it (that page's own mermaid diagram and "Summary of Tuning Steps" are built around it staying there) |
| `MMU_CALIBRATE_PSENSOR` | — | **not moved** — stays on `Feature-Sync-Feedback-Buffer.md` (already covered per item 53); cross-linked from `Calibration.md` instead, since it's gated behind an optional feature toggle rather than being universal or MMU-type-driven |

### 5. Features — all 18 pages done

| Feature page | Kconfig source | Wiki source | Status |
|---|---|---|---|
| `Feature-Espooler.md` | `Kconfig.espooler` | `wiki/Espooler-Support.md` | **done (v3)** — first page written against the template (see below); code-verified against `mmu_espooler.py`, `mmu_filament_movement.py`'s `_wrap_espooler()`, and `mmu_unit_parameters.py`. v1 over-compressed the ported wiki content; v2 restored the UI screenshots, TIP/IMPORTANT callouts, the `espooler_speed_exponent` worked example, and the per-mode setup walkthroughs, added a real `doc_tools/shots.py` session for the eSpooler pins menuconfig screen; v3 dropped the leading provenance paragraph, all developer-jargon (class/method names), the (nonexistent in v4) pin-alias example, and fixed "sync-feedback" → "filament (catchment)" buffer naming — see the decisions above and the session log |
| `Feature-Encoder.md` | `Kconfig.encoder` | `wiki/Clog-Runout-EndlessSpool.md` (Optional Encoder + Clog Detection + Flowrate Monitoring sections only) | **done** - code-verified against `unit/mmu_encoder.py`, `commands/mmu_encoder.py`, `mmu_constants.py`'s `ENCODER_*`/`VARS_MMU_ENCODER_*` constants, and the `[mmu_encoder]`/`gate_endstop_to_encoder`/bowden-verification blocks in `config/base/*.cfg`. Reused `wiki/Synchronized-Gear-Extruder/Encoder_Meter.png` (an annotated FlowGuard-meter diagram, already carrying v4's real `flowguard_encoder_max_motion` param name) as the UI illustration. See the session log for what got routed to other pages and what was corrected. |
| `Feature-Sync-Feedback-Buffer.md` | `Kconfig.sync_feedback_buffer`, `Kconfig.motor_sync` | `wiki/Synchronized-Gear-Extruder.md` (Synchronized Gear/Extruder + Sync-Feedback Buffer Sensors + AutoTuner sections only — the FlowGuard clog/tangle/telemetry sections stayed off this page, see the session log) | **done** — code-verified against the real `[mmu_buffer <unit_name>]`/`mmu_parameters.cfg` keys and the live `MMU Features / Additions → Buffer config` / `Other Settings → MMU/Extruder sync` menuconfig screens (real screenshots, `feature-sync-feedback-buffer` session, boxturtle seed). Reused `Typical_Buffer.png` (with a corrective note for its stale pin names) and `Sync_Feedback_Meter.png`/two small UI-icon images from the wiki; skipped the FlowGuard telemetry/simulation images as out of scope for this page. **Updated 2026-08-08 (item 53)**: a full re-review against the wiki source found the AutoTune Two-Level/EKF algorithm explanation, the buffer-dimension diagrams, and the full `MMU_CALIBRATE_PSENSOR` workflow were still missing — all added, see item 53 below. |
| `Feature-Spoolman.md` | — (software integration, no Kconfig) | `wiki/Spoolman-Support.md` | **done** — split off the originally-planned single `Feature-NFC-Spoolman.md` into two pages (this one + `Feature-NFC.md` below), per explicit request; the two cross-reference heavily in both directions. Code-verified against `mmu_controller.py`'s `_spoolman_*` methods, `mmu_server.py` (Moonraker component), and `mmu_gate_maps.py`'s `gate_map_to_string()`. Corrected several stale wiki details: the console gate-map status labels are `On spool`/`Buffered`/`Empty`/`Unknown` (not `Spool`/`Buffer`) and the field is `Id:` not `SpoolId:`; `pending_spool_id_timeout` is actually `spoolman_pending_id_timeout`, living in `mmu.cfg` not `mmu_parameters.cfg`; the Spoolman-version requirement (0.18.1+) applies to every mode above `off`, not just push/pull (confirmed in `mmu_server.py` — `readonly` needs it too, since the same extra-fields gate blocks it); and Spoolman now has a third extra field, `RFID` (alongside `Printer Name`/`MMU Gate`), not in the wiki at all. Re-introduced the wiki's Mermaid sequence diagrams under Tuning (split `off`/`readonly`/`push`/`pull` into 6 diagrams total) via raw `<pre class="mermaid">` HTML rather than a ` ```mermaid ` fence — see item 33 below for the mechanism and its verification status. Reused all 6 of the wiki's Spoolman-UI screenshots as-is (verified each against current field names/labels — none were stale, unlike the sensor-name screenshots skipped elsewhere) plus the RFID/QR "auto-setting" workflow, generalized (see `Feature-NFC.md`'s split below). **Updated 2026-08-08 (item 55)**: v4 split tag/UID registration out of `MMU_SPOOLMAN` into a new `MMU_SPOOLMAN_TAG` command — every `RFID=`/`APPEND=` example moved into its own new subsection on this page, and the new `REGISTER=1` mode (bind a gate's already-scanned-but-unresolved UID onto a spool created after the fact) documented for the first time, with a full worked example. |
| `Feature-NFC.md` | `Kconfig.nfc_reader` | new (no v3 wiki page — the closest wiki content, RFID/QR tag auto-setting, was folded into `Feature-Spoolman.md`'s generic-external-reader workflow instead; NFC hardware readers, `MMU_NFC`/`MMU_NFC_SCAN`, and Spoolman auto-create are all new in v4) | **done** — the reader/hardware half of the original combined plan, cross-referencing `Feature-Spoolman.md` heavily both ways. Code-verified against `unit/mmu_nfc_manager.py`, `unit/nfc/mmu_nfc_reader.py` and `mmu_nfc_endstop.py`, `commands/mmu_nfc.py`/`mmu_nfc_scan.py`, and the `_preload_gate()`/`_home_to_gate_with_nfc()` integration in `mmu_filament_movement.py`. Marked **beta** on the page itself, matching the Kconfig's own `[[B]](BETA)[[/B]]` tag — and specifically flagged the per-gate homing-endstop path (used automatically by `MMU_PRELOAD`) as confirmed on RC522 only, per a "PROTOTYPE" comment in `mmu_nfc_endstop.py` saying PN532/PN7160 still need bench verification. No wiki content was actually stale here since none existed to be stale — this is genuinely new v4 surface, not a port. **Updated 2026-08-08 (item 55)**: enriched the Shared reader workflow with the real LED overlay behaviour (`effect_pending_spoolid`/`_expiring`, confirmed against `mmu_controller.py`/`mmu_hardware.cfg` directly) and added a new "Registering an unresolved tag after the fact" workflow for `MMU_SPOOLMAN_TAG ... REGISTER=1`, plus updated every `MMU_SPOOLMAN`+RFID reference to the new `MMU_SPOOLMAN_TAG` command. Item 33 later added the ERCF shared-reader menuconfig screenshot this row's "no screenshot" note used to describe — that note itself was left stale until item 63 below removed it. **Updated 2026-08-13 (item 63)**: restored hardware/tuning detail trimmed from the shipped `.cfg` template comments (PN532-over-UART wiring/mode-pads, software-I2C pull-ups) and added a new "Noisy neighbors" section (`nfc_neighbor_check`/`nfc_field_probe_reads`/`nfc_neighbor_evict_distance`) documenting the per-gate RF-field-overlap mitigation from Happy-Hare PR #1061 (open, not yet merged) — code-verified against that PR's diff directly (exact defaults, W17 config warning, forward-jog/`mmu_exit` constraint), not guessed from the trimmed comments alone. |
| `Feature-LEDs.md` | `Kconfig.leds` | `wiki/Led-Support.md` | **done** — code-verified against `unit/mmu_leds.py`, `mmu_led_manager.py` (the real print-state/action → effect state machine), `commands/mmu_led.py`/`mmu_set_led.py`. Corrected several stale wiki details: named-effect definitions live in `mmu.cfg`, not a `mmu_leds.cfg` file (doesn't exist); several effect names/durations changed (`mmu_white_fast`→`mmu_breathing_white_fast`, `mmu_strobe`→`mmu_red_strobe`, `effect_heating`/`effect_checking` point at different named effects now, `complete`/`error`/`initialized` durations are 10s/10s/8s not the wiki's 20s/20s/3s); `MMU_LED`'s real status report has no "Default " prefix; `MMU_SET_LED` (temporary per-gate override, distinct from `MMU_LED`'s persistent defaults) is a whole new command not in the wiki. The wiki's "Filament Loaded → Status: Dim Blue" row doesn't correspond to any real code path — the status LED's `filament_color` default just shows the actual loaded colour — dropped rather than ported. Real menuconfig screenshots (`feature-leds` session, boxturtle seed, LEDs enabled by default so no scene setup needed) — found the Neopixel pin prompt actually appears in *two* places (bottom of "Led config" itself, and again on the flat top-level "Pins / TMC" screen), not only the second as initially assumed; confirmed by capturing both. Skipped `wiki/Led-Support/led_configuration.png` - it uses fabricated key names not matching any shipped v4 syntax (the wiki page's own inline `<!-- TODO: Update pic -->` comment already flagged it as stale); kept `led_connection.jpg` (generic, no baked-in stale terminology). |
| `Feature-Endless-Spool-Runout.md` | (no dedicated Kconfig — sensor-driven) | `wiki/Clog-Runout-EndlessSpool.md` (Runout Detection + EndlessSpool + Designated Waste Gate sections only — the Optional Encoder/Clog Detection/Flowrate Monitoring sections went to `Feature-Encoder.md` instead) | **done** — code-verified against the runout/clog-vs-tangle decision logic, the EndlessSpool group-cycling and eject-gate handling, and the real `mmu.cfg`/`Kconfig.options` settings. Real menuconfig screenshot (`feature-endless-spool-runout` session, boxturtle seed, no scene setup needed since this section isn't MMU-type-specific). See the session log for what got corrected from the wiki. |
| `Feature-Gate-TTG-Maps.md` | — (pure software logic; `Kconfig.gates` is unrelated — physical gate homing/parking distances, not the gate/TTG map) | `wiki/Tool-and-Gate-Maps.md` | **done** — code-verified against `mmu_gate_maps.py`'s `gate_map_to_string()`/`ttg_map_to_string()`/`automap_gate()`. Real, significant bug found: **`MMU_REMAP_TTG`, used throughout the wiki, does not exist as a working command in v4** — the real name is `MMU_TTG_MAP` (`MMU_REMAP_TTG` only survives as descriptive text inside that command's own `HELP_BRIEF`, not a registered alias). Also found: the wiki's plain-vs-Spoolman gate-map console formats are actually the same function with the same status words either way (only the `Id:` field differs, not the whole layout); `MMU_TTG_MAP`'s real output is a single tool-centric block, not the wiki's combined tool+reversed-gate-block sample; `AUTOMAP=name` is invalid, the real value is `AUTOMAP=filament_name`; automap on multiple matches logs a warning and keeps the last match rather than auto-creating an EndlessSpool group as a stray wiki HTML comment claimed; default-list config keys (`default_gate_status`, `default_ttg_map`, etc.) live in `mmu.cfg`'s `[mmu_parameters]` section, not in the file literally named `mmu_parameters.cfg` as the wiki says. Reused three wiki images as-is (`visual_ttg.png`, and the KlipperScreen/Mainsail TTG-editor screenshots — none had stale field names). Added a real menuconfig screenshot for automap strategy/reset-TTG (`feature-gate-ttg-maps` session, boxturtle seed, no setup needed — generic macro-variable screen). |
| `Feature-Statistics-Counters.md` | — | `wiki/Statistics-and-Consumption-Counters.md` | **done** — code-verified against `commands/mmu_stats.py`'s real formatting code. Found and fixed a real bug: `MMU_STATS RESET=1`'s own help text says "Reset all statistics and counters" but it never touches consumption counters — only `MMU_STATS COUNTER=<name> RESET=1` does; flagged as a plain behavioural fact on the page rather than repeating the misleading help text. Also found: a brand-new counter's first `INCR=1` doesn't apply the increment (only creates it at 0) — the real usable sequence is LIMIT=/WARNING= setup, then increment, not increment-then-setup as the wiki's ordering implied; the real crossing-the-limit warning is two separate log lines, not the wiki's single combined line; gate-statistics line format has no `#` prefix (`0:😎` not `#0: 😎`); swap/gate-stat *display* settings (`console_stat_columns` etc.) live in `mmu.cfg`'s `[mmu_parameters]` section, not the file literally named `mmu_parameters.cfg`. No printer variables exist for any of this — console/log only, stated plainly. Skipped both wiki images (`gate_statistics.png`, `perfect.jpg` — real console-output screenshots with a stale table shape) in favour of a hand-written, code-verified text block, same treatment `Feature-Espooler.md` used for its console example. |
| `Feature-State-Persistence.md` | — | `wiki/State-Persistence.md` | **done** — code-verified against the real `[save_variables]`/startup-validation mechanism and `mmu_reset`/`mmu_recover`/`mmu_check_gate` commands. Corrected: `home_on_startup` doesn't exist under that name — the real parameter is `startup_home_selector`, gated to selector types that actually need homing; `MMU_RESET` requires `CONFIRM=1` (not in the wiki at all); the reset-defaults block (`default_gate_status`, `default_ttg_map`, `default_endless_spool_groups`, etc.) lives in `mmu.cfg`, not the file literally named `mmu_parameters.cfg`. Replaced the wiki's single-unit startup-status transcript with a fresh example reflecting v4's real grid shape (a `Unit :` header row above `Gate :`, and a `W` waste-gate marker — both added for multi-unit support that didn't exist when the wiki was written). Added a `startup_reset_ttg_map` mention (new, not in wiki) and clarified `MMU_DUMP_VARS` (live status) vs. this page's persisted-file mechanism are two different things, easy to conflate. No images existed on the wiki source to evaluate. |
| `Feature-Filament-Bypass.md` | `Kconfig.bypass` | `wiki/Filament-Bypass.md` | **done** — code-verified against every selector class's `has_bypass()` (only Linear-family and Servo selectors can genuinely move to a bypass position; Indexed/Rotary/Virtual selectors never can — bypass there is pure software state). Corrected: `bypass_autoload` lives in `mmu.cfg`, not `mmu_parameters.cfg`; the persisted variable is `mmu_selector_bypass_offset`, not the wiki's `mmu_selector_bypass`; `BOOL_HAS_BYPASS` ("Associate bypass with this unit?") is a **UI-rendering choice** (inline vs. separate panel in Mainsail/Fluidd), not "does this unit have a bypass" — confirmed by walking the real Kconfig node tree, since the prompt turned out to live under **MMU Type → &lt;type&gt; → Design attributes**, not a general advanced-settings screen as first assumed (fixed after the first capture attempt failed). Reused the wiki's `mmu_unit_ercf_bypass.png`/`mmu_unit_ercf_no_bypass.png` (from `wiki/Change-Log/`, not this page's own folder) as a genuine before/after pair for that UI-rendering distinction — a new use of the reuse rule, since no prior Feature page needed a "same feature, two UI layouts" illustration. Real menuconfig screenshot (`feature-filament-bypass` session, boxturtle seed). |
| `Feature-Gcode-Preprocessing.md` | — | `wiki/Gcode-Preprocessing.md` | **done** — code-verified against `mmu_server.py`'s real Moonraker metadata-processor mechanism. Corrected a real logic bug the wiki's own worked example relied on: `!referenced_tools!` substitutes literal `"0"` on a single-colour print, never an empty string, so the wiki's `{% elif REFERENCED_TOOLS == "" %}` branch is unreachable — fixed the worked example to rely only on the `INITIAL_TOOL` fallback instead of a dead branch. Also found: preprocessing only fires for `.gcode` uploads from one of four recognised slicers (PrusaSlicer/SuperSlicer/OrcaSlicer/BambuStudio); an already-processed file is skipped on re-upload (fingerprint-based); `!total_toolchanges!`'s "excluding the initial tool" claim isn't backed by the code, softened to a plain count; `gate_color_rbg` was a typo for `gate_color_rgb`; and the preprocessor also injects `_MMU_STEP_SET_ACTION STATE=12`/`RESTORE=1` around the slicer's own wipe-tower routine (so the live status correctly shows `Purging` there too) — not in the wiki at all. Deviated from the template: retitled "Hardware Setup" to "Moonraker Setup" (no physical hardware, same reasoning as `Feature-Spoolman.md`) and kept "Supported Placeholders" as its own section between Parameter Setup and Commands, since the placeholder table doesn't fit cleanly into either standard slot — flagged here rather than silently decided, same as the Spoolman precedent. No images existed on the wiki source. |
| `Feature-Environment-Manager.md` | `Kconfig.environment_sensor`, `Kconfig.heater` | `wiki/Environment-Manager.md` | **done** — the wiki page's own scope is the heater/drying manager (the sensor is just its temperature/humidity input), so this page covers both Kconfigs rather than splitting sensor-only content out; confirmed both are sourced under the same **MMU Features / Additions** menu. Code-verified against `unit/mmu_environment_manager.py` and `commands/mmu_heater.py`. Corrected several stale wiki details: the real default humidity key is `heater_default_dry_humidity`, not `heater_default_humidity`; `heater_max_temp` ships as `65`, not the wiki's example `70`; spool rotation reuses the espooler's *rewind* burst power/duration directly (`espooler_rewind_burst_power`/`_duration`) rather than a separate "rotate" burst setting defaulted from "assist" as the wiki claimed; and `MMU_HEATER STOP=0` (the wiki's suggested way to turn a raw-set heater back off) is actually a no-op — `STOP=1` is required. Also fixed a related stale line on `Reference-Printer-Variables.md`: `drying_state`'s not-in-a-cycle value is `''` (blank), not the literal word `none`, and the real "cancelled" spelling is `canceled` (one L). Real menuconfig screenshots (`feature-environment-manager` session, boxturtle seed, toggled on via scene setup since neither feature is selected by default on that seed). |
| `Feature-Tip-Forming-Purging.md` | `Kconfig.tip_shaping`, `Kconfig.purging` | `wiki/Tip-Forming-and-Purging.md` — **plus now also owns the EREC/servo-cutter and Blobifier addons** (`wiki/Addon-Feature-Setup.md`'s "EREC Filament Cutter" and "Blobifier" sections), found while scoping `Feature-Addon-Integrations.md`: both are now native `Kconfig.tip_shaping`/`Kconfig.purging`-driven features (`MMU_HAS_SERVO_CUTTER`, `MMU_HAS_BLOBIFIER`) with real generated `mmu.cfg` sections, not third-party `[include mmu/addons/...]` files any more — originally found while scoping `Feature-Addon-Integrations.md` (now removed, see item 52 below) | **done** — code-verified against the real `Kconfig.tip_shaping`/`Kconfig.purging` menus (confirmed the two-Kconfig merge is still right — both are unconditional and always sourced back-to-back, same shape as `Kconfig.sync_feedback_buffer`+`Kconfig.motor_sync`). Corrected: `form_tip_macro`/`purge_macro`/`force_form_tip_standalone`/`force_purge_standalone`/`extruder_form_tip_current`/`extruder_purge_current`/`slicer_tip_park_pos` all live in `mmu.cfg`'s `[mmu_parameters]` section — the wiki (and even several of Happy Hare's own shipped `.cfg`/macro-file comments) say `mmu_parameters.cfg`, which is wrong everywhere it appears, not just in the wiki. Added the EREC-style **Servo Cutter** as its own subsection (additive to tip forming, not a replacement — confirmed by `mmu.cfg`'s own comment that MMU-end cutting still needs `_MMU_FORM_TIP` set first) and a `MMU_TEST_PURGE` command mention (real, not in the wiki at all). Kept `toolhead_ooze_reduction.png` (an annotated diagram with the real param name already baked in) and all five other wiki images (third-party slicer UI screenshots and a plain photo — none had a staleness risk). Real menuconfig screenshots for the base Tip Forming/Cutting and Purging screens (`feature-tip-forming-purging` session, boxturtle seed, no scene setup needed — both menus are unconditional). |
| `Feature-FlowGuard.md` | `Kconfig.flowguard` | new (no v3 equivalent) | **done**, written last per plan — scope defined entirely by what `Feature-Encoder.md` and `Feature-Sync-Feedback-Buffer.md` had already deferred (`flowguard_enabled`, `flowguard_max_relief`, `flowguard_encoder_mode`, `flowguard_encoder_max_motion`, `tangle_prevention_*`), not from a wiki source. Code-verified against `unit/mmu_sync_feedback.py` and `commands/mmu_flowguard.py`: confirmed a clog/tangle event from either detection source (buffer relief-movement or encoder motion) funnels into the exact same runout-handler used by real sensor-based runout — i.e. FlowGuard is purely the *detection* layer, and what happens next is entirely `Feature-Endless-Spool-Runout.md`'s existing pause-vs-EndlessSpool logic, not something to re-explain here. Found the same "shipped template overrides code fallback" pattern already seen elsewhere: `flowguard_max_relief` ships as `40` (confirmed via real menuconfig capture) even though the Python `ParamSpec` fallback is `8.0`. Real menuconfig screenshot (`feature-flowguard` session, boxturtle seed — already has a buffer, so the menu is visible with no scene setup; the encoder-mode section correctly doesn't appear since this seed has no encoder). **Updated 2026-08-08 (item 53)**: the FlowGuard telemetry/simulation content originally skipped when this page was written (see `Feature-Sync-Feedback-Buffer.md`'s row above) turned out not to be out of scope after all — a re-review of the wiki source found it was simply never ported anywhere; added as a new "Tuning with telemetry" section. |
| ~~`Feature-Addon-Integrations.md`~~ | — | **removed 2026-08-08 (item 52)** — per explicit request, once nothing on it was genuinely load-bearing any more: EREC/servo-cutter and Blobifier were already just redirect stubs to `Feature-Tip-Forming-Purging.md`/the new `Macro-Servo-Cutter.md`/`Macro-Blobifier.md` pages, and DC eSpooler was a pure redirect to `Feature-Espooler.md` - only Eject Buttons was real, unclaimed content, moved to its own page below. The `erec-logo.jpg`/`blobifier.jpg` photos moved with their respective sections into `Macro-Servo-Cutter.md`/`Macro-Blobifier.md` (`git mv`, preserving history) rather than being dropped. |
| `Feature-Eject-Buttons.md` | `Kconfig.eject_buttons` | (previously a section of `Feature-Addon-Integrations.md` — see above) | **done** — split out into its own Feature page (item 52), carrying forward the real eject-button pin-polarity footgun (normally-closed vs. normally-open wiring) and its menuconfig screenshot unchanged; only the page-level framing (no more "addon" language, no more redirect sections around it) changed. |
| `Feature-Cold-Pull.md` | `config/macros/mmu_misc.cfg` (`[gcode_macro MMU_COLD_PULL]`) | (previously a section of `Blobbing-and-Stringing.md`) | **done (item 60)**, per explicit request — extracted the "Cleaning the Extruder with a Cold Pull" section (manual + `MMU_COLD_PULL`-guided procedures, parameters, per-material temperature table, both images) into its own Feature page; `Blobbing-and-Stringing.md` keeps only a one-line pointer plus its Step 1 cross-link, since (unlike `MMU_CALIBRATE_TOOLHEAD`, kept in place per item 57) nothing on that page's own diagrams/narrative depended on the section staying there. `MMU_COLD_PULL` is a real `gcode_macro`, not a Python `BaseCommand` - confirmed it's genuinely absent from `Reference-Commands.md` because `gen_command_reference.py` only scans `extras/mmu/**.py`, never `config/macros/*.cfg`; noted on the new page rather than silently treated as an oversight. Flagged as a separate task: several other real user-facing `MMU_*` macros (`MMU_FAN`, `MMU_DUMP_VARS`, `MMU_CHANGE_TOOL_STANDALONE`, `MMU_CHECK_GATES`, `MMU_REMAP_TTG`, `MMU_FORM_TIP`) share this same generator blind spot - some already have coverage elsewhere (e.g. `MMU_START_SETUP`/`MMU_END` on `Slicer-Setup.md`), others may not; worth a dedicated audit rather than fixing piecemeal. |
| `Feature-Fan-Control.md` | `Kconfig.fans` + `config/macros/mmu_fan_control.cfg` (`MMU_FAN`) | new — the one real gap the audit above found; everything else it turned up was an undocumented legacy-alias macro name, explicitly out of scope per the user ("no need to document the old aliases... trying to get users to use new commands... no need to document double underscore set") | **done (item 62)** — real menuconfig screenshots (`feature-fan-control` session, boxturtle seed, scene toggles both "Has environment sensor(s)?" and "Has cooling fans?" since the feature's own `_MMU_FAN_VARS` block is gated on **both** together — verified directly against `config/base/mmu_macro_vars.cfg`'s `if MMU_HAS_FANS and MMU_HAS_ENVIRONMENT_SENSOR` guard, not assumed from the Kconfig comment header alone. **A real functional bug found and verified empirically, not just read**: `variable_fans`/`variable_fan_sensors` are documented (by the template's own header comment, and by this site's pre-existing `Reference-Macro-Vars.md` entry) as auto-populated from the configured fan/sensor pins, but the Jinja template actually references `VAR_FAN_FANS` (single-sensor case) and `PARAM_ENVIRONMENT_SENSOR_NAME_$(i)` (per-gate case) - neither of which exists as a real Kconfig symbol anywhere (confirmed by grep and by rendering the real template end-to-end via `test.hh.cfg.render()` against a synthetic profile, using a throwaway scratchpad venv with `jinja2` installed since neither this repo's venv nor `.happy-hare-src` had one). Result: `fan_sensors` alone auto-populates correctly for the single-sensor case; `fans` never does; neither does in the per-gate case. Documented as a manual-setup step on the new page and corrected `Reference-Macro-Vars.md`'s "*(auto-generated)*" claim to match. Not fixed upstream - that's Happy Hare's own repo, not this doc site. |
| `Feature-Sensors.md` | (no dedicated Kconfig — covers the sensor layer common to every sensor type) | new (no v3 wiki page — the closest wiki content was `MMU_SENSORS DETAIL=` prose scattered across `Clog-Runout-EndlessSpool.md`/`Synchronized-Gear-Extruder.md`, folded in here instead) | **done (2026-08-13)** — added after v4 replaced `MMU_SENSORS DETAIL=1` with `SENSOR=<name> ENABLE=[0|1]` (commits `0309a9ed`/`da14e1b2`/`8f22d625` on `.happy-hare-src`, pulled same session — local checkout had been pinned 5 days stale). Deliberately narrow scope, deviating from the standard Feature template on two sections: **Hardware Setup** and **Parameter Setup** both just cross-link to each sensor type's owning page rather than containing real content, since this page is the query/enable layer sitting on top of sensors, not a sensor type of its own. Code-verified against `commands/mmu_sensors.py`, `mmu_sensor_manager.py` and `mmu_sensor_utils.py`'s `cmd_SET_FILAMENT_SENSOR`; empirically verified via the real test harness (`test/hh`, throwaway venv) rather than just reading, three rounds after an advisor review caught two overclaims in the first draft: (1) `MMU_SENSORS UNIT=N` still tags a disabled sensor `(DISABLE)` same as the no-arg form, but only for sensors belonging to that unit — a disabled sensor on a *different* unit doesn't appear in a `UNIT=`-scoped report at all (confirmed on `ercf_vvd`, a real 2-unit machine), which is plain scoping, not the disabled-sensor tag, and the page's wording was tightened to say so; (2) the exact console text for a disable and for the shared-gate-endstop warning; (3) the `sensors` printer variable (`mmu_sensor_manager.get_status()`) is scoped to the *currently selected gate* with generic, non-gate-suffixed keys, not every sensor on the machine — confirmed by selecting different gates and diffing the dict keys - both this page's own printer-variable row and the pre-existing `Reference-Printer-Variables.md#sensors` line were tightened to say so, since neither previously stated the scope at all. Also fixed two related stale spots found while scoping this: `GettingStarted-BoxTurtle.md`'s sensor-check example used `MMU_SENSORS DETAIL=1` (now plain `MMU_SENSORS`), and `Reference-Printer-Variables.md`'s `sensors` entry described disabling one via `` /sensor NAME disable `` - confirmed real (`test/console.py`'s `/sensor` simulator command, `test/README.md` line 243) but a dev-only console command that has no business on a reader-facing reference page; pointed at this new page's real mechanism instead. Reused `wiki/Mainsail-Fluidd-Integration/Type-P_All_Sensors.png` for the Concept illustration (generic position labels, not sensor-internal names, so not stale under the existing reuse policy) with a clarifying paragraph underneath rather than a caption. Added See-also cross-links (and a Troubleshooting mention on two) from `Feature-Endless-Spool-Runout.md`, `Feature-Sync-Feedback-Buffer.md`, `Feature-Encoder.md`, `Feature-FlowGuard.md`. Regenerated `Reference-Commands.md` via `make command_reference` against the freshly-pulled source - diffed old vs. new and confirmed the *only* change anywhere in the file is the `MMU_SENSORS` section (no other command's help text moved), so no other page's `Reference-Commands.md#mmu_*` anchor went stale. |

### 6. Slicer & Toolchange — done (both pages)

| Page | Source | Status |
|---|---|---|
| `Slicer-Setup.md` | `wiki/Slicer-Setup.md` | **done** — user's own expectation ("should be almost the same as v3") held up well: the core `MMU_START_SETUP`/`MMU_START_CHECK`/`MMU_START_LOAD_INITIAL_TOOL`/`MMU_END` macro sequence is essentially unchanged, confirmed directly against `config/macros/mmu_software.cfg`. Corrected: `variable_eject_tool` → real name `variable_unload_tool`; added `variable_automap_strategy` (new, not in wiki); noted `MMU_END`'s new `UNLOAD=` param. Dropped four inline slicer-textbox screenshots that just re-showed text already in a code block (`start_gcode.png`, `end_gcode.png`, `tool_change_gcode.png`, `after_layer_change_gcode.png`); kept `error_dialog_during_start.png` (real UI, not text-representable) and all four tip-forming-settings screenshots. |
| `Toolchange-Movement.md` | `wiki/Toolchange-Movement.md` | **done** — fixed a real inconsistency: `variable_enabled_park_standalone`/`variable_enabled_park_disabled` (wiki) don't exist; real names are `variable_enable_park_standalone`/`variable_enable_park_disabled` (matching `enable_park_printing`). Bigger finding: the wiki describes *three* z-hop sources (slicer's own, an immediate Happy-Hare blob-prevention lift via `z_hop_height_toolchange`, and the configurable park move) - `z_hop_height_toolchange` doesn't exist anywhere in real v4 config; that immediate lift has been unified into the single `variable_park_*` mechanism this page already documents. Rewrote "Z-Hop Moves" around two real sources, not three. |

### 7. Operation — done (all 4 pages)

| Page | Source | Status |
|---|---|---|
| `Understanding-Operation.md` | `wiki/Understanding-Operation.md` + current command output | **done** — rebuilt the legacy status walkthrough around a current four-gate Box Turtle snapshot. Covers the machine/selection state and the dynamically calculated preload, load and unload sequences from `MMU_STATUS SHOWCONFIG=1`, then cross-checks that report against the current `MMU_GATE_MAP`, `MMU_TTG_MAP` and `MMU_SENSORS` output. A multi-unit legend explains unit ownership, TTG columns, availability and selection symbols, followed by a left-to-right guide to the live filament-path glyphs, sensors, sync-feedback buffer and tracked distance. The old point-in-time status format, parameter names and version-specific prose were replaced rather than preserved; deeper map/sensor configuration remains on the existing Feature pages. Added first in the Operation navigation so readers learn how to inspect state before acting on it. |
| `Operation.md` | `wiki/Basic-Operation.md` + `wiki/Handling-Errors.md` + `wiki/Print-Job-State-Machine.md` | **done** — merged into one page per explicit request (was two separate rows in this table; the user asked for "the 'Operation' page that should pull from Basic-Operation.md and Handling-Errors.md," singular). Explicitly flagged by the user as possibly stale going in - warranted a full dedicated source-verification pass (not a lighter check like §6 above), which found real corrections: `logfile_level`→`log_file_level`; `encoder_load_retries`→`gate_load_attempts`; `gear_from_spool_speed`→`gear_load_speed`; `gear_from_buffer_speed`/`gear_speed_from_buffer` (wiki uses both, inconsistently)→`gear_from_filament_buffer_speed`; `bowden_allowable_load_delta`→`bowden_allowable_encoder_delta`; `strict_filament_recover`→`strict_filament_recovery`; `extruder_homing_endstop`'s `collision` value is really named `encoder`; a 5th endstop value, `filament_compression`, exists and isn't in the wiki; `mmu_calibration_bowden_length` isn't a real user-facing name (internal persisted state, not something to type). Several settings the wiki locates in `mmu_parameters.cfg` are actually in `mmu.cfg`'s shared section or its `[mmu_toolhead]` section - the same recurring file-location confusion found on multiple other pages. Confirmed accurate as-is: `MMU_PRELOAD`, `MMU_CHECK_GATE TOOLS=`, `MMU_STATUS SHOWCONFIG=`, `MMU_UNLOCK`, `MMU_RECOVER` (all four params, plus a new `BYPASS=1` not in the wiki), `MMU_PAUSE FORCE_IN_PRINT=1`, and the whole pause→fix→resume/recover flow (reproduced as a `<pre class="hh-mermaid">` flowchart, same mechanism as `Feature-Spoolman.md`'s diagrams). The print-job lifecycle is now included without duplicating that recovery walkthrough, code-verified around `printer.mmu.print_state`, public `MMU_PRINT_START`/`MMU_PRINT_END` bookends, explicit end states, the `pause_locked`→`paused` distinction and the current `idle` wake-up state omitted by the wiki; the wiki's Mermaid diagram was updated and carried forward through the site's stable raw-HTML renderer. Deliberately kept the load/unload sequence walkthrough at overview level and linked out to `Custom-Load-Unload-Sequences.md` for the state-machine/`_MMU_STEP_*` detail that page already owns, rather than duplicating it. Dropped the wiki's "KlipperScreen Happy Hare" subsection entirely - now redundant with the dedicated page below. |
| `KlipperScreen.md` | `wiki/KlipperScreen.md` | **done** — the wiki source was already fairly accurate (uses the real v4 selector-class taxonomy - Linear/Rotary/Virtual - not the stale Type-A/B binary), so little to correct. The wiki page's own install section was circular ("follow the install directions... included in this wiki here" pointing at itself) - replaced with real install steps fetched directly from the fork's own README (`https://github.com/moggieuk/KlipperScreen-Happy-Hare-Edition`): it replaces stock KlipperScreen rather than running alongside it, clone over `~/KlipperScreen`, `cd happy_hare && ./install_ks.sh -g <num_gates>` (also the correct thing to re-run after every update, not just once). Originally restored all three Manage-panel selector-variant screenshots (linear/rotary/virtual) rather than showing just one - **superseded 2026-08-07, item 50**: the fork's own UI moved on since those screenshots were taken. |
| `Mainsail-Fluidd-Integration.md` | `wiki/Mainsail-Fluidd-Integration.md` | **done** — panel descriptions and `t_macro_color` (all four values: `slicer`/`allgates`/`gatemap`/`off`) verified unchanged against source. Dropped the wiki's specific "Mainsail PR is in queue, Fluidd PR already integrated" claim - couldn't verify current merge status (checked both `mainsail-happy-hare-edition`/`fluidd-happy-hare-edition` forks directly; still active, but their READMEs don't state a merge-status the way the KlipperScreen fork's does) and this site avoids stale point-in-time claims by rule - reworded to a timeless "forks track the newest enhancements" framing instead. Dropped the celebratory `candy.png`/`thumbs_up.png` images, matching this site's tone elsewhere. |

### 8. Tuning — done

| Page | Source | Status |
|---|---|---|
| `Blobbing-and-Stringing.md` | `wiki/Blobbing-and-Stringing.md` | **done** — code-verified against `install.sh`-adjacent config/macro source. Real correction found: `MMU_CALIBRATE_TOOLHEAD`'s step 2 (residual filament) needs an explicit `DIRTY=1` flag now — the wiki's "no flags" for this step is stale; the real command also gained a `UNIT=` param (multi-unit) not in the wiki. Bigger structural finding, consistent with item 48's `Toolchange-Movement.md` work: the wiki presents `variable_retract`/z-hop/z-hop-ramp as three independent settings, but they're actually three fields of the same per-operation `variable_park_*` 5-tuple - rewrote that section around the real single-tuple mechanism instead of three separate ones, and corrected `variable_park_mmu_error` (doesn't exist) to the real `variable_park_pause` (which already covers MMU errors). `MMU_COLD_PULL`'s per-material default table (hot/cold/pull/min-extrude temps for nylon/PLA/ABS/PETG) checked directly against the real macro's own embedded table and matched exactly, byte for byte - confirmed accurate as ported. Restored three "Probe_*" illustration images (nozzle shoulder, filament remains, cut remains) that a first pass had dropped without a specific reason, per the standing rule on that. Cross-links to `Feature-Tip-Forming-Purging.md#toolhead-calibration-and-toolhead_ooze_reduction` for the final `toolhead_ooze_reduction` fine-tune rather than duplicating that page's own tuning image/guidance. |

### 9. Multi-Unit (placeholder — deferred)

| Page | Source |
|---|---|
| `Multi-MMU.md` | `wiki/Multi-MMU.md` — flag as future work, not in v1 |

### 10. Reference

| Page | Source | Status |
|---|---|---|
| `Reference-Commands.md` | `extras/mmu/**` (walks the whole tree, not just `commands/` — see `doc_tools/gen_command_reference.py`'s header) | **done, generated** — `make command_reference`. 89 commands as of 2026-08-08 (item 55 — v4 split `MMU_SPOOLMAN`'s tag-registration half into a new `MMU_SPOOLMAN_TAG` command; was 88). Reader-facing intro simplified 2026-08-06 to drop `HELP_BRIEF`/`extras/mmu/` citations per the no-developer-references rule |
| `Reference-Parameters.md` | `config/base/mmu.cfg` + `config/base/mmu_parameters.cfg` (the real shipped templates), defaults/help text cross-checked against the driving `installer/Kconfig.*` files via `kconfiglib` directly (not the wiki, deliberately — see below) | **done** — renamed from the wiki's `Happy-Hare-Reference-Parameters.md`. Every `[[PARAM_X]]` token in both templates resolved to a real menuconfig default by generating a Box Turtle seed the same way `doc_tools/capture.py`'s `generate_seed()` does (a one-off script using the same `write_config`→fresh-`Kconfig`→`load_config` round-trip — setting a symbol's value directly without that round-trip left half the tree unresolved); a second pass against an ERCF seed filled in nothing further for the feature-gated settings (heater/NFC/FlowGuard/servo), since those toggle on a separate opt-in capability symbol, not the MMU type — those instead reuse the screenshot-verified values already established while writing `Feature-Environment-Manager.md`/`Feature-FlowGuard.md`/`Feature-NFC.md`. Organized in file order (shared `mmu.cfg` settings, then per-unit `mmu_parameters.cfg` settings), each subsection matching the templates' own banner grouping, with every setting that has a deeper home cross-linked to its Feature page rather than re-explained. Deliberately doesn't tabulate LED effect definitions or addon hardware blocks (servo pulse widths, stepper current) — both already fully covered on `Feature-LEDs.md`/`Feature-Tip-Forming-Purging.md`/`Macro-Servo-Cutter.md`/`Macro-Blobifier.md`. |
| `Reference-Macro-Vars.md` | `config/base/mmu_macro_vars.cfg` (the real shipped template) + `installer/macro_vars/Kconfig.*` and `installer/Kconfig.fans` help text — not the wiki | **done** — same role for `mmu_macro_vars.cfg` that `Reference-Parameters.md` plays for `mmu.cfg`/`mmu_parameters.cfg`, closing the reminder left in "Open items for later" below. 181 `variable_*` tokens across 11 `[gcode_macro ..._VARS]` blocks. Defaults came from a purpose-built regex parser over the Kconfig source directly rather than `kconfiglib` — this content isn't MMU-type-seed-dependent (tip forming/purging/cutter/Blobifier are opt-in capability toggles, not selector-type-driven), so a literal `default N` read is both simpler and more reliable than reconstructing a seed for it; a handful of choice-gated string defaults (`VAR_BLOBIFIER_TYPE`, `VAR_SOFTWARE_AUTOMAP_STRATEGY`, `VAR_SEQUENCE_RESTORE_XY_POS`, `VAR_FAN_FORCED`, etc.) needed the companion `choice`/`BOOL_*` symbol's own default read directly from source to resolve, since the parser's automatic block-boundary detection didn't handle `choice`/`endchoice` blocks cleanly. Organized by macro block in the template's own order, with Blobifier's ~60 variables further broken into the sub-groups the template itself already uses (Hooks, Hardware, Tray Positions, Brush/Cleaning, Purge Length, Blob Tuning, Retraction, Fan Control, Bucket). One genuinely new finding: `_MMU_STATE_VARS`'s `servo_down_limit`/`cutter_blade_limit` aren't wired to any real counter in the current Python code — they're just suggested limit values a user's own extension macro would plug into a hand-built `MMU_STATS COUNTER=` setup, not an automatic built-in one; flagged as a note on `Feature-Statistics-Counters.md` rather than a contradiction of that page's "no built-in preset counters yet" framing, since it isn't one. Cross-linked from `Reference-Parameters.md`, `Custom-Load-Unload-Sequences.md`, `Feature-Gate-TTG-Maps.md`, `Feature-Tip-Forming-Purging.md`, `Macro-Servo-Cutter.md`, `Macro-Blobifier.md`, and `Feature-Statistics-Counters.md`. |
| `Reference-Printer-Variables.md` | printer status surfaces (same as the console's `/vars`) | **done, hand-written but code-verified** (no generator yet). Retrofitted 2026-08-06: dropped the v3-vs-v4 diff and all `Mmu*`/file-path citations per the page-genre-wide rules above — the `servo`/`grip` gap found in the process moved to `Dev-Code-Layout.md`'s selector-hierarchy discussion rather than being lost |
| `Reference-Mcu.md` | `wiki/Reference-Mcu.md` + `installer/boards/Kconfig.*` | **done** — per explicit request, expanded well past the wiki's 6 "popular" boards to the complete current list `menuconfig`'s **Board type** screen offers, enumerated directly from `installer/boards/Kconfig.*` (16 general boards + "Not listed / Other"), `installer/boards/per_gate/Kconfig.*` (2, offered only for EMU per-gate-MCU designs), and `installer/boards/custom/Kconfig.{kms,vvd}` (2 more, each a fixed board for one specific MMU type rather than a real choice) - 20 real boards total, not counting the generic fallback. Kept the wiki's 6 pinout/connection images (all still map to a real current board name, confirmed one-by-one) as the featured "Popular MCUs" section, then listed every other board in a plain table noting which ones have no image available rather than silently omitting them - per-request, images only where they exist, not fabricated/fetched from elsewhere. One verbatim-accuracy call: kept the real Kconfig prompt's own "Quatrobox" spelling (missing a 't') for the Chameleon X5 entry rather than "correcting" it to match this site's own `QuattroBox` naming elsewhere - it's the literal text on a `menuconfig` screen a reader will actually see on their own terminal, not prose this site is authoring itself. |

### 10a. Advanced Customization (new section)

| Page | Source | Status |
|---|---|---|
| `Custom-Load-Unload-Sequences.md` | `config/macros/mmu_sequence.cfg` + the real `_MMU_STEP_*` command implementations (`gcode_load_sequence`/`gcode_unload_sequence` override mechanism) | **done** — first page in a new top-level nav section, since this doesn't fit "Feature" (it's a customization mechanism, not a capability) or "Reference" (it's a how-to, not a flat lookup). Deliberately narrow scope: covers the state-machine + step-command override mechanism only, not the lighter `_MMU_SEQUENCE_VARS`/callback-macro layer in detail (mentioned and recommended as the first thing to try, but its many park-position/z-hop/retract-tuning variables are a large enough topic to deserve their own future page rather than a subsection here). All 11 `_MMU_STEP_*` commands are already in `Reference-Commands.md` (it walks the whole `extras/mmu` tree) — this page links out to each rather than re-tabulating parameters, and instead does the reference's actual job: explaining the state machine, walking through what the two shipped default sequences actually do, and reproducing the two commented-out alternative examples at the end of the source file (toolhead-sensor homing, and `mmu_ext_touch` stallguard homing) that weren't visible anywhere else. Found one real, verifiable inconsistency while cross-checking the wiki against source: the shipped `_MMU_UNLOAD_SEQUENCE` passes `FULL=1` to `_MMU_STEP_UNLOAD_BOWDEN`, but that command's real parameter list is `LENGTH` only — no `FULL` — so the argument is silently ignored (harmless as shipped, since the step already runs at the calibrated length either way, but a genuine stale leftover in Happy Hare's own reference macro, not a wiki error this time). |

### 10b. Macros (new section)

| Page | Source | Status |
|---|---|---|
| `Macro-Customization.md` | `wiki/Macro-Customization.md` (470 lines — Macro Extension vs. Macro Replacement, `MMU_ACTION_CHANGED`/`MMU_PRINT_STATE_CHANGED`/`MMU_EVENT`) | **done** — found during the 2026-08-07 wiki-gap audit (item 47), originally slotted as a second page under §10a Advanced Customization; moved here instead once the request came in to also give each `mmu_macro_vars.cfg` macro group its own page and group all of it into a dedicated nav section (item 51) — this page is that section's lead/intro, covering the two customization methods only. Its Tip Forming/Tip Cutting sections (the wiki page's own last two sections) were dropped and relocated to their own pages below rather than covered twice. Rebuilt the wiki's one flat `variable_user_*_extension` list into the real per-block mapping (which macro group owns which hook) — the wiki never distinguished these. Cross-links `Reference-Parameters.md#macros` for the full macro-replacement parameter table rather than re-tabulating it. |
| `Macro-Print-Start-End.md` (`_MMU_SOFTWARE`) | `installer/macro_vars/Kconfig.software` + `config/base/mmu_macro_vars.cfg` | **done** — `MMU_START_SETUP`/`MMU_START_LOAD_INITIAL_TOOL`/`MMU_END` settings; cross-links `Slicer-Setup.md` (owns the calling convention) and `Feature-Gate-TTG-Maps.md` (owns the `automap_strategy` matching logic this page's setting drives). |
| `Macro-State-Change-Hooks.md` (`_MMU_STATE`) | `installer/macro_vars/Kconfig.state` + `config/base/mmu_macro_vars.cfg` | **done** — the three state-change/event hooks, plus `servo_down_limit`/`cutter_blade_limit`; cross-links `Feature-Statistics-Counters.md`'s existing note that neither limit drives a real counter on its own. |
| `Macro-Sequence.md` (`_MMU_SEQUENCE`) | `installer/macro_vars/Kconfig.sequence` + `config/base/mmu_macro_vars.cfg` | **done** — real, significant scope overlap found and resolved: `Toolchange-Movement.md` (§6, already done) already covers this block's parking/`restore_xy_pos`/z-hop settings in full, with worked examples and diagrams Reference-Macro-Vars.md itself doesn't have. Rewritten to explicitly defer to that page rather than duplicate it, and cover only what it doesn't: the menuconfig screenshot, the six `user_*_extension` load/unload hooks (which `Toolchange-Movement.md` only mentions in passing), and `auto_home`/`timelapse`. Added a reciprocal link back from `Toolchange-Movement.md`. |
| `Macro-Client.md` (`_MMU_CLIENT`) | `installer/macro_vars/Kconfig.client` + `config/base/mmu_macro_vars.cfg` | **done** — cancel-behavior toggles and the pause/resume/cancel hooks for the shipped client macros; cross-links `Operation.md`'s pause→fix→resume/recover flow and `Macro-Sequence.md` for the parking/z-hop behavior around those same operations (this block's own settings are cancel-only). |
| `Macro-Tip-Forming.md` (`_MMU_FORM_TIP`) | `installer/macro_vars/Kconfig.form_tip` + `config/base/mmu_macro_vars.cfg` | **done** — deliberately light: `Feature-Tip-Forming-Purging.md` already has the concept and a real, code-verified `MMU_TEST_FORM_TIP` tuning workflow (superseding the wiki's older `MMU_LOAD EXTRUDER_ONLY=1` → `MMU_FORM_TIP` → `variable_final_eject` sequence, which is why that workflow wasn't ported here or anywhere else) — this page just adds the menuconfig screenshot and notes `Kconfig.form_tip` is sourced unconditionally (visible even when toolhead cutting is selected instead). |
| `Macro-Toolhead-Tip-Cutting.md` (`_MMU_CUT_TIP`) | `installer/macro_vars/Kconfig.cut_tip` + `config/base/mmu_macro_vars.cfg` | **done** — real v4 drift from the wiki found and flagged: `pin_loc_xy` (`14, 250`, not the wiki's `13, 213`) and `pushback_length` (`15.0`mm, not `5`) have both changed; `cut_axis_steppers`/`cut_stepper_current`/`cutting_axis`/`cut_iterations` are new settings not in the wiki at all. The menuconfig screen for this block is gated on `MMU_HAS_TOOLHEAD_CUTTER`, set under **Toolhead sensors/settings** (not under Tip Forming/Cutting itself) — only once that's on does "Tip cutting using toolhead cutter" even appear as a choice under Tip Forming/Cutting's own standalone-option choice. |
| `Macro-Servo-Cutter.md` (`_MMU_SERVO_CUTTER`) | `installer/macro_vars/Kconfig.servo_cutter` + `config/base/mmu_macro_vars.cfg` | **done** — real bug found in Happy Hare's own shipped config: `mmu_macro_vars.cfg`'s section banner for this block describes it as a `post_load_extension`, but `mmu_servo_cutter.cfg`'s own header comment (and the actual mechanism - it fires a `filament_cut` event and repeats the gate-parking move, characteristic of unload) says it's designed for `variable_user_post_unload_extension`. Documented per the macro file's own instruction, with the banner discrepancy flagged as a note rather than silently picking one silently. Also corrected: enabling the capability in menuconfig does **not** auto-wire the hook — confirmed via the Kconfig prompt's own help text ("after enabling this be sure to edit Macro variables") and a grep across `installer/`/`config/` turning up no automatic wiring anywhere. **Updated 2026-08-08 (item 52)**: now also carries the EREC photo/project-page link, `git mv`'d in from the removed `Feature-Addon-Integrations.md`. |
| `Macro-Blobifier.md` (`_BLOBIFIER`) | `installer/macro_vars/Kconfig.blobifier` + `config/base/mmu_macro_vars.cfg` | **done** — ~60 variables; deliberately doesn't re-tabulate `Reference-Macro-Vars.md`'s existing full table. Found the tray-actuator-type choice (servo/stepper) doesn't actually live under Macro Variables at all - it's a hidden, prompt-less symbol there (`VAR_BLOBIFIER_TYPE`), with the real user-facing choice on the **Purging** screen instead (`installer/Kconfig.purging`), alongside "Have Blobifier?" - documented on the page rather than assumed. Screenshot capture found the whole ~60-variable menu fits one autofit screenshot (75 of the 96-row cap, no scroll arrows) - the multi-shot split originally planned for this page turned out to be unnecessary once tried. **Updated 2026-08-08 (item 52)**: now also carries the Blobifier product photo/project-page link and the `BLOBIFIER_PARK`-vs-standard-parking tip, both `git mv`'d/ported in from the removed `Feature-Addon-Integrations.md`. |
| `Macro-Purge.md` (`_MMU_PURGE`) | `installer/macro_vars/Kconfig.purge` + `config/base/mmu_macro_vars.cfg` | **done** — genuinely one setting (`extruder_purge_speed`); cross-links `Feature-Tip-Forming-Purging.md#purge-volumes` and `Macro-Blobifier.md` as the more capable alternative. |

Two blocks in `mmu_macro_vars.cfg` deliberately have no page here: the
auto-generated `T[[i]]` per-gate tool macros (no variables of their own -
already covered as part of `Slicer-Setup.md`'s T0 discussion), and
`_MMU_FAN_VARS` (gated on `MMU_HAS_FANS and MMU_HAS_ENVIRONMENT_SENSOR` in
the shipped file, but no `Kconfig.*` is `rsource`d for it under **Macro
Variables** at all - there's simply no menuconfig editor for it, confirmed
by reading `installer/macro_vars/Kconfig`'s source list directly). Already
noted on `Reference-Macro-Vars.md` itself; not a gap in this table.

### 11. Troubleshooting & FAQ

| Page | Source |
|---|---|
| `Troubleshooting-and-Common-Issues.md` | `wiki/Troubleshooting-and-Common-Issues.md` |
| `FAQ.md` | `wiki/FAQ.md` |

### 12. Developer Guide — **done (all 10 pages)**

| Page | Source | Notes |
|---|---|---|
| `Dev-Code-Layout.md` | new — `extras/mmu/` structure | Object-ownership tree, the 3 "extends" relationships (composition / mixin-split / command-pattern), full selector hierarchy incl. genuine multi-inheritance type-C classes, command auto-discovery pipeline, hardware-boundary quotes pulled straight from NFC/sync-feedback docstrings. The flagship page — read it first if picking this session back up. |
| `Dev-Klipper-Events.md` | Happy Hare `mmu:*` events | Split from `Reference-Printer-Variables.md`; event parameters checked against every current event emission. |
| `Dev-Kconfig-Structure.md` | new — `installer/Kconfig` tree, `installer/build.py`/`parser.py`/`upgrades.py` | Covers the Kconfig dialect extensions, and `./install.sh -z`/`-t` (git-update skip / sandboxed test-mode install to `/tmp/mmu_test`). Deliberately drops a "Makefile targets" table that was here — too detailed, per feedback. |
| `Dev-Testing.md` | `test/README.md` §1–7 (minus §1a) | Trimmed: no more exhaustive per-test-file table (it only grows) — one illustrative file (`test_mmu_console.py`) plus "browse `test/test_mmu_*.py`". Counts genericized to `>900`. |
| `Dev-Command-Reference.md` | new, generated — `doc_tools/gen_command_reference.py`'s `render_dev_page()` | **done (item 59)** — the `CATEGORY_STEPS`/`CATEGORY_INTERNAL` commands `Reference-Commands.md` deliberately excludes (`_MMU_STEP_*`, `_MMU_TEST`, the `CANCEL_PRINT`/`CLEAR_PAUSE`/`PAUSE`/`RESUME` wrappers, `__MMU_*` event handlers), generated by the same script/mechanism as the main reference so both stay in sync with source via `make command_reference`. |
| `Dev-Test-Command.md` | new — `extras/mmu/commands/mmu_dev_test.py` (`_MMU_TEST`) | **done (item 58, updated item 59)** — the hidden, always-registered developer command (leading underscore = Klipper's hide-from-help convention, not a special build flag; every option is live on any install). Groups its ~25 sub-tests by risk tier (safe introspection / moves real hardware / provokes known bugs on purpose / sequence timing / fake autotune telemetry) rather than repeating the flat parameter list, which now lives on `Dev-Command-Reference.md` instead. Cross-linked from `Dev-Testing.md`'s coverage-map row. |
| `Dev-Simulator.md` | `test/README.md` §1a — **renamed from "Console"** | Opens with a real colour screenshot (`doc/Dev-Simulator/Simulator.png`, user-supplied) of a live session before the ported detail. |
| `Dev-Doc-Tooling.md` | `doc_tools/README.md` | Kept in sync with the actual `doc_tools/README.md` — edit both together. Includes a note on the Zensical build-cache bug (see below). |
| `Dev-Installer-Docker.md` | `installer-dev/README.md`, rewritten after reading the actual Dockerfiles/compose file | Real purpose: cross-**Python-version** testing (Alpine target runs Python 2.7, matching Creality K1's busybox environment) — not just "a clean sandbox", which `-t` already gives you on your own host Python. |
| `Dev-Contributing.md` | new + `.github/CONTRIBUTING.md` | Community/PR-process guidance ported in, plus the file-header convention and links back to every other Developer Guide page. |

### 13. Community & Support

| Page | Source |
|---|---|
| `Change-Log.md` | `wiki/Change-Log.md` |
| `Donations.md` | `README.md:47-65` (PayPal link + the "monster undertaking" stats) |
| `Getting-Help.md` | `wiki/Home.md` "How to get help" section, Discord links |

---

## Zensical rough edges (found this session — check if still true before relying on them)

- **`exclude_docs` is not honoured.** A file listed there still gets built into
  the site. Worked around by keeping `TOC.md` outside `docs_dir` entirely rather
  than relying on the config option — more robust anyway.
- **The incremental build cache is unreliable**, not just slow. The same
  content, rebuilt with `--clean` four times in a row, produced a correct
  Mermaid diagram exactly once — the other three renders silently fell back to
  showing the raw ` ```mermaid ` source as plain text, with no warning. This is
  why Mermaid was dropped entirely (see above) rather than worked around — a
  diagram that renders correctly 1 time in 4 is worse than no diagram, because
  it fails silently and non-deterministically depending on which build happens
  to deploy. If a rebuild ever looks stale for *any* reason, run
  `./venv/bin/zensical build --clean` once before assuming the content is wrong.
- **Markdown table cells with an escaped pipe inside a single code span
  render the literal backslash.** `` `a \| b` `` shows `a \| b`, not `a | b` —
  Markdown doesn't process backslash-escapes inside code spans, and the table
  parser still needs the escape to not split the column. Fix: give each value
  its own code span, with the `\|` as plain text between them —
  `` `a` \| `b` ``. Bit twice this session (`Reference-Printer-Variables.md`, then
  `Dev-Simulator.md`) before the pattern stuck; grep any new page for `` \| ``
  before considering it done.
- **SuperFences and Python-Markdown's `fenced_code` must not be enabled
  together.** The earlier 2026-08-06 investigation attributed inconsistent
  ordinary-fence output to SuperFences itself. Rechecking on 2026-08-19 found
  that the configuration loaded both extensions, which compete for the same
  internal `fenced_code_block` processor registration and are explicitly not
  supported together. SuperFences is now the sole backtick-fence processor,
  with `css_class: codehilite`; six consecutive clean builds produced identical
  `Slicer-Setup.md` HTML, including fences nested in admonitions and tabs. The
  base `codehilite` extension remains for traditional indented blocks, and
  `doc/assets/stylesheets/extra.css` maps its Pygments token classes to
  Material's `--md-code-hl-*-color` variables. This does not overturn the
  separate Mermaid custom-fence warning above: do not add a SuperFences Mermaid
  custom fence without retesting that route specifically.
- None of the above is likely specific to this repo — worth re-checking against
  a newer Zensical release before assuming they still apply.

## Open items for later, not blocking this plan

- **Wiki-style bare links** (`[Foo](Foo)`) throughout ported pages won't resolve
  under mkdocs/Zensical — no existing Makefile target rewrites them (`fix_links`
  is unrelated, it's about Klipper symlinks). Link conversion is a real, if
  mechanical, cost per page. Zensical's own build does at least catch a broken
  internal link/anchor at build time ("page does not exist" / "anchor does not
  exist") — lean on `./venv/bin/zensical build --clean` after every new page
  rather than eyeballing links.
- **External inbound links** (README, Discord, KlipperScreen repo, YouTube videos)
  point at old wiki page names — a redirect map is worth a line item once URLs are
  final, not now.
- **`Configuring-mmu*.cfg.md` generators (§3) are still unbuilt** — the plan
  calls for generating them from the `config/base/*.cfg` Jinja templates'
  inline comments, mirroring `gen_command_reference.py`'s approach, but no
  script exists yet.
- **The `servo`/`grip` gap found while writing `Reference-Printer-Variables.md`**
  (`MmuController.get_status()` never merges `selector.get_status()`, so
  `printer.mmu.servo`/`.grip` from v3 don't exist in v4 despite the value being
  computed) is a real code question worth raising upstream, not just a doc
  footnote — flagged in both `Reference-Printer-Variables.md` and `Dev-Code-Layout.md`.
## Session log

**2026-08-05.** In order, roughly:

1. Planned this TOC from scratch (surveyed `README.md`, `wiki/`, `test/README.md`,
   `doc_tools/README.md`, `extras/mmu/commands/*.py`) after being asked for a book
   structure before writing anything.
2. Learned mkdocs basics with the user (anchor slugify rules, the `[TOC]` marker,
   themes) before building anything, per their request.
3. Built the first real page: `Reference-Commands.md`, generated by a new
   `doc_tools/gen_command_reference.py` (`ast`-based, no imports). Caught and
   fixed its own scope bug mid-session — it only scanned `commands/`, missing
   commands registered from `mmu_controller.py` and `unit/selectors/*.py` (76 → 88
   commands after the fix). This is the moment the "verify against real code,
   don't assume" habit for this project got established — it paid off again
   later on `Reference-Printer-Variables.md` (the `servo`/`grip` gap) and `Dev-Testing.md`
   (the stale "69 commands" figure).
4. User asked to switch the site generator from mkdocs to **Zensical** mid-session.
   Migrated `mkdocs.yml` in place (Zensical reads it natively). Found the
   `exclude_docs` bug and the build-cache bug here (see above).
5. Branding pass on `doc/index.md` and the Material theme: real logo/favicon
   assets generated from `wiki/resources/happy_hare_logo.jpg`, black+pink palette,
   `theme.variant: classic` (Zensical's new default `modern` doesn't colour the
   header from `primary` at all — found by inspecting the shipped CSS directly,
   not documented anywhere).
6. Built `Reference-Printer-Variables.md` — fully code-verified against every `get_status()`
   in `extras/mmu/`, not carried over from the v3 wiki. Found: the `servo`/`grip`
   gap, several v3→v4 field additions (FlowGuard, tangle prevention, per-gate
   `espooler`/`drying_state`/`nfc`), a `print_state` value and four `action`
   values added since v3, and a `mmu:sync_feedback` event signature change
   (gained an `eventtime` parameter).
7. Established the `[TOC]`-for-hand-written-pages-only convention, then reversed
   it entirely a couple of turns later once the user pointed out the theme's own
   sidebar already covers it on every page, not just generated ones. Recorded
   the reversal (not just the fix) in `doc_tools/README.md` so a future session
   doesn't reintroduce it.
8. Built the entire **Developer Guide** (§12, all 7 pages) in one push — see that
   section above for what's in each page. This is where the Mermaid diagrams
   were tried, found flaky, and reverted to ASCII (see **Zensical rough edges**).
9. Cleanup pass on the Developer Guide from user feedback: trimmed `Dev-Testing.md`,
   dropped a table from `Dev-Kconfig-Structure.md`, added real detail on
   `install.sh -z`/`-t` (found by reading `install.sh` directly rather than
   guessing), and rewrote `Dev-Installer-Docker.md` after actually reading the
   Dockerfiles/compose file for the first time (the real value is Python-2.7/
   Alpine parity testing, not just "a clean sandbox").
10. Swapped the `Dev-Simulator.md` ASCII transcription for a real screenshot the
    user supplied as a file, and added the "Picking a toolhead" step to
    `GettingStarted-BoxTurtle.md` with two new real screenshots generated via
    `doc_tools/shots.py` (extended the existing `getting-started-boxturtle`
    session, renumbering `11-spoolman-readonly.png` → `13-`). Hit and fixed a
    real `doc_tools/capture.py` quirk along the way: `toggle()` on a long
    `choice` list leaves the highlight at the top after the resize `shot()`
    triggers internally — fixed by calling `mc.autofit()` before the final
    `mc.select()`, not by re-selecting alone (see the comment in `shots.py`).
11. Wrote the first §5 Feature page, `Feature-Espooler.md`, to prove out the
    template. Read `mmu_espooler.py` (burst/print-assist state machine), the
    espooler branch of `_wrap_espooler()` in `mmu_filament_movement.py` (the
    gear-speed-driven PWM curve — not in `mmu_espooler.py` itself, easy to
    miss), `_adjust_espooler_assist()` in `mmu_controller.py` (auto-arm on
    filament-loaded), and the `espooler_*` `ParamSpec`s in
    `mmu_unit_parameters.py`. Found that BTT ViViD (`MMU_TYPE_VVD_1_0`) is the
    one MMU type that forces the feature off entirely (`select
    UNSELECT_MMU_HAS_ESPOOLER`). Added the page to `mkdocs.yml`'s nav (new
    "Features" top-level section) and to the `index.md` card grid.
12. User review of that v1 draft produced six pieces of standing feedback
    (now folded into the decisions/template above, not just this page):
    fenced blocks need real colour (`` ```yaml ``, not `` ```ini ``/`` ```text ``);
    don't drop wiki illustrations (the Espooler UI screenshots were missing
    entirely); keep TIP/IMPORTANT callouts as real admonitions, not prose;
    Kconfig source syntax isn't reader-facing — show a menuconfig screenshot
    and the resulting `.cfg` instead; rename the two config sections
    "Hardware Setup"/"Parameter Setup"; and drop the v3-vs-v4 framing
    entirely, since v4 docs don't need to justify themselves against a
    version the reader may never have used. Also asked for a
    proofread-against-wiki + summary report before any future page is called
    done — see **Before finishing a Feature page** above.
13. Rewrote `Feature-Espooler.md` (v2) against that feedback: restored the
    `assist2.png`/`rewind2.png` UI screenshots plus the console status-text
    example, added `!!! tip`/`!!! warning "Important"` admonitions (discovered
    along the way that `!!! important` silently renders unstyled — Material's
    CSS has no such class, see the new bullet above), restored the
    `espooler_speed_exponent` worked numeric example and the five per-mode
    setup walkthroughs (Rewind/Assist/Basic-print/Intelli-assist×2) as a
    "Setting up each mode" subsection under Tuning, merged the old standalone
    "menuconfig" section into Hardware Setup, and cut every "the v3 wiki
    said..." aside. Added a real menuconfig screenshot for this
    (`doc_tools/shots.py`'s new `feature-espooler` session, capturing the
    "eSpooler pins" screen under "MMU Features / Additions" — confirmed the
    boxturtle seed already has it enabled, no scene setup needed).
14. Getting that screenshot's colour scheme to match required fixing
    highlighting for the whole site, not just this page — see the new
    **Zensical rough edges** entry: Material's normal `pymdownx.highlight` +
    `pymdownx.superfences` recipe hit the exact same non-deterministic
    build-cache bug already known from Mermaid, on *ordinary* code fences.
    Switched to `codehilite` + a hand-written CSS mapping in `extra.css`
    instead (deterministic across 6/6 test rebuilds) — every existing page's
    code blocks got real syntax colour as a side effect of this fix, not
    something that needed touching per-page.
15. Second round of user feedback on the v2 draft, six more items (all now
    folded into the decisions above): drop the "sync-feedback" qualifier from
    "filament buffer" (they're two different Kconfig options — also wrong the
    same way in `Reference-Printer-Variables.md`'s `filament_buffer` field, fixed
    there too); strip developer-jargon (class names, method calls) from
    reader-facing prose; drop the leading "everything below was read
    from..." provenance paragraph entirely; the pin-alias example in Hardware
    Setup doesn't reflect v4 at all (aliases were removed — pins are
    `unit_mcu_name:pin_name` directly); add the tri-colour H2 marker as a
    site-wide CSS template feature, not per-page; and retrofit the ASCII-art
    + copyright footer to every page. Also resolved the open question from
    item 11: "no v3 narrative" IS retroactive — retrofitted
    `Reference-Printer-Variables.md` (dropped "What changed since v3" and the
    servo/grip aside entirely; moved the servo/grip *finding* itself to
    `Dev-Code-Layout.md` rather than losing it, since that's a developer page
    where citing the exact gap is appropriate) down to keeping only
    deprecation notation, per explicit instruction ("the only notation I want
    in printer variables is whether the variable is deprecated").
16. Added the footer to `doc_tools/gen_command_reference.py`'s `render_page()`
    (not hand-edited into `Reference-Commands.md`, which regeneration would
    wipe), then ran `make command_reference` to pick it up.
17. Resolved the open question from item 15: user confirmed the
    no-developer-references rule is page-genre-wide, not just Feature pages.
    Stripped every `Mmu*.get_status()`/file-path/constant-name citation from
    `Reference-Printer-Variables.md` (see the updated bullet above for specifics) and
    simplified `Reference-Commands.md`'s generated intro (dropped
    `HELP_BRIEF`/`extras/mmu/`/the hand-edit warning — that belongs in
    `Dev-Doc-Tooling.md`, not here). Kept Klipper's own API surface
    (`printer.send_event(...)`, `printer.register_event_handler(...)`) since
    that's literally what a reader extending Happy Hare in Python needs to
    type, not narration of Happy Hare's own internals.
18. Two small footer polish requests: made the copyright line genuinely tiny
    (`0.6rem`, ~75% of body text) and switched the ASCII art from a
    ` ```text ` fenced block to bare `<pre>`/`<p>` with dedicated CSS classes
    (`.hh-footer-art`/`.hh-footer-copyright` in `extra.css`) so it renders as
    plain monospace text rather than a "code sample" box — see the updated
    footer decision above. Rolled out with the same find/replace approach
    across all 12 pages plus the generator.
19. **Moved this entire rewrite into its own repo, `Happy-Hare-Doc`** (see the
    new "separate repo" bullet at the top of Structure decisions). Split
    `doc_tools/capture.py`'s and `gen_command_reference.py`'s single
    `REPO_ROOT` into `DOC_ROOT` (this repo, for output — unchanged
    self-relative logic) and `HAPPY_HARE_SRC` (an env var pointing at a
    Happy-Hare checkout, for reading source) — both fail fast with a clear
    error if `HAPPY_HARE_SRC` is unset or doesn't look like a real checkout.
    `capture.py`'s `os.chdir()` before the menuconfig `execve` had to move
    from the old `REPO_ROOT` to `HAPPY_HARE_SRC` too — easy to miss, since
    Kconfig's serial-port glob and `KLIPPER_HOME` handling are absolute-path
    driven and don't obviously depend on cwd, but `install.sh`/`make
    menuconfig` always run with cwd = the Happy-Hare checkout root, and this
    now faithfully matches that. New `Makefile` in this repo owns the fetch
    (`fetch-source`/`clean-source` targets, pinned via the tracked
    `HAPPY_HARE_REF` file, currently `v4`) — `docs`/`docs_build`/`docs_preview`
    need none of it, confirmed by tracing that they only ever read
    already-committed `doc/*.md`, never Happy-Hare source. Added a GitHub
    Actions → Pages deploy workflow on that same basis (no source-fetch step
    needed there either). Happy-Hare's own repo had `doc/`, `doc_tools/`,
    `mkdocs.yml` and this file removed, plus the now-dead doc-related Makefile
    targets and the `.gitignore` `site/` entry.
20. Wrote `Conceptual-MMU.md` (§2), the first page outside §5/§10/§12 in this
    rewrite. Ran three research passes in parallel (against the
    `HAPPY_HARE_SRC`-fetched checkout, same as any other page) rather than
    porting the wiki's Type-A/B/C framing directly, since TOC.md already
    flagged that framing as not mapping cleanly onto v4:
    - **Sensor renames.** The wiki's "pre-gate"/"gate"/"post-gear" sensors
      are `mmu_entry_X`/`mmu_shared_exit`/`mmu_exit_X` in v4 - confirmed by a
      literal old→new mapping table in `mmu_sensor_manager.py`'s own
      backward-compat shim (`('mmu_pre_gate', SENSOR_ENTRY_PREFIX), ('mmu_gear',
      SENSOR_EXIT_PREFIX), ('mmu_gate', SENSOR_SHARED_EXIT)`). The wiki's
      standalone `collision` endstop no longer exists by that name - it's
      folded into an encoder-based extruder-homing *mode*
      (`extruder_homing_endstop: encoder`), not a separate endstop identifier.
    - **Vendor → selector mechanism.** Cross-checked `installer/mmu_types/Kconfig.*`
      against `extras/mmu/mmu_unit.py`'s `VENDOR_PROFILES` (both must agree,
      and did): Box Turtle/Night Owl/Angry Beaver/3MS/Quattro Box/KMS/EMU are
      all the gear-per-gate family; ERCF/Tradrack use a moving carriage +
      servo; BTT ViViD uses per-gate index switches; 3D Chameleon/MMX6/Low
      Rider are rotary; MMX/PicoMMU are servo-driven. The gear-per-gate +
      moving-carriage hybrid (old wiki's "purely theoretical" type-C) is real
      in code but not a default for any vendor yet - custom-MMU-only, and one
      variant of it (`LinearMultiGearServoSelector`) has no menuconfig path
      at all, config-file-only.
    - **Combiner/splitter has no code footprint at all**, in v3 or v4 - the
      old wiki's claim that "Happy Hare will ensure different units are not
      used at the same time" to protect a shared combiner has no backing
      anywhere in `extras/mmu/**` (confirmed by grepping for
      combiner/splitter/mutual-exclusion terms) - dropped rather than ported.
    - **Found and fixed a real bug while verifying EndlessSpool**: this
      session's own `Reference-Printer-Variables.md` had carried over the wiki's stale
      claim that `endless_spool_enabled` has a value `2` ("on + pre-gate
      sensor"). The real parameter is a strict 0/1 boolean everywhere it's
      read or written (`ParamSpec(..., limits=dict(minval=0, maxval=1))`,
      every consumer branches on it as a plain boolean) - fixed on that page
      too, not just avoided here.
    - Replaced the wiki's Type-A/B/C diagrams entirely rather than reusing
      them: they're raster PNGs with sensor labels baked in as pixels
      ("pre-gate", "gate" sensor), which would have re-published exactly the
      naming this page just corrected. ASCII diagrams (same convention as
      `Dev-Code-Layout.md`) with the correct v4 names instead.
    - Judgment call flagged for the user, not resolved unilaterally: the
      wiki's per-sensor prose was much more detailed (multi-paragraph
      Primary/Secondary Functions per sensor) than the one-line-per-sensor
      table this page ships. No other planned page currently owns that depth
      - compressed here to keep a *conceptual* page from reading like a
      reference page, but flagged rather than silently decided.
21. User pushed back on item 20's ASCII-diagram substitution - restored the
    real wiki diagrams on `Conceptual-MMU.md` (with a correction tip instead
    of a swap), except the three live sensor-list screenshots, which show
    real v3 console/UI output rather than an editable diagram - see the new
    "Reuse a wiki diagram..." decision above for where the line is drawn.
    Also did a round of general layout requests, all site-wide rather than
    per-page: Previous/Next footer nav (Zensical doesn't render Material's
    own - built client-side in `hh-page-nav.js` instead, off the
    already-rendered sidebar), a Discord footer icon (`extra.social`), and a
    taller header with a bigger logo + tagline (the tagline needed
    absolute-positioning off the site-name title block rather than growing
    that block directly - see the new decision above for why). Smaller
    footer ASCII-art font size too.
22. **Second layout-polish pass (2026-08-06), six more site-wide fixes** before
    resuming page-writing work:
    - **Fixed a real bug in item 21's tagline anchoring**: giving
      `.md-header__topic:first-child` `position: relative` (so the tagline
      `::after` could hang off it) broke Material's title-swap-on-scroll
      animation, which depends on BOTH `.md-header__topic` elements being
      `position: absolute` with no offset (so each defaults to the same
      "static" position and overlaps exactly, swapping via opacity+translateX
      only). Making the first one `relative` gave it real flow height again,
      which pushed the second topic's own static position down below it -
      the page title rendered in the tagline's spot instead of sliding into
      the site-name's spot on scroll. Fixed by anchoring the tagline
      `::after` to `.md-header__ellipsis` instead (already
      `position:relative` in Material's own CSS, never touched by the swap)
      and leaving both topics alone.
    - **Double separator above the footer**: the markdown `---` before the
      footer block renders an `<hr>`, and `.hh-page-nav`'s own `border-top`
      sat directly under it - two rules back to back. Dropped the
      `border-top` from `.hh-page-nav`; the `<hr>` alone is now the one
      separator (kept in markdown rather than the CSS rule, since it's the
      copy that still works with JS disabled).
    - **Footer ASCII art still read as "too big" even after item 21's
      font-size cut** - monospace-text sizing doesn't behave consistently
      enough across the box for one font-size value to reliably look small.
      Replaced the `<pre>` block with an inline SVG (`<text>` elements, one
      `width` on the wrapping `.hh-footer-art` class controls the whole
      thing via viewBox scaling) on all 13 pages plus
      `gen_command_reference.py`'s `render_page()` - same
      python-bulk-replace-across-files approach as the original footer
      rollout. Still theme-reactive (`fill: var(--md-default-fg-color--light)`)
      because it's raw inline SVG markup in the page, not a rasterised `<img>`.
    - **Prev/Next arrows**: `hh-page-nav.js`'s label strings changed from
      `"Previous"`/`"Next"` to `"‹ Previous"`/`"Next ›"`.
    - **Dropped the search box's `⌘K`/`Ctrl+K` shortcut hint** - it's a
      `.md-search__button::after` pseudo-element in Material's own CSS
      (`content: "Ctrl+K"`, overridden to `"⌘K"` under
      `[data-platform^="Mac"]`), not markup; `display:none` on the same
      selector plus shrinking the button's now-unused right padding.
    - **Widened the main content column**: `.md-grid`'s `max-width` (61rem
      -&gt; 75rem). That one class caps the header/main/footer row alike
      (confirmed via computed styles - all three `.md-grid` instances share
      it), and since both sidebars are fixed-width, all the extra room
      lands on `.md-content` specifically with no separate content-only rule
      needed.
    - **User caught three problems with the above in the same session, all
      fixed before moving on**:
      - The tagline fix still wasn't right - it rendered *below* the header's
        own black background instead of inside it. Root cause: the `::after`
        inherits the title block's line-height (sized for the 48px
        topic-swap box, to vertically-center "Happy Hare"), so its line box
        was ~48px tall regardless of its small font-size - the box, not the
        glyph, is what has to fit inside the header, and it didn't. Fixed
        with an explicit `line-height: 1` on the `::after`, plus bumping
        `.md-header__inner`'s `min-height` to 5.6rem so there's room for
        logo + title + tagline all stacked. Verified this one with
        `document.elementFromPoint` scans down the header rather than
        screenshots, since screenshots were the unreliable part (see the
        tooling note below) - a plain rect/coordinate check doesn't have
        that problem.
      - The inline-SVG footer (previous session's fix for "still too big")
        rendered with garbled/overlapping lines in the real browser -
        reverted to the original `<pre>` text approach, just smaller
        (0.7rem -&gt; 0.5rem) rather than debugging the SVG further, per
        explicit request.
      - Logo bumped again, 1.9rem -&gt; 2.8rem.
23. **Third layout-polish round (2026-08-06), same session**: a second
    `fontawesome/brands/github` entry in `mkdocs.yml`'s `extra.social`
    (pointing at the Happy-Hare repo) alongside the existing Discord one -
    the header already has a repo widget with star/fork counts, but that's a
    separate Material feature (`repo_url`) from the footer's social-icon
    row, and the ask was specifically for the latter. Nested "On this page"
    entries (H3s under an H2, etc.) get `font-size: 0.85em` - Material nests
    a second `nav.md-nav` inside the owning heading's `li.md-nav__item`, so
    "`.md-nav__link` inside another `.md-nav` that's itself inside a
    `.md-nav__item`" selects exactly the nested set; scoped to
    `.md-sidebar--secondary` since the *primary* left-hand page-list nav
    reuses the identical nesting pattern for sub-pages and wasn't supposed
    to change. (First tried `0.7em` - visibly more than "slightly" smaller,
    dialed back to `0.85em`.) The footer's `<pre>` art and copyright line
    were plain stacked siblings with no shared wrapper, so a bottom-aligned
    right-justified copyright needed one: wrapped both in
    `<div class="hh-footer">` (flex row, `align-items: flex-end`,
    copyright gets `margin-left: auto`) across all 13 pages plus
    `gen_command_reference.py`'s generator - same bulk-replace pattern as
    the earlier footer edits. Deliberately no `markdown` attribute on that
    wrapper div (unlike `<div class="grid cards" markdown>` on the home
    page) - the content inside is plain HTML with no markdown syntax to
    process, and adding it risked the ASCII art's backslash escapes getting
    reinterpreted.
    - **Tooling note for next time**: this session's browser-preview tool
      produced a real, reproducible artifact when taking a screenshot at any
      scroll position other than 0 on a page taller than the viewport
      (either a blank frame or a doubled/stacked composite) - confirmed it
      was the *tool*, not the site, by growing the viewport height until the
      whole page fit at `scrollY=0` (`resize_window` + a short page) and
      getting a clean render every time that condition held. If a future
      session hits the same blank-screenshot symptom, resize taller before
      assuming the CSS is broken.
24. **Second Feature page: `Feature-Encoder.md`** (§5, second page to use the
    template after eSpooler). Source is `wiki/Clog-Runout-EndlessSpool.md`,
    but that wiki page is a *combined* v3 page covering five topics - only
    three belong here:
    - **Ported/verified here**: the "Optional Encoder", "Clog Detection", and
      "Flowrate Monitoring" sections.
    - **Deliberately routed elsewhere, not dropped**: "Runout Detection" and
      "EndlessSpool" (+ "Designated Waste Gate") belong to
      `Feature-Endless-Spool-Runout.md` (still open, no dedicated Kconfig) -
      this page doesn't touch sensor-driven runout/EndlessSpool at all.
    - Deep clog/tangle/runout *tuning* stayed a one-paragraph pointer rather
      than a full port, since that logic now lives behind a genuinely
      separate Kconfig (`Kconfig.flowguard`) and gets its own future page,
      `Feature-FlowGuard.md` - mentioned by parameter name only
      (`flowguard_encoder_mode`, `flowguard_encoder_max_motion`), no link,
      since the page doesn't exist yet and Zensical fails the build on a
      dangling one.

    Stale wiki content found and corrected rather than ported: `MMU_ENCODER
    ENABLE=0` doesn't exist in v4 (the real command only takes
    `POS`/`VALUE`/`QUIET` - encoder-based detection is switched on via
    `flowguard_encoder_mode` instead, not an ENABLE flag on the encoder
    itself); `encoder_clog_detection_enabled` is now `flowguard_encoder_mode`;
    the persisted calibration variable is `mmu_encoder_clog_length`, not the
    wiki's `mmu_calibration_clog_length`; and the `MMU_ENCODER` sample output
    block was replaced with the real v4 format (confirmed directly against
    `commands/mmu_encoder.py`'s `show()` output - "FlowGuard/Runout:
    Active/Inactive/Off", not "Runout detection: Disabled"). The wiki's
    `MMU_SENSORS` output block (`mmu_gate`, `mmu_pre_gate_N`) was **not**
    reproduced anywhere on this page - those are the exact pre-v4 sensor
    names `Conceptual-MMU.md` already corrected, and republishing them here
    would undo that.

    Two numbers were verified against the shipped config template rather
    than the code fallback, since they differ: `desired_headroom` ships as
    `5.0` in `mmu_hardware.cfg` even though the code default is `6.`; the
    template has no `detection_length` line at all (it's runtime/FlowGuard-only), so
    no default is claimed for it. `no_movement_samples: 10` is stated as "10
    consecutive samples" with no derived duration - the shipped comment's own
    arithmetic ("default sampling rate is 0.1s so 10=0.5s") doesn't reconcile
    (10 × 0.1s = 1.0s), so a duration wasn't invented to match it.
    `Kconfig.encoder`'s two resolution-derivation comments
    ("23.5mm rotation distance BMG gear" vs. `mmu_hardware.cfg`'s
    `24 / (2 * teeth)`) don't reconcile with each other either - the page
    shows only the resulting defaults table, not a formula.

    Reused `wiki/Synchronized-Gear-Extruder/Encoder_Meter.png` (copied to
    `doc/Feature-Encoder/encoder-meter.png`) as the "Printer variables
    exposed" UI illustration - checked first that it's safe to reuse per the
    diagram-reuse rule above: it's an annotated explainer (callout boxes over
    a real widget), and its callout labels already use the real v4 parameter
    name `flowguard_encoder_max_motion`, so no correction was needed.

    No menuconfig screenshot: confirmed `Kconfig.box_turtle` (the seed used
    by every existing screenshot session) doesn't select `MMU_HAS_ENCODER`,
    so the whole "Encoder config" menu is hidden without extra scene setup
    that wasn't done this session - omitted rather than silently faked.
25. **Fixed a footer regression from wrapping the art+copyright in
    `.hh-footer` (item 23)**: `hh-page-nav.js` inserted the Previous/Next nav
    "before `.hh-footer-art`", which used to mean "as a block sibling above
    the footer" back when the art and copyright were plain stacked siblings
    - but `.hh-footer-art` is now a flex child *inside* `.hh-footer`, so the
    nav landed as a third flex item in that same row instead, pushing the
    art/copyright to its right. Fixed by anchoring the JS on `.hh-footer`
    itself and inserting the nav before *that*, restoring it as a proper
    block sibling above the row. Caught by the user on `Feature-Encoder.md`;
    fix applies site-wide since it's the shared script.
26. **Footer spacing/size tweak, same session**: copyright font-size
    `0.6rem` -&gt; `0.45rem` (even smaller); `.hh-page-nav`'s `margin`/
    `padding-top` reduced (`1.5rem`/`1rem` -&gt; `0.5rem`/`0.5rem`) to pull the
    Previous/Next row closer to the `<hr>` above it; `.hh-footer`'s
    `margin-top` reduced (`1rem` -&gt; `0.4rem`) to pull the art/copyright row
    closer to Previous/Next above *it*.
27. **Fixed a real pin-alias slip on `Feature-Encoder.md`**: the example
    `[mmu_encoder unit0]` block had `encoder_pin : ^unit0:MMU_ENCODER` -
    `MMU_ENCODER` is a v3-wiki-style symbolic alias, not a real pin (compare
    `wiki/Hardware-Configuration.md`'s `encoder_pin: ^mmu:MMU_ENCODER`, which
    is exactly where this got half-copied from). v4 pin values are always
    fully-qualified `unit_mcu_name:pin_name` strings, per the "Pin aliases
    don't exist in v4" decision above - fixed to `^unit0:PA3`, matching the
    `unit0:PA0`-style pins already used on `Feature-Espooler.md`. Worth
    grepping any future page's example `.cfg` blocks for a bare symbolic name
    where a real pin should be, since this is an easy slip to reintroduce.
28. **Second Getting Started page: `GettingStarted-ViViD.md`.** BTT ViViD
    is a fully-specified type (`installer/mmu_types/Kconfig.vvd`) - LEDs,
    dual-sensor environment monitoring, heater, per-gate NFC readers, and the
    indexed selector are all `select`ed unconditionally, and `BOARD_TYPE`/
    `PARAM_NUM_GATES` are fixed defaults with no prompt, unlike a modular
    design. The one part that genuinely needs the reader's own input - and
    the reason this page exists rather than just a comparison-table row - is
    that a ViViD unit and its optional buffer board
    (`installer/boards/custom/Kconfig.vvd`'s `OPTION_VVD_BUFFER`, `imply`'d
    on by default) are two independent MCUs, each surfaced as its own
    "Select serial device for ..." menuconfig screen
    (`installer/connection/Kconfig.mmu_mcu` /`Kconfig.buffer_mcu`). Traced
    those screens down to the actual shell macro
    (`serial_device`/`mmu_serial_config`/`buffer_serial_config` in the root
    `installer/Kconfig`) that lists live `/dev/serial/by-id/*` devices
    filtered by `Klipper_<chip>` and lets the user pick by literal device
    name - confirming the user's claim that BTT's own naming (`vivid` vs
    `buffer` in the device string) is what makes the two screens obvious to
    tell apart, not any Kconfig-side chip-specific filtering (the filter
    pattern used for both screens is the generic substring `stm32`, matching
    either board - a `# PAUL TODO add chip as filter` comment in both
    `Kconfig.mmu_mcu`/`Kconfig.buffer_mcu` confirms this is a known, not-yet
    tightened gap upstream, which is exactly why picking the right one by
    name still matters).
    - **No real screenshots at all, this round**: confirmed via
      `doc_tools/capture.py`'s own header comment that `/dev/serial/by-id/*`
      is globbed live and "cannot be overridden" for reproducibility - a
      captured screenshot would show whatever's plugged into the capturing
      machine, not the illustrative device names the user actually asked to
      document. Used console-block text (`text` fences, not screenshots) for
      every menuconfig screen on this page instead, consistent with the
      user's own "should be quite simple" framing. Revisited next session
      once the user asked for captures after all - see item 29.
    - **Toolhead selection and the Spoolman NFC auto-create example** are
      both generic, non-ViViD-specific Kconfig options (same ones
      `GettingStarted-BoxTurtle.md` uses) - written fresh rather than
      copy-pasted, but deliberately parallel in structure. Caught and fixed
      one own mistake before finishing: first draft implied **Select
      spoolman spool manager support** defaults to `Push` for ViViD - it
      doesn't; the default is `Off` regardless of MMU type (checked
      `Kconfig.options` directly), ViViD's built-in NFC readers just make
      turning it on worthwhile.
    - **The `./install.sh` / `./install.sh -i` sections are intentionally
      near-verbatim copies** of `GettingStarted-BoxTurtle.md`'s own
      wording, per explicit request to include that text on this page too
      rather than just cross-reference it - this is genuinely
      installer-universal behaviour, not something to vary per MMU type.
    - **No new `index.md` card**: the "Card grid needs a new entry every
      time a section gains its first page" rule doesn't apply here - Getting
      Started already has its first card (pointing at the Box Turtle guide),
      so a second page in the same section doesn't get a second card.
29. **Added real menuconfig screenshots to `GettingStarted-ViViD.md`
    after all**, per explicit follow-up request - a new `getting-started-vivid`
    session in `doc_tools/shots.py` (seed `'none'`, same first-run approach as
    `getting-started-boxturtle`), 7 images: MMU Type (BTT ViViD + its buffer
    sub-option), Board type, the MMU and Buffer MCU-connection submenus, MMU
    Features/Additions, Toolhead, and the Spoolman NFC auto-create screen.
    Two real Kconfig-navigation mistakes surfaced and got fixed by actually
    running the capture rather than assuming the menu tree from reading
    Kconfig source alone:
    - The buffer's connection submenu's own internal choice prompt is `"MCU
      connection for sync-feedback buffer"`, but the enterable *menu* wrapping
      it (what the reader actually sees and types to reach it from the top
      level) is titled **`Buffer MCU connection`** - a different string.
      `mc.enter('MCU connection for sync-feedback buffer')` from the top menu
      reliably failed to find that text at the top level; fixed by entering
      `'Buffer MCU connection'` instead, then finding the inner prompt one
      level down. Same distinction already existed for the MMU side (top
      menu says `MCU connection`, which happens to equal its own inner
      choice's prompt too, by coincidence, not because it's the same
      pattern) - it just wasn't visible as a *distinct* name until the buffer
      side exposed it.
    - `"Spoolman"` in the Kconfig source is a `comment` (a plain section
      divider on the **Software Options** screen), not a `menu` - it isn't
      enterable at all. `mc.enter('Spoolman')` doesn't error on the comment
      itself; menuconfig's substring search instead landed the cursor on the
      *next* row containing the same substring - the **Auto-create...**
      checkbox further down the same screen - and pressing Enter on a bool
      item toggles it rather than opening a submenu, so the checkbox silently
      flipped on as a side effect before the real failure (waiting for a
      breadcrumb change that could never come) surfaced. Fixed by dropping
      the `enter('Spoolman')` step entirely - the target checkbox is
      selectable directly on the **Software Options** screen already reached
      one level up.
    - Also corrected the page's prose to match what the real screens showed
      rather than what reading the Kconfig source alone implied: "MCU
      connection" and "Buffer MCU connection" are each a *two-row submenu*
      (connection type + resolved device), not a flat Serial/CANbus toggle;
      and `MMU Features / Additions` fixes on more than LEDs/environment
      sensor/heater/NFC - the sync-feedback buffer is fixed on too (supplied
      by the buffer board), the old-style catchment filament buffer is fixed
      *off* (superseded by it), and fans/eject-buttons/encoder are the
      screen's only genuine off-by-default options for this design.
    - Still deliberately NOT captured: the two "Select serial device for
      ..." list screens themselves - unchanged reasoning from item 28, this
      machine has nothing plugged in so they'd show an empty list, not the
      illustrative device names. The two submenu screens captured instead
      (showing the connection-type row and the resolved "Other / manually
      entered" device row together) are the reproducible part of that same
      story.
30. **Third Feature page: `Feature-Endless-Spool-Runout.md`** - the other
    half of `wiki/Clog-Runout-EndlessSpool.md` (Runout Detection + EndlessSpool
    + Designated Waste Gate sections; the encoder-specific sections went to
    `Feature-Encoder.md`, see item 24). No dedicated Kconfig source, so
    verification meant reading the actual decision logic in code rather than
    a `.cfg` template:
    - **Clog/tangle vs. genuine runout is a real, code-level distinction**,
      not just wiki framing: Happy Hare checks the fitted switch sensors
      first, and only if they're inconclusive *and* an encoder is fitted
      does it nudge the gear motor and watch for encoder movement to settle
      the question. Clog/tangle always pauses regardless of EndlessSpool;
      EndlessSpool only ever acts on a confirmed runout. This is stated
      as plain fact on the page, not attributed to "the code" anywhere -
      per this session's explicit no-code-references instruction, on top of
      the standing page-genre-wide rule.
    - **Stale wiki content corrected, not ported**: `encoder_clog_detection_enabled`
      references (that content now lives on `Feature-Encoder.md`, not this
      page, so not even mentioned here); the wiki's combined
      `MMU_ENDLESS_SPOOL`+gate-status console example was replaced with the
      real, much simpler output (`EndlessSpool Groups: / Group A: Gates: ...`)
      - groups are set with numbers but reported back as letters (`0`→`A`,
        `1`→`B`, ...), confirmed directly in the formatting logic.
      - `MMU_TEST_RUNOUT` now takes an optional `TYPE=runout|clog` - the wiki's
        plain no-argument form still works but doesn't demonstrate the
        clog path.
    - **A real, easily-missed behaviour found by reading the eject-gate code
      path, not the wiki**: `endless_spool_eject_gate` is checked with `> 0`,
      so gate `0` can never be the designated waste gate through this
      setting - only gates numbered `1` and up. Stated as a plain usage rule
      on the page ("must be `1` or higher") rather than a caveat, since a
      reader hand-editing this value needs to know it either way.
    - **Image**: skipped `wiki/Quick-Start-QuattroBox/quattrobox_endless.png`
      and `wiki/Installation/questions_endless.png` deliberately - both are
      screenshots of the old v3 line-by-line install wizard (`Enable clog
      detection (y/n)?` prompts), a UI that no longer exists in v4's real
      menuconfig. Captured a fresh, real menuconfig screenshot instead (new
      `feature-endless-spool-runout` session in `doc_tools/shots.py`, plain
      boxturtle seed - this section isn't MMU-type-specific so needed no
      scene setup, same shape as the `feature-espooler` session).
    - **Waste-gate incompatibility claim softened**: the wiki flatly asserted
      "may be incompatible with type-B or C MMU designs." No such check
      exists in code either way, so the page states the real underlying
      requirement instead (a selector that can be commanded to visit an
      arbitrary gate on demand) and lets the reader judge their own design
      against it, rather than repeating an unverifiable type-letter claim.
31. **Fourth Feature page: `Feature-Sync-Feedback-Buffer.md`.** Source wiki
    page (`wiki/Synchronized-Gear-Extruder.md`) is unusually large and
    already uses v4 terminology throughout (FlowGuard, AutoTune,
    `mmu_vars.cfg`) - still verified everything against real code rather
    than trusting that, and found real gaps anyway:
    - **The wiki's `[mmu_sensors]` section name is wrong for v4** - the real
      generated section is `[mmu_buffer <unit_name>]` (confirmed directly in
      `config/base/mmu_hardware.cfg`), analogous to `[mmu_encoder ...]` and
      `[mmu_espooler ...]`. The wiki's `sync_feedback_tension_pin`/
      `sync_feedback_compression_pin` key names are wrong too - the real keys
      are plain `tension_pin`/`compression_pin` inside that section. Kept the
      wiki's `Typical_Buffer.png` diagram (it's an annotated, editable
      diagram, not live output - same reuse rule as `Conceptual-MMU.md`) but
      added a corrective note under it for exactly this key-name mismatch,
      rather than silently republishing the wrong keys as an image caption
      with no counter-signal in the text.
    - **`sync_gear_current`'s real default is `100`**, not the wiki
      example's `50` - confirmed in `Kconfig.motor_sync`.
    - **The wiki's `MMU_QUERY_PSENSOR` command doesn't exist in v4** - raw
      proportional-sensor readings are now reported by the general
      `MMU_SENSORS` command instead (confirmed directly in its output
      formatting code, which special-cases the proportional sensor to show
      both normalised and `(raw: ...)` values). Not ported.
    - **Scope boundary held firm**: FlowGuard's clog/tangle detection,
      tangle-prevention current boost, and the whole telemetry/tuning
      section (`sync_feedback_debug_log`'s plot script, interpreting
      telemetry, the AutoTune simulation plots) all stayed off this page,
      on the same "own Kconfig, own future page" reasoning as
      `Feature-Encoder.md`'s FlowGuard boundary (item 24) - mentioned only
      by parameter name (`flowguard_enabled`, `flowguard_max_relief`,
      `tangle_prevention_enabled`), no link, no deep dive. Confirmed via a
      live menuconfig dump that "FlowGuard (clog/tangle/runout detection)"
      is in fact its own separate submenu (`Other Settings → FlowGuard`),
      not nested under sync-feedback at all - the boundary is real, not
      just a documentation convenience.
    - **Images**: reused `Sync_Feedback_Meter.png` (an annotated diagram,
      same style and already-correct-param-names pattern as
      `Encoder_Meter.png` on `Feature-Encoder.md`) plus two small UI-icon
      images (`Switch_Based_Sensor_Compressed.png`, `P_Sensor_Position.png`)
      with no naming issues. Skipped `FilamentStatus.png` deliberately - a
      real Mainsail/Fluidd screenshot with "Pre-Gate"/"Gate" labels baked in,
      the exact pre-v4 sensor names `Conceptual-MMU.md` already corrected.
      Skipped every FlowGuard simulation/telemetry plot as out of scope for
      this page (see above), not because of any staleness issue with them.
    - **Real menuconfig screenshots** (`feature-sync-feedback-buffer`
      session, boxturtle seed - already ships a dual-switch Turtle Neck v2
      buffer, so no scene setup needed) for **Buffer config** and
      **Other Settings → MMU/Extruder sync**. The second screen only shows
      the buffer-feedback toggle and gear current on this seed - Box
      Turtle's gear-per-gate design always grips filament, so the
      `sync_to_extruder`/`sync_form_tip`/`sync_purge` toggles (genuine
      choices on a design that can release its grip) don't even appear -
      confirmed live rather than assumed, and stated as fact on the page
      with the screenshot cited as the example of the forced-on case.

32. **Split the planned single `Feature-NFC-Spoolman.md` into two pages**,
    `Feature-Spoolman.md` and `Feature-NFC.md`, per explicit request -
    Spoolman is a pure software/Moonraker integration with no Kconfig of its
    own, while NFC is genuinely new v4 hardware-reader surface, and the user
    wanted them cross-referencing each other rather than one combined page.
    Both are code-verified, not ported uncritically - see the §5 table
    entries above for the specific corrections found in each (stale gate-map
    status labels and a wrong/misplaced parameter name on the Spoolman page;
    the RC522-only homing-endstop caveat on the NFC page). `Feature-Spoolman.md`
    deviates from the template's "Hardware Setup" section name (retitled
    "Moonraker Setup", since there's no physical hardware to wire) - flagged
    for the user rather than silently decided, since every other Feature
    page so far has had real hardware. The wiki's four Mermaid sequence
    diagrams (one per `spoolman_support` mode) were initially dropped in
    favour of plain numbered steps under Tuning, since ` ```mermaid ` fences
    don't render reliably on this site (see **Zensical rough edges**) - later
    re-introduced by explicit request; see item 33 below. `Feature-NFC.md` is marked **beta**
    on the page itself, matching the Kconfig's own tag. Added both to
    `mkdocs.yml`'s nav; no new `index.md` card (Features already has one).

33. **Follow-up, same day: ERCF shared-reader screenshot on `Feature-NFC.md`,
    and Mermaid diagrams re-introduced on `Feature-Spoolman.md`, both by
    explicit request.**
    - The NFC screenshot half is fully done and verified: added an `ercf`
      seed to `doc_tools/capture.py`'s `BUILTIN_SEEDS`, a `_feature-nfc` scene
      to `doc_tools/shots.py` (toggles "Has NFC reader(s)" then "Has common
      NFC reader?" under the ERCF seed rather than the default Box Turtle —
      ERCF's moving-carriage/servo design fits "present one spool to one
      shared reader by hand" better than Box Turtle's gear-per-gate layout,
      matching how the page frames a shared reader), captured
      `doc/Feature-NFC/shared-reader-config.png`, and added it to the
      Hardware Setup section with explanatory prose.
    - The Mermaid half: item 32 above dropped the wiki's diagrams because
      ` ```mermaid ` fences hit the incremental-build-cache bug in
      **Zensical rough edges**. Re-introducing them here uses a different
      mechanism specifically to dodge that bug — raw `<pre class="hh-mermaid">`
      HTML (passed through untouched by the already-enabled `md_in_html`
      extension, so there's no fence-extraction step to race on), rendered
      client-side by `doc/assets/javascripts/hh-mermaid.js` against a
      pinned-version Mermaid v10 CDN script (`mermaid@10.9.1`, not a floating
      major tag) added to `mkdocs.yml`'s `extra_javascript`. **Verified
      rendering correctly, 6/6 diagrams with zero error placeholders, across
      5 separate loads (fresh tabs and same-tab reloads) plus one real
      in-app instant-navigation link click (not just a hard reload)** - see
      `doc/Feature-Spoolman.md`'s Tuning section. Getting there surfaced
      three real, distinct bugs, not one:
        1. **Mermaid's own bundled auto-render steals `class="mermaid"`
           nodes before this file's `mermaid.initialize({startOnLoad:
           false})` call can take effect** - the CDN script self-registers
           a DOMContentLoaded auto-render at load time, before
           `hh-mermaid.js` (loaded after it) runs at all, so by the time our
           code executes, auto-render has often already grabbed the nodes,
           started an async render, and lost the layout race below with
           nothing listening to retry it - confirmed directly by checking
           `document.querySelectorAll('pre.mermaid')` immediately on a
           fresh load and finding 0 (already converted and emptied). Fixed
           by never using `class="mermaid"` at all - diagrams use
           `class="hh-mermaid"` instead (styled to match via
           `doc/assets/stylesheets/extra.css`'s `.hh-mermaid` rule, since
           Material's shipped CSS only styles `.mermaid`), and
           `hh-mermaid.js` passes those nodes to `mermaid.run({nodes})`
           explicitly. This also means mermaid's own `data-processed`
           bookkeeping (tied to its own auto-scan) isn't something to rely
           on for a differently-named class - the script tracks
           processed-state itself via its own `data-hh-processed` attribute.
        2. **Material's `document$` observable fires more than once per
           load**, and calling `mermaid.run()` the instant it fires
           reliably loses a race against the browser's own layout of the
           just-swapped content — thrown outright (`Cannot read properties
           of null (reading 'getBBox')`) on an immediate call, or, just as
           often, swallowed internally by Mermaid itself and rendered as its
           own silent `aria-roledescription="error"` placeholder SVG instead
           of a real diagram, with no thrown error and no build warning
           either way (confirmed independently: `mermaid.parse()` said the
           exact source that produced a placeholder was syntactically valid,
           and a manual `mermaid.run()` moments later rendered the same
           source correctly). **Checking for `svg` presence alone is
           therefore not a valid render-success check** — check
           `svg[aria-roledescription="error"]` specifically. Mitigated with
           a real async readiness signal (`document.fonts.ready` + double
           `requestAnimationFrame`) before the first render attempt, a
           window-scoped serial queue (`window.__hhMermaidQueue`, not a
           script-local closure variable — this script's own top-level code
           was directly observed executing more than once against the same
           `window`/DOM, and a closure-local queue only serializes firings
           within its own execution, not against a second execution's
           queue), and explicit error-placeholder detection with one retry
           pass.
        3. **`requestAnimationFrame` never fires while a page is hidden**
           (backgrounded/inactive tab, per the Page Visibility API) - the
           double-rAF readiness signal from fix 2 hung indefinitely, with
           zero console output, whenever this happened. Confirmed directly:
           `document.hidden === true` on an affected tab, and a bare
           `requestAnimationFrame` call left permanently pending in that
           state. This isn't just a test-tool quirk — a real user who opens
           the page in a background browser tab would hit the identical
           stall. Fixed by racing the double-rAF against a 300ms fallback
           `setTimeout` in `hhMermaidReady()`, so the readiness gate can
           never hang forever regardless of tab visibility.
      Left in per the user's own explicit instruction to try it anyway
      ("even if they don't always render .. if I see a problem I will
      comment them out and replace with images") - that fallback ended up
      not being needed, but if a diagram ever does render broken for a real
      reader, note `doc/Feature-Spoolman/` only holds the wiki's UI
      screenshots reused elsewhere on the page, not pre-rendered images of
      these diagrams — a static-image fallback would need those re-exported
      from the wiki's original Mermaid source first.

34. **Follow-up, same day: made every Mermaid diagram legible in dark mode,
    and rewrote `index.md` (the Home page) from scratch**, both by explicit
    request.
    - The Mermaid fix, in two passes. First pass: item 33's diagrams were
      unreadable in dark mode - Mermaid's default theme hard-codes dark
      text/lines calibrated for a light page, and the SVG itself has no
      background of its own, so dark scheme showed dark text directly on
      the site's own dark background. Fixed with one rule in
      `doc/assets/stylesheets/extra.css`
      (`.hh-mermaid { background: #fff; ... }`), unconditionally on both
      schemes, rather than re-theming Mermaid itself - simpler, and doesn't
      need hh-mermaid.js to re-render on every palette toggle. Verified past
      the obvious trap: checking only the container's own
      `background-color` would have missed a real bug - Mermaid's default
      theme fills actor boxes with a pale `#ECECFF`, which reads as "light
      color, might be a dark-mode leak" out of context. Checked the actual
      painted glyph color instead (`getComputedStyle(tspan).fill` on a real
      label, in a tab confirmed via
      `document.body.getAttribute('data-md-color-scheme') === "slate"`) and
      got solid black text - the pale fill is the actor box background by
      design, sitting fine on the forced-white card, not a leftover dark-
      scheme color.
      Second pass, same day: user pointed out a white card in the middle of
      a dark page still doesn't *look* like it belongs - asked for a real
      dark background with light text/lines instead of light-mode-colours-
      on-a-white-island. Landed on a CSS filter rather than a second Mermaid
      render: `[data-md-color-scheme="slate"] .hh-mermaid { filter:
      invert(1) hue-rotate(180deg); }`, layered on top of the always-white
      card from the first pass. `invert(1)` alone flips the white
      background to black and dark text to light, but also drags Mermaid's
      one non-grey colour (the pale lavender `#ECECFF` actor-box fill)
      through a hue flip into a sickly yellow-green; `hue-rotate(180deg)`
      un-rotates exactly that shift, landing back on a dark, still
      lavender-tinted box instead. Verified against a real diagram's actual
      SVG markup pulled out of a live page (not a hand-built approximation)
      rendered standalone in an isolated test document side-by-side with
      the unfiltered version, and again in the real page by firing
      Material's own palette toggle (`input[name="__palette"]`) rather than
      just setting the attribute by hand - light scheme still shows the
      plain white card with no filter (`getComputedStyle(...).filter ===
      "none"`), dark scheme shows the inverted one. Not the literal Mermaid
      "dark" theme's exact palette, but a legible, on-brand dark-mode
      equivalent of this site's own light-mode diagrams, with no re-render
      needed on toggle.
    - The Home page: previous version (v1, see the §1 table entry above) was
      an explicit placeholder - "under construction," a stale 4-page card
      grid, no real content. Rewritten using `wiki/Home.md` and the actual
      Happy-Hare repo's `README.md` (`.happy-hare-src/README.md` when
      cloned locally - not this doc repo's own `README.md`, which is about
      building *this site*, not about Happy Hare itself) as source
      material, per explicit request. Specific content decisions:
        - Dropped the wiki's "Organization" section entirely (flagged by the
          user as incorrect) rather than trying to correct it in place - its
          job (which vendor uses which selector mechanism) is already done
          correctly and in more depth by `Conceptual-MMU.md`'s "Which
          vendors use which mechanism" table, so Home now just links there
          instead of maintaining a second, competing hardware list.
        - Dropped the wiki's Carrot Collective / TradRack Discord mention
          from "Getting help" (flagged by the user as old) - kept the main
          Happy Hare Discord and GitHub issues only.
        - Dropped README's donation appeal/paragraph and the personal
          "my setup" poem/photo (`my_voron_and_ercf.jpg`) - neither serves
          orientation, which is this page's one job per the request.
        - **Card grid rule changed**: v1's grid added one card the first
          time each *page* landed, which is why Reference had two separate
          cards (`Reference-Commands.md`, then `Reference-Printer-Variables.md`) while
          Concepts had none at all despite `Conceptual-MMU.md` existing for
          days. v2 is one card per top-level *nav section*, matching
          `mkdocs.yml`'s nav exactly - adding the tenth Feature page won't
          need touching this again, only a genuinely new top-level section
          will (as happened later, when `Advanced Customization` landed -
          see item 39 - bringing the count to 6). See the updated §1 table
          entry above.
        - **Splash images**: three photos from the wiki's `resources/`
          (`universal_mmu_driver.png`, `my_klipperscreen.png`,
          `example_mmu_print.png`) - none are technical labeled diagrams, so
          the "reuse editable diagrams, skip stale real-output screenshots"
          rule doesn't bite here; these are just photos/UI collages used for
          orientation, not documentation of specific current field names.
          Re-encoded as JPEG and downsized before committing though (source
          PNGs were phone-camera-sized, ~4MB each for the two photos -
          `sips -Z <width> -s format jpeg -s formatOptions 82`, following
          `doc/index/` for the folder name per the established
          page-name-matched-folder convention, same as every `Feature-*`
          page's own image folder). Total added to the repo: ~800KB across
          all three, versus ~6.4MB for the untouched source PNGs.
        - Added a short "How this site is organized" section (Getting
          Started / Concepts / Features / Reference / Developer Guide, what
          each is for) plus the `MMU_LIKE_THIS`/`like_this.cfg`/
          `printer.mmu.like_this`/warning-vs-tip notational conventions -
          this is genuinely new content, not ported from either source;
          the user asked for "conventions and norms" and neither the wiki
          nor the README had anything like it since neither was written as
          a multi-page site with its own house style.
        - Kept (trimmed) the wiki's "browser plugin" analogy for what Happy
          Hare conceptually is - still accurate, still a good non-technical
          explainer, not something either source deprecated.

35. **Fifth Feature page: `Feature-Environment-Manager.md`**, first of a
    ten-page batch to finish out §5 in one continuous push. Before writing
    any of the ten, did a routing pass to resolve overlaps up front rather
    than discovering them mid-page (see the §5 table's updated Wiki-source
    annotations for `Feature-Tip-Forming-Purging.md` and
    `Feature-Addon-Integrations.md` above) - the most consequential finding
    was that EREC and Blobifier (two of `Addon-Feature-Setup.md`'s four
    addons) are now native `Kconfig.tip_shaping`/`Kconfig.purging` features
    with real generated `mmu.cfg` sections, not third-party
    `[include mmu/addons/...]` files, so they belong on
    `Feature-Tip-Forming-Purging.md` instead - caught before either page was
    drafted, avoiding a rewrite later. Research for the remaining nine pages
    was dispatched to parallel background agents up front (each briefed to
    read the wiki source, the real v4 Kconfig/code, and check for overlap
    with already-written pages) so page-writing could proceed continuously
    rather than serially blocking on one research pass at a time.

    For Environment Manager itself: the wiki page's title undersells its own
    scope - it's actually the heater/drying manager, with the environment
    sensor as just its temperature/humidity input - so this page covers both
    `Kconfig.environment_sensor` and `Kconfig.heater` rather than splitting
    sensor-only content into its own page, confirmed by both being sourced
    under the same **MMU Features / Additions** menu. Code-verified against
    `unit/mmu_environment_manager.py` and `commands/mmu_heater.py`; found and
    fixed: the real default-humidity key is `heater_default_dry_humidity`
    (wiki: `heater_default_humidity`), `heater_max_temp` ships as `65` (wiki
    example: `70`), spool rotation during drying reuses the espooler's
    *rewind* burst power/duration directly rather than a separate "rotate"
    burst setting defaulted from "assist" as the wiki claimed (no such
    setting exists in code at all), and `MMU_HEATER STOP=0` - the wiki's own
    suggested way to turn a raw-set heater back off - is actually a no-op;
    `STOP=1` is required. While verifying `drying_state` against the real
    `DRYING_STATE_*` constants, also fixed a stale line on
    `Reference-Printer-Variables.md` itself: the not-in-a-cycle value is `''` (blank),
    not the literal word `none`, and the real "cancelled" spelling in code is
    `canceled` (one L) - a small drive-by fix on an already-"done" page,
    directly motivated by writing this one. Added a new
    `feature-environment-manager` `doc_tools/shots.py` session (boxturtle
    seed, toggling both features on via scene setup since neither is
    selected by default on that seed - same toggle-then-autofit pattern as
    `_feature_nfc`) for two real menuconfig screenshots. Reciprocal link
    added on `Feature-Espooler.md`'s "See also" (replacing its previous
    forward-reference-by-name to the not-yet-written page) now that this
    page exists to link to.

36. **§5 Features section finished - all 16 pages now done**, closing out
    the ten-page batch item 35 started. In write order after Environment
    Manager: LEDs, Gate/TTG Maps, Statistics & Consumption Counters, State
    Persistence, Filament Bypass, G-code Preprocessing, Tip Forming and
    Purging, Addon Integrations, and FlowGuard (written last, by design -
    its entire scope came from what `Feature-Encoder.md`/
    `Feature-Sync-Feedback-Buffer.md` had already deferred, not a wiki
    source). Research for all ten pages was front-loaded via parallel
    background agents (one per page, each briefed to read the wiki source,
    the real v4 Kconfig/code, and check for overlap with pages already
    written) before any page was drafted, so writing could proceed
    continuously rather than blocking on research page-by-page.

    Real bugs/discrepancies found that are worth knowing about even outside
    the specific page that caught them (full detail in each page's own §5
    row above):
    - **`MMU_REMAP_TTG` doesn't exist in v4** - the real command is
      `MMU_TTG_MAP`; the old name only survives as descriptive text inside
      that command's own help string.
    - **A recurring file-vs-section-name trap**: several settings the wiki
      (and in a few cases Happy Hare's own shipped `.cfg`/macro comments)
      place in "`mmu_parameters.cfg`" actually live in the Klipper
      `[mmu_parameters]` section, which is physically defined inside
      `mmu.cfg` - the file literally named `mmu_parameters.cfg` generates a
      per-unit `[mmu_unit_parameters ...]` section instead. Hit on the
      Environment Manager, Statistics, State Persistence, Tip
      Forming/Purging, and Filament Bypass pages independently - worth
      double-checking on any future page citing that filename.
    - **"Shipped template default overrides the Python code fallback"
      pattern recurred twice more** (first seen on `desired_headroom`,
      pre-dating this batch): `flowguard_max_relief` ships as `40` via
      Kconfig even though the `ParamSpec` fallback is `8.0`, and
      `heater_vent_macro` ships as `_MMU_VENT` even though the fallback is
      `''`. Confirmed both via real menuconfig capture rather than trusting
      either source alone - worth the same care on any still-open page
      that quotes a "default."
    - **`MMU_HEATER STOP=0` and `MMU_RESET` (no `CONFIRM=1`) are both
      silent no-ops** - two more instances of "the wiki's suggested
      recovery command doesn't actually do anything," caught by reading the
      real command implementation rather than trusting its help text or an
      older doc's phrasing.
    - The `Feature-Addon-Integrations.md` scoping pass found that three of
      the wiki's four addons (EREC, Blobifier, DC eSpooler) are now native
      Kconfig features with zero trace of the old `mmu/addons/*.cfg`
      file-copying approach left in v4 - caught *before* drafting either
      affected page, avoiding a rewrite (see item 35's note on this).

    Two small drive-by fixes to already-"done" pages, made while verifying
    something on a new page and too small to leave stale once seen:
    `Reference-Printer-Variables.md`'s `drying_state` row (was describing the
    not-in-a-cycle value as the literal word `none`; it's `''`, and the
    real "cancelled" spelling in code is `canceled`, one L) and `index.md`'s
    "What it does" bullet list (`Tool-to-gate mapping`/`LED support` were
    the only two bullets in that list with no link to their own Feature
    page, now that both exist).

    Every new page's real menuconfig screenshot came from a session in
    `doc_tools/shots.py` following the established
    boxturtle-seed-plus-toggle-if-needed pattern - two are worth flagging
    for a future session touching Kconfig navigation again: (1) a Kconfig
    symbol's *displayed* menu path isn't always the first one
    `sym.nodes[0]` returns when multiple MMU types source the same file -
    `Feature-Filament-Bypass.md`'s bypass prompt turned out to live under
    **MMU Type → Box Turtle → Design attributes**, not a general
    "advanced settings" screen, only found by walking every node and
    filtering for the seed's actual selected type; (2) a Kconfig `choice`
    radio button (like an MMU type) isn't something `mc.enter()` opens -
    its own submenus render as nested items directly below it on the same
    screen instead.

    All ten pages cross-link heavily, including three-way loops (Gate/TTG
    Maps ↔ Spoolman ↔ LEDs, Tip Forming/Purging ↔ Addon Integrations ↔
    Espooler, FlowGuard ↔ Encoder ↔ Sync-Feedback Buffer) - every forward
    reference to a page not yet written at the time was named in plain text
    rather than linked (matching the established convention from item 24's
    FlowGuard mentions), then converted to a real link once that page
    landed later in the same batch; `./venv/bin/zensical build --clean`
    confirmed zero dangling links/anchors across the finished set.

37. **Post-hoc audit of the item 35/36 batch**: a broken-image check and a
    section-by-section wiki-vs-new-page diff, run per-page across all nine
    wiki-sourced pages in that batch (FlowGuard has no wiki source, so it's
    excluded). Found and fixed:
    - `Feature-LEDs.md` referenced `Feature-LEDs/led_connection.jpg`, which
      was never actually copied out of `wiki/Led-Support/` - Zensical
      validates page links/anchors but not `<img src>`, so the clean build
      said nothing about it. Copied and downsized to match the other reused
      wiki photos (1400px wide, `sips -s formatOptions 82`).
    - `Feature-Gate-TTG-Maps.md` and `Feature-LEDs.md` each pointed at the
      other for the wiki's `gate_color_rgb` → `SET_LED` custom-macro
      example (driving your own separate LED strip, distinct from Happy
      Hare's own managed `mmu_leds` effects) - neither page actually
      contained it, a worked example lost to a cross-link loop. Restored it
      on the Gate/TTG Maps page, next to the `gate_color_rgb` mention, and
      updated the LEDs page's "See also" to point at the real example
      instead of a vague forward-reference.
    - `Feature-Statistics-Counters.md`'s sample `MMU_STATS` table used a
      flat single-tier header (`unload | load | post_load | complete`).
      The real formatter builds a *two-tier* header - phase groups
      (`unloading`/`loading`/`complete`) over abbreviated sub-columns
      (`-`/`-`/`post`/`swap`) - confirmed by reading
      `_swap_statistics_to_string` in the real source. Fixed the sample
      and added a line noting the layout is illustrative, not a literal
      transcript, since the code also dynamically widens columns to fit
      group-header text.

    The diff pass surfaced a longer list of wiki content that didn't carry
    forward - not wrong, just genuinely absent with nothing standing in for
    it - left as-is for now rather than restored, since most of it is a
    judgment call on relevance rather than a correction:
    - **Environment Manager**: a second, purely illustrative `drying_data`
      example distinct from the real default table; the full
      `_MMU_VENT`/`_MMU_VENT_CLOSE` skeleton macro body (page now only
      names the shipped file); the active-vs-queued-gate distinction in
      per-gate `MMU_HEATER STOP=1 GATES=...` cancellation; the "nothing
      running" `MMU_HEATER` idle-status example.
    - **LEDs**: the wiki's "Summary of Default Effects" table's per-effect
      duration/description text (e.g. "Shooting stars", "Slow Pulsing
      Blue") and its separate "Filament Loaded → Dim Blue" state, collapsed
      into two shorter tables; the note that LED segments can be wired in
      parallel to drive two LEDs off one index; a trailing tip about
      Mainsail/Fluidd's per-extruder filament-color swatches.
    - **Gate/TTG Maps**: a material-naming convention note (no enforcement,
      but recommended short all-caps names like `PLA`, `ABS+`, `TPU95`);
      the full `printer.mmu.slicer_tool_map` YAML structure dump (now only
      in `Reference-Printer-Variables.md`); the default `gate_*` parameter worked
      example with real sample values (now names-only); the richer TTG
      worked example with multiple tools sharing a gate and a swapped pair.
    - **Statistics & Counters**: the `mmu_vars.cfg`/`[save_variables]`
      storage explanation and its don't-hand-edit-this caution; a
      forward-looking note about possible future preset counters;
      `console_show_colored_text`/`console_show_filament_color` (judged as
      general console settings, not stats-specific - not covered on this
      page, and no pointer given to wherever they do belong).
    - **State Persistence**: only stylistic loss - the specific first-person
      anecdote behind the startup-status walkthrough's remapped tool.
    - **Filament Bypass**: the caution about hand-editing `mmu_vars.cfg`
      directly (restart required, don't corrupt it); the concrete
      `MMU ENABLE=0` alternative-workflow command, now a vaguer paraphrase.
    - **G-code Preprocessing**: `!referenced_tools!`'s specific
      empty-string-is-ignored behavior; `!total_toolchanges!`'s countdown
      behavior once passed at print start; the `filament_color`-effect LED
      command shown alongside the manual `!colors!` example.
    - **Tip Forming and Purging**: the advanced-purge-volumes pigment-
      percentage slicer walkthrough; both worked-example numeric output
      tables for `MMU_CALC_PURGE_VOLUMES`/`PURGE_MAP=1`; the tip-cutting
      advantages/disadvantages list and the mechanical step-by-step cutting
      routine description - all genuinely dropped, not just relocated.
    - **Addon Integrations / Espooler**: only superseded legacy identifiers
      (old macro hook names, old `mmu/addons/*.cfg` include paths, generic
      "MMU: Any" compatibility lines) - correctly dropped, nothing of
      substance lost.

    None of the above was restored in this pass - they're recorded here so
    a future session (or the reader) can pull any of them back in
    deliberately, rather than have them silently vanish. **Update:** all of
    it (bar the two items already marked as intentionally not lost) was
    restored in a same-day follow-up - see item 38.

38. **Restored every item item 37 flagged as dropped**, per explicit
    instruction: bring it all back even where it hadn't been re-verified
    against source, since having it in the doc (even if slightly off) makes
    it easy to spot and fix later, whereas leaving it out means it just
    stays lost. Only the two items item 37 already flagged as *correctly*
    dropped were left alone - the State Persistence anecdote (stylistic,
    not substantive) and the Addon Integrations/Espooler legacy identifiers
    (genuinely superseded, not lost).

    One real bug caught while restoring, not just a re-add: the wiki's own
    `_MMU_VENT` skeleton macro has a bug - `{% for gate in range(gate) %}`
    references a variable that doesn't exist in that scope. Fixed to
    `{% for gate in gates %}` rather than reproducing the bug verbatim.

    Everything else was ported over close to verbatim from the wiki,
    adapted to each page's established voice/format but *not* independently
    re-verified against v4 source the way the rest of the batch was - flagged
    inline where that distinction matters (e.g. the swap-purge-volume
    doubling in Tip Forming and Purging is explained with an inferred
    rationale, not a confirmed one). Treat restored content as "the wiki
    said this" rather than "this is confirmed for v4" until someone checks
    it against the real source. `./venv/bin/zensical build --clean` stayed
    clean after every page edited in this pass.

39. **Two more §1-adjacent gaps closed on request: `Reference-Parameters.md` (§10) and
    `Custom-Load-Unload-Sequences.md`, first page of a brand new
    `Advanced Customization` top-level section.** Both explicitly sourced
    from the real shipped config templates and Kconfig help text rather
    than the wiki, which was named as too unreliable to trust here -
    matching this whole project's standing bias but stated as an explicit
    constraint this time.

    `Reference-Parameters.md` (renamed from the wiki's `Happy-Hare-Reference-Parameters.md`)
    walks every setting in `mmu.cfg`'s shared `[mmu_parameters]` section and
    `mmu_parameters.cfg`'s per-unit section, in the templates' own order and
    grouping. Getting real defaults for every `[[PARAM_X]]` token needed
    more than reading the templates: a one-off script reused
    `doc_tools/capture.py`'s `generate_seed()` pattern (select a symbol,
    `write_config` to a temp file, then `load_config` it into a *fresh*
    `Kconfig` instance) against a Box Turtle seed - setting the symbol
    directly on one instance without that round-trip left roughly a third
    of the tree unresolved, since Kconfig's dependency propagation needs
    the full write/reload cycle. A second pass against an ERCF seed
    confirmed the remaining blanks (heater, NFC, FlowGuard, servo settings)
    aren't seed-dependent at all - they're gated behind a separate opt-in
    capability toggle no MMU-type seed turns on by itself - so those instead
    reuse the values already screenshot-verified while writing
    `Feature-Environment-Manager.md`/`Feature-FlowGuard.md`/`Feature-NFC.md`
    earlier in this project. Every setting with a deeper existing home is
    linked to its Feature page rather than re-explained; LED effect
    definitions and addon hardware blocks are deliberately left untabulated
    since they're not really "parameters" in the tunable-setting sense and
    are already fully covered elsewhere.

    `Custom-Load-Unload-Sequences.md` covers the `gcode_load_sequence`/
    `gcode_unload_sequence` override mechanism - replacing Happy Hare's
    internal load/unload logic with user macros built from composable
    `_MMU_STEP_*` commands. Recommends the lighter callback-macro layer
    (`_MMU_PRE_LOAD`/`_MMU_POST_LOAD`/etc., and `_MMU_SEQUENCE_VARS`) first,
    consistent with the source's own framing. Since all 11 step commands
    are already individually documented in `Reference-Commands.md` (which
    walks the whole `extras/mmu` tree regardless of category), this page
    doesn't re-tabulate their parameters - it explains the filament-position
    state machine, walks through what the two shipped default sequences
    actually do, and reproduces the two commented-out alternative examples
    at the end of the source file that weren't visible anywhere else
    (toolhead-sensor homing, and `mmu_ext_touch` stallguard homing). Found
    one real, verifiable inconsistency while reading the source directly
    rather than trusting a research agent's first pass (which had reported
    it as a wiki error): the shipped `_MMU_UNLOAD_SEQUENCE` itself passes
    `FULL=1` to `_MMU_STEP_UNLOAD_BOWDEN`, but that command's real parameter
    list is `LENGTH` only - the argument is silently ignored. Harmless as
    shipped, but a genuine stale leftover in Happy Hare's own reference
    macro, not something the wiki got wrong on its own.

    Since this added a genuinely new top-level nav section (not just a page
    within an existing one), `index.md`'s card grid and "How this site is
    organized" bullet list both got a new entry for it too, per the v2 card
    grid rule from item 34 - bringing the count to 6. Also added a reminder
    to **Open items for later** below: a `Reference-Macro-Vars.md` reference covering
    every `variable_*` knob in `mmu_macro_vars.cfg` for every core macro is
    still missing, same role for that file that `Reference-Parameters.md` now plays
    for `mmu.cfg`/`mmu_parameters.cfg`.

40. **Closed the reminder item 39 left behind: `Reference-Macro-Vars.md`.** Same
    brief as `Reference-Parameters.md` - real shipped template plus real Kconfig help
    text, not the wiki - but for `mmu_macro_vars.cfg` instead: 181
    `variable_*` tokens across the file's 11 `[gcode_macro ..._VARS]`
    blocks (print start/end, state-change hooks, sequence/parking, client
    macros, toolhead cutter, tip forming, MMU-mounted servo cutter,
    Blobifier, the reference purge macro, and fan control).

    Getting defaults this time didn't reuse `Reference-Parameters.md`'s
    `kconfiglib`-seed approach - deliberately. None of this content is
    MMU-type-dependent (tip forming/cutting/purging/Blobifier are opt-in
    capability toggles, not selector-type-driven), and the Kconfig source
    for all of it turned out to be extremely regular: almost every symbol
    is a plain `default N`/`default "string"` literal, with a small,
    consistent pattern (`default "True" if BOOL_X` / `default "False"`)
    for the handful that gate on a companion checkbox. A purpose-built
    regex parser over the raw Kconfig text got everything in one pass,
    faster and just as reliable as reconstructing a synthetic seed would
    have been - though it needed a manual double-check for symbols
    adjacent to a `choice`/`endchoice` block, since the parser's
    block-boundary detection didn't treat those as stops and occasionally
    attributed one symbol's help text or default to its neighbour
    (`VAR_BLOBIFIER_TYPE`, `VAR_CUT_TIP_CUTTING_AXIS`/`CUT_STEPPER_CURRENT`,
    `VAR_SOFTWARE_AUTOMAP_STRATEGY`, `VAR_SEQUENCE_RESTORE_XY_POS`,
    `VAR_FAN_FORCED` - all confirmed by reading the raw source directly
    rather than trusting the parser's first pass).

    One real, verifiable finding along the way, not a wiki correction this
    time but a gap in Happy Hare's own code: `_MMU_STATE_VARS`'s
    `servo_down_limit`/`cutter_blade_limit` variables exist as named,
    documented settings, but nothing in the current Python codebase reads
    either one - confirmed with a repo-wide grep. They're pre-named
    convenience values for a maintenance-warning counter a user would still
    have to wire up themselves via `MMU_STATS COUNTER=...` in one of the
    state-change extension hooks; there's no automatic built-in counter
    behind them yet. Added a short clarifying note to
    `Feature-Statistics-Counters.md` rather than treating this as
    contradicting that page's existing "no built-in preset counters yet"
    framing, since on inspection it doesn't - it's a sharper version of the
    same fact.

    Blobifier's ~60 variables (by far the largest single block) are
    presented in the same sub-groups the template's own comments already
    use (Hooks & Extensions, Hardware & General, Tray Positions, Brush/
    Nozzle Cleaning, Purge Length Tuning, Blob Tuning, Retraction Tuning,
    Fan Control, Bucket) rather than one long flat table - purely a
    readability call, the template was already organized this way.

    Cross-linked in both directions: `Reference-Parameters.md`, `Command-
    Reference.md`, and `Custom-Load-Unload-Sequences.md` from the new
    page's own "See also"; and, going the other way, added or upgraded
    pointers on `Feature-Gate-TTG-Maps.md` (`automap_strategy`),
    `Feature-Tip-Forming-Purging.md` (`_MMU_FORM_TIP_VARS`/
    `_MMU_SERVO_CUTTER_VARS`), `Feature-Addon-Integrations.md`
    (`_BLOBIFIER_VARS`), and `Custom-Load-Unload-Sequences.md`
    (`_MMU_SEQUENCE_VARS` in full) so each already-written page's vague
    "lives in `mmu_macro_vars.cfg`" mention now points at the exact section.
    `index.md`'s Reference bullet was widened from "config parameter" to
    "config and macro-tuning parameter" to cover it. No new nav section or
    card needed - it slotted into the existing Reference section, third
    entry after Command Reference and Parameters.

41. **Footer redesign, 2026-08-07: moved the ASCII art + copyright out of
    the article body and into the real theme footer bar; gave the
    Previous/Next band a grey background.** Four requests:
    - **Previous/Next band gets a mid-grey background, minimal vertical
      padding.** `.hh-page-nav` (`extra.css`) now sets
      `background-color: #808080` and `padding: 0.25rem 0.75rem` (was
      `padding-top: 0.5rem` and no background) — the old top padding was
      exactly the "extra vertical space" being asked to go.
    - **Copyright line moved into the theme's own footer, directly above
      "Made with Zensical", same font.** Turned out to need zero custom
      markup: Zensical's vendored `partials/copyright.html` already renders
      `config.copyright` (if set) as a `.md-copyright__highlight` div
      immediately above the "Made with Zensical" line, inside the same
      `.md-copyright` container — same `.64rem` font-size, just the
      highlight colour variant. Setting `copyright: Copyright (C) 2022-2026
      Paul Morgan` in `mkdocs.yml` (previously unset) was the entire change
      for this half.
    - **ASCII art moved into the same footer bar, right of the
      copyright/"made with" column.** No template override directory exists
      in this repo (no `overrides/`, no `theme.custom_dir`), and
      `partials/footer.html`/`copyright.html` are vendored/generated files
      under `venv/` marked "do not edit" — so, consistent with how
      `hh-page-nav.js` already builds the Previous/Next nav client-side
      (Zensical renders neither), a second `document$.subscribe(...)` block
      was added to the same file that injects a `<pre class="hh-footer-art">`
      into `.md-footer-meta__inner`, between `.md-copyright` and
      `.md-social`. That container is `display:flex;
      justify-content:space-between` with exactly those two children
      already — a third child lands centred between them, matching the
      requested "copyright/made-with | logo | social icons" layout with no
      extra flex/positioning rules needed. `.hh-footer-art`'s colour switched
      from `--md-default-fg-color--light` (page background) to
      `--md-footer-fg-color--lighter` (the dark footer bar's own muted text
      colour, same one "Made with Zensical" uses).
    - **The old in-article `.hh-footer` block is gone from every page.**
      Removed the identical `<div class="hh-footer">...</div>` fragment from
      all 32 `doc/*.md` files that had it via a scripted regex substitution
      (byte-identical block in each, confirmed before running) rather than
      32 manual edits, and from `doc_tools/gen_command_reference.py`'s
      `render_page()`. Left the trailing `---` in place in every file — it's
      still doing a job (the `<hr>` the Previous/Next band sits under), just
      no longer introducing the removed div. The `.hh-footer`/
      `.hh-footer-copyright` CSS rules were deleted outright (nothing left
      to style); `.hh-footer-art` was kept and re-pointed at its new home.
    - **Fixed a break this caused in `hh-page-nav.js`'s Previous/Next
      insertion anchor.** It used to find `.hh-footer` and insert the nav
      immediately before it — with that div gone from every page, the
      anchor query returned nothing and the nav silently stopped rendering
      anywhere. Changed to anchor on `article.md-content__inner` (Zensical's
      actual content-column element) and `appendChild` the nav there
      instead, so it's simply the last thing in the column, right after the
      `---`'s own `<hr>` — no per-page anchor element needed at all now.
    - Verified end-to-end with a real `zensical build` + a static preview
      server, checked in-browser (not just by reading generated HTML): grey
      band and minimal padding confirmed via computed styles
      (`background-color: rgb(128, 128, 128)`, `padding: 5px 15px`); footer
      bar DOM confirmed the exact requested order
      (`.md-copyright` → `.hh-footer-art` → `.md-social`); screenshots taken
      at desktop width in both light and dark palette to confirm legibility
      of the new footer text/art colours against the dark footer background
      in both. At narrower viewports `.md-copyright{width:100%}` (Material's
      own responsive rule) wraps copyright onto its own row above the
      art/social row instead of a single side-by-side line — not fixed, and
      not asked for; flagged here in case it comes up again.
    - Did **not** regenerate `Reference-Commands.md` via
      `doc_tools/gen_command_reference.py` (needs `HAPPY_HARE_SRC` pointing
      at a real Happy-Hare checkout, normally fetched by `make
      command_reference`) — its footer block was stripped by the same
      regex pass as every hand-written page instead, which produces an
      identical result to what the updated generator would now emit. Worth
      running the real generator next time `make command_reference` runs
      anyway, just to confirm byte-for-byte parity.
    - **Follow-up the same session: the grey band still read as a separate
      floating element** — too light, a visible gap above `.md-footer`, and
      only as wide as the article column. Root cause was the placement, not
      the styling: `.hh-page-nav` was still being inserted into
      `article.md-content__inner`, a completely different box from
      `<footer class="md-footer">` a few pixels below it. Fixed by moving it
      one more time — `hh-page-nav.js` now prepends the nav as the *first
      child of `footer.md-footer` itself*, directly above `.md-footer-meta`
      (both are now plain sibling blocks inside the same `<footer>`, so
      there's no margin between them to remove and nothing to attach). Three
      things fell out of that placement for free, no extra CSS needed:
      - **Full page width**: `<footer>` isn't inside any max-width wrapper,
        so its background already spans edge to edge.
      - **"Darker, but slightly lighter than the very bottom footer"**:
        `.md-footer` itself sets `background-color:
        var(--md-footer-bg-color)` (`#000000de`); `.md-footer-meta` stacks
        `--md-footer-bg-color--dark` (`#00000052`) *on top* of that same
        base. Giving `.hh-page-nav` no background of its own means it just
        shows the plain `--md-footer-bg-color` layer while the meta bar
        below it shows both layers composited — darker, automatically, with
        zero explicit color chosen. (Also dropped the `color:
        var(--md-default-fg-color)`/`--light` on the link title/label,
        which assumed the old plain-page background — switched to
        `--md-footer-fg-color`/`--light`, the same white-on-dark variables
        `.md-footer__title`/`.md-footer__direction` use, since white text
        that used to work fine on the light page background would have been
        invisible on the new dark footer background otherwise.)
      - **Zero gap to the footer below**: they're adjacent children of the
        same element now, not two elements with independent margins that
        had to be reconciled.
      - **Centred under the main content**: gave the injected `<nav>` a
        second class, `md-grid` (already defined site-wide via `extra.css`'s
        `.md-grid{max-width:75rem}`), the same pairing
        `.md-footer-meta__inner` already uses for the copyright+social row —
        so the Previous/Next links cap at the same width and centre the same
        way as every other piece of footer/header chrome, rather than
        introducing a second, different "centered" convention.
      Re-verified via `getBoundingClientRect()`/`getComputedStyle()` in a
      real preview (not just re-reading generated HTML): nav confirmed as
      `footer.firstElementChild`, `nav.bottom === meta.top` (zero gap),
      `background-color: rgba(0,0,0,0)` on the nav itself (fully
      transparent, i.e. genuinely inheriting the footer's own color rather
      than coincidentally matching it) against `rgba(0,0,0,0.87)` on
      `.md-footer` and a further `rgba(0,0,0,0.32)` on `.md-footer-meta`.
      Confirmed the same fix holds for the first page in the nav order
      (`GettingStarted-BoxTurtle.md` — empty `<span>` placeholder where
      "Previous" would go, real "Next" link, still footer's first child).
      One caveat noted, not fixed: at the 1280px-wide viewport used for
      testing, Material bumps root font-size to `20px` in a responsive
      breakpoint, which pushes `.md-grid`'s `75rem` cap to `1500px` — wider
      than the test viewport, so the "centered, capped" behavior only
      visibly kicks in above roughly that width. Confirmed this is
      pre-existing, identical behavior on the untouched
      `.md-footer-meta__inner.md-grid` row too (not a regression introduced
      here) before treating it as a non-issue.
    - **Second follow-up, same session: centre the Previous/Next pair as a
      group instead of pinning them to the two edges of the grid.** Changed
      `.hh-page-nav` from `justify-content: space-between` to `justify-
      content: center` with a `3rem` gap between the two links, and dropped
      `margin-left: auto` from `.hh-page-nav__link--next` - that auto margin
      was specifically what shoved "Next" out to the far right under
      `space-between`, and left in place it would have overridden `center`
      too (flexbox resolves auto margins before `justify-content`).
      Confirmed via `getBoundingClientRect()`: the pair's own midpoint
      (`(prevRect.left + nextRect.right) / 2`) lands exactly on
      `window.innerWidth / 2`, with Previous entirely left of that point and
      Next entirely right of it.

42. **Documented `MMU_SPOOLMAN`/`MMU_NFC`'s new `APPEND=` parameter ahead of
    merge, from PR #1027 / the `private_v4` branch, not yet on `v4`.** The
    PR lets a Spoolman spool carry more than one registered UID
    (comma-separated) - e.g. a tag stuck on each side - via `MMU_SPOOLMAN
    ... RFID=... APPEND=1` (default is still replace; `RFID=''` now clears
    all tags instead of being rejected as invalid input) and `MMU_NFC
    GATE=<n> REGISTER=1 APPEND=1` (binds a freshly-scanned tag straight onto
    the gate's already-assigned spool instead of resolving/auto-creating).
    Source of truth was `gh pr diff 1027 --repo moggieuk/Happy-Hare` plus a
    shallow clone of `private_v4` - **not** a hand-read of the PR
    description, since command help text/examples are exactly the kind of
    thing that drifts from a PR's prose summary.
    - **`Reference-Commands.md` regenerated for real**, not hand-edited:
      `git clone --depth 1 --branch private_v4
      https://github.com/moggieuk/Happy-Hare.git /tmp/happy-hare-private_v4`
      then `HAPPY_HARE_SRC=/tmp/happy-hare-private_v4 venv/bin/python -m
      doc_tools.gen_command_reference`, overriding `HAPPY_HARE_SRC` for one
      run rather than touching the tracked `HAPPY_HARE_REF` file (that pin
      stays on `v4` - `private_v4` isn't merged yet, so it shouldn't become
      this repo's regeneration source for every future page). Confirmed
      with `--check` afterwards and deleted the temporary clone once done.
    - **`Feature-Spoolman.md` and `Feature-NFC.md` got the same update in
      prose, not just the generated reference** - this repo's convention
      throughout is that `Reference-Commands.md` is the terse parameter-level
      truth and the Feature pages carry the workflow/why. Spoolman's
      Commands section gained the `APPEND=1`/`RFID=''` examples plus a
      paragraph on replace-vs-append-vs-clear semantics and the "a UID
      already on a different spool gets silently moved, and that move is
      logged" behaviour. NFC's Commands section gained the matching
      `MMU_NFC ... APPEND=1` example plus its two fallback cases
      (`SHARED=1 APPEND=1` is rejected - no gate to bind onto; `APPEND=1` on
      a gate with no spool yet is ignored, not an error). Added a new
      Tuning subsection, `### Registering a second tag on the same spool`,
      giving the two equivalent workflows (scan it in vs. type the UID into
      `MMU_SPOOLMAN` directly) - matches the existing "workflow gets its own
      Tuning subsection, mechanics live in Commands" split already used for
      "Auto-creating spools from unknown tags" just above it. Also added a
      Troubleshooting bullet for the new "tag ... was registered to spool X
      - moving it to spool Y" log line, so it doesn't read as an error the
      first time someone sees it.
    - Not yet done, deliberately: didn't touch the tracked `HAPPY_HARE_REF`
      pin or re-point normal `make command_reference` at `private_v4` - once
      #1027 actually merges to `v4`, a plain `make command_reference` will
      pick this same content up from the real pinned ref, so there's nothing
      left to redo here beyond re-running it to confirm.

43. **Three small footer polish requests, same session:** moved the "Happy
    Hare Ready" ASCII art again - out of `.md-footer-meta__inner` and into
    `.hh-page-nav` itself, as the middle of its three flex children between
    the Previous and Next links, since visually it reads as decoration for
    *that* row rather than the copyright/social row below it. Both
    injections used to live in separate `document$.subscribe` blocks in
    `hh-page-nav.js`; merged into one now that the art is built alongside
    the nav's own children rather than into a different element entirely.
    `.hh-footer-art` swapped its old `margin: auto 0.6rem` (which centred +
    spaced it inside `.md-footer-meta__inner`) for `align-self: center` with
    no margin, since `.hh-page-nav`'s own `gap` (`3rem` -> `1.5rem`, tightened
    now that it spaces three items instead of two) already handles spacing.
    Also: `.md-copyright__highlight` (the "Copyright (C) ..." line, new
    2026-08-07 in item 41) got its own `font-size: 0.55rem` - it inherited
    `.md-copyright`'s own `.64rem` by default, same weight as "Made with
    Zensical" below it, when the ask was for it to read as the smaller,
    finer-print line of the two. `.hh-page-nav__label` (the "‹ PREVIOUS"/
    "NEXT ›" caps line) went `0.65rem` -> `0.55rem` and `.hh-page-nav__title`
    (the actual page name) went `0.95rem` -> `0.75rem`.

44. **Prev/Next now align with the actual content column's left/right
    edges, not just centred in the full-width footer row - the art from
    item 43 stays centred between them.** `.hh-page-nav` switched from flex
    to `display:grid; grid-template-columns: 1fr auto 1fr` (Previous in
    column 1, art in the auto-sized middle column, Next in column 3) so the
    art always sits exactly centred regardless of either link's title
    length, while the two outer columns split whatever space padding leaves
    evenly.
    - The actual left/right alignment isn't CSS at all: the content column
      sits inset from this full-width row by however wide the sidebar(s)
      beside the article happen to be (`.md-sidebar` is a fixed `12.1rem` in
      Material's compiled CSS, confirmed by reading it directly - but
      that's fragile to hard-code here, since it's Zensical/Material's
      value to change, not this repo's, and it varies further with which
      sidebar(s) are actually present: no secondary/TOC sidebar on a page
      with no headings, primary sidebar gone below the mobile breakpoint).
      Dropped the `md-grid` class this row had (item 41/42) - centering to
      the site's general chrome width was never actually the same as
      lining up with the content column, it just wasn't wrong enough to
      notice until asked to align precisely. Added
      `syncPageNavToContent()` to `hh-page-nav.js` instead: measures
      `article.md-content__inner`'s real rendered
      `getBoundingClientRect()` against the nav row's own, and sets the
      exact inline `padding-left`/`padding-right` needed to match - correct
      for any sidebar configuration because it reads the real result rather
      than assuming a layout.
    - Runs once after building the nav inside the existing
      `document$.subscribe` (same place the nav itself is built), **and**
      on a `window.addEventListener("resize", ...)` registered once at
      top-level, outside that subscribe - a viewport resize that crosses
      Material's mobile breakpoint (hiding/showing the primary sidebar)
      moves the content column without `document$` firing again, since
      that's not a navigation.
    - Verified via real `getBoundingClientRect()` reads in a live preview,
      both at initial load and after a real `resize` event: Previous's left
      edge and Next's right edge land exactly on the article's own left/
      right edges at two different viewport widths (1280px and 1600px),
      confirming the alignment recalculates rather than being a one-time
      coincidence at whatever width it was first measured.
    - One test-harness gotcha, not a real bug: the Browser pane's
      `resize_window` tool changes the CDP viewport but does **not** itself
      dispatch a `resize` DOM event (confirmed by comparing before/after a
      manual `window.dispatchEvent(new Event('resize'))`) - real browsers
      do fire one on an actual window resize (including mobile orientation
      change), so this only affects testing this in the harness, not real
      users. Don't mistake stale padding after `resize_window` alone for
      the sync logic being broken.

45. **Reordered the `Features` nav section alphabetically by its display
    label** (case-insensitive), on request as "a good enough starting
    position" rather than the ad-hoc order pages were added in across §5's
    rollout. `mkdocs.yml`'s `nav:` is the only thing that needed touching -
    it's also the sole source both the primary sidebar and
    `hh-page-nav.js`'s Previous/Next order read from, so both updated for
    free. Confirmed against the built HTML rather than just eyeballing the
    YAML diff: the sidebar's actual link order on a real page matches the
    new list exactly. Other nav sections (`Getting Started`, `Reference`,
    `Developer Guide`) are already small/logically-grouped enough that
    alphabetizing wasn't asked for and would likely hurt more than help
    (e.g. `Reference`'s `Command Reference`/`Parameters`/`Macro Variables`/
    `Printer Variables` order isn't alphabetical but is a deliberate
    most-used-first ordering) - left untouched.

46. **Header logo switched to `doc_logo2.png`, sized to the header's
    existing height rather than growing it.** `.md-header__button.md-logo`
    (Material's compiled CSS) puts `margin:.2rem` + `padding:.4rem` on both
    top and bottom of the logo `<img>`, so its total box is
    `img-height + 1.2rem` - `.md-header__inner`'s own `min-height: 5.6rem`
    (item from the original header-polish pass) is the ceiling before the
    header itself grows, so `img-height` maxes out at `5.6rem - 1.2rem =
    4.4rem` (was `2.8rem`). Confirmed via `getBoundingClientRect()` in a
    live preview, not just arithmetic: header height stayed exactly 112px
    (5.6rem) at the 1280px-wide/20px-root breakpoint, logo rendered at
    exactly 88px (4.4rem) tall. `doc_logo2.png` is a wide landscape image
    (1536x1024, vs. the old logo's ~500x588) - width is left as Material's
    own default `auto`, so it scales proportionally and comes out
    noticeably wider (132px vs. roughly 95px before) rather than just
    taller; checked 1230px/1280px (logo visible, no crowding against
    search/GitHub stats) and below Material's own sidebar-collapse
    breakpoint (~1220px and mobile) where the logo is stock-hidden anyway
    regardless of this change, so no regression there either.

47. **Audited every file under `wiki/` (55 total) against this plan's own
    tables, on request ("what's left in the wiki that we might want to
    pull into the new v4 doc")** - cross-referenced each wiki filename
    against every table above rather than re-reading the plan's prose
    summary, since a page can be *mentioned* in an item's narrative without
    actually having a table row (found exactly that below). Findings, not
    already covered by the "still open" section-by-section list itself:
    - **Two genuinely unplanned pages, not on this table anywhere before
      today:** `wiki/Macro-Customization.md` (470 lines - Macro Extension
      vs. Macro Replacement, `MMU_ACTION_CHANGED`/`MMU_PRINT_STATE_CHANGED`/
      `MMU_EVENT`) is exactly the "lighter callback-macro layer" item 11's
      own `Custom-Load-Unload-Sequences.md` row deliberately deferred as
      "a large enough topic to deserve their own future page" - that future
      page was never actually added to §10a until this pass. `wiki/Quick-
      Start-3MS.md` and `wiki/Quick-Start-QuattroBox.md` are the same
      genre as the two already-done `GettingStarted-*.md` pages (Box
      Turtle, ViViD) but for two more MMU hardware types - §1's own table
      only ever named those two, with no row for these at all. All three
      added to their respective tables above.
    - **Stray/superseded files, deliberately left off every table (not a
      gap, don't action these):** `wiki/Testpage.md` is a near-duplicate
      draft of `wiki/Home.md` (diffed directly - same structure, a couple
      of stale details like "Amored" for "Armored" and one fewer ERCF
      version listed), not distinct content. `wiki/Conceptual-MMU-new.md`
      reads like an abandoned in-progress draft of the same page
      `Conceptual-MMU.md` (item 20) already sourced from `wiki/Conceptual-
      MMU.md` - worth one direct diff before writing anything new, in case
      it has content the shipped page doesn't, but not assumed here.
      `wiki/Configuration-Reference.md` is a bare links-hub to the four
      `Configuring-*.cfg` pages with no content of its own - this site's
      own nav sidebar already does that job. `wiki/Reference-Commands.md`,
      `wiki/Happy-Hare-Reference-Parameters.md`, and `wiki/Quick-Start-BoxTurtle.md`
      are fully superseded by the already-done generated/rewritten
      `Reference-Commands.md`, `Reference-Parameters.md`, and
      `GettingStarted-BoxTurtle.md` respectively. `wiki/_Footer.md`/
      `wiki/_Sidebar.md` are wiki chrome, not content.
    - Reported as a chat summary first, then logged here on request - the
      summary itself (section-by-section open list, table above) isn't
      repeated in full in this item; see the tables above for the actual
      per-page status this pass updated.

48. **§1's `Installation.md` and all of §6/§7 written and shipped in one
    session, on explicit request (4 numbered items: Installation, then
    KlipperScreen/Mainsail-Fluidd as separate pages, then Slicer &
    Toolchange, then a merged Operation page).** Set up cleanly first: a
    `.happy-hare-src` checkout already existed from prior work but was
    stale, refreshed to latest `v4` (`git fetch && git reset --hard
    origin/v4`) before verifying anything against it, since every claim
    below depends on that checkout actually being current.
    - Delivered one item at a time with a wiki-proofread carry-forward
      report after each (per **Before finishing a Feature page** above,
      applied here even though these aren't Feature pages), not all four
      silently at once - see the per-page **Status** notes on the §1/§6/§7
      table rows above for the full per-page detail; not re-duplicated
      here.
    - **Link hygiene across a batch of interdependent new pages**: several
      pages needed to link to each other (`Installation.md` → `Operation.md`,
      `KlipperScreen.md` → `Operation.md`, `Operation.md` → `Slicer-Setup.md`,
      etc.) despite being written in sequence, so a page written first
      couldn't yet link to one written later without breaking the build.
      Handled by writing forward references as plain text on first pass,
      then coming back to convert them into real links once every page in
      the batch existed, with a `zensical build --clean` after each
      individual page (catches a genuinely broken link immediately) and one
      final build after the whole batch (catches anything only fixable once
      every page existed).
    - **Two research lookups delegated to background agents, run in
      parallel while writing**: the KlipperScreen fork's real install steps
      (a live fetch of `github.com/moggieuk/KlipperScreen-Happy-Hare-Edition`'s
      README, not something derivable from this repo's own source) and a
      full staleness audit of `Basic-Operation.md`/`Handling-Errors.md`
      against `.happy-hare-src` (the item the user explicitly flagged as
      possibly stale, so it got the deepest pass of the four rather than a
      light check) - not delegated: `Installation.md`'s and
      §6's own verification, done directly, since both stayed within
      normal grep-against-source-then-write territory.
    - **`index.md` updated for the two new top-level nav sections**
      (`Slicer & Toolchange`, `Operation`) - both a new bullet in "How this
      site is organized" and a new card in the "Where to start" grid, per
      this table's own §0 rule about the card grid needing a touch only
      when a genuinely new section lands, not for every new page. Card
      count: 6 → 8.
    - Verified end-to-end in a real browser preview, not just a clean
      build: every image on all 6 new pages confirmed actually loading
      (`naturalWidth > 0`, `complete: true` via `getBoundingClientRect`/DOM
      checks, not just "the build didn't warn"), the new `<pre
      class="hh-mermaid">` pause/resume/recover flowchart on `Operation.md`
      confirmed rendering as a real SVG (not garbled text), and the
      `index.md` card grid confirmed showing exactly 8 cards in the right
      order.

49. **§8 Tuning (`Blobbing-and-Stringing.md`) and §10's `Reference-Mcu.md`
    written and shipped, on request ("tackle the Tuning page next, then the
    Mcu page").** `Reference-Mcu.md` came with an explicit scope
    instruction - list every MCU in Kconfig, not just the wiki's 6
    "popular" ones, and include pinout images only where one actually
    exists - so this one started from `installer/boards/Kconfig.*` (the
    real source of the **Board type** menuconfig screen) rather than the
    wiki page, cross-checking the wiki's 6 images against that full list
    afterward rather than the other way round. Full per-page detail is on
    the §8/§10 table rows above; not re-duplicated here. Both built clean
    and verified in a real preview the same way as item 48 (every image's
    `naturalWidth`/`complete` checked via DOM, not just "the build didn't
    warn"; `Blobbing-and-Stringing.md`'s `<pre class="hh-mermaid">`
    confirmed rendering as a real SVG). `index.md` got its 9th card
    (`Tuning`) for the same reason item 48 added two - a genuinely new
    top-level nav section landed; `Reference-Mcu.md` didn't need one, since
    it's a new page inside the already-existing `Reference` section.

50. **`KlipperScreen.md`'s Main Panel and TTG Map sections refreshed with
    real newer screenshots the user dropped into `wiki/new_klipperscreen_images/`**,
    on request - "the main screen and TTG map screen looks different now
    ... new gauges and a pop-up menu that acts on the touched spool/gate."
    Confirmed by direct before/after comparison (old `mmu_main.png` vs. the
    new screenshots) rather than taking the description on faith: the old
    Main Panel was a plain gate/tool status table with dedicated
    `Tools...`/`Eject`/`Gates` buttons and a single vertical "clog
    thermometer" slider; the new one renders actual coloured spool
    graphics, one button per gate below them, and tapping a gate now opens
    a popup (`Select`/`Check Gates`/`Preload`/`Load`/`Unload`/`Eject`)
    instead - confirmed via `ks_main_panel_popup.png`. A new paginated
    gauge panel (dots to page through) replaces the old single flow-rate
    annotation - confirmed three of its pages directly:
    `ks_main_panel_flowguard_tangle.png` (a tangle/clog donut gauge, not in
    the old design at all), an encoder manual-flow gauge (visible in the
    same popup screenshot), and `ks_main_panel_spool_fragment.png` (Spoolman/
    tag spool details). TTG map went from a single-tool-at-a-time bar
    display to `ks_ttg_map_panel.png`'s full parallel-coordinates diagram
    of every tool→gate line at once, with independent `-`/`+` steppers for
    both the tool and the gate side.
    - **Also updated even though not explicitly called out in the request**:
      the Manage panel (`ks_manage_panel.png`), because a direct comparison
      against the old `mmu_manage_virtual.png` showed the same underlying
      change pattern - `Home`/`Sync`/`Unsync`/`Servo Up`/`Servo Move`/`Servo
      Down` now always appear in the button grid, greyed out when not
      applicable to the connected MMU's selector type, where they used to
      be omitted entirely per selector-type screenshot. Only one new Manage
      screenshot was provided (for a gear-per-gate/virtual-selector unit,
      inferred from the visible board-name branding and grid layout
      matching the old `mmu_manage_virtual.png` most closely) - consolidated
      the old three-screenshot linear/rotary/virtual presentation down to
      this one shared image plus a note that the layout itself is now
      identical across designs, rather than guessing at unseen linear/
      rotary redesigns that weren't provided.
    - **Bypass position corrected**: the wiki/old page said clicking "just
      left of `T0`" opened the bypass selector; the new
      `ks_main_panel_bypass.png` shows `Byp` as the last button in the gate
      row, after the highest-numbered real gate, not to T0's left - fixed
      to match what the new screenshot actually shows rather than carrying
      the old positional claim forward unchecked.
    - **8 old, now-orphaned screenshots deleted** rather than left as dead
      weight once nothing referenced them:
      `mmu_main.png`/`mmu_main_printing.png`/`flowrate_annotated.png`/
      `mmu_main_bypass.png` (Main Panel), `mmu_manage_linear.png`/
      `mmu_manage_rotary.png`/`mmu_manage_virtual.png` (Manage), and
      `mmu_toolmap.png` (TTG). Left `last_error.png`, `mmu_picker.png`,
      `mmu_recover.png`, `mmu_filament_editor{1,2}.png`, `mmu_spoolman.png`,
      and `mmu_options.png` alone - no replacement was provided for any of
      those sections, and nothing in the new screenshots suggested they'd
      changed.
    - Verified in a real preview same as every other page this session:
      all 13 images on the rebuilt page confirmed loading
      (`naturalWidth`/`complete` via DOM, not just a clean build), and the
      full rendered page text read back to confirm the new prose actually
      matches what's in the new screenshots rather than just replacing the
      `<img src>` and leaving stale prose underneath.

51. **New §10b Macros section written and shipped: `Macro-Customization.md`
    rewritten (dropping its Tip Forming/Tip Cutting sections, relocated to
    their own pages) plus nine new per-macro-group pages, one for every
    `mmu_macro_vars.cfg` block that has a menuconfig editor** - on explicit
    request. Full per-page detail is on the §10b table above; not
    re-duplicated here, but a few things worth logging that don't belong on
    any single page's row:
    - **A real, pre-existing bug found and fixed in `doc_tools/shots.py`
      itself**, unrelated to the new work but found while building it: the
      `_feature_gate_ttg_maps` scene's `mc.enter('Print start/end
      (_MMU_SOFTWARE)')` call (a single space before the parenthesis) no
      longer matches the live Kconfig source, which now pads that menu
      title with extra spaces for column alignment
      (`"Print start/end    (_MMU_SOFTWARE)"`, four spaces) - confirmed
      broken by running the session directly before touching anything.
      Fixed by matching on the `(_MMU_SOFTWARE)` tag alone rather than the
      full padded title, and used the same tag-only substring for all nine
      new scenes' own `mc.enter()` calls so none of them are exposed to the
      same whitespace fragility if the padding changes again.
    - **Screenshot capture found two menuconfig navigation subtleties not
      obvious from reading the Kconfig source alone**: `MMU_HAS_TOOLHEAD_CUTTER`
      lives under **Toolhead sensors/settings** ("Has toolhead cutter?"),
      not under **Tip Forming / Cutting** itself, even though it's a
      `depends on` for that menu's own "Tip cutting using toolhead cutter"
      choice option - the option simply doesn't appear at all until the
      other capability is toggled on first. And selecting a radio option
      inside a `choice` block auto-closes back to the parent menu (unlike
      toggling a plain choice item inline, e.g. Box Turtle's MMU-type
      selection) - an extra `mc.back()` written on the assumption it
      wouldn't landed on the top-level quit/save dialog instead, caught by
      `mc.step()`'s own assertion rather than producing a wrong screenshot
      silently.
    - **A real scope collision found and resolved before it shipped
      wrong**: the first draft of `Macro-Sequence.md` re-explained park
      positions/`restore_xy_pos`/z-hop from scratch, not realising
      `Toolchange-Movement.md` (§6, already done) already covers exactly
      that with worked examples and diagrams neither `Reference-Macro-Vars.md` nor a
      from-scratch macro page would improve on. Rewritten to explicitly
      defer to that page and cover only what it doesn't (the menuconfig
      screenshot and the load/unload extension hooks) - caught by reading
      `Toolchange-Movement.md` directly before finishing the page, not by
      the advisor call earlier in the session, which didn't have visibility
      into that page's existing content.
    - **The wiki's tip-forming tuning workflow (`MMU_LOAD EXTRUDER_ONLY=1` →
      `MMU_FORM_TIP` → `variable_final_eject`) was NOT ported to the new
      `Macro-Tip-Forming.md`**, contrary to the original plan going in -
      `Feature-Tip-Forming-Purging.md` already has a newer, code-verified
      workflow built around `MMU_TEST_FORM_TIP` that supersedes it (per
      that page's own status note). Porting the wiki version anyway would
      have reintroduced a stale command name onto a second page; the new
      page instead links to the existing correct workflow.
    - Every new page built clean and verified in a real preview the same
      way as prior sessions: every image's `naturalWidth`/`complete`
      checked via DOM, and the Blobifier page's single screenshot confirmed
      it actually covers the whole ~60-variable menu (autofit settled at 75
      of the 96-row cap, no scroll arrows) rather than silently cutting off
      - the three-shot split originally planned for that page turned out
      unnecessary once tried, so the scene was simplified rather than kept
      as unused complexity.

52. **`Feature-Addon-Integrations.md` removed, `Feature-Eject-Buttons.md`
    split out, and the Blobifier/EREC photos relocated to their real
    macro pages** - on explicit request ("no add-ons any more, they're all
    integrated"). By the time item 51 landed, this page's own three
    non-eject-button sections were already just redirect stubs (Servo
    Cutter/Blobifier point at `Feature-Tip-Forming-Purging.md`'s real
    content, DC eSpooler at `Feature-Espooler.md`'s) - nothing on it was
    genuinely load-bearing except the Eject Buttons section, which had no
    other home.
    - `Feature-Eject-Buttons.md` is that section, moved essentially
      unchanged (same pin-polarity warning, same menuconfig screenshot) -
      just re-framed as its own Feature page rather than one section of an
      "addon index." `doc_tools/shots.py`'s `feature-addon-integrations`
      session/scene renamed to `feature-eject-buttons` to match (session
      names track the page they belong to - see the file's own header
      rule), `outdir` updated the same way.
    - The two photos (`erec-logo.jpg`, `blobifier.jpg`) and their
      accompanying "physical build/project page" links moved with their
      sections - `git mv`'d into `Macro-Servo-Cutter/`/`Macro-Blobifier/`
      respectively, preserving history, and inlined into those pages'
      "What it does" sections rather than left as an outbound link to a
      page that no longer exists. `Macro-Blobifier.md` also picked up the
      `BLOBIFIER_PARK`-vs-standard-parking tip that was on the old page,
      not carried into either of the two `Macro-Blobifier.md`/
      `Macro-Servo-Cutter.md` drafts written in item 51 - dropping the
      whole source page could easily have lost it silently.
    - Every cross-reference to `Feature-Addon-Integrations.md` across the
      site updated to point at whichever page now actually owns that
      content - `Reference-Parameters.md`, `Toolchange-Movement.md`,
      `Feature-Tip-Forming-Purging.md` (four separate spots), and
      `Reference-Macro-Vars.md` (two spots) all had at least one. A clean
      `./venv/bin/zensical build --clean` after the change caught nothing
      broken, confirming the sweep was complete rather than just "probably
      complete."

53. **`Feature-Sync-Feedback-Buffer.md` and `Feature-FlowGuard.md` reworked
    to fully absorb `wiki/Synchronized-Gear-Extruder.md`**, on explicit
    request after the user re-reviewed the wiki page and found real,
    relevant content missing from both. A direct line-by-line diff against
    the wiki's "Sync-Feedback 'Buffer' Type Sensors" section onward (the
    part after Synchronized Gear/Extruder itself, already covered) found
    four genuinely un-ported pieces: the AutoTune Two-Level/EKF algorithm
    explanation and its three simulation plots, the buffer-dimension ASCII
    diagrams, the full `MMU_QUERY_PSENSOR`/`MMU_CALIBRATE_PSENSOR`
    calibration workflow, and the entire FlowGuard telemetry-tuning
    section (`sync_feedback_debug_log`, `plot_sync_feedback.sh`,
    interpreting a telemetry plot, the interactive viewer). Split per the
    user's own instinct - AutoTune (the sensor's own calibration mechanism)
    to `Feature-Sync-Feedback-Buffer.md`; the FlowGuard-specific telemetry
    workflow to `Feature-FlowGuard.md` - with each page cross-linking the
    other's half.
    - **`MMU_QUERY_PSENSOR` doesn't exist in v4** - grepped the whole
      `extras/mmu` tree; the name only survives as a category label in
      `mmu_help.py`'s help-categorization table, not a registered command.
      `MMU_SENSORS` now reports the proportional sensor's value directly
      (`name --> value (raw: value_raw)`), replacing it entirely. The
      wiki's own `MMU_QUERY_PSENSOR_example.png` screenshot - real captured
      console output of the now-nonexistent command - was skipped rather
      than reused, per the standing rule on not republishing stale real
      output; no replacement screenshot exists since nobody has run the
      real `MMU_SENSORS` equivalent for this specific purpose yet.
    - **The `MMU_CALIBRATE_PSENSOR` transcript needed a full rewrite, not a
      light edit**: real output writes settings under `[mmu_buffer
      <name>]` in `mmu_hardware_*.cfg`, as bare `analog_max_compression`/
      `analog_max_tension`/`analog_neutral_point` keys - the wiki's
      transcript showed a `[mmu_sensors]` section with a
      `sync_feedback_analog_*` prefix on every key and pointed at
      `mmu_parameters.cfg`, none of which exist. Confirmed directly against
      `commands/mmu_calibration_commands.py`'s own log strings rather than
      guessing. The wiki's "reducing gear current to 30% during
      calibration" step also isn't real - the actual code runs calibration
      at 100% current - dropped rather than carried forward.
    - **One stale reference caught in passing, unrelated to the wiki
      source**: `Feature-FlowGuard.md` already referenced a
      `sync_feedback_buffer_range` parameter that has never existed under
      that name (real name: `buffer_range`, in `[mmu_buffer]` in
      `mmu_hardware.cfg`, not `mmu_parameters.cfg`) - predates this session
      but fixed while cross-linking the two pages' buffer-dimension
      content.
    - **One imported plot has a real labeling bug**: `Type-D_Simulation_Tangle.png`'s
      own title text says the trigger's "triggering parameter" is
      `flowguard_max_motion`, which isn't a real setting (confirmed against
      `unit/mmu_sync_feedback.py` - the real parameter, and the one the
      equivalent Type-P plot correctly shows, is `flowguard_max_relief`).
      Kept the image (still a genuinely useful illustration otherwise) with
      a corrective note rather than dropping it, per the standing rule on
      reusing a flawed-but-editable illustration.
    - Verified all seven newly-added images load in a real preview and a
      clean `zensical build --clean` catches no broken links, same as every
      other page this session.

54. **Full wiki-vs-doc content re-audit, then all 7 real gaps found fixed**,
    on explicit request ("perform another audit against the original wiki
    ... summarize what might be missed", then "fix all 7"). Unlike prior
    ad-hoc audits, this pass was systematic: a script diffed every wiki
    page's own image references against the whole `doc/` tree (catching
    only images actually used in the source page's text, to avoid
    false-positives from stray unused wiki assets), then six parallel
    research agents each diffed a cluster of wiki pages against their
    mapped doc page(s) for prose content - explanations, worked examples,
    commands, caveats - present in the wiki but absent site-wide. ~30 wiki
    pages covered; the large majority came back clean (several doc pages
    are supersets of their wiki source). One agent finding was independently
    verified and rejected as a false positive: `printer.mmu.servo`/`.grip`
    looked undocumented to that agent, but is already covered, substantively,
    on `Dev-Code-Layout.md` (developer-architecture framing rather than a
    `printer.mmu` table row, which is why a plain grep for the dotted name
    missed it).
    - **`Macro-Tip-Forming.md`/`Reference-Macro-Vars.md`**: added the missing
      per-hotend `cooling_tube_position`/`cooling_tube_length` starting
      points (DragonST/DragonHF/Mosquito/Revo/RapidoHF) as a real table,
      cross-linked from `Reference-Macro-Vars.md`.
    - **`Feature-Gcode-Preprocessing.md`**: the flagged gap needed
      verification, not just restoration - checked `!referenced_tools!`'s
      real substitution logic in `components/mmu_server.py` directly.
      Found the page's own prior claim ("substitutes with `0`, never an
      empty string") was itself wrong: a file with literally no
      tool-selection line leaves the placeholder unsubstituted, not `0`.
      Corrected the placeholder table and the worked example's note
      accordingly, and confirmed the macro's existing
      `{% if REFERENCED_TOOLS == "!referenced_tools!" %}` check already
      handles this case correctly (same literal-placeholder check catches
      "preprocessor disabled" and "no tools referenced" alike) - no new
      macro code needed, just an accurate explanation.
    - **`Feature-Endless-Spool-Runout.md`**: the wiki's fancy per-tool
      cycling-order status view doesn't exist in current source at all
      (`es_groups_to_string()` only ever prints flat group membership) -
      so rather than reproduce a nonexistent display, added a worked
      example using the real log messages from
      `mmu_gate_maps.get_next_endless_spool_gate()`/`mmu_controller.py`
      ("Checking for alternative gates ... (checked gates: ...)",
      "Remapping T0 to gate 6"), confirmed against source directly.
    - **`Feature-Tip-Forming-Purging.md`**: added the wipe-tower
      enable-then-disable sequencing tip (needed to unlock the purge
      matrix) and the Prusa MMU-preset-not-Single/@MMU-tag selection
      steps, both prose-only gaps next to screenshots that were already
      correct.
    - **`Reference-Parameters.md`**: added the stallguard/`selector_accel` tuning
      warning (below ~600 unreliable, above ~1000 reliable) - correctly
      placed after the *whole* Selector control table, not mid-table (a
      table split with an admonition wedged into the middle was caught and
      fixed before shipping, verified in a live preview).
    - **`Macro-Customization.md`**: added the `pause_macro` replacement
      rationale (purge-tower parking, push notifications, static args) and
      the hard "must leave the printer paused" constraint - the page
      already documented *how* to replace it, not *why*.
    - **`Macro-Tip-Forming.md`**: added the automatic pressure-advance
      zero-during/restore-after-tip-forming behavior, confirmed against
      `_wrap_pressure_advance` in `mmu_filament_movement.py`.
    - **`Custom-Load-Unload-Sequences.md`**: investigating the flagged
      "homing move caveats" turned up more than expected. The shipped
      `mmu_sequence.cfg`'s own commented-out worked example uses
      `MOTOR=extruder+gear`, which isn't one of `_MMU_STEP_HOMING_MOVE`'s
      three valid values (`gear`/`extruder`/`gear+extruder`, confirmed
      against `mmu_misc_mixins.py`'s `MoveMixin`) - a real latent bug in
      Happy Hare's own reference macro, already faithfully reproduced in
      this page from an earlier session. Worse, even corrected to
      `gear+extruder` it would still be the wrong choice for that specific
      example's `mmu_ext_touch` endstop - `mmu_filament_movement.py`'s own
      move-tracing docstring documents `mmu_ext_touch` as "only useful for
      motor=extruder" (a stallguard endstop tied to one specific stepper,
      not a synced pair) - fixed the example to `MOTOR=extruder` and added
      both real gotchas: which endstops are valid depends on which
      stepper(s) `MOTOR=` drives, and a virtual (stallguard) endstop can
      only home in the extrude direction (confirmed: reverse-homing on one
      raises "Cannot reverse home on virtual (TMC stallguard) endstop"
      directly from `mmu_misc_mixins.py`).
    - **`Feature-Environment-Manager.md`**: added the missing
      start-of-cycle warning behavior when a `GATES=` gate isn't empty yet.
    - **Deliberately not fabricated**: the audit's last, weakest finding
      (a worked "extruder current bump during tip forming" console
      transcript, already flagged by its own finder as "arguably not worth
      flagging") turned out to reference a log line format
      (`Run Current: X Hold Current: Y`) that no longer exists anywhere in
      `extras/mmu/` - rather than invent a plausible-looking transcript
      that can't be verified against real output, left it as prose-only
      (already covered via `extruder_form_tip_current` on `Operation.md`
      and the pressure-advance behavior just added to
      `Macro-Tip-Forming.md`).
    - Every fix verified against `.happy-hare-src` directly before writing,
      not just against the wiki's original claim - two of the seven
      "restore this" items turned out to need correcting, not just
      restoring, and a third uncovered a genuine bug in Happy Hare's own
      shipped reference macro. Clean `zensical build --clean` and a live
      preview check (table/admonition structure specifically, given the
      Reference-Parameters.md near-miss) after all edits.

55. **`MMU_SPOOLMAN_TAG` split out of `MMU_SPOOLMAN` in v4, docs updated to
    match** - on explicit request, after the user flagged a small upstream
    code change. Refreshed `.happy-hare-src` to latest `origin/v4`
    (`e8acb194`/`2ca57e6c`, merged as `3c2222e5`) and read the real diff
    before touching anything: `MMU_SPOOLMAN` used to overload
    `SPOOLID=`/`GATE=` with two unrelated jobs (gate-spool assignment vs.
    tag-UID registration); the split gives each command's parameters one
    meaning. `make command_reference` regenerated cleanly, 88 → 89
    commands.
    - **`Feature-Spoolman.md`**: moved every `RFID=`/`APPEND=` example and
      explanation into a new `### MMU_SPOOLMAN_TAG - registering a tag UID`
      subsection under Commands, per the user's own suggested structure,
      cross-linking `Feature-NFC.md` both ways. Documented `REGISTER=1` -
      genuinely new content, not just a rename - by reading
      `mmu_spoolman_tag.py` directly: it binds a gate's *already-cached*
      tag UID (recorded on scan regardless of whether it resolved, per
      `mmu_controller.py`'s `_apply_tag_to_gate`) onto a `SPOOLID=` created
      after the fact, needs `spoolman_support` of `readonly` or `push`
      (confirmed against `check_if_spoolman_enabled`'s prior OFF check
      narrowing the command's own "!= pull" to exactly those two), and
      supports `GATE=LAST` (resolves to `mmu.last_preloaded_gate`). Added
      three new Troubleshooting entries for its real error strings.
    - **`Feature-NFC.md`**: updated every stale `MMU_SPOOLMAN ... RFID=`
      reference to `MMU_SPOOLMAN_TAG`. Enriched "Shared reader workflow"
      with the actual LED behaviour, on request - confirmed directly
      against source rather than taking the description on faith:
      `effect_pending_spoolid`/`_expiring` really do ship as
      `mmu_breathing_purple_slow`/`_fast` (`mmu_hardware.cfg`), switching
      `PENDING_LED_WARN_WINDOW` (5s, `mmu_controller.py`) before
      `spoolman_pending_id_timeout` voids the pending assignment - the
      user's "purple, pulsing faster near timeout" description was exactly
      right. Added a new "Registering an unresolved tag after the fact"
      workflow for the per-gate `REGISTER=1` case (remove old spool → tag
      the new one → preload → scan doesn't resolve → create the spool in
      Spoolman by hand → `MMU_SPOOLMAN_TAG GATE=LAST SPOOLID=... REGISTER=1`
      with no re-scan needed), reproducing the user's own workflow
      verbatim once confirmed accurate against `_nfc_tag_read`/
      `_apply_tag_to_gate`/`_spoolman_get_spool_by_uid`.
    - Clean `zensical build --clean` (which itself flagged two mistyped
      anchors before the fix - both derived slugs were wrong on the first
      guess, corrected against the actual built HTML `id=` rather than
      re-guessing) and a live preview check of both new sections and the
      cross-links between them.

56. **Full menuconfig screenshot regen (`make shots`, all 22 sessions) plus a
    content audit of every resulting diff**, on explicit request ("menuconfig
    has been updated with new settings so the pages are slightly dated").
    `.happy-hare-src` was already at the tip of `origin/v4` (`3c2222e5`,
    same commit item 55 synced to) - the staleness was against four commits
    already inside that checkout that hadn't had a screenshot pass run
    against them yet: `af68143d` (~45 previously-hardcoded parameters
    exposed as real menuconfig prompts for the first time - selector/gear
    stepper tuning, espooler burst/speed tuning, sync-feedback tuning,
    bowden correction, logging, timeouts, workflow toggles), `9c6a8540`
    (reordered the "MMU Features / Additions" menu, added a new MMU type
    - **HTLF**, "HappyTurtleLettuceFeeder", a 4-gate rotary-cam Type-A
    design - and removed the general espooler↔filament-buffer
    mutual-exclusivity mechanism), `740313fd` (cosmetic macro-vars menu
    title padding), and `b9edb7a1` (split `nfc_preload_jog_scan_window` out
    of `nfc_gate_jog_scan_window`).
    - **One session broke outright and needed a real fix, not just a
      re-shoot**: `feature-espooler`'s scene tried to enter a submenu
      literally named "eSpooler pins", which `af68143d` folded into a
      comment-marked tail section of the new, much longer "eSpooler config"
      menu instead (13 new tuning items now live above the pin rows).
      Fixed `doc_tools/shots.py` to enter "eSpooler config" and select the
      first pin row rather than a submenu that no longer exists. Bonus: the
      resulting autofit shot happens to capture the *entire* menu in one
      110x45 image - tuning knobs and pins together - so
      `Feature-Espooler.md`'s Hardware Setup/Parameter Setup text and both
      section's image references were updated to describe the shared
      screenshot instead of treating it as pins-only.
    - **Because `Reference-Parameters.md`/`Feature-*.md` pages are built from the raw
      `.cfg` templates directly, not from screenshots, almost all of the
      ~45 newly-exposed settings were already documented correctly by
      value** - the regen mostly just made menuconfig visibly catch up to
      what the prose already said. Two genuine gaps found by cross-checking
      every setting against every page regardless: `nfc_preload_jog_scan_window`
      (`Feature-NFC.md` only had the older, now-imprecise
      `nfc_gate_jog_scan_window` cited in its preload-tuning section) and
      `toolhead_post_load_tension_adjust`/`toolhead_entry_tension_test`
      (real settings driving the sync-feedback buffer's post-load
      `ADJUST_TENSION=1` call and an extruder-entry tension check
      respectively, both confirmed against `mmu_filament_movement.py`,
      previously only a bare row in `Reference-Parameters.md`'s flat table with zero
      mention on `Feature-Sync-Feedback-Buffer.md`). Both fixed, and the
      **new "Feedback Tuning" section now visible on the buffer-config
      screenshot** (same "one screen serves two doc sections" pattern as
      the espooler fix) got a cross-reference between Hardware Setup and
      Parameter Setup rather than a duplicated explanation.
    - **A real, verified break in a "Structure decisions locked in" rule**:
      `9c6a8540` removed `Kconfig.espooler`'s general
      `select UNSELECT_MMU_HAS_FILAMENT_BUFFER` (forced off whenever eSpooler
      was chosen, on any type) and replaced it with two type-specific
      hardcodes instead (Box Turtle: buffer always off regardless of
      eSpooler; BTT ViViD: both off, unchanged). Confirmed via a full grep
      of `installer/` that no other type has this exclusivity any more -
      every other MMU type can now enable both features independently.
      Fixed the blanket "mutually exclusive" claim on both this file (the
      buffer/espooler bullet above) and `Feature-Espooler.md`.
    - **HTLF logged here, not yet added anywhere else** except one vendor
      table row on `Conceptual-MMU.md` (Type-A, "shared gear stepper, rotary
      cam selector") since it's now visible on `GettingStarted-BoxTurtle.md`'s
      own MMU Type screenshot - worth remembering when `MMU-Types-Overview.md`
      finally gets written (§1).
    - **One pre-existing screenshot bug fixed as an incidental side effect,
      not a source change**: `GettingStarted-BoxTurtle/11-toolhead-selected.png`
      used to show a phantom `( ) default` line at the top of the Toolhead
      list that doesn't exist in any Kconfig source (`installer/toolheads/`
      has no file that would produce it, confirmed by opening the Toolhead
      menu fresh in isolation with `CAPTURE=1` and seeing no such line) -
      almost certainly the exact stale-ncurses-fragment bug already
      documented in `doc_tools/README.md`'s "Photographing an editor"/
      repaint() section, from earlier in that same long multi-screen
      session. The regen's fresh render doesn't have it.
    - Every other changed screenshot (all 8 macro-vars pages, plus
      `Feature-Gate-TTG-Maps`/`Feature-Endless-Spool-Runout`) pixel-diffed
      to confirm the change is confined to the breadcrumb padding
      (`740313fd`'s cosmetic fix) with zero content impact - checked
      exhaustively rather than assumed, since a blanket "just cosmetic"
      call on 8 files without checking would have been exactly the kind of
      thing this audit was supposed to catch.
    - Clean `zensical build --clean` after all edits.

57. **§4 Calibration written**, closing the gap flagged at the end of item
    56's "To pick this back up" note - the wiki-vs-code overlap check that
    note called for against `Operation.md`/`Toolchange-Movement.md`/
    `Blobbing-and-Stringing.md` was done up front, per explicit request to
    restructure by calibration *step* rather than by the old Type-A/Type-B
    split (see the rewritten §4 table above for the full per-page
    breakdown and reasoning). All Kconfig facts - the 5 autotune/auto-cal
    settings and their per-type defaults - came from empirically resolving
    the real `installer/Kconfig` tree with the vendored `kconfiglib`
    (forcing each MMU type symbol and reading back the result), not from
    reading Kconfig files visually, after finding the naive read would have
    missed `mmu_types/Kconfig.ercf`'s one direct per-type override
    (`BOOL_SKIP_CAL_ENCODER default n`) winning over the generic
    `default y` due to Kconfig's first-true-default-wins resolution order.
    - Placed in nav directly after "Getting Started" per explicit request,
      before "Slicer & Toolchange".
    - User confirmed two structural decisions up front (via AskUserQuestion)
      rather than assuming: one combined `Calibration-Selector.md` instead
      of splitting by selector family, and leaving the toolhead-calibration
      procedure on `Blobbing-and-Stringing.md` rather than extracting it -
      that page's own "## Summary of Tuning Steps" `hh-mermaid` diagram
      starts with `MMU_CALIBRATE_TOOLHEAD` and flows into
      `toolhead_ooze_reduction`, so moving the procedure out would have
      orphaned that diagram's own first step.
    - Two real bugs found and fixed on `Reference-Parameters.md` while researching:
      `autocal_bowden_length` was listed as `0` in the Box-Turtle-seed
      table when the real stock default (Turtle Neck v2's compression
      sensor) is `1`; `skip_cal_encoder`'s `(encoder-equipped)` annotation
      was backwards - the real exception is ERCF specifically, not
      "encoder-equipped" generally (KMS/QuattroBox both ship encoders and
      still default skippable).
    - Fixed a stale cross-reference on `GettingStarted-BoxTurtle.md`
      ("`MMU_CALIBRATE_TOOLHEAD` — see the wiki") to point at the new
      `Calibration-Toolhead.md` instead.
    - Deliberately left `GettingStarted-BoxTurtle.md`/`-ViViD.md`'s own
      empty `## Calibration` stub headings untouched - filling only that
      one of three consecutive empty stubs (`## Validating Hardware
      Setup`/`## Calibration`/`## Checking Basic Operation`) would read as
      an accidental partial edit rather than intentional scoping; leave for
      whoever eventually writes all three together.
    - Clean `zensical build --clean` after all edits.

58. **`GettingStarted-BoxTurtle.md`'s 5 remaining empty stub headings
    filled in** (the trio flagged in item 57 plus two more that turned out
    to also be empty - `Printing with MMU`/`What Next?`), and a new
    `Dev-Test-Command.md` page written for the hidden `_MMU_TEST` command.
    - Content for the 5 stubs was dictated directly by the user rather
      than derived from source, since it's operational/procedural
      knowledge (what to actually check, in what order) rather than a
      fact extractable from Kconfig or code - `MMU_SELECT`/`MMU_TEST_MOVE`
      for gear direction, `MMU_SENSORS` with a filament fragment for
      sensor validation, the Turtle Neck buffer's compression-extends/
      tension-compresses orientation check via `MMU_SYNC_FEEDBACK`, and an
      `MMU_ESPOOLER` burst test, all under "Validating Hardware Setup";
      `MMU_CALIBRATE_GEAR` (recommended, not forced) under "Calibration",
      now linking to the real §4 pages; `MMU_LOAD`/`MMU_UNLOAD`/
      `MMU_SELECT` under "Checking Basic Operation"; the purge-tower vs.
      Happy-Hare-controlled-purge decision plus `mmu_macro_vars.cfg`
      parking tuning under "Printing with MMU"; KlipperScreen/Mainsail-
      Fluidd plus "explore Features one at a time" under "What Next?".
      Real command syntax/params for all of these were still verified
      against `Reference-Commands.md` before writing, same as always -
      only the narrative/sequencing came from the user directly.
      `GettingStarted-ViViD.md`'s equivalent stubs were left alone (out of
      scope for this request, and mid-edit by the user concurrently).
    - `_MMU_TEST` (`extras/mmu/commands/mmu_dev_test.py`) turned out to
      already be machine-generated onto `Reference-Commands.md`'s "Internal
      / developer commands" appendix (it's `CATEGORY_INTERNAL`, not
      excluded from generation) - so `Dev-Test-Command.md` deliberately
      doesn't repeat that flat parameter list, and instead groups the
      ~25 sub-tests by risk (safe introspection / moves real hardware /
      provokes known bugs on purpose / sequence timing / fake autotune
      telemetry) and explains that the leading underscore is only
      Klipper's hide-from-`MMU_HELP` convention - there's no separate
      developer-mode flag gating it, `check_if_disabled()` is the same
      "MMU enabled" guard every command has. Placed in Developer Guide
      nav right after `Dev-Testing.md`, and cross-linked from that page's
      coverage-map row (which already mentioned `_MMU_TEST` in passing).
    - Clean `zensical build --clean` after all edits.

59. **All internal/developer-only commands split out of `Reference-Commands.md`
    into a new generated `Dev-Command-Reference.md`**, per explicit follow-up
    request to extend item 58's `_MMU_TEST`-only exclusion to the whole
    `CATEGORY_STEPS`/`CATEGORY_INTERNAL` appendix (`_MMU_STEP_*` sequence
    steps, `CANCEL_PRINT`/`CLEAR_PAUSE`/`PAUSE`/`RESUME` wrappers, the
    double-underscore `__MMU_*` event handlers) rather than one command at a
    time.
    - `doc_tools/gen_command_reference.py` now writes two files from the
      same command collection pass: `render_page()` (unchanged categories,
      new one-line pointer to the dev page) and a new `render_dev_page()`
      for `APPENDIX_CATEGORIES` - same generation mechanism, same
      staleness-checked `make command_reference`/`--check`, just two
      outputs instead of one. Superseded the previous turn's narrower
      `EXCLUDED_COMMANDS = {"_MMU_TEST"}` hack entirely - `_MMU_TEST` now
      routes to the dev page the same mechanical way every other
      `CATEGORY_INTERNAL` command does, no special-casing needed.
    - `Dev-Test-Command.md` updated to point its parameter-list cross-link
      at `Dev-Command-Reference.md#_mmu_test` instead of the (now wrong)
      claim that `_MMU_TEST` lived on `Reference-Commands.md`'s appendix.
    - Found and fixed 13 stale anchors this relocation broke:
      `Custom-Load-Unload-Sequences.md`'s step-command table (11 rows) and
      its own two prose links to "the Command Reference" for
      `_MMU_STEP_*` parameters - all now point at `Dev-Command-Reference.md`.
      That page's own content/table explanations didn't need to move (they
      were always the user-facing "why," not the generated "what") - only
      the outbound links to the generated parameter dump needed updating.
    - `Dev-Command-Reference.md` placed in Developer Guide nav right before
      `Dev-Test-Command.md` (reference before deep-dive, matching how
      `Reference-Commands.md` itself sits ahead of feature-specific pages
      in the main Reference section).
    - Clean `zensical build --clean` after all edits.

60. **New `Feature-Cold-Pull.md` page**, extracted from
    `Blobbing-and-Stringing.md`'s "Cleaning the Extruder with a Cold Pull"
    section (manual procedure, `MMU_COLD_PULL`-guided procedure, per-material
    temperature table, both images) per explicit request - see the rewritten
    §5 table row above for the full reasoning (why this one moved, unlike
    toolhead calibration in item 57).
    - Confirmed `MMU_COLD_PULL` is a real `gcode_macro`
      (`config/macros/mmu_misc.cfg`), not a Python `BaseCommand` - it's
      genuinely, correctly absent from `Reference-Commands.md` because
      `gen_command_reference.py` only ever scanned `extras/mmu/**.py`.
      Noted on the new page rather than silently worked around.
    - While checking that, found several more real user-facing `MMU_*`
      macros sharing the same blind spot (`MMU_FAN`, `MMU_DUMP_VARS`,
      `MMU_CHANGE_TOOL_STANDALONE`, `MMU_CHECK_GATES`, `MMU_REMAP_TTG`,
      `MMU_FORM_TIP`) - out of scope for this request (some already have a
      home elsewhere, e.g. `MMU_START_SETUP`/`MMU_END` on
      `Slicer-Setup.md`), flagged as a follow-up audit rather than
      addressed here.
    - `Feature-Cold-Pull.md` added to nav alphabetically first in
      Features (before `Feature-Eject-Buttons.md`), matching that
      section's existing alphabetical order.
    - Clean `zensical build --clean` after all edits.

61. **Anchor-scroll offset (`--md-scroll-margin`) fixed to clear the taller
    header**, reported as "TOC/heading links scroll past the header, landing
    on the text right after it." Confirmed directly (not assumed): the real
    header renders at 5.6rem (matching `.md-header__inner`'s min-height),
    but Material bakes its own default straight into `.md-typeset :target`
    at *build* time (`--md-scroll-margin: 3.6rem`, sized for its stock
    header) rather than deriving it from the header's actual rendered
    height - so growing the header earlier in the session never grew this
    to match. Overrode the same custom property on the same selector
    (`.md-typeset :target { --md-scroll-margin: 6rem; }`, equal specificity,
    later in the cascade) rather than fighting it with a competing
    `scroll-margin-top`. Verified via `getBoundingClientRect()` on a real
    clicked "On this page" link, not just computed-style inspection - before:
    heading landed 44px behind the header; after: ~4px clear of it. (The
    preview server here is a plain static file server over `site/`, not a
    watch/rebuild loop - `zensical build --clean` is required before a
    reload picks up any doc/CSS change, confirmed the hard way when the
    first reload after this edit still served the stale rule.)

62. **New `Feature-Fan-Control.md` page**, closing the one real gap the
    `MMU_*` macro audit found. The user explicitly scoped the audit's other
    two findings out: "no need to document the old aliases because I'm
    trying to get users to use new commands. no need to document double
    underscore set" - so `MMU_CHECK_GATES`/`MMU_REMAP_TTG`/`MMU_FORM_TIP`/
    `MMU_CHANGE_TOOL_STANDALONE` (legacy-alias macro names) and the twelve
    `MMU__X` Mainsail/Fluidd UI-visibility aliases stay undocumented by
    design, not by oversight - see the rewritten §5 table row above.
    - See the §5 table row for the full verified-bug writeup (the
      `variable_fans`/`fan_sensors` auto-population that doesn't actually
      work) - not repeating it here. Short version: confirmed by rendering
      the real Jinja template end-to-end against a synthetic profile via
      `test.hh.cfg.render()`, not by reading the template and assuming its
      own header comment was accurate. Needed a throwaway venv
      (`python3 -m venv` in the scratchpad dir, `pip install jinja2`) since
      neither this repo's venv nor a fresh `.happy-hare-src` checkout had
      one - `pip install --user` hit PEP 668 (externally-managed-environment)
      on this machine, so a fully isolated scratchpad venv was the clean
      answer rather than `--break-system-packages` on the real system Python.
    - New `_feature_fan_control` scene in `doc_tools/shots.py`, modeled on
      `_feature_environment_manager`'s "toggle a feature that's off by
      default, screenshot its submenu(s)" pattern - toggles both
      "Has environment sensor(s)?" and "Has cooling fans?" since the
      feature needs both. First attempt failed
      (`could not put the highlight on 'Has cooling fans?'`) from a stray
      `mc.back()` after the first toggle - since no submenu was ever
      entered after toggling the environment sensor, `back()` popped all
      the way to `(Top)` instead of staying on "MMU Features / Additions".
      Removed the unneeded `back()` call and the retry succeeded cleanly.
    - Corrected `Reference-Macro-Vars.md`'s `_MMU_FAN_VARS` section to match the
      verified behaviour (was previously marked `fan_sensors`/`fans` as
      `*(auto-generated)*`, and "Not yet covered by any Feature page" -
      both now updated) and cross-linked it to the new page both ways.
    - `Feature-Fan-Control.md` added to nav alphabetically between
      eSpooler and Filament Bypass, matching that section's existing order.
    - Clean `zensical build --clean` after all edits.

63. **`Feature-NFC.md` follow-up (2026-08-13)**: the shipped `mmu_hardware.cfg`/
    `mmu_parameters.cfg` templates had their NFC comment blocks trimmed down to
    one-liners (detail moved into Kconfig help text instead, per the project's
    7-line template-comment limit) - the user supplied the removed comment text
    directly and asked for it not to be lost. Folded in:
    - **PN532-over-UART (HSU)** wiring detail that had no home on the page at
      all: mode pads (`SEL0=0, SEL1=1`, distinct from SPI's `SEL0=0, SEL1=0`),
      TX/RX/GND/power wiring, "Klipper opens the port itself, no MCU pins",
      the `/dev/serial/by-id/` stability warning, and "one reader per adapter,
      exclusively" - as a new third `.cfg` example (Hardware Setup had two
      already, SPI and software-I2C, but none for UART) plus a `!!! tip`
      block. Also added the "an unplugged adapter doesn't stop Klipper
      starting" fact to the existing `alive=0` Troubleshooting bullet.
    - **Software-I2C pull-up resistors** ("each bus needs its own, unlike a
      hardware bus's built-in ones") - added to the existing "Multiple
      same-address readers" Tuning subsection, the removed comment's original
      home.
    - **A new "Noisy neighbors" Tuning subsection** for `nfc_neighbor_check`/
      `nfc_field_probe_reads`/`nfc_neighbor_evict_distance` - three params in
      the removed `mmu_parameters.cfg` comment that turned out not to exist in
      this repo's checked-out `v4` source at all (confirmed by grep before
      writing anything). Found via `gh pr view`/`gh pr diff` that they're from
      **Happy-Hare PR #1061** ("NFC: mitigate 'noisy neighbor' per-gate reader
      interference"), open and unmerged - fetched the real diff rather than
      guessing, which caught real detail the trimmed comment didn't have:
      exact defaults (`nfc_neighbor_check`/`nfc_neighbor_evict_distance` both
      0/off, `nfc_field_probe_reads` defaults to 3, range 1-10) and a new
      Kconfig warning (W17: a forward eviction jog is only valid when
      `gate_homing_endstop` is the per-gate `mmu_exit`, same rule as the
      existing W5). Wrote the section as plain fact per the no-developer-
      references/no-version-narrative rules - no PR number, no class names
      (`MmuNfcFieldArbiter` etc.) on the page itself; that provenance lives
      here instead. **Left deliberately unflagged as beta/pending on the page
      itself** - the page already carries a page-wide beta banner, and there's
      no established convention here for "documents an unmerged PR"; flagging
      this choice for the user rather than silently deciding, in case they'd
      rather hold the section back until #1061 actually merges.
    - Removed a genuinely stale line found in passing: Hardware Setup's own
      "No menuconfig screenshot on this page yet" paragraph, which item 33
      above had already contradicted by adding one - left in place since,
      contradicting the real `<img>` a few paragraphs earlier on the same
      page. Also fixed the same stale claim in this row's own status text
      above.
    - Did not touch `Reference-Parameters.md` - it's generated from the real
      `mmu_parameters.cfg` template and already lists the four existing
      `nfc_*` params; the three new ones would need the same treatment once
      #1061 merges, but that page was out of the scope the user asked for
      this session. Flagging it here rather than silently expanding scope.
    - This page's code fences stayed ` ```ini ` (all four, old and new) to
      match its own existing three - noticed in passing that this contradicts
      the ` ```yaml ` convention in the Admonitions/code-block bullet above;
      didn't convert the existing ones mid-session since that wasn't asked
      for, flagging the page-wide inconsistency here rather than fixing it
      silently.

**To pick this back up:** with §1, §4, §5, §6, §7, §8, and now §10b Macros
all done, and §10 down to just its own remaining ⚠️-flagged pages, the next
open sections are §1's remaining pages (`MMU-Types-Overview.md` - remember
HTLF, new per item 56 above - `Upgrading-from-v3.md`, and the
`GettingStarted-3MS.md`/`GettingStarted-QuattroBox.md` pair from
item 47), §2's other two pages (`Understanding-Operation.md`,
`Print-Job-State-Machine.md` - lean on `Conceptual-MMU.md`'s terminology
rather than re-defining it), §3's four `Configuring-mmu*.cfg.md` generators
(follow the `gen_command_reference.py` pattern already proven out), §11
(Troubleshooting & FAQ), and §13 (Community & Support). None of these have
been scoped yet the way the routing pass in item 35 scoped §5 (or the
ad-hoc scoping items 48/49 did for §6/§7/§8/parts of §10, or item 57 did
for §4) up front - worth doing the same wiki-vs-code overlap check before
drafting, especially for §2, which likely shares content with the
now-finished §4/§5/§7/§8 pages (EndlessSpool groups, gate/TTG maps, and
load/unload/toolhead-calibration sequencing all come up naturally in an
"Operation"/"Tuning"/"Calibration" context). Whatever's next, run
`./venv/bin/zensical build --clean` before calling it done, not a plain
`zensical build` - see **Zensical rough edges**.

**2026-08-13.** Item 64: v4's `MMU_SENSORS` dropped `DETAIL=1` in favour of
`SENSOR=<name> ENABLE=[0|1]` (persistent per-sensor enable/disable, reaching
virtual/analog sensors Mainsail's own toggle never could) - user asked for
the doc site to catch up and for the newly-possible "disable a problem
sensor instead of pausing/rewiring" workflow to be documented somewhere.
`.happy-hare-src` was 5 days stale (pinned at `3c2222e5`); pulled to
`d97de6ac` first. Wrote a new `Feature-Sensors.md` (§5, added to
`mkdocs.yml` nav) covering the sensor layer common to every sensor type -
naming/addressing (gate-suffixed vs. unit/buffer/encoder/toolhead-prefixed,
`UNIT=` disambiguation), querying, and the three interchangeable ways to
enable/disable one (`MMU_SENSORS`, Klipper's own `SET_FILAMENT_SENSOR`,
Mainsail/Fluidd's toggle) - see that page's own row above for the full
verification notes (empirical harness checks, the two other stale spots
found and fixed, image reuse). Regenerated `Reference-Commands.md`
(`make command_reference`) and confirmed by diffing old vs. new that
`MMU_SENSORS` is the only section that changed anywhere in the file.
