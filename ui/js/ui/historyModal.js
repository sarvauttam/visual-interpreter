import { escapeHtml } from "../core/html.js";

function formatDate(isoString) {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function renderHistoryModal({
  modal,
  history,
  editor,
  dom,
  detectSourceProfile,
  renderAllModeBadges,
  renderLiveExplanationPreview,
  buildSourceModeNote,
  buildExplainOnlyHistoryMessage,
  renderInlineNote,
}) {
  const items = history.getItems();

  if (!items.length) {
    modal.openModal({
      title: "History",
      subtitle: "Recent runs saved in your browser",
      bodyHtml: `
        <article class="card card--dashed history-card history-card--empty-state">
          <h3>No saved runs yet</h3>
          <p>
            Once you run code, your recent attempts will appear here so you can reopen them later.
          </p>
        </article>
      `,
    });

    return;
  }

  modal.openModal({
    title: "History",
    subtitle: "Recent runs saved in your browser",
    bodyHtml: `
      <div class="history-list">
        ${items.map((item) => `
          <article class="card history-card" data-history-id="${escapeHtml(item.id)}">
            <h3>${escapeHtml(item.name || "Untitled code")}</h3>
            <p class="history-meta">${escapeHtml(formatDate(item.createdAt))}</p>
            <div class="history-preview">${escapeHtml(item.preview || "(no preview)")}</div>

            <div class="history-actions">
              <button type="button" data-history-action="load" data-history-id="${item.id}">
                Load
              </button>

              <button type="button" data-history-action="rename" data-history-id="${item.id}">
                Rename
              </button>

              <button type="button" data-history-action="delete" data-history-id="${item.id}">
                Delete
              </button>
            </div>
          </article>
        `).join("")}
      </div>

      <section class="modal-section">
        <div class="history-actions">
          <button class="text-btn" type="button" data-history-action="clear-all">
            Clear all history
          </button>
        </div>
      </section>
    `,
  });

  dom.modalBody
    ?.querySelectorAll("[data-history-action='load']")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-history-id");
        const item = history.getItem(id);

        if (!item) return;

        editor.setCode(item.source);

        const profile = detectSourceProfile(item.source);

        renderAllModeBadges(dom, profile);
        renderLiveExplanationPreview(dom.explanationContent, item.source);

        modal.closeModal();

        renderInlineNote(
          dom.explanationContent,
          `Restored code from history. ${buildSourceModeNote(profile)}`,
          "info"
        );
      });
    });

  dom.modalBody
    ?.querySelectorAll("[data-history-action='rename']")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-history-id");

        const item = history.getItem(id);

        if (!item) return;

        const nextName = window.prompt(
          "Rename this saved code:",
          item.name || item.preview || "Untitled code"
        );

        if (!nextName || !nextName.trim()) {
          return;
        }

        history.renameItem(id, nextName);

        renderHistoryModal({
          modal,
          history,
          editor,
          dom,
          detectSourceProfile,
          renderAllModeBadges,
          renderLiveExplanationPreview,
          buildSourceModeNote,
          buildExplainOnlyHistoryMessage,
          renderInlineNote,
        });
      });
    });

  dom.modalBody
    ?.querySelectorAll("[data-history-action='delete']")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-history-id");

        const item = history.getItem(id);

        if (!item) return;

        const ok = window.confirm(
          `Delete "${item.name || item.preview || "this saved code"}"?`
        );

        if (!ok) return;

        history.removeItem(id);

        renderHistoryModal({
          modal,
          history,
          editor,
          dom,
          detectSourceProfile,
          renderAllModeBadges,
          renderLiveExplanationPreview,
          buildSourceModeNote,
          buildExplainOnlyHistoryMessage,
          renderInlineNote,
        });
      });
    });

  dom.modalBody
    ?.querySelector("[data-history-action='clear-all']")
    ?.addEventListener("click", () => {
      const ok = window.confirm("Delete all saved history?");
      if (!ok) return;

      history.clearAll();

      renderHistoryModal({
        modal,
        history,
        editor,
        dom,
        detectSourceProfile,
        renderAllModeBadges,
        renderLiveExplanationPreview,
        buildSourceModeNote,
        buildExplainOnlyHistoryMessage,
        renderInlineNote,
      });
    });
}