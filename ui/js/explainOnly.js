import { cppProfile } from "./languageProfiles/cppProfile.js";
import { pythonProfile } from "./languageProfiles/pythonProfile.js";
import { javascriptProfile } from "./languageProfiles/javascriptProfile.js";
import { csharpProfile } from "./languageProfiles/csharpProfile.js";
import { isLikelyIncompleteLine } from "./languageProfiles/sharedRuleUtils.js";

const LANGUAGE_PROFILES = [
  cppProfile,
  pythonProfile,
  javascriptProfile,
  csharpProfile,
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function scoreProfile(profile, text) {
  let score = 0;
  let matchedSignals = 0;

  for (const signal of profile.signals || []) {
    const pattern = signal.pattern;
    const weight = signal.weight ?? 1;

    if (pattern.test(text)) {
      score += weight;
      matchedSignals += 1;
    }
  }

  return {
    profile,
    score,
    matchedSignals,
  };
}

function countChar(text, target) {
  return [...String(text || "")].filter((char) => char === target).length;
}

function detectPartialSource(text) {
  const value = String(text || "");
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const meaningfulLines = lines.filter((line) => line.trim());

  const unmatchedPairs =
    countChar(value, "(") > countChar(value, ")") ||
    countChar(value, "{") > countChar(value, "}") ||
    countChar(value, "[") > countChar(value, "]");

  const trailingIncompleteLine = meaningfulLines.some((line) =>
    isLikelyIncompleteLine(line)
  );

  return unmatchedPairs || trailingIncompleteLine;
}

function buildCompetingLanguages(scoredProfiles) {
  return scoredProfiles.slice(0, 2).map((entry) => entry.profile.language);
}

function scoreTeachingLanguage(text) {
  let score = 0;

  const signals = [
    { pattern: /^\s*let\s+[A-Za-z_]\w*\s*=/m, weight: 7 },
    { pattern: /^\s*func\s+[A-Za-z_]\w*\s*\(/m, weight: 8 },
    { pattern: /^\s*print\s*\(/m, weight: 5 },
    { pattern: /^\s*input\s*\(\s*[A-Za-z_]\w*\s*\)\s*;/m, weight: 6 },
    { pattern: /^\s*if\s*\(/m, weight: 3 },
    { pattern: /^\s*while\s*\(/m, weight: 3 },
    { pattern: /^\s*return\b/m, weight: 2 },
    { pattern: /\btrue\b|\bfalse\b/, weight: 2 },
  ];

  for (const signal of signals) {
    if (signal.pattern.test(text)) {
      score += signal.weight;
    }
  }

  // Strong negative signals for real-world languages
  const negativeSignals = [
    /^\s*#include\b/m,
    /^\s*using\s+namespace\b/m,
    /\bstd::/,
    /\bcout\s*<</,
    /\bcin\s*>>/,
    /^\s*import\b/m,
    /^\s*from\b.+\bimport\b/m,
    /^\s*def\s+\w+\s*\(/m,
    /^\s*class\s+\w+\s*:/m,
    /\bconsole\.log\s*\(/,
    /\bdocument\./,
    /^\s*namespace\s+\w+/m,
    /\bConsole\.Write(Line)?\s*\(/,
  ];

  for (const pattern of negativeSignals) {
    if (pattern.test(text)) {
      score -= 8;
    }
  }

  return score;
}

function isTeachingLanguageRunnable(text) {
  return scoreTeachingLanguage(text) >= 7;
}

export function detectSourceProfile(source) {
  const text = String(source || "");
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      mode: "empty",
      language: "Unknown",
      reason: "",
      profile: null,
      confidence: 0,
      matchedSignals: 0,
      competingLanguages: [],
      isMixed: false,
      isPartialSource: false,
    };
  }

  const isPartialSource = detectPartialSource(text);

  const trimmedLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

    const isTeachingSyntax =
      trimmedLines.length > 0 &&
      trimmedLines.every((line) => {
        return (
          /^print\s*\(\s*\S.*\)\s*;\s*$/.test(line) ||
          /^let\s+[A-Za-z_]\w*\s*=.+;\s*$/.test(line) ||
          /^input\s*\(\s*[A-Za-z_]\w*\s*\)\s*;\s*$/.test(line) ||
          /^if\s*\(.+\)\s*\{\s*$/.test(line) ||
          /^while\s*\(.+\)\s*\{\s*$/.test(line) ||
          /[<>!=]=?/.test(line) ||
          /^else\s*\{\s*$/.test(line) ||
          /^else\s+if\s*\(.+\)\s*\{\s*$/.test(line) ||
          /^\w+\s*=\s*.+;\s*$/.test(line) ||
          /^else\s*\{\s*$/.test(line) ||
          /^else\s+if\s*\(.+\)\s*\{\s*$/.test(line) ||
          /^\w+\s*=\s*.+;\s*$/.test(line) ||
          /^return\b.*;?\s*$/.test(line) ||
          /^\}\s*$/.test(line)
        );
      });

  if (isTeachingSyntax) {
    return {
      mode: "run",
      language: "Teaching Syntax",
      reason:
        "This source matches the supported beginner teaching syntax and can run in the browser interpreter.",
      confidence: "high",
      matchedSignals: 0,
      competingLanguages: [],
      isMixed: false,
      isPartialSource,
    };
  }

  // Priority 1: runnable teaching language
  if (isTeachingLanguageRunnable(text)) {
    return {
      mode: "run",
      language: "Mini-language",
      reason:
        "This source matches the simplified teaching language, so it can run in the browser interpreter.",
      profile: null,
      confidence: "high",
      matchedSignals: 0,
      competingLanguages: [],
      isMixed: false,
      isPartialSource,
    };
  }

  const scoredProfiles = LANGUAGE_PROFILES
    .map((profile) => scoreProfile(profile, text))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.matchedSignals - a.matchedSignals;
    });

  if (scoredProfiles.length) {
    const best = scoredProfiles[0];
    const second = scoredProfiles[1] || null;

    const confidence =
      second == null
        ? "high"
        : best.score >= second.score + 3
          ? "high"
          : best.score > second.score
            ? "medium"
            : "low";

    const competingLanguages = buildCompetingLanguages(scoredProfiles);
    const isMixed =
      competingLanguages.length > 1 &&
      (confidence === "low" || confidence === "medium");

    let reason = best.profile.reason;

    if (confidence === "low") {
      reason = `${best.profile.reason} The language guess is tentative because the code shares patterns with more than one language.`;
    } else if (confidence === "medium") {
      reason = `${best.profile.reason} Some lines may also resemble another language or an incomplete snippet.`;
    }

    if (isPartialSource) {
      reason += " The snippet also appears to be incomplete.";
    }

    return {
      mode: "explain-only",
      language: best.profile.language,
      reason,
      profile: best.profile,
      confidence,
      matchedSignals: best.matchedSignals,
      competingLanguages,
      isMixed,
      isPartialSource,
    };
  }

  return {
    mode: "run",
    language: "Mini-language",
    reason:
      "This source does not strongly match a separate full language, so it can be sent to the teaching interpreter.",
    profile: null,
    confidence: "high",
    matchedSignals: 0,
    competingLanguages: [],
    isMixed: false,
    isPartialSource,
  };
}

export function buildExplainOnlyHistoryMessage(profile) {
  return `Explained as ${profile.language} without execution.`;
}

function buildExplanationPrefix(code, sourceProfile) {
  const parts = [];
  const language = sourceProfile?.language || "this language";
  const confidence = sourceProfile?.confidence || "high";

  if (confidence === "low") {
    parts.push(
      `This looks like ${language}, but the snippet may be mixed or incomplete.`
    );
  } else if (confidence === "medium") {
    parts.push(`This appears to be ${language}.`);
  }

  if (sourceProfile?.isPartialSource && isLikelyIncompleteLine(code)) {
    parts.push("This line may be incomplete.");
  }

  return parts.join(" ");
}

function buildExplainOnlyExplanation(profile, source, sourceProfile) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  const items = [];

  function add(lineNumber, code, explanation) {
    if (!String(code || "").trim()) return;

    const prefix = buildExplanationPrefix(code, sourceProfile);
    const finalExplanation = prefix
      ? `${prefix} ${explanation}`
      : explanation;

    items.push({
      lineNumber,
      code,
      explanation: finalExplanation,
    });
  }

  const explainOptions = {
    confidence: sourceProfile?.confidence || "high",
    isMixed: !!sourceProfile?.isMixed,
    isPartialSource: !!sourceProfile?.isPartialSource,
    competingLanguages: sourceProfile?.competingLanguages || [],
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    

    if (!line.trim()) return;

    if (profile?.explainLine) {
      profile.explainLine(line, lineNumber, add, explainOptions);
    } else {
      add(
        lineNumber,
        line,
        "This line is part of the code and contributes to the program logic."
      );
    }
  });

  return items;
}

export function renderExplainOnlyExplanation(container, source, sourceProfile) {
  const steps = buildExplainOnlyExplanation(
    sourceProfile.profile,
    source,
    sourceProfile
  );

  if (!container) return;

  if (!steps.length) {
    container.innerHTML = `
      <div class="explanation-placeholder">
        <h3>Ready to explain your code</h3>
        <p>Your code explanations will appear here after you run the program.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    ${steps
      .map(
        (step, index) => `
          <div class="explanation-step card">
            <div class="explanation-step__meta">Line ${step.lineNumber}</div>
            <pre class="explanation-step__code"><code>${escapeHtml(
              step.code || ""
            )}</code></pre>
            <p class="explanation-step__text">${escapeHtml(
              step.explanation || ""
            )}</p>
            <div class="explanation-step__count">Explain-only step ${
              index + 1
            } of ${steps.length}</div>
          </div>
        `
      )
      .join("")}
  `;
}