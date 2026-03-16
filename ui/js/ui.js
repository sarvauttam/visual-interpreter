let wasmModule = null;

async function loadInterpreter() {
  wasmModule = await VisualInterpreterModule();
}

loadInterpreter();

(function () {
  const $ = (id) => document.getElementById(id);

  // --- DOM ---
  const btnPrev = $("btnPrev");
  const btnPlay = $("btnPlay");
  const btnNext = $("btnNext");
  const btnHowItWorks = $("btnHowItWorks");
  const helpBubble = document.getElementById("helpBubble");
  const helpBubbleText = document.getElementById("helpBubbleText");
  const MAX_TRACE_EVENTS = 5000;

  const howItWorksModal = document.getElementById("howItWorksModal");
  const btnCloseHowModal = document.getElementById("btnCloseHowModal");

  const fileSource = $("fileSource");

  const btnRun = $("btnRun");
  const btnUploadSource = $("btnUploadSource");
  const btnClearProgram = $("btnClearProgram");
  const sourceEditor = $("sourceEditor");
  const codeInlineStatus = $("codeInlineStatus");

  const sourceName = $("sourceName");

  const codePre = $("code");      // <pre id="code">
  const codeText = $("codeText"); // <code id="codeText"> (used as fallback)
  const consoleEl = $("changesOutput");

  const toggleAutoScroll = document.getElementById("toggleAutoScroll");
  const autoScrollIndicator = document.getElementById("autoScrollIndicator");

  const togglePredict = document.getElementById("togglePredict");
  const predictScore = document.getElementById("predictScore");

  const predictCard = document.getElementById("predictCard");
  const predictQuestion = document.getElementById("predictQuestion");
  const predictInput = document.getElementById("predictInput");
  const predictFeedback = document.getElementById("predictFeedback");
  const btnPredictSubmit = document.getElementById("btnPredictSubmit");
  const btnPredictSkip = document.getElementById("btnPredictSkip");
  
  const changesNarration = $("changesNarration");
  const changesSummary = $("changesSummary");
  const changesHistory = $("changesHistory");
  const changesOutput = $("changesOutput");

  const HELP_TEXT = {
  code: "This is the code panel. You write or paste your program here, and during playback this panel shows which line is currently being executed.",
  changes: "This panel explains what the current step means. It shows a beginner-friendly narration, a technical summary, recent event history, and any compact printed output.",
  variables: "This panel shows the program variables at the current point in execution. It helps you see which values exist now and how they change over time.",
  stack: "This panel shows the call stack. It helps you see which function is currently active and how the program moves in and out of function calls.",
  how: "Write or upload code, then run it to generate an execution trace automatically. After that, use Prev, Play, Next, and the timeline to explore the program step by step."
  };

  howItWorksModal?.classList.add("howModal--hidden");
  howItWorksModal?.setAttribute("aria-hidden", "true");

  function showHelpBubble(targetKey, anchorEl) {
    if (!helpBubble || !helpBubbleText || !anchorEl) return;

    helpBubbleText.textContent = HELP_TEXT[targetKey] ?? "No help available.";
    helpBubble.classList.remove("helpBubble--hidden");
    helpBubble.setAttribute("aria-hidden", "false");

    const rect = anchorEl.getBoundingClientRect();
    const bubbleWidth = 280;
    const left = Math.min(
      window.innerWidth - bubbleWidth - 16,
      Math.max(16, rect.left)
    );
    const top = rect.bottom + 10;

    helpBubble.style.left = `${left}px`;
    helpBubble.style.top = `${top}px`;
  }

  function hideHelpBubble() {
    if (!helpBubble) return;
    helpBubble.classList.add("helpBubble--hidden");
    helpBubble.setAttribute("aria-hidden", "true");
  }

  function updateAutoScrollIndicator() {
    if (!autoScrollIndicator || !toggleAutoScroll) return;

    if (toggleAutoScroll.checked) {
      autoScrollIndicator.textContent = "ON";
      autoScrollIndicator.classList.add("autoscr-ind--on");
      autoScrollIndicator.classList.remove("autoscr-ind--off");
    } else {
      autoScrollIndicator.textContent = "OFF";
      autoScrollIndicator.classList.add("autoscr-ind--off");
      autoScrollIndicator.classList.remove("autoscr-ind--on");
    }
  }

let currentHelpKey = null;

  document.querySelectorAll(".panelHelpBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const key = btn.getAttribute("data-help-target");

      if (!helpBubble.classList.contains("helpBubble--hidden") && currentHelpKey === key) {
        hideHelpBubble();
        currentHelpKey = null;
        return;
      }

      showHelpBubble(key, btn);
      currentHelpKey = key;
    });
  });

  document.addEventListener("click", (e) => {
    const clickedInsideBubble = helpBubble?.contains(e.target);
    const clickedHelpButton = e.target.closest(".panelHelpBtn") || e.target.closest("#btnHowItWorks");

    if (!clickedInsideBubble && !clickedHelpButton) {
      hideHelpBubble();
      currentHelpKey = null;
    }
  });

  toggleAutoScroll?.addEventListener("change", updateAutoScrollIndicator);
  updateAutoScrollIndicator();
  // --- State ---
  let trace = [];
  let currentIndex = -1;

  let originalSource = "";
  let varsByDepth = {}; // depth -> { name: value }
  let callStack = [{ name: "<global>", depth: 0 }];
  let lastVarChange = null; // { depth:number, name:string, kind:"new"|"update" }

  const timelineTrack = $("timelineTrack");
  const timelineFill = $("timelineFill");
  const timelineThumb = $("timelineThumb");
  const timelineLabel = $("timelineLabel");

  let predictEnabled = false;
  let predictPending = null; // { type, expected, prompt, stepIndex }
  let predictTotal = 0;
  let predictCorrect = 0;

  function updateTimeline() {
  if (!timelineTrack || !timelineFill || !timelineThumb || !timelineLabel) return;

  if (!trace.length) {
    timelineFill.style.width = "0%";
    timelineThumb.style.left = "0%";
    timelineLabel.textContent = "0%";
    return;
  }

  const progress = currentIndex < 0 ? 0 : (currentIndex + 1) / trace.length;
  const percent = Math.min(Math.max(progress * 100, 0), 100);

  timelineFill.style.width = percent + "%";
  timelineThumb.style.left = percent + "%";
  timelineLabel.textContent = Math.round(percent) + "%";
}

  function showPredictCard(prompt) {
    if (!predictCard || !predictQuestion || !predictInput || !predictFeedback) return;
    predictQuestion.textContent = prompt;
    predictInput.value = "";
    predictFeedback.textContent = "";
    predictCard.classList.remove("predictCard--hidden");
    predictCard.setAttribute("aria-hidden", "false");
    predictInput.focus();
  }

  function hidePredictCard() {
    if (!predictCard) return;
    predictCard.classList.add("predictCard--hidden");
    predictCard.setAttribute("aria-hidden", "true");
  }

  function updatePredictScore() {
    if (!predictScore) return;
    predictScore.textContent = `Score: ${predictCorrect}/${predictTotal}`;
  }

  togglePredict?.addEventListener("change", () => {
  predictEnabled = !!togglePredict.checked;
  if (!predictEnabled) {
    predictPending = null;
    hidePredictCard();
  }
});

  // Play
  let playTimer = null;

  // --- Helpers ---
  function appendToConsole(text) {
    if (!consoleEl) return;
    consoleEl.textContent += text + "\n";

    const auto = document.getElementById("toggleAutoScroll");
    const shouldScroll = !auto || auto.checked;

    if (shouldScroll) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }

  function clearConsole() {
    if (!consoleEl) return;
    consoleEl.textContent = "";
  }

  function resetChangesPanel() {
  if (changesNarration) {
    changesNarration.textContent = "Paste your code here or upload your file, then run the program.";
  }

  if (changesSummary) {
    changesSummary.textContent = "—";
  }

  if (changesHistory) {
    changesHistory.innerHTML = "";
  }

  if (changesOutput) {
    changesOutput.textContent = "";
  }
}

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function setInlineStatus(text) {
    if (codeInlineStatus) codeInlineStatus.textContent = text;
  }

  function showEditorMode() {
    if (sourceEditor) sourceEditor.hidden = false;
    if (codePre) codePre.hidden = true;
  }

  function showPlaybackCodeMode() {
    if (sourceEditor) sourceEditor.hidden = true;
    if (codePre) codePre.hidden = false;
  }

    function setNarration(text, icon = "💡") {
  const barText = document.getElementById("changesNarration");  
    if (barText) barText.textContent = text;

    // Append to narration history log if present
    const logList = document.getElementById("narrationLogList");
if (logList) {
  const prev = logList.querySelector(".nlog-current");
    if (prev) prev.classList.remove("nlog-current");

    const li = document.createElement("li");
    li.textContent = `${icon} ${text}`;
    li.classList.add("nlog-current");
    logList.prepend(li);

    const btn = document.getElementById("btnNarrationLog");
    if (btn) btn.textContent = `Log (${logList.children.length})`;

    while (logList.children.length > 30) {
      logList.removeChild(logList.lastChild);
    }
  }
}

    const btnNarrationLog = document.getElementById("btnNarrationLog");
    const btnHistoryTab = document.getElementById("btnHistoryTab");
    const narrationLog = document.getElementById("narrationLog");

    function openHistoryDrawer() {
    narrationLog?.classList.remove("drawer--hidden");
    narrationLog?.setAttribute("aria-hidden", "false");
    if (btnHistoryTab) btnHistoryTab.textContent = "History >>";
  }

  function closeHistoryDrawer() {
    narrationLog?.classList.add("drawer--hidden");
    narrationLog?.setAttribute("aria-hidden", "true");
    if (btnHistoryTab) btnHistoryTab.textContent = "History <<";
  }

  function toggleHistoryDrawer() {
    if (!narrationLog) return;
    const isHidden = narrationLog.classList.contains("drawer--hidden");
    if (isHidden) openHistoryDrawer();
    else closeHistoryDrawer();
  }

    btnNarrationLog?.addEventListener("click", toggleHistoryDrawer);
    btnHistoryTab?.addEventListener("click", toggleHistoryDrawer);

    btnHowItWorks?.addEventListener("click", () => {
  howItWorksModal?.classList.remove("howModal--hidden");
  howItWorksModal?.setAttribute("aria-hidden", "false");
});

  function renderCodeHighlight(activeLine) {
    if (!codePre) return;

    const src =
      originalSource ||
      (sourceEditor ? sourceEditor.value : "") ||
      (codeText ? codeText.textContent : "");
    const lines = src.split("\n");

    const html = lines
      .map((t, i) => {
        const ln = i + 1;
        const safe = escapeHtml(t);
        if (ln === activeLine) {
          return `<div class="codeLine active"><span class="gutter">${ln}</span><span class="txt">${safe}</span></div>`;
        }
        return `<div class="codeLine"><span class="gutter">${ln}</span><span class="txt">${safe}</span></div>`;
      })
      .join("");

    codePre.innerHTML = html;
  }

 function narrateEvent(ev) {
  if (!ev || !ev.type) return;

  switch (ev.type) {
    case "ProgramStart":
      setNarration(
        "The program is starting now. Execution begins in the global working area, before any functions are entered.",
        "🚀"
      );
      break;

    case "ProgramEnd":
      setNarration(
        "The program has finished running. There are no more steps to execute.",
        "✅"
      );
      break;

    case "StepStart":
      setNarration(
        "A new step is beginning. The program is about to process the next part of the code.",
        "▶️"
      );
      break;

    case "StepEnd":
      setNarration(
        "This step is finished. The program is ready to move on to the next one.",
        "⏹️"
      );
      break;

    case "VarDeclare":
      setNarration(
        `A new variable is being created. Its name is ${ev.name}, and its starting value is ${ev.value}. From now on, the program can use ${ev.name} in later steps.`,
        "🧮"
      );
      break;

    case "VarRead":
      setNarration(
        `The program is looking at the current value of ${ev.name}. Right now, ${ev.name} is ${ev.value}. It needs this value to continue the calculation.`,
        "👀"
      );
      break;

    case "VarWrite":
      setNarration(
        `The program is changing the value of ${ev.name}. Before this step, ${ev.name} was ${ev.old}. After this step, ${ev.name} becomes ${ev.new}.`,
        "🧮"
      );
      break;

    case "ExprStart":
      setNarration(
        "The program is starting to work out an expression. It will gather values and operators to compute a result.",
        "🧠"
      );
      break;

    case "ExprValue":
      setNarration(
        `The program has obtained a value inside the expression. That value is ${ev.value}.`,
        "🔹"
      );
      break;

    case "ExprOp":
      setNarration(
        `The program is working out an expression. It combines the needed values using the operator and produces the result ${ev.result ?? "?"}.`,
        "➗"
      );
      break;

    case "ShortCircuit":
      setNarration(
        "The program does not need to check the second part of this condition. The first part already tells it the final answer, so the second part is skipped.",
        "⚡"
      );
      break;

    case "BranchDecision":
      setNarration(
        `The program is checking a condition. The condition is ${ev.taken ? "true" : "false"}, so the program will go into the ${ev.taken ? "if" : "else"} block.`,
        "🧭"
      );
      break;

    case "LoopCheck":
      setNarration(
        `The program is checking whether the loop should continue. The condition is ${ev.cond ? "true, so another loop step will run" : "false, so the loop will stop"}.`,
        "🔁"
      );
      break;

    case "LoopIterationStart":
      setNarration(
        "A new loop iteration is starting. The program is going through the loop body again.",
        "🔁"
      );
      break;

    case "LoopExit":
      setNarration(
        "The loop is finished. The program will continue with the next code after the loop.",
        "🏁"
      );
      break;

    case "CallStart":
      setNarration(
        "The program is calling a function. Before it can enter that function, it must prepare the values that will be passed in.",
        "📞"
      );
      break;

    case "CallArg":
      setNarration(
        `One of the function inputs has been worked out. Argument ${Number(ev.index) + 1} has the value ${ev.value}.`,
        "🧩"
      );
      break;

    case "CallEnter": {
      const fn = ev.callee ?? ev.frame?.name ?? "<fn>";
      setNarration(
        `The program is calling a function. This creates a new working area for that function. The values passed into ${fn} become its local inputs.`,
        "🧱"
      );
      break;
    }

    case "Return":
      setNarration(
        `The function has finished its work. It is sending the value ${ev.value} back to the place where it was called. Now the program continues from that earlier point.`,
        "↩️"
      );
      break;

    case "Print":
      setNarration(
        `The program is producing output. It prints the value ${ev.text ?? ev.value ?? ""}.`,
        "🖨️"
      );
      break;

    case "Input":
      setNarration(
        "The program is waiting for an input value so it can continue running.",
        "⌨️"
      );
      break;

    case "Error":
      setNarration(
        "The program cannot continue because something went wrong. This step caused an error, so execution stops here.",
        "⛔"
      );
      break;

    default:
      setNarration(`The program is processing the event ${ev.type}.`, "💡");
      break;
  }
}

