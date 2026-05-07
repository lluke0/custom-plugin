---
name: setup
description: >
  Builds a portable markdown StudyVault from source PDFs/text/web by quoting source prose verbatim
  with page citations and embedding all source visuals (figures, tables, equations) as captured PNGs.
argument-hint: "[source-path-or-url] | --enrich"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch
---

# Tutor Setup — Source-Fidelity StudyVault

Generates a **structured reader's edition** of the source: every body line is either a verbatim quote with page citation or a captured PDF visual. The LLM organizes, captures, and cross-links — it does NOT compose body content. The vault renders in any markdown viewer (GitHub, VS Code, mdBook).

> **Core principle (READ FIRST)**: every word of body content MUST come from the source — either as a verbatim text quote (`> 원문 (p.N): "..."`) or as a captured PDF image. If something is not in the source, it does NOT belong in the vault. The LLM contributes structure (folders, headings, frontmatter), navigation (cross-links, dashboards), and metadata (keywords) — nothing else.

> **CWD Boundary**: see [../_shared/cwd-boundary.md](../_shared/cwd-boundary.md).
> **Portability Rules**: see [../_shared/portability-rules.md](../_shared/portability-rules.md). All generated notes MUST follow these.

## Workflow

> Templates: [templates.md](references/templates.md)

### Phase D1: Source Discovery & Extraction

1. **Auto-scan CWD** for `**/*.{pdf,txt,md,html,epub}` (exclude `node_modules/`, `.git/`, `dist/`, `build/`, `StudyVault/`). Present for user confirmation.
2. **Extract text (MANDATORY tools)**:
   - **PDF → `pdftotext` CLI ONLY** via Bash — NEVER use Read directly on PDFs.
     ```bash
     pdftotext -layout "source.pdf" "/tmp/source.txt"
     ```
     Install if missing: `brew install poppler` (macOS) / `apt-get install poppler-utils` (Linux).
   - URL → WebFetch. Other formats (`.md`, `.txt`, `.html`) → Read directly.
3. **Capture visual assets (MANDATORY for PDF sources)**:
   - **Render every page as PNG** to `StudyVault/_assets/<source-stem>/`:
     ```bash
     mkdir -p "StudyVault/_assets/<source-stem>"
     pdftoppm -r 150 -png "source.pdf" "StudyVault/_assets/<source-stem>/p"
     ```
     `pdftoppm` produces `p-001.png`, `p-002.png`, ... Notes embed pages by relative path.
   - **Inventory raster figures per page** to know which pages MUST be embedded:
     ```bash
     pdfimages -list "source.pdf" > "/tmp/<source-stem>_images.tsv"
     ```
   - The pdftoppm renders are the *authoritative visual record* — they capture figures, tables, and typeset equations in their original form. Re-render at higher dpi (200–300) for any page where embedded text is hard to read.
4. **Read extracted `.txt` files** — work exclusively from converted text + page renders, never raw PDF.
5. **Source Content Mapping (MANDATORY for multi-file sources)**:
   - Read **cover + TOC + 3+ sample pages from middle/end** for EVERY source file.
   - **NEVER assume content from filename** — file numbering often ≠ chapter numbering.
   - Build verified mapping: `{ source_file → actual_topics → page_ranges }`. Flag non-academic files and missing sources. Present for user verification before proceeding.

### Phase D2: Content Analysis

> **Source-bounded rule (replaces Equal Depth Rule)**: vault scope is bounded by what the source contains. If the source covers a subtopic in one paragraph, the corresponding note is one quoted paragraph. Do NOT expand briefly mentioned subtopics with LLM-supplied content.

1. **Identify topic hierarchy from the source's own TOC/headings** — do NOT impose an external taxonomy.
2. **Map dependencies** using only the source's own forward/backward references (e.g., "see Chapter 3", "as discussed earlier").
3. **Topic checklist (MANDATORY)** — every section/subsection from source TOC is listed with source file + page range. This drives folder structure and concept files.
4. **Source-to-note cross-verification (MANDATORY)** — topics without traceable source pages are NOT created (do not invent them).

### Phase D3: Keyword Standard

