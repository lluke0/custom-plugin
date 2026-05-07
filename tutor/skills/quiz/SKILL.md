---
name: quiz
description: >
  Interactive quiz tutor for markdown StudyVault learning. Args: `diagnostic` (진단평가), `drill-weak`
  (약점 드릴), `drill-stale` (스테일 복습), `section <area>` (섹션 지정), `hard` (하드 복습). Without args:
  shows session picker. Triggers: "quiz me", "test me", "let's study", "/quiz", "학습", "퀴즈", "평가".
---

# Tutor Quiz Skill

Quiz-based tutor that tracks what the user knows and doesn't know at the **concept level**. Operates on plain-markdown StudyVaults from `setup`. No Obsidian or proprietary tools required.

> **Spec of record**: All progress calculations (Coverage, Accuracy, Mastery, Level, Status transitions, stale detection) are defined in [progress-rules.md](references/progress-rules.md). Sections referenced as §N below.

## File Structure

```
StudyVault/
├── dashboard.md             ← Compact overview: proficiency table + stats (canonical filename)
└── concepts/
    ├── {area-name}.md       ← Per-area: seed block + tracker table + error notes
    └── ...
```

- **Dashboard**: aggregated numbers only. Stays small forever.
- **Concept files**: one per area. `## Concepts (N total)` seed block (authoritative for Coverage) + tracker table + error notes. Bounded growth.

## Workflow

### Phase 0: Detect Language

Detect user's language from their message → `{LANG}`. All output and file content in `{LANG}`.

### Phase 0.5: Parse Arguments

If skill args were provided (user typed `/quiz <arg>`), map to session type:

| Arg | Session |
|-----|---------|
| `diagnostic` / `진단` | Diagnostic |
| `drill-weak` / `weak` / `약점` | Drill weak |
| `drill-stale` / `stale` / `스테일` | Drill stale |
| `section <area>` / `섹션 <area>` | Choose a section (area = next token after keyword) |
| `hard` / `hard-mode` / `하드` | Hard-mode review |
| `help` / `?` | Print available arguments table and stop |

- **Recognized arg** → set `session_type` (and `target_area` if applicable), then **skip Phase 2** and proceed directly to Phase 2.5.
- **Unrecognized arg** → print the table above with a note ("알 수 없는 인수입니다. 사용 가능한 인수:"), then fall through to Phase 2 normally.
- **No args** → proceed to Phase 1 and Phase 2 normally.

For `section <area>`, if `target_area` is specified in args but not found in Phase 1's directory list, ask the user to pick from available areas before continuing.

### Phase 1: Discover Vault (lightweight)

Path discovery only — **do not read `concepts/*.md` here**. Defer reads to Phase 2.5 / Phase 6.

1. Glob `**/StudyVault/`. If none, inform user and stop.
2. List section directories under `concepts/` (names only).
3. Resolve dashboard path with this **canonical-first lookup**:
   1. Try `**/StudyVault/dashboard.md` (canonical). If found → use it.
   2. Else fallback glob `**/StudyVault/*dashboard*` and `**/StudyVault/*대시보드*` (legacy localized names from older vaults).
      - If exactly one match found → **rename it to `dashboard.md`** (one-time migration), then use the canonical path.
      - If multiple matches found → keep the most recently modified one as `dashboard.md`, archive the rest to `StudyVault/archive/duplicate-dashboards/`, and emit a one-time notice: `ℹ️ 중복된 학습 대시보드 N개를 발견했습니다. 가장 최근 파일을 dashboard.md로 정리하고 나머지는 archive/duplicate-dashboards/로 이동했습니다.`
   3. Else (none found) → defer creation to Phase 2.5 step 4 (template-based, canonical path only).
4. Do **not** read dashboard or concept files yet.

### Phase 2: Ask Session Type (fixed options)

**Skip this phase if `session_type` was set in Phase 0.5.**

**MANDATORY**: Use AskUserQuestion with the **fixed option set below** — do not pre-read concepts/dashboard to build context-aware labels. User picks intent first; Phase 2.5 loads only what that intent needs.

Always present (header "Session"):

1. **Diagnostic** — Sample broadly to find undersampled concepts
2. **Drill weak** — Focus on 🔴 unresolved / low-mastery in a chosen area
3. **Drill stale** — Review 🟡 concepts due for refresh (triggers full stale scan in Phase 2.5)
4. **Choose a section** — User picks an area manually
5. **Hard-mode review** — Harder rephrasings of already-mastered concepts

