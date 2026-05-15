export function handleEmptyRun({
  source,
  runner,
  dom,
  renderEmptyExplanationState,
  renderInlineNote,
}) {
  if (source.trim()) {
    return false;
  }

  runner.renderClearedOutput();
  renderEmptyExplanationState(dom.explanationContent);

  renderInlineNote(
    dom.explanationContent,
    "Write some code first before running or explaining it.",
    "warning"
  );

  return true;
}