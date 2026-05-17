---
name: lesson
description: >
  Step-by-step concept tutor for a single StudyVault concept note. Walks the user through each `##`
  section in order, advances on user confirmation, answers questions by appending new sections to
  the same note, and updates the area tracker + Learning Dashboard. Args: `<path-to-concept-note.md>`.
  Triggers: "/lesson", "lesson <file>", "step-by-step", "설명해줘", "차근차근".
argument-hint: "<path-to-concept-note.md>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Tutor Lesson Skill

Step-by-step concept tutor that walks the learner through one concept note `##` section at a time. Advances on explicit user confirmation. Branches into supplementary explanation when the learner asks a question, persisting that supplement back into the source note so the next session sees it.

> **Spec of record**: All progress calculations and the `📘 Learned` status are defined in [../_shared/progress-rules.md](../_shared/progress-rules.md). Sections referenced as §N below.
>
> **Lesson rules**: section selection, question handling, and persistence rules in [lesson-rules.md](references/lesson-rules.md).

## Scope

- One `##` section = one lesson step.
- Top-down: sections are taught in the order they appear in the file.
- Lesson is a **read-then-write** flow per step: explain the section → ask the user → either advance or branch into a supplementary section.
- The lesson never modifies sections it has already taught; it only **appends** new `##` sections at the end of the file when the user explicitly confirms understanding of a Q&A.
- **Deferred Q&A persistence**: questions during a step do NOT mutate the source note immediately. Q&A pairs accumulate in an in-memory pending buffer and are flushed to the note as a single batched edit only when the user explicitly confirms understanding (advances). See [lesson-rules.md §Pending Q&A Buffer](references/lesson-rules.md).

## File Structure

```
StudyVault/
├── dashboard.md              ← Learning Dashboard (canonical path; recomputed at lesson end)
├── concepts/
│   └── {area}.md             ← Tracker + seed block (mutated per section)
└── NN-<area>/
    └── <concept-note>.md     ← Lesson target (mutated only by appending Q&A sections)
```

## Workflow

### Phase L0: Detect Language

Detect user's language from their message → `{LANG}`. All output and any new sections written into the note use `{LANG}`. The note language overrides if the existing note is in a different language — match the note.

### Phase L1: Resolve Target Note

1. Argument required. If missing → ask user for the concept note path. Do not pick automatically.
2. Verify path exists, is a `.md` file, and lives under a `StudyVault/NN-<area>/` directory.
3. If not under any `NN-<area>/`: stop and tell user — this skill operates only on concept notes inside an area folder.
4. Compute `area = parent directory basename` (e.g. `01-DNS` → area name as it appears in `concepts/`). Resolve `tracker_path = StudyVault/concepts/{area}.md` per [progress-rules.md §1](../_shared/progress-rules.md). If tracker missing → stop and tell user to run `/setup` or `/sync` first.

### Phase L2: Parse Sections

Read the concept note. Extract the ordered list of `##` heading sections, **excluding** boilerplate per [lesson-rules.md §Section Selection](references/lesson-rules.md):

- `Overview Table`, `Exam/Test Patterns`, `Related Notes`, `Related Concepts`
- `시험 빈출 패턴`, `관련 노트`, `한눈에 비교`
- Any `##` whose entire body is a single table or single bullet list ≤ 3 items (likely metadata, not a concept)

Each remaining `##` section is a **lesson step** with:
- `seed_label`: derived per [lesson-rules.md §Seed Label Format](references/lesson-rules.md). Format: `<file-basename> · <section-title>` (or just `<section-title>` if globally unique within the area).
- `body`: the section content (everything between this `##` and the next `##` or end of file).

### Phase L3: Load Tracker & Determine Resume Point

