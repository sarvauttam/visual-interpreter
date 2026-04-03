let wasmModule = null;

async function loadInterpreterModule() {
  const factory =
    (typeof VisualInterpreterModule === "function" && VisualInterpreterModule) ||
    (typeof window !== "undefined" && typeof window.VisualInterpreterModule === "function" && window.VisualInterpreterModule) ||
    (typeof Module === "function" && Module) ||
    (typeof window !== "undefined" && typeof window.Module === "function" && window.Module);

  if (!factory) {
    console.warn("Interpreter factory is not available.");
    return null;
  }

  try {
    wasmModule = await factory();
    window.vi = wasmModule;
    console.log("Interpreter ready.");
    return wasmModule;
  } catch (error) {
    console.error("Failed to load interpreter:", error);
    return null;
  }
}

(function () {
  const $ = (id) => document.getElementById(id);

  const fileInput = $("fileInput");
  const sourceInput = $("sourceInput");
  const runBtn = $("runBtn");
  const clearBtn = $("clearBtn");
  const saveBtn = $("saveBtn");

  const howToUseBtn = $("howToUseBtn");
  const historyBtn = $("historyBtn");
  const accountBtn = $("accountBtn");
  const historySearchInput = $("historySearchInput");

  const rememberHistoryToggle = $("rememberHistoryToggle");
  const historyPanel = $("historyPanel");
  const historyBackdrop = $("historyBackdrop");
  const historyList = $("historyList");
  const historyEmptyState = $("historyEmptyState");
  const clearHistoryBtn = $("clearHistoryBtn");
  const closeHistoryBtn = $("closeHistoryBtn");

  const executionModeBtn = $("executionModeBtn");
  const readingModeBtn = $("readingModeBtn");
  const modeDescription = $("modeDescription");

  const languageStatus = $("languageStatus");
  const modeFitStatus = $("modeFitStatus");

  const feedbackBanner = $("feedbackBanner");

  const editorFontSize = $("editorFontSize");
  const boldTextBtn = $("boldTextBtn");
  const italicTextBtn = $("italicTextBtn");
  const underlineTextBtn = $("underlineTextBtn");

  const fileStatus = $("fileStatus");
  const explanationsPanel = $("explanationsPanel");
  const outputPanel = $("outputPanel");
  const inlineErrorHost = $("inlineErrorHost");

  const STORAGE_KEY = "isee_code_history";
  const MAX_HISTORY_ITEMS = 12;
  const REMEMBER_HISTORY_KEY = "isee_code_remember_history";

  let detectedLanguage = "Unknown";
  let detectedFileName = "";

  let lastRenderedExplanationKey = "";
  let lastRenderedHistoryKey = "";

  let lastInterpretationSnapshot = null;
  let sessionHasInterpretation = false;
  let activeHistoryItemId = null; 

  let currentInterpreterMode = "run";

  let historySearchQuery = "";
  let editingHistoryItemId = null;
  let editingHistoryDraft = "";

  let explanationSteps = [];
  let currentStepIndex = -1;
  let saveFeedbackTimer = null;
  let historyPulseTimer = null;
  let playTimer = null;
  let liveExplainTimer = null;
  let hasRunAtLeastOnce = false;

  let feedbackTimer = null;
  let isBusy = false;

  let editorStyleState = {
    bold: false,
    italic: false,
    underline: false,
    size: 16,
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showInlineError(message) {
    if (!inlineErrorHost) return;

    inlineErrorHost.innerHTML = `
      <div class="inline-error">
        <span>❌</span>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  }

  function clearInlineError() {
    if (!inlineErrorHost) return;
    inlineErrorHost.innerHTML = "";
  }

  function showFeedback(message, type = "info", options = {}) {
  if (!feedbackBanner) return;

  const { persist = false } = options;

  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }

  feedbackBanner.textContent = message;
  feedbackBanner.className = `feedback-banner feedback-banner--${type}`;

  if (!persist) {
    feedbackTimer = window.setTimeout(() => {
      clearFeedback();
    }, 2600);
  }
}

function clearFeedback() {
  if (!feedbackBanner) return;

  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }

  feedbackBanner.textContent = "";
  feedbackBanner.className = "feedback-banner hidden";
}

  function setOutput(text) {
    if (!outputPanel) return;
    outputPanel.textContent = text || "Ready.";
  }

  function getSourceLines() {
    if (!sourceInput) return [];
    return sourceInput.value.replace(/\r\n/g, "\n").split("\n");
  }

  function applyEditorStyles() {
    if (!sourceInput) return;

    sourceInput.style.fontSize = `${editorStyleState.size}px`;
    sourceInput.style.fontWeight = editorStyleState.bold ? "700" : "400";
    sourceInput.style.fontStyle = editorStyleState.italic ? "italic" : "normal";
    sourceInput.style.textDecoration = editorStyleState.underline ? "underline" : "none";
  }

  function setToolbarActiveState(button, isActive) {
    if (!button) return;
    button.style.background = isActive ? "var(--primary-soft)" : "#fff";
    button.style.borderColor = isActive ? "var(--primary)" : "var(--border)";
    button.style.color = isActive ? "var(--primary-dark)" : "var(--text)";
  }

function renderEmptyExplanationState() {
  if (!explanationsPanel) return;

  const message =
    currentInterpreterMode === "explain"
      ? "Your source-based explanation will appear here after you click Explain."
      : "Your code explanations will appear here after you run the program.";

  explanationsPanel.innerHTML = `
    <div class="empty-state">
      <h3>Ready to explain your code</h3>
      <p>${message}</p>
    </div>
  `;
}

function renderCurrentExplanationStep(force = false) {
  if (!explanationsPanel) return;

  if (!explanationSteps.length) {
    renderEmptyExplanationState();
    lastRenderedExplanationKey = "empty";
    return;
  }

  const nextKey = getExplanationRenderKey();
  if (!force && nextKey === lastRenderedExplanationKey) return;

  lastRenderedExplanationKey = nextKey;

  explanationsPanel.innerHTML = `
    <div class="explanation-list">
      ${explanationSteps
        .map(
          (step, index) => `
            <div class="explanation-block ${index === currentStepIndex ? "explanation-block--active" : ""}">
              <p class="explanation-line">Line ${step.lineNumber || index + 1}: ${escapeHtml(step.code || "")}</p>
              <p class="explanation-text">${escapeHtml(step.explanation || "")}</p>
              <p class="explanation-step-meta">Step ${index + 1} of ${explanationSteps.length}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function getExplanationRenderKey() {
  return JSON.stringify({
    mode: currentInterpreterMode,
    stepCount: explanationSteps.length,
    currentStepIndex,
    output: outputPanel ? outputPanel.textContent : "",
  });
}

function setBusyState(nextBusy, message = "") {
  isBusy = !!nextBusy;

  if (runBtn) {
    runBtn.disabled = isBusy;
    runBtn.textContent = isBusy
      ? currentInterpreterMode === "explain"
        ? "Explaining..."
        : "Running..."
      : currentInterpreterMode === "explain"
        ? "Explain"
        : "Run";
  }

  if (clearBtn) {
    clearBtn.disabled = isBusy;
  }

  if (saveBtn) {
    saveBtn.disabled = isBusy;
  }

  if (fileInput) {
    fileInput.disabled = isBusy;
  }

  if (isBusy && message) {
    showFeedback(message, "info", { persist: true });
  } else if (!isBusy) {
    clearFeedback();
  }
}

  function stopPlayback() {
    if (playTimer) {
      window.clearInterval(playTimer);
      playTimer = null;
    }
  }

  function startPlayback() {
    if (!explanationSteps.length) return;

    stopPlayback();

    playTimer = window.setInterval(() => {
      if (currentStepIndex >= explanationSteps.length - 1) {
        stopPlayback();
        return;
      }

      currentStepIndex += 1;
      renderCurrentExplanationStep();
    }, 1400);
  }

  function updateHistoryButtonState() {
    const saved = loadHistory();
    const shouldBeActive = sessionHasInterpretation || saved.length > 0;

    if (!historyBtn) return;

    historyBtn.classList.toggle("nav-btn--muted", !shouldBeActive);
    historyBtn.classList.toggle("nav-btn--disabled", !shouldBeActive);
  }

  function pulseHistoryButton() {
  if (!historyBtn) return;

  historyBtn.classList.remove("nav-btn--pulse");
  void historyBtn.offsetWidth;
  historyBtn.classList.add("nav-btn--pulse");

  if (historyPulseTimer) {
    window.clearTimeout(historyPulseTimer);
  }

  historyPulseTimer = window.setTimeout(() => {
    historyBtn.classList.remove("nav-btn--pulse");
  }, 2200);
}

function activateHistoryUI() {
  sessionHasInterpretation = true;
  if (!historyBtn) return;
  historyBtn.classList.remove("nav-btn--muted");
  historyBtn.classList.remove("nav-btn--disabled");
}

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Failed to load history:", error);
      return [];
    }
  }

  function saveHistoryItem(item) {
    try {
      const current = loadHistory();
      current.unshift(item);
      const trimmed = current.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      updateHistoryButtonState();
    } catch (error) {
      console.warn("Failed to save history:", error);
    }
  }

function getNormalizedHistoryItems() {
  const items = loadHistory();

  return items.map((item) => ({
    ...item,
    updatedAt: item.updatedAt || item.date || new Date().toISOString(),
    pinned: Boolean(item.pinned),
  }));
}

function saveHistoryItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Failed to save history items:", error);
  }
}

function updateHistoryItem(itemId, updates) {
  const items = getNormalizedHistoryItems();
  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveHistoryItems(updatedItems);
  renderHistoryList();
  updateHistoryButtonState();
  lastRenderedHistoryKey = "";
}

function getSortedHistoryItems(items) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    const aTime = new Date(a.updatedAt || a.date || 0).getTime();
    const bTime = new Date(b.updatedAt || b.date || 0).getTime();

    return bTime - aTime;
  });
}

function filterHistoryItems(items, query) {
  const value = String(query || "").trim().toLowerCase();
  if (!value) return items;

  return items.filter((item) => {
    const title = String(item.title || "").toLowerCase();
    const source = String(item.sourceCode || "").toLowerCase();
    const output = String(item.output || "").toLowerCase();

    return (
      title.includes(value) ||
      source.includes(value) ||
      output.includes(value)
    );
  });
}

function togglePinHistoryItem(itemId) {
  const items = getNormalizedHistoryItems();
  const item = items.find((entry) => entry.id === itemId);
  if (!item) return;

  const nextPinned = !item.pinned;

  updateHistoryItem(itemId, {
    pinned: nextPinned,
  });

  showFeedback(
    nextPinned ? "Interpretation pinned." : "Interpretation unpinned.",
    "info"
  );
}

function startHistoryTitleEdit(itemId, currentTitle) {
  editingHistoryItemId = itemId;
  editingHistoryDraft = currentTitle || "";
  renderHistoryList();

  window.requestAnimationFrame(() => {
    const input = document.querySelector(`[data-history-title-input="${itemId}"]`);
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function cancelHistoryTitleEdit() {
  editingHistoryItemId = null;
  editingHistoryDraft = "";
  renderHistoryList();
}

function commitHistoryTitleEdit(itemId) {
  const trimmed = editingHistoryDraft.trim();
  if (!trimmed) {
    cancelHistoryTitleEdit();
    return;
  }

  updateHistoryItem(itemId, {
    title: trimmed,
  });

  editingHistoryItemId = null;
  editingHistoryDraft = "";
}

  function getRememberPreference() {
  try {
    const raw = localStorage.getItem(REMEMBER_HISTORY_KEY);
    return raw === null ? true : raw === "true";
  } catch (_error) {
    return true;
  }
}

function setRememberPreference(value) {
  try {
    localStorage.setItem(REMEMBER_HISTORY_KEY, String(!!value));
  } catch (error) {
    console.warn("Failed to store remember preference:", error);
  }
}

function inferLanguageFromSource(source) {
  const text = source || "";
  if (/#include\s*</.test(text) || /\busing\s+namespace\b/.test(text) || /\bint\s+main\s*\(/.test(text)) {
    return "C++";
  }
  return "Unknown";
}

function buildHistoryTitle(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
  return lines[0]?.slice(0, 60) || "Untitled interpretation";
}

function serializeExplanation(steps) {
  if (!Array.isArray(steps) || !steps.length) return "";
  return steps
    .map((step) => `Line ${step.lineNumber}: ${step.explanation || ""}`)
    .join("\n");
}

function buildInterpretationRecord({ mode = "run", source, output, explanationSteps }) {
  const now = new Date().toISOString();

  return {
    id: `history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: buildHistoryTitle(source),
    date: now,
    updatedAt: now,
    sourceCode: source,
    explanation: serializeExplanation(explanationSteps),
    output: output || "",
    languageGuess: detectedLanguage && detectedLanguage !== "Unknown"
      ? detectedLanguage
      : inferLanguageFromSource(source),
    mode,
    pinned: false,
  };
}

function setInterpreterMode(mode) {
  currentInterpreterMode = mode === "explain" ? "explain" : "run";

  const isRunMode = currentInterpreterMode === "run";

  if (executionModeBtn) {
    executionModeBtn.classList.toggle("mode-switch__btn--active", isRunMode);
    executionModeBtn.setAttribute("aria-pressed", String(isRunMode));
  }

  if (readingModeBtn) {
    readingModeBtn.classList.toggle("mode-switch__btn--active", !isRunMode);
    readingModeBtn.setAttribute("aria-pressed", String(!isRunMode));
  }

  if (!explanationSteps.length) {
    renderEmptyExplanationState();
  }

  if (modeDescription) {
    if (isRunMode) {
      modeDescription.textContent = isExecutionFriendlyLanguage(detectedLanguage)
        ? "Execution Mode runs supported code with the interpreter."
        : "Execution Mode runs supported code only. Reading Mode is safer for unsupported languages.";
    } else {
      modeDescription.textContent = "Reading Mode explains code from the source without running it.";
    }
  }

  if (runBtn && !isBusy) {
    runBtn.textContent = isRunMode ? "Run" : "Explain";
  }
}

function getCurrentModeLabel() {
  return currentInterpreterMode === "explain" ? "explain" : "run";
}

function truncateText(text, maxLength = 140) {
  const value = String(text || "").trim();
  if (!value) return "—";
  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}…` : value;
}

function getOutputPreview(output) {
  return truncateText(output || "No output saved.", 120);
}

function getExplanationPreview(explanation) {
  return truncateText(explanation || "No explanation saved.", 160);
}

function getCodePreview(sourceCode) {
  return truncateText(sourceCode || "", 180);
}

function formatModeLabel(mode) {
  if (mode === "explain") return "Reading";
  return "Execution";
}

function activateHistoryUI() {
  sessionHasInterpretation = true;
  if (historyBtn) {
    historyBtn.classList.remove("nav-btn--muted");
    historyBtn.classList.remove("nav-btn--disabled");
  }
}

function deactivateHistoryUI() {
  const saved = loadHistory();
  if (saved.length > 0) {
    if (historyBtn) {
      historyBtn.classList.remove("nav-btn--muted");
      historyBtn.classList.remove("nav-btn--disabled");
    }
    return;
  }

  if (!sessionHasInterpretation && historyBtn) {
    historyBtn.classList.add("nav-btn--muted");
    historyBtn.classList.add("nav-btn--disabled");
  }
}

function renderHistoryList() {
  if (!historyList || !historyEmptyState) return;

  const normalizedItems = getNormalizedHistoryItems();
  const sortedItems = getSortedHistoryItems(normalizedItems);
  const filteredItems = filterHistoryItems(sortedItems, historySearchQuery);

  const nextHistoryKey = getHistoryRenderKey(filteredItems);

  if (nextHistoryKey === lastRenderedHistoryKey) {
    return;
  }

  lastRenderedHistoryKey = nextHistoryKey;

  if (!filteredItems.length) {
    historyList.classList.add("hidden");
    historyEmptyState.classList.remove("hidden");
    historyEmptyState.innerHTML = `
      <div>
        <h3>No matching interpretations</h3>
        <p>${historySearchQuery ? "Try a different search term." : "Run code, then use “Save Interpretation” to keep it here."}</p>
      </div>
    `;
    return;
  }

  historyEmptyState.classList.add("hidden");
  historyList.classList.remove("hidden");

  historyList.innerHTML = filteredItems.map((item) => {
    const isActive = item.id === activeHistoryItemId;
    const isEditing = item.id === editingHistoryItemId;

    return `
      <article class="history-card ${isActive ? "history-card--active" : ""} ${item.pinned ? "history-card--pinned" : ""}" data-history-id="${item.id}">
        <div class="history-card__top">
          <div class="history-card__title-wrap">
            ${
              isEditing
                ? `
                  <input
                    class="history-title-input"
                    type="text"
                    value="${escapeHtml(editingHistoryDraft)}"
                    data-history-title-input="${item.id}"
                    aria-label="Edit interpretation title"
                  />
                `
                : `
                  <h3 class="history-card__title">${escapeHtml(item.title || "Untitled interpretation")}</h3>
                `
            }
            <p class="history-card__meta">${escapeHtml(new Date(item.date).toLocaleString())}</p>
          </div>
        </div>

        <div class="history-card__badges">
          <span class="history-badge">${escapeHtml(item.languageGuess || "Unknown")}</span>
          <span class="history-badge">${escapeHtml(formatModeLabel(item.mode || "run"))}</span>
          ${item.pinned ? `<span class="history-badge history-badge--pinned">Pinned</span>` : ""}
        </div>

        <div class="history-card__section">
          <p class="history-card__label">Code</p>
          <pre class="history-card__preview">${escapeHtml(getCodePreview(item.sourceCode || ""))}</pre>
        </div>

        <div class="history-card__section">
          <p class="history-card__label">Output</p>
          <div class="history-card__text-preview">${escapeHtml(getOutputPreview(item.output || ""))}</div>
        </div>

        <div class="history-card__section">
          <p class="history-card__label">Explanation</p>
          <div class="history-card__text-preview">${escapeHtml(getExplanationPreview(item.explanation || ""))}</div>
        </div>

        <div class="history-card__actions">
          <button class="history-load-btn" type="button" data-load-history-id="${item.id}">
            Load
          </button>

          ${
            isEditing
              ? `
                <button class="history-secondary-btn" type="button" data-save-title-history-id="${item.id}">
                  Save Title
                </button>
                <button class="history-secondary-btn" type="button" data-cancel-title-history-id="${item.id}">
                  Cancel
                </button>
              `
              : `
                <button class="history-secondary-btn" type="button" data-rename-history-id="${item.id}">
                  Rename
                </button>
              `
          }

          <button class="history-secondary-btn" type="button" data-pin-history-id="${item.id}">
            ${item.pinned ? "Unpin" : "Pin"}
          </button>

          <button class="history-delete-btn" type="button" data-delete-history-id="${item.id}">
            Delete
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function getHistoryRenderKey(items) {
  return JSON.stringify({
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      pinned: item.pinned,
      updatedAt: item.updatedAt,
    })),
    activeHistoryItemId,
    editingHistoryItemId,
    editingHistoryDraft,
    historySearchQuery,
  });
}

function deleteHistoryItem(itemId) {
  const confirmed = window.confirm("Delete this interpretation?");
  if (!confirmed) return;

  try {
    const items = loadHistory();
    const filtered = items.filter((item) => item.id !== itemId);

    if (activeHistoryItemId === itemId) {
      activeHistoryItemId = null;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    renderHistoryList();
    updateHistoryButtonState();

    if (filtered.length === 0) {
      showFeedback("History is now empty.", "info");
    } else {
      showFeedback("Interpretation deleted.", "info");
    }
  } catch (error) {
    console.warn("Failed to delete history item:", error);
  }

  lastRenderedHistoryKey = "";
}

function openHistoryPanel() {
  renderHistoryList();
  if (historyPanel) {
    historyPanel.classList.remove("hidden");
    historyPanel.setAttribute("aria-hidden", "false");
  }
  if (historyBackdrop) {
    historyBackdrop.classList.remove("hidden");
  }
}

function closeHistoryPanel() {
  if (historyPanel) {
    historyPanel.classList.add("hidden");
    historyPanel.setAttribute("aria-hidden", "true");
  }

  if (historyBackdrop) {
    historyBackdrop.classList.add("hidden");
  }

  editingHistoryItemId = null;
  editingHistoryDraft = "";
}

function loadHistoryItemIntoWorkspace(itemId) {
  const items = loadHistory();
  const item = items.find((entry) => entry.id === itemId);
  if (!item) return;

  activeHistoryItemId = item.id;

  if (sourceInput) {
    sourceInput.value = item.sourceCode || "";
  }

  explanationSteps = [];
  if (item.explanation) {
    explanationSteps = item.explanation.split("\n").map((line, index) => ({
      lineNumber: index + 1,
      code: "",
      explanation: line,
    }));
  }

  currentStepIndex = explanationSteps.length ? 0 : -1;

  setOutput(item.output || "Ready.");

  if (explanationSteps.length) {
    renderCurrentExplanationStep();
  } else {
    renderEmptyExplanationState();
  }

  lastInterpretationSnapshot = {
    ...item,
  };

  activateHistoryUI();
  updateHistoryButtonState();
  renderHistoryList();
  showFeedback("Interpretation loaded from history.", "info");
  closeHistoryPanel();
}

function runReadingMode(source) {
  clearInlineError();

  const sourceSteps = buildExplanationStepsFromSource(source);
  explanationSteps = sourceSteps;
  currentStepIndex = explanationSteps.length ? 0 : -1;

  if (explanationSteps.length) {
    renderCurrentExplanationStep();
  } else {
    renderEmptyExplanationState();
  }

  setOutput("Reading Mode: no execution was performed.");
  hasRunAtLeastOnce = true;
  sessionHasInterpretation = true;

  activateHistoryUI();
  updateHistoryButtonState();

  lastInterpretationSnapshot = buildInterpretationRecord({
    mode: "explain",
    source,
    output: "Reading Mode: no execution was performed.",
    explanationSteps: sourceSteps,
  });

  setBusyState(false);
  showFeedback("Reading Mode explanation generated.", "success");
}

  function isCompleteThought(line) {
    const trimmed = line.trim();

    if (!trimmed) return false;

    if (/^#include\s*<[^>]+>\s*$/.test(trimmed)) return true;
    if (/^using\s+namespace\s+\w+\s*;\s*$/.test(trimmed)) return true;

    if (trimmed === "{") return true;
    if (trimmed === "}") return true;

    if (trimmed.endsWith(";")) return true;
    if (trimmed.endsWith("{")) return true;

    return false;
  }

  function classifyLineState(line) {
    const trimmed = line.trim();

    if (!trimmed) {
      return {
        kind: "empty",
        complete: false,
        explainable: false,
      };
    }

    if (/^#include\s*</.test(trimmed) && !/>$/.test(trimmed)) {
      return {
        kind: "incomplete_include",
        complete: false,
        explainable: true,
      };
    }

    if (/^#include\s*<[^>]+>\s*$/.test(trimmed)) {
      return {
        kind: "include",
        complete: true,
        explainable: true,
      };
    }

    if (/^using\s+namespace\b/.test(trimmed) && !/;\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_namespace",
        complete: false,
        explainable: true,
      };
    }

    if (/^using\s+namespace\s+\w+\s*;\s*$/.test(trimmed)) {
      return {
        kind: "namespace",
        complete: true,
        explainable: true,
      };
    }

    if (/^int\s+main\s*\($/.test(trimmed)) {
      return {
        kind: "incomplete_main_signature",
        complete: false,
        explainable: true,
      };
    }

    if (/^int\s+main\s*\(\)\s*$/.test(trimmed)) {
      return {
        kind: "main_signature_waiting_block",
        complete: false,
        explainable: true,
      };
    }

    if (/^int\s+main\s*\(\)\s*\{$/.test(trimmed)) {
      return {
        kind: "main_start",
        complete: true,
        explainable: true,
      };
    }

    if (/^if\s*\(.*$/.test(trimmed) && !/\)\s*\{?\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_if",
        complete: false,
        explainable: true,
      };
    }

    if (/^if\s*\([^)]+\)\s*$/.test(trimmed)) {
      return {
        kind: "if_waiting_block",
        complete: false,
        explainable: true,
      };
    }

    if (/^if\s*\([^)]+\)\s*\{$/.test(trimmed)) {
      return {
        kind: "if_start",
        complete: true,
        explainable: true,
      };
    }

    if (/^else\s*$/.test(trimmed)) {
      return {
        kind: "else_waiting_block",
        complete: false,
        explainable: true,
      };
    }

    if (/^else\s*\{$/.test(trimmed)) {
      return {
        kind: "else_start",
        complete: true,
        explainable: true,
      };
    }

    if (/^while\s*\(.*$/.test(trimmed) && !/\)\s*\{?\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_while",
        complete: false,
        explainable: true,
      };
    }

    if (/^while\s*\([^)]+\)\s*$/.test(trimmed)) {
      return {
        kind: "while_waiting_block",
        complete: false,
        explainable: true,
      };
    }

    if (/^while\s*\([^)]+\)\s*\{$/.test(trimmed)) {
      return {
        kind: "while_start",
        complete: true,
        explainable: true,
      };
    }

    if (/^for\s*\(.*$/.test(trimmed) && !/\)\s*\{?\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_for",
        complete: false,
        explainable: true,
      };
    }

    if (/^for\s*\([^)]+\)\s*$/.test(trimmed)) {
      return {
        kind: "for_waiting_block",
        complete: false,
        explainable: true,
      };
    }

    if (/^for\s*\([^)]+\)\s*\{$/.test(trimmed)) {
      return {
        kind: "for_start",
        complete: true,
        explainable: true,
      };
    }

    if (/^return\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_return",
        complete: false,
        explainable: true,
      };
    }

    if (/^return\b/.test(trimmed) && !/;\s*$/.test(trimmed)) {
      return {
        kind: "unfinished_return",
        complete: false,
        explainable: true,
      };
    }
  

    if (/^return\b.*;\s*$/.test(trimmed)) {
      return {
        kind: "return",
        complete: true,
        explainable: true,
      };
    }

    if (/^cout\s*<<\s*$/.test(trimmed) || /^print\s*\(\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_output",
        complete: false,
        explainable: true,
      };
    }

    if ((/^cout\s*<</.test(trimmed) || /^print\s*\(/.test(trimmed)) && !/;\s*$/.test(trimmed)) {
      return {
        kind: "unfinished_output",
        complete: false,
        explainable: true,
      };
    }

    if ((/^cout\s*<</.test(trimmed) || /^print\s*\(/.test(trimmed)) && /;\s*$/.test(trimmed)) {
      return {
        kind: "output",
        complete: true,
        explainable: true,
      };
    }

    if (/^cin\s*>>\s*$/.test(trimmed) || /^input\s*\(\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_input",
        complete: false,
        explainable: true,
      };
    }

    if ((/^cin\s*>>/.test(trimmed) || /^input\s*\(/.test(trimmed)) && !/;\s*$/.test(trimmed)) {
      return {
        kind: "unfinished_input",
        complete: false,
        explainable: true,
      };
    }

    if ((/^cin\s*>>/.test(trimmed) || /^input\s*\(/.test(trimmed)) && /;\s*$/.test(trimmed)) {
      return {
        kind: "input",
        complete: true,
        explainable: true,
      };
    }

    if (/^\{$/.test(trimmed)) {
      return {
        kind: "open_brace",
        complete: true,
        explainable: true,
      };
    }

    if (/^\}$/.test(trimmed)) {
      return {
        kind: "close_brace",
        complete: true,
        explainable: true,
      };
    }

    if (/^let\s+\w+\s*=\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_declaration",
        complete: false,
        explainable: true,
      };
    }

    if (/^let\s+\w+\s*=/.test(trimmed) && !/;\s*$/.test(trimmed)) {
      return {
        kind: "unfinished_declaration",
        complete: false,
        explainable: true,
      };
    }

    if (/^let\s+\w+\s*=.*;\s*$/.test(trimmed)) {
      return {
        kind: "declaration",
        complete: true,
        explainable: true,
      };
    }

    if (/^\w+\s*=\s*$/.test(trimmed)) {
      return {
        kind: "incomplete_assignment",
        complete: false,
        explainable: true,
      };
    }

    if (/^\w+\s*=/.test(trimmed) && !/;\s*$/.test(trimmed) && !/==/.test(trimmed)) {
      return {
        kind: "unfinished_assignment",
        complete: false,
        explainable: true,
      };
    }

    if (/^\w+\s*=.*;\s*$/.test(trimmed) && !/==/.test(trimmed)) {
      return {
        kind: "assignment",
        complete: true,
        explainable: true,
      };
    }

    if (/^func\s+\w+\s*\([^)]*$/.test(trimmed)) {
      return {
        kind: "incomplete_function_header",
        complete: false,
        explainable: true,
      };
    }

    if (/^func\s+\w+\s*\([^)]*\)\s*$/.test(trimmed)) {
      return {
        kind: "function_header_waiting_block",
        complete: false,
        explainable: true,
      };
    }

    if (/^func\s+\w+\s*\([^)]*\)\s*\{$/.test(trimmed)) {
      return {
        kind: "function_header",
        complete: true,
        explainable: true,
      };
    }

    if (trimmed.endsWith(";")) {
      return {
        kind: "generic_statement",
        complete: true,
        explainable: true,
      };
    }

    if (trimmed.endsWith("{")) {
      return {
        kind: "generic_block_start",
        complete: true,
        explainable: true,
      };
    }

    return {
      kind: "unfinished_unknown",
      complete: false,
      explainable: true,
    };
  }

  function getLineHint(line) {
    const trimmed = line.trim();
    const state = classifyLineState(line);

    switch (state.kind) {
      case "incomplete_include":
        return "You are starting an include line. Finish the library name and close it with >.";
      case "incomplete_namespace":
        return "You are starting a namespace line. End it with a semicolon.";
      case "incomplete_main_signature":
        return "You are starting the main function. Close the parentheses first.";
      case "main_signature_waiting_block":
        return "You finished the main function header. Add an opening curly brace to start its block.";
      case "incomplete_if":
        return "You are starting an if condition. Finish the condition and close the parenthesis.";
      case "if_waiting_block":
        return "Your if condition looks complete. Add an opening curly brace to start the block.";
      case "else_waiting_block":
        return "You wrote else. Add an opening curly brace to begin the alternative block.";
      case "incomplete_while":
        return "You are starting a while loop condition. Finish it and close the parenthesis.";
      case "while_waiting_block":
        return "Your while condition looks complete. Add an opening curly brace to begin the loop body.";
      case "incomplete_for":
        return "You are starting a for loop. Finish the loop header and close the parenthesis.";
      case "for_waiting_block":
        return "Your for loop header looks complete. Add an opening curly brace to begin the loop body.";
      case "incomplete_return":
        return "You are starting a return statement. Add a value or finish it with a semicolon.";
      case "unfinished_return":
        return "This return statement is not finished yet. End it with a semicolon.";
      case "incomplete_output":
        return "You are starting an output statement. Add what you want to print.";
      case "unfinished_output":
        return "This output line is not finished yet. Complete what should be printed and end the line properly.";
      case "incomplete_input":
        return "You are starting an input statement. Add the variable that should receive the value.";
      case "unfinished_input":
        return "This input line is not finished yet. Complete it and end the line properly.";
      case "incomplete_declaration":
        return "You started a variable declaration. Add the value that should be stored.";
      case "unfinished_declaration":
        return "This variable declaration is not finished yet. End it with a semicolon.";
      case "incomplete_assignment":
        return "You are starting an assignment. Add the value that should go on the right side.";
      case "unfinished_assignment":
        return "This assignment is not finished yet. End it with a semicolon.";
      case "incomplete_function_header":
        return "You are starting a function header. Finish the parameter list first.";
      case "function_header_waiting_block":
        return "The function header looks complete. Add an opening curly brace to start the function body.";
      case "unfinished_unknown":
        if (trimmed.endsWith("(")) {
          return "This line looks unfinished. Close the parentheses and continue.";
        }
        return "Keep going — this line looks incomplete, so I am waiting before explaining it fully.";
      default:
        return "";
    }
  }

  function detectLanguageFromFileName(fileName) {
  const value = String(fileName || "").toLowerCase().trim();

  if (value.endsWith(".cpp") || value.endsWith(".cc") || value.endsWith(".cxx") || value.endsWith(".hpp") || value.endsWith(".h")) {
    return "C++";
  }

  if (value.endsWith(".c")) {
    return "C";
  }

  if (value.endsWith(".py")) {
    return "Python";
  }

  if (value.endsWith(".js")) {
    return "JavaScript";
  }

  if (value.endsWith(".ts")) {
    return "TypeScript";
  }

  if (value.endsWith(".java")) {
    return "Java";
  }

  if (value.endsWith(".cs")) {
    return "C#";
  }

  if (value.endsWith(".go")) {
    return "Go";
  }

  if (value.endsWith(".rs")) {
    return "Rust";
  }

  if (value.endsWith(".php")) {
    return "PHP";
  }

  if (value.endsWith(".rb")) {
    return "Ruby";
  }

  if (value.endsWith(".swift")) {
    return "Swift";
  }

  if (value.endsWith(".kt")) {
    return "Kotlin";
  }

  return "Unknown";
}

function detectLanguageFromSource(source) {
  const text = String(source || "");

  if (/#include\s*</.test(text) || /\busing\s+namespace\s+std\b/.test(text) || /\bstd::/.test(text)) {
    return "C++";
  }

  if (/^\s*def\s+\w+\s*\(/m.test(text) || /^\s*import\s+\w+/m.test(text) || /^\s*print\s*\(/m.test(text)) {
    return "Python";
  }

  if (/\bconsole\.log\s*\(/.test(text) || /\bfunction\s+\w+\s*\(/.test(text) || /\b(let|const|var)\s+\w+/.test(text)) {
    return "JavaScript";
  }

  if (/\bpublic\s+class\b/.test(text) || /\bSystem\.out\.println\s*\(/.test(text)) {
    return "Java";
  }

  if (/\bpackage\s+main\b/.test(text) || /\bfunc\s+main\s*\(/.test(text)) {
    return "Go";
  }

  if (/\bfn\s+main\s*\(/.test(text) || /\blet\s+mut\s+/.test(text)) {
    return "Rust";
  }

  if (/\busing\s+System\b/.test(text) || /\bConsole\.WriteLine\s*\(/.test(text)) {
    return "C#";
  }

  if (/<\?php/.test(text)) {
    return "PHP";
  }

  if (/^\s*puts\s+/.test(text) || /^\s*def\s+\w+\s*(\(|$)/m.test(text) && /\bend\b/m.test(text)) {
    return "Ruby";
  }

  if (/^\s*func\s+\w+\s*\(/m.test(text) && /\bimport\s+Foundation\b/.test(text)) {
    return "Swift";
  }

  return "Unknown";
}

  function detectLikelyLanguage({ fileName = "", source = "" }) {
    const byFile = detectLanguageFromFileName(fileName);
    if (byFile !== "Unknown") return byFile;

    const bySource = detectLanguageFromSource(source);
    return bySource;
  }

  function isExecutionFriendlyLanguage(language) {
  return language === "C++";
}

function updateLanguageUI() {
  if (languageStatus) {
    languageStatus.textContent = `Language: ${detectedLanguage || "Unknown"}`;
    languageStatus.classList.toggle("status-pill--good", detectedLanguage === "C++");
    languageStatus.classList.toggle("status-pill--warn", detectedLanguage !== "Unknown" && detectedLanguage !== "C++");
  }

  const executionFriendly = isExecutionFriendlyLanguage(detectedLanguage);

  if (modeFitStatus) {
    if (detectedLanguage === "Unknown") {
      modeFitStatus.textContent = "Mode fit: Not checked";
      modeFitStatus.classList.remove("status-pill--good", "status-pill--warn");
    } else if (executionFriendly) {
      modeFitStatus.textContent = "Mode fit: Execution Mode recommended";
      modeFitStatus.classList.add("status-pill--good");
      modeFitStatus.classList.remove("status-pill--warn");
    } else {
      modeFitStatus.textContent = "Mode fit: Reading Mode recommended";
      modeFitStatus.classList.add("status-pill--warn");
      modeFitStatus.classList.remove("status-pill--good");
    }
  }
}

function maybeShowModeGuidance() {
  if (currentInterpreterMode !== "run") return;
  if (!detectedLanguage || detectedLanguage === "Unknown") return;
  if (isExecutionFriendlyLanguage(detectedLanguage)) return;

  showInlineError(
    `${detectedLanguage} is unlikely to run in Execution Mode. Try Reading Mode for explanation without execution.`
  );
}

function refreshDetectedLanguage() {
  const source = sourceInput ? sourceInput.value : "";
  detectedLanguage = detectLikelyLanguage({
    fileName: detectedFileName,
    source,
  });

  updateLanguageUI();
  setInterpreterMode(currentInterpreterMode);
}

  function getLastNonEmptyLineInfo(source) {
    const lines = source.replace(/\r\n/g, "\n").split("\n");

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      if (lines[i].trim()) {
        return {
          lineNumber: i + 1,
          line: lines[i],
        };
      }
    }

    return null;
  }

  function buildLiveExplanationStepsFromSource(source) {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    const steps = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const state = classifyLineState(line);

      if (!state.explainable || !state.complete) continue;

      steps.push({
        lineNumber: i + 1,
        code: line,
        explanation: buildFriendlyExplanation(line),
        live: true,
      });
    }

    return steps;
  }

  function renderLiveExplanationPreview(source) {
    if (!explanationsPanel) return;

    const liveSteps = buildLiveExplanationStepsFromSource(source);
    const lastNonEmpty = getLastNonEmptyLineInfo(source);

    if (!source.trim()) {
      explanationSteps = [];
      currentStepIndex = -1;
      renderEmptyExplanationState();
      return;
    }

    const waitingNote =
      lastNonEmpty && !classifyLineState(lastNonEmpty.line).complete
        ? `
          <div class="explanation-block explanation-block--pending">
            <p class="explanation-code">Line ${lastNonEmpty.lineNumber}: ${escapeHtml(lastNonEmpty.line)}</p>
            <p class="explanation-text explanation-text--pending">
              ${escapeHtml(getLineHint(lastNonEmpty.line) || "Keep going — this line looks incomplete, so I am waiting before explaining it fully.")}
            </p>
          </div>
        `
        : "";

    if (!liveSteps.length && waitingNote) {
      explanationsPanel.innerHTML = `
        <div class="explanation-list">
          ${waitingNote}
        </div>
      `;
      return;
    }

    if (!liveSteps.length) {
      explanationsPanel.innerHTML = `
        <div class="empty-state">
          <div>
            <h3>Start typing your code</h3>
            <p>I will explain each line here as soon as it becomes complete enough to understand.</p>
          </div>
        </div>
      `;
      return;
    }

    explanationsPanel.innerHTML = `
      <div class="explanation-list">
        ${liveSteps
          .map(
            (step, index) => `
              <div class="explanation-block">
                <p class="explanation-code">Line ${step.lineNumber}: ${escapeHtml(step.code || "")}</p>
                <p class="explanation-text">${escapeHtml(step.explanation || "")}</p>
                <p class="explanation-step-label">Live explanation ${index + 1} of ${liveSteps.length}</p>
              </div>
            `
          )
          .join("")}
        ${waitingNote}
      </div>
    `;
  }

  function buildFriendlyExplanation(line) {
    const trimmed = line.trim();
    const state = classifyLineState(line);

    if (!trimmed) {
      return "This line is empty, so nothing happens yet.";
    }

    switch (state.kind) {
      case "include":
        return "Here, you are adding a library so your program can use extra tools later.";
      case "namespace":
        return "Here, you are choosing a namespace so some names can be written more simply.";
      case "main_start":
        return "This is the main part of the program. When the program starts, it begins here.";
      case "if_start":
        return "This line checks a condition. If the condition is true, the block below will run.";
      case "else_start":
        return "This line starts the alternative block that runs when the earlier condition is false.";
      case "while_start":
        return "This line starts a loop. The block will keep running while the condition stays true.";
      case "for_start":
        return "This line starts a for loop. It repeats a block using a setup, a condition, and an update step.";
      case "return":
        return "This line ends the current function and sends a result back.";
      case "output":
        return "This line prints something so the user can see it.";
      case "input":
        return "This line reads a value from the user and stores it in a variable.";
      case "open_brace":
        return "This curly brace opens a new block of code.";
      case "close_brace":
        return "This curly brace closes the block of code above it.";
      case "declaration":
        return "This line creates a new variable and stores a value inside it.";
      case "assignment":
        return "This line changes a variable by giving it a new value.";
      case "function_header":
        return "This line defines a function, which is a named block of reusable code.";
      case "generic_statement":
        return "This line is a complete statement, so the program can carry it out.";
      case "generic_block_start":
        return "This line starts a new block of code.";
      default:
        if (/^#include\s*</.test(trimmed)) {
          return "Here, you are adding a library so your program can use extra tools later.";
        }

        if (/^using\s+namespace\s+/.test(trimmed)) {
          return "Here, you are choosing a namespace so some names can be written more simply.";
        }

        if (/^int\s+main\s*\(/.test(trimmed)) {
          return "This is the main part of the program. When the program starts, it begins here.";
        }

        if (/^return\b/.test(trimmed)) {
          return "This line ends the current function and sends a result back.";
        }

        if (/^let\s+/.test(trimmed)) {
          return "This line creates a new variable and stores a value inside it.";
        }

        if (/^func\s+/.test(trimmed)) {
          return "This line defines a function, which is a reusable block of code.";
        }

        if (/^if\s*\(/.test(trimmed)) {
          return "This line checks a condition and decides whether the next block should run.";
        }

        if (/^else\b/.test(trimmed)) {
          return "This line gives another path to run when the earlier condition is false.";
        }

        if (/^while\s*\(/.test(trimmed)) {
          return "This line starts a loop that keeps running while its condition stays true.";
        }

        if (/^for\s*\(/.test(trimmed)) {
          return "This line starts a loop with a setup, a condition, and an update step.";
        }

        if (/^print\s*\(/.test(trimmed) || /^cout\s*<</.test(trimmed)) {
          return "This line sends output so the user can see a result.";
        }

        if (/^input\s*\(/.test(trimmed) || /^cin\s*>>/.test(trimmed)) {
          return "This line reads input from the user and stores it in a variable.";
        }

        if (trimmed === "{") {
          return "This curly brace opens a new block of code.";
        }

        if (trimmed === "}") {
          return "This curly brace closes the block of code above it.";
        }

        if (/=/.test(trimmed) && !/==/.test(trimmed)) {
          return "This line changes a variable by giving it a new value.";
        }

        if (/[+\-*/%]/.test(trimmed)) {
          return "This line performs a calculation to produce a new value.";
        }

        return "This line is part of the program logic and helps the program move forward step by step.";
    }
  }

function buildExplanationStepsFromSource(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const steps = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;

    steps.push({
      lineNumber: i + 1,
      code: line,
      explanation: buildFriendlyExplanation(line),
    });
  }

  return steps;
}

  function parseTraceJsonl(traceJsonl) {
    if (!traceJsonl || !traceJsonl.trim()) return [];

    const lines = traceJsonl
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const events = [];

    for (const line of lines) {
      try {
        events.push(JSON.parse(line));
      } catch (error) {
        console.warn("Skipping invalid trace line:", line);
      }
    }

    return events;
  }

  function buildExplanationStepsFromTrace(events, source) {
    const sourceLines = source.replace(/\r\n/g, "\n").split("\n");
    const traceMap = new Map();

    for (const event of events) {
      const lineNumber = event?.loc?.line;
      if (!lineNumber || lineNumber < 1 || lineNumber > sourceLines.length) continue;

      const code = sourceLines[lineNumber - 1] || "";
      if (!code.trim()) continue;

      let explanation = "";

      switch (event.type) {
        case "VarDeclare":
          explanation = `At this step, the program creates a variable${event.name ? ` named ${event.name}` : ""}.`;
          break;
        case "VarWrite":
          explanation = `At this step, the program updates a variable${event.value !== undefined ? ` with the value ${event.value}` : ""}.`;
          break;
        case "VarRead":
          explanation = "At this step, the program reads a variable so it can use its value.";
          break;
        case "BranchDecision":
          explanation = "At this step, the program checks a condition and chooses which path to follow.";
          break;
        case "LoopCheck":
          explanation = "At this step, the program checks whether the loop should continue.";
          break;
        case "CallStart":
        case "CallEnter":
          explanation = "At this step, the program enters a function call.";
          break;
        case "Return":
          explanation = "At this step, the function finishes and gives control back.";
          break;
        case "Print":
          explanation = "At this step, the program sends something to the output area.";
          break;
        case "Error":
          explanation = "At this step, the program finds an error and stops.";
          break;
        default:
          continue;
      }

      traceMap.set(lineNumber, {
        lineNumber,
        code,
        explanation,
      });
    }

    return traceMap;
  }

function mergeExplanationSteps(sourceSteps, traceMap) {
  return sourceSteps.map((step) => {
    const traced = traceMap.get(step.lineNumber);
    if (!traced) return step;

    return {
      lineNumber: step.lineNumber,
      code: step.code,
      explanation: traced.explanation || step.explanation,
    };
  });
}

async function tryRunWithWasm(source) {
  if (!wasmModule) {
    await loadInterpreterModule();
  }

  if (!wasmModule) {
    return {
      ok: false,
      error_text: "The interpreter module could not be loaded.",
      stdout_text: "",
      trace_jsonl: "",
    };
  }

  try {
    if (typeof wasmModule.run_source_to_trace === "function") {
      const rawResult = wasmModule.run_source_to_trace(source);
      let parsed = rawResult;

      if (typeof rawResult === "string") {
        try {
          parsed = JSON.parse(rawResult);
        } catch (_error) {
          parsed = {
            ok: false,
            error_text: "Interpreter returned a non-JSON string result.",
            stdout_text: "",
            trace_jsonl: "",
          };
        }
      }

      if (parsed && typeof parsed === "object") {
        return {
          ok: !!parsed.ok,
          trace_jsonl: parsed.trace_jsonl || "",
          stdout_text: parsed.stdout_text || "",
          error_text: parsed.error_text || "",
        };
      }
    }

    if (typeof wasmModule.ccall === "function") {
      const raw = wasmModule.ccall(
        "run_source_to_trace",
        "string",
        ["string"],
        [source]
      );

      let parsed = raw;
      if (typeof raw === "string") {
        parsed = JSON.parse(raw);
      }

      return {
        ok: !!parsed.ok,
        trace_jsonl: parsed.trace_jsonl || "",
        stdout_text: parsed.stdout_text || "",
        error_text: parsed.error_text || "",
      };
    }

    return {
      ok: false,
      error_text: "No compatible interpreter entry point was found.",
      stdout_text: "",
      trace_jsonl: "",
    };
  } catch (error) {
    return {
      ok: false,
      error_text: error?.message || "Unknown interpreter error.",
      stdout_text: "",
      trace_jsonl: "",
    };
  }
}

async function runProgram() {
  console.log("Run button clicked.");

  if (isBusy) return;

  clearInlineError();

  const source = sourceInput ? sourceInput.value : "";
  console.log("Source content:", source);

  if (!source.trim()) {
    showInlineError("Please write or upload some code first.");
    setOutput("Ready.");
    explanationSteps = [];
    currentStepIndex = -1;
    renderEmptyExplanationState();
    return;
  }

  setBusyState(
    true,
    currentInterpreterMode === "explain"
      ? "Generating explanation from source..."
      : "Running code through the interpreter..."
  );

  try {
    if (currentInterpreterMode === "explain") {
      runReadingMode(source);
      return;
    }

    setOutput("Running...");

    const sourceSteps = buildExplanationStepsFromSource(source);
    explanationSteps = sourceSteps;
    currentStepIndex = explanationSteps.length ? 0 : -1;
    renderCurrentExplanationStep();

    const result = await tryRunWithWasm(source);
    console.log("WASM result:", result);

    if (!result.ok) {
      const friendlyError = result.error_text || "The program could not run.";
      showInlineError(friendlyError);
      setOutput("Run stopped because of an error.");
      setBusyState(false);
      showFeedback(friendlyError, "error");
      return;
    }

    setOutput(result.stdout_text || "Program finished successfully.");
    hasRunAtLeastOnce = true;

    const events = parseTraceJsonl(result.trace_jsonl);
    const traceMap = buildExplanationStepsFromTrace(events, source);
    const mergedSteps = mergeExplanationSteps(sourceSteps, traceMap);

    explanationSteps = mergedSteps;
    currentStepIndex = explanationSteps.length ? 0 : -1;
    renderCurrentExplanationStep();

    activateHistoryUI();
    updateHistoryButtonState();

    lastInterpretationSnapshot = buildInterpretationRecord({
      mode: "run",
      source,
      output: result.stdout_text || "",
      explanationSteps: mergedSteps,
    });

    setBusyState(false);
    showFeedback("Execution finished successfully.", "success");
  } catch (error) {
    console.error(error);
    showInlineError("Something unexpected went wrong.");
    showFeedback("Something unexpected went wrong.", "error");
    setOutput("Run stopped because of an unexpected error.");
    setBusyState(false);
  }
}

function setSaveButtonLabel(label) {
  if (!saveBtn) return;
  saveBtn.textContent = label;
}

function flashSavedState() {
  if (!saveBtn) return;

  if (saveFeedbackTimer) {
    window.clearTimeout(saveFeedbackTimer);
    saveFeedbackTimer = null;
  }

  saveBtn.classList.add("action-btn--saved");
  setSaveButtonLabel("Saved!");

  saveFeedbackTimer = window.setTimeout(() => {
    saveBtn.classList.remove("action-btn--saved");
    setSaveButtonLabel("Save Interpretation");
  }, 1400);
}

function handleSaveInterpretation() {
  clearInlineError();

  if (!lastInterpretationSnapshot) {
    showInlineError("Run an interpretation first, then save it.");
    showFeedback("Run or explain something first, then save it.", "warn");
    return;
  }

  if (!getRememberPreference()) {
    showInlineError("“Remember on this device” is off, so this interpretation was not saved.");
    showFeedback("Saving is off because “Remember on this device” is disabled.", "warn");
    return;
  }

  saveHistoryItem(lastInterpretationSnapshot);
  renderHistoryList();
  updateHistoryButtonState();
  flashSavedState();
  pulseHistoryButton();
  showFeedback("Interpretation saved to local history.", "success");
  lastRenderedHistoryKey = "";
}

  function clearWorkspace() {
    stopPlayback();
    clearInlineError();
    lastInterpretationSnapshot = null;
    activeHistoryItemId = null;
    sessionHasInterpretation = false;
    updateHistoryButtonState();

    detectedLanguage = "Unknown";
    detectedFileName = "";
    updateLanguageUI();

    if (liveExplainTimer) {
      window.clearTimeout(liveExplainTimer);
      liveExplainTimer = null;
    }

    if (sourceInput) {
      sourceInput.value = "";
    }

    if (fileInput) {
      fileInput.value = "";
    }

    if (fileStatus) {
      fileStatus.textContent = "No file loaded";
    }

    explanationSteps = [];
    currentStepIndex = -1;
    hasRunAtLeastOnce = false;
    renderEmptyExplanationState();
    setOutput("Ready.");

    if (saveBtn) {
      saveBtn.classList.remove("action-btn--saved");
      saveBtn.textContent = "Save Interpretation";
    }

    showFeedback("Workspace cleared.", "info");

    lastRenderedHistoryKey = "";
  }

function scheduleLivePreview() {
  if (liveExplainTimer) {
    window.clearTimeout(liveExplainTimer);
  }

  liveExplainTimer = window.setTimeout(() => {
    if (!sourceInput) return;

    const source = sourceInput.value || "";
    if (!source.trim()) return;

    renderLiveExplanationPreview(source);
  }, 160);
}

function resetSaveButtonState() {
  if (!saveBtn) return;
  saveBtn.classList.remove("action-btn--saved");
  saveBtn.textContent = "Save Interpretation";
}

  async function handleFileUpload(event) {
    clearInlineError();

    const file = event?.target?.files?.[0];
    if (!file) return;

    detectedFileName = file?.name || "";

    try {
      const text = await file.text();

      if (sourceInput) {
        sourceInput.value = text;
      }

      refreshDetectedLanguage();

      if (fileStatus) {
        fileStatus.textContent = `Loaded: ${file.name}`;
      }

      const lowerName = file.name.toLowerCase();
      const knownCodeExtension =
        lowerName.endsWith(".cpp") ||
        lowerName.endsWith(".cc") ||
        lowerName.endsWith(".cxx") ||
        lowerName.endsWith(".c") ||
        lowerName.endsWith(".h") ||
        lowerName.endsWith(".hpp") ||
        lowerName.endsWith(".py") ||
        lowerName.endsWith(".js") ||
        lowerName.endsWith(".ts") ||
        lowerName.endsWith(".java") ||
        lowerName.endsWith(".cs") ||
        lowerName.endsWith(".go") ||
        lowerName.endsWith(".rs") ||
        lowerName.endsWith(".php") ||
        lowerName.endsWith(".rb") ||
        lowerName.endsWith(".swift") ||
        lowerName.endsWith(".kt") ||
        lowerName.endsWith(".txt");

      if (!knownCodeExtension) {
        showInlineError(
          "This file was loaded, but its extension is unusual for the interpreter. Please check whether it matches the supported language."
        );
      }
    } catch (error) {
      showInlineError("The selected file could not be read.");
    }
  }

  function showHowToUse() {
    window.alert(
      [
        "How to use ISeeCode:",
        "",
        "1. Write or upload your code in the left panel.",
        "2. Click Run.",
        "3. Read the simple explanation on the right.",
        "4. Check the Output panel below for the program result.",
        "5. Review the full explanation list after each run.",
        "",
        "Best results currently come from the project language and simple C/C++-style beginner code."
      ].join("\n")
    );
  }

  function showHistory() {
    const history = loadHistory();

    if (!history.length) {
      window.alert("No saved interpretation history yet.");
      return;
    }

    const preview = history
      .map((item, index) => {
        const status = item.ok ? "Success" : "Error";
        const firstLine = (item.source || "").split("\n").find((line) => line.trim()) || "(empty)";
        return `${index + 1}. ${status} — ${firstLine}`;
      })
      .join("\n\n");

    window.alert(`Recent history:\n\n${preview}`);
  }

  function showAccountMessage() {
    window.alert(
      "Account features are planned for a later stage. For now, your recent interpretation history is stored locally in this browser."
    );
  }

function wireEvents() {

  fileInput?.addEventListener("change", handleFileUpload);
  runBtn?.addEventListener("click", runProgram);
  clearBtn?.addEventListener("click", clearWorkspace);
  howToUseBtn?.addEventListener("click", showHowToUse);
  accountBtn?.addEventListener("click", showAccountMessage);

  saveBtn?.addEventListener("click", handleSaveInterpretation);
  historyBtn?.addEventListener("click", () => {
    const saved = loadHistory();
    if (!sessionHasInterpretation && saved.length === 0) return;
    openHistoryPanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && historyPanel && !historyPanel.classList.contains("hidden")) {
      closeHistoryPanel();
    }
  });

  closeHistoryBtn?.addEventListener("click", closeHistoryPanel);

  historyBackdrop?.addEventListener("click", closeHistoryPanel);

  clearHistoryBtn?.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      renderHistoryList();
      updateHistoryButtonState();
      closeHistoryPanel();
    } catch (error) {
      console.warn("Failed to clear history:", error);
    }
  });

  rememberHistoryToggle?.addEventListener("change", (event) => {
    setRememberPreference(!!event.target.checked);
  });

  historyList?.addEventListener("click", (event) => {
    const loadButton = event.target.closest("[data-load-history-id]");
    if (loadButton) {
      loadHistoryItemIntoWorkspace(loadButton.getAttribute("data-load-history-id"));
      return;
    }

  const renameButton = event.target.closest("[data-rename-history-id]");
  if (renameButton) {
    const itemId = renameButton.getAttribute("data-rename-history-id");
    const items = getNormalizedHistoryItems();
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    startHistoryTitleEdit(itemId, item.title);
    return;
  }

  const saveTitleButton = event.target.closest("[data-save-title-history-id]");
  if (saveTitleButton) {
    commitHistoryTitleEdit(saveTitleButton.getAttribute("data-save-title-history-id"));
    return;
  }

  const cancelTitleButton = event.target.closest("[data-cancel-title-history-id]");
  if (cancelTitleButton) {
    cancelHistoryTitleEdit();
    return;
  }

  const pinButton = event.target.closest("[data-pin-history-id]");
  if (pinButton) {
    togglePinHistoryItem(pinButton.getAttribute("data-pin-history-id"));
    return;
  }

  const deleteButton = event.target.closest("[data-delete-history-id]");
    if (deleteButton) {
      deleteHistoryItem(deleteButton.getAttribute("data-delete-history-id"));
    }
  });

  historyList?.addEventListener("input", (event) => {
    const input = event.target.closest("[data-history-title-input]");
    if (!input) return;
    editingHistoryDraft = input.value;
  });

  historyList?.addEventListener("keydown", (event) => {
    const input = event.target.closest("[data-history-title-input]");
    if (!input) return;

  if (event.key === "Enter") {
    event.preventDefault();
    commitHistoryTitleEdit(input.getAttribute("data-history-title-input"));
  }

  if (event.key === "Escape") {
      event.preventDefault();
      cancelHistoryTitleEdit();
    }
  });

  historySearchInput?.addEventListener("input", (event) => {
    historySearchQuery = event.target.value || "";
    renderHistoryList();
  });

  editorFontSize?.addEventListener("change", () => {
    editorStyleState.size = Number(editorFontSize.value) || 16;
    applyEditorStyles();
  });

  boldTextBtn?.addEventListener("click", () => {
    editorStyleState.bold = !editorStyleState.bold;
    applyEditorStyles();
    setToolbarActiveState(boldTextBtn, editorStyleState.bold);
  });

  italicTextBtn?.addEventListener("click", () => {
    editorStyleState.italic = !editorStyleState.italic;
    applyEditorStyles();
    setToolbarActiveState(italicTextBtn, editorStyleState.italic);
  });

  underlineTextBtn?.addEventListener("click", () => {
    editorStyleState.underline = !editorStyleState.underline;
    applyEditorStyles();
    setToolbarActiveState(underlineTextBtn, editorStyleState.underline);
  });

  executionModeBtn?.addEventListener("click", () => {
    setInterpreterMode("run");
  });

  readingModeBtn?.addEventListener("click", () => {
    setInterpreterMode("explain");
  });

sourceInput?.addEventListener("input", () => {
  clearInlineError();
  scheduleLivePreview();
  resetSaveButtonState();
  refreshDetectedLanguage();
}
);


async function init() {
  renderEmptyExplanationState();
  setOutput("Ready.");
  applyEditorStyles();
  setToolbarActiveState(boldTextBtn, false);
  setToolbarActiveState(italicTextBtn, false);
  setToolbarActiveState(underlineTextBtn, false);

  if (rememberHistoryToggle) {
    rememberHistoryToggle.checked = getRememberPreference();
  }

  updateHistoryButtonState();
  renderHistoryList();
  setInterpreterMode("run");
  updateLanguageUI();
  
  wireEvents();
  await loadInterpreterModule();
}

  init();
}}());