function setTechnicalSummary(ev) {
  if (!changesSummary || !ev) return;

  switch (ev.type) {
    case "ProgramStart":
      changesSummary.textContent = `ProgramStart | frame=${ev.frame?.name ?? "<global>"} | depth=${ev.frame?.depth ?? 0}`;
      break;

    case "ProgramEnd":
      changesSummary.textContent = `ProgramEnd | frame=${ev.frame?.name ?? "<global>"} | depth=${ev.frame?.depth ?? 0}`;
      break;

    case "StepStart":
      changesSummary.textContent = `StepStart | line=${ev.loc?.line ?? "?"} | col=${ev.loc?.col ?? "?"}`;
      break;

    case "StepEnd":
      changesSummary.textContent = `StepEnd | line=${ev.loc?.line ?? "?"} | col=${ev.loc?.col ?? "?"}`;
      break;

    case "VarWrite":
      changesSummary.textContent = `VarWrite | ${ev.name} | old=${ev.old} | new=${ev.new}`;
      break;

    case "VarDeclare":
      changesSummary.textContent = `VarDeclare | ${ev.name} | value=${ev.value}`;
      break;

    case "VarRead":
      changesSummary.textContent = `VarRead | ${ev.name} | value=${ev.value}`;
      break;

    case "ExprStart":
      changesSummary.textContent = `ExprStart | line=${ev.loc?.line ?? "?"} | col=${ev.loc?.col ?? "?"}`;
      break;

    case "ExprValue":
      changesSummary.textContent = `ExprValue | value=${ev.value}`;
      break;

    case "ExprOp":
      changesSummary.textContent = `ExprOp | op=${ev.op ?? "?"} | result=${ev.result ?? "?"}`;
      break;

    case "ShortCircuit":
      changesSummary.textContent = `ShortCircuit | op=${ev.op ?? "?"}`;
      break;

    case "BranchDecision":
      changesSummary.textContent = `BranchDecision | cond=${ev.cond ?? "?"} | taken=${ev.taken ?? "?"}`;
      break;

    case "LoopCheck":
      changesSummary.textContent = `LoopCheck | cond=${ev.cond ?? "?"}`;
      break;

    case "LoopIterationStart":
      changesSummary.textContent = `LoopIterationStart | line=${ev.loc?.line ?? "?"}`;
      break;

    case "LoopExit":
      changesSummary.textContent = `LoopExit | line=${ev.loc?.line ?? "?"}`;
      break;

    case "CallEnter":
      changesSummary.textContent =
        `CallEnter | function=${ev.callee ?? ev.frame?.name ?? "?"} | depth=${ev.frame?.depth ?? "?"}`;
      break;

    case "CallStart":
      changesSummary.textContent =
        `CallStart | function=${ev.callee} | argc=${ev.argc}`;
      break;

    case "CallArg":
      changesSummary.textContent =
        `CallArg | index=${ev.index} | value=${ev.value}`;
      break;

    case "Return":
      changesSummary.textContent =
        `Return | value=${ev.value}`;
      break;

    case "Print":
      changesSummary.textContent =
        `Print | text=${ev.text ?? ev.value ?? ""}`;
      break;

    case "Input":
      changesSummary.textContent = `Input | target=${ev.name ?? "?"}`;
      break;

    case "Error":
      changesSummary.textContent = `Error | message=${ev.message ?? "unknown"}`;
      break;

    default:
      changesSummary.textContent = ev.type;
      break;
  }
}

