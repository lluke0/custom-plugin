# Progress Rules — Coverage, Mastery, Streak, Stale

This is the **spec of record** for how learning progress is computed and stored. `quiz`, `setup`, and `sync` all reference this file. When the rules change, update this file first.

---

## 1. Concept File Schema

`StudyVault/concepts/{area}.md`:

```markdown
# {Area Name} — Concept Tracker

## Concepts (N total)

- concept name 1
- concept name 2
- ...

| Concept | Attempts | Correct | Streak | Last Tested | Status |
|---------|----------|---------|--------|-------------|--------|
| concept name | 2 | 2 | 2 | 2026-04-15 | 🟢 |

### Error Notes

**concept name**
- Confusion: …
- Key point: …
```

### Field meanings

| Field | Type | Meaning |
|-------|------|---------|
| Concept | string | Unique concept label within the area |
| Attempts | int ≥ 0 | Total times this concept was tested |
| Correct | int ≥ 0 | Total times answered correctly (lifetime) |
| **Streak** | int ≥ 0 | **Consecutive** correct answers since last miss. Resets to 0 on wrong answer |
| Last Tested | `YYYY-MM-DD` | Date of the most recent attempt |
| Status | enum | 📘 / 🔴 / 🟡 / 🟢 (see §4) |

**Concepts seed block** (`## Concepts (N total)`):
- Lists **all** concepts the area is expected to cover. Tested OR not.
- `setup` (Phase D6) creates this.
- `sync` keeps it in sync when area structure changes.
- `quiz` treats it as the **authoritative label dictionary** — both for Coverage's denominator AND for tracker row labels.

**Seed-authoritative invariant (Option A)**:

Every tracker row label MUST exactly match a seed entry. `quiz` Phase 6 must attribute each graded answer to an existing seed label (or append the candidate to `### Pending Concepts` and skip the row); it must never invent a new tracker label. Only `setup` / `sync` may mutate the seed block.

This yields `|tracker rows| ≤ |seed entries| = N` as a hard invariant, which in turn:
- Bounds Coverage at 100% (no more "15/10 covered" drift artifacts).
- Simplifies Mastery — with the invariant, `max(N, |tracker|) = N`, so the `max()` becomes a legacy-drift guard rather than a primary safeguard.
- Prevents one real mistake from splitting into multiple 🔴 rows (each of which would independently trigger the §3 unresolved gate and permanently block 🟩/🟦).

**Pending Concepts section**: `### Pending Concepts` is an append-only handoff queue inside `concepts/{area}.md`. `quiz` appends candidates here; `sync` reviews and promotes them into the seed block on the next run (or discards as noise). Format:

```markdown
### Pending Concepts

- candidate label — why it didn't match any seed entry (one line)
```

### Fallback for total concept count

If the `## Concepts (N total)` seed block is missing (older vault not yet migrated), fall back to: `area 폴더 NN-<area>/*.md 파일 수 중 Practice/practice/문제풀이/빈출 문제 제외`. Emit a one-time warning suggesting the user run `/sync` or let quiz auto-backfill.

> **Deprecated (legacy vault only)**: the Practice/practice/문제풀이 exclusion exists for vaults built before `setup` removed practice files. New vaults will not contain such files; the exclusion is a no-op for them but kept for backward compatibility.

---

## 2. Dashboard Schema

`StudyVault/dashboard.md` (canonical path — single file per vault; H1 and table content stay in source language):

