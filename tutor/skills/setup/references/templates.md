# Templates Reference

## Vault Folder Structure

```
StudyVault/
  _assets/<source-stem>/p-001.png ...    # full-page PNG renders from pdftoppm
  00-Dashboard/                          # MOC + Quick Reference + Exam Traps
  01-<Chapter1>/                         # Concept notes per source chapter/section
    <section>.md
  02-<Chapter2>/
  ...
  concepts/<area>.md                     # per-area trackers (for quiz/lesson)
  dashboard.md                           # learning progress (canonical English filename)
```

Folder structure mirrors the source's chapter/section layout. Do not re-cluster across chapter boundaries.

## Learning Dashboard Template (`StudyVault/dashboard.md`)

> Canonical filename: **`dashboard.md`** at the vault root — lowercase English so cross-skill globs are deterministic. The H1 and table content stay in the source language. Distinct from the `00-Dashboard/` MOC bundle (different artifact). Spec of record: [../../_shared/progress-rules.md §2, §3](../../_shared/progress-rules.md).

```markdown
# Learning Dashboard

> Concept-based metacognition tracking. See linked files for details.

---

## Proficiency by Area

| Area | Concepts | Covered | Accuracy | Mastery | Level | Details |
|------|----------|---------|----------|---------|-------|---------|
| <area-1> | N | 0/N | - | 0/N | ⬜ Undersampled | [details](../concepts/<area-1>.md) |
| **Total** | **sum** | **0/sum** | **-** | **0/sum** | ⬜ Undersampled | |

> ⬜ Undersampled (cov<50%) · 🟥 Weak (mas<40%) · 🟨 Fair (40-69%) · 🟩 Good (70-89%) · 🟦 Mastered (90-100%)

---

## Stats

- **Total Concepts**: <sum>
- **Covered**: 0 / <sum> (-)
- **Learned (📘)**: 0
- **Mastered (🟢)**: 0 / <sum> (-)
- **Stale (🟡)**: 0
- **Unresolved (🔴)**: 0
- **Weakest Area**: -
- **Strongest Area**: -
```

All areas start at ⬜ Undersampled / 0 Mastery. `quiz` fills as quizzes happen.

## Concept Tracker Template (`concepts/{area}.md`)

One per area. Built with seed populated from the concept notes in `NN-<area>/*.md` (NOT just file count). Tracker starts empty.

```markdown
# {Area Name} — Concept Tracker

## Concepts (N total)

- file-a · section 1
- file-a · section 2
- file-b · section 1
- ...

| Concept | Attempts | Correct | Streak | Last Tested | Status |
|---------|----------|---------|--------|-------------|--------|

### Error Notes

(added as concepts are missed)
```

- **Seed block**: MANDATORY. **Section-level granularity** — for each concept note in the area, emit one seed per `##` heading inside that file (excluding `Related Notes` / `Related Concepts` / `관련 노트`). One `.md` file → multiple seed entries. Label format: `<file-basename> · <section-title>` (or `<section-title>` alone if globally unique within the area). Authoritative total for Coverage.
- **Tracker**: starts empty; `quiz` adds rows on first test, `lesson` adds rows on first explanation (Status = `📘`). Column order fixed. Status enum: `📘` learned (lesson-only) / `🔴` unresolved / `🟡` tentative or stale / `🟢` confirmed. See [../../_shared/progress-rules.md §1, §4](../../_shared/progress-rules.md).
- **Error Notes**: header from creation; entries never deleted.

## Dashboard MOC Template

