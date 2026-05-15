export function bindUpload(dom, editor) {
  dom.uploadBtn?.addEventListener("click", () => {
    dom.fileInput?.click();
  });

  dom.fileInput?.addEventListener("change", () => {
    const file = dom.fileInput.files?.[0];

    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (dom.languageSelect) {
      if (fileName.endsWith(".py")) {
        dom.languageSelect.value = "python";
        dom.languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (
        fileName.endsWith(".cpp") ||
        fileName.endsWith(".cc") ||
        fileName.endsWith(".cxx") ||
        fileName.endsWith(".hpp") ||
        fileName.endsWith(".h") ||
        fileName.endsWith(".c")
      ) {
        dom.languageSelect.value = "cpp";
        dom.languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const text = String(reader.result || "");

      if (editor && typeof editor.setCode === "function") {
        editor.setCode(text);
      } else if (dom.codeInput) {
        dom.codeInput.value = text;
        dom.codeInput.dispatchEvent(new Event("input", { bubbles: true }));
      }

      dom.fileInput.value = "";
    });

    reader.addEventListener("error", () => {
      dom.fileInput.value = "";
      window.alert("Could not read this file. Please try another file.");
    });

    reader.readAsText(file);
  });
}