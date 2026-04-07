import {
  buildFallback,
  createRuleContext,
  explainBraces,
  explainComment,
  explainConditionals,
  explainFlowKeywords,
  explainFunctionCall,
  explainLoops,
} from "./sharedRuleUtils.js";

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
    "This looks like JavaScript.\nISeeCode can explain it, but it does not execute JavaScript in the current browser runner.",

  explainLine(line, lineNumber, add, options = {}) {
    const ctx = createRuleContext(line, lineNumber, add);
    const { trimmed } = ctx;
    const confidence = options.confidence || "high";

    if (!trimmed) return false;

    if (
      explainComment(ctx, {
        style: "slash",
        languageName: "JavaScript",
        commentText:
          "This is a comment. It helps the reader understand the code, but JavaScript does not run it.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockStart",
        languageName: "JavaScript",
        commentText:
          "This line starts a block comment. Everything inside the comment is ignored by JavaScript.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockMiddle",
        languageName: "JavaScript",
        commentText:
          "This line is part of a block comment, which is only for explanation or notes.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockEnd",
        languageName: "JavaScript",
        commentText:
          "This line ends a block comment. The comment text is not run by JavaScript.",
      })
    ) {
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
      add(lineNumber, line, "This line prints a message to the console.");
      return true;
    }

    if (
      explainConditionals(ctx, {
        ifPattern: /^if\s*\(/,
        elseIfPattern: /^else\s+if\s*\(/,
        elsePattern: /^else\b/,
        ifText:
          "This line checks a condition and runs the next block if it is true.",
        elseIfText:
          "This line checks another condition if the earlier one was false.",
        elseText:
          "This line starts the alternative block for when the earlier condition is false.",
      })
    ) {
      return true;
    }

    if (
      explainLoops(ctx, {
        forPattern: /^for\s*\(/,
        whilePattern: /^while\s*\(/,
        doPattern: /^do\b/,
        forText:
          "This line starts a loop that repeats with a setup, condition, and update.",
        whileText:
          "This line starts a loop that runs while the condition stays true.",
        doText:
          "This line starts a do-while loop, which runs the block once before checking the condition.",
      })
    ) {
      return true;
    }

    if (
      explainFlowKeywords(ctx, {
        returnPattern: /^return\b/,
        breakPattern: /^break\s*;?$/,
        continuePattern: /^continue\s*;?$/,
        returnText: "This line ends the function and returns a value.",
        breakText: "This line stops the current loop or switch immediately.",
        continueText:
          "This line skips the rest of the current loop iteration and moves to the next one.",
      })
    ) {
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

    if (
      explainFunctionCall(ctx, {
        pattern: /^\w+\s*\(.+\)\s*;?$/,
        explanation:
          "This line calls a function, which means it asks another block of code to run.",
      })
    ) {
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

    if (
      explainBraces(ctx, {
        openPattern: /^\{$/,
        closePattern: /^\}$/,
        openText: "This brace opens a new block of code.",
        closeText: "This brace closes the block of code above it.",
      })
    ) {
      return true;
    }

      add(
        lineNumber,
        line,
        buildFallback({
          languageName: "JavaScript",
          confidence,
          isMixed: !!options.isMixed,
          isPartialSource: !!options.isPartialSource,
          subject: "JavaScript program logic",
        })
      );
    return true;
  },
};