For options 2 / 4 / 5, follow up asking which area (from Phase 1's directory list).

### Phase 2.5: Load Selected Scope & Lazy Sweep

Now — and only now — read files. Scope depends on Phase 2 selection:

- **Drill weak / Choose a section / Hard-mode / Diagnostic** → read `concepts/{selected-area}.md` + dashboard.
- **Drill stale** → read `concepts/*.md` (all) + dashboard. Only intent that requires full scan; user opted in.

Then on the loaded scope:

1. **Schema backfill** (one-time per file): If `Streak` column or `## Concepts (N total)` seed missing → apply [§8](references/progress-rules.md). Files outside loaded scope are backfilled lazily on next selection or in bulk in Phase 6.
2. **Stale detection**: If `Status == 🟢 AND (today − Last Tested) > 14 days` → demote to 🟡 (Streak preserved).
3. **Persist**: Write changed concept file(s). Do not touch Attempts / Correct / Error notes.
4. **Create dashboard** at the canonical path **`StudyVault/dashboard.md`** from [templates.md](references/templates.md) if missing. Do NOT create any other variant (`학습 대시보드.md`, `Learning Dashboard.md`, etc.) — there is exactly one learning dashboard per vault.
5. **Notify user** only if scope changed:
   ```
   ℹ️ {N}개 개념이 복습 대기(stale)로 전환되었습니다.
      - {area}: {count}개
   ```
   Dashboard recompute deferred to Phase 6 (full-scan accuracy).

### Phase 3: Build Questions

1. Read markdown files in target section(s).
2. Pick drill targets per session type:
   - **Drill weak**: 🔴 unresolved → rephrase in new contexts.
   - **Drill stale**: 🟡 stale across all areas → rephrase to test same knowledge from a different angle (no verbatim repeats).
   - **Diagnostic**: undersampled areas; untested seed concepts have priority.
   - **Choose a section / Hard-mode**: sample broadly from chosen area.
3. Craft exactly 4 questions following [quiz-rules.md](references/quiz-rules.md).

**CRITICAL**: Read `references/quiz-rules.md` before crafting ANY question. Zero hints allowed.

### Phase 4: Present Quiz

Use AskUserQuestion: 4 questions, 4 options each, single-select. Header `Q1. Topic` (max 12 chars). Descriptions: neutral, no hints.

### Phase 5: Grade & Explain

1. Show results table (question / correct / user / result).
2. Wrong answers: concise explanation.
3. Map each question to its area.

### Phase 6: Update Files

#### 1. Update concept file (`concepts/{area}.md`)

Apply transitions from [§4 Status Transitions](references/progress-rules.md). Key rules:

- Always: `Last Tested = today`, `Attempts += 1`.
- `Correct += 1` only if correct.
- `Streak += 1` if correct, `Streak = 0` if wrong.
- New status per §4 transition table. Summary:
  - New / 🔴 → correct → 🟡 (Streak = 1)
  - 🟡 → correct → 🟢 if Streak+1 ≥ 2, else 🟡
  - 🟢 → correct → 🟢 (Streak++)
  - Any → wrong → 🔴 (Streak = 0, error note updated)
- Error notes are **never deleted** — preserved even after return to 🟢.

**Seed-authoritative labeling (MANDATORY)**: Every tracker row label MUST exactly match a `## Concepts (N total)` seed entry. For each graded answer:

1. Identify which concept the question tested.
2. Match to seed by exact string equality (case-insensitive whitespace-normalized fallback OK; tracker MUST use seed's canonical spelling).
3. If no seed match: find the **closest semantically related seed entry** and attribute the attempt there. If nothing reasonably matches, append the candidate to `### Pending Concepts` (one bullet + one-line rationale) and **skip the tracker update for this answer**. Never invent new tracker rows.
4. Never modify the seed block in Phase 6 — seed changes are owned by `setup` / `sync`. `Pending Concepts` is the handoff: next `/sync` promotes reviewed candidates.

This prevents label drift (same concept under multiple slightly-different labels), which inflates `|tracker rows|`, deflates Mastery (via `max()` denominator), and lets one mistake split into multiple 🔴 rows blocking 🟩/🟦.

**Invariant**: After Phase 6, `|tracker rows| ≤ |seed entries|` always holds. On pre-existing violation (legacy drift), emit a one-time warning suggesting `/sync` — do not auto-merge.

Tracker row + Error note formats: see [templates.md](references/templates.md).

#### 2. Update dashboard

**Read all `concepts/*.md` here** (first full read of session). Apply pending schema backfill to files not loaded earlier.

Recompute all columns per [§2 Dashboard Schema](references/progress-rules.md) and [§3 Level Thresholds](references/progress-rules.md):

- `Concepts`: from seed block (or fallback)
- `Covered` = `|tracker rows| / Concepts`
- `Accuracy` = `|🟢| / |tracker rows|`
- `Mastery` = `|🟢| / Concepts`
- `Level` from §3 — **all three gates must be checked**: Coverage gate, Mastery tier, AND **Unresolved gate (`unresolved == 0`)**. Any 🔴 row in the tracker forces Level to 🟨 or lower regardless of cov/mas. See §3 edge cases.

**Total row Level**: Compute from aggregated cov/mas across all areas, AND apply this rule: if **any** non-⬜ area is 🟥 OR **any** tracker has unresolved ≥ 1, Total cannot exceed 🟨. Total may be 🟦 only when every non-⬜ area is 🟦.

Stats: Total Concepts, Covered, Mastered (🟢), Stale (🟡), Unresolved (🔴), Weakest/Strongest Area (by Mastery, ⬜ excluded).

Dashboard stays compact — no session logs, no per-question details.

**Ordering invariant**: Phase 6 step 2 (dashboard recompute + write) MUST complete before emitting any final user-facing summary that references Level / Mastery / area progress. Never report "this area is now 🟦/🟩" based on partial recompute or pre-existing dashboard state — read-then-recompute first, then talk.

## Templates

Dashboard / Concept file / Tracker row / Error note formats: see [references/templates.md](references/templates.md). Read only when creating a file from scratch.

## Important Reminders

- ALWAYS read [progress-rules.md](references/progress-rules.md) before Phase 2.5 / Phase 6 (spec of record).
- ALWAYS read [quiz-rules.md](references/quiz-rules.md) before creating questions. Zero hints.
- Error notes are NEVER deleted — permanent learning history.
- All cross-file links use relative-path markdown, never wiki-links.
- **"Mastered/마스터" 어휘 사용 규칙**: 사용자에게 보여주는 자유 텍스트(축하 멘트, 요약 문장 등)에서 "Mastered", "마스터", "정복" 같은 표현은 **해당 영역의 Level이 §3 기준 🟦 Mastered일 때만** 사용한다. 그 외에는 "정답률 향상", "이번 세션에서 N개 개선", "🟡로 승급", "🔴 N개 남음" 처럼 사실 기반 표현을 쓴다. 한 문제만 맞아도 Status가 🟢이 되었다는 이유로 area를 "마스터"라고 부르지 않는다.
