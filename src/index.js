const REQUIRED_COVERAGE = [
  {
    id: "when-to-use",
    label: "When to use",
    weight: 15,
    patterns: [/when to use/i, /use this skill/i, /trigger/i]
  },
  {
    id: "inputs",
    label: "Required inputs",
    weight: 10,
    patterns: [/inputs?/i, /requires?/i, /prerequisites?/i]
  },
  {
    id: "tools",
    label: "Required tools",
    weight: 10,
    patterns: [/tools?/i, /commands?/i, /dependencies?/i]
  },
  {
    id: "side-effects",
    label: "Side-effect boundaries",
    weight: 15,
    patterns: [/side[- ]effects?/i, /write/i, /external actions?/i, /network/i]
  },
  {
    id: "approval",
    label: "Approval requirements",
    weight: 15,
    patterns: [/approval/i, /confirm/i, /permission/i]
  },
  {
    id: "examples",
    label: "Examples",
    weight: 15,
    patterns: [/examples?/i, /```/]
  },
  {
    id: "validation",
    label: "Validation workflow",
    weight: 15,
    patterns: [/validat/i, /verif/i, /tests?/i, /smoke/i]
  },
  {
    id: "limitations",
    label: "Limitations",
    weight: 5,
    patterns: [/limitations?/i, /non-goals?/i, /do not/i]
  }
];

const RISK_TERMS = [
  { term: "credential", pattern: /credentials?|secrets?|tokens?/i },
  { term: "external write", pattern: /send|publish|post|upload|delete|write|modify/i },
  { term: "live account", pattern: /account|crm|slack|github|notion|salesforce|linear/i }
];

export function auditSkillMarkdown(markdown, options = {}) {
  const minScore = options.minScore ?? 80;
  const normalized = markdown.trim();
  const sectionHits = REQUIRED_COVERAGE.map((rule) => {
    const matched = rule.patterns.some((pattern) => pattern.test(normalized));
    return { ...rule, matched };
  });
  const score = sectionHits
    .filter((rule) => rule.matched)
    .reduce((total, rule) => total + rule.weight, 0);
  const missing = sectionHits
    .filter((rule) => !rule.matched)
    .map((rule) => ({ id: rule.id, label: rule.label, weight: rule.weight }));
  const risks = detectRisks(normalized);
  const findings = [
    ...missing.map((item) => ({
      level: item.weight >= 15 ? "error" : "warn",
      rule: item.id,
      message: `Missing coverage for ${item.label}.`
    })),
    ...risks
  ];
  const passed = score >= minScore && !findings.some((finding) => finding.level === "error");

  return {
    path: options.path ?? "<memory>",
    score,
    minScore,
    passed,
    findings,
    coverage: sectionHits.map(({ id, label, weight, matched }) => ({
      id,
      label,
      weight,
      matched
    }))
  };
}

function detectRisks(markdown) {
  const riskTerms = RISK_TERMS.filter((risk) => risk.pattern.test(markdown));
  if (riskTerms.length === 0) {
    return [];
  }

  const hasApproval = /approval|confirm|permission|ask the user/i.test(markdown);
  const hasDryRun = /dry[- ]run|preview|plan only|local[- ]first/i.test(markdown);
  const findings = [];

  if (!hasApproval) {
    findings.push({
      level: "error",
      rule: "risk-approval",
      message: `Potential ${riskTerms.map((risk) => risk.term).join(", ")} behavior lacks approval language.`
    });
  }

  if (!hasDryRun) {
    findings.push({
      level: "warn",
      rule: "risk-dry-run",
      message: "Risky behavior should describe dry-run, preview, or local-first boundaries."
    });
  }

  return findings;
}

export function formatTextReport(report) {
  const status = report.passed ? "PASS" : "FAIL";
  const lines = [`${status} ${report.path} score=${report.score}/${report.minScore}`];
  for (const finding of report.findings) {
    lines.push(`- ${finding.level.toUpperCase()} ${finding.rule}: ${finding.message}`);
  }
  if (report.findings.length === 0) {
    lines.push("- no findings");
  }
  return lines.join("\n");
}
