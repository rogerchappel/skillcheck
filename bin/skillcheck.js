#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { auditSkillMarkdown, formatTextReport } from "../src/index.js";

function usage() {
  return [
    "Usage: skillcheck [--json] [--min-score N] <SKILL.md...>",
    "",
    "Audits agent skill markdown for operational completeness and safety coverage."
  ].join("\n");
}

async function main(argv) {
  const paths = [];
  let json = false;
  let minScore = 80;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      json = true;
    } else if (arg === "--min-score") {
      const raw = argv[index + 1];
      index += 1;
      minScore = Number.parseInt(raw, 10);
      if (!Number.isFinite(minScore)) {
        throw new Error("--min-score expects an integer");
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(usage());
      return 0;
    } else {
      paths.push(arg);
    }
  }

  if (paths.length === 0) {
    console.error(usage());
    return 2;
  }

  const reports = [];
  for (const path of paths) {
    const markdown = await readFile(path, "utf8");
    reports.push(auditSkillMarkdown(markdown, { path, minScore }));
  }

  if (json) {
    console.log(JSON.stringify({ reports }, null, 2));
  } else {
    console.log(reports.map(formatTextReport).join("\n\n"));
  }

  return reports.every((report) => report.passed) ? 0 : 1;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`skillcheck: ${error.message}`);
    process.exitCode = 2;
  });
