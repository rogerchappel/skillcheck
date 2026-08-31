import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCommandSuccess,
  assertPublicApi,
  assertRequiredFiles
} from "../scripts/package-smoke.js";

test("package smoke rejects a missing required file", () => {
  assert.throws(
    () => assertRequiredFiles(["package.json", "bin/skillcheck.js"], ["package.json", "src/index.js"]),
    /missing required package files: src\/index\.js/
  );
});

test("package smoke rejects a broken installed bin", () => {
  assert.throws(
    () => assertCommandSuccess({ status: 126, stderr: "permission denied" }, "installed skillcheck bin"),
    /installed skillcheck bin failed: permission denied/
  );
});

test("package smoke rejects a missing public export", () => {
  assert.throws(() => assertPublicApi({}), /does not export auditSkillMarkdown/);
});
