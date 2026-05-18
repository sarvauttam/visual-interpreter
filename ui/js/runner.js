function renderOutputMessage(container, message, variant = "muted") {
  if (!container) return;

  if (variant === "error") {
    container.innerHTML = `
      <div class="output-error-box">
        <h3>The program could not run</h3>
        <p>${message}</p>
        <p class="muted">
          Read the explanation panel for a simpler description of what likely went wrong.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <p class="output-status output-status--${variant}">${message}</p>
  `;
}

function renderProgramOutput(container, stdoutText) {
  if (!container) return;

  const normalized = String(stdoutText ?? "");
  const trimmed = normalized.trim();

  if (!trimmed) {
    container.innerHTML = `
      <div class="output-empty-success compact-output-message">
        <h3>Your program ran successfully</h3>

        <p>
          The program finished, but nothing was printed to the output.
        </p>

        <p class="muted">
          Use <code>print(...);</code> statements if you want visible output.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="program-output">
      <pre>${normalized}</pre>
    </div>
  `;
}

function renderExplainOnlyOutput(container, languageLabel, reason, confidence = "high") {
  if (!container) return;

  const confidenceText =
    confidence === "high"
      ? "ISeeCode is confident about this language match."
      : confidence === "medium"
        ? "ISeeCode is fairly confident about this language match."
        : "ISeeCode is making a best-effort language guess here.";

  container.innerHTML = `
    <div class="output-empty-success">
      <h3>Explain-only mode</h3>
      <p>
        This code looks like <strong>${languageLabel}</strong>, so ISeeCode will explain it without trying to run it.
      </p>
      <p class="muted">
        ${reason}
      </p>
      <p class="muted">
        ${confidenceText}
      </p>
    </div>
  `;
}

function setRunButtonBusyState(button, isBusy) {
  if (!button) return;

  button.disabled = isBusy;
  button.classList.toggle("button-is-busy", isBusy);
  button.textContent = isBusy ? "Running..." : "Run";
}

function getWasmScriptUrl() {
  return new URL("./vi_wasm.js", import.meta.url).href;
}

function getWasmAssetUrl(assetName) {
  return new URL(`./${assetName}`, import.meta.url).href;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseTraceJsonl(traceJsonl) {
  if (!traceJsonl || !traceJsonl.trim()) {
    return [];
  }

  return traceJsonl
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => safeJsonParse(line))
    .filter(Boolean);
}

function inferEventType(event) {
  return event?.type || event?.event || event?.kind || "";
}

function inferLineNumber(event) {
  if (typeof event?.line === "number") return event.line;
  if (typeof event?.lineNumber === "number") return event.lineNumber;
  if (typeof event?.loc?.line === "number") return event.loc.line;
  if (typeof event?.location?.line === "number") return event.location.line;
  return null;
}

function inferTextFromEvent(event) {
  const candidates = [
    event?.message,
    event?.summary,
    event?.detail,
    event?.description,
    event?.value != null ? `Value: ${String(event.value)}` : "",
    event?.name ? `Related name: ${String(event.name)}` : "",
  ].filter(Boolean);

  return candidates[0] || "";
}

async function loadScriptOnce(src) {
  const existing = document.querySelector(`script[data-wasm-loader="${src}"]`);

  if (existing) {
    if (existing.dataset.loaded === "true") return;

    await new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });

    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.wasmLoader = src;

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      () => {
        reject(new Error(`Failed to load script: ${src}`));
      },
      { once: true }
    );

    document.head.appendChild(script);
  });
}

