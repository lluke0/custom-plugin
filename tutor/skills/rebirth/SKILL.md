---
name: rebirth
description: >
  Rebirth (환생) an already-mastered area to re-conquer it at higher difficulty. Resets the area's
  challenge track (tracker emptied, re-quizzed from scratch) while preserving a permanent honor badge
  (⭐×N), and scales question difficulty up every rebirth. Args: `<area>` (환생할 영역) or `help`.
  Without args: shows eligible 🟦 Mastered areas. Triggers: "환생", "rebirth", "prestige", "/rebirth",
  "다시 도전", "마스터한 거 더 어렵게", "환생해줘".
argument-hint: "[area|help]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Tutor Rebirth Skill

Take an area you've already pushed to **🟦 Mastered** and **re-conquer it from scratch at higher difficulty**, earning a permanent honor badge (⭐×N) each time. Built on the same plain-markdown StudyVault as `quiz` — no Obsidian or proprietary tools required.

> **Spec of record**: the prestige / dual-track model is defined in [progress-rules.md §8](../_shared/progress-rules.md). Coverage / Mastery / Status math is §2–§4. **Read it before Phase 3 / Phase 6.**

## What rebirth does (dual-track)

- **Honor track (permanent)** — `prestige_tier`, shown as `⭐×N` beside the level badge. Never resets; each rebirth adds one star.
- **Challenge track (reset)** — the area's per-concept tracker table is **emptied**, so the area drops to ⬜ and must be re-mastered. Questions get harder every tier.

**Only 🟦 Mastered areas are eligible.** `### Error Notes`, the `## Prestige` history, and the `## Concepts (N total)` seed block are **always preserved** — rebirth never deletes learning history.

## File Structure

```
StudyVault/
├── dashboard.md             ← Proficiency table; Level cell carries the ⭐×N suffix
└── concepts/
    └── {area-name}.md       ← seed block + tracker + error notes + (after first rebirth) ## Prestige
```

## Workflow

### Phase 0: Detect Language

Detect the user's language from their message → `{LANG}`. All output and file content in `{LANG}`. Badge emojis (🟦/⭐) are universal.

### Phase 0.5: Parse Arguments