```markdown
---
source_pdf: <list all source files>
part: <part numbers or "all">
keywords: MOC, study map, dashboard, <subject>
---

# <Subject> Study Map

## Overview
- Exam/certification info (if applicable)
- Domain weights or topic importance

## Topic Map
| Section | Source | Notes | Status |
|---------|--------|-------|--------|
| Topic 1 | Part 1, p.10-25 | [Note 1](../01-Topic1/note-1.md), [Note 2](../01-Topic1/note-2.md) | [ ] |

## Study Tools
| 도구 | 설명 | 링크 |
|------|------|------|
| Exam Traps | 원문에서 직접 인용한 주의/경고 콜아웃 모음 | [Exam Traps](exam-traps.md) |
| Quick Reference | 원문 정의·공식 인용 모음 | [빠른 참조](quick-reference.md) |

## Keyword Index
| Keyword | 관련 주제 | 규칙 |
|---------|-----------|------|
| `tag-name` | Brief description | 상위/도메인/세부/기법/유형 |

> **Note:** <1-line summary of keyword hierarchy rule>

## Weak Areas
- (Empty initially. `quiz` populates as concepts are missed.)

## Non-core Topic Policy
| Source | Content | Handling |
|--------|---------|----------|
| <file> | <description> | **Excluded** — reason |
```

## Quick Reference Template

> Verbatim quotes only. If the source has no clean definition or formula for an entry, **omit it** — do NOT compose one.

```markdown
---
keywords: quick reference, definitions, formulas, dashboard
---

# Quick Reference (빠른 참조)

> 원문에서 직접 인용한 정의·공식 모음. 모든 항목은 출처 페이지를 표기합니다.

## <Topic 1> → [Concept Note](../01-Topic1/concept.md)

**Term A**
> 원문 (p.12): "exact source text defining Term A"

**Term B**
> 원문 (p.14): "exact source text defining Term B"

## 핵심 공식

**Formula X (p.20)**
> 원문 (p.20): "f(x) = ..."  
> → [관련 노트](../01-Topic1/concept.md)
```

## Exam Traps Template

> Quotes ONLY of source's own warning/note/caution callouts (e.g., "주의:", "Warning:", "주목:", "흔한 오류"). Do NOT generate trap commentary.

```markdown
---
keywords: exam traps, warnings, source callouts, dashboard
---

# Exam Traps (시험 함정 포인트)

> **Note:** 원문에 명시된 주의/경고 콜아웃만 인용합니다. 원문에 그런 콜아웃이 없는 주제는 이 파일에 포함되지 않습니다.

## <Topic 1>

<details>
<summary>주의 (p.23)</summary>

> 원문 (p.23): "exact warning text from source"

→ [Related Concept Note](../01-Topic1/concept.md)

</details>

---

## Related
- [MOC](moc.md) → Weak Areas
- [빠른 참조](quick-reference.md)
```

If the source has no warning/caution callouts at all, the file body contains a single line: `> 원문에 명시된 주의/경고 콜아웃이 발견되지 않았습니다.`

## Concept Note Template — Source Fidelity

> Goal: every body line is either (a) a verbatim quote with page citation, or (b) a captured visual from source. The LLM contributes ONLY: section titles, ≤1-line navigation lead-ins, visual embeds, and `## Related Notes`. Section headings inside generated notes should be localized to the source language (e.g. Korean source → `### 정의`, `### 원리`).

```markdown
---
source_pdf: <filename.pdf — MUST match verified Phase D1 mapping>
part: <part number>
keywords: <3-5 English keywords>, <tag-from-registry>
---

# <Title> (p.<page-range>)

## <Section title from source — e.g. 정의>

> 원문 (p.12): "exact verbatim quote from the source. Multi-line quotes
> continue with leading `> ` markers and preserve original wording.
> Hyphenated line breaks are re-joined; footnote markers may be dropped.
> Word order, terminology, and notation MUST NOT be changed."

> 원문 (p.13): "subsequent quote on the next page if the section spans
> multiple pages. Each block carries its own page citation."

![<verbatim caption from source> (p.13, 그림 2.4)](../_assets/<source-stem>/p-013.png)

## <Section title from source — e.g. 원리>

> 원문 (p.14-15): "..."

![표 2.1 — <verbatim caption> (p.15)](../_assets/<source-stem>/p-015.png)

---

## Related Notes  ← role-labeled (MANDATORY)
- **선수 개념 (prerequisite)**: [Concept A](../01-Topic/a.md) — referenced on p.10 as background
- **관련 개념 (sibling)**: [Concept B](b.md) — covered in adjacent section
- **이 개념을 쓰는 곳 (downstream)**: [Concept C](../03-Topic/c.md) — applied in later chapter
```

