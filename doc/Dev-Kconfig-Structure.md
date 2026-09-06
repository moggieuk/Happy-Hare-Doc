# Kconfig & Installer Architecture

How a `menuconfig` choice becomes a real `.cfg` file on the printer - the
pipeline behind guides such as [Getting Started with Box Turtle](GettingStarted-BoxTurtle.md)
and [doc_tools' screenshot pipeline](Dev-Doc-Tooling.md), from a contributor's
side rather than a user's.

## The three stages

```text
installer/Kconfig*  ──[menuconfig / olddefconfig]──▶  .mmu_config
(the menu tree)                                       (one flat key=value file)
                                                              │
                                                              │ [installer/build.py + Jinja]
                                                              ▼
                                                       config/*.cfg templates
                                                              │
                                                              │ [rendered]
                                                              ▼
                                                       Real .cfg files on the printer
                                                       (what extras/mmu/ actually loads)
```

1. **The menu tree** (`installer/Kconfig` and everything it pulls in) defines
   every question `menuconfig` can ask and every symbol that can end up in
   `.mmu_config`.
2. **`.mmu_config`** is kconfiglib's own flat `CONFIG_X=y` / `CONFIG_Y="value"`
   file - the single source of truth for one printer's choices. Nothing
   downstream reads the Kconfig tree directly; everything reads this file.
3. **`installer/build.py`** renders the Jinja templates in `config/` against
   `.mmu_config`, producing the real `mmu.cfg`, `mmu_hardware.cfg`,
   `mmu_parameters.cfg` etc. that `extras/mmu/` actually loads on the printer
   - the object graph described in [Code Layout](Dev-Code-Layout.md).

## The menu tree itself

```text
installer/
├── Kconfig                  mainmenu + top-level structure
├── Kconfig.<feature>        one file per feature area - espooler, encoder,
│                             sync_feedback_buffer, purging, tip_shaping, ...
├── mmu_types/Kconfig.<name>  one file per supported MMU (box_turtle, ercf, ...)
│   └── starters/             Kconfig.everything / Kconfig.custom - starting points
├── boards/Kconfig.<name>     one file per supported controller board
│   ├── per_gate/              per-gate board variants (ebb, slb)
│   └── custom/                 fully custom board starting points
├── toolheads/Kconfig.<name>  one file per supported toolhead combination
├── servos/Kconfig.<name>     one file per supported servo model
├── sensors/Kconfig.*         entry/exit/gear-touch/shared-exit sensor options
├── connection/Kconfig.*      mmu_mcu / buffer_mcu connection options
├── macro_vars/Kconfig.*      per-macro tunable variable groups (cut_tip, purge, ...)
└── lib/kconfiglib/            a vendored, patched copy of kconfiglib itself
```

Adding support for a new board, toolhead, servo, or MMU type is - almost
always - adding exactly one new `Kconfig.<name>` file in the matching
directory, not editing an existing one. That one-file-per-variant convention
is *why* there are over 130 `Kconfig*` files in `installer/` for what is,
conceptually, one menu.

## Happy Hare's Kconfig dialect

`installer/Kconfig`'s own header comment is the authoritative list, since
these are local extensions on top of standard kconfiglib syntax - nothing
here is documented anywhere else:

- **`generated_default "<template>" "<args>" [start] [stop]`** - a default
  value computed from other symbols by string formatting, optionally
  repeated (`{iter}`) across a range. This is how, for example, a per-gate
  LED pixel range default gets built from `PARAM_NUM_GATES` without a
  hand-written default for every possible gate count.
- **A `float` type**, beyond kconfiglib's usual `bool`/`int`/`string`/`hex`.
- **`force_show`** - display a symbol even when its normal dependency isn't met.
- **The `#~DEFAULT~#` marker** - records whether a value in `.mmu_config`
  still matches its computed default, which is what lets menuconfig show
  `(NOT DEFAULT)` next to anything you've actually changed, and what the `R`
  key resets against.
- **`@repeat var=i min=0 max=3@ ... @endrepeat@`** - textual macro expansion
  for near-identical repeated blocks (e.g. one config stanza per gate),
  nestable.
- **Font manipulators** in prompts/help text - `[[B]]bold[[/B]]`,
  `[[COLOR:n]]`, etc.
- **`array_editor <separator> [size]`** - a dedicated editor for
  comma/semicolon-separated list values, rather than editing the raw
  delimited string.
- Plus menuconfig-side changes: the `R` reset-to-default key, an array
  editor UI, and general formatting/style work.

`installer/lib/kconfiglib/kconfiglib.py` is where most of this actually
lives - a patched copy of the upstream [kconfiglib](https://github.com/ulfalizer/Kconfiglib)
project (the same library behind the Linux kernel's own `menuconfig`), not a
from-scratch parser.

## From `.mmu_config` to real `.cfg` files

`installer/build.py` is the renderer. Given a `.mmu_config`, it:

- Loads it with kconfiglib and evaluates every symbol.
- Renders the Jinja templates in `config/base/`, `config/macros/` and
  `config/optional/` against that symbol set.
- On an **upgrade** (an existing install, not a fresh one), reconciles the
  freshly-rendered output against whatever's actually on disk using
  `installer/parser.py` - a layout-preserving `.cfg` parser (tokenizer → AST
  → writer) built specifically so a user's hand-edits survive a
  regeneration. This is the **Refresh / Replace / Merge** choice `./install.sh -i`
  asks about when it detects a conflict - see the note on it in
  [Getting Started with Box Turtle](GettingStarted-BoxTurtle.md#saving-and-coming-back-later).
- Runs any applicable `installer/upgrades.py` step - a per-version-pair
  `upgrade_<from>_to_<to>(self, cfg)` method that migrates old option names/
  values forward. Every function currently in that file is commented out
  (they're v3-era examples, kept as a template) - the mechanism is real and
  wired up, just unused since the v4 baseline; the next breaking config
  change is what would add a live one.

## Running `./install.sh` without touching your printer

`./install.sh` is the end-user entry point wrapping everything above - git
branch handling, `menuconfig`, rendering, Moonraker's update-manager, and
service restarts. Two flags matter enough for day-to-day development that
they're worth knowing before the first run, not discovering by accident:

- **`-z`** - skip the git self-update / branch-switch step
  (`installer/self_update.sh`) that `./install.sh` otherwise runs
  automatically on every invocation. Without it, a plain `./install.sh` while
  you have local uncommitted changes can pull and re-exec itself before you
  expect - `-z` is how you stop it from touching your working tree at all.
- **`-t`** - test mode. Sets `TESTDIR=/tmp/mmu_test` and redirects
  everything the run would normally touch to live under it instead:
  `CONFIG_KLIPPER_HOME`, `CONFIG_KLIPPER_CONFIG_HOME`
  (`/tmp/mmu_test/printer_data/config`), `CONFIG_MOONRAKER_HOME`, and
  `KCONFIG_CONFIG` itself (`/tmp/mmu_test/.mmu_config`) - plus service
  restarts are disabled. Your real `.mmu_config` and printer config are never
  opened. When it finishes, the rendered result is sitting at
  `/tmp/mmu_test/printer_data/config/mmu/` for inspection, exactly as if it
  had been installed for real.

Combined - `./install.sh -z -t` - is the safe way to run the *entire*
installer, `menuconfig` included, against a disposable sandbox: nothing
about your own machine or repo checkout is at risk, and the result is real
enough to point other tooling at afterward, e.g.
`make console ARGS='--profile /tmp/mmu_test/printer_data/config'` (see
[The Simulator](Dev-Simulator.md#running-against-your-own-installed-config)).

## Where to go next

- [Code Layout](Dev-Code-Layout.md) - what the rendered `.cfg` files actually
  get loaded into.
- [Testing](Dev-Testing.md) - `test/hh/cfg.py` renders the same templates
  this page describes, from Python profiles rather than an interactive menu,
  and caches the Kconfig parse per profile for speed.
- [Documentation tooling](Dev-Doc-Tooling.md) - drives real `menuconfig`
  sessions to produce the screenshots on this site.

---