function buildFriendlyRunError(errorText) {
  const raw = String(errorText || "").trim();

  if (!raw) {
    return {
      title: "Your program could not run",
      summary:
        "ISeeCode could not complete the run, but it did not receive a clear error message.",
      reason:
        "The interpreter stopped before it could explain the exact issue.",
    };
  }

  const lower = raw.toLowerCase();

  if (lower.includes("parseerror") || lower.includes("parse error") || lower.includes("syntax")) {
    return {
      title: "Your code has a syntax problem",
      summary:
        "The program could not run because some part of the code structure is incomplete or written in a form the interpreter cannot read.",
      reason:
        "This usually happens when a semicolon, brace, parenthesis, or statement structure is missing or misplaced.",
    };
  }

  if (lower.includes("undefinedvariable") || lower.includes("undefined variable")) {
    return {
      title: "A variable was used before it was available",
      summary:
        "Your program tried to use a variable name that the interpreter could not find.",
      reason:
        "This usually means the variable was never declared, was misspelled, or was used before it was created.",
    };
  }

  if (lower.includes("redeclarevariable") || lower.includes("redeclare variable")) {
    return {
      title: "A variable was declared more than once",
      summary:
        "Your program tried to create the same variable again in a place where that is not allowed.",
      reason:
        "This usually means the variable name was already used earlier in the same scope.",
    };
  }

  if (lower.includes("assigntoundefined") || lower.includes("assign to undefined")) {
    return {
      title: "A value was assigned to a variable that does not exist yet",
      summary:
        "The program saw an assignment, but the variable had not been declared first.",
      reason:
        "Create the variable before assigning a value to it.",
    };
  }

  if (lower.includes("dividebyzero") || lower.includes("divide by zero")) {
    return {
      title: "Your program tried to divide by zero",
      summary:
        "The run stopped because division by zero is not allowed.",
      reason:
        "Check the value on the right side of the division or modulo operation before running it.",
    };
  }

  if (lower.includes("unknownfunction") || lower.includes("unknown function")) {
    return {
      title: "A function call could not be matched",
      summary:
        "Your code tried to call a function name that the interpreter does not know.",
      reason:
        "This usually means the function does not exist, was misspelled, or is not supported in this language subset.",
    };
  }

  if (lower.includes("aritymismatch") || lower.includes("arity mismatch")) {
    return {
      title: "A function was called with the wrong number of values",
      summary:
        "The function call did not match the number of inputs that the function expects.",
      reason:
        "Check how many arguments the function definition needs and compare that to the call.",
    };
  }

  if (lower.includes("inputerror") || lower.includes("input error")) {
    return {
      title: "The program could not read input correctly",
      summary:
        "The run stopped because the expected input value was missing or invalid.",
      reason:
        "Make sure the program receives the kind of input value it expects.",
    };
  }

  if (lower.includes("execution limit exceeded") || lower.includes("max_steps") || lower.includes("max_call_depth")) {
    return {
      title: "The program ran for too long",
      summary:
        "ISeeCode stopped the run to prevent it from getting stuck.",
      reason:
        "This can happen with an infinite loop or with a function that keeps calling itself too deeply.",
    };
  }

  if (lower.includes("failed to load") || lower.includes("wasm")) {
    return {
      title: "The interpreter could not start properly",
      summary:
        "ISeeCode could not load the browser-based interpreter needed to run your code.",
      reason:
        "This is usually a loading or setup problem rather than a mistake in your code.",
    };
  }

  return {
    title: "Your program could not run",
    summary:
      "The interpreter stopped because it found a problem it could not continue past.",
    reason: raw,
  };
}

