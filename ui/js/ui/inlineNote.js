export function renderInlineNote(container, message, variant = "info") {
  if (!container) return;

  const note = document.createElement("div");
  note.className = `status-inline-note status-inline-note--${variant}`;
  note.textContent = message;

  container.prepend(note);

  window.setTimeout(() => {
    note.remove();
  }, 2500);
}