function summarizeEventForHistory(ev) {
  if (!ev || !ev.type) return "—";

  switch (ev.type) {
    case "VarDeclare":
      return `VarDeclare | ${ev.name} | ${ev.value}`;
    case "VarRead":
      return `VarRead | ${ev.name} | ${ev.value}`;
    case "VarWrite":
      return `VarWrite | ${ev.name} | ${ev.old} → ${ev.new}`;
    case "CallStart":
      return `CallStart | ${ev.callee} | argc=${ev.argc}`;
    case "CallArg":
      return `CallArg | #${Number(ev.index) + 1} | ${ev.value}`;
    case "CallEnter":
      return `CallEnter | ${ev.callee ?? ev.frame?.name ?? "?"} | depth=${ev.frame?.depth ?? "?"}`;
    case "Return":
      return `Return | ${ev.value}`;
    case "BranchDecision":
      return `BranchDecision | taken=${ev.taken ?? "?"}`;
    case "LoopCheck":
      return `LoopCheck | cond=${ev.cond ?? "?"}`;
    case "LoopIterationStart":
      return `LoopIterationStart`;
    case "LoopExit":
      return `LoopExit`;
    case "Print":
      return `Print | ${ev.text ?? ev.value ?? ""}`;
    case "ProgramStart":
      return `ProgramStart`;
    case "ProgramEnd":
      return `ProgramEnd`;
    case "StepStart":
      return `StepStart`;
    case "StepEnd":
      return `StepEnd`;
    case "ShortCircuit":
      return `ShortCircuit | ${ev.op ?? "?"}`;
    case "ExprStart":
      return `ExprStart`;
    case "ExprValue":
      return `ExprValue | ${ev.value ?? "?"}`;
    case "ExprOp":
      return `ExprOp | ${ev.op ?? "?"} | result=${ev.result ?? "?"}`;
    case "Input":
      return `Input | ${ev.name ?? "?"}`;
    case "Error":
      return `Error | ${ev.message ?? "unknown"}`;
    default:
      return ev.type;
  }
}

