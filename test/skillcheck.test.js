import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
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

test("formats text output for CLI users", async () => {
  const markdown = await readFile(new URL("./fixtures/pass/SKILL.md", import.meta.url), "utf8");
  const text = formatTextReport(auditSkillMarkdown(markdown, { path: "SKILL.md" }));
  assert.match(text, /^PASS SKILL\.md/);
  assert.match(text, /no findings/);
});
