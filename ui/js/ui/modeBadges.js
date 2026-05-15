function getModeBadgeVariant(profile) {
  if (!profile || profile.mode === "empty") return "neutral";
  if (profile.mode === "run") return "run";
  return "explain";
}

function setModeBadgeState(element, baseClassName, text, variant) {
  if (!element) return;

  element.className = `mode-badge ${baseClassName} mode-badge--${variant}`;
  element.textContent = text;
}

function getSourceBadgeText(profile) {
  if (!profile || profile.mode === "empty") return "Waiting for code";

  if (profile.mode === "run") {
    return "Run mode: simplified teaching language";
  }

  const confidenceText =
    profile.confidence === "high"
      ? ""
      : profile.confidence === "medium"
        ? " (best match)"
        : " (tentative)";

  return `Explain-only mode: ${profile.language}${confidenceText}`;
}

function getPanelBadgeText(profile) {
  if (!profile || profile.mode === "empty") return "Waiting";

  if (profile.mode === "run") return "Run mode";

  const confidenceText =
    profile.confidence === "high"
      ? ""
      : profile.confidence === "medium"
        ? " · best match"
        : " · tentative";

  return `Explain-only · ${profile.language}${confidenceText}`;
}

export function renderSourceModeBadge(dom, profile) {
  setModeBadgeState(
    dom.sourceModeBadge,
    "source-mode-badge",
    getSourceBadgeText(profile),
    getModeBadgeVariant(profile)
  );
}

export function renderOutputModeBadge(dom, profile) {
  setModeBadgeState(
    dom.outputModeBadge,
    "output-mode-badge",
    getPanelBadgeText(profile),
    getModeBadgeVariant(profile)
  );
}

export function renderExplanationModeBadge(dom, profile) {
  setModeBadgeState(
    dom.explanationModeBadge,
    "explanation-mode-badge",
    getPanelBadgeText(profile),
    getModeBadgeVariant(profile)
  );
}

export function renderAllModeBadges(dom, profile) {
  renderSourceModeBadge(dom, profile);
  renderOutputModeBadge(dom, profile);
  renderExplanationModeBadge(dom, profile);
}