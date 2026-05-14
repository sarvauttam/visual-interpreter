import { createTutorialController } from "./tutorial.js";
import { createGuidedModeController } from "./languages/cpp/guidedMode.js";
import { createCppDiagnosticsController } from "./languages/cpp/cppDiagnostics.js";
import { createDraftStorageController } from "./draftStorage.js";
import { createTemplatesController } from "./templates.js";
import { createLibraryInfoController } from "./languages/cpp/libraryInfo.js";
import { createLineNumbersController } from "./lineNumbers.js";
import { createEditorIndentationController } from "./editorIndentation.js";
import { getLanguageProfile } from "./languageProfiles/index.js";

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
    title: "Local Saves",
    subtitle: "Your code history is saved only in this browser",
    bodyHtml: `
      <div class="card">
        <h3>Storage status</h3>
        <p>
          ISeeCode currently saves history using your browser's local storage.
          This means your saved code stays on this browser and this device.
        </p>

        <h3>What this means</h3>
        <p>
          If you clear browser data, use private browsing, or switch devices,
          your saved history may not be available.
        </p>

        <h3>Why there is no account yet</h3>
        <p>
          Accounts are only useful after cloud sync, login, or server storage
          is added. Until then, this button is labeled Local Saves to avoid
          misleading users.
        </p>
      </div>
    `,
  });
};

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

dom.modalBody
  ?.querySelectorAll("[data-history-action='delete']")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-history-id");

      const item = history.getItem(id);

      if (!item) return;

      const confirmed = window.confirm(
        `Delete "${item.name || "Untitled code"}"?`
      );

      if (!confirmed) {
        return;
      }

      history.removeItem(id);

      updateHistoryButtonState(dom, history);

      renderHistoryModal({
        modal,
        history,
        editor,
        dom,
      });
    });
  });

  dom.modalBody?.querySelector("[data-history-action='clear-all']")?.addEventListener("click", () => {
      history.clearAll();
      updateHistoryButtonState(dom, history);
      renderHistoryModal({ modal, history, editor, dom });
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
      });
    });
  });

  dom.modalBody?.querySelectorAll("[data-history-action='delete']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-history-id");
      const item = history.getItem(id);
      if (!item) return;

      const ok = window.confirm(`Delete "${item.name || item.preview || "this saved code"}"?`);
      if (!ok) return;

      history.removeItem(id);
      updateHistoryButtonState(dom, history);
      renderHistoryModal({ modal, history, editor, dom });
    });
  });

  dom.modalBody?.querySelector("[data-history-action='clear-all']")?.addEventListener("click", () => {
    const ok = window.confirm("Delete all saved history?");
    if (!ok) return;

    history.clearAll();
    updateHistoryButtonState(dom, history);
    renderHistoryModal({ modal, history, editor, dom });
  });
}

function bindTopbarActions(dom, modal, history, editor, tutorial, guidedMode, templates) {

  dom.howToUseBtn?.addEventListener("click", () => {
    tutorial.start({ force: true });
  });

  document.getElementById("guidedCppBtn")?.addEventListener("click", () => {
    const selectedLanguage = document.getElementById("languageSelect")?.value || "cpp";

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

function bindUpload(dom, editor) {
  dom.uploadBtn?.addEventListener("click", () => {
    dom.fileInput?.click();
  });

  dom.fileInput?.addEventListener("change", () => {
    const file = dom.fileInput.files?.[0];

    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (dom.languageSelect) {
      if (fileName.endsWith(".py")) {
        dom.languageSelect.value = "python";
        dom.languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (
        fileName.endsWith(".cpp") ||
        fileName.endsWith(".cc") ||
        fileName.endsWith(".cxx") ||
        fileName.endsWith(".hpp") ||
        fileName.endsWith(".h") ||
        fileName.endsWith(".c")
      ) {
        dom.languageSelect.value = "cpp";
        dom.languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const text = String(reader.result || "");

      if (editor && typeof editor.setCode === "function") {
        editor.setCode(text);
      } else if (dom.codeInput) {
        dom.codeInput.value = text;
        dom.codeInput.dispatchEvent(new Event("input", { bubbles: true }));
      }

      dom.fileInput.value = "";
    });

    reader.addEventListener("error", () => {
      dom.fileInput.value = "";
      window.alert("Could not read this file. Please try another file.");
    });

    reader.readAsText(file);
  });
}

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
    const source = editor.getCode();
    const profile = detectSourceProfile(source);
    const activeLanguage = getActiveLanguage
      ? getActiveLanguage()
      : { id: "cpp", supportsDiagnostics: true, supportsLibraryInfo: true };

    if (activeLanguage.id === "cpp") {
      renderAllModeBadges(dom, profile);
      renderLiveExplanationPreview(dom.explanationContent, source);
    } else {
      dom.sourceModeBadge.textContent = `${activeLanguage.displayName || activeLanguage.label || activeLanguage.id} selected`;
      dom.outputModeBadge.textContent = "Not runnable yet";
      dom.explanationModeBadge.textContent = "Coming soon";

      dom.explanationContent.innerHTML = `
        <div class="card card--dashed empty-state-card">
          <h3>${activeLanguage.displayName || activeLanguage.label || activeLanguage.id} support is coming soon</h3>
          <p>
            This language is visible in the interface, but its interpreter,
            explanations, and diagnostics are not connected yet.
          </p>
          <p class="muted">
            Switch back to C++ to use the current learning tools.
          </p>
        </div>
      `;
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
  });

    dom.clearBtn?.addEventListener("click", () => {
      const confirmed = window.confirm("Clear the editor and remove the saved draft?");

      if (!confirmed) {
        return;
      }

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

  dom.languageSelect?.addEventListener("change", () => {
    activeLanguage = getLanguageProfile(dom.languageSelect.value);

    renderAllModeBadges(dom, {
      mode: activeLanguage.id === "cpp" ? "empty" : "Language not active yet",
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

  dom.runBtn?.addEventListener("click", async () => {
  const source = editor.getCode();

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

  const activeLanguage = getActiveLanguage
    ? getActiveLanguage()
    : { id: "cpp", displayName: "C++", supportsDiagnostics: true };

  if (activeLanguage.id !== "cpp") {
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

    return;
  }

    const diagnosticErrors = diagnostics ? diagnostics.checkForRun(source) : [];

    if (diagnosticErrors.length > 0) {
      return;
    }

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
  const tutorial = createTutorialController(dom);
  const guidedMode = createGuidedModeController(dom, editor);
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

  editor.init();
  runner.init();
  history.init();
  modal.bindModalEvents();
  tutorial.init();
  draftStorage.restore();
  lineNumbers.init();
  editorIndentation.init();
  // templates.init();
  renderEmptyExplanationState(dom.explanationContent);
  runner.renderClearedOutput();
  renderAllModeBadges(dom, { mode: "empty" });
  updateHistoryButtonState(dom, history);

bindTopbarActions(dom, modal, history, editor, tutorial, guidedMode, templates);
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

  bindUpload(dom, editor);

  console.log("ISeeCode Phase E cleanup and polish loaded.");
}

document.addEventListener("DOMContentLoaded", initApp);