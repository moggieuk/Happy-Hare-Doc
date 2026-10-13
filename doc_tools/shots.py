# The screenshots the documentation needs.
#
#   make shots                        # regenerate every session's images
#   make shots ARGS='--list'          # the sessions, and what each one covers
#   make shots ARGS='--only getting-started-boxturtle'
#   make shots ARGS='--seed ~/printer_data/.mmu_config'   # against a real machine
#
# A SESSION IS ONE menuconfig, MANY IMAGES. Parsing the Kconfig tree costs several
# seconds, so a session starts the installer once, walks it, and captures along the
# way - `shot('name')` writes name.png under the session's 'outdir' and carries on
# from where it is. Group screens that belong to the same walkthrough into one
# session; start a new one when the seed or the unit has to change.
#
# EVERY SESSION NAMES A REAL PAGE. There is no shared demo pool: a session exists
# because doc/Something.md embeds its images, and its 'outdir' is that page's own
# folder (see doc_tools/README.md). Falling back to the shared doc/images/ default
# is for CAPTURE=1 exploration only - don't add a session that writes there, or
# `make shots` starts regenerating pictures nothing reads.
#
# HEIGHT LOOKS AFTER ITSELF. Each shot() fits the terminal to the screen in front of
# it, so no image contains menuconfig's row of scroll arrows and none carries a band
# of dead space either - subject to a 30-row floor, so a two-item menu still looks like
# the installer rather than a cropped fragment. Sessions do not set 'rows'; pass
# 'min_rows' to change the floor, or 'fit': False and a 'rows' to pin a height.
#
# ALWAYS ASSERT THE LANDING SCREEN. Use mc.enter()/mc.edit()/mc.step(), which raise
# when the expected screen does not arrive, rather than mc.key(), which tolerates a
# keypress that changed nothing. A missed key produces a perfectly plausible PNG of
# the WRONG screen, and nobody reviewing an image can tell that is what happened.
#
# EDITS ARE CANCELLED, NOT APPLIED. mc.edit() opens a parameter's editor so it can be
# photographed; mc.cancel() closes it without changing anything, so the screens after
# it still show the machine the seed described. (Applying would be harmless to the
# real config - the session works on a copy - but not to the rest of the session.)
#
# This file may be distributed under the terms of the GNU GPLv3 license.

from __future__ import annotations

import argparse
import os
import sys
import traceback
import shutil
import tempfile
from contextlib import ExitStack
from pathlib import Path

from .capture import (DEFAULT_COLS, DEFAULT_SEED, DOC, IMAGES, MIN_ROWS,
                      Menuconfig, ScreenError, symbol, menu_of)

# ---------------------------------------------------------------------------
# The sessions. Extend these; the runner needs no changes.
#
#   name     --only key, and the prefix for anything the session does not name
#   caption  what the session covers, for whoever writes the prose
#   scenes   f(mc, shot) - navigate, calling shot('image-name') at each screen
#   outdir   where this session's images go, relative to doc/ - name it after the
#            page (e.g. 'GettingStarted-BoxTurtle'). Every session should set
#            this; see the header above.
#   seed     a config to start from - a built-in name or a path (default: boxturtle)
#   min_rows shortest a fitted screenshot may be (default 30, for a consistent set)
#   fit      False to stop autofitting and honour 'rows' instead
#   rows     starting height; only meaningful with 'fit': False
#   unit_name / multi_unit / entry_point - inferred from the seed, override here
# ---------------------------------------------------------------------------


def _additions(mc):
    """Fit the grouped additions menu before navigating off-screen settings."""
    mc.enter('MMU Features / Additions')
    mc.autofit()


def _hardware_menu(mc, title):
    """Enter a hardware submenu from a short terminal to avoid stale parent rows."""
    mc.autofit()
    mc.select(title)
    mc.resize(MIN_ROWS)
    mc.enter()


