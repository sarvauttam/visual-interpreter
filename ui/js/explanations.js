import { pickExplanation } from "./explanationMessages.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeLine(line) {
  return line.trim();
}

function stripTrailingSemicolon(value) {
  return value.replace(/;\s*$/, "").trim();
}

function normalizeInternalWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function splitTopLevelByOperator(input, operator) {
  const result = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];

    if (ch === '"' && input[i - 1] !== "\\") {
      inString = !inString;
      current += ch;
      continue;
    }

    if (!inString) {
      if (ch === "(") depth += 1;
      if (ch === ")") depth -= 1;

      if (depth === 0 && ch === operator[0] && next === operator[1]) {
        result.push(current.trim());
        current = "";
        i += 1;
        continue;
      }
    }

    current += ch;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

function describeType(typeText) {
  const normalized = normalizeInternalWhitespace(typeText);

  const labels = {
    int: "integer",
    long: "long integer",
    float: "floating-point number",
    double: "decimal number",
    char: "character",
    bool: "true-or-false value",
    string: "text value",
    "const int": "constant integer",
    "const long": "constant long integer",
    "const float": "constant floating-point number",
    "const double": "constant decimal number",
    "const char": "constant character",
    "const bool": "constant true-or-false value",
    "const string": "constant text value",
  };

  return labels[normalized] || normalized;
}

function describeExpression(expr) {
  const value = stripTrailingSemicolon(expr);

  if (/^\d+$/.test(value)) {
    return `the number ${value}`;
  }

  if (/^(true|false)$/.test(value)) {
    return `the boolean value ${value}`;
  }

  if (/^".*"$/.test(value)) {
    return "a text value";
  }

  if (/^'.*'$/.test(value)) {
    return "a character value";
  }

  if (/[+\-*/%]/.test(value)) {
    return "the result of a calculation";
  }

  if (/(==|!=|<=|>=|<|>|&&|\|\|)/.test(value)) {
    return "the result of a comparison or logical check";
  }

  if (/^[A-Za-z_]\w*\(.*\)$/.test(value)) {
    return "the value returned by a function call";
  }

  if (/^[A-Za-z_]\w*$/.test(value)) {
    return `the value currently stored in ${value}`;
  }

  return "the value of this expression";
}

function summarizeCondition(conditionText) {
  const condition = conditionText.trim();

  if (/(==|!=|<=|>=|<|>)/.test(condition)) {
    return "It compares values to decide whether the block should run.";
  }

  if (/(&&|\|\|)/.test(condition)) {
    return "It combines more than one condition into a single decision.";
  }

  if (/^[A-Za-z_]\w*$/.test(condition)) {
    return "It checks whether this value should count as true or false.";
  }

  return "It checks whether this condition is true before continuing.";
}

function summarizeForParts(init, condition, update) {
  const parts = [];

  if (init) {
    parts.push(`It starts with ${init.trim()}.`);
  }

  if (condition) {
    parts.push(`It keeps going while ${condition.trim()} stays true.`);
  }

  if (update) {
    parts.push(`After each round, it updates using ${update.trim()}.`);
  }

  return parts;
}

function summarizeStreamChain(parts, mode) {
  if (!parts.length) {
    return mode === "output"
      ? "This sends something to the output area."
      : "This reads something into the program.";
  }

  if (mode === "output") {
    if (parts.length === 1) {
      return "This prints one value or piece of text to the output.";
    }

    return "This prints several pieces of output from left to right.";
  }

  if (parts.length === 1) {
    return "This reads one value from the user into the program.";
  }

  return "This reads several values from the user in sequence.";
}

function isCommentLine(line) {
  const trimmed = normalizeLine(line);
  return trimmed.startsWith("//");
}

function hasOddQuoteCount(line) {
  let quoteCount = 0;

  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"' && line[i - 1] !== "\\") {
      quoteCount += 1;
    }
  }

  return quoteCount % 2 !== 0;
}

