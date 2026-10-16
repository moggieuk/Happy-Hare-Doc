# Upgrading from v3 to v4

Happy Hare v4 is a major rework - multi-unit machines, a restructured `extras/`
layout, and a new Kconfig/`menuconfig`-driven installer, RFID support, etc.
It is not a drop-in replacement for v3: the Klipper modules, the config file layout,
and the installer itself are all different enough that a v3 config cannot be loaded
by v4 code, and vice versa.

This matters more than a normal version bump because of how most people
update Happy Hare.

## Why this is significant

Happy Hare registers with Moonraker's `update_manager` as a plain
`type: git_repo`. That means Mainsail/Fluidd's "Update" button does nothing
but `git pull` the repository and restart the `klipper` service - it does
**not** run `./install.sh`. That is fine for ordinary updates, where a code
pull is all that is needed. It is not fine for the v3 → v4 jump: v4 adds and
renames enough files that Klipper's `extras/` symlinks (set up by the last
time `install.sh` actually ran) no longer match what the new code needs, and
your `.cfg` files are still in the old v3 layout regardless.

!!! note
    If you are setting up Happy Hare for the first time, none of this
    applies to you - just follow [Installation](Installation.md).

## What you'll see

If you update via Moonraker's update manager (or run a plain `git pull`
yourself) and Klipper pulls in v4 without `install.sh` having been re-run,
Klipper will fail to start with a message telling you to run `./install.sh`,
for example:

```text
Happy Hare's Klipper modules failed to load (...).
This looks like it is because of a update to Happy Hare v4 while you are still configured for v3
To see options please run:
  cd ~/Happy-Hare && ./install.sh
If you know now you just want to stay on v3, run:
  cd ~/Happy-Hare && ./install.sh -b v3
More details: https://moggieuk.github.io/Happy-Hare-Doc/Upgrade-v3-v4/
```

This is expected, and Klipper has not lost anything - your old `.cfg` files
are untouched on disk. Running `./install.sh` as instructed is the next
step, and it will ask you to choose one of the two paths below before it
does anything else. It asks even if you run `./install.sh -b v3`, so choose
option 1 there.

## Your two options

### Stay on v3

Choose this if you're not ready to reconfigure, or you just want things to
keep working exactly as they did.

Choose option 1, the "Blue 'ignorance' pill". `install.sh` switches your
checkout to the `v3` branch and repoints Moonraker's update manager at it
(`primary_branch: v3` instead of `main`), so future updates keep tracking v3
fixes instead of pulling v4 again. The v3 installer then runs a normal v3
upgrade with your existing settings, so your v3 configuration is kept.

You can move to v4 later at any time by running `./install.sh -b main` again
from that checkout and choosing option 2 (upgrade to v4) instead.

!!! note
    The v3 branch will not be actively developed. It is likely the only updates
    will be for breaking Klipper changes or other severe bugs.

### Return to v3 after completing a v4 setup

If you already completed the upgrade and want to return to the preserved v3
configuration, uninstall v4, copy the saved `mmu.V3` directory back into the
active `mmu` location, then switch branches and choose option 1 when asked:

```bash
cd ~/Happy-Hare
./install.sh -d
cp -a ~/printer_data/config/mmu.V3 ~/printer_data/config/mmu
./install.sh -b v3
```

The uninstall removes the Happy Hare includes from `printer.cfg` and the Happy
Hare sections from `moonraker.conf`, and the v3 upgrade run doesn't put the
includes back. Finish by hand:

- Add your v3 includes back to `printer.cfg`: `[include mmu/base/*.cfg]`, plus
  whichever of `mmu/optional/client_macros.cfg`, `mmu/optional/mmu_menu.cfg`,
  `mmu/addons/blobifier.cfg`, `mmu/addons/mmu_erec_cutter.cfg` and
  `mmu/addons/mmu_eject_buttons.cfg` you used. Alternatively, run
  `./install.sh -i` on v3, which walks through the whole v3 questionnaire again
  and offers to add the includes.
- In `moonraker.conf`, set `primary_branch: v3` under
  `[update_manager happy-hare]`, or the next update pulls v4 again.

The uninstall makes a timestamped backup of the active v4 configuration before
removing it and leaves `mmu.V3` untouched. Using `cp -a` retains that original
backup as well. If Klipper uses a non-standard configuration directory, replace
`~/printer_data/config` with the same path supplied to the installer with `-c`.
If several `mmu.V3-*` directories exist, identify the correct saved v3 state
before copying it, and never copy over an existing `mmu` directory.

### Upgrade to v4

Choose this if you want the new features and are willing to reconfigure your
MMU. This is the place to be for frequent updates and all the ease-of-use
updates.

!!! warning
    **Your v3 settings are not carried over automatically.** There is no
    supported v3 → v4 config migration - the installer treats this as a
    fresh setup. `install.sh` walks you through `menuconfig` from scratch,
    then sets your whole v3 `mmu` directory aside and installs v4, exactly as
    described in
    [Installation](Installation.md) and the Getting Started guide for your
    MMU. Keep the backup open in another window to copy across anything you
    tuned by hand (custom macros, calibration numbers you want to reuse as a
    starting point, etc.) - the installer won't do that part for you.

The menuconfig-based setup is really pretty intuitive once you have used it
and you will find it will only take 10 minutes or so to make updates for your
particular setup. It is recommended to open the saved `.cfg` files from
the v3 install in another window for quick reference. While `menuconfig` is
open they are still in `~/printer_data/config/mmu`. Once you save, `install.sh`
renames that directory to `mmu.V3` (or `mmu.V3-<timestamp>` if an `mmu.V3`
already exists), removes the old Happy Hare includes from `printer.cfg` and
`moonraker.conf`, and installs the new v4 files.

## See also

- [Installation](Installation.md)
- [Hardware Validation](Hardware-Validation.md) - prove the generated MCU,
  motor and sensor setup before calibration
- [Getting Started with Box Turtle](GettingStarted-BoxTurtle.md)
- [Getting Started with BTT ViViD](GettingStarted-ViViD.md)
- [Getting Started with EMU](GettingStarted-EMU.md)
- [Getting Started with ERCF](GettingStarted-ERCF.md)
- [Getting Started with Tradrack](GettingStarted-Tradrack.md)
- [Getting Started with MMX](GettingStarted-MMX.md)
---