def _getting_started_boxturtle(mc, shot):
    """
    For doc/GettingStarted-BoxTurtle.md - the installer screens a first-time Box
    Turtle owner walks through, in that order. Runs from a bare Kconfig ('seed': None)
    rather than the boxturtle seed used elsewhere, because the page is about DRIVING
    menuconfig - selecting MMU Type is the first real thing a reader does with it,
    and the root-warnings screen is only informative if the warnings visibly clear as
    a result of that choice, which requires starting before it happens.
    """
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('01-first-run')  # every field still a placeholder

    mc.enter(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    mc.select(symbol('MMU_TYPE_BOX_TURTLE_1_0'))
    mc.toggle()
    shot('02-mmu-type-boxturtle')  # (X) Box Turtle; Turtle Neck now offered

    mc.enter(symbol('CHOICE_TURTLE_NECK'))
    shot('03-turtleneck-buffer')  # v2 is the default - nothing to change
    mc.back()
    mc.back()  # -> (Top)

    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('04-root-warnings')  # only the (later-page) toolhead warning remains

    mc.enter(symbol('BOARD_TYPE'))
    shot('05-board-type')  # AFC Lite v1.0 - the board this MMU shipped with
    mc.back()
    mc.key(b'g')
    mc.autofit()
    mc.repaint()

    mc.enter('MCU connection')
    shot(
        '06-mcu-connection')  # Serial - already right for a USB-attached board
    mc.back()
    mc.key(b'g')
    mc.autofit()
    mc.repaint()

    _additions(mc)
    shot('07-mmu-features')  # LEDs/eSpooler/buffer already on; nothing to add

    _hardware_menu(mc, 'eSpooler config')
    mc.select(symbol('PIN_ESPOOLER_EN_0'))
    shot('07a-espooler-config')  # AFC Lite enable/rewind/forward pins per gate
    mc.back()

    _hardware_menu(mc, 'Buffer config')
    shot('07b-buffer-config')  # Turtle Neck range, spring state and switch pins
    mc.back()
    mc.back()
    mc.key(b'g')
    mc.autofit()
    mc.repaint()

    mc.enter('Pins / TMC')
    mc.enter(menu_of('PIN_GEAR_DIR'))
    shot('08-gear-pins')  # every gate's step/dir/enable/diag pin

    mc.edit(symbol('PIN_GEAR_DIR'))
    shot('09-gear-dir-editor')  # the pin nobody can predict from a drawing
    mc.write('!unit0:PD3')
    shot('10-gear-dir-inverted')  # '!' reverses it - no rewiring, no cfg edits
    mc.cancel()  # this page only shows the move; it does not make it
    mc.back()
    mc.back()  # -> (Top)
    mc.key(b'g')
    mc.autofit()
    mc.repaint()

    mc.enter(symbol('CHOICE_TOOLHEAD_TYPE'))
    mc.select(symbol('TOOLHEAD_TYPE_STEALTHBURNER_CLOCKWORK2_REVO_VORON'))
    mc.toggle()
    # settle the resize (24 items don't fit the starting height) BEFORE re-selecting
    # - it re-homes the cursor to the top, and shot()'s own autofit is a no-op once
    # already fitted
    mc.autofit()
    mc.select(symbol('TOOLHEAD_TYPE_STEALTHBURNER_CLOCKWORK2_REVO_VORON'))
    shot('11-toolhead-selected')  # (X) on the choice, highlight on it too
    mc.back()  # -> (Top)
    mc.key(b'g')
    mc.autofit()
    mc.repaint()

    mc.enter('Toolhead sensors/settings')
    # extruder-to-nozzle/residual filled in from the choice above - the sensor-gated
    # ones (toolhead/extruder sensor distances) stay hidden since this Box Turtle
    # has neither
    shot('12-toolhead-dimensions')


def _getting_started_vivid(mc, shot):
    """
    For doc/GettingStarted-ViViD.md - the installer screens a first-time BTT ViViD
    owner walks through. Like the Box Turtle session, starts from a bare Kconfig
    ('seed': None) so selecting MMU Type is the first real action, not something the
    seed already decided.

    Deliberately NOT entered further: the "Select serial device for ..." rows visible
    on the 03/04 shots below. They list live /dev/serial/by-id/* entries (see
    capture.py's REPRODUCIBILITY note) - on this capture machine that is empty, so
    entering one just shows "Other / manually entered" and nothing else, not the
    illustrative device names the page's prose uses. The "MCU connection"/"Buffer MCU
    connection" screens captured here are the reproducible part of that same story -
    each shows its connection-type row (Serial, already right for a USB board) and
    the resolved-device row alongside it, without depending on what is plugged in.
    """
    mc.enter(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    mc.select(symbol('MMU_TYPE_VVD_1_0'))
    mc.toggle()
    shot('01-mmu-type-vivid')  # (X) BTT ViViD; buffer sub-option auto-checked
    mc.back()  # -> (Top)

    mc.enter(symbol('BOARD_TYPE'))
    shot('02-board-type')  # BTT ViViD MCU - the only board this type uses
    mc.back()

    mc.enter('MCU connection')
    # Serial - already right for the ViViD unit's own MCU
    shot('03-mcu-connection')
    mc.back()

    mc.enter('Buffer MCU connection')
    # a SECOND, separate MCU connection - the buffer's own
    shot('04-mcu-connection-buffer')
    mc.back()  # -> (Top)

    _additions(mc)
    shot('05-mmu-features')  # LEDs/env sensor/heater/NFC readers already on
    mc.back()  # -> (Top)

    mc.enter(symbol('CHOICE_TOOLHEAD_TYPE'))
    mc.select(symbol('TOOLHEAD_TYPE_STEALTHBURNER_CLOCKWORK2_REVO_VORON'))
    mc.toggle()
    # settle the resize before re-selecting (see the
    # Box Turtle session's identical comment)
    mc.autofit()
    mc.select(symbol('TOOLHEAD_TYPE_STEALTHBURNER_CLOCKWORK2_REVO_VORON'))
    shot('06-toolhead-selected')  # same generic choice, not ViViD-specific
    mc.back()  # -> (Top)

    mc.enter('Software Options')
    mc.select(symbol('PARAM_SPOOLMAN_NFC_AUTO_CREATE'))
    mc.toggle()
    # worth having, since ViViD ships NFC readers already
    shot('07-spoolman-nfc-autocreate')
    # No mc.enter('Spoolman') step - "Spoolman" is a `comment` section divider on this
    # same Software Options screen, not a submenu; the item above is selectable in place.


def _getting_started_mmx(mc, shot):
    """
    For doc/GettingStarted-MMX.md - the first menuconfig pass for the original
    four-gate MMX servo-cam design. Starts bare so the MMX choice itself is part
    of the walkthrough, then selects the EBB42 reference board used by the MMX
    project. The scene deliberately enables both real sensor groups from that
    reference build: four entry sensors and the PB4 shared-exit sensor.
    """
    mc.enter(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    mc.select(symbol('MMU_TYPE_MMX_1_0'))
    mc.toggle()
    shot('01-mmu-type-mmx')
    mc.back()  # -> (Top)

    mc.enter(symbol('BOARD_TYPE'))
    mc.select(symbol('BOARD_TYPE_EBB_GEN1'))
    mc.toggle()
    mc.autofit()
    mc.select(symbol('BOARD_TYPE_EBB_GEN1'))
    shot('02-board-type-ebb42')
    mc.back()  # -> (Top)
    mc.autofit()

    _additions(mc)
    shot('03-mmu-features')
    _hardware_menu(mc, 'Filament sensors')
    mc.select(symbol('MMU_HAS_SENSOR_ENTRY'))
    mc.toggle()
    mc.select(symbol('MMU_HAS_SENSOR_SHARED_EXIT'))
    mc.toggle()
    mc.autofit()
    mc.select(symbol('MMU_HAS_SENSOR_ENTRY'))
    shot('04-filament-sensors')
    mc.back()
    mc.back()  # -> (Top)
    mc.autofit()

    mc.enter('Pins / TMC')
    shot('05-pins')
    mc.enter('Mmu entry sensor pins')
    shot('06-entry-sensor-pins')
    mc.back()
    mc.back()  # -> (Top)
    mc.autofit()

    mc.enter('Endstops and Bowden movement')
    shot('07-endstops')


def _getting_started_3ms_additions(mc, shot):
    """
    Refresh the top menus and MMU Features / Additions screen embedded in
    doc/GettingStarted-3MS.md, selecting 3MS from a bare configuration.
    """
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('01-first-run')
    mc.enter(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    mc.select(symbol('MMU_TYPE_3MS_1_0'))
    mc.toggle()
    mc.back()
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('03-root-warnings')
    _additions(mc)
    shot('06-mmu-features')


def _getting_started_ercf_additions(mc, shot):
    """
    Refresh the top menus and MMU Features / Additions screen embedded in
    doc/GettingStarted-ERCF.md. Choose ERCF interactively so family-level fixed
    capabilities are applied just as they are in the guide.
    """
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('01-first-run')
    mc.enter(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    mc.select(symbol('MMU_FAMILY_ERCF'))
    mc.toggle()
    mc.back()
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('06-root-warnings')
    _additions(mc)
    mc.autofit()
    mc.select('Encoder config')
    shot('12-mmu-features')


def _getting_started_tradrack_additions(mc, shot):
    """
    Refresh the top menus and MMU Features / Additions screen embedded in
    doc/GettingStarted-Tradrack.md. Start bare so the scene can select Tradrack;
    there is no dedicated Tradrack seed.
    """
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('01-first-run')
    mc.enter(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    mc.select(symbol('MMU_TYPE_TRADRACK_1_0'))
    mc.toggle()
    mc.back()
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('06-root-warnings')
    _additions(mc)
    shot('12-mmu-features')


def _installer_top(mc, shot):
    """Current top menu for the general menuconfig guide."""
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('GettingStarted-Installer-Configurator')


def _installation_unit_name(mc, shot):
    """Show the separate object name and UI label for the first MMU."""
    mc.enter(menu_of('PARAM_DISPLAY_NAME'))
    mc.select(symbol('UNIT_NAME'))
    shot('01-unit-name')


def _getting_started_multi_unit_shared(mc, shot):
    """
    For doc/GettingStarted-Multi-Unit.md - the aquatic-colored shared-config
    entry point used by install.sh -i -n.
    """
    # Open the initially selected unit list without resizing under the dialog.
    mc.step(b'l', lambda menu: menu.in_editor())
    mc.append_entry('unit1')
    shot('02-unit-names-editor')
    mc.cancel()
    shot('01-shared-config')  # alternate palette and shared settings


def _getting_started_multi_unit_second(mc, shot):
    """
    For doc/GettingStarted-Multi-Unit.md - a brand-new unit1. This is a per-unit
    parse, so it uses menuconfig's normal palette and exposes sharing choices for
    hardware which may already exist on unit0.
    """
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('03-unit1-config')  # regular palette, Unit: unit1

    _additions(mc)
    mc.select(symbol('MMU_HAS_SYNC_FEEDBACK_BUFFER'))
    mc.toggle()
    _hardware_menu(mc, 'Buffer config')
    mc.select(symbol('MMU_SHARED_SYNC_FEEDBACK_BUFFER'))
    mc.toggle()
    mc.edit(symbol('PARAM_SYNC_FEEDBACK_BUFFER_NAME'))
    mc.write('unit0')
    mc.step(b'\r', lambda menu: not menu.in_editor())
    # Re-enter after the toggle replaces the local hardware fields.
    mc.back()
    mc.back()
    _additions(mc)
    _hardware_menu(mc, 'Buffer config')
    mc.select(symbol('MMU_SHARED_SYNC_FEEDBACK_BUFFER'))
    shot('04-unit1-shared-buffer')  # sharing enabled for unit1

    mc.edit(symbol('PARAM_SYNC_FEEDBACK_BUFFER_NAME'))
    shot('05-shared-buffer-name')  # name the shared buffer object
    mc.cancel()


def _getting_started_emu(mc, shot):
    """
    For doc/GettingStarted-EMU.md - the installer screens a first-time EMU
    owner walks through, in that order. Runs from a bare Kconfig ('seed': None)
    rather than the boxturtle seed used elsewhere, because the page is about DRIVING
    menuconfig - selecting MMU Type is the first real thing a reader does with it,
    and the root-warnings screen is only informative if the warnings visibly clear as
    a result of that choice, which requires starting before it happens.
    """
    mc.select(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    shot('01-first-run')  # every field still a placeholder

    mc.enter(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    mc.select(symbol('MMU_TYPE_EMU_1_0'))
    mc.toggle()
    shot('02-mmu-type-emu')  # (X) EMU; PSF now offered

    mc.select(symbol('PARAM_NUM_GATES'))
    shot('03-num-gates')
    mc.back()  # -> (Top)

    mc.enter(symbol('BOARD_TYPE'))
    mc.select(symbol('BOARD_TYPE_EBB_GEN1'))
    mc.toggle()
    shot('04-board-type')  # only the (later-page) toolhead warning remains
    mc.back()

    _additions(mc)
    shot('06-mmu-features')
    mc.back()

    mc.enter('MCU connection')
    mc.enter('MCU connection')
    shot('05-mcu-connection')
    mc.back()
    mc.back()

    mc.enter('Pins / TMC')
    mc.enter(menu_of('PIN_GEAR_DIR'))
    shot('07-gear-pins')
    mc.edit(symbol('PIN_GEAR_DIR'))
    shot('08-gear-dir-editor')
    mc.write('!unit0_gate0:PD1')
    shot('09-gear-dir-inverted')
    mc.cancel()
    mc.back()
    mc.back()

    mc.enter('Speeds')
    shot('10-speeds')
    mc.back()

    # Resolve the named choice without matching 'Toolhead sensors/settings'.
    mc.enter(symbol('CHOICE_TOOLHEAD_TYPE'))
    mc.autofit()
    mc.select(symbol('TOOLHEAD_TYPE_A4T_WWBMG_FOR_A4T_DRAGON_ACE'))
    shot('11-toolhead')
    mc.back()

    mc.enter('Toolhead sensors/settings')
    shot('12-toolhead-dimensions')
    mc.back()


def _getting_started_emu_environment(mc, shot):
    """Per-gate hardware menus on an EMU with optional heater and vent enabled."""
    _additions(mc)
    for title, name in (
        ('Environment sensor h/w config', '06a-environment-gates'),
        ('Fan h/w config', '06b-fan-gates'),
        ('Heater h/w config', '06c-heater-gates'),
        ('Vent servo h/w config', '06d-vent-gates'),
    ):
        _hardware_menu(mc, title)
        shot(name)
        mc.back()


def _feature_espooler(mc, shot):
    """
    For doc/Feature-Espooler.md - the per-gate pin entry screen for the eSpooler
    feature. Uses the boxturtle seed (default), which already has eSpooler enabled,
    so the menu is reachable without any setup in the scene itself.

    'eSpooler pins' used to be its own submenu, directly under 'MMU Features /
    Additions'. Since the eSpooler tuning options (assist/rewind burst, speed
    exponent, etc.) were exposed via menuconfig, the pins moved to being the tail
    section of the now much longer 'eSpooler config' menu instead - select into
    the first pin row rather than trying to enter a submenu that no longer exists.
    """
    _additions(mc)
    _hardware_menu(mc, 'eSpooler config')
    mc.select(symbol('PIN_ESPOOLER_EN_0'))
    shot('espooler-pins')  # one row of rewind/forward/enable/trigger per gate


def _feature_sync_feedback_buffer(mc, shot):
    """
    For doc/Feature-Sync-Feedback-Buffer.md - the buffer hardware screen and the
    separate motor-sync screen. Uses the boxturtle seed (default), which already has
    a Turtle Neck v2 (dual switch) buffer fitted, so both menus are reachable without
    any setup in the scene itself.
    """
    _additions(mc)
    _hardware_menu(mc, 'Buffer config')
    # range/maxrange, spring state, both switch pins fitted
    shot('buffer-config')
    mc.back()
    mc.back()  # -> (Top)

    mc.enter('Other Settings')
    mc.enter('MMU/Extruder sync')
    shot('motor-sync')  # dynamic sync feedback + synchronized gear current


def _feature_nfc(mc, shot):
    """
    For doc/Feature-NFC.md - the shared-reader half of NFC reader config. Uses the
    'ercf' seed rather than the default boxturtle: NFC is opt-in and off by default
    for every MMU type (BETA), so enabling it is scene setup regardless of vendor -
    but ERCF's moving-carriage/servo design is the more natural fit for "present a
    spool to one shared reader by hand" than Box Turtle's gear-per-gate layout,
    matching how the page itself frames a shared reader.
    """
    _additions(mc)
    mc.select(symbol('MMU_HAS_NFC_READER'))
    mc.toggle()
    mc.autofit()  # new items just appeared below
    _hardware_menu(mc, 'NFC reader h/w config')
    mc.select(symbol('MMU_HAS_COMMON_NFC_READER'))
    mc.toggle()
    mc.autofit()  # reader name/type/pin fields just appeared
    mc.select(symbol('MMU_HAS_COMMON_NFC_READER'))
    # name/type/CS pin/SPI bus/speed - RC522 defaults
    shot('shared-reader-config')


def _feature_td1(mc, shot):
    """TD-1 assignment and capture policy; no attached USB hardware needed."""
    _additions(mc)
    mc.select(symbol('MMU_HAS_TD1'))
    mc.toggle()
    mc.autofit()
    _hardware_menu(mc, 'TD-1 scanner config')
    mc.select(symbol('MMU_HAS_OFFPATH_TD1'))
    mc.toggle()
    mc.autofit()
    shot('scanner-config')
    mc.back()
    _hardware_menu(mc, 'TD-1 params')
    shot('capture-policy')


def _feature_leds(mc, shot):
    """
    For doc/Feature-LEDs.md - the LED config screen and the Neopixel pin
    prompt (a different menu entirely - Pins / TMC, not MMU Features /
    Additions). Uses the boxturtle seed (default), which already has LEDs
    enabled, so no scene setup is needed.
    """
    _additions(mc)
    _hardware_menu(mc, 'LED config')
    # enable/animation, frame rate, chain count, color order, segments
    shot('led-config')
    mc.back()
    mc.back()  # -> (Top)

    mc.enter('Pins / TMC')
    # Misc pins section - just the Neopixel pin on this seed
    shot('neopixel-pin')


def _feature_gate_ttg_maps(mc, shot):
    """
    For doc/Feature-Gate-TTG-Maps.md - the automap strategy/reset-TTG screen.
    Generic macro-variable settings, not MMU-type-specific, so the boxturtle
    seed (default) needs no setup.
    """
    mc.enter('Macro Variables')
    mc.enter('(_MMU_SOFTWARE)')
    mc.select(symbol('CHOICE_SOFTWARE_AUTOMAP_STRATEGY'))
    # strategy choice + reset-TTG-at-end-of-print checkbox
    shot('automap-strategy')


def _feature_filament_bypass(mc, shot):
    """
    For doc/Feature-Filament-Bypass.md - the "Associate bypass with this
    unit?" prompt. Lives under MMU Type -> <the selected type>'s own
    "Design attributes" submenu, not a general advanced-settings screen -
    confirmed by walking the real Kconfig node tree for BOOL_HAS_BYPASS
    rather than guessing, since it's nested differently per MMU type
    (Box Turtle's own path used here). Uses the boxturtle seed (default).
    """
    mc.enter(menu_of('MMU_TYPE_BOX_TURTLE_1_0'))
    # Box Turtle is a choice radio button, already selected by the seed - its
    # own "Design attributes" submenu appears as a nested item directly below
    # it on this same screen, not behind entering "Box Turtle" itself.
    mc.enter('Design attributes')
    mc.select(symbol('PARAM_HAS_BYPASS'))
    shot('design-attributes-bypass')  # off by default on box turtle


def _feature_tip_forming_purging(mc, shot):
    """
    For doc/Feature-Tip-Forming-Purging.md - the base Tip Forming / Cutting
    and Purging screens. Both are unconditional menus (every MMU type gets
    them), so the boxturtle seed (default) needs no setup for the base
    view - servo cutter/Blobifier stay off, showing the plain form_tip/purge
    defaults.
    """
    mc.enter('Tip Forming / Cutting')
    # servo cutter off, form_tip selected, force-standalone on
    shot('tip-forming-cutting')
    mc.back()  # -> (Top)

    mc.enter('Purging')
    shot('purging')  # Blobifier off, simple bucket purge selected


def _feature_eject_buttons(mc, shot):
    """
    For doc/Feature-Eject-Buttons.md - the eject buttons config screen.
    Off by default on every MMU type including boxturtle, so toggled on here
    (same pattern as _feature_nfc/_feature_environment_manager).
    """
    _additions(mc)
    mc.select(symbol('MMU_HAS_EJECT_BUTTONS'))
    mc.toggle()
    mc.autofit()  # "Mmu eject buttons" submenu just appeared
    _hardware_menu(mc, 'Mmu eject buttons')
    shot('eject-buttons')  # one pin prompt per gate, all blank by default


def _feature_flowguard(mc, shot):
    """
    For doc/Feature-FlowGuard.md - the FlowGuard config screen. Uses the
    boxturtle seed (default), which already has a sync-feedback buffer
    fitted (same as _feature_sync_feedback_buffer), so this menu - gated on
    a buffer OR an encoder - is already visible with no scene setup.
    """
    mc.enter('Other Settings')
    mc.enter('FlowGuard')
    # relief threshold, tangle prevention, encoder mode
    shot('flowguard-config')


def _feature_environment_manager(mc, shot):
    """Sensor, heater and vent screens with all required hardware enabled."""
    _additions(mc)
    _hardware_menu(mc, 'Environment sensor h/w config')
    shot('environment-sensor-config')
    mc.back()
    _hardware_menu(mc, 'Heater h/w config')
    shot('heater-config')
    mc.back()
    _hardware_menu(mc, 'Vent servo h/w config')
    shot('vent-config')
    mc.back()
    _hardware_menu(mc, 'Heater and humidity control')
    shot('heater-control')


def _feature_fan_control(mc, shot):
    """All three fan roles, including heater association and UI visibility."""
    _additions(mc)
    _hardware_menu(mc, 'Fan h/w config')
    shot('fan-config')
    mc.back()
    mc.autofit()
    _hardware_menu(mc, 'Managed fan defaults')
    shot('fan-controls')
    mc.back()
    mc.autofit()
    _hardware_menu(mc, 'Heater fan h/w config')
    shot('heater-fan-config')
    mc.back()
    mc.autofit()
    _hardware_menu(mc, 'Controller fan h/w config')
    shot('controller-fan-config')


def _feature_endless_spool_runout(mc, shot):
    """
    For doc/Feature-Endless-Spool-Runout.md - the EndlessSpool section of Software
    Options. Generic, not MMU-type-specific, so the boxturtle seed (default) needs
    no setup - this section is always present.
    """
    mc.enter('Software Options')
    mc.select(symbol('PARAM_ENDLESS_SPOOL_ENABLED'))
    # both EndlessSpool checkboxes, off by default
    shot('endless-spool-options')


def _macro_print_start_end(mc, shot):
    """
    For doc/Macro-Print-Start-End.md - the _MMU_SOFTWARE macro-vars screen.
    Unconditional menu, so the boxturtle seed (default) needs no setup.
    """
    mc.enter('Macro Variables')
    mc.enter('(_MMU_SOFTWARE)')
    # start-checks + automap strategy + end-of-print behavior
    shot('print-start-end')


def _macro_state_change_hooks(mc, shot):
    """
    For doc/Macro-State-Change-Hooks.md - the _MMU_STATE macro-vars screen.
    Unconditional menu, so the boxturtle seed (default) needs no setup.
    """
    mc.enter('Macro Variables')
    mc.enter('(_MMU_STATE)')
    # 3 extension hooks + servo/cutter consumption limits
    shot('state-change-hooks')


def _macro_sequence(mc, shot):
    """
    For doc/Macro-Sequence.md - the _MMU_SEQUENCE macro-vars screen. Unconditional
    menu, so the boxturtle seed (default) needs no setup. Tall enough that autofit
    may need the full MAX_ROWS cap - one shot at the top, split further only if it
    still shows scroll arrows.
    """
    mc.enter('Macro Variables')
    mc.enter('(_MMU_SEQUENCE)')
    shot('sequence')  # park positions, restore-XY choice, user hooks


def _macro_client(mc, shot):
    """
    For doc/Macro-Client.md - the _MMU_CLIENT macro-vars screen. Gated on
    INSTALL_CLIENT_MACROS, which defaults to y - already visible on the
    boxturtle seed with no scene setup.
    """
    mc.enter('Macro Variables')
    mc.enter('(_MMU_CLIENT)')
    shot('client')  # cancel behavior + pause/resume/cancel extension hooks


def _macro_tip_forming(mc, shot):
    """
    For doc/Macro-Tip-Forming.md - the _MMU_FORM_TIP macro-vars screen.
    Kconfig.form_tip is sourced unconditionally in macro_vars/Kconfig (unlike
    cut_tip/servo_cutter/blobifier below), so this is visible on the boxturtle
    seed even though tip cutting, not forming, is the seed's actual choice.
    """
    mc.enter('Tip Forming / Cutting')
    mc.select(symbol('CHOICE_FORM_TIP_MACRO'))
    shot('tip-shaping')  # filament-movement forming selected
    mc.back()  # -> (Top)

    mc.enter('Macro Variables')
    mc.enter('(_MMU_FORM_TIP)')
    shot('tip-forming')  # ramming/separation/cooling/skinnydip/parking steps


def _macro_toolhead_tip_cutting(mc, shot):
    """
    For doc/Macro-Toolhead-Tip-Cutting.md - the _MMU_CUT_TIP macro-vars screen.
    Gated on MMU_HAS_TOOLHEAD_CUTTER, which lives under Toolhead sensors/settings
    ("Has toolhead cutter?") - not under Tip Forming / Cutting itself. The
    generated seed starts with that capability and the cutting choice selected,
    avoiding menuconfig's incomplete redraw after dynamically adding the fields.
    """
    mc.enter('Tip Forming / Cutting')
    mc.select(symbol('CHOICE_FORM_TIP_MACRO'))
    shot('tip-shaping')  # toolhead cutting selected; bumper options visible
    mc.back()  # -> (Top)

    mc.enter('Macro Variables')
    mc.enter('(_MMU_CUT_TIP)')
    # blade/pin geometry, cut speeds, gantry servo
    shot('toolhead-tip-cutting')


def _macro_servo_cutter(mc, shot):
    """
    For doc/Macro-Servo-Cutter.md - the _MMU_SERVO_CUTTER macro-vars screen.
    Gated on MMU_HAS_SERVO_CUTTER, off by default - toggled on under Tip Forming /
    Cutting (same menu the base screenshot in _feature_tip_forming_purging shows
    with this off).
    """
    mc.enter('Tip Forming / Cutting')
    mc.select(symbol('MMU_HAS_SERVO_CUTTER'))
    mc.toggle()
    mc.autofit()
    shot('tip-shaping')  # MMU cutter enabled alongside the shaping choice
    mc.back()  # -> (Top)

    mc.enter('Macro Variables')
    mc.enter('(_MMU_SERVO_CUTTER)')
    shot('servo-cutter')  # servo angles/timing + feed/cut length and attempts


def _macro_blobifier(mc, shot):
    """
    For doc/Macro-Blobifier.md - the Blobifier-enabled Purging screen in both
    actuator modes, followed by the _BLOBIFIER macro-vars screen. Gated on
    MMU_HAS_BLOBIFIER, off by default - toggled on under Purging (same menu the
    base screenshot in _feature_tip_forming_purging shows with this off).

    ~60 variables - looked too tall for one screenshot, but autofit's 96-row cap
    comfortably covers the whole menu (75 rows, no scroll arrows) in practice, so
    this is one shot rather than the split originally planned. Comment headers
    like "Blob Tuning" render in a distinct all-caps banner style and aren't
    themselves selectable, which is why this doesn't use mc.select() on them.
    """
    mc.enter('Purging')
    mc.select(symbol('MMU_HAS_BLOBIFIER'))
    mc.toggle()
    mc.autofit()
    # Re-enter to force a complete redraw after the conditional hardware fields
    # appear; otherwise menuconfig can leave the lower purge choices blank until
    # the next visit.
    mc.back()  # -> (Top)
    mc.enter('Purging')

    # An existing config retains its previous standalone-purge choice when the
    # Blobifier capability is switched on, so select Blobifier explicitly.
    mc.enter(symbol('CHOICE_PURGE_MACRO'))
    mc.select(symbol('CHOICE_PURGE_MACRO_BLOBIFIER'))
    mc.toggle()  # choice auto-closes back to Purging
    mc.autofit()
    shot('purging-servo')

    mc.enter(symbol('CHOICE_BLOBIFIER_TYPE'))
    mc.select(symbol('CHOICE_BLOBIFIER_TYPE_STEPPER'))
    mc.toggle()  # choice auto-closes back to Purging
    mc.autofit()
    mc.back()  # -> (Top), also gives the expanded menu a clean redraw
    mc.enter('Purging')
    shot('purging-stepper')

    # Keep the macro-variable screenshot on the default servo variant.
    mc.enter(symbol('CHOICE_BLOBIFIER_TYPE'))
    mc.select(symbol('CHOICE_BLOBIFIER_TYPE_SERVO'))
    mc.toggle()  # choice auto-closes back to Purging
    mc.autofit()
    mc.back()  # -> (Top)

    mc.enter('Macro Variables')
    mc.enter('(_BLOBIFIER)')
    shot('blobifier')  # every _BLOBIFIER_VARS setting, one tall screen


def _macro_purge(mc, shot):
    """
    For doc/Macro-Purge.md - the Purging selection and _MMU_PURGE macro-vars
    screens. Both use the boxturtle seed's default simple bucket purge.
    """
    mc.enter('Purging')
    mc.select(symbol('CHOICE_PURGE_MACRO'))
    shot('purging')  # Blobifier off, simple bucket purge selected
    mc.back()  # -> (Top)

    mc.enter('Macro Variables')
    mc.enter('(_MMU_PURGE)')
    shot('purge')  # single reference-purge speed setting


SESSIONS = [
    {
        'name': 'getting-started-boxturtle',
        'caption':
        'doc/GettingStarted-BoxTurtle.md - first menuconfig pass for a Box Turtle',
        'scenes': _getting_started_boxturtle,
        'outdir': 'GettingStarted-BoxTurtle',
        'seed': 'none',
    },
    {
        'name': 'feature-espooler',
        'caption':
        'doc/Feature-Espooler.md - the eSpooler pins menuconfig screen',
        'scenes': _feature_espooler,
        'outdir': 'Feature-Espooler',
    },
    {
        'name': 'feature-endless-spool-runout',
        'caption':
        'doc/Feature-Endless-Spool-Runout.md - the EndlessSpool options screen',
        'scenes': _feature_endless_spool_runout,
        'outdir': 'Feature-Endless-Spool-Runout',
    },
    {
        'name': 'feature-sync-feedback-buffer',
        'caption':
        'doc/Feature-Sync-Feedback-Buffer.md - buffer hardware and motor-sync screens',
        'scenes': _feature_sync_feedback_buffer,
        'outdir': 'Feature-Sync-Feedback-Buffer',
    },
    {
        'name': 'feature-leds',
        'caption': 'doc/Feature-LEDs.md - LED config and Neopixel pin screens',
        'scenes': _feature_leds,
        'outdir': 'Feature-LEDs',
    },
    {
        'name': 'feature-gate-ttg-maps',
        'caption':
        'doc/Feature-Gate-TTG-Maps.md - automap strategy / reset-TTG screen',
        'scenes': _feature_gate_ttg_maps,
        'outdir': 'Feature-Gate-TTG-Maps',
    },
    {
        'name': 'feature-filament-bypass',
        'caption':
        "doc/Feature-Filament-Bypass.md - the bypass design-attribute screen",
        'scenes': _feature_filament_bypass,
        'outdir': 'Feature-Filament-Bypass',
    },
    {
        'name': 'feature-tip-forming-purging',
        'caption':
        'doc/Feature-Tip-Forming-Purging.md - Tip Forming/Cutting and Purging screens',
        'scenes': _feature_tip_forming_purging,
        'outdir': 'Feature-Tip-Forming-Purging',
    },
    {
        'name': 'feature-eject-buttons',
        'caption':
        'doc/Feature-Eject-Buttons.md - eject buttons config screen',
        'scenes': _feature_eject_buttons,
        'outdir': 'Feature-Eject-Buttons',
    },
    {
        'name': 'feature-flowguard',
        'caption': 'doc/Feature-FlowGuard.md - FlowGuard config screen',
        'scenes': _feature_flowguard,
        'outdir': 'Feature-FlowGuard',
    },
    {
        'name': 'feature-environment-manager',
        'caption':
        'doc/Feature-Environment-Manager.md - environment sensor, heater and vent config screens',
        'scenes': _feature_environment_manager,
        'outdir': 'Feature-Environment-Manager',
        'seed': 'boxturtle-environment',
    },
    {
        'name': 'feature-fan-control',
        'caption':
        'doc/Feature-Fan-Control.md - managed, heater and controller fan screens',
        'scenes': _feature_fan_control,
        'outdir': 'Feature-Fan-Control',
        'seed': 'boxturtle-environment',
    },
    {
        'name': 'feature-td1',
        'caption': 'doc/Feature-TD1.md - scanner assignment and capture policy',
        'scenes': _feature_td1,
        'outdir': 'Feature-TD1',
        'seed': 'ercf',
    },
    {
        'name': 'feature-nfc',
        'caption':
        'doc/Feature-NFC.md - shared NFC reader config screen (ercf seed)',
        'scenes': _feature_nfc,
        'outdir': 'Feature-NFC',
        'seed': 'ercf',
    },
    {
        'name': 'getting-started-vivid',
        'caption':
        'doc/GettingStarted-ViViD.md - first menuconfig pass for a BTT ViViD',
        'scenes': _getting_started_vivid,
        'outdir': 'GettingStarted-ViViD',
        'seed': 'none',
    },
    {
        'name': 'getting-started-mmx',
        'caption':
        'doc/GettingStarted-MMX.md - first menuconfig pass for an MMX',
        'scenes': _getting_started_mmx,
        'outdir': 'GettingStarted-MMX',
        'seed': 'none',
    },
    {
        'name': 'getting-started-3ms-additions',
        'caption':
        'doc/GettingStarted-3MS.md - MMU Features / Additions screen',
        'scenes': _getting_started_3ms_additions,
        'outdir': 'GettingStarted-3MS',
        'seed': 'none',
    },
    {
        'name': 'getting-started-ercf-additions',
        'caption':
        'doc/GettingStarted-ERCF.md - MMU Features / Additions screen',
        'scenes': _getting_started_ercf_additions,
        'outdir': 'GettingStarted-ERCF',
        'seed': 'none',
    },
    {
        'name': 'getting-started-tradrack-additions',
        'caption':
        'doc/GettingStarted-Tradrack.md - MMU Features / Additions screen',
        'scenes': _getting_started_tradrack_additions,
        'outdir': 'GettingStarted-Tradrack',
        'seed': 'none',
    },
    {
        'name': 'installer-top',
        'caption': 'General menuconfig guide - top menu',
        'scenes': _installer_top,
        'outdir': 'GettingStarted-Installer-Configurator',
        'seed': 'none',
    },
    {
        'name': 'installation-unit-name',
        'caption': 'doc/Installation.md - first-unit object name and display name',
        'scenes': _installation_unit_name,
        'outdir': 'Installation',
        'seed': 'boxturtle',
        'units_restructure': True,
    },
    {
        'name': 'getting-started-multi-unit-shared',
        'caption':
        'doc/GettingStarted-Multi-Unit.md - shared configuration and unit list',
        'scenes': _getting_started_multi_unit_shared,
        'outdir': 'GettingStarted-Multi-Unit',
        'seed': 'none',
        'multi_unit': True,
        'entry_point': True,
        'units_restructure': True,
        'fit': False,
        'rows': 35,
    },
    {
        'name': 'getting-started-multi-unit-second',
        'caption':
        'doc/GettingStarted-Multi-Unit.md - unit1 and a shared sync-feedback buffer',
        'scenes': _getting_started_multi_unit_second,
        'outdir': 'GettingStarted-Multi-Unit',
        'seed': 'none',
        'unit_name': 'unit1',
        'unit_index': 1,
        'shared_buffer_owner': 'unit0',
        'multi_unit': True,
        'entry_point': False,
    },
    {
        'name': 'getting-started-emu',
        'caption':
        'doc/GettingStarted-EMU.md - first menuconfig pass for an EMU',
        'scenes': _getting_started_emu,
        'outdir': 'GettingStarted-EMU',
        'seed': 'none',
    },
    {
        'name': 'getting-started-emu-environment',
        'caption': 'doc/GettingStarted-EMU.md - per-gate sensors, fans, heaters and vents',
        'scenes': _getting_started_emu_environment,
        'outdir': 'GettingStarted-EMU',
        'seed': 'emu-environment',
    },
    {
        'name': 'macro-print-start-end',
        'caption':
        'doc/Macro-Print-Start-End.md - the _MMU_SOFTWARE macro-vars screen',
        'scenes': _macro_print_start_end,
        'outdir': 'Macro-Print-Start-End',
    },
    {
        'name': 'macro-state-change-hooks',
        'caption':
        'doc/Macro-State-Change-Hooks.md - the _MMU_STATE macro-vars screen',
        'scenes': _macro_state_change_hooks,
        'outdir': 'Macro-State-Change-Hooks',
    },
    {
        'name': 'macro-sequence',
        'caption':
        'doc/Macro-Sequence.md - the _MMU_SEQUENCE macro-vars screen',
        'scenes': _macro_sequence,
        'outdir': 'Macro-Sequence',
    },
    {
        'name': 'macro-client',
        'caption': 'doc/Macro-Client.md - the _MMU_CLIENT macro-vars screen',
        'scenes': _macro_client,
        'outdir': 'Macro-Client',
    },
    {
        'name': 'macro-tip-forming',
        'caption':
        'doc/Macro-Tip-Forming.md - shaping selection and _MMU_FORM_TIP screens',
        'scenes': _macro_tip_forming,
        'outdir': 'Macro-Tip-Forming',
    },
    {
        'name': 'macro-toolhead-tip-cutting',
        'caption':
        'doc/Macro-Toolhead-Tip-Cutting.md - shaping selection and _MMU_CUT_TIP screens',
        'scenes': _macro_toolhead_tip_cutting,
        'outdir': 'Macro-Toolhead-Tip-Cutting',
        'seed': 'boxturtle-toolhead-cutter',
    },
    {
        'name': 'macro-servo-cutter',
        'caption':
        'doc/Macro-Servo-Cutter.md - MMU cutter selection and macro-vars screens',
        'scenes': _macro_servo_cutter,
        'outdir': 'Macro-Servo-Cutter',
    },
    {
        'name': 'macro-blobifier',
        'caption':
        'doc/Macro-Blobifier.md - Purging hardware and _BLOBIFIER macro-vars screens',
        'scenes': _macro_blobifier,
        'outdir': 'Macro-Blobifier',
    },
    {
        'name': 'macro-purge',
        'caption':
        'doc/Macro-Purge.md - Purging selection and _MMU_PURGE macro-vars screens',
        'scenes': _macro_purge,
        'outdir': 'Macro-Purge',
    },
]


def run_session(session,
                outdir,
                scale=2,
                seed=None,
                min_rows=None,
                verbose=False,
                staging=None):
    """Run one session, returning the images it produced."""
    written = []
    context = {
        key: session[key]
        for key in ('unit_name', 'unit_index', 'multi_unit', 'entry_point',
                    'units_restructure', 'shared_buffer_owner') if key in session
    }
    # A session with its own 'outdir' (a getting-started page's image folder) always
    # goes there; --outdir only redirects sessions that did not ask for a home.
    outdir = os.path.join(DOC,
                          session['outdir']) if 'outdir' in session else outdir

    with Menuconfig(cols=session.get('cols', DEFAULT_COLS),
                    rows=session.get('rows', 40),
                    seed=seed or session.get('seed', DEFAULT_SEED),
                    style=session.get('style'),
                    min_rows=min_rows or session.get('min_rows', MIN_ROWS),
                    **context) as mc:

        def shot(name):
            path = os.path.join(outdir, name + '.png')
            capture_path = os.path.join(staging, session['name'], name + '.png') if staging else path
            mc.shot(capture_path,
                    trim=session.get('trim', True),
                    scale=scale,
                    fit=session.get('fit', True))
            if verbose:
                mc.dump()
            print('    %-24s %2dx%-3d %s' %
                  (name + '.png', mc.cols, mc.rows, mc.state()))
            written.append(path)

        session['scenes'](mc, shot)
    return written


def publish_images(images):
    """Replace completed captures, restoring earlier files on a publication error.

    Each replacement is atomic. The whole set is rollback-protected against Python
    exceptions, but is not a filesystem transaction across a power loss.
    """
    destinations = [os.path.abspath(dst) for _, dst in images]
    if len(set(destinations)) != len(destinations):
        raise ScreenError('Multiple captures target the same output file')
    with ExitStack() as stack:
        prepared = []
        for source, destination in images:
            dst = Path(destination)
            dst.parent.mkdir(parents=True, exist_ok=True)
            directory = Path(tempfile.mkdtemp(prefix='.hh-shot-', dir=dst.parent))
            stack.callback(shutil.rmtree, directory, ignore_errors=True)
            new, backup = directory / 'new.png', directory / 'old.png'
            shutil.copy2(source, new)
            existed = dst.exists()
            if existed:
                shutil.copy2(dst, backup)
            prepared.append((new, dst, backup, existed))
        replaced = []
        try:
            for new, dst, backup, existed in prepared:
                os.replace(new, dst)
                replaced.append((dst, backup, existed))
        except BaseException:
            recovery_errors = []
            for dst, backup, existed in reversed(replaced):
                try:
                    if existed:
                        os.replace(backup, dst)
                    else:
                        dst.unlink()
                except OSError:
                    recovery_errors.append(str(backup.parent))
            if recovery_errors:
                # Do not delete the only surviving originals if the filesystem
                # also refuses the rollback. Leave named recovery directories.
                stack.pop_all()
                raise ScreenError('Rollback incomplete; recovery files retained in: %s' %
                                  ', '.join(recovery_errors))
            raise


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog='python -m doc_tools.shots',
        description=
        'Regenerate the menuconfig screenshots used by the documentation.')
    parser.add_argument('--only',
                        action='append',
                        default=[],
                        metavar='NAME',
                        help='just this session; repeatable')
    parser.add_argument('--outdir', default=IMAGES, help='where the PNGs go')
    parser.add_argument('--output-root', help='redirect all per-page image folders to this directory')
    parser.add_argument(
        '--seed',
        help='override every session\'s seed: a built-in name, '
        'or a path to a .mmu_config / .mmu_config_<unit>')
    parser.add_argument('--scale',
                        type=int,
                        default=2,
                        help='pixel scale (default 2)')
    parser.add_argument(
        '--min-rows',
        type=int,
        help='override every session\'s height floor (default %d)' % MIN_ROWS)
    parser.add_argument('--list',
                        action='store_true',
                        help='list the sessions and exit')
    parser.add_argument('-v',
                        '--verbose',
                        action='store_true',
                        help='dump each captured screen as text too')
    args = parser.parse_args(argv)

    if args.list:
        width = max(len(session['name']) for session in SESSIONS)
        for session in SESSIONS:
            print('  %-*s  %s' % (width, session['name'], session['caption']))
        return 0

    known = {session['name'] for session in SESSIONS}
    unknown = [name for name in args.only if name not in known]
    if unknown:
        parser.error('no such session: %s (try --list)' % ', '.join(unknown))
    wanted = [s for s in SESSIONS if not args.only or s['name'] in args.only]

    # No pre-creation of args.outdir here: shot() (doc_tools/capture.py) already
    # makes whatever directory a PNG needs, and args.outdir is only the fallback
    # for a session with no 'outdir' of its own - creating it eagerly would recreate
    # exactly the unused doc/images/ this file's header says not to write to.
    failed, written = [], []
    with tempfile.TemporaryDirectory(prefix='hh-shots-stage-') as staging:
        images = []
        for index, original in enumerate(wanted, 1):
            session = dict(original)
            if args.output_root and 'outdir' in session:
                session['outdir'] = os.path.abspath(os.path.join(args.output_root, session['outdir']))
            print('[%d/%d] %s' % (index, len(wanted), session['name']), flush=True)
            try:
                paths = run_session(session, args.outdir, args.scale, args.seed,
                                    args.min_rows, args.verbose, staging=staging)
                written += paths
                images.extend((os.path.join(staging, session['name'], os.path.basename(p)), p)
                              for p in paths)
            except (ScreenError, OSError) as exc:
                failed.append(session['name'])
                detail = traceback.format_exc() if args.verbose else str(exc).splitlines()[0]
                print('    FAILED: %s' % detail, file=sys.stderr)
        if failed:
            print('\n%d of %d sessions failed: %s. No screenshots replaced. '
                  'Use -v for full diagnostics.' %
                  (len(failed), len(wanted), ', '.join(failed)), file=sys.stderr)
            return 1
        try:
            publish_images(images)
        except (OSError, ScreenError) as exc:
            print('Could not publish screenshots: %s' % exc, file=sys.stderr)
            return 1
    # Sessions each name their own 'outdir' (see the header above), so a run can
    # easily span several folders - naming just one, as if there were a single
    # shared pool, would be as misleading as recreating that pool would be.
    dirs = sorted({os.path.relpath(os.path.dirname(path)) for path in written})
    print('\n%d screenshot%s in %s' %
          (len(written), '' if len(written) == 1 else 's',
           ', '.join(dirs) if dirs else '(nothing written)'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
