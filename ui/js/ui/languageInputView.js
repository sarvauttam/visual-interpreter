export function renderUnsupportedLanguageInputState({
  dom,
  activeLanguage,
}) {
  const languageName =
    activeLanguage.displayName ||
    activeLanguage.label ||
    activeLanguage.id;

  dom.sourceModeBadge.textContent = `${languageName} selected`;
  dom.outputModeBadge.textContent = "Not runnable yet";
  dom.explanationModeBadge.textContent = "Coming soon";

  dom.explanationContent.innerHTML = `
    <div class="card card--dashed empty-state-card">
      <h3>${languageName} support is coming soon</h3>
      <p>
        This language is visible in the interface, but its interpreter,
        explanations, and diagnostics are not connected yet.
      </p>
      <p class="muted">
        Switch back to C++ to use the current learning tools.
      </p>
    </div>
  `;
}