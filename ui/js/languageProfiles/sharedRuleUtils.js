export function createRuleContext(line, lineNumber, add) {
  const trimmed = line.trim();

  return {
    line,
    lineNumber,
    add,
    trimmed,
    addExplanation(explanation) {
      add(lineNumber, line, explanation);
      return true;
    },
  };
}

export function isBlankLine(trimmed) {
  return !trimmed;
}

export function explainComment(ctx, options = {}) {
  const {
    style = "slash",
    languageName = "this language",
    commentText = `This is a comment. It helps the reader understand the code, but ${languageName} does not run it.`,
  } = options;

  const patterns = {
    python: /^#/,
    slash: /^\/\//,
    blockStart: /^\/\*/,
    blockEnd: /^\*\//,
    blockMiddle: /^\*/,
  };

  const pattern = patterns[style];
  if (!pattern) return false;

  if (pattern.test(ctx.trimmed)) {
    return ctx.addExplanation(commentText);
  }

  return false;
}

export function explainImport(ctx, options = {}) {
  const {
    pattern = /^import\b/,
    explanation = "This line imports code from somewhere else so it can be used here.",
  } = options;

  if (pattern.test(ctx.trimmed)) {
    return ctx.addExplanation(explanation);
  }

  return false;
}

export function explainConditionals(ctx, options = {}) {
  const {
    ifPattern,
    elseIfPattern,
    elsePattern,
    ifText = "This line checks a condition and runs the related block only when that condition is true.",
    elseIfText = "This line checks another condition if the earlier one was false.",
    elseText = "This line starts the fallback block that runs when earlier conditions were false.",
  } = options;

  if (ifPattern && ifPattern.test(ctx.trimmed)) {
    return ctx.addExplanation(ifText);
  }

  if (elseIfPattern && elseIfPattern.test(ctx.trimmed)) {
    return ctx.addExplanation(elseIfText);
  }

  if (elsePattern && elsePattern.test(ctx.trimmed)) {
    return ctx.addExplanation(elseText);
  }

  return false;
}

export function explainLoops(ctx, options = {}) {
  const {
    forPattern,
    whilePattern,
    doPattern,
    forText = "This line starts a loop that repeats through values or steps one by one.",
    whileText = "This line starts a loop that keeps running while the condition stays true.",
    doText = "This line starts a loop that runs the block once before checking its condition.",
  } = options;

  if (forPattern && forPattern.test(ctx.trimmed)) {
    return ctx.addExplanation(forText);
  }

  if (whilePattern && whilePattern.test(ctx.trimmed)) {
    return ctx.addExplanation(whileText);
  }

  if (doPattern && doPattern.test(ctx.trimmed)) {
    return ctx.addExplanation(doText);
  }

  return false;
}

export function explainFlowKeywords(ctx, options = {}) {
  const {
    returnPattern = /^return\b/,
    breakPattern = /^break\b/,
    continuePattern = /^continue\b/,
    passPattern,
    returnText = "This line ends the current function and sends a value back.",
    breakText = "This line stops the current loop immediately.",
    continueText = "This line skips the rest of the current loop iteration and moves to the next one.",
    passText = "This line intentionally does nothing.",
  } = options;

  if (returnPattern && returnPattern.test(ctx.trimmed)) {
    return ctx.addExplanation(returnText);
  }

  if (breakPattern && breakPattern.test(ctx.trimmed)) {
    return ctx.addExplanation(breakText);
  }

  if (continuePattern && continuePattern.test(ctx.trimmed)) {
    return ctx.addExplanation(continueText);
  }

  if (passPattern && passPattern.test(ctx.trimmed)) {
    return ctx.addExplanation(passText);
  }

  return false;
}

export function explainBraces(ctx, options = {}) {
  const {
    openPattern = /^\{$/,
    closePattern = /^\}$/,
    openText = "This brace opens a new block of code.",
    closeText = "This brace closes the block of code above it.",
  } = options;

  if (openPattern && openPattern.test(ctx.trimmed)) {
    return ctx.addExplanation(openText);
  }

  if (closePattern && closePattern.test(ctx.trimmed)) {
    return ctx.addExplanation(closeText);
  }

  return false;
}

export function explainFunctionCall(ctx, options = {}) {
  const {
    pattern = /^\w+\s*\(.*\)\s*;?$/,
    explanation = "This line calls a function, which means it asks another block of code to run.",
  } = options;

  if (pattern.test(ctx.trimmed)) {
    return ctx.addExplanation(explanation);
  }

  return false;
}

export function buildFallback(options = {}) {
  const {
    languageName = "this",
    confidence = "high",
    defaultText = `This line is part of the ${languageName} program logic.`,
    lowConfidenceText = `This line appears to be part of the program logic, but the code may be incomplete or mixed.`,
  } = options;

  return confidence === "low" ? lowConfidenceText : defaultText;
}