export function classifyLineState(line) {
  const trimmed = normalizeLine(line);

  if (!trimmed) return { kind: "blank" };
  if (isCommentLine(trimmed)) return { kind: "comment" };

  if (hasOddQuoteCount(trimmed)) {
    return {
      kind: "draft-error",
      issueType: "quote-mismatch",
    };
  }

  if (/^#include\s+[A-Za-z_][\w/]*\s*$/.test(trimmed)) {
    return {
      kind: "draft-error",
      issueType: "include-format",
    };
  }

  if (/^using\s+namespace\s+.*::$/.test(trimmed)) {
    return {
      kind: "draft-error",
      issueType: "namespace-format",
    };
  }

  if (/^else\s*$/.test(trimmed)) {
    return {
      kind: "draft-error",
      issueType: "else-block",
    };
  }

  if (/^return\s*;;+\s*$/.test(trimmed)) {
    return {
      kind: "draft-error",
      issueType: "return-format",
    };
  }

  if (/^(cout|std::cout)\s*<[^<]/.test(trimmed)) {
    return {
      kind: "draft-error",
      issueType: "output-operator",
    };
  }

  if (/^(cin|std::cin)\s*>[^>]/.test(trimmed)) {
    return {
      kind: "draft-error",
      issueType: "input-operator",
    };
  }

  if (/^#include\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "include" };
  if (/^#include\s*[<"][^>"]*$/.test(trimmed)) return { kind: "incomplete", hintType: "include" };

  if (/^using\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "namespace" };
  if (/^using\s+namespace\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "namespace" };
  if (/^using\s+namespace\s+\w+\s*$/.test(trimmed) && !trimmed.endsWith(";")) {
    return { kind: "incomplete", hintType: "namespace" };
  }

  if (/^int\s+main\s*\($/.test(trimmed)) return { kind: "incomplete", hintType: "main-header" };
  if (/^int\s+main\s*\(\s*\)\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "main-header" };

  if (/^else\s+if\s*\([^)]*$/.test(trimmed)) {
    return { kind: "incomplete", hintType: "condition" };
    }

  if (/^else\s+if\s*\([^)]*\)\s*$/.test(trimmed) && !trimmed.endsWith("{")) {
    return { kind: "incomplete", hintType: "block-start" };
    }

  if (/^(if|while|for)\s*\([^)]*$/.test(trimmed)) return { kind: "incomplete", hintType: "condition" };
  if (/^(if|while|for)\s*\([^)]*\)\s*$/.test(trimmed) && !trimmed.endsWith("{")) {
    return { kind: "incomplete", hintType: "block-start" };
  }

  if (/^return\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "return" };
  if (/^return\s+.+[^;]$/.test(trimmed)) return { kind: "incomplete", hintType: "return" };

  if (/^(cout|std::cout)\s*<<\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "output" };
  if (/^(cin|std::cin)\s*>>\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "input" };

  if (/^\w[\w\s:*<>]*\s+\w+\s*=\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "assignment" };
  if (/^\w+\s*=\s*$/.test(trimmed)) return { kind: "incomplete", hintType: "assignment" };

   if (/^(const\s+)?(int|double|float|char|bool|string|long)\s+\w+\s*$/.test(trimmed) && !trimmed.endsWith(";")) {
   return { kind: "incomplete", hintType: "declaration" };
   }

  if (/^\w[\w\s:*<>]*\s+\w+\s*\([^)]*$/.test(trimmed)) {
    return { kind: "incomplete", hintType: "function-header" };
  }

  if (/^\w[\w\s:*<>]*\s+\w+\s*\([^)]*\)\s*$/.test(trimmed) && !trimmed.endsWith("{") && !trimmed.endsWith(";")) {
    return { kind: "incomplete", hintType: "function-header" };
  }

  if (/^[{}]$/.test(trimmed)) {
    return { kind: "complete", lineType: "brace" };
  }

  return { kind: "complete", lineType: "generic" };
}

function getDraftIssue(line, issueType = "generic") {
  const issues = {
    "quote-mismatch": {
      title: "This line looks broken",
      body: "A string seems to have started but not finished. Check whether a quotation mark is missing.",
    },
    "include-format": {
      title: "This include line looks malformed",
      body: "A library name usually needs angle brackets or quotes, such as #include <iostream>.",
    },
    "namespace-format": {
      title: "This namespace line does not look complete",
      body: "It looks like the namespace name ends in an unfinished form. Check the namespace text and the semicolon.",
    },
    "else-block": {
      title: "This else line needs more structure",
      body: "An else statement usually needs its block right away, such as else { ... }.",
    },
    "return-format": {
      title: "This return line looks malformed",
      body: "The line seems to contain extra semicolons. A return line usually ends with one semicolon.",
    },
    "output-operator": {
      title: "This output operator looks wrong",
      body: "Output in C++ usually uses <<. Check whether one of the angle brackets is missing.",
    },
    "input-operator": {
      title: "This input operator looks wrong",
      body: "Input in C++ usually uses >>. Check whether one of the angle brackets is missing.",
    },
    generic: {
      title: "This line may contain a mistake",
      body: "Something about this line does not look complete or well-formed yet.",
    },
  };

  const selected = issues[issueType] ?? issues.generic;

  return {
    title: selected.title,
    body: selected.body,
    line: line.trim(),
  };
}