function renderEventHistoryTo(index) {
  if (!changesHistory) return;

  changesHistory.innerHTML = "";

  if (!trace.length || index <= 0) return;

  const start = Math.max(0, index - 12);

  for (let i = index - 1; i >= start; i--) {
    const ev = trace[i];
    const item = document.createElement("div");
    item.className = "changesHistoryItem";
    item.textContent = summarizeEventForHistory(ev);
    changesHistory.appendChild(item);
  }
}

  function renderVariables(currentDepth) {
    const tbody = $("varsBody");
    const filter = $("varsFrameFilter");
    if (!tbody) return;

    const mode = filter ? filter.value : "current";
    const rows = [];

    const depths = Object.keys(varsByDepth)
      .map((d) => Number(d))
      .sort((a, b) => a - b);

    for (const d of depths) {
      if (mode === "current" && d !== currentDepth) continue;
      const vars = varsByDepth[d] || {};
    for (const [name, data] of Object.entries(vars)) {
      rows.push({ name, value: data, where: `#${d}`, depth: d });
    }
    }

      tbody.innerHTML = rows.map((r) => {
        let cls = "";

        if (lastVarChange && lastVarChange.depth === r.depth && lastVarChange.name === r.name) {
          cls = lastVarChange.kind === "new" ? "var-new" : "var-update";
        }

        const classAttr = cls ? ` class="${cls}"` : "";
        return `<tr${classAttr}>
          <td>${escapeHtml(r.name)}</td>
          <td>${escapeHtml(r.value)}</td>
          <td>${escapeHtml(r.where)}</td>
        </tr>`;
      }).join("");
      lastVarChange = null;
      }

  function renderStack() {
    const list = $("stackList");
    if (!list) return;

  const items = [...callStack].slice().reverse(); // top first

  list.innerHTML = items.map((f, idx) => {
    const cls = idx === 0 ? ' class="stack-current"' : "";
    return `<li${cls}><strong>${escapeHtml(f.name)}</strong> <span class="hint">#${f.depth}</span></li>`;
  }).join("");
  }

  function updateStatus() {
  const codeLocEl = $("codeLoc");
  const total = trace.length;

  updateTimeline();

  if (currentIndex < 0 || total === 0) {
    if (codeLocEl) codeLocEl.textContent = "line —, col —";
    renderCodeHighlight(-1);
    setInlineStatus("Step 0 / 0 | Event: —");
    return;
  }

  const at = Math.min(currentIndex, total - 1);
  const ev = trace[at];

  if (ev?.loc?.line) {
    if (codeLocEl) codeLocEl.textContent = `line ${ev.loc.line}, col ${ev.loc.col ?? "—"}`;
    renderCodeHighlight(ev.loc.line);
  } else {
    if (codeLocEl) codeLocEl.textContent = "line —, col —";
    renderCodeHighlight(-1);
  }

  setInlineStatus(`Step ${at + 1} / ${total} | Event: ${ev?.type ?? "—"}`);
}

  function resetRuntimeState() {
    varsByDepth = {};
    callStack = [{ name: "<global>", depth: 0 }];
    renderVariables(0);
    renderStack();
  }

  function clearProgramState() {
    if (playTimer !== null) {
      clearInterval(playTimer);
      playTimer = null;
    }
    setPlayButton(false);

    trace = [];
    currentIndex = -1;
    originalSource = "";

  if (sourceEditor) sourceEditor.value = "";
  if (sourceName) sourceName.textContent = "No file loaded";
  showEditorMode();
  renderCodeHighlight(-1);

    clearConsole();
    resetRuntimeState();
    resetChangesPanel();

    const codeLocEl = $("codeLoc");
    if (codeLocEl) codeLocEl.textContent = "line —, col —";

    const logList = $("narrationLogList");
    if (logList) logList.innerHTML = "";

    const btnNarrationLog = $("btnNarrationLog");
    if (btnNarrationLog) btnNarrationLog.textContent = "Log";

    updateStatus();
    updateTimeline();
    setInlineStatus("Ready");
    setNarration("Paste your code here or upload your file, then run the program.", "💡");

    document.body.classList.remove("has-trace");
  }
  
  function loadTrace(events) {
    trace = events;
    currentIndex = -1;

    clearConsole();
    resetChangesPanel();

    resetRuntimeState();
    showPlaybackCodeMode();
    updateStatus();
    document.body.classList.add("has-trace");
    setInlineStatus("Trace ready");
    setPlayButton(false);
  }

  let isDragging = false;
  let dragRatio = 0;       // 0..1
  let pendingIndex = -1;   // where we will jump on release

  function setTimelineVisualByRatio(ratio) {
    if (!timelineFill || !timelineThumb || !timelineLabel) return;

    const percent = Math.min(Math.max(ratio * 100, 0), 100);
    timelineFill.style.width = percent + "%";
    timelineThumb.style.left = percent + "%";

    if (trace.length) {
      const idx = Math.floor(ratio * trace.length) - 1;
      const clamped = Math.max(-1, Math.min(idx, trace.length - 1));
      const stepText = clamped < 0 ? "0" : String(clamped + 1);
      const ev = trace[clamped] || null;
      const evType = ev?.type ?? "—";
      const frName = ev?.frame?.name ?? "<global>";
      const frDepth = ev?.frame?.depth ?? 0;

      timelineLabel.textContent = `Scrub: ${stepText}/${trace.length} • ${evType} • ${frName}#${frDepth}`;
      pendingIndex = clamped;
    } else {
      timelineLabel.textContent = Math.round(percent) + "%";
      pendingIndex = -1;
    }
  }

  function ratioFromMouseEvent(e) {
    const rect = timelineTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.min(Math.max(x / rect.width, 0), 1);
  }

  timelineTrack?.addEventListener("mousedown", (e) => {
    if (!trace.length) return;
    isDragging = true;
    dragRatio = ratioFromMouseEvent(e);
    setTimelineVisualByRatio(dragRatio);
  });

  timelineTrack?.addEventListener("click", (e) => {
  if (!trace.length) return;
  // If dragging is active, ignore click (mouseup will commit)
  if (isDragging) return;

  const ratio = ratioFromMouseEvent(e);
  const idx = Math.floor(ratio * trace.length) - 1;
  const clamped = Math.max(-1, Math.min(idx, trace.length - 1));
  replayTo(clamped);
  updateTimeline();
});

  timelineThumb?.addEventListener("mousedown", (e) => {
    if (!trace.length) return;
    e.preventDefault();
    isDragging = true;
    timelineThumb.style.cursor = "grabbing";
    dragRatio = ratioFromMouseEvent(e);
    setTimelineVisualByRatio(dragRatio);
  });

