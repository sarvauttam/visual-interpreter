export const javascriptProfile = {
  language: "JavaScript",
  signals: [
    { pattern: /\bfunction\s+\w+\s*\(/, weight: 5 },
    { pattern: /\bconst\s+\w+\s*=/, weight: 5 },
    { pattern: /\blet\s+\w+\s*=/, weight: 4 },
    { pattern: /\bvar\s+\w+\s*=/, weight: 4 },
    { pattern: /\bconsole\.log\s*\(/, weight: 6 },
    { pattern: /=>/, weight: 5 },
    { pattern: /\bdocument\./, weight: 5 },
    { pattern: /\bimport\s+.+\s+from\s+['"]/, weight: 5 },
    { pattern: /\bexport\b/, weight: 4 },
    { pattern: /\bclass\s+\w+/, weight: 2 },
    { pattern: /\basync\s+function\b/, weight: 5 },
    { pattern: /\bawait\b/, weight: 3 },
  ],
  reason:
    "This looks like JavaScript. ISeeCode can explain it, but it does not execute JavaScript in the current browser runner.",

  explainLine(line, lineNumber, add) {
    const trimmed = line.trim();
    if (!trimmed) return false;

    if (/^\/\//.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This is a comment. It helps the reader understand the code, but JavaScript does not run it."
      );
      return true;
    }

    if (/^import\b.+\bfrom\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line imports code from another file or module so it can be used here."
      );
      return true;
    }

    if (/^export\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line exports code so it can be used in another file."
      );
      return true;
    }

    if (/^class\s+\w+/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines a class, which groups related data and behavior together."
      );
      return true;
    }

    if (/^async\s+function\s+\w+\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines an async function, which can wait for asynchronous work to finish."
      );
      return true;
    }

    if (/^function\s+\w+\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines a function, which is a reusable block of code."
      );
      return true;
    }

    if (/=>/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line uses an arrow function, which is a shorter way to write a function."
      );
      return true;
    }

    if (/^(const|let|var)\s+\w+\s*=/.test(trimmed)) {
      const keyword = trimmed.match(/^(const|let|var)\b/)?.[1] || "variable";

      if (keyword === "const") {
        add(
          lineNumber,
          line,
          "This line creates a constant value that should not be reassigned later."
        );
        return true;
      }

      if (keyword === "let") {
        add(
          lineNumber,
          line,
          "This line creates a variable whose value can change later."
        );
        return true;
      }

      add(
        lineNumber,
        line,
        "This line creates a variable and stores a value in it."
      );
      return true;
    }

    if (/^\w+\s*=/.test(trimmed) && !/==/.test(trimmed) && !/===/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line changes the value stored in a variable."
      );
      return true;
    }

    if (/^console\.log\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line prints a message to the console."
      );
      return true;
    }

    if (/^if\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line checks a condition and runs the next block if it is true."
      );
      return true;
    }

    if (/^else\s+if\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line checks another condition if the earlier one was false."
      );
      return true;
    }

    if (/^else\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts the alternative block for when the earlier condition is false."
      );
      return true;
    }

    if (/^for\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a loop that repeats with a setup, condition, and update."
      );
      return true;
    }

    if (/^while\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a loop that runs while the condition stays true."
      );
      return true;
    }

    if (/^do\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a do-while loop, which runs the block once before checking the condition."
      );
      return true;
    }

    if (/^return\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line ends the function and returns a value."
      );
      return true;
    }

    if (/^break\s*;?$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line stops the current loop or switch immediately."
      );
      return true;
    }

    if (/^continue\s*;?$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line skips the rest of the current loop iteration and moves to the next one."
      );
      return true;
    }

    if (/^try\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a try block, which means JavaScript will watch for errors in the block below."
      );
      return true;
    }

    if (/^catch\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts the error-handling block that runs if an error happens."
      );
      return true;
    }

    if (/^finally\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a block that runs at the end whether or not an error happened."
      );
      return true;
    }

    if (/^await\b/.test(trimmed) || /\bawait\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line waits for asynchronous work to finish before continuing."
      );
      return true;
    }

    if (/^document\./.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line works with the web page using the browser document object."
      );
      return true;
    }

    if (/^\w+\s*\(.+\)\s*;?$/.test(trimmed)) {
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
        "This line creates or shows an array, which is an ordered list of values."
      );
      return true;
    }

    if (/^\{.*\}$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line creates or shows an object, which stores named values together."
      );
      return true;
    }

    if (trimmed === "{") {
      add(
        lineNumber,
        line,
        "This brace opens a new block of code."
      );
      return true;
    }

    if (trimmed === "}") {
      add(
        lineNumber,
        line,
        "This brace closes the block of code above it."
      );
      return true;
    }

    add(
      lineNumber,
      line,
      "This line is part of the JavaScript program logic."
    );
    return true;
  },
};