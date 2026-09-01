# Contributing

## Reporting a problem

If you need help with your own setup, the
[Discord server](https://discord.gg/98TYYUf6f2) is the right place - GitHub
issues are for bugs and feature requests, not individual setup problems.

Found an actual bug?

- Check it isn't already reported under [Issues](https://github.com/moggieuk/Happy-Hare/issues) first.
- If not, open a new one with a clear title and description, as much relevant
  information as possible, and log files (`klippy.log`, `mmu.log`).

## Sending a fix or a feature

- **Bug fixes**: open a pull request directly. Describe the problem and the
  solution, and reference the issue number if there is one.
- **New features or behavior changes**: don't open an issue *or* a PR
  first - gather feedback on the idea (Discord is the usual place) before
  investing the work. Changes that break existing setups are likely to be
  rejected outright, given how many different MMU/AFC combinations this
  project has to keep working at once.

## Code conventions

Every source file opens with the same header - copy it rather than
inventing a new style:

```python
# Happy Hare MMU Software
#
# Copyright (C) 2022-2026  moggieuk#6538 (discord)
#                          moggieuk@hotmail.com
#
# Goal: <one line saying what this file is for>
#
#
# (\_/)
# ( *,*)
# (")_(") Happy Hare Ready
#
# This file may be distributed under the terms of the GNU GPLv3 license.
#
```

A `# Goal:` line (sometimes several, for a more involved module) stating
*why* the file exists is the norm, not the exception - see practically any
file under `extras/mmu/` for examples ranging from one line to a short design
note. It's worth writing before the code, not after.

Beyond that, the conventions are the ones the rest of this Developer Guide
documents by example rather than by rule - see
[Code Layout](Dev-Code-Layout.md#three-different-kinds-of-extends) for the
three relationships (composition, mixin split, command pattern) a new class
should deliberately pick one of, and
[Testing](Dev-Testing.md#8-working-on-happy-hare-with-this) for the
edit → test → commit loop this project actually runs on.

## Documentation conventions

If your change affects `printer.mmu.*`, adds/removes a command, or changes
`.cfg` templates, the generated reference pages need regenerating, not
hand-editing:

```bash
make command_reference   # doc/Reference-Commands.md
```

`doc/Reference-Printer-Variables.md` has no generator (yet) - it's checked against the
real `get_status()` methods by hand; update it in the same PR if you touch
one. See [Documentation Tooling](Dev-Doc-Tooling.md) for how the rest of this
site is built, and its **Page conventions** section for the one formatting
rule that applies to every page.

## Where to go next

This page is the capstone of the Developer Guide, not the start of it - if
you haven't yet, these are the pages worth reading first:

- [Code Layout](Dev-Code-Layout.md) - the object graph and module boundaries.
- [Kconfig & Installer Architecture](Dev-Kconfig-Structure.md) - how a
  `menuconfig` choice becomes a running config.
- [Testing](Dev-Testing.md) and [The Simulator](Dev-Simulator.md) - running
  and exercising Happy Hare with no printer attached.
- [Documentation Tooling](Dev-Doc-Tooling.md) and
  [Installer Dev (Docker)](Dev-Installer-Docker.md) - the supporting tooling
  around both of the above.

---

