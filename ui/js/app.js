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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(isoString) {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderInlineNote(container, message, variant = "info") {
  if (!container) return;

  const note = document.createElement("div");
  note.className = `status-inline-note status-inline-note--${variant}`;
  note.textContent = message;

  container.prepend(note);

  window.setTimeout(() => {
    note.remove();
  }, 2500);
}

function getModeBadgeVariant(profile) {
  if (!profile || profile.mode === "empty") {
    return "neutral";
  }

  if (profile.mode === "run") {
    return "run";
  }

  return "explain";
}

function setModeBadgeState(element, baseClassName, text, variant) {
  if (!element) return;

  element.className = `mode-badge ${baseClassName} mode-badge--${variant}`;
  element.textContent = text;
}

function getSourceBadgeText(profile) {
  if (!profile || profile.mode === "empty") {
    return "Waiting for code";
  }

  if (profile.mode === "run") {
    return "Run mode: simplified teaching language";
  }

  const confidenceText =
    profile.confidence === "high"
      ? ""
      : profile.confidence === "medium"
        ? " (best match)"
        : " (tentative)";

  return `Explain-only mode: ${profile.language}${confidenceText}`;
}

function getPanelBadgeText(profile) {
  if (!profile || profile.mode === "empty") {
    return "Waiting";
  }

  if (profile.mode === "run") {
    return "Run mode";
  }

  const confidenceText =
    profile.confidence === "high"
      ? ""
      : profile.confidence === "medium"
        ? " · best match"
        : " · tentative";

  return `Explain-only · ${profile.language}${confidenceText}`;
}

function renderSourceModeBadge(dom, profile) {
  setModeBadgeState(
    dom.sourceModeBadge,
    "source-mode-badge",
    getSourceBadgeText(profile),
    getModeBadgeVariant(profile)
  );
}

function renderOutputModeBadge(dom, profile) {
  setModeBadgeState(
    dom.outputModeBadge,
    "output-mode-badge",
    getPanelBadgeText(profile),
    getModeBadgeVariant(profile)
  );
}

function renderExplanationModeBadge(dom, profile) {
  setModeBadgeState(
    dom.explanationModeBadge,
    "explanation-mode-badge",
    getPanelBadgeText(profile),
    getModeBadgeVariant(profile)
  );
}

function renderAllModeBadges(dom, profile) {
  renderSourceModeBadge(dom, profile);
  renderOutputModeBadge(dom, profile);
  renderExplanationModeBadge(dom, profile);
}

function buildSourceModeNote(profile) {
  if (!profile || profile.mode === "empty") {
    return "Waiting for code.";
  }

  if (profile.mode === "run") {
    return "Detected simplified teaching language. This code can run in the browser interpreter.";
  }

  const confidenceText =
    profile.confidence === "high"
      ? ""
      : profile.confidence === "medium"
        ? " Best match."
        : " Tentative match.";

  return `Detected ${profile.language}. This code will be explained without execution.${confidenceText}`;
}

function createModalController(dom) {
  function openModal({ title, subtitle = "", bodyHtml = "" }) {
    if (!dom.modalBackdrop || !dom.modalTitle || !dom.modalSubtitle || !dom.modalBody) {
      return;
    }

    dom.modalTitle.textContent = title;
    dom.modalSubtitle.textContent = subtitle;
    dom.modalBody.innerHTML = bodyHtml;
    dom.modalBackdrop.classList.remove("hidden");
    dom.modalBackdrop.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!dom.modalBackdrop || !dom.modalBody) return;

    dom.modalBackdrop.classList.add("hidden");
    dom.modalBackdrop.setAttribute("aria-hidden", "true");
    dom.modalBody.innerHTML = "";
  }

  function bindModalEvents() {
    dom.modalCloseBtn?.addEventListener("click", closeModal);

    dom.modalBackdrop?.addEventListener("click", (event) => {
      if (event.target === dom.modalBackdrop) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    });
  }

  return {
    openModal,
    closeModal,
    bindModalEvents,
  };
}

function renderHowToUseModal(modal) {
  modal.openModal({
    title: "How to Use ISeeCode",
    subtitle: "A quick guide to writing, understanding, and running code here",
    bodyHtml: `
      <section class="modal-section">
        <h3>What ISeeCode does</h3>
        <p>
          ISeeCode helps you write code, understand what each line means,
          and see what your program produces when it runs.
        </p>
      </section>

      <section class="modal-section">
        <h3>How to use it</h3>
        <ul class="modal-list">
          <li>Write your code in the editor on the left.</li>
          <li>As complete lines appear, explanations will show on the right.</li>
          <li>If a line is unfinished, ISeeCode gives a helpful hint instead of guessing.</li>
          <li>Click <strong>Run</strong> to execute the code and view the output below.</li>
          <li>After a run, explanations can include runtime-aware notes as well.</li>
        </ul>
      </section>

      <section class="modal-section">
        <h3>What this interface is for</h3>
        <p>
          This interface is designed for learning, not for debugging like a technical developer dashboard.
        </p>
      </section>
    `,
  });
}

function renderAccountModal(modal) {
  modal.openModal({
    title: "Account",
    subtitle: "This area is reserved for future saved-work and profile features",
    bodyHtml: `
      <section class="modal-section">
        <h3>Not connected yet</h3>
        <p>
          Account features are not active yet. This space can later hold saved work,
          preferences, syncing, or user profile settings.
        </p>
      </section>
    `,
  });
}

function updateHistoryButtonState(dom, history) {
  dom.historyBtn?.classList.toggle("has-history", history.hasItems());
}

