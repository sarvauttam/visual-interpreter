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

export const csharpProfile = {
  language: "C#",
  signals: [
    { pattern: /\busing\s+System\s*;/, weight: 6 },
    { pattern: /\busing\s+[A-Z]\w*(?:\.\w+)*\s*;/, weight: 5 },
    { pattern: /\bnamespace\s+\w+/, weight: 5 },
    { pattern: /\bclass\s+\w+/, weight: 3 },
    { pattern: /\bConsole\.Write(Line)?\s*\(/, weight: 6 },
    { pattern: /\bstatic\s+void\s+Main\s*\(/, weight: 6 },
    { pattern: /\bstring\s*\[\]\s*args/, weight: 5 },
    { pattern: /\bpublic\b/, weight: 2 },
    { pattern: /\bprivate\b/, weight: 2 },
    { pattern: /\basync\b/, weight: 2 },
    { pattern: /\bawait\b/, weight: 2 },
  ],
  reason:
    "This looks like C#.\nISeeCode can explain it, but it does not execute C# in the current browser runner.",

  explainLine(line, lineNumber, add, options = {}) {
    const ctx = createRuleContext(line, lineNumber, add);
    const { trimmed } = ctx;
    const confidence = options.confidence || "high";

    if (!trimmed) return false;

    if (
      explainComment(ctx, {
        style: "slash",
        languageName: "C#",
        commentText:
          "This is a comment. It helps the reader understand the code, but C# does not run it.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockStart",
        languageName: "C#",
        commentText:
          "This line starts a block comment. Everything inside the comment is ignored by C#.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockMiddle",
        languageName: "C#",
        commentText:
          "This line is part of a block comment, which is only for explanation or notes.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockEnd",
        languageName: "C#",
        commentText:
          "This line ends a block comment. The comment text is not run by C#.",
      })
    ) {
      return true;
    }

    if (/^using\s+[\w.]+\s*;/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line imports a namespace so its classes can be used more easily."
      );
      return true;
    }

    if (/^namespace\s+\w+/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines a namespace, which helps organize related code."
      );
      return true;
    }

    if (/^(public|private|protected|internal)?\s*class\s+\w+/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines a class, which groups related data and behavior together."
      );
      return true;
    }

    if (/^(public|private|protected|internal)?\s*interface\s+\w+/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines an interface, which describes methods or behavior that other classes can implement."
      );
      return true;
    }

    if (/^static\s+void\s+Main\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This is the main entry point of the C# program. Execution usually starts here."
      );
      return true;
    }

    if (
      /^(public|private|protected|internal)?\s*async\s+\w+\s+\w+\s*\(/.test(
        trimmed
      )
    ) {
      add(
        lineNumber,
        line,
        "This line defines an async method, which can wait for asynchronous work before continuing."
      );
      return true;
    }

    if (
      /^(public|private|protected|internal)?\s*(static\s+)?[\w<>\[\]?]+\s+\w+\s*\([^)]*\)\s*\{?$/.test(
        trimmed
      ) &&
      !/^if\s*\(/.test(trimmed) &&
      !/^for\s*\(/.test(trimmed) &&
      !/^foreach\s*\(/.test(trimmed) &&
      !/^while\s*\(/.test(trimmed) &&
      !/^switch\s*\(/.test(trimmed)
    ) {
      add(
        lineNumber,
        line,
        "This line defines a method, which is a named block of code that can be called later."
      );
      return true;
    }

    if (/^Console\.WriteLine\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line prints text to the console and then moves to a new line."
      );
      return true;
    }

    if (/^Console\.Write\s*\(/.test(trimmed)) {
      add(lineNumber, line, "This line prints text to the console.");
      return true;
    }

    if (
      /^(int|double|float|decimal|char|bool|string|var)\s+\w+\s*=\s*.+;/.test(
        trimmed
      )
    ) {
      add(
        lineNumber,
        line,
        "This line creates a variable and gives it a starting value."
      );
      return true;
    }

    if (/^(int|double|float|decimal|char|bool|string|var)\s+\w+\s*;/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line declares a variable and reserves space for it."
      );
      return true;
    }

    if (/^\w+\s*=.+;/.test(trimmed) && !/==/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line changes the value stored in a variable."
      );
      return true;
    }

    if (
      explainConditionals(ctx, {
        ifPattern: /^if\s*\(/,
        elseIfPattern: /^else\s+if\s*\(/,
        elsePattern: /^else\b/,
        ifText:
          "This line checks a condition and runs the next block if the condition is true.",
        elseIfText:
          "This line checks another condition if the earlier one was false.",
        elseText:
          "This line starts the alternative block for when the earlier condition is false.",
      })
    ) {
      return true;
    }

    if (/^foreach\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a loop that goes through items one by one."
      );
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
          "This line starts a loop that keeps running while the condition stays true.",
        doText:
          "This line starts a do-while loop, which runs the block once before checking the condition.",
      })
    ) {
      return true;
    }

    if (/^switch\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a switch statement, which chooses one path based on a value."
      );
      return true;
    }

    if (/^case\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line marks one possible branch inside a switch statement."
      );
      return true;
    }

    if (/^default\s*:/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line marks the fallback branch in a switch statement."
      );
      return true;
    }

    if (
      explainFlowKeywords(ctx, {
        returnPattern: /^return\b/,
        breakPattern: /^break\s*;?$/,
        continuePattern: /^continue\s*;?$/,
        returnText: "This line ends the current method and returns a value if needed.",
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
        "This line starts a try block, which means C# will watch for errors in the block below."
      );
      return true;
    }

    if (/^catch\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts the error-handling block that runs if a matching error happens."
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

    if (/\bawait\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line waits for asynchronous work to finish before continuing."
      );
      return true;
    }

    if (
      explainFunctionCall(ctx, {
        pattern: /^\w+\s*\([^)]*\)\s*;?$/,
        explanation:
          "This line calls a method, which means it asks another block of code to run.",
      })
    ) {
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
          languageName: "C#",
          confidence,
          isMixed: !!options.isMixed,
          isPartialSource: !!options.isPartialSource,
          subject: "C# program logic",
        })
      );
    return true;
  },
};