import { escapeHtml } from "../../core/html.js";

export function removeDiagnosticsBox() {
  document.querySelector(".diagnostics-box")?.remove();
}

export function removeDiagnosticsSummary() {
  document.querySelector(".diagnostics-summary")?.remove();
}

export function renderDiagnosticsBox(dom, errors = []) {
  removeDiagnosticsBox();

  if (dom.codeInput) {
    dom.codeInput.classList.toggle("code-input--has-error", errors.length > 0);
  }

  if (!errors.length) return;

  const box = document.createElement("div");
  box.className = "diagnostics-box";

  box.innerHTML = `
    <h3>Fix these errors first</h3>

    ${errors
      .map(
        (error) => `
          <div class="diagnostics-error-item">
            <p>
              <strong>Error:</strong>
              ${error.description}
              <span>Line ${error.line}</span>
            </p>

            ${error.text ? `<code>${escapeHtml(error.text)}</code>` : ""}
          </div>
        `
      )
      .join("")}
  `;

  dom.explanationContent?.prepend(box);
}

export function renderDiagnosticsSummary(dom, errors = []) {
  removeDiagnosticsSummary();

  if (!errors.length || !dom.explanationContent) {
    return;
  }

  const summary = document.createElement("div");
  summary.className = "diagnostics-summary";

  summary.innerHTML = `
    <h3>Problems found</h3>

    <ul>
      ${errors
        .map(
          (error) => `
            <li>
              Line ${error.line}: ${error.description}
            </li>
          `
        )
        .join("")}
    </ul>
  `;

  dom.explanationContent.prepend(summary);
}