```markdown
# Learning Dashboard

## Proficiency by Area

| Area | Concepts | Covered | Accuracy | Mastery | Level | Details |
|------|----------|---------|----------|---------|-------|---------|
| 확장성 기초 | 10 | 10/10 (100%) | 10/10 (100%) | 10/10 (100%) | 🟦 Mastered | [details](concepts/확장성 기초.md) |
| DNS         | 4  | 1/4 (25%)    | 0/1 (0%)     | 0/4 (0%)     | ⬜ Undersampled | [details](concepts/DNS.md) |
| **Total**   | **N** | **x/N**     | **a/b**      | **c/N**      | (overall level — see below) | |

> ⬜ Undersampled · 🟥 Weak · 🟨 Fair · 🟩 Good · 🟦 Mastered

---

## Stats

- **Total Concepts**: N (across all areas)
- **Covered**: x / N (%)
- **Learned (📘)**: l   ← lesson-explained, not yet quiz-tested
- **Mastered (🟢)**: c / N (%)
- **Stale (🟡)**: k
- **Unresolved (🔴)**: u
- **Weakest Area**: areas with `unresolved ≥ 1` come first (tie-break by unresolved count desc, then Mastery asc); if none have unresolved, pick lowest Mastery among non-Undersampled
- **Strongest Area**: <area with highest Mastery>
```

### Column meanings

| Column | Formula |
|--------|---------|
| Concepts | Total count from `## Concepts (N total)` seed (or fallback) |
| Covered | `len(rows in tracker table) / Concepts` — how many have been encountered (lesson or quiz). Includes 📘 rows |
| Accuracy | `count(Status=🟢) / count(Status ∈ {🔴,🟡,🟢})` — among **quiz-tested** rows only. 📘 rows are excluded from both numerator and denominator (not yet tested) |
| Mastery | `count(Status=🟢) / max(Concepts, len(rows in tracker))` — primary skill indicator. 📘 rows count toward the tracker-length guard but never toward the numerator. Under the Option A seed-authoritative invariant (§1), `len(tracker) ≤ Concepts` so the `max()` collapses to `Concepts` |
| Level | Derived from Coverage + Mastery + unresolved count per §3 |

Use "x/N (p%)" format for human readability. Display "-" for undefined ratios (e.g. `0/0`).

### Total row Level (overall)

Compute aggregated `cov_total = covered_total / N`, `mas_total = mastered_total / N`, `unresolved_total = sum of 🔴 across all areas`, then apply §3 thresholds with these additional caps:

1. **Worst-area cap**: Total Level cannot be **higher** than the lowest area Level among non-⬜ areas. (e.g. if any area is 🟥, Total ≤ 🟥; if any area is 🟨, Total ≤ 🟨.)
2. **Unresolved cap**: If `unresolved_total ≥ 1`, Total is at most 🟨 (same unresolved gate as §3).
3. **All-undersampled**: If every area is ⬜, Total = ⬜.

This ensures Total is a faithful reflection of the weakest signal in the vault, never a mean that smooths over weak areas.

---

## 3. Level Badge Thresholds

Let `cov = Covered%`, `mas = Mastery%`, `unresolved = count(Status=🔴 in tracker)`.

```
⬜ Undersampled  — cov < 50%                                                (judgment deferred)
🟥 Weak          — cov ≥ 50%  AND mas < 40%
🟨 Fair          — cov ≥ 50%  AND 40% ≤ mas < 70%
🟩 Good          — cov ≥ 70%  AND 70% ≤ mas < 90%  AND unresolved == 0
🟦 Mastered      — cov ≥ 90%  AND mas ≥ 90%         AND unresolved == 0
```

**Unresolved gate rationale**: even with high coverage and mastery, a single 🔴 row means there is a known, unaddressed error. Promoting such an area to 🟩/🟦 hides the signal from the Weakest Area picker and the dashboard. Areas with any 🔴 must stay at 🟨 or lower regardless of mas/cov, so learners see the red flag.

Edge cases:
- `Concepts = 0` → Level = ⬜ (no data to judge)
- If thresholds put a row at 🟩/🟦 but `unresolved ≥ 1`, demote to 🟨.
- If `cov ≥ 50%` but the row does not satisfy any of 🟥/🟨/🟩/🟦, use the highest tier it satisfies. For example `cov=60%, mas=72%` → not 🟩 (coverage too low) → fall back to 🟨.

---

## 4. Status Transitions (Phase 6 logic)

Status values:

| Emoji | Name | Meaning |
|-------|------|---------|
| 📘 | learned | Explained via `lesson` skill, **not yet quiz-tested**. Attempts/Correct/Streak all 0 |
| 🔴 | unresolved | Currently missed; has error note |
| 🟡 | tentative OR stale | Either one correct answer not yet confirmed (Streak = 1), or was 🟢 but >14 days without testing |
| 🟢 | confirmed | Mastered: Streak ≥ 2 AND age ≤ 14 days |

