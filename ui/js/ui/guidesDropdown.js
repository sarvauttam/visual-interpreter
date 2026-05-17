import { LANGUAGE_GUIDES } from "./languageGuides.js";

export function createGuidesDropdownController({ modal, guidedMode }) {
  const guidesBtn = document.getElementById("guidesBtn");
  const guidesDropdown = document.getElementById("guidesDropdown");

  function closeDropdown() {
    guidesDropdown?.classList.add("hidden");
    guidesBtn?.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown() {
    if (!guidesDropdown || !guidesBtn) return;

    const isHidden = guidesDropdown.classList.contains("hidden");

    guidesDropdown.classList.toggle("hidden", !isHidden);
    guidesBtn.setAttribute("aria-expanded", String(isHidden));
  }

  function openGuide(languageId) {
    closeDropdown();

    if (languageId === "cpp") {
      guidedMode?.start();
      return;
    }

    const guide = LANGUAGE_GUIDES[languageId];

    if (!guide) return;

    modal.openModal({
      title: guide.title,
      subtitle: guide.subtitle,
      bodyHtml: guide.bodyHtml,
    });
  }

  function init() {
    guidesBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleDropdown();
    });

    guidesDropdown
      ?.querySelectorAll("[data-guide-language]")
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          openGuide(button.dataset.guideLanguage);
        });
      });

    document.addEventListener("click", (event) => {
      if (
        guidesDropdown &&
        guidesBtn &&
        !guidesDropdown.contains(event.target) &&
        event.target !== guidesBtn
      ) {
        closeDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    });
  }

  return {
    init,
    closeDropdown,
  };
}