# Changelog

## Unreleased

- Require affirmative user-approval language for risky external actions instead
  of accepting negated or waived approval statements.
- Base coverage scoring on non-empty Markdown sections instead of document-wide
  keyword matches, and distinguish explicit safe boundaries from affirmative
  external actions in risk checks.
- Add library and CLI regressions for keyword-only documents, heading variants,
  negated actions, and affirmative posts to named services.
- Replace the raw package dry-run with a deterministic package smoke script that
  asserts the CLI, library, skill file, release notes, license, and security
  policy are present in the packed tarball.
- Add release-readiness docs that describe the package surface and verification
  commands reviewers should use before publishing.

## 0.1.0

- Initial public release candidate for the local-first SKILL.md checker.
- Includes CLI smoke coverage, package smoke checks, and release-readiness scripts.