Transition table (on each graded answer):

| Current | Answer | Next Status | Attempts | Correct | Streak | Error Note |
|---------|--------|-------------|----------|---------|--------|------------|
| (new) | correct | 🟡 | 1 | 1 | 1 | — |
| (new) | wrong | 🔴 | 1 | 0 | 0 | add |
| 📘 | correct | 🟡 | 1 | 1 | 1 | — |
| 📘 | wrong | 🔴 | 1 | 0 | 0 | add |
| 🔴 | correct | 🟡 | +1 | +1 | 1 | keep (learning history) |
| 🔴 | wrong | 🔴 | +1 | — | 0 | update |
| 🟡 | correct, **not gated** (concept NOT IN `session_wrong_set`) | 🟢 if Streak+1 ≥ 2, else 🟡 | +1 | +1 | +1 | keep |
| 🟡 | correct, **gated** (concept IN `session_wrong_set`) | 🟡 (capped — Streak still increments but Status stays 🟡) | +1 | +1 | +1 | keep |
| 🟡 | wrong | 🔴 | +1 | — | 0 | update |
| 🟢 | correct | 🟢 | +1 | +1 | +1 | keep |
| 🟢 | wrong | 🔴 | +1 | — | 0 | update |

Always update `Last Tested` to today on any graded answer.

> ⚠️ **MUST**: Before applying any `🟡 → correct` row, check whether the concept is in `session_wrong_set` (see "Session Wrong-Answer Gate" below). Skipping this check causes within-session re-promotion of just-missed concepts and is the most common Mastery inflation bug.

**세션 내 오답 게이트 (Session Wrong-Answer Gate)**

같은 quiz 호출(세션) 중 한 번이라도 틀린 개념은 해당 세션 내에서 🟢 승급이 차단된다.

- **세션 추적**: quiz는 현재 세션에서 오답이 기록된 개념의 집합(`session_wrong_set`)을 인메모리로 관리한다. 세션 시작 시 빈 집합으로 초기화.
- **오답 기록 시점**: 어떤 개념에 wrong 처리가 발생하는 순간 그 개념을 `session_wrong_set`에 추가.
- **승급 상한**: `session_wrong_set`에 포함된 개념은 이후 연속 정답으로 Streak ≥ 2를 달성해도 해당 세션에서 Status는 최대 🟡. (Streak 값 자체는 정상적으로 증가시킨다.)
- **다음 세션에서 해제**: 다음 quiz 호출 시 `session_wrong_set`은 리셋된다. Streak ≥ 2 조건을 충족한 상태라면 첫 번째 정답에서 곧바로 🟢로 승급된다.

전이 테이블의 "not gated" 조건 정의:

```
not gated = (concept NOT IN session_wrong_set)
```

즉, `🟡 + correct + Streak+1 ≥ 2` 조건이 모두 충족되어도, 해당 개념이 `session_wrong_set`에 있으면 Status는 🟡로 유지된다.

**Error notes are never deleted** — they stay as learning history even after a concept returns to 🟢.

---

## 5. Stale Detection — Age-based Transition

**Trigger**: Phase 1.5 (Stale Sweep) in `quiz` SKILL.md, run once per quiz invocation, between Phase 1 (Discover) and Phase 2 (Ask Session Type).

**Algorithm**:

```
today = current date (YYYY-MM-DD)
STALE_DAYS = 14

for each concepts/{area}.md:
    for each row in tracker table:
        if Status == 🟢 and (today - parse(Last Tested)).days > STALE_DAYS:
            Status ← 🟡
            # Streak is NOT reset — preserved as learning history
    if any row changed: write concepts/{area}.md

recompute dashboard Proficiency table per §2, §3
write dashboard

if any row changed:
    emit notice to user: "ℹ️ N개 개념이 복습 대기(stale)로 전환되었습니다: …"
```

