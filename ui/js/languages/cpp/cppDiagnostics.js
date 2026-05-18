import { analyzeTeachingSyntaxLine } from "../shared/teachingSyntaxDiagnostics.js";

import {
  removeDiagnosticsBox,
  renderDiagnosticsBox,
  renderDiagnosticsSummary,
} from "../shared/diagnosticsRenderer.js";

import { CPP_PROFILE } from "../../languageProfiles/cppProfile.js";

import {
  makeError,
  matchesAnySupportedLine,
  findRuleByName,
} from "../shared/diagnosticsUtils.js";

function findClosestRule(line) {
  const trimmed = line.trim();

  if (trimmed.startsWith("print")) {
    return { message: 'Use print like: print("Hello");' };
  }

  if (trimmed.startsWith("#")) {
    return findRuleByName(CPP_PROFILE, "include library");
  }

  if (trimmed.startsWith("using")) {
    return findRuleByName(CPP_PROFILE, "namespace std");
  }

  if (trimmed.includes("main")) {
    return findRuleByName(CPP_PROFILE, "main open");
  }

  if (trimmed.includes("cout") || trimmed.includes("coot")) {
    return findRuleByName(CPP_PROFILE, "cout output");
  }

  if (trimmed.startsWith("int ")) {
    return findRuleByName(CPP_PROFILE, "int variable");
  }

  if (trimmed.startsWith("string ")) {
    return findRuleByName(CPP_PROFILE, "string variable");
  }

  if (trimmed.includes("return")) {
    return findRuleByName(CPP_PROFILE, "return zero");
  }

  if (trimmed.includes("}")) {
    return findRuleByName(CPP_PROFILE, "close brace");
  }

  if (trimmed.startsWith("if")) {
    return findRuleByName(CPP_PROFILE, "if statement");
  }

  if (trimmed.startsWith("else if")) {
    return findRuleByName(CPP_PROFILE, "else if statement");
  }

  if (trimmed.startsWith("else")) {
    return findRuleByName(CPP_PROFILE, "else statement");
  }

  if (trimmed.startsWith("for")) {
    return findRuleByName(CPP_PROFILE, "for loop");
  }

  if (trimmed.startsWith("while")) {
    return findRuleByName(CPP_PROFILE, "while loop");
  }

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

    trimmed === "print" ||
    trimmed === "print(" ||
    trimmed.startsWith("print(") ||

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

function isTeachingSyntaxSource(source) {
  const lines = String(source || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));

  if (!lines.length) return false;

  return lines.every((line) => {
    return (
      /^print\s*\(\s*[^)]+\s*\)\s*;\s*$/.test(line) ||
      /^let\s+[A-Za-z_]\w*\s*=\s*[^;]+;\s*$/.test(line) ||
      /^input\s*\(\s*[A-Za-z_]\w*\s*\)\s*;\s*$/.test(line) ||
      /^if\s*\(.+\)\s*\{\s*$/.test(line) ||
      /^else\s*\{\s*$/.test(line) ||
      /^else\s+if\s*\(.+\)\s*\{\s*$/.test(line) ||
      /^while\s*\(.+\)\s*\{\s*$/.test(line) ||
      /^[A-Za-z_]\w*\s*=\s*[^;]+;\s*$/.test(line) ||
      /^return\b.*;?\s*$/.test(line) ||
      /^\}\s*$/.test(line)
    );
  });
}

export function analyzeCppSource(source, options = {}) {
  const requireCompleteProgram = options.requireCompleteProgram === true;
  const errors = [];
  const lines = String(source || "").split("\n");

  if (requireCompleteProgram && isTeachingSyntaxSource(source)) {
    return [];
  }

  let hasMain = false;
  let hasReturn = false;
  let braceBalance = 0;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith("//")) {
      return;
    }

    const teachingSyntaxError = analyzeTeachingSyntaxLine(line, lineNumber);

    if (teachingSyntaxError) {
      errors.push(teachingSyntaxError);
      return;
    }

    if (line.includes("{")) braceBalance += 1;
    if (line.includes("}")) braceBalance -= 1;

    if (/^int\s+main\s*\(\s*\)\s*\{/.test(line)) hasMain = true;
    if (/^return\s+0\s*;/.test(line)) hasReturn = true;

    if (!requireCompleteProgram && looksIncompleteButNotWrong(line)) {
      return;
    }

    if (!matchesAnySupportedLine(line, CPP_PROFILE)) {
      const closest = findClosestRule(line);

      errors.push(
        makeError(
          lineNumber,
          closest
            ? closest.message
            : "This line is outside the currently supported beginner syntax.",
          line
        )
      );
    }
  });

  if (requireCompleteProgram) {
    if (String(source || "").trim() && !hasMain && !isTeachingSyntaxSource(source)) {
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

  function checkLive(source) {
    const errors = analyzeCppSource(source, { requireCompleteProgram: false });
    renderDiagnosticsSummary(dom, errors);
    return errors;
  }

  function checkForRun(source) {
    const errors = analyzeCppSource(source, { requireCompleteProgram: true });
    currentErrors = errors;
    renderDiagnosticsBox(dom, errors);
    return errors;
  }

  function schedule(source) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      checkLive(source);
    }, 500);
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