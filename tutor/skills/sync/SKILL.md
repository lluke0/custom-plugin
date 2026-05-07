---
name: sync
description: >
  Auto-detects changes in CWD source materials (PDF/MD/TXT/HTML/EPUB/URL) and incrementally updates the
  StudyVault — only affected notes regenerated. Learning progress is synced safely: Error notes are NEVER
  deleted, destructive changes (rename/merge/archive) require approval. Triggers: "자료 업데이트", "동기화",
  "변경분 반영", "/sync", "study materials changed", "resync vault", "재생성", "sync vault".
argument-hint: ""
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch
---

# Tutor Sync — Incremental StudyVault Update

Detects changes in source materials since last build and incrementally updates the StudyVault from `setup`. Preserves learning-progress data owned by `quiz`.

> **CWD Boundary**: see [../_shared/cwd-boundary.md](../_shared/cwd-boundary.md).
> **Portability Rules**: see [../_shared/portability-rules.md](../_shared/portability-rules.md). All regenerated notes MUST follow these.

## Safety Rules (MANDATORY)

```
NEVER DELETE:
  - Error notes (오답 메모) — 학습 이력 전체 보존
  - concepts/**, dashboard.md, archive/** — 파일 삭제 금지 (archive 이동만)

ALWAYS REQUIRE APPROVAL (AskUserQuestion):
  - concepts/{area}.md rename / merge / archive
  - dashboard.md area 행 rename / archive 표시
  - 콘텐츠 노트 archive 이동

AUTOMATIC (non-destructive):
  - 새 area → dashboard.md Proficiency 표에 ⬜ 행 추가 + concepts/{area}.md 생성 (seed populate, tracker 비움)
  - content-stale concept 행에 ⚠️ 플래그 추가 (삭제 아님, progress-rules §6의 🟡 time-stale과 별개)
  - Coverage / Accuracy / Mastery / Level 재계산 (progress-rules §2, §3)

ALWAYS SKIP:
  - manual_edits: true frontmatter가 있는 콘텐츠 노트
```

## Workflow

### Phase S0: Preconditions

1. Detect language → `{LANG}`. All user-facing output in `{LANG}`.
2. Glob `**/StudyVault/`. If not found → "StudyVault가 없습니다. 먼저 `/setup`을 실행하세요." and stop.
3. **Dashboard canonicalization**: Glob `**/StudyVault/*dashboard*` and `**/StudyVault/*대시보드*` (vault root only). If any match exists at a non-canonical path, rename it to `StudyVault/dashboard.md`. If multiple found, keep the most recent and move the rest to `StudyVault/archive/duplicate-dashboards/`. Single-file invariant: there is exactly one learning dashboard per vault, at `StudyVault/dashboard.md`.

### Phase S1: Manifest Load (with backfill)

1. Read `StudyVault/.manifest.json`.
2. **If missing → Backfill Mode** (1회 한정):
   - Read every note in `StudyVault/**/*.md` (exclude `concepts/`, `dashboard.md`, `archive/`).
   - Parse YAML frontmatter — collect `source_pdf` values to build source → note[] mapping.
   - Scan CWD sources, compute hashes per Phase S2 normalization.
   - Write initial `.manifest.json` per [manifest-schema.md](references/manifest-schema.md).
   - Inform: "백필 완료. 이번 실행은 기준선 생성만 수행했으며, 변경 감지는 다음 `/sync` 실행부터 동작합니다." Stop.

### Phase S2: Source Scan & Hashing

Scan CWD `**/*.{pdf,md,txt,html,epub}`. Exclude `node_modules/`, `.git/`, `dist/`, `build/`, `StudyVault/**`, `.view/**`, and any path under user's `.manifest.json` `exclude` field.

Per-format normalization (full commands in [manifest-schema.md](references/manifest-schema.md)):

| Extension | Normalization | Hash input |
|-----------|---------------|------------|
| `.pdf` | `pdftotext "file.pdf" -` (stdout) | stdout bytes |
| `.md` | Read as-is | file bytes |
| `.txt` | Read as-is | file bytes |
| `.html` | `pandoc -f html -t plain` (fallback: strip tags) | plain text |
| `.epub` | `pandoc -f epub -t plain` | plain text |
| URL | WebFetch → body | fetched text |

> PDFs MUST be normalized via `pdftotext` — never use Read directly (wastes 10-50× tokens). Install: `brew install poppler` / `apt-get install poppler-utils`.

Compute `sha256` of each normalized output. For `.md`, additionally compute per-H2-section hashes (split on `^## `) for partial update.

### Phase S3: Diff 분류

