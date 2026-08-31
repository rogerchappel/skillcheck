#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const requiredFiles = [
  "bin/skillcheck.js",
  "src/index.js",
  "SKILL.md",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "SECURITY.md"
];

export function assertRequiredFiles(files, required = requiredFiles) {
  const packedFiles = new Set(files);
  const missing = required.filter((file) => !packedFiles.has(file));
  if (missing.length > 0) {
    throw new Error(`missing required package files: ${missing.join(", ")}`);
  }
}

export function assertCommandSuccess(result, label) {
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr?.trim() || `exit ${result.status}`;
    throw new Error(`${label} failed: ${detail}`);
  }
}

export function assertPublicApi(module) {
  if (typeof module.auditSkillMarkdown !== "function") {
    throw new Error("installed package does not export auditSkillMarkdown");
  }
}

export async function runPackageSmoke() {
  const sandbox = mkdtempSync(path.join(tmpdir(), "skillcheck-package-"));
  try {
    const output = execFileSync(
      "npm",
      ["pack", "--silent", "--json", "--pack-destination", sandbox],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    const [pack] = JSON.parse(output);
    assertRequiredFiles(pack.files.map((file) => file.path));

    const consumer = path.join(sandbox, "consumer");
    mkdirSync(consumer);
    writeFileSync(path.join(consumer, "package.json"), '{"private":true,"type":"module"}\n');
    writeFileSync(
      path.join(consumer, "SKILL.md"),
      readFileSync("test/fixtures/pass/SKILL.md")
    );
    execFileSync("npm", ["install", "--ignore-scripts", path.join(sandbox, pack.filename)], {
      cwd: consumer,
      stdio: "pipe"
    });

    const bin = path.join(consumer, "node_modules", ".bin", "skillcheck");
    const cli = spawnSync(bin, ["SKILL.md"], { cwd: consumer, encoding: "utf8" });
    assertCommandSuccess(cli, "installed skillcheck bin");
    if (!cli.stdout.includes("PASS")) throw new Error("installed bin returned no passing report");

    const installed = await import(path.join(consumer, "node_modules", "skillcheck", "src", "index.js"));
    assertPublicApi(installed);
    const report = installed.auditSkillMarkdown(readFileSync(path.join(consumer, "SKILL.md"), "utf8"));
    if (!report.passed) throw new Error("installed auditSkillMarkdown rejected the passing fixture");

    console.log(`package smoke ok: installed ${pack.filename}; bin and public API verified`);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPackageSmoke().catch((error) => {
    console.error(`package smoke failed: ${error.message}`);
    process.exitCode = 1;
  });
}
