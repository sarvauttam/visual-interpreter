const TUTORIAL_SEEN_KEY = "iseecode-tutorial-seen";

export function createTutorialController(dom) {
  let currentStep = 0;
  let bubble = null;
  let overlay = null;

  const steps = [
    {
      target: null,
      title: "Welcome to ISeeCode!",
      text: "Get ready for a short tour. I’ll show you where to write code, see results, and understand each line.",
    },
    {
      target: () => dom.codeInput,
      title: "Code Editor",
      text: "This is where you type your code.",
    },
    {
      target: () => dom.explanationContent,
      title: "Explanations Panel",
      text: "This panel explains your code and shows helpful messages.",
    },
    {
      target: () => dom.outputContent,
      title: "Results Panel",
      text: "After you click Run, your program output appears here.",
    },
  ];

  function cleanup() {
    bubble?.remove();
    overlay?.remove();
    bubble = null;
    overlay = null;

    document.querySelectorAll(".tutorial-target").forEach((el) => {
      el.classList.remove("tutorial-target");
    });
  }

  function finish() {
    cleanup();
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  }

  function renderStep() {
    cleanup();

    const step = steps[currentStep];
    const target = typeof step.target === "function" ? step.target() : null;

    overlay = document.createElement("div");
    overlay.className = "tutorial-overlay";
    document.body.appendChild(overlay);

    bubble = document.createElement("div");
    bubble.className = "tutorial-bubble";

    bubble.innerHTML = `
      <div class="tutorial-bubble-arrow"></div>
      <h3>${step.title}</h3>
      <p>${step.text}</p>
      <div class="tutorial-actions">
        <button type="button" class="tutorial-skip">Skip</button>
        <button type="button" class="tutorial-next">
          ${currentStep === steps.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    `;

    document.body.appendChild(bubble);

    if (target) {
      target.classList.add("tutorial-target");
      const rect = target.getBoundingClientRect();

      bubble.style.top = `${Math.min(rect.bottom + 14, window.innerHeight - 220)}px`;
      bubble.style.left = `${Math.max(16, Math.min(rect.left + 20, window.innerWidth - 360))}px`;
    } else {
      bubble.classList.add("tutorial-bubble--center");
    }

    bubble.querySelector(".tutorial-skip")?.addEventListener("click", finish);

    bubble.querySelector(".tutorial-next")?.addEventListener("click", () => {
      if (currentStep >= steps.length - 1) {
        finish();
        return;
      }

      currentStep += 1;
      renderStep();
    });
  }

  function start({ force = false } = {}) {
    if (!force && localStorage.getItem(TUTORIAL_SEEN_KEY) === "true") return;

    currentStep = 0;
    renderStep();
  }

  function init() {
    start({ force: false });

    window.addEventListener("resize", () => {
      if (bubble) renderStep();
    });
  }

  return {
    init,
    start,
    finish,
  };
}