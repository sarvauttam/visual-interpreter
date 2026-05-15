export function bindClearEditorAction({
  dom,
  editor,
  runner,
  draftStorage,
  renderEmptyExplanationState,
  renderAllModeBadges,
  renderInlineNote,
}) {
  dom.clearBtn?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Clear the editor and remove the saved draft?"
    );

    if (!confirmed) return;

    const hadCode = editor.getCode().trim().length > 0;

    editor.clearEditor();
    runner.renderClearedOutput();
    renderEmptyExplanationState(dom.explanationContent);
    renderAllModeBadges(dom, { mode: "empty" });
    draftStorage.clear();

    if (hadCode) {
      renderInlineNote(
        dom.explanationContent,
        "The editor has been cleared. Waiting for code.",
        "info"
      );
    }
  });
}