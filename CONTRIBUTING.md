# Contributing

Thanks for helping improve `skillcheck`.

## Development

```sh
npm install
npm run check
npm test
npm run smoke
npm run package:smoke
```

Use `npm run release:check` before opening release-readiness changes.

## Pull Requests

- Keep rule changes deterministic and fixture-backed.
- Add or update tests for new findings, scoring behavior, or CLI output.
- Avoid network calls and external writes in checks.
- Document user-facing behavior in `README.md` when commands or output change.

## Security

Report security-sensitive issues privately. See `SECURITY.md`.
