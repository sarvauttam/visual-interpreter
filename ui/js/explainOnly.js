import { cppProfile } from "./languageProfiles/cppProfile.js";
import { pythonProfile } from "./languageProfiles/pythonProfile.js";
import { javascriptProfile } from "./languageProfiles/javascriptProfile.js";
import { csharpProfile } from "./languageProfiles/csharpProfile.js";

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

    return {
      mode: "explain-only",
      language: best.profile.language,
      reason:
        confidence === "low"
          ? `${best.profile.reason} The language guess is tentative because the code shares patterns with more than one language.`
          : best.profile.reason,
      profile: best.profile,
      confidence,
      matchedSignals: best.matchedSignals,
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
  };
}

export function buildExplainOnlyHistoryMessage(profile) {
  return `Explained as ${profile.language} without execution.`;
}

function buildExplainOnlyExplanation(profile, source) {
  const lines = String(source || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const items = [];

  function add(lineNumber, code, explanation) {
    if (!String(code || "").trim()) return;
    items.push({ lineNumber, code, explanation });
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (!line.trim()) return;

    if (profile?.explainLine) {
      profile.explainLine(line, lineNumber, add);
    } else {
      add(lineNumber, line, "This line is part of the code and contributes to the program logic.");
    }
  });

  return items;
}

export function renderExplainOnlyExplanation(container, source, sourceProfile) {
  const steps = buildExplainOnlyExplanation(sourceProfile.profile, source);

  if (!container) return;

  if (!steps.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div>
          <h3>Ready to explain your code</h3>
          <p>Your code explanations will appear here after you run the program.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="explanation-list">
      ${steps
        .map(
          (step, index) => `
            <div class="explanation-card">
              <div class="explanation-header">
                <span class="explanation-line">Line ${step.lineNumber}</span>
                <code class="explanation-code">${escapeHtml(step.code || "")}</code>
              </div>
              <div class="explanation-body">
                ${escapeHtml(step.explanation || "")}
              </div>
              <div class="explanation-footer">
                Explain-only step ${index + 1} of ${steps.length}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}