### Concept Note Rules

- **Body composition**: every line of body content is one of:
  1. A `> 원문 (p.N): "..."` blockquote (verbatim source text).
  2. A visual embed `![caption (p.N)](../_assets/<source-stem>/p-NNN.png)`.
  3. A section heading (`##` for lesson-step-level sections, `###` for sub-blocks within a step) reflecting the source's own structure. **Use `##` for the primary section divisions** — this is what `lesson` parses as teachable steps and what `concepts/{area}.md` seed block counts.
  4. A ≤1-line navigation lead-in (optional, for orienting the reader to which source pages this section covers).
  5. The trailing `## Related Notes` block.
- **No LLM-composed prose** anywhere outside (3), (4), and the `Related Notes` link descriptions. No mermaid, no ASCII diagrams, no tables that aren't direct reproductions of source tables (and source tables prefer the page-render image).
- **Verbatim with minimal typographic cleanup**: re-flow paragraph-end line breaks, re-join broken hyphens, drop footnote markers. Word/order/notation changes are FORBIDDEN.
- **Cuts and clarifications**: ellipsis `[…]` for cuts; `[원문 표기 그대로: ...]` for ambiguous symbols only. Never silently rewrite.
- **Page citation**: every `> ` quote MUST end with `(p.N)` or `(p.N-M)`. Single-page quotes get one number; quotes spanning pages get a range.
- **Visual embeds**: every figure/table/equation on a page covered by the note MUST be embedded. Page-level capture (full PNG render) is the default. Caption text is verbatim from source.
- **Frontmatter**: `source_pdf`, `part`, `keywords` all required. `source_pdf` MUST match Phase D1 mapping.
- **Empty is acceptable**: if the source covers a topic in one sentence, the note is one quote line. Do NOT pad.
- **Self-test**: every body line traces back to a specific source page. If you can't point at the page, the line should not exist.

## Visual Capture Guide

For PDF sources, all visual content is captured directly from the source — **no LLM-generated diagrams**.

### Capture pipeline (Phase D1)

```bash
mkdir -p "StudyVault/_assets/<source-stem>"
pdftoppm -r 150 -png "source.pdf" "StudyVault/_assets/<source-stem>/p"
pdfimages -list "source.pdf" > "/tmp/<source-stem>_images.tsv"
```

- **`pdftoppm -r 150 -png`** renders every page as a PNG. Default 150dpi; bump to 200–300 for pages with small text or fine diagrams. Output filenames are `p-001.png`, `p-002.png`, ...
- **`pdfimages -list`** produces a per-page inventory of raster images. Use it to identify which pages contain figures/tables/equations that MUST be embedded in their concept notes.
- For typeset equations and complex tables, the page render is authoritative — do NOT attempt to retype them as LaTeX or markdown unless the source provides them as plain text (e.g., inline `f(x) = x²`).

### Embedding rules

- **Path**: relative, `../_assets/<source-stem>/p-NNN.png`.
- **Caption**: verbatim source caption (e.g., `Fig 3.5 — 메모리 계층 구조`). Include page number: `(p.23)`.
- **Granularity**: page-level by default. If a single page contains multiple unrelated figures, embed once and let the reader visually locate the relevant one. Cropped versions can be added manually post-generation if needed.
- **Multi-page figures**: embed each page involved.
- **Non-PDF sources** (web pages, plain text): no automatic capture; if the source has images, follow the source's own image references where possible. Otherwise, the note is text-quote only.

### What NOT to do

- Do NOT generate mermaid or ASCII diagrams in `setup` output. Visualization is the source's responsibility — captured as-is or omitted.
- Do NOT re-typeset equations from `pdftotext` output (it mangles them). Always embed the page render for equation-heavy pages.
- Do NOT crop pages programmatically without verification — over-aggressive cropping cuts captions.
