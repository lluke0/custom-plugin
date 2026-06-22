# Quiz Design Rules

## Zero-Hint Policy (CRITICAL)

Every question must be answerable ONLY by someone who actually knows the material.

1. **Option descriptions**: NEVER reveal correctness
   - BAD: `label: "stderr"`, `description: "Error output stream used by Cloud Run for error classification"`
   - GOOD: `label: "stderr"`, `description: "Standard error stream"`

2. **No "(Recommended)" tag** on any option

3. **Randomize** correct answer position — never always first or last

4. **Question phrasing**: Ask about behavior/purpose/output, don't hint at the answer
   - BAD: "Which error stream does error() use?"
   - GOOD: "Where does error() method output go?"

5. **Plausible distractors**: Wrong options must be real concepts from the domain, representing common misconceptions

## Provide Sufficient Context (맥락 충분성)

Counterweight to Zero-Hint: hiding the answer is NOT the same as stripping context. The goal is discrimination — "those who know it solve it, those who don't can't" — not brevity. A stem that omits the setup produces noise errors (people who know the concept fail because the sentence is underspecified), not real signal.

1. **Context ≠ hint**: Stating the situation, premises, and criteria the question is measured against is NOT a Zero-Hint violation. Only revealing *which option is correct* is.

2. **State the frame for relational questions**: For comparison / direction / ordering / relative-magnitude questions, name the reference frame (the two ends of the axis, the baseline being compared) in the stem. Mirror-image option pairs ("A up · B down" vs "A down · B up") that can't be solved without an unstated frame are forbidden.

3. **Check question**: "From this stem alone, can a learner who knows the concept tell exactly what is being asked?" If not, add more context.

- BAD: "Which of the following is correct?" + [near-context-free one-line options]
- GOOD: "<1–2 sentences laying out situation · premises · criteria>, which is correct?" + [...]

## Question Types

1. **Factual recall**: "What HTTP status code is returned when...?"
2. **Conceptual understanding**: "Why does the system use X pattern?"
3. **Behavioral prediction**: "What happens when X fails?"
4. **Comparison/distinction**: "What is the difference between X and Y?"
5. **Debugging scenario**: "Given this error, what is the most likely cause?"

## Difficulty Balancing

- Diagnostic: easy 40%, medium 40%, hard 20%
- Weak-area drill: medium 30%, hard 70%
- Review: all levels evenly

## Drilling Unresolved Concepts

When targeting 🔴 concepts from concept files:
- Do NOT repeat the exact same question — rephrase in a new context
- Test the same underlying knowledge from a different angle
- E.g., if user confused "400 vs 422", ask a scenario question where they must choose the correct status code for a new situation

## AskUserQuestion Format

- 4 questions per round, 4 options each, single-select
- Header: max 12 chars, "Q1. Topic"

## File Update Protocol

After grading:
1. Update `concepts/{area}.md` — apply [progress-rules.md §4 (Status Transitions)](../../_shared/progress-rules.md) including Streak column
2. Update dashboard — recompute Coverage / Accuracy / Mastery / Level per [progress-rules.md §2, §3](../../_shared/progress-rules.md)
3. Level badges (coverage-gated): ⬜ cov<50% · 🟥 weak · 🟨 fair · 🟩 good · 🟦 mastered

## Language Rule

All file content and output in the user's detected language. Badge emojis are universal.
