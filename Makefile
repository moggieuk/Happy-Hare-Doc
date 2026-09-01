SHELL := /usr/bin/env sh
PY    := python

# For quiet builds, override with make Q= for verbose output
Q ?= @

# CSpell version used by the opt-in spellcheck target. Keep this compatible with
# Node versions commonly found on contributor machines.
CSPELL_VERSION ?= 9.8.0

# Where to fetch Happy-Hare's source from, and which ref to pin to. HAPPY_HARE_REF
# is a tracked file (one line) rather than a Makefile variable so bumping the pin
# is a one-line diff, not a Makefile edit. Tracks the 'v4' branch while v4 is still
# under active development - move to a tagged release once Happy-Hare starts
# cutting them, for reproducible regeneration.
HAPPY_HARE_REPO_URL ?= https://github.com/moggieuk/Happy-Hare.git
HAPPY_HARE_REF      := $(shell cat HAPPY_HARE_REF)

# Where the managed checkout lands - gitignored, never committed here. Override to
# point at a checkout you already have for fast local iteration, e.g.:
#   HAPPY_HARE_SRC=/path/to/Happy-Hare make shots
MANAGED_HAPPY_HARE_SRC := $(CURDIR)/.happy-hare-src
HAPPY_HARE_SRC ?= $(MANAGED_HAPPY_HARE_SRC)

# The stamp avoids Make target parsing issues when workspace paths contain
# spaces or '#'.
VENV_READY_STAMP   := .make/venv-ready.stamp

# Shared venv for doc tooling (pyte, Pillow, zensical - see doc_tools/requirements.txt)
VENV     ?= venv
VENV_PY  := $(VENV)/bin/python
BOOTSTRAP_PY := $(if $(shell command -v $(PY) 2>/dev/null),$(PY),python3)

.PHONY: fetch-source clean-source shots command_reference docs docs_build docs_check docs_preview spellcheck help

help:  # Print this help and exit
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_-]+:[^:]*## / {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""


###########################
##### Source fetching #####
###########################

# Only 'shots' and 'command_reference' need this - they read Happy-Hare's source
# tree directly (extras/mmu/**, installer/Kconfig*, installer/lib/kconfiglib).
# 'docs'/'docs_build'/'docs_preview' only render already-committed doc/*.md and
# never touch this, which is also why the CI deploy workflow doesn't fetch it.
#
# The default checkout is a disposable managed cache, refreshed every time a
# source-dependent target runs. An explicitly supplied HAPPY_HARE_SRC is treated
# as user-owned and is only validated; it is never fetched, checked out or cleaned.
fetch-source:  ## Fetch or refresh Happy-Hare source
	$(Q)if [ "$(abspath $(HAPPY_HARE_SRC))" != "$(abspath $(MANAGED_HAPPY_HARE_SRC))" ]; then \
			git -C "$(HAPPY_HARE_SRC)" rev-parse --is-inside-work-tree >/dev/null 2>&1 || { \
				echo "HAPPY_HARE_SRC is not a git checkout: $(HAPPY_HARE_SRC)" >&2; exit 2; \
			}; \
			echo "Using external Happy-Hare checkout at $(HAPPY_HARE_SRC)"; \
		else \
			echo "Refreshing Happy-Hare @ $(HAPPY_HARE_REF) in $(HAPPY_HARE_SRC)"; \
			if [ ! -e "$(HAPPY_HARE_SRC)" ]; then \
				git clone --filter=blob:none --no-checkout "$(HAPPY_HARE_REPO_URL)" "$(HAPPY_HARE_SRC)"; \
			elif [ ! -d "$(HAPPY_HARE_SRC)/.git" ]; then \
				echo "Managed source path exists but is not a git checkout; run 'make clean-source' first" >&2; exit 2; \
			fi; \
			git -C "$(HAPPY_HARE_SRC)" remote set-url origin "$(HAPPY_HARE_REPO_URL)"; \
			git -C "$(HAPPY_HARE_SRC)" fetch --force --depth 1 origin "$(HAPPY_HARE_REF)" || \
				git -C "$(HAPPY_HARE_SRC)" fetch --force origin "$(HAPPY_HARE_REF)"; \
			git -C "$(HAPPY_HARE_SRC)" checkout --detach --force FETCH_HEAD; \
			git -C "$(HAPPY_HARE_SRC)" clean -ffd; \
		fi

clean-source:  ## Remove the managed source cache
	$(Q)if [ "$(abspath $(HAPPY_HARE_SRC))" != "$(abspath $(MANAGED_HAPPY_HARE_SRC))" ]; then \
			echo "Refusing to remove external HAPPY_HARE_SRC: $(HAPPY_HARE_SRC)" >&2; exit 2; \
		fi
	$(Q)rm -rf "$(MANAGED_HAPPY_HARE_SRC)"


