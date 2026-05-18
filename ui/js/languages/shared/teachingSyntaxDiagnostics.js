export function analyzeTeachingSyntaxLine(line, lineNumber) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed === "{" || trimmed === "}") {
    return null;
  }

  if (
    /^(print|let|input)\b/.test(trimmed) &&
    !trimmed.endsWith(";")
  ) {
    return {
      line: lineNumber,
      description: "This statement is missing a semicolon ;",
      text: line,
    };
  }

  if (trimmed.startsWith("print")) {
    if (!/^print\s*\(\s*[^)]+\s*\)\s*;\s*$/.test(trimmed)) {
      return {
        line: lineNumber,
        description: 'Use print like: print("Hello");',
        text: line,
      };
    }

    return null;
  }

  if (trimmed.startsWith("let")) {
    if (!/^let\s+[A-Za-z_]\w*\s*=\s*[^;]+;\s*$/.test(trimmed)) {
      return {
        line: lineNumber,
        description: "Use let like: let age = 20;",
        text: line,
      };
    }

    return null;
  }

  if (trimmed.startsWith("input")) {
    if (!/^input\s*\(\s*[A-Za-z_]\w*\s*\)\s*;\s*$/.test(trimmed)) {
      return {
        line: lineNumber,
        description: "Use input like: input(name);",
        text: line,
      };
    }

    return null;
  }

  if (trimmed.startsWith("else if")) {
    if (!trimmed.includes("(") || !trimmed.includes(")")) {
      return {
        line: lineNumber,
        description: "Conditions must use parentheses like: else if (x > 0) {",
        text: line,
      };
    }

    if (!/^else\s+if\s*\(.+\)\s*\{\s*$/.test(trimmed)) {
      return {
        line: lineNumber,
        description: "Use else if like: else if (condition) {",
        text: line,
      };
    }

    return null;
  }

  if (trimmed.startsWith("if")) {
    if (!trimmed.includes("(") || !trimmed.includes(")")) {
      return {
        line: lineNumber,
        description: "Conditions must use parentheses like: if (x > 0) {",
        text: line,
      };
    }

    if (!/^if\s*\(.+\)\s*\{\s*$/.test(trimmed)) {
      return {
        line: lineNumber,
        description: "Use if like: if (condition) {",
        text: line,
      };
    }

    return null;
  }

  if (trimmed.startsWith("else")) {
    if (!/^else\s*\{\s*$/.test(trimmed)) {
      return {
        line: lineNumber,
        description: "Use else like: else {",
        text: line,
      };
    }

    return null;
  }

  if (trimmed.startsWith("while")) {
    if (!trimmed.includes("(") || !trimmed.includes(")")) {
      return {
        line: lineNumber,
        description: "Conditions must use parentheses like: while (x < 10) {",
        text: line,
      };
    }

    if (!/^while\s*\(.+\)\s*\{\s*$/.test(trimmed)) {
      return {
        line: lineNumber,
        description: "Use while like: while (condition) {",
        text: line,
      };
    }

    return null;
  }

  if (/^[A-Za-z_]\w*\s*=/.test(trimmed)) {
    if (!/^[A-Za-z_]\w*\s*=\s*[^;]+;\s*$/.test(trimmed)) {
      return {
        line: lineNumber,
        description: "Use assignment like: age = age + 1;",
        text: line,
      };
    }

    return null;
  }

  return null;
}