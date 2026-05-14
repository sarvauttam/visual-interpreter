const DRAFT_KEY = "iseecode-current-draft";

export function createDraftStorageController(editor) {
  let timer = null;

  function getCode() {
    if (editor && typeof editor.getCode === "function") {
      return editor.getCode();
    }

    return "";
  }

  function setCode(value) {
    if (editor && typeof editor.setCode === "function") {
      editor.setCode(value);
    }
  }

  function saveNow() {
    const code = getCode();
    localStorage.setItem(DRAFT_KEY, code);
  }

  function scheduleSave() {
    clearTimeout(timer);

    timer = setTimeout(() => {
      saveNow();
    }, 400);
  }

  function restore() {
    const savedCode = localStorage.getItem(DRAFT_KEY);

    if (!savedCode) {
      return;
    }

    const currentCode = getCode();

    if (!currentCode.trim()) {
      setCode(savedCode);
    }
  }

  function clear() {
    localStorage.removeItem(DRAFT_KEY);
  }

  return {
    saveNow,
    scheduleSave,
    restore,
    clear,
  };
}