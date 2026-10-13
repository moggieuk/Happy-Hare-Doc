# Contributing to Happy Hare documentation

This guide is the authoritative source for documentation conventions and page
templates. Maintain those conventions here. Use [the roadmap](maintainer/roadmap.md)
for outstanding work and its linked archive for historical research. This guide
takes precedence over archived wording and skill summaries.

See [README.md](README.md) for setup and
[doc_tools/README.md](doc_tools/README.md) for generation procedures.

## Site structure

- Write pages at the `doc/` root, with page-specific images in a matching sibling
  directory: `doc/Foo.md` and `doc/Foo/`.
- Update `nav` in `mkdocs.yml` when adding or moving a page. That configuration is
  the published navigation; the maintainer roadmap is not.
- Use `Reference-XXX.md` names for Reference pages and `Dev-` names for Developer
  Guide pages. Preserve established filenames to avoid breaking inbound links.
- Keep Macros separate from Advanced Customization. Macro pages describe tuning
  and extending the supplied gcode macros; Advanced Customization covers
  replacing internal sequences.
- Keep related purge and tip-shaping pages adjacent in navigation, using the
  established title prefixes: `Purge: Blobifier`, `Purge: Simple`, and
  `Tip Shaping: Forming`, `Tip Shaping: Toolhead Cutting`, `Tip Shaping: MMU Cutting`.
- Keep maintainer instructions and planning notes outside `doc/` unless they
  belong in the published Developer Guide.

The site uses Zensical, reading `mkdocs.yml`, with `docs_dir: doc` and the default
`site/` output directory. Retain the Material `classic` variant, black primary
color, and the brand's hot pink accent. Shared styles and behavior belong in
`doc/assets/`, not copied into individual pages.

## Writing and verification

Document current Happy Hare behavior. Verify wiki material against the relevant
Happy Hare source before porting it; the older wiki is useful source material,
not proof of current behavior. Keep the verification warning on a ported page's
planning-table entry until that check is complete.

- State verified behavior directly. Do not add v3-versus-v4 narratives to
  reader-facing pages. Deprecation-status notation is permitted.
- Avoid exact command or test counts that will quickly become stale.
- Keep Happy Hare implementation details in the Developer Guide: Python class
  and method names, internal source paths, and provenance such as which method
  constructs a status object do not belong on user-facing pages.
- User-editable configuration filenames, keys, `MMU_*` commands, Klipper section
  names, and Klipper API calls that readers use themselves are appropriate.
- Do not start a page with a verification or provenance report. Feature pages
  start with `## Concept` after the page title.
- Preserve accurate wiki illustrations, callouts, and worked examples. Cut
  material for a specific reason, such as incorrect or superseded behavior,
  rather than merely to shorten a page.

Two distinctions need particular care when verifying configuration examples:

- Pin values are fully specified MCU-and-pin strings such as `unit0:PA0` in
  `mmu_hardware.cfg`. Do not introduce the old separate pin-alias layer in
  `mmu.cfg`.
- A filament (catchment) buffer and a sync-feedback buffer are different
  features. The catchment buffer collects loose filament during rewind;
  sync feedback measures tension or compression. Do not describe these as one
  option or assert blanket mutual exclusion with an eSpooler. Verify constraints
  for the particular MMU type against source.

## Markdown conventions

### Admonitions

Use the base admonition syntax, with indented content:

```text
!!! warning "Important"
    Explain the behavior or action here.
```

GitHub-style `[!NOTE]` callouts are not enabled. Supported styled types are
`note`, `tip`, `info`, `success`, `question`, `warning`, `danger`, `bug`,
`example`, `quote`, `abstract`, and `failure`. Use `warning "Important"` rather
than `important`, which renders without the expected icon or color.

### Code blocks

- Use `ini` fences for `.cfg` configuration examples.
- Use `text` fences for gcode commands and command lists.
- Use `{.text .console-output}` fences for literal console or printer output.
  The stylesheet gives returned output its distinct terminal color.
- To show a command and its output as one visual container, place a
  `{.text .console-command}` fence immediately before its `console-output` fence.

SuperFences is the sole backtick-fence processor and supports fences inside
admonitions, lists, and tabs. Do not also enable `fenced_code`. Keep its
`css_class` set to `codehilite`, with the separate `codehilite` extension for
traditional indented blocks; do not replace this with `pymdownx.highlight`
without verifying the previously observed rendering problems are resolved.

### Tables and internal links

