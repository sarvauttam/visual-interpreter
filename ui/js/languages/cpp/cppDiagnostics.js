const CPP_PROFILE = [
    {
    name: "include library",
    pattern: /^#include\s*<[a-zA-Z_][a-zA-Z0-9_]*>\s*$/,
    message: "Use the include format: #include <library_name>",
    },
  {
    name: "namespace std",
    pattern: /^using\s+namespace\s+std\s*;\s*$/,
    message: "Use exactly: using namespace std;",
  },
  {
    name: "main open",
    pattern: /^int\s+main\s*\(\s*\)\s*\{\s*$/,
    message: "Use: int main() {",
  },
  {
    name: "cout output",
    pattern: /^cout\s*(<<\s*[^;]+)+\s*;\s*$/,
    message: "Use cout with << operators and finish the line with a semicolon.",
  },
  {
    name: "cout variable",
    pattern: /^cout\s*<<\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(<<\s*endl)?\s*;\s*$/,
    message: "Use cout with << and end with semicolon.",
  },
  {
    name: "cin input",
    pattern: /^cin\s*(>>\s*[a-zA-Z_][a-zA-Z0-9_]*)+\s*;\s*$/,
    message: "Use cin with >> followed by variable names.",
  },
  {
    name: "int variable",
    pattern: /^int\s+[a-zA-Z_][a-zA-Z0-9_]*\s*(=\s*-?\d+)?\s*;\s*$/,
    message: "Use int like: int age = 10;",
  },
  {
    name: "string variable",
    pattern: /^string\s+[a-zA-Z_][a-zA-Z0-9_]*\s*(=\s*"([^"\\]|\\.)*")?\s*;\s*$/,
    message: 'Use string like: string name = "Alex";',
  },
  {
    name: "if statement",
    pattern: /^if\s*\(.+\)\s*\{\s*$/,
    message: "Use if like: if (condition) {",
  },

  {
    name: "else statement",
    pattern: /^else\s*\{\s*$/,
    message: "Use else like: else {",
  },

  {
    name: "else if statement",
    pattern: /^else\s+if\s*\(.+\)\s*\{\s*$/,
    message: "Use else if like: else if (condition) {",
  },

  {
    name: "for loop",
    pattern: /^for\s*\(.+;.+;.+\)\s*\{\s*$/,
    message: "Use for like: for (start; condition; update) {",
  },

  {
    name: "while loop",
    pattern: /^while\s*\(.+\)\s*\{\s*$/,
    message: "Use while like: while (condition) {",
  },
  {
    name: "return zero",
    pattern: /^return\s+0\s*;\s*$/,
    message: "Use exactly: return 0;",
  },
  {
    name: "close brace",
    pattern: /^\}\s*$/,
    message: "Use } to close the main function.",
  },
];

function makeError(line, description, text = "") {
  return { line, description, text };
}

function matchesAnySupportedLine(line) {
  return CPP_PROFILE.some((rule) => rule.pattern.test(line));
}

function findClosestRule(line) {
  const trimmed = line.trim();

  if (trimmed.startsWith("#")) return CPP_PROFILE[0];
  if (trimmed.startsWith("using")) return CPP_PROFILE[1];
  if (trimmed.includes("main")) return CPP_PROFILE[2];
  if (trimmed.includes("cout") || trimmed.includes("coot")) return CPP_PROFILE[3];
  if (trimmed.startsWith("int ")) return CPP_PROFILE[5];
  if (trimmed.startsWith("string ")) return CPP_PROFILE[6];
  if (trimmed.includes("return")) return CPP_PROFILE[7];
  if (trimmed.includes("}")) return CPP_PROFILE[8];
  if (trimmed.startsWith("if")) return CPP_PROFILE.find((rule) => rule.name === "if statement");
  if (trimmed.startsWith("else if")) return CPP_PROFILE.find((rule) => rule.name === "else if statement");
  if (trimmed.startsWith("else")) return CPP_PROFILE.find((rule) => rule.name === "else statement");
  if (trimmed.startsWith("for")) return CPP_PROFILE.find((rule) => rule.name === "for loop");
  if (trimmed.startsWith("while")) return CPP_PROFILE.find((rule) => rule.name === "while loop");

  return null;
}

function looksIncompleteButNotWrong(line) {
  const trimmed = line.trim();

  return (
    trimmed === "#" ||
    trimmed === "#include" ||
    trimmed === "#include <" ||

    trimmed === "using" ||
    trimmed === "using namespace" ||
    trimmed === "using namespace std" ||

    trimmed === "int" ||
    trimmed === "float" ||
    trimmed === "double" ||
    trimmed === "char" ||
    trimmed === "bool" ||
    trimmed === "string" ||

    trimmed === "int main" ||
    trimmed === "int main(" ||
    trimmed === "int main()" ||

    trimmed === "cout" ||
    trimmed === "cout <<" ||
    trimmed.startsWith("cout <<") ||

    trimmed === "cin" ||
    trimmed === "cin >>" ||
    trimmed.startsWith("cin >>") ||

    trimmed === "if" ||
    trimmed === "if (" ||

    trimmed === "for" ||
    trimmed === "for (" ||

    trimmed === "while" ||
    trimmed === "while (" ||

    trimmed === "return" ||
    trimmed === "return 0"
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function analyzeCppSource(source, options = {}) {
  const requireCompleteProgram = options.requireCompleteProgram === true;
  const errors = [];
  const lines = String(source || "").split("\n");

  let hasMain = false;
  let hasReturn = false;
  let braceBalance = 0;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith("//")) return;

    if (line.includes("{")) braceBalance += 1;
    if (line.includes("}")) braceBalance -= 1;

    if (/^int\s+main\s*\(\s*\)\s*\{/.test(line)) hasMain = true;
    if (/^return\s+0\s*;/.test(line)) hasReturn = true;

    if (!requireCompleteProgram && looksIncompleteButNotWrong(line)) {
      return;
    }

    if (!matchesAnySupportedLine(line)) {
      const closest = findClosestRule(line);

      errors.push(
        makeError(
          lineNumber,
          closest
            ? closest.message
            : "This line is outside the currently supported beginner C++ format.",
          line
        )
      );
    }
  });

  if (requireCompleteProgram) {
    if (String(source || "").trim() && !hasMain) {
      errors.push(makeError(1, "Missing required line: int main() {"));
    }

    if (hasMain && !hasReturn) {
      errors.push(makeError(lines.length, "Missing required line: return 0;"));
    }

    if (braceBalance !== 0) {
      errors.push(makeError(lines.length, "Opening and closing braces do not match."));
    }
  } else if (braceBalance < 0) {
    errors.push(makeError(lines.length, "You have an extra closing brace }."));
  }

  return errors;
}

export function createCppDiagnosticsController(dom) {
  let timer = null;
  let currentErrors = [];

  function removeDiagnosticsBox() {
    document.querySelector(".diagnostics-box")?.remove();
  }

  function render(errors) {
    currentErrors = Array.isArray(errors) ? errors : [];

    removeDiagnosticsBox();

    if (dom.codeInput) {
      dom.codeInput.classList.toggle("code-input--has-error", currentErrors.length > 0);
    }

    if (!currentErrors.length) return;

    const box = document.createElement("div");
    box.className = "diagnostics-box";
    box.innerHTML = `
    <h3>Fix these errors first</h3>
    ${currentErrors.map((error) => `
        <div class="diagnostics-error-item">
        <p>
            <strong>Error:</strong>
            ${error.description}
            <span>Line ${error.line}</span>
        </p>
        ${error.text ? `<code>${escapeHtml(error.text)}</code>` : ""}
        </div>
    `).join("")}
    `;

    if (dom.explanationContent) {
      dom.explanationContent.prepend(box);
    }
  }

  function checkLive(source) {
    const errors = checkNow(source);

    renderDiagnosticsSummary(dom, errors);

    return errors;
  }

  function checkForRun(source) {
    const errors = analyzeCppSource(source, { requireCompleteProgram: true });
    render(errors);
    return errors;
  }

  function schedule(source) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      checkLive(source);
    }, 500);
  }

  function renderDiagnosticsSummary(dom, errors) {
    document.querySelector(".diagnostics-summary")?.remove();

    if (!errors.length || !dom.explanationContent) {
      return;
    }

    const summary = document.createElement("div");
    summary.className = "diagnostics-summary";

    summary.innerHTML = `
      <h3>Problems found</h3>

      <ul>
        ${errors.map((error) => `
          <li>
            Line ${error.lineNumber}: ${error.message}
          </li>
        `).join("")}
      </ul>
    `;

    dom.explanationContent.prepend(summary);
  }

  function clear() {
    currentErrors = [];
    removeDiagnosticsBox();

    if (dom.codeInput) {
      dom.codeInput.classList.remove("code-input--has-error");
    }
  }

  return {
    schedule,
    checkLive,
    checkForRun,
    clear,
    hasErrors: () => currentErrors.length > 0,
  };
}