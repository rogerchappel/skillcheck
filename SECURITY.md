# Security Policy

## Supported Versions

Security fixes apply to the current `main` branch.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately through GitHub security advisories or by contacting the maintainer. Do not open a public issue for security-sensitive reports.

Include:

- A short description of the issue.
- Steps to reproduce it with a local fixture when possible.
- Any known impact on CLI output, package contents, or library behavior.

`skillcheck` is designed to read local Markdown and print deterministic reports. Report any behavior that unexpectedly writes files, calls external services, or exposes private content.
