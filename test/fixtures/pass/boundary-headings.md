# Boundary-Only Skill

### Triggers

Use this skill to inspect a local project.

Inputs
------

Requires a project directory.

## Dependencies

Uses local shell commands.

## External Actions

It does not publish, post, upload, delete, write, modify, or access live accounts.

## Permission

No approval is needed because the workflow is read-only and local-only.

## Example

```text
Inspect ./demo
```

## Verification

Run the local test suite.

## Non-Goals

Never change files or contact external services.