#######################
##### Python venv #####
#######################

$(VENV_READY_STAMP): doc_tools/requirements.txt
	$(Q)mkdir -p "$(dir $@)"
	$(Q)if [ ! -x "$(VENV_PY)" ]; then echo "Creating virtualenv in $(VENV)/"; "$(BOOTSTRAP_PY)" -m venv "$(VENV)"; fi
	$(Q)"$(VENV_PY)" -m pip install --quiet --disable-pip-version-check -r "$<"
	$(Q)touch "$@"


#################################
##### Documentation targets #####
#################################

# Documentation screenshots: runs a real menuconfig session against the fetched
# Happy-Hare checkout and renders its screens to per-page image folders under
# doc/ - see doc_tools/README.md. Pass flags through ARGS, e.g.:
#   make shots ARGS='--list'
#   make shots ARGS='--only feature-espooler'
shots: fetch-source $(VENV_READY_STAMP)  ## Build documentation screenshots
	$(Q)HAPPY_HARE_SRC="$(HAPPY_HARE_SRC)" "$(VENV_PY)" -m doc_tools.$(if $(CAPTURE),capture,shots) $(ARGS)

# Regenerates doc/Reference-Commands.md and doc/Dev-Command-Reference.md from
# the real HELP_BRIEF/HELP_PARAMS/HELP_SUPPLEMENT text in the fetched
# checkout's extras/mmu/** - stdlib only, no venv needed.
command_reference: fetch-source  ## Regenerate command reference docs
	$(Q)HAPPY_HARE_SRC="$(HAPPY_HARE_SRC)" "$(PY)" -m doc_tools.gen_command_reference

# Builds and serves the doc/ site at http://127.0.0.1:8000 with live reload -
# rebuilds on every source change, so this is the one to leave running while
# writing a page. Reads mkdocs.yml at the repo root. Needs no Happy-Hare source -
# it only renders the doc/*.md and images already committed in this repo.
docs: $(VENV_READY_STAMP)  ## Serve docs with live reload
	$(Q)"$(VENV)/bin/zensical" serve

# Builds the static site into ./site - what actually gets published (and what
# the CI deploy workflow runs).
docs_build: $(VENV_READY_STAMP)  ## Build static site
	$(Q)"$(VENV)/bin/zensical" build

# What the PR-validation workflow runs: a strict build (aborts on broken
# `[text](Page.md)`-style page links, per Zensical's own --strict flag) plus
# doc_tools/check_refs.py for the two classes of broken reference --strict
# doesn't catch - dead mkdocs.yml nav entries and broken image src=/![]()
# targets. Kept separate from docs_build (used by the deploy workflow and local
# `make docs`/`make docs_preview`) since those have no reason to abort on a
# warning mid-draft.
docs_check: $(VENV_READY_STAMP)  ## Run strict build validation
	$(Q)"$(VENV)/bin/zensical" build --strict
	$(Q)"$(VENV_PY)" -m doc_tools.check_refs

# Spell-check tracked, human-maintained documentation and supporting source using
# the project CSpell configuration. Generated references, project notes and binary
# assets are excluded.
# Pass additional CSpell options through ARGS, e.g. make spellcheck ARGS='--no-summary'.
spellcheck:  ## Spell-check documentation and supporting source
	$(Q)command -v npx >/dev/null 2>&1 || { \
		echo "Node.js/npm is required to run CSpell" >&2; \
		exit 1; \
	}
	$(Q)git ls-files -- \
		'*.md' '*.txt' '*.yml' '*.yaml' '*.py' '*.js' '*.css' \
		'Makefile' \
		':(exclude).cspell.config.yml' \
		':(exclude).project-words.txt' \
		':(exclude).agents/**' \
		':(exclude).claude/**' \
		':(exclude)MMX-Happy-Hare-Guide-Review.md' \
		':(exclude)TOC.md' \
		':(exclude)doc/Reference-Commands.md' \
		':(exclude)doc/Dev-Command-Reference.md' | \
		while IFS= read -r file; do \
			[ -f "$$file" ] && printf '%s\n' "$$file"; \
		done | \
		npx --yes cspell@$(CSPELL_VERSION) lint --no-progress --file-list stdin $(ARGS)

# Serves the already-built ./site as plain static files - no rebuild, no live
# reload. This is what GitHub Pages (or any static host) actually does with the
# site, so it's the one to use for a final check before publishing.
docs_preview: docs_build  ## Serve built site as static files
	$(Q)echo "Serving ./site at http://127.0.0.1:8000 (Ctrl-C to stop)"
	$(Q)cd site && $(PY) -m http.server 8000
