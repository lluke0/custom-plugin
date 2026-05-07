# Quality Checklist — Self-Review

Verify every item before declaring completion. Fix and re-verify on any failure.

## Source Traceability
- [ ] Every source file's content verified (NOT filename-based)
- [ ] Source mapping table built and verified in Phase D1
- [ ] Every `source_pdf` matches verified mapping
- [ ] Every `> 원문 (p.N): ...` quote carries a page citation
- [ ] Sample 20% of page citations and verify against `pdftotext` output — citations match source content
- [ ] Non-academic files excluded; missing sources documented in MOC
- [ ] No notes created for topics that lack traceable source pages (no invented topics)

## Coverage
- [ ] Every section/subsection from the source TOC has a concept note (or is explicitly listed in Non-core Topic Policy as excluded)
- [ ] Concept notes mirror source's chapter/section structure — no re-clustering across chapter boundaries

## Source Fidelity (replaces Textbook-Level Depth)

> **Scope**: applies to setup-generated sections only. `##` sections tagged `[supplement]` are lesson-generated and exempt from these rules.

- [ ] Every body line in non-`[supplement]` sections is one of: `> 원문 (p.N): ...` quote, visual embed, section heading, ≤1-line navigation lead-in, or `## Related Notes` block
- [ ] No LLM-composed prose outside the allowed slots (no LLM-generated definitions, intuitions, examples, derivations, comparisons, misconceptions) in setup-authored sections
- [ ] No LLM-generated diagrams (mermaid/ASCII) in setup-authored sections (lesson supplements may contain them)
- [ ] Quotes are verbatim — only typographic cleanup (line-break re-flow, hyphen re-join, footnote-marker drop) was applied
- [ ] Cuts marked with `[…]`; clarifications (rare) marked with `[원문 표기 그대로: ...]`
- [ ] Word order, terminology, and notation match the source exactly

## Visual Capture
- [ ] `pdftoppm` page renders exist in `StudyVault/_assets/<source-stem>/` for every PDF source
- [ ] `pdfimages -list` inventory consulted to identify pages with figures/tables/equations
- [ ] Every figure/table/equation on a page covered by a concept note is embedded in that note
- [ ] All embeds use relative paths `../_assets/<source-stem>/p-NNN.png`
- [ ] Captions on embeds are verbatim from source, including page citation `(p.N)`
- [ ] Pages with small text or fine diagrams re-rendered at 200–300dpi where 150dpi is unreadable

## Keywords
- [ ] All keywords: English kebab-case, from registry only
- [ ] Detail keywords co-attached with parent domain keywords

## Structure & Formatting
- [ ] YAML frontmatter present: `source_pdf`, `part`, `keywords`
- [ ] Section headings localized to source language (Korean source → Korean headings)
- [ ] Headings reflect source's own structure — no canonical 5-section template imposed

## Dashboard
- [ ] MOC: Topic Map + Study Tools + Keyword Index + Weak Areas (empty initially) + Non-core Policy
- [ ] MOC links to every concept note
- [ ] Quick Reference: every entry is a verbatim quote with `(p.N)`; entries omitted (not invented) when source has no clean definition
- [ ] Exam Traps: every entry is a verbatim quote of a source warning/caution callout; if source has none, file states so
- [ ] Single-file invariant: exactly ONE `StudyVault/dashboard.md` (no duplicate localized variants)

## Interlinking
- [ ] Every concept note has `## Related Notes` (role-labeled: prerequisite / sibling / downstream)
- [ ] All cross-references use relative-path markdown `[text](path.md)`
- [ ] Siblings reference each other; cross-references reflect source's own forward/backward references

## CWD Boundary
- [ ] No source files accessed outside CWD
- [ ] No absolute file paths in notes/frontmatter
- [ ] External URLs accessed only via WebFetch
- [ ] All visual assets stored under `StudyVault/_assets/` (inside the vault, never outside CWD)
