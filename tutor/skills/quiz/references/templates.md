# Tutor File Templates

Read this file ONLY when:
- Phase 2.5 needs to create a new dashboard (no `*dashboard*` exists)
- Phase 6 needs to create a new `concepts/{area}.md` on the fly (no seed)

Filename localized to `{LANG}` (e.g. `학습 대시보드.md` for Korean). Column schema follows [progress-rules.md §2](../../_shared/progress-rules.md).

---

## Dashboard Template

```markdown
# Learning Dashboard

> Concept-based metacognition tracking. See linked files for details.

---

## Proficiency by Area

| Area | Concepts | Covered | Accuracy | Mastery | Level | Details |
|------|----------|---------|----------|---------|-------|---------|
(one row per section; Details column = relative link e.g. [details](concepts/area-name.md))
| **Total** | **0** | **0/0** | **-** | **0/0** | ⬜ Undersampled | |

> ⬜ Undersampled (cov<50%) · 🟥 Weak (mas<40%) · 🟨 Fair (40-69%) · 🟩 Good (70-89%) · 🟦 Mastered (90-100%)

---

## Stats

- **Total Concepts**: 0
- **Covered**: 0 / 0 (-)
- **Learned (📘)**: 0
- **Mastered (🟢)**: 0 / 0 (-)
- **Unresolved (🔴)**: 0
- **Weakest Area**: -
- **Strongest Area**: -
```

---

## Concept File Template

Normally created by `setup` with a populated seed block. If `quiz` creates this on the fly (no seed), leave the seed block with the TODO marker — Coverage falls back to file-count heuristic until filled.

```markdown
# {Area Name} — Concept Tracker

## Concepts (0 total)

<!-- TODO: seed concept list — run /sync to populate -->

| Concept | Attempts | Correct | Streak | Last Tested | Status |
|---------|----------|---------|--------|-------------|--------|

### Error Notes

(added as concepts are missed)
```

---

## Tracker Row Format (used by Phase 6)

```markdown
| concept name | 2 | 1 | 0 | 2026-02-24 | 🔴 |
```

## Error Notes Format (used by Phase 6 on wrong answer)

```markdown
### Error Notes

**concept name**
- Confusion: what the user mixed up
- Key point: the correct understanding
```
