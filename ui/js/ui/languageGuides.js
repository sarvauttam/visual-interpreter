export const LANGUAGE_GUIDES = {
  cpp: {
    title: "C++ Guide",
    subtitle: "Beginner C++ structure and learning flow",
    bodyHtml: `
      <section class="modal-section">
        <h3>What C++ code usually needs</h3>
        <ul class="modal-list">
          <li><code>#include &lt;iostream&gt;</code> for input and output.</li>
          <li><code>using namespace std;</code> for beginner-friendly examples.</li>
          <li><code>int main() { ... }</code> as the program entry point.</li>
          <li><code>cout</code> to print output.</li>
          <li><code>cin</code> to read input.</li>
          <li><code>return 0;</code> to end the program successfully.</li>
        </ul>
      </section>
    `,
  },

  python: {
    title: "Python Guide",
    subtitle: "Readable beginner programming with simple syntax",
    bodyHtml: `
      <section class="modal-section">
        <h3>Python basics</h3>
        <ul class="modal-list">
          <li>Use <code>print()</code> to display output.</li>
          <li>Use <code>input()</code> to read user input.</li>
          <li>Variables do not need declared types.</li>
          <li>Indentation controls code blocks.</li>
          <li>Use <code>if</code>, <code>elif</code>, and <code>else</code> for decisions.</li>
          <li>Use <code>for</code> and <code>while</code> for loops.</li>
        </ul>
      </section>

      <section class="modal-section">
        <p class="muted">
          Python support is planned, but not fully connected yet.
        </p>
      </section>
    `,
  },

  csharp: {
    title: "C# Guide",
    subtitle: "Object-oriented programming with structured syntax",
    bodyHtml: `
      <section class="modal-section">
        <h3>C# basics</h3>
        <ul class="modal-list">
          <li>Programs usually use a <code>Main</code> method as the starting point.</li>
          <li>Use <code>Console.WriteLine()</code> to print output.</li>
          <li>Use <code>Console.ReadLine()</code> to read input.</li>
          <li>Variables use declared types such as <code>int</code>, <code>string</code>, and <code>bool</code>.</li>
          <li>Use classes to group data and behavior.</li>
        </ul>
      </section>

      <section class="modal-section">
        <p class="muted">
          C# support is planned for future expansion.
        </p>
      </section>
    `,
  },

  javascript: {
    title: "JavaScript Guide",
    subtitle: "Browser-friendly scripting and logic",
    bodyHtml: `
      <section class="modal-section">
        <h3>JavaScript basics</h3>
        <ul class="modal-list">
          <li>Use <code>console.log()</code> to print output.</li>
          <li>Use <code>let</code> and <code>const</code> for variables.</li>
          <li>Use functions to organize reusable logic.</li>
          <li>Use <code>if</code>, <code>else</code>, loops, and arrays for core programming tasks.</li>
          <li>JavaScript is commonly used for web interaction.</li>
        </ul>
      </section>

      <section class="modal-section">
        <p class="muted">
          JavaScript explanation support is part of the future language plan.
        </p>
      </section>
    `,
  },
};