# skillcheck

`skillcheck` is a local-first CLI for auditing agent `SKILL.md` files. It checks whether a skill explains when to use it, required inputs/tools, side-effect boundaries, approvals, examples, validation, and limitations.

## Quickstart

```bash
npm install
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
paragraphs and fenced code blocks do not create section coverage.

Risk checks inspect prose outside fenced code blocks. A line that explicitly
prohibits an action (`does not publish`, `never modify`) or marks it read-only or
local-only is treated as a boundary, not affirmative external behavior.
Affirmative external actions, including posting to named services, still
require approval and dry-run or local-first language.

## Library API

```js
import { auditSkillMarkdown } from "skillcheck";

const report = auditSkillMarkdown(markdown, { path: "SKILL.md", minScore: 80 });
```

## Safety Notes

The tool only reads local files and prints reports. It does not install skills, publish packages, call APIs, or mutate repositories.

## Limitations

The current checks are deterministic heuristics. Heading aliases outside the
documented vocabulary are not inferred, and nuanced prose that combines a
prohibition with a contrasting clause may still need human review. The checks
are meant to make review faster, not replace human judgment.

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