Read `tracker_path`. Locate:
1. The **seed block** (`## Concepts (N total)`) — confirm it lists every step's `seed_label`. If a step's label is missing from the seed block, append it (preserve format) and increment `N total`.
2. The **tracker table**. For each lesson step, classify:

   | Existing Status | Action this lesson |
   |-----------------|--------------------|
   | (no row) | Step is **pending** — will teach |
   | `📘` | Step was learned previously — skip if user opts to skip-learned, otherwise re-teach |
   | `🔴` | Step has an open error — re-teach (lesson does NOT clear 🔴; only `quiz` does on next correct answer) |
   | `🟡` / `🟢` | Already quiz-tested — by default skip (treat as known); user can override with explicit "다시 설명" / "review all" intent |

3. Determine `resume_index`: index of the first lesson step whose status is **pending** OR `📘` AND the user wants to continue. Show a one-line resume summary:

   ```
   📖 {file-basename}: {N_pending} pending · {N_learned} learned · {N_tested} tested
   →  Starting at step {resume_index + 1}/{total}: "{section title}"
   ```

   If everything is already 🟡/🟢 and user did not request review, ask: "이 노트는 이미 모두 학습되었습니다. 처음부터 다시 설명할까요?" — proceed only on yes.

### Phase L4: Lesson Loop

For each step from `resume_index` to last:

#### L4.1 — Render the step

Render in two parts:

1. **Show the source content as-is** — print the section heading and body verbatim (or lightly reformatted for chat readability). Preserve `> 원문 (p.N): ...` blockquotes, captured image references, mermaid/ASCII diagrams, tables, code blocks. Never paraphrase away source quotes; they are the canonical record.

2. **Add chat-only LLM elaboration** — `setup` keeps notes verbatim from the source, so most of a section's body will be `> 원문 (p.N)` blockquotes plus image embeds. After showing the source content, **always provide LLM-composed elaboration in chat**:
   - Plain-language paraphrase of the quote (what the passage actually says, in everyday terms).
   - Intuition/analogy (why the concept looks the way it does).
   - At least one concrete example beyond what the source provides.
   - Common misconceptions if any apply.
   - This elaboration is **chat-only and ephemeral** — it does NOT get persisted to the source note. Only Q&A confirmed via L4.3a flow becomes a `[supplement]` section.
   - Skip the elaboration ONLY if the section is already a `[supplement]` (lesson-generated, already self-contained) or its body already contains rich LLM-composed prose (legacy vault).

If the section's source content is long (>40 lines including diagrams), split your narration into 1-2 paragraphs walking through the parts in order, ending with a recap. Always show the diagrams/tables verbatim.

End every step render with the **understanding prompt** (`{LANG}`):

```
이해하셨다면 "ok" / "다음" / "계속" 중 하나, 질문이 있으면 자유롭게 입력해 주세요.
```

(Localize for English source: `Reply "ok" / "next" / "continue" if understood, or ask any question freely.`)

#### L4.2 — Classify the user's response

Per [lesson-rules.md §Response Classification](references/lesson-rules.md):

- **Confirmation**: short affirmatives — `ok`, `okay`, `next`, `continue`, `다음`, `계속`, `네`, `응`, `understood`, `got it`, `👍`, single-emoji thumbs-up. Threshold: ≤ 4 tokens AND no `?` AND no interrogative words.
- **Question**: anything else, including statements that imply confusion ("잘 모르겠어", "왜 그렇지?", "한 번 더 설명해줘", any `?`).

If ambiguous → treat as Question (safer default — no premature progress).

#### L4.3a — On Confirmation

This is the only point where the source note is mutated. Perform in order (per [lesson-rules.md §Pending Q&A Buffer](references/lesson-rules.md) and §Tracker Updates on Confirmation):

1. **Flush pending Q&A buffer** (if non-empty for this step):
   - For each buffered Q&A, append a `## … [supplement]` section to the source note per [lesson-rules.md §Q&A Section Template](references/lesson-rules.md).
   - For each, append `- <file-basename> · {short topic} [supplement]` to `## Concepts (N total)` and increment `N total` accordingly.
   - For each, append a `📘` row to the tracker.
   - Bundle related Q&As into a single Write/Edit pass on the source note (one mtime change per confirmation).
   - Clear the pending buffer for this step.