Define keyword vocabulary (stored in `keywords:` frontmatter):
- **Format**: English, lowercase, kebab-case (e.g., `data-hazard`).
- **Hierarchy**: top-level → domain → detail → technique → note-type.
- **Registry**: only registered keywords allowed. Detail keywords co-attach parent domain keywords.
- Keywords are **metadata about content**, not content — LLM-generated tags are allowed here.

### Phase D4: Vault Structure

Create `StudyVault/` mirroring the source's chapter/section structure (do NOT re-cluster across chapter boundaries). See [templates.md](references/templates.md).

```
StudyVault/
  _assets/<source-stem>/p-001.png ...    # full-page PNG renders
  00-Dashboard/
  01-<Chapter1>/
    <section>.md
    ...
  concepts/<area>.md                     # per-area trackers
  dashboard.md                           # learning progress
```

### Phase D5: Dashboard Creation

Two distinct artifacts. Both draw content ONLY from source:

1. **Content MOC bundle** at `StudyVault/00-Dashboard/` (a directory):
   - `00-Dashboard/moc.md` — Topic Map (links to every concept note) + Study Tools + Keyword Index (with rules) + Weak Areas (empty initially, with links once populated by `quiz`) + Non-core Topic Policy
   - `00-Dashboard/quick-reference.md` — verbatim quotes of source's own definitions and formulas with page citations. Each entry: `**Term** — > "exact source text" (p.N) → [Concept Note](relative/path.md)`. If the source has no clean definition for a term, **omit it** — do NOT compose one.
   - `00-Dashboard/exam-traps.md` — quotes ONLY of source's own warning/note/caution callouts (e.g., "주의:", "Warning:", "주목:", "흔한 오류"). If the source has no such callouts, the file states so in one line. Do NOT generate trap commentary.

2. **Learning progress dashboard** — exactly ONE file at the canonical path **`StudyVault/dashboard.md`** (lowercase, English filename so cross-skill globs are deterministic). The H1 and all table content MUST be in the source language (e.g. `# 학습 대시보드`). Per "Learning Dashboard Template" in [templates.md](references/templates.md). All areas start at ⬜ Undersampled / 0 Mastery. Columns MUST be exactly `Area | Concepts | Covered | Accuracy | Mastery | Level | Details` — matches the schema `quiz` reads. Spec of record: [../quiz/references/progress-rules.md §2](../quiz/references/progress-rules.md).

> **Single-file invariant (MANDATORY)**: exactly ONE learning-progress dashboard at `StudyVault/dashboard.md`. Do NOT also create `학습 대시보드.md`, `Learning Dashboard.md`, `00-Dashboard/dashboard.md`. If a legacy localized file exists at vault root, **rename to `dashboard.md`** instead of creating a new one.

### Phase D6: Concept Notes — Source Fidelity

> **Goal**: every body line is either (a) a verbatim quote with page citation, or (b) a captured visual from source. The LLM contributes ONLY: section titles, ≤1-line navigation lead-ins, visual embeds, and `## Related Notes`.

Per [templates.md](references/templates.md). Key rules:

