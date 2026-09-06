# Documentation Style Guide

A practical writing guide for contributors creating or updating pages in this documentation site.

## Purpose

Use this page as the default style reference for:

- page structure and headings
- callouts and notes
- tables and code examples
- image formatting
- theme colors and icon usage

## Quick checklist

Before opening a pull request, verify:

- Page appears in [mkdocs.yml](../mkdocs.yml) nav.
- No `[TOC]` marker is present.
- Admonitions use `!!!` syntax.
- Config examples use `ini` code fences.
- New screenshots are readable and centered where needed.
- Page ends with a single `---` line.

## Headings and section flow

Use sentence-case headings and keep section structure shallow where possible.

Example structure:

```markdown
# Feature Name

## Concept

## Hardware setup

## Parameter setup

## Commands

## Troubleshooting

## See also

---
```

## Admonitions (callouts)

Use Python-Markdown admonitions:

```markdown
!!! note "Title"
    Body text.
```

Recommended types:

| Use case | Admonition type |
| --- | --- |
| General explanation | `note` |
| Practical advice | `tip` |
| Important warning | `warning` |
| Dangerous action | `danger` |
| Known issue | `bug` |
| Worked example | `example` |

Use `???` instead of `!!!` for collapsible admonition content.

Rendered examples:

!!! note "Note"
    Use this for neutral, supporting context.

??? tip "Hidden Tip"
    Use this for shortcuts, defaults, and practical setup hints.

!!! warning "Important"
    Use this when readers can make a costly configuration mistake.


Tabbed admonition content using `===`
!!! example
  
    === "Topic 1"
        Use this to show multiple steps, examples or variations in a single callout to minimize
        scrolling and clutter.
    
        Lorum ipsumque draconis flutare in aetherium spirat. Vexillum quondam 
        wobblare nunc per orbem fantasticae vagatur.

    === "Topic 2"
        Lorum ipsumque draconis flutare in aetherium spirat. Vexillum quondam 
        wobblare nunc per orbem fantasticae vagatur.

    === "Topic 3"
  
        Lorum ipsumque draconis flutare in aetherium spirat. Vexillum quondam 
        wobblare nunc per orbem fantasticae vagatur.
        
## Tables

Use simple pipe tables with short headers. Keep units in headers or in a Notes column.

Template:

```markdown
| Parameter | Default | Typical range | Notes |
| --- | --- | --- | --- |
| `parameter_name` | `1.0` | `0.8-1.2` | What changing it does |
```

Example:

| Parameter | Default | Typical range | Notes |
| --- | --- | --- | --- |
| `extruder_homing_max` | `50` | `20-80` | Upper bound for homing movement |
| `toolhead_post_load_tighten` | `60` | `40-90` | Extra movement to seat filament |

## Code blocks and commands

Use fenced code blocks with explicit language.

- Use ````ini` for config examples (including cfg-like snippets).
    ```ini
    # mmu_parameters.cfg
    toolhead_post_load_tighten: 60
    extruder_homing_max: 50
    ```
- Use ````bash` for commands genuinely entered in a Linux shell, such as cd, git, make, or installer commands.
    ```bash
    make docs
    cd ~/Happy-Hare && ./install.sh -z -t -i
    ```
- Use ````{.text .console-command}` for console input to the printer. To join a
  command and its output visually, put its `console-output` fence immediately afterward.
- Use ````{.text .console-output}` for output returned by the printer.
    ```{.text .console-command}
    MMU_SLICER_TOOL_MAP PURGE_MAP=1
    ```

    ```{.text .console-output}
    -------- Slicer MMU Tool Summary ---------
    2 color print (Purge volume map loaded)
    T0 (Gate 0, ABS, ff0000, 240°C)
    ```
- Use ````text` for unclassified plain text.
    ```text
    Regular preformatted text
    ```

## Images and screenshots

For menuconfig or UI screenshots in narrative pages, center images and set width to improve readability in long pages.

```html
<p align="center">
  <img src="Feature-Example/screen-01.png" alt="Feature setup screen" width="70%">
</p>
```

Guidance:

- Prefer one screenshot per concept step.
- Keep alt text descriptive and task-oriented.
- Avoid low-contrast crops or tiny text.

## Theme and color guidance

Site theme direction (from [mkdocs.yml](../mkdocs.yml)):

- Primary: black
- Accent: pink
- Light scheme: `default`
- Dark scheme: `slate`

Use semantic styling rather than hard-coded inline colors whenever possible.

The site also applies a tri-color marker before H2 headings via CSS in [doc/assets/stylesheets/extra.css](assets/stylesheets/extra.css).

## Icons and icon repositories

This site uses Material-style icon identifiers in config (examples: `material/tablet-dashboard`, `fontawesome/brands/github`).

Useful icon references:

 <img src="https://api.iconify.design/simple-icons:lucide.svg?color=%23cfd3dc" alt="Lucide icon" width="12">  [Lucide](https://lucide.dev/icons/)
<br>
 <img src="https://api.iconify.design/simple-icons:materialdesignicons.svg?color=%23cfd3dc" alt="Material Design icon" width="12">  [Material Design](https://pictogrammers.com/library/mdi/)
<br>
<img src="https://api.iconify.design/simple-icons:fontawesome.svg?color=%23cfd3dc" alt="FontAwesome icon" width="12">   [FontAwesome](https://fontawesome.com/search?m=free)
<br>
<img src="https://api.iconify.design/simple-icons:github.svg?color=%23cfd3dc" alt="Octicons icon" width="12">   [Octicons](https://octicons.github.com/)
<br>
 <img src="https://api.iconify.design/simple-icons:simpleicons.svg?color=%23cfd3dc" alt="Simple Icons icon" width="12">   [Simple Icons](https://simpleicons.org/)

Example social icon entries:

```yaml
extra:
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/moggieuk/Happy-Hare
      name: Happy Hare on GitHub
    - icon: material/tablet-dashboard
      link: https://github.com/moggieuk/KlipperScreen-Happy-Hare-Edition
      name: KlipperScreen Happy Hare Edition on GitHub
```

## Common mistakes to avoid

- Adding `[TOC]` to pages.
- Using GitHub callout syntax like `[!NOTE]`.
- Using unsupported admonition names such as `important`.
- Adding Mermaid fenced blocks where deterministic rendering is required.
- Leaving a page out of nav after creating it.

## Suggested workflow for knowledge workers

1. Draft page sections first.
2. Add callouts and tables second.
3. Add screenshots and links third.
4. Run local preview.
5. Confirm nav placement and section anchors.

---
