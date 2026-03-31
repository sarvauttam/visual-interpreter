let wasmModule = null;

async function loadInterpreterModule() {
  if (typeof window.VisualInterpreterModule !== "function") {
    console.warn("VisualInterpreterModule is not available.");
    return null;
  }

  try {
    wasmModule = await window.VisualInterpreterModule();
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

  const prevStepBtn = $("prevStepBtn");
  const playPauseBtn = $("playPauseBtn");
  const nextStepBtn = $("nextStepBtn");

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
  const inlineErrorHost = $("inlineErrorHost");

  const STORAGE_KEY = "isee_code_history";
  const MAX_HISTORY_ITEMS = 12;

  let explanationSteps = [];
  let currentStepIndex = -1;
  let playTimer = null;

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

    if (!explanationSteps.length || currentStepIndex < 0 || currentStepIndex >= explanationSteps.length) {
      renderEmptyExplanationState();
      return;
    }

    const step = explanationSteps[currentStepIndex];
    const total = explanationSteps.length;

    explanationsPanel.innerHTML = `
      <div class="explanation-block">
        <p class="explanation-code">${escapeHtml(step.code || "")}</p>
        <p class="explanation-text">${escapeHtml(step.explanation || "")}</p>
      </div>
      <div class="explanation-block">
        <p class="explanation-text">Step ${currentStepIndex + 1} of ${total}</p>
      </div>
    `;
  }

  function stopPlayback() {
    if (playTimer) {
      window.clearInterval(playTimer);
      playTimer = null;
    }

    if (playPauseBtn) {
      playPauseBtn.textContent = "Play";
    }
  }

  function startPlayback() {
    if (!explanationSteps.length) return;

    stopPlayback();

    if (playPauseBtn) {
      playPauseBtn.textContent = "Pause";
    }

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

  function buildFriendlyExplanation(line) {
    const trimmed = line.trim();

    if (!trimmed) {
      return "This line is empty, so nothing happens yet.";
    }

    if (/^#include\s*</.test(trimmed)) {
      return "This line brings in a library so the program can use ready-made tools from C++.";
    }

    if (/^using\s+namespace\s+/.test(trimmed)) {
      return "This line tells the program which namespace to use so names can be written more simply.";
    }

    if (/^int\s+main\s*\(/.test(trimmed)) {
      return "This is the main starting point of the program. Execution begins here.";
    }

    if (/^return\b/.test(trimmed)) {
      return "This line tells the current function to finish and send a value back.";
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
      return "This line gives the alternative block to run when the previous condition is false.";
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
      return "This opening brace starts a new code block.";
    }

    if (trimmed === "}") {
      return "This closing brace ends the current code block.";
    }

    if (/=/.test(trimmed) && !/==/.test(trimmed)) {
      return "This line updates a variable by putting a value into it.";
    }

    if (/[+\-*/%]/.test(trimmed)) {
      return "This line performs a calculation to produce a new value.";
    }

    return "This line is part of the program logic and helps the program move forward step by step.";
  }

  function buildExplanationStepsFromSource(source) {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    const steps = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      steps.push({
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
    const steps = [];

    for (const event of events) {
      const lineNumber = event?.loc?.line;
      if (!lineNumber || lineNumber < 1 || lineNumber > sourceLines.length) continue;

      const code = sourceLines[lineNumber - 1] || "";
      if (!code.trim()) continue;

      let explanation = "";

      switch (event.type) {
        case "ProgramStart":
          explanation = "The program is starting now.";
          break;
        case "ProgramEnd":
          explanation = "The program has finished running.";
          break;
        case "VarDeclare":
          explanation = `A new variable named ${event.name ?? "unknown"} is created here.`;
          break;
        case "VarWrite":
          explanation = `A variable is updated here with a new value${event.value !== undefined ? `: ${event.value}` : ""}.`;
          break;
        case "VarRead":
          explanation = `The program reads a variable value here so it can keep working.`;
          break;
        case "BranchDecision":
          explanation = `The program checks a condition here and decides which path to follow.`;
          break;
        case "LoopCheck":
          explanation = `The loop condition is checked here to decide whether to continue.`;
          break;
        case "CallStart":
        case "CallEnter":
          explanation = `A function call begins here.`;
          break;
        case "Return":
          explanation = `The function finishes here and returns control.`;
          break;
        case "Print":
          explanation = `This step sends something to the output area.`;
          break;
        case "Error":
          explanation = `Something went wrong here, so the program stops and reports the problem.`;
          break;
        default:
          explanation = buildFriendlyExplanation(code);
          break;
      }

      steps.push({
        code,
        explanation,
      });
    }

    const uniqueSteps = [];
    const seen = new Set();

    for (const step of steps) {
      const key = `${step.code}__${step.explanation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueSteps.push(step);
    }

    return uniqueSteps;
  }

  async function tryRunWithWasm(source) {
    if (!wasmModule) {
      await loadInterpreterModule();
    }

    if (!wasmModule) {
      return {
        ok: false,
        error_text: "The interpreter module is not available yet.",
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
    clearInlineError();
    stopPlayback();

    const source = sourceInput ? sourceInput.value : "";

    if (!source.trim()) {
      showInlineError("Please write or upload some code first.");
      setOutput("Ready.");
      explanationSteps = [];
      currentStepIndex = -1;
      renderEmptyExplanationState();
      return;
    }

    setOutput("Running...");
    explanationSteps = [];
    currentStepIndex = -1;
    renderEmptyExplanationState();

    const result = await tryRunWithWasm(source);

    if (!result.ok) {
      const friendlyError = result.error_text || "The program could not run.";
      showInlineError(friendlyError);
      setOutput("Run stopped because of an error.");

      explanationSteps = buildExplanationStepsFromSource(source);
      currentStepIndex = explanationSteps.length ? 0 : -1;
      renderCurrentExplanationStep();

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

    const events = parseTraceJsonl(result.trace_jsonl);
    const traceSteps = buildExplanationStepsFromTrace(events, source);
    const fallbackSteps = buildExplanationStepsFromSource(source);

    explanationSteps = traceSteps.length ? traceSteps : fallbackSteps;
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
        "4. Use Prev, Play, and Next to move through the explanation steps.",
        "5. Check the Output panel below for the program result.",
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

  function goToPreviousStep() {
    stopPlayback();

    if (!explanationSteps.length) return;
    if (currentStepIndex <= 0) {
      currentStepIndex = 0;
    } else {
      currentStepIndex -= 1;
    }

    renderCurrentExplanationStep();
  }

  function goToNextStep() {
    stopPlayback();

    if (!explanationSteps.length) return;
    if (currentStepIndex >= explanationSteps.length - 1) {
      currentStepIndex = explanationSteps.length - 1;
    } else {
      currentStepIndex += 1;
    }

    renderCurrentExplanationStep();
  }

  function togglePlayPause() {
    if (!explanationSteps.length) return;

    if (playTimer) {
      stopPlayback();
      return;
    }

    if (currentStepIndex < 0) {
      currentStepIndex = 0;
      renderCurrentExplanationStep();
    }

    startPlayback();
  }

  function wireEvents() {
    fileInput?.addEventListener("change", handleFileUpload);
    runBtn?.addEventListener("click", runProgram);
    clearBtn?.addEventListener("click", clearWorkspace);
    saveBtn?.addEventListener("click", showHistory);

    prevStepBtn?.addEventListener("click", goToPreviousStep);
    nextStepBtn?.addEventListener("click", goToNextStep);
    playPauseBtn?.addEventListener("click", togglePlayPause);

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

    sourceInput?.addEventListener("input", () => {
      clearInlineError();
    });
  }

  async function init() {
    renderEmptyExplanationState();
    setOutput("Ready.");
    applyEditorStyles();
    setToolbarActiveState(boldTextBtn, false);
    setToolbarActiveState(italicTextBtn, false);
    setToolbarActiveState(underlineTextBtn, false);
    updateHistoryButtonState();
    wireEvents();
    await loadInterpreterModule();
  }

  init();
})();