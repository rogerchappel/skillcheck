import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { auditSkillMarkdown, formatTextReport } from "../src/index.js";

test("passes a complete skill with safety and validation coverage", async () => {
  const markdown = await readFile(new URL("./fixtures/pass/SKILL.md", import.meta.url), "utf8");
  const report = auditSkillMarkdown(markdown, { path: "pass/SKILL.md" });
  assert.equal(report.passed, true);
  assert.equal(report.findings.length, 0);
});

test("fails when major skill sections are missing", async () => {
  const markdown = await readFile(new URL("./fixtures/fail/SKILL.md", import.meta.url), "utf8");
  const report = auditSkillMarkdown(markdown);
  assert.equal(report.passed, false);
  assert.ok(report.findings.some((finding) => finding.rule === "approval"));
  assert.ok(report.findings.some((finding) => finding.rule === "validation"));
});

test("flags risky external actions without approval language", () => {
  const report = auditSkillMarkdown("Use this skill to post updates to Slack and GitHub.");
  assert.equal(report.passed, false);
  assert.ok(report.findings.some((finding) => finding.rule === "risk-approval"));
});

test("distinguishes affirmative, missing, and negated approval requirements", () => {
  const cases = [
    {
      wording: "Ask the user for approval before publishing the file to GitHub.",
      flagged: false
    },
    {
      wording: "Publish the file to GitHub.",
      flagged: true
    },
    {
      wording: "Publish the file to GitHub. No approval is required.",
      flagged: true
    },
    {
      wording: "Publish the file to GitHub without asking the user for permission.",
      flagged: true
    }
  ];

  for (const { wording, flagged } of cases) {
    const report = auditSkillMarkdown(wording);
    assert.equal(
      report.findings.some((finding) => finding.rule === "risk-approval"),
      flagged,
      wording
    );
  }
});

test("does not count incidental keywords as operational sections", async () => {
  const markdown = await readFile(
    new URL("./fixtures/fail/keyword-probe.md", import.meta.url),
    "utf8"
  );
  const report = auditSkillMarkdown(markdown);

  assert.equal(report.score, 0);
  assert.equal(report.passed, false);
  assert.ok(report.findings.some((finding) => finding.rule === "when-to-use"));
  assert.ok(report.findings.some((finding) => finding.rule === "approval"));
});

test("recognizes ATX and setext heading variants without treating prohibitions as risks", async () => {
  const markdown = await readFile(
    new URL("./fixtures/pass/boundary-headings.md", import.meta.url),
    "utf8"
  );
  const report = auditSkillMarkdown(markdown);

  assert.equal(report.score, 100);
  assert.equal(report.passed, true);
  assert.equal(report.findings.length, 0);
});

test("attributes nested grouping content to the nearest semantic parent section", () => {
  const examples = auditSkillMarkdown([
    "## Examples",
    "### Basic",
    "- Run the checker."
  ].join("\n"));
  assert.equal(examples.coverage.find(({ id }) => id === "examples").matched, true);

  const validation = auditSkillMarkdown([
    "## Validation",
    "### Automated checks",
    "#### Package smoke",
    "Run the packed-package consumer test."
  ].join("\n"));
  assert.equal(validation.coverage.find(({ id }) => id === "validation").matched, true);
});

test("ends semantic parent inheritance at same-or-higher-level headings", () => {
  const report = auditSkillMarkdown([
    "## Examples",
    "### Basic",
    "## Notes",
    "Content outside the examples section."
  ].join("\n"));

  assert.equal(report.coverage.find(({ id }) => id === "examples").matched, false);
});