- **YAML frontmatter (MANDATORY)**: `source_pdf`, `part`, `keywords`. `source_pdf` MUST match verified Phase D1 mapping. If unavailable: `source_pdf: 원문 미보유` (and the note SHOULD NOT be created in the first place — the source-bounded rule forbids inventing content).
- **Body composition**: prose is wrapped in `> 원문 (p.N): "..."` blockquotes. Multi-paragraph quotes use multi-line `> ` blocks. Page numbers MUST match the source.
- **Verbatim with minimal typographic cleanup ALLOWED**: re-flow line breaks at paragraph end, re-join broken hyphens, drop footnote markers — *typographic only*. Word/order/notation changes FORBIDDEN.
- **Ellipsis & bracket conventions**: cuts marked `[…]`; clarification (only for ambiguous symbols, very rare) marked `[원문 표기 그대로: ...]`. Never silently rewrite.
- **Visual embeds (MANDATORY)**: every figure/table/equation appearing on a page covered by the note is embedded as `![<verbatim caption> (p.N)](../_assets/<source-stem>/p-NNN.png)`. Page-level capture is the default — if a page contains multiple unrelated figures, embed once and rely on the reader to locate the relevant region. Caption text is verbatim from source.
- **Section headings**: localized to source language (Korean source → `## 정의`, `## 원리`). Use `##` for primary lesson-step sections (this is what `lesson` parses and `concepts/{area}.md` seed block counts); `###` only for sub-blocks within a step. Headings reflect the source's own structure — do NOT impose a canonical 5-section template.
- **Related Notes (MANDATORY, role-labeled)** — every concept note ends with `## Related Notes` containing prerequisite (선수) / sibling (관련) / downstream (이 개념을 쓰는 곳). Drawn from cross-references the source itself makes. **This is the ONLY LLM-composed text allowed in the body.**
- **No LLM body content**: no LLM-generated definitions, intuitions, examples, derivations, comparisons, mermaid/ASCII diagrams, or misconceptions. If you feel tempted to write a sentence outside a `>` blockquote (other than headings, ≤1-line lead-ins, visual embeds, Related Notes), stop — that content does not belong in the vault.
- **Empty is acceptable**: a note for a topic the source mentions in one sentence is one quote line. Do NOT pad.

Also create **per-area concept trackers** at `StudyVault/concepts/{area}.md` per "Concept Tracker Template" in [templates.md](references/templates.md):

- **Concepts seed block** (`## Concepts (N total)`): section-level granularity — for each concept note in the area, emit one seed entry per `##` section heading inside the file (excluding `Related Notes`, `Related Concepts`, `관련 노트`). Label format: `<file-basename> · <section-title>` (or `<section-title>` alone if globally unique within the area). Authoritative total for Coverage downstream.
- **Tracker table**: starts empty (Concept / Attempts / Correct / Streak / Last Tested / Status).
- **Error Notes** section header: present from creation, body empty.

### Phase D6.5: Enrichment Mode (`--enrich`)

Triggered when `/setup` is invoked with `--enrich` (no source argument required). Skip Phases D1–D5 and D7+ — operate ONLY on existing `StudyVault/`. Strictly **fidelity-improving**:

1. **Scan**: walk `StudyVault/**/*.md` excluding `00-Dashboard/`, `concepts/`, and `dashboard.md`.
2. **Audit each concept note** for fidelity gaps. **Skip any `##` section whose heading carries the `[supplement]` tag** — those are lesson-generated supplements and are exempt from fidelity rules.
   - **Non-quote body content**: lines in body that are not (a) `> ` blockquote, (b) section heading, (c) ≤1-line navigation lead-in, (d) visual embed, (e) Related Notes block — flag as **fidelity violation**.
   - **Missing page citation**: `> ` quote without a `(p.N)` marker — **traceability gap**.
   - **Missing visual capture**: source page covered by the note contains a figure/table/equation (per `pdfimages -list` inventory) but no embed in the note — **capture gap**.
   - **Citation accuracy**: sample 20% of `(p.N)` citations and verify against `source_pdf`'s extracted text — flag mismatches as **citation error**.
3. **Report**: print findings, ask user to confirm before rewriting.
4. **Fix** confirmed gaps: re-extract source pages with `pdftotext`, re-capture missing visuals with `pdftoppm` (re-render at 200–300dpi if image quality is poor), replace LLM-generated prose with verbatim quotes from the same page (or remove the prose entirely if no source basis exists).
5. **Do NOT** touch keywords registry, MOC, or learning dashboard.

### Phase D7: Interlinking

1. `## Related Notes` on every concept note (role-labeled).
2. MOC links to every concept note.
3. Quick Reference entries → `[Concept Note](relative/path.md)` links.
4. Exam Traps → concept notes (only when source's callouts reference specific topics).
5. Siblings reference each other.

### Phase D8: Self-Review (MANDATORY)

Verify against [quality-checklist.md](references/quality-checklist.md). Fix and re-verify until all checks pass.

## Language

- Match source language (Korean source → Korean section titles + Korean quoted body). Quoted content is **always verbatim source language**.
- Keywords: ALWAYS English (kebab-case).
