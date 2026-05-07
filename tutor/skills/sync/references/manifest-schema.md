# Manifest Schema

The `sync` skill reads and writes `StudyVault/.manifest.json` to track source → note mappings and detect changes.

## JSON Schema

```json
{
  "version": 1,
  "last_build": "2026-04-18T10:00:00Z",
  "exclude": ["drafts/**", "scratch/**"],
  "sources": {
    "<relative/path/to/source>": {
      "type": "pdf | md | txt | html | epub | url",
      "hash": "<sha256 hex of normalized content>",
      "mtime": "<ISO8601 or null for url>",
      "fetched": "<ISO8601 — url type only>",
      "notes": [
        "<relative/path/inside/StudyVault/note.md>",
        "..."
      ],
      "sections": {
        "## Section Heading": {
          "hash": "<sha256 of section body>",
          "note": "<relative/path/inside/StudyVault/note.md>"
        }
      }
    }
  },
  "archived_sources": {
    "<relative/path>": {
      "type": "...",
      "archived_at": "<ISO8601>",
      "notes_moved_to": ["archive/<NN-topic>/<note>.md"]
    }
  }
}
```

### Field Semantics

- **version**: Schema version. Currently `1`. Bump on breaking changes.
- **last_build**: Timestamp of the most recent successful sync or setup run.
- **exclude** (optional): Glob patterns for user-defined exclusions (in addition to the default exclusion list).
- **sources**: Map from source file path (relative to CWD) to its tracking entry.
  - **type**: Source format. Determines normalization strategy.
  - **hash**: SHA-256 of normalized content (see Normalization table below).
  - **mtime**: File modification time. Not used as primary detection (hash is authoritative), but useful for fast-skip heuristics.
  - **fetched**: For `type: url` only. Timestamp of last fetch.
  - **notes**: List of StudyVault note paths (relative to StudyVault root) generated from this source. Used to identify affected notes on change.
  - **sections** (optional, primarily for `.md`): Per-H2-section hash + target note. Enables section-level partial updates.
- **archived_sources** (optional): History of removed sources. Kept for traceability.

## Format Normalization

All hashing uses SHA-256. The INPUT to the hash function is the output of the normalization step below:

| Type | Normalization command | Notes |
|------|------------------------|-------|
| `pdf` | `pdftotext "file.pdf" -` (stdout) | Requires `poppler`. Install: `brew install poppler` / `apt-get install poppler-utils`. |
| `md` | Read file bytes as-is | No transformation. Section hashing splits on `^## ` at column 0. |
| `txt` | Read file bytes as-is | No transformation. |
| `html` | `pandoc -f html -t plain` | Fallback if no pandoc: strip tags via regex `<[^>]+>` then collapse whitespace. |
| `epub` | `pandoc -f epub -t plain` | Requires pandoc. |
| `url` | WebFetch → response body, strip chrome | Hash of extracted main content text. |

## MD Section Hashing

For `.md` sources, split content on `^## ` (start-of-line H2 marker). Each section:

```json
{
  "## Leader Election": {
    "hash": "<sha256 of section body including heading>",
    "note": "03-distributed/leader-election.md"
  }
}
```

Section → note mapping is established at generation time: when `sync` creates a note from an MD section, it writes `source_section: "## Leader Election"` into the note's frontmatter, which is then recorded in the manifest.

Partial update flow on `.md` change:
1. Recompute per-section hashes.
2. Diff against manifest's `sections`.
3. For each changed section, regenerate only the mapped note.
4. If a section was removed, mark the mapped note for archive (subject to user approval in Phase S7).
5. If a section was added and has no mapping yet, treat as new content → Phase S5 path.

## Backfill Mode

When `.manifest.json` does not exist, run backfill (Phase S1):

```
for each note in StudyVault/**/*.md (excluding concepts/, *dashboard*, archive/):
    frontmatter = parse_yaml(note)
    for each source in frontmatter.source_pdf (can be list):
        mapping[source].notes.append(note.path)
        if frontmatter.source_section:
            mapping[source].sections[frontmatter.source_section] = note.path

for each source in mapping:
    path = locate(source)  # find by filename in CWD if relative path lost
    if not path:
        mark as archived_sources[source]
        continue
    type = infer_from_extension(path)
    hash = normalize_and_hash(path, type)
    mtime = stat(path).mtime
    manifest.sources[path] = {type, hash, mtime, notes: mapping[source].notes, sections: ...}

write_manifest_atomic(manifest)
report_to_user("백필 완료. 다음 실행부터 변경 감지가 동작합니다.")
halt  # backfill run does NOT proceed to diff/regeneration
```

## Atomic Write

Never write `.manifest.json` in place — a mid-write crash would corrupt the only record of source → note mappings. Use:

```
write manifest JSON to StudyVault/.manifest.json.tmp
fsync
rename StudyVault/.manifest.json.tmp → StudyVault/.manifest.json
```

On POSIX, `rename()` over an existing file is atomic. This guarantees either the old or new manifest is visible, never a partial one.

## Size & Performance

Typical manifest size: ~1-5 KB per source entry. For 100 sources, manifest is ~100-500 KB — fits comfortably in memory and a single read. No pagination or streaming needed.

## Example

```json
{
  "version": 1,
  "last_build": "2026-04-18T10:00:00Z",
  "sources": {
    "docs/computer-architecture-ch3.pdf": {
      "type": "pdf",
      "hash": "a3f9c2b7...",
      "mtime": "2026-04-15T08:00:00Z",
      "notes": [
        "02-cpu/pipeline.md",
        "02-cpu/hazard.md",
        "02-cpu/forwarding.md"
      ]
    },
    "notes/raft.md": {
      "type": "md",
      "hash": "b71c9e4a...",
      "mtime": "2026-04-17T12:00:00Z",
      "notes": [
        "03-distributed/raft.md",
        "03-distributed/leader-election.md",
        "03-distributed/log-replication.md"
      ],
      "sections": {
        "## Overview": {
          "hash": "f1e2d3c4...",
          "note": "03-distributed/raft.md"
        },
        "## Leader Election": {
          "hash": "e1f2a3b4...",
          "note": "03-distributed/leader-election.md"
        },
        "## Log Replication": {
          "hash": "9d3a8b7c...",
          "note": "03-distributed/log-replication.md"
        }
      }
    },
    "https://example.com/spec/v2": {
      "type": "url",
      "hash": "c4d5e6f7...",
      "fetched": "2026-04-18T09:58:00Z",
      "notes": ["04-ext/spec-v2.md"]
    }
  },
  "archived_sources": {
    "old/legacy-chapter.pdf": {
      "type": "pdf",
      "archived_at": "2026-04-10T14:20:00Z",
      "notes_moved_to": ["archive/01-legacy/intro.md"]
    }
  }
}
```