test("CLI accepts nested content under a semantic coverage heading", () => {
  const result = spawnSync(
    process.execPath,
    ["bin/skillcheck.js", "test/fixtures/pass/nested-coverage.md"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /^PASS .* score=100\/80/m);
});

test("still detects affirmative external actions in structured sections", () => {
  const markdown = [
    "## External Actions",
    "Post updates to Slack and GitHub.",
    "",
    "## Limitations",
    "Do not delete local files."
  ].join("\n");
  const report = auditSkillMarkdown(markdown);

  assert.ok(report.findings.some((finding) => finding.rule === "risk-approval"));
});

test("distinguishes prohibited and affirmative actions in mixed prose", () => {
  const risky = [
    "This skill does not modify local files and posts updates to Slack.",
    "This skill never writes locally; it uploads the report to GitHub.",
    "This skill is read-only, then publishes a summary to Notion.",
    "This skill does not delete local files, but sends updates to Linear."
  ];
  const boundaries = [
    "This skill does not modify local files.",
    "This skill does not modify local files or post updates to Slack.",
    "This skill never writes, publishes, or uploads to GitHub.",
    "This skill is read-only and local-only."
  ];

  for (const wording of risky) {
    const report = auditSkillMarkdown(wording);
    assert.ok(
      report.findings.some((finding) => finding.rule === "risk-approval"),
      wording
    );
  }
  for (const wording of boundaries) {
    const report = auditSkillMarkdown(wording);
    assert.equal(
      report.findings.some((finding) => finding.rule === "risk-approval"),
      false,
      wording
    );
  }
});

test("recognizes gerund external actions while preserving prohibitions", () => {
  const risky = [
    "Publishing reports to Slack. No approval is required.",
    "Uploading artifacts to GitHub without asking the user for permission.",
    "Deleting remote records is supported.",
    "Writing updates to Notion requires no approval."
  ];
  const boundaries = [
    "This skill does not support publishing reports to Slack.",
    "Never uploading artifacts to GitHub is a hard boundary.",
    "Do not use this skill for deleting remote records or writing to Notion."
  ];

  for (const wording of risky) {
    const report = auditSkillMarkdown(wording);
    assert.ok(
      report.findings.some((finding) => finding.rule === "risk-approval"),
      wording
    );
  }
  for (const wording of boundaries) {
    const report = auditSkillMarkdown(wording);
    assert.equal(
      report.findings.some((finding) => finding.rule === "risk-approval"),
      false,
      wording
    );
  }
});

test("ignores headings and risk keywords inside longer backtick fences", () => {
  const markdown = [
    "````markdown",
    "## Approval",
    "Post updates to Slack.",
    "```",
    "## Validation",
    "Preview changes locally.",
    "````",
    "Genuine prose remains visible."
  ].join("\n");
  const report = auditSkillMarkdown(markdown);

  assert.equal(report.score, 0);
  assert.equal(report.findings.some((finding) => finding.rule === "risk-approval"), false);
  assert.equal(report.findings.some((finding) => finding.rule === "risk-dry-run"), false);
});

test("only a same-marker fence of sufficient length closes a fenced block", () => {
  const markdown = [
    "~~~~text",
    "## Approval",
    "Upload credentials to GitHub.",
    "```",
    "### Validation",
    "Ask the user for approval, then preview and post to Slack.",
    "~~~",
    "## Examples",
    "Publish to Notion.",
    "~~~~",
    "Post to Slack from genuine prose."
  ].join("\n");
  const report = auditSkillMarkdown(markdown);

  assert.equal(report.score, 0);
  assert.ok(report.findings.some((finding) => finding.rule === "risk-approval"));
  assert.ok(report.findings.some((finding) => finding.rule === "risk-dry-run"));
});

test("CLI rejects a keyword-only document with missing-section findings", () => {
  const result = spawnSync(
    process.execPath,
    ["bin/skillcheck.js", "test/fixtures/fail/keyword-probe.md"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL .* score=0\/80/m);
  assert.match(result.stdout, /Missing coverage for When to use/);
});

test("CLI accepts explicit safe boundaries under recognized heading variants", () => {
  const result = spawnSync(
    process.execPath,
    ["bin/skillcheck.js", "test/fixtures/pass/boundary-headings.md"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /^PASS .* score=100\/80/m);
  assert.match(result.stdout, /no findings/);
});

test("CLI rejects external publishing with a negated approval requirement", () => {
  const result = spawnSync(
    process.execPath,
    ["bin/skillcheck.js", "test/fixtures/fail/negated-approval.md"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /^FAIL .* score=100\/80/m);
  assert.match(result.stdout, /ERROR risk-approval/);
});

test("CLI rejects an affirmative action following a prohibition", () => {
  const result = spawnSync(
    process.execPath,
    ["bin/skillcheck.js", "test/fixtures/fail/mixed-prohibition.md"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /^FAIL .* score=100\/80/m);
  assert.match(result.stdout, /Potential external write, live account behavior/);
  assert.match(result.stdout, /ERROR risk-approval/);
});

test("CLI rejects gerund publishing with a negated approval requirement", () => {
  const result = spawnSync(
    process.execPath,
    ["bin/skillcheck.js", "test/fixtures/fail/gerund-action.md"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /ERROR risk-approval/);
});

test("formats text output for CLI users", async () => {
  const markdown = await readFile(new URL("./fixtures/pass/SKILL.md", import.meta.url), "utf8");
  const text = formatTextReport(auditSkillMarkdown(markdown, { path: "SKILL.md" }));
  assert.match(text, /^PASS SKILL\.md/);
  assert.match(text, /no findings/);
});

test("CLI rejects unknown options instead of treating them as paths", () => {
  const result = spawnSync(process.execPath, ["bin/skillcheck.js", "--jsoon"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown option: --jsoon/);
  assert.doesNotMatch(result.stderr, /ENOENT/);
});

test("CLI rejects thresholds outside the score range", () => {
  for (const threshold of ["-1", "101", "80oops"]) {
    const result = spawnSync(process.execPath, ["bin/skillcheck.js", "--min-score", threshold, "SKILL.md"], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    });

    assert.equal(result.status, 2, threshold);
    assert.match(result.stderr, /integer from 0 to 100/, threshold);
  }
});