let rafPending = false;
let lastMouseEvent = null;

  document.addEventListener("mousemove", (e) => {
    if (!isDragging || !timelineTrack || !trace.length) return;
    lastMouseEvent = e;

    if (rafPending) return;
    rafPending = true;

    requestAnimationFrame(() => {
      rafPending = false;
      if (!lastMouseEvent) return;

      dragRatio = ratioFromMouseEvent(lastMouseEvent);
      setTimelineVisualByRatio(dragRatio);
    });
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    if (timelineThumb) timelineThumb.style.cursor = "grab";

    // Commit once at release (no jumpy replay)
    replayTo(pendingIndex);

    // Return label to normal percent display
    updateTimeline();
  });

  btnCloseHowModal?.addEventListener("click", () => {
  howItWorksModal?.classList.add("howModal--hidden");
  howItWorksModal?.setAttribute("aria-hidden", "true");
});

howItWorksModal?.addEventListener("click", (e) => {
  if (e.target === howItWorksModal) {
    howItWorksModal.classList.add("howModal--hidden");
    howItWorksModal.setAttribute("aria-hidden", "true");
  }
});

  function handleEvent(ev) {
    if (!ev || !ev.type) return;

    switch (ev.type) {
      case "ProgramStart":
        resetRuntimeState();
        break;

      case "ProgramEnd":
        break;

      case "Print":
        appendToConsole(ev.text ?? ev.value ?? "");
        break;

      case "VarDeclare": {
        const d = ev.frame?.depth ?? 0;
        if (!varsByDepth[d]) varsByDepth[d] = {};
        varsByDepth[d][ev.name] = ev.value ?? "";
        lastVarChange = { depth: d, name: ev.name, kind: "new" };
        break;
      }

      case "VarWrite": {
        const d = ev.frame?.depth ?? 0;
        if (!varsByDepth[d]) varsByDepth[d] = {};
        varsByDepth[d][ev.name] = ev.new ?? "";
        lastVarChange = { depth: d, name: ev.name, kind: "update" };
        break;
      }

      case "CallEnter": {
        const fr = ev.frame;
        if (fr && typeof fr.depth === "number") {
          callStack.push({ name: fr.name ?? ev.callee ?? "<fn>", depth: fr.depth });
        }
        break;
      }

      case "Return":
        if (callStack.length > 1) callStack.pop();
        break;

      default:
        break;
    }
  }

  function replayTo(index) {
  // Rebuild everything from scratch up to `index`
  if (isDragging) return;
  if (playTimer !== null) {
    clearInterval(playTimer);
    playTimer = null;
  }
  setPlayButton(false);
  resetRuntimeState();
  clearConsole();

  currentIndex = -1;
  updateStatus();
  renderStack();
  renderVariables(0);

  for (let i = 0; i <= index; i++) {
    currentIndex = i;
    const ev = trace[i];
    handleEvent(ev);

    // Only narrate the final event we land on (avoid spam during replay)
    if (i === index) {
  narrateEvent(ev);
  setTechnicalSummary(ev);
}
  }

  // After replay, render final state
  const lastEv = trace[index];
  updateStatus();
  renderVariables(lastEv?.frame?.depth ?? 0);
  renderStack();
  renderEventHistoryTo(index);
}

  function getSpeedMs() {
    const slider = $("speed");
    const v = slider ? Number(slider.value) : 35; // 0..100
    return 50 + (100 - v) * 10; // 50..1050ms
  }

  function setPlayButton(isPlaying) {
    if (!btnPlay) return;
    btnPlay.textContent = isPlaying ? "Pause" : "Play";
    btnPlay.style.background = isPlaying ? "#f4a261" : "#4a90e2";
    if (isPlaying) document.body.classList.add("is-playing");
        else document.body.classList.remove("is-playing");
  }
  function stepForwardOnce() {
    if (!trace.length) return false;
    if (currentIndex >= trace.length - 1) return false;

    currentIndex++;
    const ev = trace[currentIndex];

    handleEvent(ev);

    narrateEvent(ev);
    setTechnicalSummary(ev);
    renderEventHistoryTo(currentIndex);

    updateStatus();
    renderVariables(ev.frame?.depth ?? 0);
    renderStack();
    

    if (currentIndex === trace.length - 1) appendToConsole("End of trace.");
    return true;
  }

  // --- File inputs ---
