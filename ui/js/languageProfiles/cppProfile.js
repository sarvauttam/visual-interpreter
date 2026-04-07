export const cppProfile = {
  language: "C++",
  signals: [
    { pattern: /#include\s*</, weight: 6 },
    { pattern: /\busing\s+namespace\b/, weight: 6 },
    { pattern: /\bstd::/, weight: 5 },
    { pattern: /\bint\s+main\s*\(/, weight: 6 },
    { pattern: /\bcout\s*<</, weight: 6 },
    { pattern: /\bcin\s*>>/, weight: 6 },
    { pattern: /\bvector\s*</, weight: 4 },
    { pattern: /\bstring\b/, weight: 1 },
    { pattern: /\bvoid\s+\w+\s*\(/, weight: 2 },
    { pattern: /\bdouble\b/, weight: 1 },
    { pattern: /\bbool\b/, weight: 1 },
  ],
  reason:
    "This looks like full C++ syntax. ISeeCode can explain it, but the current browser runner only executes the project’s simplified teaching language.",

  explainLine(line, lineNumber, add) {
    const trimmed = line.trim();
    if (!trimmed) return false;

    if (/^\/\//.test(trimmed)) {
      add(lineNumber, line, "This is a comment. It explains something for the reader, but it does not run as code.");
      return true;
    }

    if (/^#include\s*</.test(trimmed)) {
      add(lineNumber, line, "This line includes a library so the program can use extra built-in tools.");
      return true;
    }

    if (/^using\s+namespace\b/.test(trimmed)) {
      add(lineNumber, line, "This line lets the program use names more simply without writing the full namespace each time.");
      return true;
    }

    if (/^(int|void|double|float|char|bool|string)\s+\w+\s*\([^)]*\)\s*\{?$/.test(trimmed)) {
      if (/^int\s+main\s*\(/.test(trimmed)) {
        add(lineNumber, line, "This is the main function. In C++, the program usually starts running here.");
        return true;
      }

      add(lineNumber, line, "This line defines a function. A function is a reusable block of code that can be called later.");
      return true;
    }

    if (/^(int|double|float|char|bool|string)\s+\w+\s*=\s*.*;/.test(trimmed)) {
      add(lineNumber, line, "This line declares a variable, gives it a type, and stores an initial value in it.");
      return true;
    }

    if (/^(int|double|float|char|bool|string)\s+\w+\s*;/.test(trimmed)) {
      add(lineNumber, line, "This line declares a variable and reserves space for it.");
      return true;
    }

    if (/^\w+\s*=.*;/.test(trimmed) && !/==/.test(trimmed)) {
      add(lineNumber, line, "This line changes the value stored in a variable.");
      return true;
    }

    if (/^(std::)?cout\s*<</.test(trimmed)) {
      add(lineNumber, line, "This line prints something to the screen.");
      return true;
    }

    if (/^(std::)?cin\s*>>/.test(trimmed)) {
      add(lineNumber, line, "This line reads a value from the user and stores it in a variable.");
      return true;
    }

    if (/^if\s*\(/.test(trimmed)) {
      add(lineNumber, line, "This line checks a condition and runs the next block only if the condition is true.");
      return true;
    }

    if (/^else\s+if\s*\(/.test(trimmed)) {
      add(lineNumber, line, "This line checks another condition if the earlier condition was false.");
      return true;
    }

    if (/^else\b/.test(trimmed)) {
      add(lineNumber, line, "This line starts the alternative block that runs when the earlier condition is false.");
      return true;
    }

    if (/^for\s*\(/.test(trimmed)) {
      add(lineNumber, line, "This line starts a loop that repeats using a setup, a condition, and an update step.");
      return true;
    }

    if (/^while\s*\(/.test(trimmed)) {
      add(lineNumber, line, "This line starts a loop that keeps running while its condition stays true.");
      return true;
    }

    if (/^do\b/.test(trimmed)) {
      add(lineNumber, line, "This line starts a do-while loop, which runs the block first and checks the condition afterward.");
      return true;
    }

    if (/^break\s*;/.test(trimmed)) {
      add(lineNumber, line, "This line stops the current loop or switch immediately.");
      return true;
    }

    if (/^continue\s*;/.test(trimmed)) {
      add(lineNumber, line, "This line skips the rest of the current loop iteration and moves to the next one.");
      return true;
    }

    if (/^return\b/.test(trimmed)) {
      add(lineNumber, line, "This line ends the current function and returns a value.");
      return true;
    }

    if (/^\w+\s*\([^)]*\)\s*;/.test(trimmed)) {
      add(lineNumber, line, "This line calls a function, which means it asks another block of code to run.");
      return true;
    }

    if (trimmed === "{") {
      add(lineNumber, line, "This brace opens a new block of code.");
      return true;
    }

    if (trimmed === "}") {
      add(lineNumber, line, "This brace closes the block of code above it.");
      return true;
    }

    add(lineNumber, line, "This line is part of the C++ program structure or logic.");
    return true;
  },
};