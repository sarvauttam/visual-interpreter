export async function handleRunClick({
  dom,
  editor,
  runner,
  history,
  diagnostics,
  getActiveLanguage,
  modal,
  handleEmptyRun,
  handleNonRunnableLanguage,
  detectSourceProfile,
  handleExplainOnlySource,
  handleRunnableSource,
  renderEmptyExplanationState,
  renderInlineNote,
}) {
  const source = editor.getCode();

  if (
    handleEmptyRun({
      source,
      runner,
      dom,
      renderEmptyExplanationState,
      renderInlineNote,
    })
  ) {
    return;
  }

  const activeLanguage = getActiveLanguage
    ? getActiveLanguage()
    : { id: "cpp", displayName: "C++", supportsDiagnostics: true };

  if (
    handleNonRunnableLanguage({
      activeLanguage,
      modal,
    })
  ) {
    return;
  }

  const diagnosticErrors = diagnostics ? diagnostics.checkForRun(source) : [];

  if (diagnosticErrors.length > 0) {
    return;
  }

  const profile = detectSourceProfile(source);

  if (handleExplainOnlySource({ source, profile })) {
    return;
  }

  await handleRunnableSource({ source, profile });
}