sourceEditor?.addEventListener("input", () => {
  originalSource = sourceEditor.value;
  showEditorMode();
  renderCodeHighlight(-1);

  if (trace.length) {
    trace = [];
    currentIndex = -1;
    document.body.classList.remove("has-trace");
    resetRuntimeState();
    resetChangesPanel();

    const codeLocEl = $("codeLoc");
    if (codeLocEl) codeLocEl.textContent = "line —, col —";

    setNarration("Paste your code here or upload your file, then run the program.", "💡");
    setPlayButton(false);
  }

  setInlineStatus("Edited after run — run again");
});

  fileSource?.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (sourceName) sourceName.textContent = file.name;

    const text = await file.text();
    originalSource = text;

  if (sourceEditor) sourceEditor.value = text;
    showEditorMode();
    renderCodeHighlight(-1);

    trace = [];
    currentIndex = -1;
    document.body.classList.remove("has-trace");
    resetRuntimeState();
    resetChangesPanel();

    const codeLocEl = $("codeLoc");
    if (codeLocEl) codeLocEl.textContent = "line —, col —";

    setNarration("Source file loaded. You can run the program when ready.", "💡");
    setPlayButton(false);
    setInlineStatus("Source file loaded");
  });

  // --- Buttons ---
  btnUploadSource?.addEventListener("click", () => {
    fileSource?.click();
  });

  btnClearProgram?.addEventListener("click", () => {
    clearProgramState();
  });

  btnRun?.addEventListener("click", async () => {
  if (playTimer !== null) {
    clearInterval(playTimer);
    playTimer = null;
    setPlayButton(false);
  }

  const src = sourceEditor ? sourceEditor.value : "";
  if (!src.trim()) {
    setInlineStatus("Enter code before running");
    return;
  }

  originalSource = src;
  renderCodeHighlight(-1);
  setInlineStatus("Running program...");

  if (!wasmModule) {
    setInlineStatus("Interpreter still loading...");
    return;
  }

  try {
    const result = wasmModule.run_source_to_trace(src);

    if (!result.ok) {
      if (changesOutput) changesOutput.textContent = result.error_text || "Runtime error";
      setNarration(
        "The program cannot continue because something went wrong. This step caused an error, so execution stops here.",
        "⛔"
      );
      setTechnicalSummary({ type: "Error", message: result.error_text || "unknown" });
      setInlineStatus("Run failed");
      return;
    }

    const events = result.trace_jsonl
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));

    if (events.length > MAX_TRACE_EVENTS) {
      if (changesOutput) {
        changesOutput.textContent =
          `Trace too large (${events.length} events). Limit is ${MAX_TRACE_EVENTS}.`;
      }

      setNarration(
        "This program produced too many execution steps for the browser view. Please try a smaller example.",
        "⚠️"
      );

      setTechnicalSummary({
        type: "Error",
        message: `Trace too large: ${events.length} events`
      });

      setInlineStatus("Run blocked — trace too large");
      return;
    }

    loadTrace(events);

    if (changesOutput) {
      changesOutput.textContent = result.stdout_text || "";
    }

    setInlineStatus("Trace ready");
  } catch (err) {
    if (changesOutput) changesOutput.textContent = String(err);
    setInlineStatus("Run failed");
  }
});

  btnPrev?.addEventListener("click", () => {
    if (!trace.length) return;
    if (currentIndex <= 0) {
      // back to "before start"
      currentIndex = -1;
      resetRuntimeState();
      clearConsole();
      resetChangesPanel();
      updateStatus();
      renderVariables(0);
      renderStack();
      setNarration("Trace ready. Step through the program to begin learning from the execution.", "💡");
      setInlineStatus("Trace ready");
      setPlayButton(false);
      return;
    }

    replayTo(currentIndex - 1);
  });

  btnPlay?.addEventListener("click", () => {
    if (!trace.length) {
      setInlineStatus("Run the program to begin");
      return;
    }

    if (playTimer !== null) {
      clearInterval(playTimer);
      playTimer = null;
      setPlayButton(false);
      return;
    }

    setPlayButton(true);
    playTimer = setInterval(() => {
      const ok = stepForwardOnce();
      if (!ok) {
        clearInterval(playTimer);
        playTimer = null;
        setPlayButton(false);
      }
    }, getSpeedMs());
  });

    // Initial
    showEditorMode();
    updateStatus();
    renderStack();
    setInlineStatus("Ready");
    closeHistoryDrawer();

  // ---------------- KEYBOARD SHORTCUTS ----------------
document.addEventListener("keydown", (e) => {
  // Ignore if typing inside input fields
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  switch (e.key) {
    case "ArrowRight":
      e.preventDefault();
      stepForwardOnce();
      break;

    case "ArrowLeft":
      e.preventDefault();
      if (currentIndex > -1) {
        replayTo(currentIndex - 1);
      }
      break;

    case " ":
      e.preventDefault();
      btnPlay?.click();
      break;

    case "Home":
      e.preventDefault();
      replayTo(-1);
      break;

    case "End":
      e.preventDefault();
      replayTo(trace.length - 1);
      break;
  }
});
})();