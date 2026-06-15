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

## Library API

```js
import { auditSkillMarkdown } from "skillcheck";

const report = auditSkillMarkdown(markdown, { path: "SKILL.md", minScore: 80 });
```

## Safety Notes

The tool only reads local files and prints reports. It does not install skills, publish packages, call APIs, or mutate repositories.

## Limitations

The current checks are deterministic heuristics. They are meant to make review faster, not replace human judgment.
