import { createTutorialController } from "./tutorial.js";
import { createGuidedModeController } from "./languages/cpp/guidedMode.js";
import { createCppDiagnosticsController } from "./languages/cpp/cppDiagnostics.js";
import { createDraftStorageController } from "./draftStorage.js";
import { createTemplatesController } from "./templates.js";
import { createLibraryInfoController } from "./languages/cpp/libraryInfo.js";
import { createLineNumbersController } from "./lineNumbers.js";
import { createEditorIndentationController } from "./editorIndentation.js";
import { getLanguageProfile } from "./languageProfiles/index.js";
import { createModalController } from "./ui/modal.js";
import {
  renderAllModeBadges,
  renderOutputModeBadge,
  renderExplanationModeBadge,
} from "./ui/modeBadges.js";
import { renderHistoryModal } from "./ui/historyModal.js";

import { getDom } from "./dom.js";
import { createEditorController } from "./editor.js";
import {
  renderEmptyExplanationState,
  renderLiveExplanationPreview,
  renderRunExplanationPreview,
} from "./explanations.js";
import {
  detectSourceProfile,
  buildExplainOnlyHistoryMessage,
  renderExplainOnlyExplanation,
} from "./explainOnly.js";
import { createRunner } from "./runner.js";
import { createHistoryController } from "./history.js";

import {
  renderHowToUseModal,
  renderAccountModal,
} from "./ui/infoModals.js";

import { bindUpload } from "./ui/upload.js";

import { buildSourceModeNote } from "./ui/sourceModeNote.js";

import { renderInlineNote } from "./ui/inlineNote.js";

import { updateHistoryButtonState } from "./ui/historyButton.js";
import { bindTopbarActions } from "./ui/topbarActions.js";

import { handleLanguageChange } from "./ui/languageSwitch.js";

import { handleEmptyRun } from "./ui/emptyRunGuard.js";

import { handleNonRunnableLanguage } from "./ui/nonRunnableLanguageGuard.js";

import { bindClearEditorAction } from "./ui/clearEditorAction.js";

import { renderUnsupportedLanguageInputState } from "./ui/languageInputView.js";

import { handleRunnableSource } from "./ui/runModeHandler.js";

import { handleExplainOnlySource } from "./ui/explainOnlyRunHandler.js";

import { handleLiveEditorInput } from "./ui/liveEditorInputHandler.js";

import { handleRunClick } from "./ui/runClickHandler.js";

import { createGuidesDropdownController } from "./ui/guidesDropdown.js";

function bindEditorActions(
  dom,
  editor,
  runner,
  history,
  guidedMode,
  diagnostics,
  draftStorage,
  libraryInfo,
  getActiveLanguage,
  modal
) {

  dom.codeInput?.addEventListener("input", () => {
    handleLiveEditorInput({
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
    });
  });

  dom.runBtn?.addEventListener("click", async () => {
    await handleRunClick({
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
      handleExplainOnlySource: (args) =>
        handleExplainOnlySource({
          ...args,
          dom,
          runner,
          history,
          renderExplainOnlyExplanation,
          buildExplainOnlyHistoryMessage,
          renderOutputModeBadge,
          renderExplanationModeBadge,
          renderInlineNote,
          updateHistoryButtonState,
        }),
      handleRunnableSource: (args) =>
        handleRunnableSource({
          ...args,
          runner,
          history,
          dom,
          renderOutputModeBadge,
          renderExplanationModeBadge,
          renderRunExplanationPreview,
          updateHistoryButtonState,
        }),
      renderEmptyExplanationState,
      renderInlineNote,
    });
  });
}

function initApp() {

  const dom = getDom();
  const editor = createEditorController(dom);
  const runner = createRunner(dom);
  const history = createHistoryController();
  const modal = createModalController(dom);
  const tutorial = createTutorialController(dom);
  const guidedMode = createGuidedModeController(dom, editor);

  const guidesDropdown = createGuidesDropdownController({
    modal,
    guidedMode,
  });
  const diagnostics = createCppDiagnosticsController(dom);
  const draftStorage = createDraftStorageController(editor);
  const templates = createTemplatesController(
    dom,
    editor,
    modal,
    () => activeLanguage
  );
  const libraryInfo = createLibraryInfoController(dom);
  const lineNumbers = createLineNumbersController(dom, editor);
  const editorIndentation = createEditorIndentationController(dom);


  let activeLanguage = getLanguageProfile(dom.languageSelect?.value || "cpp");

  handleLanguageChange({
  dom,
  modal,
  getLanguageProfile,
  renderAllModeBadges,
  setActiveLanguage: (nextLanguage) => {
    activeLanguage = nextLanguage;
  },
});

  editor.init();
  runner.init();
  history.init();
  modal.bindModalEvents();
  guidesDropdown.init();
  tutorial.init();
  draftStorage.restore();
  lineNumbers.init();
  editorIndentation.init();
  renderEmptyExplanationState(dom.explanationContent);
  runner.renderClearedOutput();
  renderAllModeBadges(dom, { mode: "empty" });
  updateHistoryButtonState(dom, history);


bindTopbarActions({
  dom,
  modal,
  history,
  editor,
  tutorial,
  guidedMode,
  templates,
  renderHistoryModal: (args) =>
    renderHistoryModal({
      ...args,
      detectSourceProfile,
      renderAllModeBadges,
      renderLiveExplanationPreview,
      buildSourceModeNote,
      buildExplainOnlyHistoryMessage,
      renderInlineNote,
    }),
  renderAccountModal,
});

bindEditorActions(
  dom,
  editor,
  runner,
  history,
  guidedMode,
  diagnostics,
  draftStorage,
  libraryInfo,
  () => activeLanguage,
  modal
);

bindClearEditorAction({
  dom,
  editor,
  runner,
  draftStorage,
  renderEmptyExplanationState,
  renderAllModeBadges,
  renderInlineNote,
});

  bindUpload(dom, editor);

  console.log("ISeeCode Phase E cleanup and polish loaded.");
}

document.addEventListener("DOMContentLoaded", initApp);