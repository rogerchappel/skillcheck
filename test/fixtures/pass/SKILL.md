# Complete Example Skill

## When To Use

Use this skill when an agent needs to prepare a local release checklist from repository files.

## Inputs

Requires a repository path, a package manifest, and optional release notes.

## Required Tools

Uses shell commands for local file inspection only.

## Side Effects

The workflow is local-first and does not write to external systems. File writes are limited to a dry-run preview unless the user approves.

## Approval

Ask the user for permission before modifying files or posting anywhere.

## Examples

```text
Prepare a release checklist for ./demo
```

## Validation

Run tests and a smoke command before reporting success.

## Limitations

Do not tag releases or publish packages.
