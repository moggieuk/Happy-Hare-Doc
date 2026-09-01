# Code Layout

What lives where in `extras/`, who owns what, and the three different
relationships ("extends") the codebase uses between its objects. Everything
below was read from the source, not inferred from file names - see each
section for the file and line it comes from.

## Where Happy Hare meets Klipper

Klipper auto-instantiates one Python object per config section, by importing
`extras.<section name>` and calling its module-level `load_config()` /
`load_config_prefix()`. Happy Hare only actually uses that mechanism for four
files, all directly under `extras/`:

| File | Klipper section | What it is |
|---|---|---|
| `mmu_machine.py` | `[mmu_machine]` | The one real entry point - see [Object ownership](#object-ownership) below |
| `mmu_stepper.py` | `[mmu_stepper *]` | `MmuStepper(ExtruderStepper)` - a hybrid manual/extruder stepper, one per gear or selector motor |
| `mmu_servo.py` | `[mmu_servo *]` | A fork of Klipper's own `servo.py`, adding kickback-safe PWM timing for digital servos |
| `mmu_led_effect.py` | `[mmu_led_effect *]` | A wrapper around the community `led_effect` module, replicated per-LED for per-gate effects |

The last three are deliberately *not* Happy-Hare-specific in shape: they
follow the ordinary Klipper extras convention because other things
(Klipper itself, or a user's own config) may reasonably treat them as
ordinary steppers/servos/LED effects. Everything else - the actual MMU logic
- lives under `extras/mmu/`, which is a plain Python package, not a Klipper
section name. Klipper never imports it directly; `mmu_machine.py` does, and
builds the whole object graph itself (see below) rather than letting Klipper
auto-instantiate it piece by piece.

## Directory tree

```text
extras/
├── mmu_machine.py            [mmu_machine] - entry point, builds everything else
├── mmu_stepper.py            MmuStepper: ExtruderStepper + ManualStepper hybrid
├── mmu_servo.py              Kickback-safe servo PWM (forked from Klipper's servo.py)
├── mmu_led_effect.py         LED effect engine (wraps the community led_effect module)
│
└── mmu/                      Happy Hare itself - one Python package, not a Klipper section
    ├── mmu_controller.py         MmuController - the "mmu" printer object (registered under
    │                             the legacy name 'mmu', not 'mmu_machine' - see mmu_machine.py)
    ├── mmu_filament_movement.py  Load/unload movement primitives - mixed INTO MmuController,
    │                             not a separate object (see Mixin split, below)
    ├── mmu_unit.py                MmuUnit - one physical MMU/AFC; a multi-unit machine has several
    ├── mmu_gate_maps.py            MmuGateMaps - TTG/gate/EndlessSpool maps, one per machine
    ├── mmu_led_manager.py          MmuLedManager - cross-unit LED orchestration, one per machine
    ├── mmu_sensor_manager.py       MmuSensorManager - active-sensor swapping, one per machine
    ├── mmu_print_state_machine.py  MmuPrintStateMachine - augmented Klipper print state
    ├── mmu_logger.py               MmuLogger - console output + mmu.log
    ├── mmu_base_parameters.py      Generic tunable-parameter plumbing (ParamSpec, TunableParametersBase)
    ├── mmu_machine_parameters.py   The [mmu_parameters] section, shared machine-wide
    ├── mmu_constants.py            Every shared constant/enum - no imports of its own (see
    │                             doc_tools/gen_command_reference.py, which execs it directly)
    ├── mmu_utils.py                MmuError, SaveVariableManager, misc helpers
    │
    ├── commands/                 ~64 files, one BaseCommand subclass per MMU_* gcode command -
    │                             see Command Reference and Command discovery, below
    │
    └── unit/                     Everything one physical MmuUnit owns
        ├── mmu_encoder.py, mmu_buffer.py, mmu_espooler.py, mmu_leds.py, mmu_sensors.py
        ├── mmu_calibrator.py, mmu_sync_feedback.py, mmu_sync_controller.py
        ├── mmu_toolhead_wrapper.py, mmu_extruder_wrapper.py, mmu_drive.py
        ├── mmu_environment_manager.py, mmu_nfc_manager.py, mmu_unit_parameters.py
        │
        ├── selectors/             One file per selector family - see Selector hierarchy, below
        │
        └── nfc/                   RFID/NFC hardware reader drivers - a vendored,
                                    self-contained subtree (see Hardware boundaries, below)
```

## Object ownership

`MmuMachine` (`extras/mmu_machine.py`) is the actual Klipper entry point for
`[mmu_machine]`, and it builds the entire object graph itself, in a fixed
order, before Klipper's own `connect`/`ready` events fire:

```text
MmuMachine (extras/mmu_machine.py)
 │
 ├─ builds each [mmu_unit <name>] section first ───▶ MmuUnit 0, MmuUnit 1, ...
 │                                                      │
 │                                                      ├─ selector         (one of the Selector family)
 │                                                      ├─ encoder          (optional, may be shared)
 │                                                      ├─ buffer           (optional, may be shared)
 │                                                      ├─ espooler         (optional)
 │                                                      ├─ leds             (optional)
 │                                                      ├─ sensors
 │                                                      ├─ calibrator
 │                                                      ├─ toolhead_wrapper (may be shared)
 │                                                      ├─ extruder_wrapper (may be shared)
 │                                                      ├─ drives[]         (one MmuDrive per gear stepper)
 │                                                      ├─ sync_feedback
 │                                                      ├─ environment_manager
 │                                                      └─ nfc_manager      (optional)
 │
 └─ then builds MmuController, after every unit exists ─▶ MmuController (printer object "mmu", legacy name)
                                                             │
                                                             ├─ logger          (MmuLogger)
                                                             ├─ psm             (MmuPrintStateMachine)
                                                             ├─ led_manager     (MmuLedManager, cross-unit)
                                                             ├─ sensor_manager  (MmuSensorManager, cross-unit)
                                                             ├─ gate_maps       (MmuGateMaps: TTG / gate / EndlessSpool)
                                                             └─ var_manager     (SaveVariableManager)
```

Two things about this that aren't obvious from the diagram alone:

- **Units are built before the controller, on purpose.** A unit's selector
  can register its own gcode commands (`MMU_GRIP`, `MMU_CALIBRATE_SELECTOR`,
  ...) as a side effect of construction - see [Command discovery](#command-discovery-and-registration)
  below - and `MmuController.__init__` needs that complete before it
  instantiates every registered command class.
- **Most of this bypasses Klipper's own config-loading convention
  entirely.** `MmuUnit.__init__` builds its subsystems by calling their
  constructors directly, in a hand-picked order - not by declaring config
  sections and letting Klipper instantiate them. The code says why, right at
  the point it happens (`extras/mmu/mmu_unit.py`):

  > "This is done in a deliberate order, allows passing of parent ownership
  > and better config checking. I.e. most of these objects have special
  > constructers and are not designed for regular klipper object loading"

  `encoder`, `buffer`, and `toolhead_wrapper`/`extruder_wrapper` are the
  exception within the exception: a multi-unit machine can share one of
  these between units (e.g. one encoder feeding two units), so each is first
  looked up by name (`printer.lookup_object(section, None)`) and only
  constructed if that lookup comes back empty - the same
  construct-once-if-not-shared pattern used three different times.

## Three different kinds of "extends"

The word "extends" covers three genuinely different relationships in this
codebase - conflating them is the fastest way to misread the architecture.

**1. Composition - real ownership, a real object graph.** Everything in the
diagram above. `MmuUnit.selector`, `MmuUnit.encoder`, `MmuController.gate_maps`
etc. are distinct objects with their own state and lifetime, held by
reference. This is the normal case.

**2. Mixin split - one logical object, divided across files by concern, not
by identity.** `class MmuController(MmuFilamentMovement)`
(`extras/mmu/mmu_controller.py:51`) is the only example, but it's a big one:
`mmu_controller.py` is 3,698 lines and `mmu_filament_movement.py` is 3,853 -
together, one class. The split is "orchestration and command-facing surface"
(`mmu_controller.py`: state, status, event handling, the bootup sequence)
versus "the actual load/unload movement primitives"
(`mmu_filament_movement.py`). There is exactly one `MmuController` instance
per machine; `MmuFilamentMovement` is never instantiated on its own.

**3. Command pattern - operates on, does not extend.** Every `MMU_*` command
is a small class holding a reference to the controller
(`class MmuLoadCommand(BaseCommand): def __init__(self, mmu): self.mmu = mmu`)
that registers one gcode handler. It is not part of `MmuController`'s
inheritance chain at all - see [Command discovery](#command-discovery-and-registration).

## Selector hierarchy

Every MMU design needs *some* way to bring a gate to the extruder, and that's
the one piece of hardware that genuinely varies by MMU family. `extras/mmu/unit/selectors/`
has one file per family, all deriving from `BaseSelector`
(`mmu_base_selectors.py`):

```text
BaseSelector
 ├─ PhysicalSelector          (has real movement + a soak-test command)
 │   ├─ LinearSelector          type-A: one carriage, calibrated offsets
 │   │   └─ LinearServoSelector   + composed LinearSelectorServo (grip/release
 │   │                            on top of linear movement)
 │   ├─ IndexedSelector        type-A: one index switch per gate (ViViD)
 │   ├─ RotarySelector         type-A: rotary carriage (3D Chameleon)
 │   └─ ServoSelector          type-A: servo-driven gate selection
 └─ VirtualSelector           type-B: gear-per-gate, no selector movement,
                               always considered "homed"
```

Two classes don't fit that tree at all - they're genuine multiple inheritance,
not a diagram simplification:

| Class | Inherits from | What it is |
|---|---|---|
| `LinearMultiGearSelector` | `LinearSelector`, `VirtualSelector` | type-C: one gear stepper per gate (`VirtualSelector`) *and* a physical carriage that still has to move (`LinearSelector`) |
| `LinearMultiGearServoSelector` | `LinearServoSelector`, `VirtualSelector` | type-C, plus servo grip/release |

`class LinearMultiGearSelector(LinearSelector, VirtualSelector)`, literally.
The docstring explains why: a "type-C" design (one gear stepper per gate,
*plus* a physical carriage that still has to move to line the selected gate
up with the extruder path) needs both behaviors, and Python's MRO is relied
on directly - "gear selection occurs before selector movement when using
`super()` in `select_gate()`". `MacroSelector` (fully user-implemented, via
gcode macros) is the other direct `BaseSelector` subclass, omitted above for
space.

This is also a real, if narrow, gap in the current conceptual documentation:
a simple binary selector split has no room for a "both at once" type-C
design, which now exists in code.

A related gap in this same area: every selector class implements
`get_status()` returning `servo`/`grip`, but `MmuController.get_status()`
never calls it, so neither reaches `printer.mmu` - the only caller of
`selector.get_status()` in the whole codebase is the developer console
(`test/console.py`). `MMU_STATUS` prints the same information as text per
unit, or use `grip_state`/`servo_state` directly if extending Happy Hare's
Python. Worth confirming with upstream whether this is deliberate.

## Command discovery and registration

Adding a new `MMU_*` command never means editing a central list - `extras/mmu/commands/__init__.py`
builds `COMMAND_REGISTRY` by scanning its own package:

```python
for m in pkgutil.iter_modules(__path__):
    mod = importlib.import_module(f".{m.name}", __name__)
    for name, cls in vars(mod).items():
        if inspect.isclass(cls) and cls.__module__ == mod.__name__ and issubclass(cls, BaseCommand):
            COMMAND_REGISTRY[name] = cls
```

Drop a new `class MmuFooCommand(BaseCommand)` into a file in `commands/` and
it's picked up automatically, no import to add anywhere.

Commands that live *outside* that package - the selector-specific ones in
`unit/selectors/*.py` (`MMU_GRIP`, `MMU_CALIBRATE_SELECTOR`, ...) and the
Klipper-wrapper commands in `mmu_controller.py` itself (`CANCEL_PRINT`,
`RESUME`, ...) - use a `register_command()` function instead, called as a
side effect of the owning class's `__init__`:

```python
try:
    register_command(MmuSoaktestSelectorCommand)
    register_command(MmuGripCommand)
    register_command(MmuReleaseCommand)
except KeyError:
    pass # Already registered
```

That `except KeyError: pass` is load-bearing, not defensive filler: on a
multi-unit machine, every unit's `PhysicalSelector.__init__` runs this, and
only the first one should actually register the class - `register_command`
raises `KeyError` on a duplicate name, and every unit after the first hits
exactly that.

Once `COMMAND_REGISTRY` is complete - which is why unit construction has to
finish first, see [Object ownership](#object-ownership) - `MmuController.__init__`
walks it and instantiates every class:

```python
for name, cls in sorted(COMMAND_REGISTRY.items()):
    cls(self)   # each __init__ calls self.register(...), which calls
                # self.mmu.gcode.register_command(...) for real
```

See the [Command Reference](Reference-Commands.md) for the resulting list, and
`doc_tools/gen_command_reference.py` for a second, independent consumer of
this same structure (it walks the source with `ast` rather than importing it,
for the reasons explained in that file's own header comment).

## Hardware boundaries

A few subsystems are explicit about *not* knowing about the rest of Happy
Hare, in their own words:

- **Sync feedback vs. sync control.** `mmu_sync_feedback.py` is the
  MmuUnit-facing interface and status surface (what `printer.mmu` sees - see
  [Reference-Printer-Variables.md](Reference-Printer-Variables.md#sync-feedback-flowguard-and-tangle-prevention)).
  The actual control theory - dual-level switching, the PD+EKF proportional
  controller, autotuning, FlowGuard's clog/tangle detection - lives in
  `mmu_sync_controller.py`'s `SyncController`, `_AutotuneEngine` and
  `_FlowguardEngine`, which `mmu_sync_feedback.py` drives rather than
  duplicates.
- **Selectors know movement, not filament identity.** Gate/tool/EndlessSpool
  mapping lives entirely in `MmuGateMaps`; a selector's job stops at "move to
  this physical position" / "select this gear" and reporting `servo`/`grip`/
  `has_bypass` status.

## Where to go next

- [Kconfig & Installer Architecture](Dev-Kconfig-Structure.md) - how a
  `menuconfig` choice becomes the `.cfg` files that get rendered into the
  object graph described here.
- [Testing](Dev-Testing.md) - the fake Klipper/Moonraker this same object
  graph runs inside, with no printer attached.
- [The Simulator](Dev-Simulator.md) - driving that same graph by hand,
  interactively.
- [Command Reference](Reference-Commands.md) / [Printer Variable Reference](Reference-Printer-Variables.md) -
  the user-facing surface this architecture produces.

---


