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
    "This looks like C#. ISeeCode can explain it, but it does not execute C# in the current browser runner.",

  explainLine(line, lineNumber, add) {
    const trimmed = line.trim();
    if (!trimmed) return false;

    if (/^\/\//.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This is a comment. It helps the reader understand the code, but C# does not run it."
      );
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

    if (/^(public|private|protected|internal)?\s*async\s+\w+\s+\w+\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line defines an async method, which can wait for asynchronous work before continuing."
      );
      return true;
    }

    if (/^(public|private|protected|internal)?\s*(static\s+)?[\w<>\[\]?]+\s+\w+\s*\([^)]*\)\s*\{?$/.test(trimmed)) {
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
      add(
        lineNumber,
        line,
        "This line prints text to the console."
      );
      return true;
    }

    if (/^(int|double|float|decimal|char|bool|string|var)\s+\w+\s*=\s*.+;/.test(trimmed)) {
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

    if (/^if\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line checks a condition and runs the next block if the condition is true."
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

    if (/^foreach\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a loop that goes through items one by one."
      );
      return true;
    }

    if (/^while\s*\(/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line starts a loop that keeps running while the condition stays true."
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

    if (/^return\b/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line ends the current method and returns a value if needed."
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

    if (/^\w+\s*\([^)]*\)\s*;?$/.test(trimmed)) {
      add(
        lineNumber,
        line,
        "This line calls a method, which means it asks another block of code to run."
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
      "This line is part of the C# program logic."
    );
    return true;
  },
};