(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

    function showInlineError(message) {
    const api = window.ISeeCodeFeedback;
    const inlineErrorHost = api.elements.inlineErrorHost;

    if (!inlineErrorHost) return;

    inlineErrorHost.innerHTML = `
        <div class="inline-error">
        <span>❌</span>
        <span>${escapeHtml(message)}</span>
        </div>
    `;
    }

    function clearInlineError() {
    const api = window.ISeeCodeFeedback;
    const inlineErrorHost = api.elements.inlineErrorHost;

    if (!inlineErrorHost) return;
    inlineErrorHost.innerHTML = "";
    }

  function showFeedback(message, type = "info", options = {}) {
    const api = window.ISeeCodeFeedback;
    const feedbackBanner = api.elements.feedbackBanner;

    if (!feedbackBanner) return;

    const { persist = false } = options;

    if (api.state.feedbackTimer) {
      window.clearTimeout(api.state.feedbackTimer);
      api.state.feedbackTimer = null;
    }

    feedbackBanner.textContent = message;
    feedbackBanner.className = `feedback-banner feedback-banner--${type}`;

    if (!persist) {
      api.state.feedbackTimer = window.setTimeout(() => {
        clearFeedback();
      }, 2600);
    }
  }

  function clearFeedback() {
    const api = window.ISeeCodeFeedback;
    const feedbackBanner = api.elements.feedbackBanner;

    if (!feedbackBanner) return;

    if (api.state.feedbackTimer) {
      window.clearTimeout(api.state.feedbackTimer);
      api.state.feedbackTimer = null;
    }

    feedbackBanner.textContent = "";
    feedbackBanner.className = "feedback-banner hidden";
  }

  function setOutput(text) {
    const api = window.ISeeCodeFeedback;
    const outputPanel = api.elements.outputPanel;

    if (!outputPanel) return;
    outputPanel.textContent = text || "Ready.";
  }

  window.ISeeCodeFeedback = {
    elements: {
      feedbackBanner: null,
      outputPanel: null,
      inlineErrorHost: null,
    },
    state: {
      feedbackTimer: null,
    },
    escapeHtml,
    showInlineError,
    clearInlineError,
    showFeedback,
    clearFeedback,
    setOutput,
  };
})();