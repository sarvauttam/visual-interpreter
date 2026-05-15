export function handleNonRunnableLanguage({
  activeLanguage,
  modal,
}) {
  if (activeLanguage.id === "cpp") {
    return false;
  }

  modal.openModal({
    title: `${activeLanguage.displayName || activeLanguage.label || activeLanguage.id} is not runnable yet`,
    subtitle: "C++ is currently the supported interpreter",
    bodyHtml: `
      <p>
        This language has been added to the interface, but its interpreter is not connected yet.
      </p>
      <p>
        Switch back to C++ to run code right now.
      </p>
    `,
  });

  return true;
}