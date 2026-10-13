---
name: happy-hare-doc-pages
description: Edit or review Happy Hare documentation under doc/, regenerate menuconfig screenshots, and update generated command references using this repository's conventions and tooling.
---

# Happy Hare documentation

## Read the maintained guides

Paths below are relative to this skill directory; run commands from the repository
root. This repository skill depends on the guides shipped with the repository.

- Read [AGENTS.md](../../../AGENTS.md) for repository instructions and validation.
- Read [CONTRIBUTING.md](../../../CONTRIBUTING.md) before editing or reviewing
  pages. It is authoritative for writing rules, Markdown, images, and the Feature
  and Macro page templates. Follow its relevant template rather than reconstructing
  one from older pages.
- Read [doc_tools/README.md](../../../doc_tools/README.md) for screenshot or command
  reference generation. Its **One session, many screenshots**, **Seeds**, and
  **What is not reproducible** sections cover capture behavior and limitations.
- Consult [the roadmap](../../../maintainer/roadmap.md) for outstanding work.
  Follow its archive link only when historical research is relevant; archived
  notes are not current instructions.

## Editing or porting pages

Apply the contribution guide's writing and verification rules before carrying
wiki material forward. Keep accurate illustrations, callouts, and worked examples.
For a ported page, compare the result section by section with its wiki source and
report omissions and their reasons.

Check the guide's Markdown conventions when reviewing rendered pages: unsupported
admonition types, incorrect fence languages, and duplicated page footers can look
wrong without failing a build. Use its Feature or Macro template for those pages.

## Regenerating content

Ordinary site builds and previews only need the committed files in this repository.
`make shots` and `make command_reference` also require Happy Hare source:

- The default `.happy-hare-src/` is a disposable managed cache refreshed to
  `HAPPY_HARE_REF` before each source-dependent run. Use a Make command-line ref
  override when the task requires a different branch, tag, or commit.
- A checkout supplied with `HAPPY_HARE_SRC` is user-owned. Read it as-is; never
  fetch, switch revisions, or remove it through the documentation workflow.
- Capture MCU/serial-device screens on a machine with no printer attached. The
  serial-device glob reads attached hardware rather than a fixture.
- When shared menuconfig screens change, inspect all affected profiles and pages.
  Keep screenshot sessions aligned with the capture guidance in
  `doc_tools/README.md`.

Follow the tooling guide for session selection, seeds, capture exploration,
rendering, and generated reference updates. Keep generated output committed with
its source or generator changes.

## Validate and maintain

Follow the checks in `AGENTS.md` and `CONTRIBUTING.md`, including visual review for
presentation changes and the relevant tests for generator changes.

Maintain this skill only under `.agents/skills/`. `.claude/skills` is a relative
symlink to that directory, so both discovery paths read the same files. Record
new conventions in `CONTRIBUTING.md` and generation procedures in
`doc_tools/README.md`; keep this skill focused on routing and essential constraints.
