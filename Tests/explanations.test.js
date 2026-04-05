import {
  classifyLineState,
  buildLiveExplanationStepsFromSource,
  mergeSourceAndTraceExplanations,
} from "../ui/js/explanations.js";

const summaryEl = document.getElementById("summary");
const testListEl = document.getElementById("testList");

const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function addResult(name, passed, message = "") {
  results.push({ name, passed, message });

  const card = document.createElement("article");
  card.className = `test-card ${passed ? "pass" : "fail"}`;

  const title = document.createElement("div");
  title.className = "test-name";
  title.textContent = `${passed ? "PASS" : "FAIL"} — ${name}`;

  const body = document.createElement("div");
  body.className = "test-message";
  body.textContent = message || (passed ? "Test passed." : "Test failed.");

  card.append(title, body);
  testListEl.appendChild(card);
}

function test(name, fn) {
  try {
    fn();
    addResult(name, true);
  } catch (error) {
    addResult(name, false, error?.message || "Unknown test failure.");
  }
}

function finalize() {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  summaryEl.innerHTML = `
    <strong>Total:</strong> ${results.length}
    &nbsp; | &nbsp;
    <strong>Passed:</strong> ${passed}
    &nbsp; | &nbsp;
    <strong>Failed:</strong> ${failed}
  `;
}

// ==============================
// Classification tests
// ==============================

test("classifies incomplete main header", () => {
  const result = classifyLineState("int main(");
  assert(result.kind === "incomplete", `Expected kind=incomplete, got ${result.kind}`);
});

test("classifies malformed cout operator as draft-error", () => {
  const result = classifyLineState("cout < x;");
  assert(result.kind === "draft-error", `Expected kind=draft-error, got ${result.kind}`);
});

test("classifies incomplete return", () => {
  const result = classifyLineState("return");
  assert(result.kind === "incomplete", `Expected kind=incomplete, got ${result.kind}`);
});

test("classifies complete declaration", () => {
  const result = classifyLineState("int x = 5;");
  assert(result.kind === "complete", `Expected kind=complete, got ${result.kind}`);
});

// ==============================
// Source pipeline tests
// ==============================

test("builds temporary entry for malformed cout while typing", () => {
  const source = `int main() {
  cout < x;
}`;

  const result = buildLiveExplanationStepsFromSource(source);

  assert(result.temporaryEntry, "Expected a temporaryEntry to exist.");
  assert(
    result.temporaryEntry.kind === "draft-error",
    `Expected temporaryEntry.kind=draft-error, got ${result.temporaryEntry?.kind}`
  );
});

test("temporary draft-error disappears after correction", () => {
  const broken = `int main() {
  cout < x;
}`;

  const fixed = `int main() {
  cout << x;
}`;

  const brokenResult = buildLiveExplanationStepsFromSource(broken);
  const fixedResult = buildLiveExplanationStepsFromSource(fixed);

  assert(
    brokenResult.temporaryEntry?.kind === "draft-error",
    "Expected broken source to produce a draft-error temporary entry."
  );

  assert(
    !fixedResult.temporaryEntry,
    "Expected corrected source to remove the temporary error entry."
  );
});

test("complete declaration becomes a regular explanation entry", () => {
  const source = `int x = 5;`;
  const result = buildLiveExplanationStepsFromSource(source);

  assert(result.completeEntries.length === 1, `Expected 1 complete entry, got ${result.completeEntries.length}`);
  assert(result.completeEntries[0].kind === "line", `Expected entry kind=line, got ${result.completeEntries[0].kind}`);
});

// ==============================
// Runtime merge tests
// ==============================

test("trace merge turns Print into beginner-friendly runtime narration", () => {
  const source = `cout << x;`;

  const traceInsights = [
    {
      type: "Print",
      lineNumber: 1,
      text: "Printed value 5",
      raw: {
        type: "Print",
        value: 5,
      },
    },
  ];

  const result = mergeSourceAndTraceExplanations(source, traceInsights);
  const entry = result.mergedEntries.find((item) => item.lineNumber === 1);

  assert(entry, "Expected merged entry for line 1.");
  assert(entry.runtimeNotes?.length, "Expected runtime notes to exist.");
  assert(
    entry.runtimeNotes[0].toLowerCase().includes("prints"),
    `Expected beginner-friendly print narration, got: ${entry.runtimeNotes[0]}`
  );
});

test("trace merge turns VarWrite into value-change narration", () => {
  const source = `x = 7;`;

  const traceInsights = [
    {
      type: "VarWrite",
      lineNumber: 1,
      raw: {
        type: "VarWrite",
        name: "x",
        value: 7,
      },
    },
  ];

  const result = mergeSourceAndTraceExplanations(source, traceInsights);
  const entry = result.mergedEntries.find((item) => item.lineNumber === 1);

  assert(entry, "Expected merged entry for line 1.");
  assert(entry.runtimeNotes?.length, "Expected runtime notes to exist.");
  assert(
    entry.runtimeNotes[0].includes("x") && entry.runtimeNotes[0].includes("7"),
    `Expected narration to mention x and 7, got: ${entry.runtimeNotes[0]}`
  );
});

test("trace merge turns BranchDecision into condition narration", () => {
  const source = `if (x > 3) {`;

  const traceInsights = [
    {
      type: "BranchDecision",
      lineNumber: 1,
      raw: {
        type: "BranchDecision",
        value: true,
      },
    },
  ];

  const result = mergeSourceAndTraceExplanations(source, traceInsights);
  const entry = result.mergedEntries.find((item) => item.lineNumber === 1);

  assert(entry, "Expected merged entry for line 1.");
  assert(entry.runtimeNotes?.length, "Expected runtime notes to exist.");
  assert(
    entry.runtimeNotes[0].toLowerCase().includes("condition"),
    `Expected condition narration, got: ${entry.runtimeNotes[0]}`
  );
});

test("trace merge turns Return into beginner-friendly return narration", () => {
  const source = `return x;`;

  const traceInsights = [
    {
      type: "Return",
      lineNumber: 1,
      raw: {
        type: "Return",
        value: 5,
      },
    },
  ];

  const result = mergeSourceAndTraceExplanations(source, traceInsights);
  const entry = result.mergedEntries.find((item) => item.lineNumber === 1);

  assert(entry, "Expected merged entry for line 1.");
  assert(entry.runtimeNotes?.length, "Expected runtime notes to exist.");
  assert(
    entry.runtimeNotes[0].toLowerCase().includes("returns"),
    `Expected return narration, got: ${entry.runtimeNotes[0]}`
  );
});

finalize();