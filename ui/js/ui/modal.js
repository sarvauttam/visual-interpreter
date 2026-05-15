export function createModalController(dom) {
  function openModal(config = {}) {

    if (!dom.modalBackdrop || !dom.modalTitle || !dom.modalBody) {
      console.warn("Modal DOM is missing", {
        modalBackdrop: dom.modalBackdrop,
        modalTitle: dom.modalTitle,
        modalBody: dom.modalBody,
      });
      return;
    }

    dom.modalTitle.textContent = config.title || "";

    if (dom.modalSubtitle) {
      dom.modalSubtitle.textContent = config.subtitle || "";
      dom.modalSubtitle.hidden = !config.subtitle;
    }

    dom.modalBody.innerHTML = config.bodyHtml || "";

    dom.modalBackdrop.hidden = false;
    dom.modalBackdrop.removeAttribute("hidden");

    dom.modalBackdrop.classList.remove("hidden");
    dom.modalBackdrop.classList.add("open");
  }

  function closeModal() {
    if (!dom.modalBackdrop) return;

    dom.modalBackdrop.classList.remove("open");
    dom.modalBackdrop.classList.add("hidden");

    dom.modalBackdrop.hidden = true;
  }

  function bindModalEvents() {
    dom.modalCloseBtn?.addEventListener("click", closeModal);

    dom.modalBackdrop?.addEventListener("click", (event) => {
      if (event.target === dom.modalBackdrop) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    });
  }

  return {
    openModal,
    closeModal,
    bindModalEvents,
  };
}