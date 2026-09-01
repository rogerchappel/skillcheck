# skillcheck

`skillcheck` is a local-first CLI for auditing agent `SKILL.md` files. It checks whether a skill explains when to use it, required inputs/tools, side-effect boundaries, approvals, examples, validation, and limitations.

## Quickstart

```bash
npm ci
npm test
node bin/skillcheck.js SKILL.md
```

JSON output is available for automation:

```bash
node bin/skillcheck.js --json --min-score 90 SKILL.md
```

## What It Catches

- Missing high-value sections such as approval, validation, or examples.
- External write language without approval requirements.
- Risky workflow language without local-first or dry-run boundaries.

## Deterministic Rules

Coverage is awarded only for a non-empty Markdown section whose heading matches
one of the supported names. ATX headings (`## Inputs`) and setext headings
(`Inputs` followed by `------`) are recognized at any heading level. Common
heading variants include Triggers, Requirements, Dependencies, External
Actions, Permission, Example, Verification, and Non-Goals. Keywords in ordinary
paragraphs and fenced code blocks do not create section coverage. Content under
deeper grouping headings belongs to the nearest matching semantic parent (for
example, `### Basic` content beneath `## Examples`) until a heading at the same
or a higher level begins. Fenced pseudo-headings never change that hierarchy.

Risk checks inspect prose outside fenced code blocks. Closing fences must use
the opening marker and be at least as long, following Markdown fence rules. A
clause that explicitly prohibits an action (`does not publish`, `never modify`)
or marks it read-only or local-only is treated as a boundary, not affirmative
external behavior. In mixed statements, punctuation, explicit contrasts, and
independent action clauses are evaluated separately, so `does not modify local
files and posts updates to Slack` and `does not delete files or uploads them to
Slack` still identify the affirmative Slack action. Fully prohibited lists such
as `does not delete or upload files` remain boundaries. A subjectless base verb
is treated independently when `then` makes the sequence explicit, as in `does
not delete files and then publish the report`.
Affirmative external actions, including base and progressive wording such as
`publish`, `posting`, `uploading`, `deleting`, and `writing`, require
affirmative approval language such as “ask the user before publishing,” plus
dry-run or local-first language. Waivers such as “no approval is required” and
“publish without asking the user” do not satisfy the approval risk check.

## Library API

```js
import { auditSkillMarkdown } from "skillcheck";

const report = auditSkillMarkdown(markdown, { path: "SKILL.md", minScore: 80 });
```

## Safety Notes

The tool only reads local files and prints reports. It does not install skills, publish packages, call APIs, or mutate repositories.

## Limitations

The current checks are deterministic heuristics. Heading aliases outside the
documented vocabulary are not inferred, and unusually structured or ambiguous
prose may still need human review. The checks are meant to make review faster,
not replace human judgment.

## Verification

```bash
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

Use `npm run release:check` before publishing or opening a release PR.
See [docs/release-readiness.md](docs/release-readiness.md) for the package
surface, release gate, and reviewer checklist.
