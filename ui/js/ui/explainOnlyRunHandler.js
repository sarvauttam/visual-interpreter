export function handleExplainOnlySource({
  source,
  profile,
  dom,
  runner,
  history,
  renderExplainOnlyExplanation,
  buildExplainOnlyHistoryMessage,
  renderOutputModeBadge,
  renderExplanationModeBadge,
  renderInlineNote,
  updateHistoryButtonState,
}) {
  if (profile.mode !== "explain-only") {
    return false;
  }

  renderExplainOnlyExplanation(dom.explanationContent, source, profile);

  runner.renderExplainOnlyOutput(
    dom.outputContent,
    profile.language,
    profile.reason,
    profile.confidence
  );

  renderOutputModeBadge(dom, profile);
  renderExplanationModeBadge(dom, profile);

  renderInlineNote(
    dom.explanationContent,
    `Switched to explain-only mode for ${profile.language}.`,
    "info"
  );

  history.saveRun({
    source,
    stdoutText: buildExplainOnlyHistoryMessage(profile),
    ok: true,
    errorText: "",
  });

  updateHistoryButtonState(dom, history);

  return true;
}