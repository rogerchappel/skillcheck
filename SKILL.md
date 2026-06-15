# skillcheck

Use this skill when an agent needs to validate one or more `SKILL.md` files before packaging, sharing, or installing them.

## Required Inputs

- Path to one or more skill markdown files.
- Optional minimum score threshold.

## Required Tools

- Local filesystem read access.
- Node.js 18 or newer for the CLI.

## Side Effects

`skillcheck` reads markdown files and prints reports. It does not install skills, modify files, call external services, or write to live accounts.

## Approval Requirements

No approval is needed for local reads. Ask the user before combining this with any workflow that edits, installs, publishes, or sends skill content externally.

## Examples

```bash
skillcheck SKILL.md
skillcheck --json --min-score 90 skills/*/SKILL.md
```

## Validation Workflow

Run `npm test`, `npm run check`, and `npm run smoke` after changing rules, fixtures, or output formatting.

## Limitations

The rules are heuristic and deterministic. They cannot prove a skill is safe; they identify missing operational coverage for human or agent review.
