const CPP_STEPS = [
  {
    line: "#include <iostream>",
    explanation: "This brings in tools for printing text, like cout.",
  },
  {
    line: "using namespace std;",
    explanation: "This lets us write cout instead of std::cout.",
  },
  {
    line: "int main() {",
    explanation: "Every C++ program starts running inside main.",
  },
  {
    line: '  cout << "Hello, world!" << endl;',
    explanation: "This prints a friendly message.",
  },
  {
    line: "  return 0;",
    explanation: "This tells the computer the program finished successfully.",
  },
  {
    line: "}",
    explanation: "This closes the main function.",
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeLine(line) {
  return String(line || "").trim().replace(/\s+/g, " ");
}

function linesMatch(userLine, expectedLine) {
  return normalizeLine(userLine) === normalizeLine(expectedLine);
}

export function createGuidedModeController(dom, editor) {
  let active = false;
  let autoInsert = false;
  let bubble = null;
  let currentStepIndex = 0;

  function getCode() {
    if (editor && typeof editor.getCode === "function") {
      return editor.getCode();
    }

    return dom.codeInput?.value || "";
  }

  function setCode(value) {
    if (editor && typeof editor.setCode === "function") {
      editor.setCode(value);
      return;
    }

    if (dom.codeInput) {
      dom.codeInput.value = value;
      dom.codeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function getTypedLines() {
    return getCode()
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.trim() !== "");
  }

  function calculateCurrentStepIndex() {
    const typedLines = getTypedLines();

    let stepIndex = 0;

    for (let i = 0; i < CPP_STEPS.length; i += 1) {
      const typedLine = typedLines[i];
      const expectedLine = CPP_STEPS[i].line;

      if (!typedLine) break;

      if (!linesMatch(typedLine, expectedLine)) {
        break;
      }

      stepIndex += 1;
    }

    return stepIndex;
  }

  function getCurrentUserLine() {
    const typedLines = getTypedLines();
    return typedLines[currentStepIndex] || "";
  }

  function cleanup() {
    bubble?.remove();
    bubble = null;
  }

  function stop() {
    active = false;
    cleanup();
  }

  function insertExpectedLine() {
    const step = CPP_STEPS[currentStepIndex];

    if (!step) return;

    const typedLines = getTypedLines();

    typedLines[currentStepIndex] = step.line;

    setCode(typedLines.join("\n"));

    currentStepIndex = calculateCurrentStepIndex();
    render();
  }

  function render() {
    cleanup();

    if (!active) return;

    currentStepIndex = calculateCurrentStepIndex();

    const step = CPP_STEPS[currentStepIndex];
    const currentUserLine = getCurrentUserLine();

    bubble = document.createElement("div");
    bubble.className = "guided-bubble";

    if (!step) {
      bubble.innerHTML = `
        <h3>Great job!</h3>
        <p>You finished your first guided C++ program.</p>
        <button type="button" data-guided-stop>Close Guided Mode</button>
      `;
    } else {
      const hasWrongLine =
        currentUserLine.trim() !== "" &&
        !linesMatch(currentUserLine, step.line);

      bubble.innerHTML = `
        <h3>Type this line:</h3>

        <code>${escapeHtml(step.line)}</code>

        <p>${escapeHtml(step.explanation)}</p>

        ${
          hasWrongLine
            ? `<p class="guided-error">This line does not match yet. Fix it before moving on.</p>`
            : ""
        }

        <label class="guided-toggle">
          <input type="checkbox" data-guided-auto ${autoInsert ? "checked" : ""}>
          Auto insert line
        </label>

        <div class="guided-actions">
          <button type="button" data-guided-insert>Insert this line</button>
          <button type="button" data-guided-stop>Stop</button>
        </div>
      `;
    }

    document.body.appendChild(bubble);

    const target = dom.codeInput;
    const rect = target?.getBoundingClientRect();

    if (rect) {
      const left = rect.right + 14;
      const safeLeft = Math.max(16, Math.min(left, window.innerWidth - 360));
      const safeTop = Math.max(16, Math.min(rect.top + 40, window.innerHeight - 240));

      bubble.style.left = `${safeLeft}px`;
      bubble.style.top = `${safeTop}px`;
    } else {
      bubble.style.left = "24px";
      bubble.style.top = "24px";
    }

    bubble.querySelector("[data-guided-insert]")?.addEventListener("click", insertExpectedLine);

    bubble.querySelector("[data-guided-stop]")?.addEventListener("click", stop);

    bubble.querySelector("[data-guided-auto]")?.addEventListener("change", (event) => {
      autoInsert = event.target.checked;

      if (autoInsert) {
        insertExpectedLine();
      }
    });
  }

  function start() {
    active = true;
    currentStepIndex = calculateCurrentStepIndex();
    render();
  }

  function handleInput() {
    if (!active) return;
    render();
  }

  return {
    start,
    stop,
    handleInput,
  };
}