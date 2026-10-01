# Happy Hare documentation tooling
#
# Generates doc/Reference-Commands.md from the real command metadata scattered
# across extras/mmu/ - the same HELP_BRIEF / HELP_PARAMS / HELP_SUPPLEMENT
# strings a user sees from `<CMD> HELP=1` on a printer, and the same CATEGORY_*
# grouping BaseCommand.register() uses. See doc_tools/README.md for the split
# between this directory (code) and doc/ (its output).
#
# This file lives in the Happy-Hare-Doc repo; extras/mmu/ lives in Happy-Hare -
# see HAPPY_HARE_SRC below (set for you by `make command_reference`, or point it
# at a checkout you already have).
#
# Commands are NOT confined to extras/mmu/commands/: mmu_controller.py registers
# a few Klipper-wrapper commands directly, and each selector family
# (extras/mmu/unit/selectors/*.py) registers its own MMU_CALIBRATE_* /
# MMU_GRIP / MMU_RELEASE / MMU_SOAKTEST_SELECTOR commands. So this walks the
# whole extras/mmu/ tree rather than one directory - grep for
# "self.register(" across extras/mmu if this ever needs re-checking.
#
# Nothing here imports Happy Hare or Klipper: CMD / HELP_BRIEF / HELP_PARAMS /
# HELP_SUPPLEMENT are plain class-body assignments that only ever reference each
# other (never self., never an import), so they're extracted with ast and
# re-executed in isolation - accurate for f-strings and %-formatting alike,
# without needing the fake klippy tree test/ builds.
#
# Anchors: a command's heading is its bare CMD (e.g. `### MMU_LOAD`), which
# python-markdown's toc extension slugifies to lowercase with underscores kept
# (`#mmu_load`) - that's the stable anchor other pages should link to.

import argparse
import ast
import os
import pathlib
import re
import sys

DOC_ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_FILE = DOC_ROOT / "doc" / "Reference-Commands.md"
DEV_OUT_FILE = DOC_ROOT / "doc" / "Dev-Command-Reference.md"

HAPPY_HARE_SRC = os.environ.get("HAPPY_HARE_SRC")
if not HAPPY_HARE_SRC or not (pathlib.Path(HAPPY_HARE_SRC) / "extras" / "mmu").is_dir():
    raise SystemExit(
        "HAPPY_HARE_SRC must point at a Happy-Hare checkout (containing extras/mmu/) - "
        "run via `make command_reference`, which fetches one and sets this for you, or "
        "set it yourself to an existing checkout for faster local iteration."
    )
MMU_DIR = pathlib.Path(HAPPY_HARE_SRC) / "extras" / "mmu"
BASE_COMMAND_FILE = MMU_DIR / "commands" / "mmu_base_command.py"
CONSTANTS_FILE = MMU_DIR / "mmu_constants.py"
CONFIG_DIR = pathlib.Path(HAPPY_HARE_SRC) / "config"

HELP_FIELDS = ("CMD", "HELP_BRIEF", "HELP_PARAMS", "HELP_SUPPLEMENT")

# Display order; categories not listed here (STEPS, INTERNAL) are developer-only
# and rendered in their own appendix rather than mixed in with user commands.
CATEGORY_ORDER = [
    "CATEGORY_GENERAL",
    "CATEGORY_TESTING",
    "CATEGORY_MACROS",
    "CATEGORY_CALLBACKS",
    "CATEGORY_OTHER",
]
APPENDIX_CATEGORIES = ["CATEGORY_STEPS", "CATEGORY_INTERNAL"]


