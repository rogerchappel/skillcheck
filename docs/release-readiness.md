# Release Readiness

Use this checklist before publishing, tagging, or asking reviewers to trust a
`skillcheck` release.

## Package Surface

- Package: `skillcheck`
- CLI bin: `skillcheck` -> `bin/skillcheck.js`
- Library export: `src/index.js`
- Publish allowlist: `bin`, `src`, `docs`, `SKILL.md`, release docs, and
  support files from `package.json`.

## Verification Commands

- `npm run check`: syntax-checks the CLI and library entrypoint.
- `npm test`: runs the fixture-backed Node test suite.
- `npm run smoke`: audits the shipped canonical skill and the passing fixture
  through the CLI.
- `npm run package:smoke`: builds the real tarball, asserts required release
  files, installs it in an isolated consumer, and exercises the installed CLI
  and public API.
- `npm run release:check`: runs the full release gate used by CI.

## Reviewer Notes

- Confirm README examples still match the `skillcheck` bin and fixture names.
- Inspect package-smoke output for unexpected generated files.
- Keep real private skills, customer examples, and unpublished policy details
  out of fixtures and public issues.
