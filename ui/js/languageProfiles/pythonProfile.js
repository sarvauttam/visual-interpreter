export const pythonProfile = {
  language: "Python",
  signals: [
    { pattern: /^\s*def\s+\w+\s*\(/m, weight: 6 },
    { pattern: /^\s*import\s+\w+/m, weight: 5 },
    { pattern: /^\s*from\s+\w+\s+import\s+/m, weight: 6 },
    { pattern: /^\s*print\s*\(/m, weight: 4 },
    { pattern: /^\s*class\s+\w+\s*:/m, weight: 5 },
    { pattern: /^\s*if\s+.+:\s*$/m, weight: 4 },
    { pattern: /^\s*elif\s+.+:\s*$/m, weight: 4 },
    { pattern: /^\s*else\s*:\s*$/m, weight: 3 },
    { pattern: /^\s*for\s+.+\s+in\s+.+:\s*$/m, weight: 5 },
    { pattern: /^\s*while\s+.+:\s*$/m, weight: 4 },
    { pattern: /^\s*return\b/m, weight: 1 },
    { pattern: /^\s*True\b|^\s*False\b/m, weight: 2 },
  ],
  reason:
    "This looks like Python code. ISeeCode can explain it, but it does not execute Python in the browser runner.",

  explainLine(line, lineNumber, add) {
    const trimmed = line.trim();
    if (!trimmed) return false;

    if (/^#/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This is a comment. It helps the reader understand the code, but Python does not run it."
      );
      return true;
    }

    if (/^import\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line imports a module so the program can use code from somewhere else."
      );
      return true;
    }

    if (/^from\b.+\bimport\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line imports specific names from another module so they can be used directly here."
      );
      return true;
    }

    if (/^class\s+\w+\s*:/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines a class, which groups related data and behavior together."
      );
      return true;
    }

    if (/^def\s+\w+\s*\([^)]*\)\s*:/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines a function, which is a reusable block of code."
      );
      return true;
    }

    if (/^print\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line prints something to the screen."
      );
      return true;
    }

    if (/^if\s+.+:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line checks a condition and runs the indented block only if the condition is true."
      );
      return true;
    }

    if (/^elif\s+.+:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line checks another condition if the earlier condition was false."
      );
      return true;
    }

    if (/^else\s*:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts the fallback block that runs when earlier conditions were false."
      );
      return true;
    }

    if (/^for\s+.+\s+in\s+.+:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a loop that goes through items one by one."
      );
      return true;
    }

    if (/^while\s+.+:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a loop that keeps running while the condition stays true."
      );
      return true;
    }

    if (/^return\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line ends the function and sends a value back."
      );
      return true;
    }

    if (/^break\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line stops the current loop immediately."
      );
      return true;
    }

    if (/^continue\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line skips the rest of the current loop iteration and moves to the next one."
      );
      return true;
    }

    if (/^pass\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line tells Python to do nothing here. It is often used as a placeholder."
      );
      return true;
    }

    if (/^raise\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line raises an error on purpose."
      );
      return true;
    }

    if (/^try\s*:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a try block, which means Python will watch for errors in the indented code below."
      );
      return true;
    }

    if (/^except\b.*:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts the error-handling block that runs if a matching error happens."
      );
      return true;
    }

    if (/^finally\s*:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a block that runs at the end, whether or not an error happened."
      );
      return true;
    }

    if (/^with\b.+:\s*$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a with block, which is often used to manage files or resources safely."
      );
      return true;
    }

    if (/^\w+\s*=\s*.+/.test(trimmed) && !/==/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line stores a value in a variable."
      );
      return true;
    }

    if (/^\w+\s*\(.+\)$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line calls a function, which means it asks another block of code to run."
      );
      return true;
    }

    if (/^\[.*\]$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line creates or shows a list, which is an ordered collection of values."
      );
      return true;
    }

    if (/^\{.*\}$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line creates or shows a dictionary or set, depending on the contents inside the braces."
      );
      return true;
    }

    if (/^(True|False|None)\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line uses one of Python’s special built-in values."
      );
      return true;
    }

    add(
      lineNumber,
      line,
      "This line is part of the Python program logic."
    );
    return true;
  },
};