**Stale exit**: When a 🟡-stale concept is answered correctly, it returns to 🟢 (Streak already ≥ 2 from before, so the second-correct gate is already satisfied). Last Tested is updated.

**Streak preservation rationale**: Streak represents "longest recent confidence streak" — resetting it on time decay discards useful history. A returning user who answered a 🟢-Streak-5 correctly once should get 🟢-Streak-6, not 🟡-Streak-1.

---

## 6. Disambiguation: `🟡 (time-stale)` vs `⚠️ stale` (content-stale)

Two different "stale" concepts exist in this system:

| Marker | Owner | Meaning |
|--------|-------|---------|
| 🟡 in Status | quiz (Phase 1.5) | Concept was 🟢 but not tested in 14+ days — time decay |
| `⚠️ stale` appended to Status cell | sync (Phase S9) | Concept no longer appears in source material — content drift |

A row can carry both: `🟡 ⚠️ stale` — it's time-stale AND the source no longer mentions it. The `⚠️ stale` flag is a visual hint only; it does not gate quiz selection. Removing a `⚠️ stale` marker requires source material to be re-added or user override.

**📘 ownership**: The `📘 Learned` status is set exclusively by the `lesson` skill (when the user signals understanding for a section). `quiz` only **reads** `📘` (treating it like `(new)` in §4 transitions, replacing the row in place) and never **writes** `📘`. `lesson` may upgrade missing rows to `📘` but must not overwrite existing `🔴/🟡/🟢` rows.

---

## 7. Session Option Construction (Phase 2)

After the sweep, count:
- `undersampled_areas`: areas with Level = ⬜
- `weak_areas`: areas with Level ∈ {🟥, 🟨}
- `stale_concepts`: total 🟡 rows across all concept files where `today - LastTested > STALE_DAYS`
- `all_strong`: all areas with Level ∈ {🟩, 🟦}

Present AskUserQuestion with options built per:

| Condition | Option label | Description |
|-----------|--------------|-------------|
| `undersampled_areas ≥ 1` | "Diagnostic" | Cover {area names joined with '/'}. Diagnostic priority: untested seed concepts AND `Status=📘` rows are equal-priority targets (both are "learned but not quiz-confirmed") |
| `weak_areas ≥ 1` | "Drill weak" | Targets Weakest Area (unresolved-first priority per §2) |
| `stale_concepts ≥ 3` | "Drill stale" | Review {N} concepts due for refresh |
| `all_strong AND not above` | "Hard-mode review" | Challenge mastered material |
| always | "Choose a section" | Pick any area manually |

---

## 8. Backfill Rules (for existing vaults without new schema)

Applied by `quiz` Phase 1.5 as a one-time migration when it detects missing columns/blocks:

| Missing | Backfill |
|---------|----------|
| `Streak` column | Insert between `Correct` and `Last Tested`. For each row: `Streak = Correct if Status == 🟢 else 0` (conservative — assumes past 🟢 was built correctly, past 🔴 resets) |
| `## Concepts (N total)` seed | Scan area's `NN-<area>/*.md` (excluding Practice/문제풀이). List unique basenames (without numbering prefix) as concept seeds. Mark as `<!-- backfilled from file list; review for accuracy -->` |
| Dashboard old columns (정답/오답/정답률/수준) | Recompute all 5 new columns (Concepts/Covered/Accuracy/Mastery/Level) from concept files |

Emit one-time notice: "ℹ️ 스키마가 업데이트되었습니다. {N} concepts backfilled across {M} files. 정확도 확인을 위해 `concepts/*.md`의 seed block을 검토해주세요."

---

## 9. Date Arithmetic Note

- All dates stored as `YYYY-MM-DD` (ISO 8601 date only, no time component).
- Today's date is provided by the conversation's injected `currentDate` context.
- Age = days between two dates, calendar-based (not 24h), computed inclusively of the end date. `(today=2026-04-18) - (LastTested=2026-04-04) = 14 days` → not yet stale. `2026-04-03` → 15 days → stale.
- Parse failures (malformed date) → treat as "very old" → stale. Emit warning in sweep report.