In Markdown tables, put alternatives in separate code spans with the escaped pipe
between them: `` `a` \| `b` ``. Putting the escaped pipe inside one code span
can display the backslash literally.

Convert wiki-style bare page links such as `[Foo](Foo)` to `[Foo](Foo.md)` when
porting pages. Check both the target page and any heading anchor.

### Navigation, diagrams, and footers

- Do not add `[TOC]` markers; the theme supplies the on-page contents sidebar.
- Do not use fenced `mermaid` blocks: they have rendered inconsistently across
  clean builds. Use plain ASCII diagrams in fenced blocks for the Developer
  Guide. The existing raw `<pre class="mermaid">` HTML in the Spoolman page is
  a separate implementation, not permission to restore Mermaid fences.
- End published pages with `---` and nothing after it. Copyright and ASCII art
  belong to the shared theme footer, not each article.
- Do not manually add colored heading icons. The stylesheet supplies the H2
  marker and underline site-wide.

## Images and screenshots

Keep useful editable mechanism diagrams even when labels need a corrective
caption. Screenshots represent real output: replace or omit obsolete UI or
console screenshots rather than presenting old names as current behavior.
Explain omissions during review.

Article images receive rounded corners and shadows automatically. Use the
`no-floating` class only for intentional exceptions, such as the home-page hero.

Capture real menuconfig screens through `doc_tools/shots.py`, with a session's
output directory matching its page. Enable any capability that gates the menu
being captured. When shared menus change, check all affected Getting Started
guides and feature or macro pages.

Generation commands, source selection, capture limitations, and reproducibility
details live in [doc_tools/README.md](doc_tools/README.md). Builds render the
committed screenshots and references; they do not regenerate them.

## Feature page template

Use this section order:

1. **Concept** — explain and illustrate the feature.
2. **Hardware Setup** — include wiring, `mmu_hardware.cfg` settings, and other
   relevant user configuration. Include a real menuconfig screenshot for
   hardware-facing prompts when practical; do not expose raw Kconfig source to
   explain what the reader should enter.
3. **Parameter Setup** — cover `mmu_parameters.cfg` and other relevant settings.
   Preserve worked numeric examples in full.
4. **Commands** — link commands to their Command Reference anchors.
5. **Printer variables exposed** — include a UI subsection with real images
   when the feature is visible in KlipperScreen, Mainsail, or Fluidd.
6. **Tuning** — include practical, step-by-step setup recipes.
7. **Troubleshooting**
8. **See also**

Before finishing a Feature page or any ported page, proofread it against its wiki
source section by section. Report what was omitted and why, including deliberate
cuts, so the reviewer can decide whether to restore it.

## Macro page template

Use this lighter section order:

1. **What it does** — briefly explain the concept. Link to the related Feature
   page for hardware or workflow detail rather than duplicating it.
2. **Where it's applied** — identify the actual macro or command and whether it
   is connected automatically or through a `user_*_extension` or `*_macro` hook.
3. **Configuration** — include the real **Macro Variables** menu screenshot and
   highlight the important settings. Enable the owning capability before
   capturing a gated menu. Link to `Reference-Macro-Vars.md` for the full variable
   table; do not duplicate that table here.
4. **See also**

## Shared presentation changes

The existing header, sidebar home link, Previous/Next navigation, and footer are
implemented with `mkdocs.yml`, `extra.css`, and `hh-page-nav.js`. Preserve their
shared behavior when changing presentation:

- Navigation code must respond to `document$.subscribe(...)`, because instant
  navigation swaps pages without another `DOMContentLoaded` event.
- Previous/Next links derive their order from the rendered primary sidebar;
  exclude on-page anchors instead of maintaining a second navigation list.
- The header title's fixed height supports its scroll animation. The tagline
  is positioned separately, with header space supplied by the inner container.

Build limitations and their workarounds are documented in
[the tooling guide](doc_tools/README.md#build-limitations-and-workarounds). Verify
whether a historical limitation still applies before changing a workaround.

## Validation

Run these checks for documentation changes:

```bash
make docs_check
make spellcheck
```

`docs_check` runs a strict site build plus navigation and image-reference checks.
Use `make docs` for a live preview or `make docs_preview` to build and serve the
static site. Inspect affected pages visually after layout or screenshot changes;
a successful build does not guarantee correct appearance.

For generator changes, also run the relevant tests and review the regenerated
files. Keep generated Command Reference edits in their source or generator,
rather than patching the generated Markdown directly.
