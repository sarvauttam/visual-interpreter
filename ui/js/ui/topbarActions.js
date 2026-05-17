export function bindTopbarActions({
  dom,
  modal,
  history,
  editor,
  tutorial,
  guidedMode,
  templates,
  renderHistoryModal,
  renderAccountModal,
}) {
  dom.howToUseBtn?.addEventListener("click", () => {
    tutorial.start({ force: true });
  });

  dom.accountBtn?.addEventListener("click", () => {
    renderAccountModal(modal);
  });

  document.getElementById("templatesBtn")?.addEventListener("click", () => {
    templates.openTemplatesModal();
  });

  dom.historyBtn?.addEventListener("click", () => {
    renderHistoryModal({
      modal,
      history,
      editor,
      dom,
    });
  });
}