2. **Update tracker for the step itself**:
   - If no row exists for this step's `seed_label` → append: `| {seed_label} | 0 | 0 | 0 | {today} | 📘 |`.
   - If row exists with `📘` → update `Last Tested = today`.
   - If row exists with `🔴` / `🟡` / `🟢` → **do not modify** (lesson does not overwrite quiz state per progress-rules.md §4).
3. Persist the tracker file. Advance to next step.

#### L4.3b — On Question

1. **Answer in chat only**: explain in `{LANG}` with textbook-grade depth — `setup` keeps notes verbatim from the source, so `lesson` is where the LLM contributes intuition, examples, and elaboration that the bare quotes lack. Include mermaid/ASCII diagram if it clarifies (recommended, not required).
2. **Append to in-memory pending buffer** for the current step (do NOT touch the source note, tracker, or seed block yet):
   - Record `{question, answer, short_topic, timestamp}` so confirmation can flush all related Q&As at once.
   - The note file's mtime MUST remain unchanged until the user confirms understanding.
3. **Re-prompt understanding for the original step**: do NOT auto-advance. Re-render the understanding prompt for the same step. This loop continues until confirmation.

The user can ask multiple questions (including follow-ups when an earlier answer wasn't understood) — they all stay in the pending buffer and are flushed together as one bundled batch on the next confirmation. The original section is never modified.

### Phase L5: Finalize

Once the loop completes (last step confirmed):

1. **Recompute Learning Dashboard** per [progress-rules.md §2](../_shared/progress-rules.md). Read all `concepts/*.md`. Update the row for this area and the Stats block (including the `Learned (📘)` count). Write the dashboard at the canonical path **`StudyVault/dashboard.md`**. If a legacy localized file exists at the vault root (`*dashboard*` / `*대시보드*` other than `dashboard.md`), rename it to `dashboard.md` before writing — never write a second dashboard file.
2. **Print a session summary**:
   ```
   ✅ {file-basename} 학습 완료
      - {N_taught_this_session} 섹션 학습 (📘)
      - {N_questions} 추가 설명 작성
      - 다음 단계: /quiz section {area}  ← 학습한 내용 점검
   ```

## Invariants

- Lesson never deletes or modifies pre-existing `##` sections in the concept note. Only appends.
- Lesson never demotes 🟢 / 🟡 / 🔴 to 📘. The state machine direction is `📘 → {🔴, 🟡, 🟢}` only, owned by `quiz`.
- Lesson never modifies error notes — they belong to `quiz`.
- Every new tracker row goes through the seed block first. The Option A invariant from [progress-rules.md §1](../_shared/progress-rules.md) is preserved: `|tracker rows| ≤ |seed entries|`.
- **Note mtime invariant**: between an understanding prompt and the user's confirmation, the source note's mtime never changes. Q&A persistence is strictly deferred to confirmation.
- If the user aborts mid-step ("그만" / Ctrl-C) before confirming, the pending buffer is **discarded** — unconfirmed Q&As are not written to disk. Already-confirmed steps are already persisted.
- All cross-file references use relative-path markdown.

## Important Reminders

- ALWAYS read [progress-rules.md](../_shared/progress-rules.md) before Phase L3 / L4.3 / L5 — it defines the `📘` semantics and the dashboard formula.
- ALWAYS read [lesson-rules.md](references/lesson-rules.md) before Phase L2 / L4.
- Never auto-advance on ambiguous responses. When in doubt, treat as a question.
- Never write to the source note while a step is "in-progress" (between prompt and confirmation). Q&A goes through the pending buffer.
- Lesson is read-mostly for the source note: only **append** new sections at confirmation time, never edit existing ones.