def extract_categories(source):
    """CATEGORY_* = "..." constants at module scope in mmu_base_command.py."""
    tree = ast.parse(source)
    categories = {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id.startswith("CATEGORY_"):
                    categories[target.id] = ast.literal_eval(node.value)
    return categories


def extract_register_category(class_node):
    """Find self.register(...) inside the class and return its category name
    (e.g. "CATEGORY_STEPS"), whether passed as a keyword or positionally."""
    for node in ast.walk(class_node):
        if (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == "register"
        ):
            for kw in node.keywords:
                if kw.arg == "category" and isinstance(kw.value, ast.Name):
                    return kw.value.id
            # Positional form: register(name, handler, help_brief, help_params,
            # help_supplement, category, ...) - category is the 6th argument.
            if len(node.args) >= 6 and isinstance(node.args[5], ast.Name):
                return node.args[5].id
    return "CATEGORY_OTHER"  # BaseCommand.register()'s own default


def extract_help_strings(class_node, source, constants):
    """Pull CMD / HELP_BRIEF / HELP_PARAMS / HELP_SUPPLEMENT class-body assignments
    and re-execute them in encounter order so later f-strings/%-formats referencing
    earlier ones (e.g. HELP_PARAMS using CMD and HELP_BRIEF), or UI constants like
    UI_DEGREE from the commands' `from ..mmu_constants import *`, resolve correctly."""
    assigns = {}
    for node in class_node.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target = node.targets[0]
            if isinstance(target, ast.Name) and target.id in HELP_FIELDS:
                assigns[target.id] = node

    if "CMD" not in assigns or "HELP_BRIEF" not in assigns:
        return None

    namespace = dict(constants)
    for field in HELP_FIELDS:
        node = assigns.get(field)
        if node is None:
            continue
        segment = ast.get_source_segment(source, node)
        exec(segment, namespace)  # noqa: S102 - static source, not user input

    return {
        "cmd": namespace.get("CMD", ""),
        "help_brief": namespace.get("HELP_BRIEF", ""),
        "help_params": namespace.get("HELP_PARAMS", ""),
        "help_supplement": namespace.get("HELP_SUPPLEMENT", ""),
    }


def load_constants():
    """mmu_constants.py has no imports of its own, so it's safe to exec directly -
    this is where UI_DEGREE and friends, referenced from HELP_* strings, come from."""
    namespace = {}
    exec(CONSTANTS_FILE.read_text(), namespace)  # noqa: S102 - static source, not user input
    return namespace


MACRO_HEADER_RE = re.compile(r'^\[gcode_macro\s+(\S+)\]\s*$')
DESCRIPTION_RE = re.compile(r'^description:\s*(.*)$')

# Only these two - the rest of categorize_macro_command()'s range (GENERAL,
# TESTING, OTHER, STEPS, INTERNAL) also has real gcode_macro-only hits
# (MMU_COLD_PULL, legacy-alias macro names, _MMU_*_VARS containers, MMU__*
# internal helpers) that already have a deliberate home elsewhere or are
# explicitly not documented per prior request - see doc_tools/README.md, "Command reference scope". Folding those in
# here too would need that same case-by-case call, not a mechanical scan.
MACRO_CATEGORIES_INCLUDED = {"CATEGORY_MACROS", "CATEGORY_CALLBACKS"}


def categorize_macro_command(name):
    """Port of the `categorize()` closure inside
    MmuHelpCommand.non_registered_commands() (extras/mmu/commands/mmu_help.py)
    - the runtime name-matching heuristic MMU_HELP itself uses to bucket
    gcode_macro-defined commands (found via the live printer's
    ready_gcode_handlers) that were never BaseCommand.register()'d. Kept in
    lockstep by hand; re-check it there if MMU_HELP's own categorization ever
    changes."""
    cu = name.upper()
    if cu in ("MMU_COLD_PULL",):
        return "CATEGORY_GENERAL"
    if cu in ("MMU_QUERY_PSENSOR",):
        return "CATEGORY_TESTING"
    if (
        cu.startswith("MMU_START")
        or cu.startswith("MMU_END")
        or cu in ("MMU_UPDATE_HEIGHT", "MMU_CHANGE_TOOL_STANDALONE")
    ):
        return "CATEGORY_MACROS"
    if cu.startswith("_MMU"):
        if cu in ("_MMU_M400", "_MMU_LOAD_SEQUENCE", "_MMU_UNLOAD_SEQUENCE"):
            return "CATEGORY_STEPS"
        if (
            cu.startswith("_MMU_PRE_")
            or cu.startswith("_MMU_POST_")
            or cu in ("_MMU_ACTION_CHANGED", "_MMU_EVENT", "_MMU_PRINT_STATE_CHANGED")
        ):
            return "CATEGORY_CALLBACKS"
        return "CATEGORY_INTERNAL"
    if cu.startswith("MMU__"):
        return "CATEGORY_INTERNAL"
    if cu.startswith("MMU"):
        return "CATEGORY_OTHER"
    return None


def collect_macro_commands(registered_names, categories):
    """gcode_macro-defined commands (a plain Klipper `description:` line, no
    HELP_PARAMS/HELP_SUPPLEMENT) that MMU_HELP finds on a real printer via
    ready_gcode_handlers rather than BaseCommand._registered_commands - see
    categorize_macro_command() above. Scans config/ only (not test/ installer
    fixtures, which reuse some of these names)."""
    commands = []
    for path in sorted(CONFIG_DIR.rglob("*.cfg")):
        lines = path.read_text().splitlines()
        for i, line in enumerate(lines):
            match = MACRO_HEADER_RE.match(line)
            if not match:
                continue
            name = match.group(1)
            if name.upper() in registered_names:
                continue
            category_name = categorize_macro_command(name)
            if category_name not in MACRO_CATEGORIES_INCLUDED:
                continue

            description = ""
            for follow in lines[i + 1:]:
                if follow.startswith("[") or follow.strip().startswith("gcode:"):
                    break
                desc_match = DESCRIPTION_RE.match(follow)
                if desc_match:
                    description = desc_match.group(1).strip()
                    break

            commands.append(
                {
                    "cmd": name,
                    "help_brief": description,
                    "help_params": "",
                    "help_supplement": "",
                    "category": category_name,
                    "category_label": categories.get(category_name, category_name),
                    "file": str(path.relative_to(HAPPY_HARE_SRC)),
                }
            )
    return commands


def collect_commands():
    categories = extract_categories(BASE_COMMAND_FILE.read_text())
    constants = load_constants()
    commands = []
    skipped = []

    for path in sorted(MMU_DIR.rglob("*.py")):
        if path.name == "__init__.py":
            continue
        source = path.read_text()
        if "self.register(" not in source:
            continue  # cheap pre-filter - most files under extras/mmu/ define no commands
        tree = ast.parse(source, filename=str(path))
        for node in tree.body:
            if not isinstance(node, ast.ClassDef):
                continue
            help_strings = extract_help_strings(node, source, constants)
            if help_strings is None:
                continue  # a mixin or helper class with no CMD of its own
            if not help_strings["cmd"]:
                continue
            category_name = extract_register_category(node)
            commands.append(
                {
                    **help_strings,
                    "category": category_name,
                    "category_label": categories.get(category_name, category_name),
                    "file": str(path.relative_to(HAPPY_HARE_SRC)),
                }
            )

    registered_names = {cmd["cmd"].upper() for cmd in commands}
    commands.extend(collect_macro_commands(registered_names, categories))

    seen = set()
    for cmd in commands:
        if cmd["cmd"] in seen:
            skipped.append(cmd["cmd"])
        seen.add(cmd["cmd"])

    return commands, categories, skipped


def strip_heading_line(help_params):
    """HELP_PARAMS's first line is always "CMD: brief" (BaseCommand.format_help()
    parses it that way) - drop it here since the page already shows CMD as the
    heading and HELP_BRIEF as the description right under it."""
    lines = help_params.splitlines()
    if lines and ":" in lines[0]:
        lines = lines[1:]
    return "\n".join(line for line in lines if line.strip())


def render_command(cmd):
    lines = [f"### {cmd['cmd']}", "", f"*{cmd['help_brief']}*", ""]

    params = strip_heading_line(cmd["help_params"])
    if params:
        lines += ["**Parameters**", "", "```{.text .console-output}", params, "```", ""]

    supplement = cmd["help_supplement"].strip()
    if supplement:
        # HELP_SUPPLEMENT is shown verbatim - it's exactly what `CMD HELP=1` prints
        # on a real printer, "Examples:" line included.
        lines += ["```{.text .console-output}", supplement, "```", ""]

    return "\n".join(lines)


def render_page(commands, categories):
    by_category = {}
    for cmd in commands:
        by_category.setdefault(cmd["category"], []).append(cmd)
    for cmds in by_category.values():
        cmds.sort(key=lambda c: c["cmd"])

    out = [
        "# Command Reference",
        "",
        "Every `MMU_*` command Happy Hare provides - generated directly from the",
        "same help text `<CMD> HELP=1` prints at a real printer, so it's always",
        "in sync with what you'll actually see. Internal/developer-only commands",
        "(individual loading/unloading steps, raw stress-test tooling) are",
        "deliberately not here - see [Developer Command",
        "Reference](Dev-Command-Reference.md) in the Developer Guide instead.",
        "",
    ]

    for category_name in CATEGORY_ORDER:
        cmds = by_category.get(category_name, [])
        if not cmds:
            continue
        out += [f"## {categories.get(category_name, category_name)}", ""]
        out += [render_command(cmd) for cmd in cmds]

    out += [
        "",
        "---",
        "",
    ]

    return "\n".join(out).rstrip() + "\n"


def render_dev_page(commands, categories):
    """Companion to render_page(): renders the CATEGORY_STEPS/CATEGORY_INTERNAL
    commands render_page() deliberately excludes - individual loading/unloading
    steps and internal machinery, not part of the supported user interface.
    Lives in the Developer Guide instead of the main Command Reference so a
    user looking up a real command never has to scroll past it."""
    by_category = {}
    for cmd in commands:
        by_category.setdefault(cmd["category"], []).append(cmd)
    for cmds in by_category.values():
        cmds.sort(key=lambda c: c["cmd"])

    out = [
        "# Developer Command Reference",
        "",
        "The commands [Command Reference](Reference-Commands.md) leaves out -",
        "individual loading/unloading steps and internal machinery, generated",
        "the same way from the same real `HELP_BRIEF`/`HELP_PARAMS`/",
        "`HELP_SUPPLEMENT` source. Not part of the supported user interface;",
        "useful when working on Happy Hare itself.",
        "",
        "`_MMU_TEST` specifically has its own deep-dive - see [Developer Test",
        "Command](Dev-Test-Command.md) for what its ~25 sub-tests actually do",
        "and which ones are safe to run casually. This page has only its flat",
        "parameter list, same as every other command below.",
        "",
    ]

    for category_name in APPENDIX_CATEGORIES:
        cmds = by_category.get(category_name, [])
        if not cmds:
            continue
        out += [f"## {categories.get(category_name, category_name)}", ""]
        out += [render_command(cmd) for cmd in cmds]

    out += [
        "",
        "---",
        "",
    ]

    return "\n".join(out).rstrip() + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero if doc/Reference-Commands.md or doc/Dev-Command-Reference.md is stale instead of writing them",
    )
    args = parser.parse_args()

    commands, categories, skipped = collect_commands()
    if skipped:
        print(f"warning: duplicate CMD definitions for: {', '.join(sorted(set(skipped)))}", file=sys.stderr)

    page = render_page(commands, categories)
    dev_page = render_dev_page(commands, categories)
    outputs = [(OUT_FILE, page), (DEV_OUT_FILE, dev_page)]

    if args.check:
        stale = [
            out_file for out_file, content in outputs
            if (out_file.read_text() if out_file.exists() else "") != content
        ]
        if stale:
            for out_file in stale:
                print(f"{out_file} is stale - run `make command_reference`", file=sys.stderr)
            return 1
        return 0

    for out_file, content in outputs:
        out_file.write_text(content)

    n_dev = sum(1 for cmd in commands if cmd["category"] in APPENDIX_CATEGORIES)
    print(f"wrote {OUT_FILE} ({len(commands) - n_dev} commands)")
    print(f"wrote {DEV_OUT_FILE} ({n_dev} commands)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
