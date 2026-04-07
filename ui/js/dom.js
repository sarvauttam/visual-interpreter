export function getDom() {
  return {
    howToUseBtn: document.getElementById("howToUseBtn"),
    uploadBtn: document.getElementById("uploadBtn"),
    historyBtn: document.getElementById("historyBtn"),
    accountBtn: document.getElementById("accountBtn"),

    runBtn: document.getElementById("runBtn"),
    clearBtn: document.getElementById("clearBtn"),

    fontDecreaseBtn: document.getElementById("fontDecreaseBtn"),
    fontIncreaseBtn: document.getElementById("fontIncreaseBtn"),
    fontSizeInput: document.getElementById("fontSizeInput"),
    boldBtn: document.getElementById("boldBtn"),
    italicBtn: document.getElementById("italicBtn"),
    underlineBtn: document.getElementById("underlineBtn"),

    codeInput: document.getElementById("codeInput"),
    explanationContent: document.getElementById("explanationContent"),
    outputContent: document.getElementById("outputContent"),
    fileInput: document.getElementById("fileInput"),

    modalBackdrop: document.getElementById("modalBackdrop"),
    modalTitle: document.getElementById("modalTitle"),
    modalSubtitle: document.getElementById("modalSubtitle"),
    modalBody: document.getElementById("modalBody"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),

    sourceModeBadge: document.getElementById("sourceModeBadge"),
    outputModeBadge: document.getElementById("outputModeBadge"),
    explanationModeBadge: document.getElementById("explanationModeBadge"),
  };
}