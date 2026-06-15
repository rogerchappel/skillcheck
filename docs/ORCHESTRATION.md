# Orchestration

Use `skillcheck` as a local preflight before a skill is packaged, proposed, or installed.

## Agent Flow

1. Read candidate skill files from the workspace.
2. Run `skillcheck` in text mode for human review or JSON mode for automation.
3. Treat a failing report as a candidate-level blocker.
4. Ask for approval before combining results with any workflow that modifies files or publishes content.

## Side-Effect Boundaries

The CLI performs local reads only. Downstream agents are responsible for approvals before edits, installation, publishing, or external account writes.
