# Sync Self-Review Checklist (Phase S10)

Verify every item after sync phases complete. Fix and re-verify until all pass.

## 1. Error Notes Integrity (최우선)

- [ ] Every `concepts/*.md` (or archive counterpart) retains ALL pre-sync error note entries.
- [ ] **Renamed** areas: `concepts/<new>.md` contains every error note from `concepts/<old>.md`.
- [ ] **Merged** areas: combined file contains both source areas' error notes, each prefixed with `**source area**` for traceability.
- [ ] **Archived** areas: `archive/concepts/<area>.md` exists with full original tracker + error notes.
- [ ] Diff check: `grep -c '^\*\*[^*]' concepts/*.md archive/concepts/*.md` post-sync ≥ pre-sync per area.

## 2. Approval Log

- [ ] Every destructive op (rename / merge / archive / stale-marking) preceded by AskUserQuestion approval.
- [ ] No `concepts/{area}.md` renamed/deleted without approval.
- [ ] No `*dashboard*` row removed/marked archived without approval.

## 3. Manifest Integrity

- [ ] `StudyVault/.manifest.json` is valid JSON; `version: 1`; `last_build` updated.
- [ ] Every `manifest.sources` entry exists on disk OR is in `archived_sources`.
- [ ] Every `notes` path exists under `StudyVault/` (not in `archive/`).
- [ ] Atomic write completed (no `.manifest.json.tmp` left).

## 4. Interlinking Integrity

- [ ] New notes have `## Related Notes` with valid relative-path links.
- [ ] `00-Dashboard/{moc,quick-reference,exam-traps}.md`: contain entries for new notes; no links to archived notes.
- [ ] No broken relative-path links anywhere modified.

## 5. Frontmatter Consistency

- [ ] Every new note: YAML frontmatter with `source_pdf`, `part`, `keywords`.
- [ ] `source_pdf` reflects actual mapping (not filename guess).
- [ ] `keywords`: English kebab-case from Keyword Index registry.
- [ ] `manual_edits: true` notes were skipped; user notified with full list.

## 6. Portability

- [ ] `rg '\[\[' StudyVault/` → 0 matches (no wiki-links).
- [ ] `rg '> \[!' StudyVault/` → 0 matches (no Obsidian callouts).
- [ ] No inline `#kebab-tag` lines in modified notes.

## 7. Archive Policy

- [ ] Deleted source content notes moved to `StudyVault/archive/<NN-topic>/` (preserve relative structure).
- [ ] Removed areas' `concepts/<area>.md` moved to `StudyVault/archive/concepts/`.
- [ ] `*dashboard*` rows for archived areas: `(archived)` suffix + archive-path link.
- [ ] No content permanently deleted — only moved.

## 8. Dashboard Synchronization

- [ ] Schema is `Area | Concepts | Covered | Accuracy | Mastery | Level | Details` (per [progress-rules §2](../../_shared/progress-rules.md)).
- [ ] Rows match current set of active (non-archived) `NN-*/` folders.
- [ ] New areas: `⬜ Undersampled`, `0/N / - / 0/N`.
- [ ] Renamed areas: updated name/link, attempts/correct/Streak/seed preserved.
- [ ] Content-stale rows: `⚠️ stale` flag without losing data (separate from §6 🟡 time-stale).
- [ ] Stats block recomputed correctly (Total / Covered / Mastered / Stale / Unresolved / Weakest / Strongest).

## 9. Content Quality (inherited)

Apply [../../setup/references/quality-checklist.md](../../setup/references/quality-checklist.md) to **new and regenerated** notes only:
- [ ] Concept notes: verbatim `> 원문 (p.N): ...` quotes only, no LLM-composed prose, role-labeled `## Related Notes`.
- [ ] Visual capture: `_assets/<source-stem>/` page renders exist; figures/tables/equations on covered pages are embedded.
- [ ] Source-bounded scope observed (no invented topics, no expansion beyond what the source covers).

## 10. Reporting

- [ ] Final summary: New/Modified/Deleted counts, generated/skipped, area changes (with approval state), Error notes preservation confirmation. In `{LANG}`.
