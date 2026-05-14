const TEMPLATES = {
  cpp: [
    {
      level: "Beginner",
      id: "hello-world",
      title: "Hello World",
      description: "Your first C++ program.",
      teaches: [
        "Printing output",
        "Using cout",
        "Understanding main()",
      ],
      code: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello, world!" << endl;

  return 0;
}`,
    },

    {
      level: "Beginner",
      id: "variables",
      title: "Variables",
      description: "Learn how variables store values.",
      teaches: [
        "Variables",
        "Data storage",
        "Displaying values",
      ],
      code: `#include <iostream>
using namespace std;

int main() {
  int age = 15;

  cout << age << endl;

  return 0;
}`,
    },

    {
      level: "Beginner",
      id: "input-output",
      title: "Input and Output",
      description: "Read user input using cin.",
      teaches: [
        "User input",
        "cin",
        "Displaying input",
      ],
      code: `#include <iostream>
using namespace std;

int main() {
  int number;

  cin >> number;

  cout << number << endl;

  return 0;
}`,
    },

    {
      level: "Beginner",
      id: "if-statement",
      title: "If Statement",
      description: "Run code only when a condition is true.",
      teaches: [
        "Conditions",
        "Decision making",
        "if statements",
      ],
      code: `#include <iostream>
using namespace std;

int main() {
  int age = 18;

  if (age >= 18) {
    cout << "Adult" << endl;
  }

  return 0;
}`,
    },

    {
      level: "Beginner",
      id: "for-loop",
      title: "For Loop",
      description: "Repeat code multiple times.",
      teaches: [
        "Loops",
        "Counters",
        "Repeated execution",
      ],
      code: `#include <iostream>
using namespace std;

int main() {
  for (int i = 0; i < 5; i++) {
    cout << i << endl;
  }

  return 0;
}`,
    },

    {
      level: "Intermediate",
      id: "nested-condition",
      title: "Nested Condition",
      description: "Use conditions inside other conditions.",
      teaches: [
        "Nested if statements",
        "Logic flow",
        "Program structure",
      ],
      code: `#include <iostream>
using namespace std;

int main() {
  int score = 85;

  if (score >= 50) {
    if (score >= 80) {
      cout << "Excellent" << endl;
    }
  }

  return 0;
}`,
    },

    {
      level: "Intermediate",
      id: "while-loop",
      title: "While Loop",
      description: "Repeat code while a condition remains true.",
      teaches: [
        "while loops",
        "Conditions",
        "Loop control",
      ],
      code: `#include <iostream>
using namespace std;

int main() {
  int count = 1;

  while (count <= 5) {
    cout << count << endl;
    count++;
  }

  return 0;
}`,
    },
  ],

  python: [],
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function createTemplatesController(dom, editor, modal, getActiveLanguage) {
  function getActiveLanguageSafe() {
    return getActiveLanguage
      ? getActiveLanguage()
      : { id: "cpp", label: "C++", displayName: "C++" };
  }

  function getTemplatesForActiveLanguage() {
    const activeLanguage = getActiveLanguageSafe();
    return TEMPLATES[activeLanguage.id] || [];
  }

  function getTemplatesHtml() {
    const activeLanguage = getActiveLanguageSafe();
    const templates = getTemplatesForActiveLanguage();

    if (!templates.length) {
      return `
        <div class="card">
          <h3>No templates yet</h3>
          <p>
            Templates for ${escapeHtml(activeLanguage.displayName || activeLanguage.label || activeLanguage.id)}
            are not available yet.
          </p>
          <p>
            Switch back to C++ to use the current starter templates.
          </p>
        </div>
      `;
    }

    return `
      <div class="templates-grid">
        ${templates.map((template) => `
          <button
            class="template-card"
            data-template-id="${template.id}"
            type="button"
            >
            <h3>${escapeHtml(template.title)}</h3>

            <p>${escapeHtml(template.description)}</p>

            <span class="template-level">
                ${escapeHtml(template.level || "Beginner")}
            </span>
            <div class="template-teaches">
                ${template.teaches?.map((item) => `
                    <span class="template-topic">
                    ${escapeHtml(item)}
                    </span>
                `).join("") || ""}
                </div>
            </button>
        `).join("")}
      </div>
    `;
  }

  function openTemplatesModal() {
    const activeLanguage = getActiveLanguageSafe();
    const templates = getTemplatesForActiveLanguage();

    modal.openModal({
      title: "Starter Templates",
      subtitle: `Choose a beginner-friendly ${activeLanguage.displayName || activeLanguage.label || activeLanguage.id} example`,
      bodyHtml: getTemplatesHtml(),
    });

    dom.modalBody
      ?.querySelectorAll("[data-template-id]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const id = button.getAttribute("data-template-id");
          const template = templates.find((item) => item.id === id);

          if (!template) return;

          const currentCode =
            editor && typeof editor.getCode === "function"
                ? editor.getCode()
                : dom.codeInput?.value || "";

            if (currentCode.trim()) {
            const confirmed = window.confirm(
                "Loading this template will replace the current editor code. Continue?"
            );

            if (!confirmed) {
                return;
            }
            }

          editor.setCode(template.code);

          if (modal && typeof modal.closeModal === "function") {
            modal.closeModal();
          }
        });
      });
  }

  return {
    openTemplatesModal,
  };
}