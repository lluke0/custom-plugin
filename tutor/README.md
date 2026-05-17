# tutor-skill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-skill-blue)](https://docs.anthropic.com/en/docs/claude-code)
[![Install with npx skills](https://img.shields.io/badge/npx_skills-add-green)](https://github.com/vercel-labs/skills)

Five [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills that turn any document source into a **portable markdown StudyVault**, teach you through it step-by-step, quiz you on it, browse it in a polished local web viewer, and incrementally re-sync as your source materials evolve — closing the loop from content to comprehension. The vault is plain markdown, so it renders in any editor or viewer (GitHub, VS Code, mdBook, etc.) — no proprietary tools required.

## How It Works

```
   Documents              StudyVault            Lesson / Quiz             Web Viewer
 ┌───────────┐  /setup  ┌────────────┐  /lesson  ┌────────────┐  /view  ┌────────────┐
 │ PDF / MD  │────────▶ │ verbatim   │──────────▶│ step-by-   │────────▶│  browsable │
 │ HTML/EPUB │          │ quotes +   │           │ step       │         │  site, ⌘K  │
 │ TXT / URL │          │ captured   │  /quiz    │ teaching + │         │  search    │
 └───────────┘          │ visuals    │──────────▶│ 4-question │         └────────────┘
                        │ + dashboard│           │ rounds     │
                        └─────┬──────┘           └─────┬──────┘
                              ▲                        │
                              │   /sync                │
                              └──── re-sync on ────────┘
                                    source change
```

## Skills Overview

| Skill | Command | Purpose | Input | Output |
|-------|---------|---------|-------|--------|
| **setup** | `/setup` | Build a source-fidelity StudyVault | Documents (PDF / MD / HTML / EPUB / TXT / URL) | Verbatim-quoted markdown notes, captured PDF page renders, dashboards |
| **lesson** | `/lesson <note>` | Step-by-step concept tutor for one note | A concept note path | LLM-composed elaboration in chat; `[supplement]` Q&A sections persisted back into the note |
| **quiz** | `/quiz` | Interactive quiz tutor | An existing StudyVault | 4-question rounds with concept-level progress tracking |
| **view** | `/view` | Local web viewer | An existing StudyVault | Browser UI with search, Mermaid, code highlighting, dark mode |
| **sync** | `/sync` | Incremental vault update from changed sources | Modified source files in CWD | Regenerated affected notes; learning progress preserved (error notes never deleted) |

## Quick Start

### Install via Claude Code marketplace

From inside Claude Code:

```
/plugin marketplace add jinukeu/custom-plugin
/plugin install tutor@custom-plugin
```

This registers all five skills (`/setup`, `/lesson`, `/quiz`, `/view`, `/sync`) automatically.

### Step 1: Generate a StudyVault

```bash
cd ~/study-materials/
claude
> /setup
```

### Step 2: Learn a concept (optional, slower track)

```bash
> /lesson StudyVault/01-DNS/recursive-resolution.md
```

### Step 3: Start Quizzing

```bash
> /quiz
```

### Step 4: Browse in the Web Viewer (optional)

```bash
> /view
```

Opens `http://127.0.0.1:5273` in your browser with the full vault rendered — complete with Mermaid, syntax highlighting, and ⌘K search.

### Step 5: Re-sync after source changes

```bash
# Edit / add / remove PDFs or notes in CWD, then:
> /sync
```

---

## setup

Transforms document sources (PDFs, text files, web pages, EPUB) into a **source-fidelity** markdown StudyVault.

> **Core principle**: every body line is either a verbatim source quote (`> 원문 (p.N): "..."`) or a captured PDF page image. The LLM contributes structure (folders, headings, frontmatter), navigation (cross-links, dashboards), and metadata (keywords) — never body content.

- Auto-scans working directory for source files (PDF, TXT, MD, HTML, EPUB)
- Extracts text via `pdftotext`; captures every page as PNG via `pdftoppm`
- Builds verified source-to-note mapping (no filename guessing)
- Generates concept notes with verbatim quotes + page citations + embedded visuals
- Builds an MOC dashboard (Topic Map, Quick Reference of source definitions, Exam Traps)
- Single learning-progress dashboard at canonical `StudyVault/dashboard.md`
- Full interlinking with role-labeled `## Related Notes` (prerequisite / sibling / downstream)

**Phases**

| Phase | Name | Description |
|-------|------|-------------|
| D1 | Source Discovery & Extraction | Scan, run `pdftotext` + `pdftoppm`, build verified source mapping |
| D2 | Content Analysis | Topic hierarchy + dependency map from source's own TOC |
| D3 | Keyword Standard | English kebab-case keyword registry |
| D4 | Vault Structure | Numbered folders mirroring source's chapter/section structure |
| D5 | Dashboard | MOC bundle + single `dashboard.md` |
| D6 | Concept Notes (source-fidelity) | Verbatim quotes + embedded page renders + Related Notes |
| D6.5 | Enrichment Mode (`--enrich`) | Audit existing vault; fix fidelity gaps only |
| D7 | Interlinking | Cross-references everywhere |
| D8 | Self-Review | Verify against quality checklist |

**Generated structure**

```
StudyVault/
  _assets/<source-stem>/p-001.png ...   # full-page renders from pdftoppm
  00-Dashboard/                          # MOC + Quick Reference + Exam Traps
  01-<Chapter1>/                         # concept notes per source chapter
  ...
  concepts/<area>.md                     # per-area tracker (used by quiz/lesson)
  dashboard.md                           # canonical learning-progress dashboard
```

---

## lesson

Step-by-step concept tutor for a single concept note. Walks the user through each `##` section in order, advances only on explicit confirmation, branches into supplementary explanation when the learner asks a question — and persists confirmed Q&As back into the note as `[supplement]` sections.

### Why lesson exists

`setup` keeps notes verbatim from the source. That's great for source fidelity but bare quotes often lack intuition, analogies, and examples. `lesson` is where the LLM contributes those — **in chat by default, persisted to the note only when the learner explicitly confirms understanding of a Q&A**.

### Lesson flow

1. Resolves target note (`<path>` argument required)
2. Parses ordered `##` sections (excluding boilerplate: Related Notes, Overview Table, Exam Patterns)
3. Determines resume point from the area tracker — skips already quiz-tested steps by default
4. For each step: shows source content as-is + chat-only LLM elaboration → prompts for understanding
5. User confirms (`ok` / `다음` / `next`) → advance to next step; or asks a question → answered in chat, queued in pending buffer
6. On confirmation, **pending Q&A buffer is flushed as a single bundled batch** to the source note (`[supplement]` sections), tracker row added with `📘 Learned` status
7. At end: recompute Learning Dashboard, including `Learned (📘)` count

### Invariants

- Never modifies pre-existing `##` sections — only appends
- Never overwrites `🔴 / 🟡 / 🟢` rows (lesson does not write quiz state)
- Note mtime never changes between prompt and confirmation
- Pending Q&A buffer is **discarded on abort** — unconfirmed Q&As are not persisted

---

## quiz

Interactive quiz tutor that tracks what you know and don't know at the **concept level**. Works with any StudyVault generated by `setup`.

### Session Types

| Type | When Available | Focus |
|------|----------------|-------|
| Diagnostic | Undersampled areas (⬜) exist | Broad assessment of new areas (coverage-building) |
| Drill weak areas | Weak areas (🟥/🟨) exist | Targeted practice on struggles |
| Choose a section | Always | Study any area on demand |
| Hard-mode review | All areas 🟩/🟦 | Challenge mastered material |

CLI shortcuts: `/quiz diagnostic`, `/quiz drill-weak`, `/quiz section <area>`, `/quiz hard`.

### Quiz Flow

1. Detects your StudyVault and reads the learning dashboard
2. Presents session options based on your current proficiency
3. Delivers 4 questions per round (4 options each, zero hints)
4. Grades answers and explains mistakes
5. Updates concept files and dashboard automatically

### Progress Tracking

Proficiency is tracked per area with two axes — **Coverage** (how many concepts have been tested) and **Mastery** (how many are confirmed 🟢). Level badges combine both (spec: [`_shared/progress-rules.md`](skills/_shared/progress-rules.md)):

| Badge | Level | Condition |
|-------|-------|-----------|
| ⬜ | Undersampled | Coverage < 50% (verdict deferred) |
| 🟥 | Weak | Coverage ≥ 50% AND Mastery < 40% |
| 🟨 | Fair | Coverage ≥ 50% AND 40–69% Mastery |
| 🟩 | Good | Coverage ≥ 70% AND 70–89% Mastery AND no unresolved (🔴) |
| 🟦 | Mastered | Coverage ≥ 90% AND Mastery ≥ 90% AND no unresolved (🔴) |

**Concept-level** tracking stores attempts, correct count, **Streak** (consecutive correct), last tested date, and status:

- 📘 learned (via `lesson`, not yet quiz-tested)
- 🔴 unresolved (currently missed)
- 🟡 tentative (one correct, not yet confirmed)
- 🟢 confirmed (Streak ≥ 2)

Status transitions:
- First correct → 🟡 (needs Streak ≥ 2 to confirm as 🟢)
- 🟡 → correct → 🟢 (Streak builds up — unless concept was wrong earlier in same session, in which case it's capped at 🟡 until next session)
- Any → wrong → 🔴 (error note added, Streak reset)

Error notes are permanent learning history — never deleted even after a concept returns to 🟢.

---

## view

Opens a local, hot-reloading web viewer for your StudyVault. Built on Vite + React + Tailwind, designed with an editorial/library aesthetic (serif body, warm ink palette) rather than generic SaaS chrome.

### Features

- **Sidebar** with collapsible folder tree mirroring `StudyVault/` layout
- **Home page** that surfaces the dashboard card and recent notes
- **Note pages** with serif typography, heading anchors, and an on-this-page rail
- **Mermaid** diagrams rendered client-side, auto-theming
- **Code blocks** highlighted with Shiki + one-click copy
- **`<details>` fold blocks** styled with gradient borders and smooth open animation
- **Command Palette (⌘K)** fuzzy-searches titles, headings, and keyword frontmatter
- **Dark / light theme** follows system preference, persisted to localStorage
- **Reading progress bar** at the top of the viewport

### How it works

`/view` runs directly from the skill's own `viewer/` directory — nothing copied into the user's project. Your vault is wired in via a single symlink (`viewer/vault → <project>/StudyVault`), refreshed on every invocation. `npm install` runs once per plugin version, then `vite dev` starts the server.

Dev server URL: `http://127.0.0.1:5273`. Static preview (`--build`): `5274`.

To produce a deployable static site, run with `--build` — output is copied to `view-dist/` in your project root.

**Requirements**: Node.js 18+ and npm.

---

## sync

Detects changes in your source materials and incrementally updates the StudyVault — only affected notes are regenerated. Learning progress is synced **safely**: error notes are NEVER deleted, destructive changes (rename / merge / archive) require approval.

### What's tracked

A `StudyVault/.manifest.json` records per-source SHA-256 hashes (and per-H2-section hashes for `.md` sources). On `/sync`, the manifest is diffed against the current CWD scan.

### Diff categories

| Category | Action |
|----------|--------|
| 🆕 New source | Run `setup`'s Phase D1+D2 on this source only, generate notes, add `⬜` area row to dashboard |
| ✏️ Modified | Regenerate affected notes (section-level optimization for `.md`); learning progress untouched |
| 🗑️ Deleted | Ask for approval → archive to `StudyVault/archive/`; error notes preserved |
| ✅ Unchanged | Skip |

### Safety guarantees

- Error notes are **never deleted** — preserved through rename / merge / archive
- Renames, merges, and archives **always require AskUserQuestion approval**
- `manual_edits: true` frontmatter on a note → sync skips it entirely
- Atomic manifest write (`.tmp` + `rename`) — no partial state on crash

---

## Portability

The generated StudyVault uses **only standard markdown**:

| What | Format |
|---|---|
| Cross-note links | `[text](relative/path.md)` |
| Foldable answers / hints | `<details><summary>label</summary>body</details>` |
| Callouts | `> **Tip:**`, `> **Warning:**`, `> **Important:**` blockquotes |
| Keywords / tags | YAML frontmatter `keywords:` field |
| Source quotes | `> 원문 (p.N): "..."` blockquotes |

Renders correctly on GitHub, VS Code (built-in preview), mdBook, Docusaurus, MkDocs, and any CommonMark-compliant viewer. No plugins needed.

---

## The Learning Cycle

```
        ┌──────────────────────────────┐
        │   /setup                     │
        │   Generate StudyVault        │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   /lesson <note>  (optional) │
        │   Step-by-step teaching      │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   /quiz                      │
        │   Diagnostic / Drill         │◀──────────┐
        └──────────────┬───────────────┘           │
                       │                            │
                       ▼                            │
        ┌──────────────────────────────┐           │
        │   Review weak areas          │           │
        │   in /view or any md viewer  │           │
        └──────────────┬───────────────┘           │
                       │                            │
                       ▼                            │
        ┌──────────────────────────────┐           │
        │   /quiz drill-weak           │           │
        │   Targeted practice          │───────────┘
        └──────────────────────────────┘

  Source materials changed?  →  /sync  (rebuild only what changed; preserve progress)
```

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and configured
- Any markdown viewer to browse the generated vault (GitHub web, VS Code, your IDE's markdown preview, etc.)
- `pdftotext` and `pdftoppm` (via `poppler` / `poppler-utils`) for PDF sources
- `pandoc` (optional, for HTML / EPUB sources in `/sync`)
- Node.js 18+ and npm (only for `/view`)

## Repository Structure

```
tutor-skill/
├── skills/
│   ├── _shared/                # Cross-skill specs (referenced by setup/quiz/lesson/sync)
│   │   ├── cwd-boundary.md
│   │   ├── portability-rules.md
│   │   └── progress-rules.md   # Spec of record for Coverage / Mastery / Streak
│   ├── setup/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── templates.md
│   │       └── quality-checklist.md
│   ├── lesson/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── lesson-rules.md
│   ├── quiz/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── quiz-rules.md
│   │       └── templates.md    # Fallback templates when quiz creates files on the fly
│   ├── sync/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── manifest-schema.md
│   │       └── sync-checklist.md
│   └── view/
│       ├── SKILL.md
│       ├── references/
│       │   └── design-system.md
│       └── viewer/             # Vite + React app (runs in place via symlink)
├── examples/
├── README.md
└── LICENSE
```

## Uninstall

From inside Claude Code:

```
/plugin uninstall tutor@custom-plugin
```

## License

[MIT](LICENSE)
