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

  document.getElementById("guidedCppBtn")?.addEventListener("click", () => {
    const selectedLanguage =
      document.getElementById("languageSelect")?.value || "cpp";

    if (selectedLanguage !== "cpp") {
      modal.openModal({
        title: "Guided Mode is C++ only for now",
        subtitle: "Python guided lessons are coming later",
        bodyHtml: `
          <p>
            Guided Mode currently teaches the beginner C++ flow.
            Switch the language selector back to C++ to use it.
          </p>
        `,
      });

      return;
    }

    guidedMode.start();
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