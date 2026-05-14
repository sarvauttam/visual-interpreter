export function createLineNumbersController(dom, editor) {
  let gutter = null;
  let wrapper = null;
  let lastLineCount = 0;

  function getCode() {
    if (editor && typeof editor.getCode === "function") {
      return editor.getCode();
    }

    return dom.codeInput?.value || "";
  }

  function getLineCount() {
    return Math.max(1, String(getCode()).split("\n").length);
  }

  function getCurrentLineNumber() {
    if (!dom.codeInput) return 1;

    const cursorPosition = dom.codeInput.selectionStart || 0;
    const textBeforeCursor = dom.codeInput.value.slice(0, cursorPosition);

    return textBeforeCursor.split("\n").length;
  }

  function highlightCurrentLine() {
    if (!gutter) return;

    const currentLine = getCurrentLineNumber();

    gutter.querySelectorAll(".line-number").forEach((lineEl) => {
      const lineNumber = Number(lineEl.dataset.lineNumber);

      lineEl.classList.toggle("line-number--active", lineNumber === currentLine);
    });
  }

  function render() {
    if (!gutter) return;

    const lineCount = getLineCount();

    if (lineCount !== lastLineCount) {
      lastLineCount = lineCount;

      gutter.innerHTML = Array.from({ length: lineCount }, (_, index) => {
        const lineNumber = index + 1;

        return `
          <div class="line-number" data-line-number="${lineNumber}">
            ${lineNumber}
          </div>
        `;
      }).join("");
    }

    highlightCurrentLine();
  }

  function syncScroll() {
    if (!gutter || !dom.codeInput) return;

    gutter.scrollTop = dom.codeInput.scrollTop;
  }

  function renderSoon() {
    requestAnimationFrame(() => {
      render();
      syncScroll();
    });
  }

  function init() {
    if (!dom.codeInput) return;

    const textarea = dom.codeInput;

    if (textarea.closest(".code-input-line-wrap")) {
      wrapper = textarea.closest(".code-input-line-wrap");
      gutter = wrapper.querySelector(".line-number-gutter");
      render();
      return;
    }

    wrapper = document.createElement("div");
    wrapper.className = "code-input-line-wrap";

    gutter = document.createElement("div");
    gutter.className = "line-number-gutter";
    gutter.setAttribute("aria-hidden", "true");

    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(gutter);
    wrapper.appendChild(textarea);

    textarea.classList.add("code-input--with-lines");

    render();

    textarea.addEventListener("input", renderSoon);
    textarea.addEventListener("keyup", renderSoon);
    textarea.addEventListener("click", renderSoon);
    textarea.addEventListener("mouseup", renderSoon);
    textarea.addEventListener("paste", renderSoon);
    textarea.addEventListener("cut", renderSoon);
    textarea.addEventListener("scroll", syncScroll);
    textarea.addEventListener("select", renderSoon);
  }

  return {
    init,
    render,
    syncScroll,
  };
}