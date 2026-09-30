# Repository instructions

This repository contains the Happy Hare documentation site and its generation
tools. Happy Hare's application source lives in a separate repository.

## Read before working

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing documentation or site
  presentation. It is the authoritative source for documentation conventions
  and page templates.
- Read [doc_tools/README.md](doc_tools/README.md) when changing generators or
  regenerating screenshots and command references. Keep procedural details there.
- Use [maintainer/roadmap.md](maintainer/roadmap.md) for outstanding work.
  Consult the archive linked there only when historical research is relevant;
  it is not a list of current instructions.
- Skills are task-specific aids. If a skill disagrees with `CONTRIBUTING.md`,
  follow the contribution guide and update the stale guidance.

## Repository layout

- `doc/`: published Markdown and images. Pages are normally `doc/Foo.md`, with
  their images in `doc/Foo/`.
- `mkdocs.yml`: Zensical configuration and the actual site navigation. Keep this
  filename; the site uses Zensical with the compatible configuration format.
- `doc_tools/`: generators, screenshot capture/rendering, and validation tools.
- `site/`: generated website; do not commit it.
- Root contribution guides and planning notes are outside the published site.
- `.agents/skills/`: shared repository skills. `.claude/skills` is a relative
  symlink to this directory; maintain skills in `.agents/skills/` only.

## Source checkouts and generated content

Building or previewing the site uses the Markdown and images committed here;
it does not require a Happy Hare source checkout.

`make shots` and `make command_reference` require Happy Hare source. The default
`.happy-hare-src/` is a disposable managed cache refreshed to `HAPPY_HARE_REF`
before each source-dependent run. Select a different ref with a Make command-line
override when required by the task.

A checkout supplied through `HAPPY_HARE_SRC` is user-owned: read it as-is; do not
fetch, switch revisions, or remove it as part of documentation generation.
Keep generated documentation and screenshots in `doc/` committed with the change.
Do not hand-edit generated command references; update their source or generator
and regenerate them.

Shared menuconfig changes affect multiple guides. Review every affected MMU
profile and feature page, not just the profile used during development.

## Validation and handoff

- Run `make docs_check` for documentation, navigation, image, or site changes.
  This runs a strict build and checks navigation and image references.
- Run `make spellcheck` for maintained prose and supporting source changes.
- Preview affected pages when changing layout, styling, or screenshots; a build
  cannot detect every visual problem.
- For generator changes, run the relevant tests and inspect regenerated output
  using the procedures in `doc_tools/README.md`.
- When porting a wiki page, compare it section by section with the original and
  report omitted material and the reason for each omission.
- Report what changed, the checks performed, and any remaining limitations.

Record new documentation conventions in `CONTRIBUTING.md`, tooling procedures in
`doc_tools/README.md`, and planning updates in `maintainer/roadmap.md`. Avoid maintaining separate
copies of the same rules for different agents.
