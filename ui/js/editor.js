const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const FONT_STEP = 1;
const INDENT = "    ";

function clampFontSize(value) {
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, value));
}

function getLineStart(text, cursorIndex) {
  return text.lastIndexOf("\n", cursorIndex - 1) + 1;
}

function getCurrentLineText(textarea) {
  const value = textarea.value;
  const cursor = textarea.selectionStart;
  const lineStart = getLineStart(value, cursor);
  const lineEnd = value.indexOf("\n", cursor);

  return value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
}

function getLeadingWhitespace(text) {
  const match = text.match(/^\s*/);
  return match ? match[0] : "";
}

function insertTextAtSelection(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  textarea.value = value.slice(0, start) + text + value.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

function replaceSelection(textarea, replacement, selectionStartOffset = replacement.length) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  textarea.value = value.slice(0, start) + replacement + value.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + selectionStartOffset;
}

function handleTabKey(textarea, event) {
  event.preventDefault();
  insertTextAtSelection(textarea, INDENT);
}

function handleEnterKey(textarea, event) {
  const value = textarea.value;
  const cursor = textarea.selectionStart;
  const lineText = getCurrentLineText(textarea);
  const currentIndent = getLeadingWhitespace(lineText);

  const charBefore = value[cursor - 1] || "";
  const charAfter = value[cursor] || "";

  event.preventDefault();

  if (charBefore === "{" && charAfter === "}") {
    const insertion = `\n${currentIndent}${INDENT}\n${currentIndent}`;
    replaceSelection(textarea, insertion, (`\n${currentIndent}${INDENT}`).length);
    return;
  }

  if (charBefore === "{") {
    insertTextAtSelection(textarea, `\n${currentIndent}${INDENT}`);
    return;
  }

  insertTextAtSelection(textarea, `\n${currentIndent}`);
}

function handleClosingBrace(textarea, event) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (start !== end) return;

  const value = textarea.value;
  const lineStart = getLineStart(value, start);
  const beforeCursor = value.slice(lineStart, start);

  if (!/^\s*$/.test(beforeCursor)) {
    return;
  }

  const currentIndent = beforeCursor;
  if (currentIndent.length < INDENT.length) {
    return;
  }

  event.preventDefault();

  const reducedIndent = currentIndent.slice(0, -INDENT.length);
  textarea.value =
    value.slice(0, lineStart) +
    reducedIndent +
    "}" +
    value.slice(start);

  const newCursor = lineStart + reducedIndent.length + 1;
  textarea.selectionStart = textarea.selectionEnd = newCursor;
}

export function createEditorController(dom) {
  const state = {
    fontSize: DEFAULT_FONT_SIZE,
    isBold: false,
    isItalic: false,
    isUnderline: false,
  };

  function applyEditorStyles() {
    if (!dom.codeInput) return;

    dom.codeInput.style.fontSize = `${state.fontSize}px`;
    dom.codeInput.classList.toggle("is-bold", state.isBold);
    dom.codeInput.classList.toggle("is-italic", state.isItalic);
    dom.codeInput.classList.toggle("is-underline", state.isUnderline);

    if (dom.fontSizeInput) {
      dom.fontSizeInput.value = String(state.fontSize);
    }

    if (dom.boldBtn) {
      dom.boldBtn.classList.toggle("is-active", state.isBold);
      dom.boldBtn.setAttribute("aria-pressed", String(state.isBold));
    }

    if (dom.italicBtn) {
      dom.italicBtn.classList.toggle("is-active", state.isItalic);
      dom.italicBtn.setAttribute("aria-pressed", String(state.isItalic));
    }

    if (dom.underlineBtn) {
      dom.underlineBtn.classList.toggle("is-active", state.isUnderline);
      dom.underlineBtn.setAttribute("aria-pressed", String(state.isUnderline));
    }
  }

  function setFontSize(nextSize) {
    state.fontSize = clampFontSize(nextSize);
    applyEditorStyles();
  }

  function increaseFontSize() {
    setFontSize(state.fontSize + FONT_STEP);
  }

  function decreaseFontSize() {
    setFontSize(state.fontSize - FONT_STEP);
  }

  function handleFontInputChange() {
    if (!dom.fontSizeInput) return;

    const parsed = Number(dom.fontSizeInput.value);

    if (Number.isNaN(parsed)) {
      applyEditorStyles();
      return;
    }

    setFontSize(parsed);
  }

  function toggleBold() {
    state.isBold = !state.isBold;
    applyEditorStyles();
  }

  function toggleItalic() {
    state.isItalic = !state.isItalic;
    applyEditorStyles();
  }

  function toggleUnderline() {
    state.isUnderline = !state.isUnderline;
    applyEditorStyles();
  }

  function clearEditor() {
    if (!dom.codeInput) return;
    dom.codeInput.value = "";
    dom.codeInput.focus();
  }

  function setCode(code) {
    if (!dom.codeInput) return;
    dom.codeInput.value = code;
    dom.codeInput.focus();
  }

  function getCode() {
    return dom.codeInput ? dom.codeInput.value : "";
  }

  function handleEditorKeydown(event) {
    const textarea = dom.codeInput;
    if (!textarea) return;

    if (event.key === "Tab") {
      handleTabKey(textarea, event);
      return;
    }

    if (event.key === "Enter") {
      handleEnterKey(textarea, event);
      return;
    }

    if (event.key === "}") {
      handleClosingBrace(textarea, event);
    }
  }

  function bindEvents() {
    dom.fontIncreaseBtn?.addEventListener("click", increaseFontSize);
    dom.fontDecreaseBtn?.addEventListener("click", decreaseFontSize);
    dom.fontSizeInput?.addEventListener("change", handleFontInputChange);
    dom.fontSizeInput?.addEventListener("blur", handleFontInputChange);

    dom.boldBtn?.addEventListener("click", toggleBold);
    dom.italicBtn?.addEventListener("click", toggleItalic);
    dom.underlineBtn?.addEventListener("click", toggleUnderline);

    dom.codeInput?.addEventListener("keydown", handleEditorKeydown);
  }

  function init() {
    applyEditorStyles();
    bindEvents();
  }

  return {
    init,
    clearEditor,
    setCode,
    getCode,
  };
}