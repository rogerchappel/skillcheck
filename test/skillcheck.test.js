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
