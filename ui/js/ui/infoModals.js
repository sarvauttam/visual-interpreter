export function renderHowToUseModal(modal) {
  modal.openModal({
    title: "How to Use ISeeCode",
    subtitle: "A quick guide to writing, understanding, and running code here",
    bodyHtml: `
      <section class="modal-section">
        <h3>What ISeeCode does</h3>
        <p>
          ISeeCode helps you write code, understand what each line means,
          and see what your program produces when it runs.
        </p>
      </section>

      <section class="modal-section">
        <h3>How to use it</h3>
        <ul class="modal-list">
          <li>Write your code in the editor on the left.</li>
          <li>As complete lines appear, explanations will show on the right.</li>
          <li>If a line is unfinished, ISeeCode gives a helpful hint instead of guessing.</li>
          <li>Click <strong>Run</strong> to execute the code and view the output below.</li>
          <li>After a run, explanations can include runtime-aware notes as well.</li>
        </ul>
      </section>

      <section class="modal-section">
        <h3>What this interface is for</h3>
        <p>
          This interface is designed for learning, not for debugging like a technical developer dashboard.
        </p>
      </section>
    `,
  });
}

export function renderAccountModal(modal) {
  modal.openModal({
    title: "Local Saves",
    subtitle: "Your code history is saved only in this browser",
    bodyHtml: `
      <div class="card">
        <h3>Storage status</h3>

        <p>
          ISeeCode currently saves history using your browser's local storage.
          This means your saved code stays on this browser and this device.
        </p>

        <h3>What this means</h3>

        <p>
          If you clear browser data, use private browsing, or switch devices,
          your saved history may not be available.
        </p>

        <h3>Why there is no account yet</h3>

        <p>
          Accounts are only useful after cloud sync, login, or server storage
          is added. Until then, this button is labeled Local Saves to avoid
          misleading users.
        </p>
      </div>
    `,
  });
}