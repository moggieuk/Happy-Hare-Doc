# Happy Hare documentation tooling
#
# Checks for two classes of broken internal reference that `zensical build --strict`
# (see `make docs_check`) does not catch:
#
#   - mkdocs.yml nav entries pointing at a doc/*.md file that doesn't exist. Zensical
#     0.0.53 doesn't warn about this at all - the dead entry just renders into every
#     page's nav with an href that 404s, discovered here by manually diffing a
#     deliberately-broken nav against the rendered site.
#   - image sources (both markdown `![]()` and raw `<img src=...>`, since md_in_html
#     is enabled and most screenshots in this repo are embedded as HTML for layout
#     control) pointing at a file that doesn't exist. Zensical's --strict flag checks
#     `[text](Page.md)`-style page links but silently ignores `src=`. Fenced code
#     blocks are skipped, since e.g. Dev-Documentation-Style-Guide.md shows an
#     illustrative `<img>` snippet that was never meant to resolve to a real file.
#
# `zensical build --strict` already covers broken page-to-page markdown links, so
# this script doesn't duplicate that. Anchor/heading fragments (`Page.md#heading`)
# aren't checked here either - lychee's fragment checker was tried against the built
# site and produces false positives on every `Page/#fragment`-style directory-URL
# link (it doesn't resolve the implicit index.html before looking for the id), so a
# reliable version of that check would need its own heading-slug walker rather than
# an off-the-shelf tool. Left for later if it's ever worth the complexity.
#
# This file may be distributed under the terms of the GNU GPLv3 license.

from __future__ import annotations

import pathlib
import re
import sys

import yaml

DOC_ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS_DIR = DOC_ROOT / "doc"
MKDOCS_YML = DOC_ROOT / "mkdocs.yml"

IMG_MD_RE = re.compile(r'!\[[^\]]*\]\(\s*([^)\s]+)')
IMG_HTML_RE = re.compile(r'<img\s[^>]*?src=["\']([^"\']+)["\']', re.IGNORECASE)
FENCE_RE = re.compile(r'^\s*```')

EXTERNAL_PREFIXES = ("http://", "https://", "//", "mailto:", "data:")


def iter_nav_targets(node):
    """Yield every string leaf value in mkdocs.yml's nav tree (its file targets)."""
    if isinstance(node, str):
        yield node
    elif isinstance(node, list):
        for item in node:
            yield from iter_nav_targets(item)
    elif isinstance(node, dict):
        for value in node.values():
            yield from iter_nav_targets(value)


def check_nav():
    config = yaml.load(MKDOCS_YML.read_text(), Loader=yaml.BaseLoader)
    errors = []
    for target in iter_nav_targets(config.get("nav", [])):
        if target.endswith(".md") and not (DOCS_DIR / target).is_file():
            errors.append(
                f"mkdocs.yml: nav entry '{target}' does not exist under doc/"
            )
    return errors


def check_images():
    errors = []
    for md_file in sorted(DOCS_DIR.glob("*.md")):
        rel = md_file.relative_to(DOC_ROOT)
        in_fence = False
        for lineno, line in enumerate(md_file.read_text().splitlines(), start=1):
            if FENCE_RE.match(line):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            targets = [m.group(1) for m in IMG_MD_RE.finditer(line)]
            targets += [m.group(1) for m in IMG_HTML_RE.finditer(line)]
            for target in targets:
                if not target or target.startswith(EXTERNAL_PREFIXES):
                    continue
                if not (md_file.parent / target).resolve().is_file():
                    errors.append(f"{rel}:{lineno}: image not found: {target}")
    return errors


def main():
    errors = check_nav() + check_images()
    if errors:
        print(f"{len(errors)} broken reference(s) found:\n")
        for error in errors:
            print(f"  - {error}")
        return 1
    print("No broken references found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
