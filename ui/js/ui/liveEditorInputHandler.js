import { renderUnsupportedLanguageInputState } from "./languageInputView.js";

export function handleLiveEditorInput({
  dom,
  editor,
  guidedMode,
  diagnostics,
  draftStorage,
  libraryInfo,
  getActiveLanguage,
  detectSourceProfile,
  renderAllModeBadges,
  renderLiveExplanationPreview,
}) {
  const source = editor.getCode();

  const profile = detectSourceProfile(source);

  const activeLanguage = getActiveLanguage
    ? getActiveLanguage()
    : {
        id: "cpp",
        supportsDiagnostics: true,
        supportsLibraryInfo: true,
      };

  if (activeLanguage.id === "cpp") {
    renderAllModeBadges(dom, profile);

    renderLiveExplanationPreview(
      dom.explanationContent,
      source
    );
  } else {
    renderUnsupportedLanguageInputState({
      dom,
      activeLanguage,
    });
  }

  if (activeLanguage.supportsGuidedMode && guidedMode) {
    guidedMode.handleInput();
  }

  if (activeLanguage.supportsLibraryInfo && libraryInfo) {
    libraryInfo.render(source);
  }

  if (activeLanguage.supportsDiagnostics && diagnostics) {
    diagnostics.schedule(source);
  }

  draftStorage.scheduleSave();
}