export function createRunner(dom) {
  const state = {
    wasmModule: null,
    wasmReady: false,
    wasmLoadAttempted: false,
  };

  function renderClearedOutput() {
    renderOutputMessage(
      dom.outputContent,
      "Nothing has been run yet.",
      "muted"
    );
  }

function getPossibleRunFunctions(moduleRef) {
  return [
    typeof moduleRef?.run_source_to_trace === "function"
      ? moduleRef.run_source_to_trace.bind(moduleRef)
      : null,
  ].filter(Boolean);
}

  async function ensureWasmLoaded() {
  if (state.wasmReady && state.wasmModule) {
    return state.wasmModule;
  }

  if (!state.wasmLoadAttempted) {
    state.wasmLoadAttempted = true;

    await loadScriptOnce(getWasmScriptUrl());

    const factory =
      window.VisualInterpreterModule ||
      globalThis.VisualInterpreterModule;

    if (typeof factory !== "function") {
      throw new Error("VisualInterpreterModule factory was not found after loading vi_wasm.js.");
    }

    const moduleInstance = await factory({
      locateFile: (path) => getWasmAssetUrl(path),
    });

    state.wasmModule = moduleInstance;
    state.wasmReady = true;
  }

  return state.wasmModule;
}

  function normalizeRawResult(rawResult) {
    if (rawResult == null) {
      return {
        ok: false,
        trace_jsonl: "",
        stdout_text: "",
        error_text: "The WASM runner returned no result.",
      };
    }

    if (typeof rawResult === "string") {
      const parsed = safeJsonParse(rawResult);

      if (parsed && typeof parsed === "object") {
        return parsed;
      }

      return {
        ok: false,
        trace_jsonl: "",
        stdout_text: "",
        error_text: rawResult,
      };
    }

    if (typeof rawResult === "object") {
      return rawResult;
    }

    return {
      ok: false,
      trace_jsonl: "",
      stdout_text: "",
      error_text: "Unexpected WASM result format.",
    };
  }

  function buildTraceInsights(traceEvents) {
    return traceEvents
      .map((event) => {
        const type = inferEventType(event);
        const lineNumber = inferLineNumber(event);
        const text = inferTextFromEvent(event);

        return {
          type,
          lineNumber,
          text,
          raw: event,
        };
      })
      .filter((item) => item.type || item.lineNumber || item.text);
  }

async function runSource(source) {
  const trimmed = source.trim();

  if (!trimmed) {
    renderOutputMessage(
      dom.outputContent,
      "Please write some code before running.",
      "muted"
    );

    return {
      ok: false,
      reason: "empty-source",
      stdoutText: "",
      errorText: "",
      traceEvents: [],
      traceInsights: [],
      friendlyError: null,
    };
  }

  setRunButtonBusyState(dom.runBtn, true);
  renderOutputMessage(dom.outputContent, "Running your program...", "info");

  try {
      const normalizedSource = source.replace(/\r\n/g, "\n").trim();

      const wasmModule = await ensureWasmLoaded();

      const runFunctions = getPossibleRunFunctions(wasmModule);

      if (!runFunctions.length) {
        throw new Error(
          "Could not find run_source_to_trace in the loaded WASM bridge."
        );
      }

      let rawResult = null;
      let lastError = null;

      for (const runFn of runFunctions) {
        try {
          rawResult = await runFn(normalizedSource);
          if (rawResult != null) break;
        } catch (error) {
          lastError = error;
        }
      }

      if (rawResult == null && lastError) {
        throw lastError;
      }

      const normalized = normalizeRawResult(rawResult);

      console.log("RUNNER NORMALIZED RESULT:", normalized);

      const traceEvents = parseTraceJsonl(normalized.trace_jsonl || "");
      const traceInsights = buildTraceInsights(traceEvents);

      const stdoutText =
        normalized.stdout_text ??
        normalized.stdout ??
        normalized.output ??
        "";

      if (normalized.ok) {
        renderProgramOutput(dom.outputContent, stdoutText);
      } else {
        renderOutputMessage(
          dom.outputContent,
          normalized.error_text || "The program could not run.",
          "error"
        );
      }

      setRunButtonBusyState(dom.runBtn, false);

      return {
        ok: Boolean(normalized.ok),
        reason: normalized.ok ? "run-success" : "run-error",
        stdoutText:
          normalized.stdout_text ??
          normalized.stdout ??
          normalized.output ??
          "",
        errorText: normalized.error_text || "",
        traceJsonl: normalized.trace_jsonl || "",
        traceEvents,
        traceInsights,
        friendlyError: normalized.ok
          ? null
          : buildFriendlyRunError(normalized.error_text || ""),
      };
    } catch (error) {
      console.error("WASM run failed:", error);

      const message =
        error?.message || "Failed to load or run the interpreter.";

      renderOutputMessage(dom.outputContent, message, "error");
      setRunButtonBusyState(dom.runBtn, false);

      return {
        ok: false,
        reason: "wasm-failure",
        stdoutText: "",
        errorText: message,
        traceEvents: [],
        traceInsights: [],
        friendlyError: buildFriendlyRunError(message),
      };
    }
  }

  function init() {
    return true;
  }

  return {
    init,
    runSource,
    renderClearedOutput,
    renderExplainOnlyOutput,
  };
}