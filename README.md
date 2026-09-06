<p align="center">
  <img src="doc/assets/images/doc_logo2.png" alt="Happy Hare Documentation" width="50%">
</p>

# Happy Hare Documentation

The documentation site for [Happy Hare](https://github.com/moggieuk/Happy-Hare),
the universal MMU driver for Klipper - built with [Zensical](https://zensical.org).

This is a separate repo from the Happy Hare source code on purpose: the built site
carries a lot of screenshots, and cloning Happy Hare to actually run it on a printer
shouldn't mean pulling all of that down too.

## Building the site

```bash
make docs         # live-reload dev server at http://127.0.0.1:8000
make docs_build   # static build into ./site (what CI publishes)
make docs_preview # serve ./site exactly as a static host would
```

None of the above need Happy Hare's source code - they only render the Markdown
and images already committed under `doc/`.

## Regenerating generated content

Two things - `doc/Reference-Commands.md` and the menuconfig screenshots under
`doc/*/` - are generated directly from Happy Hare's source rather than
hand-written. Regenerating either needs a checkout of that source, which these
targets fetch automatically:

```bash
make command_reference   # regenerates doc/Reference-Commands.md
make shots                # regenerates menuconfig screenshots (make shots ARGS='--list' to see sessions)
```

By default they maintain a gitignored `.happy-hare-src/` checkout and refresh it
to the latest commit at the branch, tag or commit named in
[`HAPPY_HARE_REF`](HAPPY_HARE_REF) before every run. This is a disposable,
tool-managed cache, so local changes made inside it are not preserved.

If you already have a local Happy Hare checkout (e.g. you're working on both
repos at once), point at it directly instead of using the managed cache:

```bash
HAPPY_HARE_SRC=/path/to/your/Happy-Hare make shots
```

An explicitly supplied checkout is treated as user-owned: the Makefile reads it
as-is and never fetches, switches revisions, or removes it. `make clean-source`
only removes the default managed cache.

See `doc_tools/README.md` for how the generators themselves work, and `TOC.md`
for the planning/status doc behind the current rewrite.

## Porting from the (v3) wiki

Some pages are ported from the [Happy Hare wiki](https://github.com/moggieuk/Happy-Hare/wiki).
Clone it alongside this repo if you want to easily cross reference.

```bash
git clone https://github.com/moggieuk/Happy-Hare.wiki.git
```
