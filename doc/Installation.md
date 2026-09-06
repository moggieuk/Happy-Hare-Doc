# Installation

Happy Hare is a set of Klipper "extra" modules, a Moonraker component, and a
set of macros and config templates. Installing it is the same shape as
installing Klipper itself: clone the repository, then run its install script.
This page covers the parts that are the same regardless of which MMU you're
setting up — cloning, the installer's command-line flags, the optional client
macros, and upgrading later. The actual first-run walkthrough (the
`menuconfig` screens you'll see and the choices worth pausing on) is one page
per MMU type - see the getting started guides for popular machines as examples:

- [3MS](GettingStarted-3MS.md)
- [Box Turtle](GettingStarted-BoxTurtle.md)
- [BTT ViViD](GettingStarted-ViViD.md)

## Cloning Happy Hare

Log into the machine running Klipper (most commonly a Raspberry Pi) as the user you
used to install klipper over SSH using PuTTY, KiTTY, MobaXterm, ssh or similar utility
(e.g. `ssh pi@myprinter.local`), then clone the repository:

```bash
cd ~
git clone https://github.com/moggieuk/Happy-Hare.git
cd Happy-Hare
```

## Running the Installer

Consult the Getting Started guide for your particular MMU type (or pick a design
similar to yours because there is often a lot of overlap) for a walk-through of
essential `menuconfig` screens and hardware verification. In the unusual case
you need special install options keep reading.

```bash
./install.sh
```

The very first time this runs, there's no config yet, so it drops straight
into `menuconfig` automatically - no flag needed for that first pass. On every
later run, `./install.sh` with no flags just re-applies your existing choices
(a safe re-install/upgrade); to go back into `menuconfig` and change
something, add `-i`:

```bash
./install.sh -i
```
The installer looks for Klipper and Moonraker in their standard locations.
If you've customized where they live, or have more than one Klipper instance
on the same machine, override the paths directly:

```text
./install.sh -k <klipper_home_dir> -c <klipper_config_dir> -m <moonraker_home_dir>
```

!!! note
    An existing install is never overwritten outright - it's moved to a
    timestamped backup directory (e.g. `mmu-20260807_102329`) and the new one is
    rebuilt from your previous choices plus whatever you change this run.


## Other, common install options

=== "Test Mode"

    !!! tip
        Nervous about running the installer against a live config? `-t` builds
        and generates configuration in an isolated `/tmp` directory instead of touching your real
        printer config, so you can review results before committing to it.

    This is enabled by specifying `-t` e.g.

    ```bash
    ./install.sh -i -t
    ```
    ```json
    Running in test mode to simulate without changing real configuration
    Forcing flags '-s -c /tmp/mmu_test/printer_data/config -k /tmp/mmu_test/klipper -m /tmp/mmu_test/moonraker /tmp/mmu_test/.mmu_config'
    ```

=== "Multiple MMU's"

    Happy Hare can manage multiple MMU's connected to the same printer. Each MMU can
    can be named to make it easier to identify its configuration.

    This is enabled by specifying `-n` e.g.

    ```bash
    ./install.sh -i -n
    ```

=== "Per Lane Controllers"

    For MMU's like EMU that use dedicated controllers/MCU's per lane, support needs
    to be enabled by specifying `-e`/`-emu` e.g. 

    ```bash 
    ./install.sh -i -e
    ```

=== "Full install flag reference"

    ```text
    -i for interactive install (open menuconfig)
    -u, -d for uninstall
    -f to just restore klipper/moonraker symlinks (recover after hard klipper update)
    -z skip github update check (nullifies -b <branch>)
    -s to skip restart of services
    -b <branch> to switch to specified feature branch (sticky)
    -n to specify a multiple MMU unit setup
    -k <dir> non-default klipper home directory
    -c <dir> non-default klipper config directory
    -m <dir> non-default moonraker home directory
    -a <name>  alternative Klipper service name (e.g. when installed via Kiauh)
    -e, --emu Enables multi MCU support (for EMU design)
    -o Override compatibility checks (e.g. Kalico detection)
    -t  test mode - write config to /tmp instead of your real install
    (-q verbose make for debugging)
    (-v verbose builder for debugging)
    ```

## Client Macros

`menuconfig`'s final section asks:

> Install default client macros supplied with Happy Hare? (STRONGLY recommended)

Saying yes (the default) includes `client_macros.cfg` - ready-made
`PAUSE`/`RESUME`/`CANCEL_PRINT` macros that already know how to work with
Happy Hare's own toolhead-parking logic on an MMU error, rather than just the
plain Klipper versions. If you already have your own `PAUSE`/`RESUME` macros and
want to keep them, say no here - see
[Operation](Operation.md#what-happens-when-the-mmu-pauses) for what your own
macros need to account for.

!!! info
    The installer will insert `[include mmu/optional/client_macros.cfg]` into
    `printer.cfg` after the last `[include ... ]` block, or at the end of
    `printer.cfg` to ensure these macros are used in preference to
    any other `PAUSE`/`RESUME`/`CANCEL_PRINT` macros.

## Upgrading

Happy Hare registers itself with Moonraker's update manager, so routine
updates show up the same way any other Klipper plugin's do - Mainsail/Fluidd
will offer an update when one's available (allow up to 24 hours, or click the
refresh arrow to check immediately).

Occasionally an update needs more than a code pull - a config or menuconfig
change that update manager alone can't apply. When that happens, re-run the
installer with no flags from your Happy-Hare checkout:

```bash
cd ~/Happy-Hare
./install.sh
```

This is always safe to run speculatively - if there's nothing to do it does
nothing, and every run backs up your existing config to a fresh timestamped
directory first regardless. If you installed with custom paths (`-k`, `-c`,
or `-m`), pass the same flags again here, or the upgrade will look in the
default locations and likely miss your actual install.

## Troubleshooting

- **"`step pin not defined for...`" at Klipper startup** - usually means a
  Klipper update wiped the symlinks Happy Hare needs. Run `./install.sh -f`
  to restore just the symlinks without going through the rest of the
  installer.
- **Multiple Klipper instances on one machine** (e.g. via Kiauh) - use `-a
  <service_name>` together with `-k`/`-c` pointed at that instance's
  directories.
- **Running on something other than a standard Klipper environment** (a
  Kalico-based fork, for example) - the installer checks for this and may
  refuse to continue; `-o` overrides the compatibility check if you're sure
  it's fine to proceed.

## See also

- [Getting Started with Box Turtle](GettingStarted-BoxTurtle.md)
- [Getting Started with BTT ViViD](GettingStarted-ViViD.md)
- [Operation](Operation.md) - what happens when the MMU pauses, and how to
  resume/recover

---