| Category | Condition |
|----------|-----------|
| 🆕 신규 | File present in CWD, absent in manifest |
| ✏️ 변경 | Hash differs |
| 🗑️ 삭제 | In manifest, absent from CWD |
| ✅ 동일 | Hash matches — skip |

For ✏️ modified `.md` files, compute section-level diff to identify which H2 sections changed.

Also scan `StudyVault/` for structural area changes:

| Signal | Classification |
|--------|----------------|
| `NN-<name>/` exists in vault but not in last manifest's folder list | 🆕 area added |
| Folder in manifest but missing from vault | 🗑️ area removed |
| Same number, different name | ✏️ area renamed |
| Two folders collapsed (detected via `source_pdf` overlap) | ✏️ area merged |

### Phase S4: 변경 계획 출력 & 승인 (MANDATORY)

Present plan table:

```markdown
| 파일 / 영역 | 유형 | 영향 노트 | 작업 |
|-------------|------|-----------|------|
| `docs/chapter3.pdf` | ✏️ 변경 | `02-cpu/pipeline.md` | 재생성 |
| `notes/new-topic.md` | 🆕 신규 | (신규 폴더 `04-new-topic/`) | 생성 |
| `old.pdf` | 🗑️ 삭제 | `03-old/*` → archive | archive 이동 |
| area `02-old` → `02-new` | ✏️ 리네이밍 | `concepts/old.md` → `concepts/new.md` | rename (승인) |
```

**AskUserQuestion** options: `Apply all` / `Apply with exclusions` (specify items to skip) / `Cancel`.

### Phase S5: 신규 파일 처리

For each 🆕 new source:

1. Apply `setup` Phase D1 (Source Mapping) + D2 (Content Analysis) **to this source only**.
2. Determine target folder: existing `NN-<topic>/` if keyword/topic overlap ≥ 70%; else create `NN-<new-topic>/` with next available number.
3. Generate concept notes per `../setup/references/templates.md` (verbatim quotes + captured visuals; no practice file).
4. Capture page renders for the new source via `pdftoppm -r 150 -png "<source>" "StudyVault/_assets/<source-stem>/p"` and `pdfimages -list` to inventory figures.
5. New keywords: check Keyword Index. Conflicts → ask user. Otherwise register under correct hierarchy (`../setup/SKILL.md` Phase D3).
6. Apply Interlinking (`setup` Phase D7): Related Notes, MOC link, Quick Reference, Exam Traps.
7. Frontmatter MUST include `source_pdf`, `part`, `keywords` (3-5 english kebab-case).

### Phase S6: 변경 파일 처리

For each ✏️ modified source:

1. Load manifest's `notes` for this source → affected notes list.
2. For each note, read frontmatter:
   - `manual_edits: true` → **SKIP** (report).
   - Otherwise → continue.
3. **MD section-level optimization**: If `.md` and manifest has `sections` mapping, regenerate **only notes mapped to changed H2 sections**.
4. **PDF/other**: regenerate all `notes[]` for that source.
5. Use `../setup/references/templates.md`. Preserve existing `keywords`, `part` unless source content invalidates.
6. Do NOT touch `dashboard.md`, `concepts/`, `archive/` here.

### Phase S7: 삭제 파일 처리

For each 🗑️ deleted source:

1. Collect affected content notes from manifest.
2. **AskUserQuestion**: "Move to archive?" — `Archive all` / `Keep but mark stale` / `Cancel this item`.
3. On approval: create `StudyVault/archive/<NN-topic>/`, `mv` notes (preserve relative structure), remove links from `00-Dashboard/{moc,quick-reference,exam-traps}.md`.
4. If entire area emptied → triggers Phase S9 "area removed" case.

### Phase S8: 콘텐츠 Dashboard 갱신

Update content-side dashboards (NOT the learning-progress `dashboard.md` — that's S9):

- `00-Dashboard/moc.md`: Topic Map add/remove rows; Keyword Index add new entries.
- `00-Dashboard/quick-reference.md`: add sections for new notes with `→ [Concept Note](path.md)`.
- `00-Dashboard/exam-traps.md`: append new trap points; remove archived links.

Relative-path markdown only. No wiki-links.

### Phase S9: 학습 진행 데이터 동기화 (안전 모드)

Sync `dashboard.md` and `concepts/` per case table. Error notes are NEVER deleted.

| Change | Action | Approval |
|--------|--------|----------|
| 🆕 신규 area | `dashboard.md`에 새 행 추가 (`Concepts=<seed 수>`, 나머지=0, ⬜). `concepts/<new>.md` 생성, seed populate (**section-level: area 폴더 각 concept note의 `##` 섹션마다 1개 seed**, boilerplate 섹션 제외, label `<file-basename> · <section-title>`), tracker 비움. | Auto |
| 🗑️ area 삭제 | `concepts/<area>.md` → `archive/concepts/<area>.md`. Dashboard 행에 `(archived)` + Details 링크 archive 경로로. | **Ask** |
| ✏️ area rename | `concepts/<old>.md` → `concepts/<new>.md`. 내부 H1 + dashboard 행 이름/링크 갱신. **Tracker 행 (Streak 포함) · Error notes · seed block 전부 원본 보존.** | **Ask** (diff 제시) |
| ✏️ area 병합 (A+B → C) | seed 병합·중복 제거. Attempts/Correct 합산. **Streak은 합산하지 않고 min(A,B)** (보수적). Error notes는 `**source area**` 부제로 모두 보존. | **Ask** (프리뷰) |
| ✏️ source 내용만 변경 | concepts 건드리지 않음. concept가 source에서 사라지면 Status 옆 `⚠️ stale` (content-stale; §6의 🟡 time-stale과 별개 마커). | Auto (표시만) |
| ✏️ 새 concept note 추가 | 노트 내 `##` 섹션(boilerplate 제외)마다 seed 1개씩 추가, tracker는 그대로. dashboard `Concepts +<섹션 수>`, Covered/Mastery 재계산. | Auto |
| ✏️ concept note 내 `##` 섹션 추가/삭제 | 추가된 섹션 → seed 추가 (`Concepts +N`). 삭제된 섹션 → seed에서 제거; 해당 tracker 행은 유지 + Status 옆 `⚠️ stale` (`Concepts −N`). | Auto (표시만) |
| ✏️ concept note 삭제 | 해당 노트에서 파생된 모든 seed 제거. Tracker에 이미 있는 행 유지 + Status 옆 `⚠️ stale`. `Concepts −<제거된 seed 수>`. | Auto (표시만) |
| 📥 `### Pending Concepts` 후보 | `quiz` Phase 6의 append-only 후보들. 각 후보: **(a) 승격** seed 추가 / **(b) 기존 seed로 귀속** / **(c) 폐기**. 승격 시 `Concepts +1`. | **Ask** (a/b/c per 후보) |
| `manual_edits: true` 노트 | 무관 (S6에서 skip). | — |

**Ask payload** for destructive cases: header `"Sync {area}"`, show before/after diff (concept file path + dashboard row), options `Apply` / `Skip this area` / `Cancel entire sync`.

**Content-stale 감지**: 변경 후 source에서 사라진 concept 행:
```markdown
| pipeline-hazard | 3 | 2 | 2 | 2026-03-14 | 🟢 ⚠️ stale |
```
> `⚠️ stale`(content) 와 🟡(time-stale, §6) 는 공존 가능: `🟡 ⚠️ stale`.

**통계 재계산** (area 추가/이동/리네이밍 후 MANDATORY). Spec: [../quiz/references/progress-rules.md §2, §3](../quiz/references/progress-rules.md):
- `Concepts` = seed bullet count
- `Covered` = tracker rows / Concepts
- `Accuracy` = 🟢 count / tracker rows (denom 0 → `-`)
- `Mastery` = 🟢 count / Concepts
- `Level` = §3 임계값 (Coverage gate + Mastery tier)
- Stats: Total Concepts, Covered, Mastered, Stale, Unresolved, Weakest/Strongest (⬜ 제외)

**Archive 구조**:
```
StudyVault/
├── archive/
│   ├── <NN-old-topic>/         # 콘텐츠 노트
│   └── concepts/<area>.md      # 학습 진행 (Error notes 보존)
```

### Phase S10: Self-Review (MANDATORY)

Verify against [sync-checklist.md](references/sync-checklist.md). Error notes integrity is highest priority. Fix and re-verify until all pass.

### Phase S11: Manifest Save

1. New manifest with `version: 1`, `last_build: <ISO8601>`, updated `sources` (hash/mtime/notes/sections per [manifest-schema.md](references/manifest-schema.md)). Include deleted sources under `archived_sources` (optional).
2. Atomic write: `.manifest.json.tmp` → `mv` to `.manifest.json`.
3. Report:
   ```
   ✅ Sync complete.
   - New: N files (M notes)
   - Modified: N files (M notes, K skipped for manual_edits)
   - Deleted: N files (M notes archived)
   - Area changes: X renamed, Y merged, Z archived (with approval)
   - Error notes: fully preserved (no deletions)
   ```

## Language

Match source language (Korean source → Korean notes). Keywords: ALWAYS English (kebab-case). User-facing UI in `{LANG}`.
