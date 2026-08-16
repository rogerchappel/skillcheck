const REQUIRED_COVERAGE = [
  {
    id: "when-to-use",
    label: "When to use",
    weight: 15,
    patterns: [/\bwhen to use\b/i, /\btriggers?\b/i]
  },
  {
    id: "inputs",
    label: "Required inputs",
    weight: 10,
    patterns: [/\binputs?\b/i, /\brequirements?\b/i, /\bprerequisites?\b/i]
  },
  {
    id: "tools",
    label: "Required tools",
    weight: 10,
    patterns: [/\btools?\b/i, /\bcommands?\b/i, /\bdependencies\b/i]
  },
  {
    id: "side-effects",
    label: "Side-effect boundaries",
    weight: 15,
    patterns: [/\bside[- ]effects?\b/i, /\bsafety boundaries?\b/i, /\bexternal actions?\b/i]
  },
  {
    id: "approval",
    label: "Approval requirements",
    weight: 15,
    patterns: [/\bapprovals?\b/i, /\bconfirmation\b/i, /\bpermissions?\b/i]
  },
  {
    id: "examples",
    label: "Examples",
    weight: 15,
    patterns: [/\bexamples?\b/i, /\busage examples?\b/i]
  },
  {
    id: "validation",
    label: "Validation workflow",
    weight: 15,
    patterns: [/\bvalidation\b/i, /\bverification\b/i, /\btesting\b/i]
  },
  {
    id: "limitations",
    label: "Limitations",
    weight: 5,
    patterns: [/\blimitations?\b/i, /\bnon-goals?\b/i, /\bout of scope\b/i]
  }
];

const EXTERNAL_ACTION =
  /\b(?:send(?:s)?|publish(?:es)?|post(?:s)?|upload(?:s)?|delete(?:s)?|write(?:s)?|modify|modifies|access(?:es)?)\b/i;
const LIVE_ACCOUNT = /\b(?:accounts?|crm|slack|github|notion|salesforce|linear)\b/i;
const CREDENTIAL = /\b(?:credentials?|secrets?|tokens?)\b/i;
const PROHIBITION =
  /\b(?:do|does|will|must|should|can|may)\s+not\b|\bnever\b|\b(?:read|local)[- ]only\b/i;
const INDEPENDENT_ACTION_CLAUSE =
  /\band\s+(?=(?:then\s+)?(?:(?:it|this skill|the skill|the tool|we|you)\s+)?(?:sends|publishes|posts|uploads|deletes|writes|modifies|accesses)\b)|\bor\s+(?=(?:then\s+(?:(?:it|this skill|the skill|the tool|we|you)\s+)?|(?:it|this skill|the skill|the tool|we|you)\s+)(?:sends|publishes|posts|uploads|deletes|writes|modifies|accesses)\b)/i;
const APPROVAL_NEGATION =
  /\bno\s+(?:user\s+)?(?:approval|confirmation|permission)\b|\b(?:approval|confirmation|permission)\s+(?:is\s+)?not\s+(?:needed|required)\b|\bwithout\s+(?:asking|obtaining|requesting|receiving|seeking)?\s*(?:the\s+)?(?:user(?:'s)?\s+)?(?:approval|confirmation|permission)\b|\b(?:do|does|must|should|need)\s+not\s+(?:ask|confirm|obtain|request|seek)\b/i;
const AFFIRMATIVE_APPROVAL = [
  /\bask\s+(?:the\s+)?user\b[^.!?\n]*\b(?:approval|confirmation|permission|before)\b/i,
  /\bconfirm\s+with\s+(?:the\s+)?user\b/i,
  /\b(?:obtain|request|receive|seek|get|require|need)\b[^.!?\n]*\b(?:user\s+)?(?:approval|confirmation|permission)\b/i,
  /\b(?:approval|confirmation|permission)\b[^.!?\n]*\b(?:is\s+)?(?:needed|required|must\s+be\s+(?:obtained|received))\b/i
];

export function auditSkillMarkdown(markdown, options = {}) {
  const minScore = options.minScore ?? 80;
  const normalized = markdown.trim();
  const sections = parseMarkdownSections(normalized);
  const sectionHits = REQUIRED_COVERAGE.map((rule) => {
    const matched = sections.some(
      (section) =>
        section.content.length > 0 &&
        rule.patterns.some((pattern) => pattern.test(section.heading))
    );
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

function parseMarkdownSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = null;
  let fence = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextFence = matchFence(line, fence);
    if (nextFence.matched) {
      fence = nextFence.fence;
      if (current) current.content.push(line);
      continue;
    }
    if (fence) {
      if (current) current.content.push(line);
      continue;
    }

    const atx = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    const setext =
      index + 1 < lines.length && /^\s{0,3}(?:=+|-+)\s*$/.test(lines[index + 1])
        ? line.trim()
        : null;
    const heading = atx?.[1]?.trim() ?? setext;

    if (heading) {
      current = { heading, content: [] };
      sections.push(current);
      if (setext) index += 1;
    } else if (current) {
      current.content.push(line);
    }
  }

  return sections.map((section) => ({
    heading: section.heading,
    content: section.content.join("\n").trim()
  }));
}

function matchFence(line, fence) {
  if (fence) {
    const closing = line.match(/^ {0,3}(`+|~+)\s*$/);
    const closes =
      closing && closing[1][0] === fence.marker && closing[1].length >= fence.length;
    return { matched: Boolean(closes), fence: closes ? null : fence };
  }

  const opening = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (!opening || (opening[1][0] === "`" && opening[2].includes("`"))) {
    return { matched: false, fence: null };
  }
  return {
    matched: true,
    fence: { marker: opening[1][0], length: opening[1].length }
  };
}

function proseOutsideFences(markdown) {
  const prose = [];
  let fence = null;

  for (const line of markdown.split(/\r?\n/)) {
    const nextFence = matchFence(line, fence);
    if (nextFence.matched) {
      fence = nextFence.fence;
    } else if (!fence) {
      prose.push(line);
    }
  }
  return prose.join("\n");
}

function detectRisks(markdown) {
  const prose = proseOutsideFences(markdown);
  const actionableProse = prose
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s+/, "").trim())
    .filter(Boolean)
    .flatMap(splitRiskClauses)
    .filter((clause) => !PROHIBITION.test(clause))
    .join("\n");
  const hasExternalAction = EXTERNAL_ACTION.test(actionableProse);
  const riskTerms = [
    ...(CREDENTIAL.test(actionableProse) ? [{ term: "credential" }] : []),
    ...(hasExternalAction ? [{ term: "external write" }] : []),
    ...(hasExternalAction && LIVE_ACCOUNT.test(actionableProse) ? [{ term: "live account" }] : [])
  ];
  if (riskTerms.length === 0) {
    return [];
  }

  const hasApproval = hasAffirmativeApproval(prose);
  const hasDryRun = /dry[- ]run|preview|plan only|local[- ]first/i.test(prose);
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

function splitRiskClauses(line) {
  return line
    .split(/[.!?;:]+|\b(?:but|however|except)\b|,\s*(?=then\b)/i)
    .flatMap((clause) => clause.split(INDEPENDENT_ACTION_CLAUSE))
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function hasAffirmativeApproval(markdown) {
  const prose = proseOutsideFences(markdown)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s+/, "").trim())
    .filter(Boolean)
    .join("\n");
  const clauses = prose.split(/[.!?\n]+/).map((clause) => clause.trim());

  return clauses.some(
    (clause) =>
      !APPROVAL_NEGATION.test(clause) &&
      AFFIRMATIVE_APPROVAL.some((pattern) => pattern.test(clause))
  );
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
