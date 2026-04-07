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

export const cppProfile = {
  language: "C++",
  signals: [
    { pattern: /#include\s*</, weight: 6 },
    { pattern: /\busing\s+namespace\s+std\s*;/, weight: 5 },
    { pattern: /\bstd::/, weight: 5 },
    { pattern: /\bcout\s*<</, weight: 6 },
    { pattern: /\bcin\s*>>/, weight: 6 },
    { pattern: /\bint\s+main\s*\(/, weight: 6 },
    { pattern: /\bvector\s*</, weight: 4 },
    { pattern: /\bstring\b/, weight: 3 },
    { pattern: /\bbool\b/, weight: 2 },
    { pattern: /\bclass\s+\w+/, weight: 3 },
    { pattern: /\bstruct\s+\w+/, weight: 3 },
  ],
  reason:
    "This looks like C++.\nISeeCode can explain it, but it does not execute full C++ in the browser runner.",

  explainLine(line, lineNumber, add, options = {}) {
    const ctx = createRuleContext(line, lineNumber, add);
    const { trimmed } = ctx;
    const confidence = options.confidence || "high";

    if (!trimmed) return false;

    if (
      explainComment(ctx, {
        style: "slash",
        languageName: "C++",
        commentText:
          "This is a comment. It helps the reader understand the code, but C++ does not run it.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockStart",
        languageName: "C++",
        commentText:
          "This line starts a block comment. Everything inside the comment is ignored by C++.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockMiddle",
        languageName: "C++",
        commentText:
          "This line is part of a block comment, which is only for explanation or notes.",
      })
    ) {
      return true;
    }

    if (
      explainComment(ctx, {
        style: "blockEnd",
        languageName: "C++",
        commentText:
          "This line ends a block comment. The comment text is not run by C++.",
      })
    ) {
      return true;
    }

    if (/^#include\s*</.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line includes a header file so the program can use declarations from a library."
      );
      return true;
    }

    if (/^using\s+namespace\s+\w+\s*;?$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line allows names from a namespace to be used without writing the full prefix each time."
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

    if (/^struct\s+\w+/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines a struct, which groups related data together."
      );
      return true;
    }

    if (/^int\s+main\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines the main function, which is where C++ program execution usually starts."
      );
      return true;
    }

    if (
      /^(int|double|float|char|bool|string|auto|long|short|void)\s+\w+\s*\([^;]*\)\s*\{?$/.test(
        trimmed
      ) &&
      !/^if\s*\(/.test(trimmed) &&
      !/^for\s*\(/.test(trimmed) &&
      !/^while\s*\(/.test(trimmed) &&
      !/^switch\s*\(/.test(trimmed)
    ) {
      add(
        lineNumber,
        line,
        "This line defines a function, which is a reusable block of code."
      );
      return true;
    }

    if (/^cout\s*<</.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line sends output to the console so the user can see it."
      );
      return true;
    }

    if (/^cin\s*>>/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line reads input from the user and stores it in a variable."
      );
      return true;
    }

    if (
      /^(int|double|float|char|bool|string|auto|long|short)\s+\w+(\s*=\s*.+)?;?$/.test(
        trimmed
      ) &&
      !/\(/.test(trimmed)
    ) {
      if (/=/.test(trimmed)) {
        add(
          lineNumber,
          line,
          "This line creates a variable and gives it an initial value."
        );
        return true;
      }

      add(
        lineNumber,
        line,
        "This line declares a variable and reserves space for it."
      );
      return true;
    }

    if (/^\w+\s*=.+;?$/.test(trimmed) && !/==/.test(trimmed)) {
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
          "This line checks a condition and runs the next block only if the condition is true.",
        elseIfText:
          "This line checks another condition if the earlier condition was false.",
        elseText:
          "This line starts the alternative block that runs when the earlier condition is false.",
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
          "This line starts a loop that repeats using a setup, a condition, and an update step.",
        whileText:
          "This line starts a loop that keeps running while its condition stays true.",
        doText:
          "This line starts a do-while loop, which runs the block first and checks the condition afterward.",
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
        returnText: "This line ends the current function and returns a value.",
        breakText: "This line stops the current loop or switch immediately.",
        continueText:
          "This line skips the rest of the current loop iteration and moves to the next one.",
      })
    ) {
      return true;
    }

    if (
      explainFunctionCall(ctx, {
        pattern: /^\w+\s*\([^)]*\)\s*;$/,
        explanation:
          "This line calls a function, which means it asks another block of code to run.",
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
        languageName: "C++",
        confidence,
        defaultText: "This line is part of the C++ program structure or logic.",
        lowConfidenceText:
          "This looks like part of the C++ logic, though the code may be incomplete or mixed with another style.",
      })
    );
    return true;
  },
};