export function createEditorIndentationController(dom) {
  function replaceSelection(textarea, text, cursorOffset = text.length) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.value =
      textarea.value.slice(0, start) +
      text +
      textarea.value.slice(end);

    textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function handleOpeningBrace(event) {
    const textarea = event.target;

    event.preventDefault();

    const insert = `{\n\n}`;

    // Place cursor on empty middle line
    const cursorOffset = 2;

    replaceSelection(textarea, insert, cursorOffset);
  }

  function handleTab(event) {
    const textarea = event.target;

    event.preventDefault();

    replaceSelection(textarea, "  ");
  }

  function handleKeydown(event) {
    if (event.key === "{") {
      handleOpeningBrace(event);
      return;
    }

    if (event.key === "Tab") {
      handleTab(event);
    }
  }

  function init() {
    if (!dom.codeInput) return;

    dom.codeInput.addEventListener("keydown", handleKeydown);
  }

  return {
    init,
  };
}