| Arg | Action |
|-----|--------|
| `<area>` / `섹션 <area>` | Set `target_area` (validated against Phase 2's eligible list) |
| `help` / `?` | Print this argument table + a one-line "rebirth = re-conquer a 🟦 area harder" note, then stop |
| none | Choose interactively in Phase 2 |

### Phase 1: Discover Vault (lightweight)

1. Glob `**/StudyVault/`. If none, inform the user and stop.
2. Resolve the dashboard path with the **canonical-first lookup** (identical to `quiz` Phase 1): try `**/StudyVault/dashboard.md`; else fall back to `*dashboard*` / `*대시보드*` and migrate the single best match to `dashboard.md`. If no dashboard exists at all → there are no mastered areas yet; tell the user to `/quiz` first and stop.
3. List section directories under `concepts/` (names only). Do **not** read concept files yet.

### Phase 2: Select an Eligible Area

1. Read `dashboard.md`. Parse the **Proficiency by Area** table. For each area, **strip any `⭐×N` suffix** from the Level cell, then keep only areas whose level is **🟦 Mastered** → `eligible`.
2. If `eligible` is empty: tell the user `환생 가능한 영역이 없습니다. 환생은 🟦 Mastered 영역에서만 가능합니다 — 먼저 /quiz 로 한 영역을 마스터하세요.` and stop.
3. If `target_area` was given in args:
   - It is in `eligible` → skip to Phase 2.5.
   - It exists but is not 🟦 → say so (show its current level) and present the eligible list.
   - It doesn't exist → present the eligible list.
4. Otherwise present **AskUserQuestion** (header `Area`), one option per eligible area. Label = area name; description = `현재 ⭐×{tier} · 다음 환생 시 {tier+1}회차 난이도` (read `prestige_tier` from each concept file's `<!-- prestige_tier: N -->`, default 0). This is area selection, not a quiz — the zero-hint policy does not apply here.

### Phase 2.5: Load & Confirm (destructive reset gate)

1. Read `concepts/{target_area}.md`. Read `prestige_tier = T` (absent ⇒ 0). Count tracker rows `M`.
2. **Re-verify eligibility** from the concept file itself (recompute level per §3, ignoring the ⭐ suffix). If it is **not** 🟦 (dashboard/concept drift), do not rebirth — report the mismatch and suggest `/quiz` to reconcile, then stop.
3. Read [rebirth-rules.md](references/rebirth-rules.md) to summarize the `T+1` difficulty in one line.
4. **AskUserQuestion confirmation** (this empties the tracker — always confirm):

   > `{area}`를 환생합니다:
   > - **진행도 초기화** — 개념 기록 {M}개가 비워지고 다시 ⬜부터 재정복합니다
   > - **명예 보존** — ⭐×{T} → ⭐×{T+1}, Error Notes·정복 이력은 그대로 유지
   > - **난이도** — {T+1}회차: {one-line difficulty summary}
   >
   > 진행하시겠습니까?

   Options: `환생한다` / `취소`. On `취소` (or anything non-affirmative), stop without changing files.

### Phase 3: Execute Rebirth (progress-rules §8.2)

Perform exactly the §8.2 steps on `concepts/{target_area}.md`:

1. **Archive the run** — append `- ⭐ Tier {T+1} 정복: {today}` to the `## Prestige (환생)` section. Create the section and the `<!-- prestige_tier: {T+1} -->` comment (just under the H1) if this is the first rebirth; otherwise update the comment to `T+1` and refresh the `▶ 현재: {T+1}회차 도전 중 (started {today})` line.
2. **Empty the tracker** — delete all tracker rows, leaving the header row only. **Keep** the `## Concepts (N total)` seed block and **keep** the entire `### Error Notes` section verbatim.
3. **Save** the concept file.
4. **Recompute the dashboard** — the area now has 0 tracker rows → `Covered 0/N`, `Mastery 0/N`, Level `⬜ Undersampled ⭐×{T+1}`. Recompute the Total row per §2 (worst-area cap may lower it). Save `dashboard.md`.
5. Briefly confirm to the user: `🔄 {area} 환생 완료 — ⭐×{T+1}, {T+1}회차 시작. 다시 🟦까지 정복해보세요.`

### Phase 4: Build Tier-Scaled Questions

**CRITICAL — read both before crafting any question:** [rebirth-rules.md](references/rebirth-rules.md) (tier difficulty curve) and [quiz-rules.md](../quiz/references/quiz-rules.md) (zero-hint, distractors, format).

1. Read the area's source notes (`NN-{area}/*.md`) — every question's answer must be grounded in the vault, even at high tiers.
2. Apply the **tier `T+1`** difficulty profile from rebirth-rules (hard ratio, emphasized question types, concept-combination scope).
3. Craft **exactly 4** questions. Zero hints. Randomize correct-answer position.

### Phase 5: Grade & Explain

1. Show a results table (question / correct / user / result).
2. For wrong answers: concise explanation mapped to the concept.
3. Map each question to its concept label for Phase 6.

### Phase 6: Update Files

Apply [§4 Status Transitions](../_shared/progress-rules.md) exactly as `quiz` does — rebirth re-grows the tracker normally from empty.

> **Session Wrong-Answer Gate (MANDATORY)**: maintain `session_wrong_set` for this invocation. A concept graded wrong is capped at 🟡 for the rest of the session even if Streak ≥ 2. Spec: [§4](../_shared/progress-rules.md).

- Always: `Last Tested = today`, `Attempts += 1`; `Correct += 1` and `Streak += 1` only on correct, `Streak = 0` on wrong.
- **Seed-authoritative labeling**: every tracker row label must exactly match a `## Concepts (N total)` seed entry. Never invent rows; append unmatched candidates to `### Pending Concepts`.
- **Error notes are never deleted.** Preserve the `## Prestige` section and `prestige_tier` on every write.
- **Recompute the dashboard** (read all `concepts/*.md`), recomputing Coverage/Accuracy/Mastery/Level per §2/§3 and **re-appending the `⭐×N` suffix** to this area's Level cell (§8.3).
- **Ordering invariant**: finish the dashboard recompute+write before any user-facing summary that mentions Level/Mastery.
- **"Mastered/마스터/정복" wording**: use only when the area's recomputed Level is actually 🟦 (§3). Mid-climb, say `🟨로 올라옴`, `N개 개선`, `🔴 N개 남음` instead.

Then offer another round with **AskUserQuestion** (`한 라운드 더` / `종료`). On `한 라운드 더` → return to Phase 4 at the **same tier** (difficulty rises only on the *next* rebirth, not between rounds within a tier). On `종료` → final summary: current level, ⭐×{T+1}, how many concepts re-confirmed, what remains for re-mastery.

## Important Reminders

- Rebirth is for **🟦 Mastered areas only**. Anything else → point the user to `/quiz`.
- The reset empties the tracker but **NEVER** deletes Error Notes, the Prestige history, or the seed block.
- The `⭐×N` suffix is always preserved on the dashboard Level cell — strip it to parse a level, re-append after.
- Difficulty is **fixed within a tier** (all rounds of this rebirth share tier `T+1`); it only steps up at the next rebirth.
- ALWAYS read [progress-rules.md](../_shared/progress-rules.md) before Phase 3 / Phase 6, and [rebirth-rules.md](references/rebirth-rules.md) + [quiz-rules.md](../quiz/references/quiz-rules.md) before Phase 4.
- All cross-file links use relative-path markdown, never wiki-links.
