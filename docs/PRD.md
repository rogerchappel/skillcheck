# PRD: skillcheck

## Goal

Help agent builders catch incomplete or unsafe `SKILL.md` files before reuse.

## Users

- Agent developers packaging reusable skills.
- Maintainers reviewing skill pull requests.
- Automation lanes that need a quick preflight before publishing skill docs.

## Requirements

- Accept one or more local markdown files.
- Score coverage for skill usage, inputs, tools, side effects, approvals, examples, validation, and limitations.
- Flag external-action language that lacks approval or dry-run boundaries.
- Provide text and JSON output.
- Use deterministic local checks with no network dependency.

## Success Metrics

- A complete fixture passes with no findings.
- A thin fixture fails with actionable findings.
- CLI exits nonzero when reports fail.
