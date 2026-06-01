# Rebirth Difficulty Curve

How question difficulty scales with rebirth **tier**. This extends — does not replace — [quiz-rules.md](../../quiz/references/quiz-rules.md): the zero-hint policy, plausible-distractor rule, question types, and AskUserQuestion format are all inherited unchanged. Only the difficulty *mix* changes per tier.

> "Tier `T+1`" means the round a learner enters right after their `T`→`T+1` rebirth. A brand-new area is tier 0 and is quizzed by `/quiz` at normal difficulty; rebirth only ever runs tier ≥ 1.

## Tier → Difficulty profile

| Tier | hard : medium : easy | Emphasized question types | Concept-combination scope |
|------|----------------------|---------------------------|---------------------------|
| 1 | 60 : 40 : 0 | Behavioral prediction & comparison introduced; minimize bare factual recall | Single concept, deeper |
| 2 | 80 : 20 : 0 | Debugging scenarios & trade-off reasoning weighted up | Combine 2 concepts within the area |
| 3 | 100 : 0 : 0 | All types, scenario / design-judgment first | Integrate several concepts across the area |
| 4+ | 100 : 0 : 0 (soft cap) | Vary by type & context, not by raw difficulty | Apply to adjacent areas' concepts too |

## Soft cap (tier 3+)

Tier 3 reaches the **ceiling** (hard 100%). Tier 4 and beyond do **not** crank a difficulty number higher — they hold the same ceiling and differentiate through **breadth and integration**: more varied question types, richer scenarios, and combinations that reach into adjacent areas. 

Rationale: questions are generated dynamically by an LLM from the vault notes. Pushing "harder" without bound drifts into artificial or trick questions. Past tier 3 the axis turns from *harder* to *wider and more applied*.

## The three levers (how to actually make it harder)

1. **Raise the hard ratio** — per the table above.
2. **Upgrade question types** — shrink factual-recall share each tier; grow behavioral-prediction, debugging-scenario, and comparison shares. By tier 3+, avoid pure memorization items.
3. **Combine & deepen concepts** — ask about how concepts interact, not one in isolation. Tier 2: two concepts. Tier 3: several. Tier 4+: pull in adjacent areas (design judgment, application).

## Guardrails

- **Stay grounded in the vault.** Even at the highest tier, every answer must be supported by the area's notes. Difficulty must come from depth and integration, not from knowledge that lives outside the StudyVault.
- **No trick questions.** Hardness comes from conceptual depth, not wordplay, ambiguity, or deliberately misleading phrasing.
- **Distractors** should be advanced misconceptions a learner at *this* tier would plausibly fall for — not obviously-wrong filler.
- **Uniform within a round/tier.** All 4 questions of a rebirth round share the tier's difficulty. Difficulty steps up only at the *next* rebirth, never between rounds of the same tier.

## References

- Base question rules: [quiz-rules.md](../../quiz/references/quiz-rules.md)
- Prestige data model: [progress-rules.md §8](../../_shared/progress-rules.md)
