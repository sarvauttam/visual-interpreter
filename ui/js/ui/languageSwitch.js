export function handleLanguageChange({
  dom,
  modal,
  getLanguageProfile,
  renderAllModeBadges,
  setActiveLanguage,
}) {
  dom.languageSelect?.addEventListener("change", () => {
    const activeLanguage = getLanguageProfile(
      dom.languageSelect.value
    );

    setActiveLanguage(activeLanguage);

    renderAllModeBadges(dom, {
      mode:
        activeLanguage.id === "cpp"
          ? "empty"
          : "Language not active yet",
    });

    if (activeLanguage.id === "python") {
      modal.openModal({
        title: "Python support coming soon",
        subtitle: "C++ is currently the active supported language",
        bodyHtml: `
          <p>
            Python has been added to the project structure, but its interpreter,
            diagnostics, guided mode, and explanations are not connected yet.
          </p>

          <p>
            You can switch back to C++ to use all current ISeeCode features.
          </p>
        `,
      });
    }
  });
}