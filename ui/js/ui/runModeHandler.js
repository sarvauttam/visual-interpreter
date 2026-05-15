export async function handleRunnableSource({
  source,
  runner,
  history,
  dom,
  profile,
  renderOutputModeBadge,
  renderExplanationModeBadge,
  renderRunExplanationPreview,
  updateHistoryButtonState,
}) {
  renderOutputModeBadge(dom, profile);
  renderExplanationModeBadge(dom, profile);

  const runResult = await runner.runSource(source);

  renderRunExplanationPreview(dom.explanationContent, source, runResult);

  history.saveRun({
    source,
    stdoutText: runResult.stdoutText,
    ok: runResult.ok,
    errorText: runResult.errorText,
  });

  updateHistoryButtonState(dom, history);
}