export function getLineHint(line, hintType = "generic") {
  const hints = {
    include: {
      title: "This line is not finished yet",
      body: "It looks like you are starting an include line. Finish the library name and close it properly so I can explain what it brings into your program.",
    },
    namespace: {
      title: "This namespace line still needs finishing",
      body: "You are starting a namespace statement. Add the full namespace and end the line properly before I explain it.",
    },
    "main-header": {
      title: "Your main function is still being written",
      body: "This looks like the start of the program entry point. Finish the function header and open its block so I can explain its role clearly.",
    },
    condition: {
      title: "This condition is still incomplete",
      body: "You are building a condition, but it has not closed yet. Finish the condition first so the explanation matches what you really mean.",
    },
    "block-start": {
      title: "This control statement needs its block",
      body: "The condition looks complete, but the code block has not started yet. Add the opening brace so the instruction becomes clearer.",
    },
    return: {
      title: "Your return statement is not complete yet",
      body: "A return line usually needs a value or a semicolon. Finish the line and then I can explain what the program is giving back.",
    },
    output: {
      title: "This output line is waiting for a value",
      body: "You started an output statement, but you have not said what should be printed yet.",
    },
    input: {
      title: "This input line is waiting for a variable",
      body: "You started an input statement, but you still need to say where the entered value should go.",
    },
    assignment: {
      title: "This assignment is unfinished",
      body: "You began setting a variable, but the value is missing. Finish the right-hand side so the line has a complete meaning.",
    },
    declaration: {
      title: "This declaration still needs completion",
      body: "You started declaring a variable. Add the missing part so I can explain what is being created.",
    },
    "function-header": {
      title: "This function header is still incomplete",
      body: "It looks like you are starting a function. Finish its parameters and opening block before I explain it properly.",
    },
    generic: {
      title: "This line is still in progress",
      body: "Keep going. Once the line is complete, I will explain it in a simple way.",
    },
  };

  const selected = hints[hintType] ?? hints.generic;

  return {
    title: selected.title,
    body: selected.body,
    line: line.trim(),
  };
}