function renderHistoryModal({
  modal,
  history,
  editor,
  dom,
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
            <h3>${item.ok ? "Successful run" : "Run with issue"}</h3>
            <p class="history-meta">${escapeHtml(formatDate(item.createdAt))}</p>
            <div class="history-preview">${escapeHtml(item.preview || "(no preview)")}</div>
            <div class="history-actions">
              <button class="soft-btn" type="button" data-history-action="load" data-history-id="${escapeHtml(item.id)}">Load into editor</button>
              <button class="danger-btn" type="button" data-history-action="delete" data-history-id="${escapeHtml(item.id)}">Delete</button>
            </div>
          </article>
        `).join("")}
      </div>

      <section class="modal-section">
        <div class="history-actions">
          <button class="text-btn" type="button" data-history-action="clear-all">Clear all history</button>
        </div>
      </section>
    `,
  });

  dom.modalBody?.querySelectorAll("[data-history-action='load']").forEach((button) => {
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

  dom.modalBody?.querySelectorAll("[data-history-action='delete']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-history-id");
      history.removeItem(id);
      updateHistoryButtonState(dom, history);
      renderHistoryModal({ modal, history, editor, dom });
    });
  });

  dom.modalBody?.querySelector("[data-history-action='clear-all']")?.addEventListener("click", () => {
    history.clearAll();
    updateHistoryButtonState(dom, history);
    renderHistoryModal({ modal, history, editor, dom });
  });
}

function bindTopbarActions(dom, modal, history, editor) {
  dom.howToUseBtn?.addEventListener("click", () => {
    renderHowToUseModal(modal);
  });

  dom.accountBtn?.addEventListener("click", () => {
    renderAccountModal(modal);
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

function bindUpload(dom, editor) {
  dom.uploadBtn?.addEventListener("click", () => {
    dom.fileInput?.click();
  });

  dom.fileInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      editor.setCode(text);

      const profile = detectSourceProfile(text);
      renderAllModeBadges(dom, profile);
      renderLiveExplanationPreview(dom.explanationContent, text);

      renderInlineNote(
        dom.explanationContent,
        `Loaded "${file.name}" into the editor. ${buildSourceModeNote(profile)}`,
        "success"
      );
    } catch (error) {
      console.error("Failed to read uploaded file:", error);
      renderInlineNote(
        dom.explanationContent,
        "That file could not be read.",
        "warning"
      );
    } finally {
      event.target.value = "";
    }
  });
}

function bindEditorActions(dom, editor, runner, history) {
  dom.codeInput?.addEventListener("input", () => {
    const source = editor.getCode();
    const profile = detectSourceProfile(source);

    renderAllModeBadges(dom, profile);
    renderLiveExplanationPreview(dom.explanationContent, source);
  });

  dom.clearBtn?.addEventListener("click", () => {
    const hadCode = editor.getCode().trim().length > 0;

    editor.clearEditor();
    runner.renderClearedOutput();
    renderEmptyExplanationState(dom.explanationContent);
    renderAllModeBadges(dom, { mode: "empty" });

    if (hadCode) {
      renderInlineNote(
        dom.explanationContent,
        "The editor has been cleared. Waiting for code.",
        "info"
      );
    }
  });

  dom.runBtn?.addEventListener("click", async () => {
    const source = editor.getCode();
    const profile = detectSourceProfile(source);

    if (!source.trim()) {
      runner.renderClearedOutput();
      renderEmptyExplanationState(dom.explanationContent);
      renderInlineNote(
        dom.explanationContent,
        "Write some code first before running or explaining it.",
        "warning"
      );
      return;
    }

    if (profile.mode === "explain-only") {
      renderExplainOnlyExplanation(dom.explanationContent, source, profile);

      runner.renderExplainOnlyOutput(
        dom.outputContent,
        profile.language,
        profile.reason,
        profile.confidence
      );
      renderOutputModeBadge(dom, profile);
      renderExplanationModeBadge(dom, profile);

      renderInlineNote(
        dom.explanationContent,
        `Switched to explain-only mode for ${profile.language}.`,
        "info"
      );

      history.saveRun({
        source,
        stdoutText: buildExplainOnlyHistoryMessage(profile),
        ok: true,
        errorText: "",
      });

      updateHistoryButtonState(dom, history);
      return;
    }

    renderOutputModeBadge(dom, profile);
    renderExplanationModeBadge(dom, profile);

    const runResult = await runner.runSource(source);

    renderRunExplanationPreview(dom.explanationContent, source, runResult);

    if (source.trim()) {
      history.saveRun({
        source,
        stdoutText: runResult.stdoutText,
        ok: runResult.ok,
        errorText: runResult.errorText,
      });

      updateHistoryButtonState(dom, history);
    }
  });
}

function initApp() {
  const dom = getDom();

  const editor = createEditorController(dom);
  const runner = createRunner(dom);
  const history = createHistoryController();
  const modal = createModalController(dom);

  editor.init();
  runner.init();
  history.init();
  modal.bindModalEvents();

  renderEmptyExplanationState(dom.explanationContent);
  runner.renderClearedOutput();
  renderAllModeBadges(dom, { mode: "empty" });
  updateHistoryButtonState(dom, history);

  bindTopbarActions(dom, modal, history, editor);
  bindUpload(dom, editor);
  bindEditorActions(dom, editor, runner, history);

  console.log("ISeeCode Phase E cleanup and polish loaded.");
}

document.addEventListener("DOMContentLoaded", initApp);