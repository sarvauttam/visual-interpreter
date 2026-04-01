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

  const editorFontSize = $("editorFontSize");
  const boldTextBtn = $("boldTextBtn");
  const italicTextBtn = $("italicTextBtn");
  const underlineTextBtn = $("underlineTextBtn");

  const fileStatus = $("fileStatus");
  const explanationsPanel = $("explanationsPanel");
  const outputPanel = $("outputPanel");
  const activeLinePreview = $("activeLinePreview");
  const inlineErrorHost = $("inlineErrorHost");

  const STORAGE_KEY = "isee_code_history";
  const MAX_HISTORY_ITEMS = 12;

  let explanationSteps = [];
  let currentStepIndex = -1;
  let playTimer = null;
  let liveExplainTimer = null;
  let hasRunAtLeastOnce = false;

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

    function getCursorLineInfo() {
    if (!sourceInput) return null;

    const value = sourceInput.value || "";
    const cursorIndex = sourceInput.selectionStart || 0;
    const beforeCursor = value.slice(0, cursorIndex);
    const lineNumber = beforeCursor.split("\n").length;

    const lines = value.replace(/\r\n/g, "\n").split("\n");
    const line = lines[lineNumber - 1] || "";

    return {
      lineNumber,
      line,
    };
  }

  function renderActiveLinePreview() {
    if (!activeLinePreview || !sourceInput) return;

    const info = getCursorLineInfo();

    if (!info || !sourceInput.value.trim()) {
      activeLinePreview.classList.add("hidden");
      activeLinePreview.innerHTML = "";
      return;
    }

    activeLinePreview.classList.remove("hidden");
    activeLinePreview.innerHTML = `
      <div class="active-line-preview__label">Current line</div>
      <div class="active-line-preview__content">
        <span class="active-line-preview__number">Line ${info.lineNumber}</span>
        <span class="active-line-preview__text">${escapeHtml(info.line || "(empty line)")}</span>
      </div>
    `;
  }

  function highlightMatchingExplanationCard() {
    if (!explanationsPanel || !sourceInput) return;

    const info = getCursorLineInfo();
    const cards = explanationsPanel.querySelectorAll(".explanation-block[data-line-number]");

    cards.forEach((card) => {
      card.classList.remove("explanation-block--active");
    });

    if (!info) return;

    const activeCard = explanationsPanel.querySelector(
      `.explanation-block[data-line-number="${info.lineNumber}"]`
    );

    if (activeCard) {
      activeCard.classList.add("explanation-block--active");
    }
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

    explanationsPanel.innerHTML = `
      <div class="empty-state">
        <div>
          <h3>Ready to explain your code</h3>
          <p>Your code explanations will appear here after you run the program.</p>
        </div>
      </div>
    `;
  }

  function renderCurrentExplanationStep() {
  if (!explanationsPanel) return;

  console.log("Rendering explanation steps:", explanationSteps);

  if (!explanationSteps.length) {
    renderEmptyExplanationState();
    return;
  }

  explanationsPanel.innerHTML = `
    <div class="explanation-list">
      ${explanationSteps
        .map(
          (step, index) => `
            <div class="explanation-block" data-line-number="${step.lineNumber || index + 1}">
              <p class="explanation-code">Line ${step.lineNumber || index + 1}: ${escapeHtml(step.code || "")}</p>
              <p class="explanation-text">${escapeHtml(step.explanation || "")}</p>
              <p class="explanation-step-label">Step ${index + 1} of ${explanationSteps.length}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;

  highlightMatchingExplanationCard();

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
    if (!historyBtn) return;

    const history = loadHistory();
    const hasHistory = history.length > 0;

    if (hasHistory) {
      historyBtn.classList.remove("nav-btn--muted");
    } else {
      historyBtn.classList.add("nav-btn--muted");
    }
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
          <div class="explanation-block explanation-block--pending explanation-block--active" data-line-number="${lastNonEmpty.lineNumber}">
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
              <div class="explanation-block" data-line-number="${step.lineNumber}">
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

    renderActiveLinePreview();
    highlightMatchingExplanationCard();

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
        explanation = `A new variable named ${event.name ?? "unknown"} is created here.`;
        break;
      case "VarWrite":
        explanation = `A variable is updated here with a new value${event.value !== undefined ? `: ${event.value}` : ""}.`;
        break;
      case "VarRead":
        explanation = "The program reads a variable value here so it can keep working.";
        break;
      case "BranchDecision":
        explanation = "The program checks a condition here and decides which path to follow.";
        break;
      case "LoopCheck":
        explanation = "The loop condition is checked here to decide whether to continue.";
        break;
      case "CallStart":
      case "CallEnter":
        explanation = "A function call begins here.";
        break;
      case "Return":
        explanation = "The function finishes here and returns control.";
        break;
      case "Print":
        explanation = "This step sends something to the output area.";
        break;
      case "Error":
        explanation = "Something went wrong here, so the program stops and reports the problem.";
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

  const uniqueSteps = [];
  const seenLineNumbers = new Set();

  for (const step of traceMap.values()) {
    if (seenLineNumbers.has(step.lineNumber)) continue;
    seenLineNumbers.add(step.lineNumber);
    uniqueSteps.push(step);
  }

  return uniqueSteps.sort((a, b) => a.lineNumber - b.lineNumber);
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

    saveHistoryItem({
      createdAt: new Date().toISOString(),
      source,
      ok: false,
      output: "",
      error: friendlyError,
    });

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

  saveHistoryItem({
    createdAt: new Date().toISOString(),
    source,
    ok: true,
    output: result.stdout_text || "",
    error: "",
  });
}

   function clearWorkspace() {
    stopPlayback();
    clearInlineError();

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

    if (activeLinePreview) {
      activeLinePreview.classList.add("hidden");
      activeLinePreview.innerHTML = "";
    }

    renderEmptyExplanationState();
    setOutput("Ready.");
  }

  async function handleFileUpload(event) {
    clearInlineError();

    const file = event?.target?.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();

      if (sourceInput) {
        sourceInput.value = text;
      }

      if (fileStatus) {
        fileStatus.textContent = file.name;
      }

      const lowerName = file.name.toLowerCase();
      const knownCodeExtension =
        lowerName.endsWith(".cpp") ||
        lowerName.endsWith(".cc") ||
        lowerName.endsWith(".cxx") ||
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".c") ||
        lowerName.endsWith(".h") ||
        lowerName.endsWith(".hpp");

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
  saveBtn?.addEventListener("click", showHistory);

  howToUseBtn?.addEventListener("click", showHowToUse);
  historyBtn?.addEventListener("click", showHistory);
  accountBtn?.addEventListener("click", showAccountMessage);

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
}

  sourceInput?.addEventListener("input", () => {
    clearInlineError();
    renderActiveLinePreview();

    if (liveExplainTimer) {
      window.clearTimeout(liveExplainTimer);
    }

    liveExplainTimer = window.setTimeout(() => {
      renderLiveExplanationPreview(sourceInput.value);
    }, 120);
  });

  sourceInput?.addEventListener("click", () => {
    renderActiveLinePreview();
    highlightMatchingExplanationCard();
  });

  sourceInput?.addEventListener("keyup", () => {
    renderActiveLinePreview();
    highlightMatchingExplanationCard();
  });

  
  async function init() {
    renderEmptyExplanationState();
    setOutput("Ready.");
    applyEditorStyles();
    renderActiveLinePreview();
    setToolbarActiveState(boldTextBtn, false);
    setToolbarActiveState(italicTextBtn, false);
    setToolbarActiveState(underlineTextBtn, false);
    updateHistoryButtonState();
    wireEvents();
    await loadInterpreterModule();
  }
}

  init();   
  }
})();