export function buildFriendlyExplanation(line) {
  const trimmed = normalizeLine(line);

  if (/^using\s+namespace\s+std\s*;\s*$/.test(trimmed)) {
    return {
      title: "This makes standard C++ names easier to use",
      summary: "It lets you write cout instead of std::cout.",
      steps: [],
      teachingHtml: pickExplanation("namespace", { lineText: trimmed }),
    };
  }

  if (/^int\s+main\s*\(\s*\)\s*\{\s*$/.test(trimmed)) {
    return {
      title: "This starts the main function",
      summary: "C++ begins running your program from main().",
      steps: [],
      teachingHtml: pickExplanation("mainFunction", { lineText: trimmed }),
    };
  }

  const variableMatch = trimmed.match(/^(int|float|double|string|char|bool)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*=\s*(.+))?\s*;$/);

  if (variableMatch) {
    const [, type, variableName, value] = variableMatch;

    return {
      title: `This creates ${variableName}`,
      summary: `The program creates a ${type} variable named ${variableName}.`,
      steps: [],
      teachingHtml: pickExplanation("variableDeclaration", {
        type,
        variableName,
        value,
        lineText: trimmed,
      }),
    };
  }

  const cinMatch = trimmed.match(/^cin\s*>>\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*;$/);

  if (cinMatch) {
    const [, variableName] = cinMatch;

    return {
      title: `This reads input into ${variableName}`,
      summary: `The user types a value, and the program stores it inside ${variableName}.`,
      steps: [],
      teachingHtml: pickExplanation("cin", {
        variableName,
        lineText: trimmed,
      }),
    };
  }

  const coutStringMatch = trimmed.match(/^cout\s*<<\s*"([^"]*)"(?:\s*<<\s*endl)?\s*;$/);

  if (coutStringMatch) {
    const [, value] = coutStringMatch;

    return {
      title: "This prints text",
      summary: "The program displays a message on the screen.",
      steps: [],
      teachingHtml: pickExplanation("coutString", {
        value,
        lineText: trimmed,
      }),
    };
  }

  const coutVariableMatch = trimmed.match(/^cout\s*<<\s*([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*<<\s*endl)?\s*;$/);

  if (coutVariableMatch) {
    const [, variableName] = coutVariableMatch;

    return {
      title: `This prints ${variableName}`,
      summary: `The program displays the value stored in ${variableName}.`,
      steps: [],
      teachingHtml: pickExplanation("coutVariable", {
        variableName,
        lineText: trimmed,
      }),
    };
  }

  if (/^return\s+0\s*;\s*$/.test(trimmed)) {
    return {
      title: "This ends the program successfully",
      summary: "return 0 tells the computer the program finished correctly.",
      steps: [],
      teachingHtml: pickExplanation("returnStatement", { lineText: trimmed }),
    };
  }

  if (/^\}\s*$/.test(trimmed)) {
    return {
      title: "This closes a block of code",
      summary: "The closing brace ends the current section.",
      steps: [],
      teachingHtml: pickExplanation("closingBrace", { lineText: trimmed }),
    };
  }

  if (/^#include\s*[<"].+[>"]\s*$/.test(trimmed)) {
    const libraryMatch = trimmed.match(/^#include\s*[<"]([^>"]+)[>"]\s*$/);
    const libraryName = libraryMatch?.[1] || "library";

    return {
      title: `This imports ${libraryName}`,
      summary: `The program is loading the ${libraryName} library before it runs.`,
      steps: [
        "Libraries give your program extra ready-made tools.",
        "The exact tools depend on which library name appears inside the angle brackets.",
      ],
      teachingHtml: pickExplanation("include", {
        libraryName,
        libraryRole: `The ${libraryName} library gives this program extra C++ features connected to that library.`,
        lineText: trimmed,
      }),
    };
  }

  if (/^using\s+namespace\s+\w+\s*;\s*$/.test(trimmed)) {
    return {
      title: "This line makes names easier to write",
      summary: "It lets you use library names more simply without repeating the namespace each time.",
      steps: [
        "Instead of writing a longer prefix again and again, this line makes those names easier to access.",
        "Beginners often see this with standard C++ output and input.",
      ],
    };
  }

  if (/^int\s+main\s*\(\s*\)\s*\{\s*$/.test(trimmed)) {
    return {
      title: "This starts the main part of the program",
      summary: "The program begins running from here.",
      steps: [
        "The function named main is the entry point.",
        "The opening brace shows that the block of code inside the program is starting.",
      ],
    };
  }

  if (/^\{\s*$/.test(trimmed)) {
    return {
      title: "This opens a block of code",
      summary: "It marks the beginning of a grouped section of instructions.",
      steps: [
        "Everything inside this block belongs together.",
      ],
    };
  }

  if (/^\}\s*;?\s*$/.test(trimmed)) {
    return {
      title: "This closes a block of code",
      summary: "It marks the end of the current grouped section.",
      steps: [
        "This tells the program that the current block has finished.",
      ],
    };
  }

  const declarationWithValueMatch = trimmed.match(
    /^(const\s+)?(int|double|float|char|bool|string|long)\s+([A-Za-z_]\w*)\s*=\s*(.+);\s*$/
  );

  if (declarationWithValueMatch) {
    const isConst = Boolean(declarationWithValueMatch[1]);
    const type = declarationWithValueMatch[2];
    const name = declarationWithValueMatch[3];
    const expr = declarationWithValueMatch[4];
    const describedType = describeType(`${isConst ? "const " : ""}${type}`);

    return {
      title: `This creates ${name}`,
      summary: `It creates a ${describedType} and gives it an initial value.`,
      steps: [
        `${name} is being introduced for the first time here.`,
        `Its starting value comes from ${describeExpression(expr)}.`,
        isConst
          ? `${name} is marked as constant, so its value is meant to stay fixed.`
          : `${name} can be used again later in the program.`,
      ],
    };
  }

  const declarationOnlyMatch = trimmed.match(
    /^(const\s+)?(int|double|float|char|bool|string|long)\s+([A-Za-z_]\w*)\s*;\s*$/
  );

  if (declarationOnlyMatch) {
    const isConst = Boolean(declarationOnlyMatch[1]);
    const type = declarationOnlyMatch[2];
    const name = declarationOnlyMatch[3];
    const describedType = describeType(`${isConst ? "const " : ""}${type}`);

    return {
      title: `This declares ${name}`,
      summary: `It tells the program that ${name} exists as a ${describedType}.`,
      steps: [
        `The name ${name} is being introduced here.`,
        isConst
          ? "Because it is constant, it will usually need a fixed value and should not change later."
          : "This creates a place where a value of that type can be stored later.",
      ],
    };
  }

  const assignmentMatch = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(.+);\s*$/);

  if (assignmentMatch) {
    const name = assignmentMatch[1];
    const expr = assignmentMatch[2];

    return {
      title: `This updates ${name}`,
      summary: `It changes the value stored in ${name}.`,
      steps: [
        `${name} already exists, and this line gives it a new value.`,
        `The new value comes from ${describeExpression(expr)}.`,
      ],
    };
  }

  if (/^(cout|std::cout)\s*<<.+;\s*$/.test(trimmed)) {
    const rhs = stripTrailingSemicolon(trimmed.replace(/^(cout|std::cout)\s*<<\s*/, ""));
    const parts = splitTopLevelByOperator(rhs, "<<");

    return {
      title: "This prints output",
      summary: summarizeStreamChain(parts, "output"),
      steps: [
        ...parts.slice(0, 3).map((part, index) => `Output part ${index + 1}: ${part}`),
        "The program sends these pieces to the output area in order.",
      ],
    };
  }

  if (/^(cin|std::cin)\s*>>.+;\s*$/.test(trimmed)) {
    const rhs = stripTrailingSemicolon(trimmed.replace(/^(cin|std::cin)\s*>>\s*/, ""));
    const parts = splitTopLevelByOperator(rhs, ">>");

    return {
      title: "This reads input",
      summary: summarizeStreamChain(parts, "input"),
      steps: [
        ...parts.slice(0, 3).map((part, index) => `Input target ${index + 1}: ${part}`),
        "The values entered by the user are stored into these variables in order.",
      ],
    };
  }

  const ifMatch = trimmed.match(/^if\s*\((.+)\)\s*\{\s*$/);
  if (ifMatch) {
    const condition = ifMatch[1];

    return {
      title: "This starts a decision",
      summary: "The program will only run this block when the condition is true.",
      steps: [
        `The condition being checked is: ${condition}.`,
        summarizeCondition(condition),
      ],
    };
  }

  const elseIfMatch = trimmed.match(/^else\s+if\s*\((.+)\)\s*\{\s*$/);
  if (elseIfMatch) {
    const condition = elseIfMatch[1];

    return {
      title: "This checks another condition",
      summary: "This branch is tried only if an earlier condition did not run.",
      steps: [
        `The new condition being checked is: ${condition}.`,
        "This gives the program another possible path to follow.",
      ],
    };
  }

  if (/^else\s*\{\s*$/.test(trimmed)) {
    return {
      title: "This starts the fallback path",
      summary: "This block runs when the earlier condition or conditions were false.",
      steps: [
        "It gives the program something else to do when earlier checks did not pass.",
      ],
    };
  }

  const whileMatch = trimmed.match(/^while\s*\((.+)\)\s*\{\s*$/);
  if (whileMatch) {
    const condition = whileMatch[1];

    return {
      title: "This starts a loop",
      summary: "The program keeps repeating this block while the condition stays true.",
      steps: [
        `The condition being checked is: ${condition}.`,
        summarizeCondition(condition),
      ],
    };
  }

  const forMatch = trimmed.match(/^for\s*\((.*?);(.*?);(.*?)\)\s*\{\s*$/);
  if (forMatch) {
    const init = forMatch[1];
    const condition = forMatch[2];
    const update = forMatch[3];

    return {
      title: "This starts a counting loop",
      summary: "This loop follows a start-check-update pattern.",
      steps: summarizeForParts(init, condition, update),
    };
  }

  const functionHeaderMatch = trimmed.match(
    /^(const\s+)?(int|double|float|char|bool|string|long|void)\s+([A-Za-z_]\w*)\s*\((.*)\)\s*\{\s*$/
  );

  if (functionHeaderMatch && functionHeaderMatch[3] !== "main") {
    const returnType = describeType(
      `${functionHeaderMatch[1] ? "const " : ""}${functionHeaderMatch[2]}`
    );
    const functionName = functionHeaderMatch[3];
    const params = functionHeaderMatch[4].trim();

    return {
      title: `This starts the function ${functionName}`,
      summary: `It defines a function that can be called later and returns a ${returnType}.`,
      steps: [
        params
          ? `Its parameters are: ${params}.`
          : "This function takes no parameters.",
        "The block that follows contains the instructions for this function.",
      ],
    };
  }

  const functionCallMatch = trimmed.match(/^([A-Za-z_]\w*)\s*\((.*)\)\s*;\s*$/);
  if (functionCallMatch) {
    const functionName = functionCallMatch[1];
    const args = functionCallMatch[2].trim();

    return {
      title: `This calls ${functionName}`,
      summary: "It tells the program to run another function here.",
      steps: [
        args
          ? `The values being passed in are: ${args}.`
          : "This call does not pass any values in.",
        "After the function finishes, the program continues from here.",
      ],
    };
  }

  const returnValueMatch = trimmed.match(/^return\s+(.+);\s*$/);
  if (returnValueMatch) {
    const expr = returnValueMatch[1];

    return {
      title: "This sends a value back",
      summary: "It tells the function to finish and return a result.",
      steps: [
        `The returned result comes from ${describeExpression(expr)}.`,
        "After this line, the current function stops running.",
      ],
    };
  }

  if (/^return\s*;\s*$/.test(trimmed)) {
    return {
      title: "This ends the function here",
      summary: "It stops the current function and returns control.",
      steps: [
        "After this line, the function finishes immediately.",
      ],
    };
  }

  return {
    title: "This line performs an instruction",
    summary: "It is a complete line of code, so the program can understand and use it.",
    steps: [
      "This line is finished, which means it has a complete meaning.",
      "As the explanation engine grows, this kind of line can receive an even more specific explanation.",
    ],
  };
}

export function buildLiveExplanationStepsFromSource(source) {
  const lines = source.split(/\r?\n/);
  const completeEntries = [];
  let temporaryEntry = null;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const state = classifyLineState(rawLine);

    if (state.kind === "blank") return;

    if (state.kind === "comment") {
      completeEntries.push({
        kind: "comment",
        lineNumber,
        line: rawLine,
        title: "This is a comment",
        summary: "Comments are notes for humans. They do not run as code.",
        steps: [
          "This line helps explain the code to a reader.",
          "The compiler ignores it.",
        ],
      });
      return;
    }

    if (state.kind === "draft-error") {
      temporaryEntry = {
        kind: "draft-error",
        lineNumber,
        line: rawLine,
        ...getDraftIssue(rawLine, state.issueType),
      };
      return;
    }

    if (state.kind === "incomplete") {
      temporaryEntry = {
        kind: "hint",
        lineNumber,
        line: rawLine,
        ...getLineHint(rawLine, state.hintType),
      };
      return;
    }

    completeEntries.push({
      kind: "line",
      lineNumber,
      line: rawLine,
      ...buildFriendlyExplanation(rawLine),
    });
  });

  return { completeEntries, temporaryEntry };
}

function getTraceField(event, keys) {
  for (const key of keys) {
    if (event?.[key] != null) return event[key];
  }
  return null;
}

function formatTraceValue(value) {
  if (value == null) return null;

  if (typeof value === "object") {
    if (value.name != null) return String(value.name);
    if (value.value != null) return String(value.value);

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function buildRuntimeNarration(item) {
  const event = item.raw || {};
  const type = item.type || "";
  const fallbackText = item.text || "";

  const variableName = formatTraceValue(
    getTraceField(event, ["name", "var", "variable", "identifier"])
  );

  const valueText = formatTraceValue(
    getTraceField(event, ["value", "result", "newValue", "oldValue", "output"])
  );

  const conditionText = formatTraceValue(
    getTraceField(event, ["condition", "expr", "expression"])
  );

  const functionName = formatTraceValue(
    getTraceField(event, ["function", "functionName", "callee", "name"])
  );

  switch (type) {
    case "VarDeclare":
      return variableName
        ? `${variableName} is created during this step.`
        : "A variable is created during this step.";

    case "VarWrite":
      if (variableName && valueText != null) {
        return `${variableName} is updated to ${valueText}.`;
      }
      if (variableName) {
        return `${variableName} is updated during this step.`;
      }
      return "A variable changes value during this step.";

    case "VarRead":
      return variableName
        ? `The program reads the current value of ${variableName}.`
        : "The program reads a value that was already stored.";

    case "ExprValue":
      return valueText != null
        ? `This expression produces the value ${valueText}.`
        : "This expression produces a value here.";

    case "ExprOp":
      return fallbackText
        ? `The program performs an operation here: ${fallbackText}`
        : "The program performs an operation in this step.";

    case "BranchDecision":
      if (valueText != null) {
        return `The condition is checked, and the result is ${valueText}.`;
      }
      if (conditionText) {
        return `The program decides which branch to follow based on ${conditionText}.`;
      }
      return "The program decides which branch to follow here.";

    case "LoopCheck":
      if (valueText != null) {
        return `The loop condition is checked, and it evaluates to ${valueText}.`;
      }
      return "The program checks whether the loop should continue.";

    case "LoopIterationStart":
      return "A new loop iteration begins here.";

    case "LoopExit":
      return "The loop stops here because its condition is no longer satisfied.";

    case "CallStart":
    case "CallEnter":
      return functionName
        ? `The program enters the function ${functionName}.`
        : "The program enters a function call here.";

    case "CallArg":
      return valueText != null
        ? `An argument value of ${valueText} is prepared for the function call.`
        : "An argument is prepared for the function call.";

    case "Return":
      return valueText != null
        ? `The function finishes and returns ${valueText}.`
        : "The function finishes and returns control.";

    case "Print":
      return valueText != null
        ? `The program prints ${valueText} to the output area.`
        : "The program prints something to the output area.";

    case "Input":
      return variableName
        ? `The program reads input and stores it in ${variableName}.`
        : "The program reads input from the user.";

    case "Error":
      return fallbackText
        ? `The run stops because of an error: ${fallbackText}`
        : "The run stops because an error occurs here.";

    default:
      if (fallbackText) {
        return fallbackText;
      }
      if (type) {
        return `Runtime step: ${type}.`;
      }
      return "Something happens during execution at this step.";
  }
}

function buildTraceNotesForLine(lineNumber, traceInsights) {
  return traceInsights
    .filter((item) => item.lineNumber === lineNumber)
    .slice(0, 3)
    .map((item) => buildRuntimeNarration(item));
}

export function mergeSourceAndTraceExplanations(source, traceInsights = []) {
  const { completeEntries, temporaryEntry } = buildLiveExplanationStepsFromSource(source);

  const mergedEntries = completeEntries.map((entry) => {
    if (entry.kind !== "line" && entry.kind !== "comment") {
      return entry;
    }

    const runtimeNotes = buildTraceNotesForLine(entry.lineNumber, traceInsights);

    if (!runtimeNotes.length) {
      return entry;
    }

    return { ...entry, runtimeNotes };
  });

  return { mergedEntries, temporaryEntry };
}

function renderActiveCard(entry) {
  if (entry.kind === "hint") {
    return `
      <article class="explanation-card explanation-card--hint explanation-card--active">
        <div class="card card--interactive explanation-card__label">Current line in progress</div>
        <h3>Line ${entry.lineNumber}: ${escapeHtml(entry.title)}</h3>
        <div class="explanation-code-line">${escapeHtml(entry.line.trim() || "(empty)")}</div>
        <p>${escapeHtml(entry.body)}</p>
      </article>
    `;
  }

  if (entry.kind === "draft-error") {
    return `
      <article class="explanation-card explanation-card--draft-error explanation-card--active">
        <div class="card card--interactive explanation-card__label explanation-card__label--draft-error">Temporary writing issue</div>
        <h3>Line ${entry.lineNumber}: ${escapeHtml(entry.title)}</h3>
        <div class="explanation-code-line">${escapeHtml(entry.line.trim() || "(empty)")}</div>
        <p>${escapeHtml(entry.body)}</p>
        <p class="explanation-meta">
          This card will disappear as soon as the line looks valid again.
        </p>
      </article>
    `;
  }

  if (entry.kind === "run-error") {
    return `
      <article class="explanation-card explanation-card--error explanation-card--active">
        <div class="card card--interactive explanation-card__label explanation-card__label--error">Run issue</div>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.summary)}</p>
        ${entry.reason ? `<p class="explanation-meta"><strong>Why it did not work:</strong> ${escapeHtml(entry.reason)}</p>` : ""}
        ${entry.details ? `<p class="explanation-meta"><strong>Interpreter message:</strong> ${escapeHtml(entry.details)}</p>` : ""}
      </article>
    `;
  }

  const runtimeSection = entry.runtimeNotes?.length
    ? `
      <div class="explanation-meta">
        <strong>What happened when it ran:</strong>
        <ul class="explanation-list">
          ${entry.runtimeNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
      </div>
    `
    : "";

  const label =
    entry.kind === "comment"
      ? "Comment"
      : entry.runtimeNotes?.length
        ? "Active line + runtime"
        : "Active explanation";

  const extraClass = entry.runtimeNotes?.length ? " explanation-card--run" : "";
  const extraLabelClass = entry.runtimeNotes?.length ? " explanation-card__label--run" : "";

  return `
    <article class="explanation-card explanation-card--line explanation-card--active${extraClass}">
      <div class="card card--interactive explanation-card__label${extraLabelClass}">${label}</div>
      <h3>Line ${entry.lineNumber}: ${escapeHtml(entry.title)}</h3>
      <div class="explanation-code-line">${escapeHtml(entry.line.trim())}</div>

      ${entry.teachingHtml
        ? `<div class="explanation-teaching">${entry.teachingHtml}</div>`
        : `
          <p>${escapeHtml(entry.summary)}</p>
          <ul class="explanation-list">
            ${entry.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ul>
        `
      }

      ${runtimeSection}
    </article>
  `;
}

function renderCompactItem(entry) {
  const label =
    entry.kind === "comment"
      ? "Comment"
      : entry.runtimeNotes?.length
        ? "Code + runtime"
        : "Earlier explanation";

  const subtitle = entry.summary;

  return `
    <details class="compact-explanation-card">
      <summary class="compact-explanation-card__summary">
        <div class="compact-explanation-card__top">
          <span class="compact-explanation-card__label">${escapeHtml(label)}</span>
          <span class="compact-explanation-card__line">Line ${entry.lineNumber}</span>
        </div>
        <div class="compact-explanation-card__code">${escapeHtml(entry.line.trim() || "(empty)")}</div>
      </summary>

      <div class="compact-explanation-card__body">
        <p class="compact-explanation-card__text">${escapeHtml(subtitle)}</p>

        ${
          entry.steps?.length
            ? `
              <ul class="explanation-list">
                ${entry.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
              </ul>
            `
            : ""
        }

        ${
          entry.runtimeNotes?.length
            ? `
              <div class="explanation-meta">
                <strong>What happened when it ran:</strong>
                <ul class="explanation-list">
                  ${entry.runtimeNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
                </ul>
              </div>
            `
            : ""
        }
      </div>
    </details>
  `;
}

function renderExplanationLayout(activeEntry, previousEntries) {
  const previousSection = previousEntries.length
    ? `
      <section class="explanation-history-section">
        <div class="explanation-history-section__header">
          <h3>Earlier explanations</h3>
          <p>Open any earlier item when you want more detail.</p>
        </div>
        <div class="compact-explanation-list">
          ${previousEntries.map(renderCompactItem).join("")}
        </div>
      </section>
    `
    : "";

  return `
    <div class="explanation-focus-layout">
      <section class="explanation-active-section">
        ${renderActiveCard(activeEntry)}
      </section>
      ${previousSection}
    </div>
  `;
}

export function renderLiveExplanationPreview(container, source) {
  if (!container) return;

  const { completeEntries, temporaryEntry } = buildLiveExplanationStepsFromSource(source);

  if (!completeEntries.length && !temporaryEntry) {
    renderEmptyExplanationState(container);
    return;
  }

  const activeEntry = temporaryEntry || completeEntries[completeEntries.length - 1];
  const previousEntries = temporaryEntry
    ? completeEntries.slice().reverse()
    : completeEntries.slice(0, -1).reverse();

  container.innerHTML = renderExplanationLayout(activeEntry, previousEntries);
}

export function renderRunExplanationPreview(container, source, runResult) {
  if (!container) return;

  if (!runResult?.ok) {
    const friendly = runResult?.friendlyError || null;

    const errorEntry = {
      kind: "run-error",
      title: friendly?.title || "The program could not complete successfully",
      summary:
        friendly?.summary ||
        "ISeeCode could not build a full run-based explanation from this attempt.",
      reason: friendly?.reason || "",
      details: runResult?.errorText || "Please check the code and try again.",
    };

    container.innerHTML = renderExplanationLayout(errorEntry, []);
    return;
  }

  const { mergedEntries, temporaryEntry } = mergeSourceAndTraceExplanations(
    source,
    runResult.traceInsights || []
  );

  if (!mergedEntries.length && !temporaryEntry) {
    renderEmptyExplanationState(container);
    return;
  }

  const activeEntry = temporaryEntry || mergedEntries[mergedEntries.length - 1];
  const previousEntries = temporaryEntry
    ? mergedEntries.slice().reverse()
    : mergedEntries.slice(0, -1).reverse();

  container.innerHTML = renderExplanationLayout(activeEntry, previousEntries);
}

export function renderCurrentExplanationStep(container, entry) {
  if (!container || !entry) return;
  container.innerHTML = renderExplanationLayout(entry, []);
}

export function renderEmptyExplanationState(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state-card explanation-card explanation-card--empty">
      <h3>Welcome to ISeeCode</h3>
      <p>
        Start typing code on the left. As your lines become complete,
        ISeeCode will explain what they mean in simple language.
      </p>
      <p class="muted">
        Don't worry if you make mistakes - ISeeCode will help you learn from them.
      </p>
    </div>
  `;
}