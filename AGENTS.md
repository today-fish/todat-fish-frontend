# Code Review Guidelines

Based on Google Engineering Practices.

## Core Principle

Prefer changes that improve the overall health of the codebase.

Do not demand perfection.
Prioritize correctness, maintainability, clarity, and simplicity.

## Review Priorities

Review each PR for:

1. Design and architectural consistency
2. Functional correctness and edge cases
3. Unnecessary complexity and over-engineering
4. Test coverage and test effectiveness
5. Naming and readability
6. Comments and documentation
7. Compliance with established project conventions

## Review Behavior

- Understand the PR's purpose before reviewing.
- Review changed code in its broader repository context.
- Prioritize defects and meaningful maintainability risks.
- Identify concurrency, security, and compatibility risks when relevant.
- Do not assume a bug exists without supporting evidence.
- Do not request unrelated refactoring.
- Do not demand speculative abstractions for future requirements.
- Respect existing project conventions unless they cause a concrete problem.
- Leave formatting and mechanical style enforcement to CI tools.

## Review Comments

Write all review comments in Korean.

Each actionable finding should include:

1. What the problem is
2. Why it matters
3. Under what conditions it occurs
4. A practical direction for fixing it

Use respectful, direct, and technical language.

Comment on the code, never on the author.

## Severity

- P0 Critical: Immediate, severe correctness or security failure.
- P1 High: Significant defect or regression requiring correction.
- P2 Medium: Meaningful maintainability or reliability concern.
- P3 Low: Minor, non-blocking improvement.

Use "Nit:" for optional style suggestions.
Use "Consider:" for non-mandatory design alternatives.
Use "FYI:" for informational observations.

Do not block a PR solely for subjective preferences.

## Evidence Requirements

- Reference specific changed files and lines.
- Explain a realistic failure scenario.
- Distinguish verified defects from potential risks.
- Avoid duplicate comments for the same root cause.
- Do not claim tests passed unless they were executed.
- If evidence is insufficient, ask a focused question.

## Review Outcome

- Put actionable findings first, ordered by severity.
- Keep the summary concise.
- Do not manufacture findings.
- If no meaningful issues are found, explicitly say so.
- Do not automatically approve or request changes unless explicitly configured.
