# Visual Interpreter for Program Execution

A lightweight educational interpreter that visualizes program execution step-by-step in the browser.
The system exposes runtime execution state (variables, control flow, and function calls) through a trace-driven visualization interface designed to help beginners understand how programs actually run.

The interpreter itself is implemented in **C++**, compiled to **WebAssembly**, and executed entirely inside the browser.

---

# Live Demo

Use the interpreter directly in your browser:

```
https://sarvauttam.github.io/visual-interpreter/
```

No installation required.

---

# Project Overview

This project investigates how **runtime execution visualization** can improve the transparency of program execution for learners.

Instead of treating interpreters as a “black box”, the system exposes internal execution events such as:

* variable creation
* variable updates
* function calls
* function returns
* branch decisions
* loop iterations
* program output

These events are emitted as a structured **execution trace** and rendered in a browser interface.

---

# System Architecture

```
Source Code
     ↓
Lexer
     ↓
Parser
     ↓
Abstract Syntax Tree
     ↓
Evaluator
     ↓
TraceEmitter
     ↓
JSON Trace
     ↓
Browser Visualization UI
```

---

# Deployment Model

The interpreter runs entirely in the browser using WebAssembly.

```
Browser
   │
   │ WebAssembly (vi_wasm.wasm)
   │
Interpreter Runtime (C++)
   │
TraceEmitter
   │
JSONL Trace
   │
Visualization UI
```

Advantages:

* no backend server required
* globally accessible via static hosting
* browser sandbox security
* deterministic execution
* low infrastructure cost

---

# Visualization Interface

The browser UI provides several panels for exploring execution.

### Code Panel

Displays the source program with the currently executing line highlighted.

### Changes Panel

Shows explanations of what happens at each step of execution.

### Variables Panel

Displays variable values and their scope.

### Call Stack Panel

Shows active function frames.

### Console

Displays program output.

---

# Execution Controls

The interface supports interactive exploration of execution.

```
Prev
Play / Pause
Next
Speed slider
Timeline scrubbing
```

Keyboard shortcuts:

```
→ Step forward
← Step backward
Space Play / Pause
Home Start of execution
End End of execution
```

---

# Interpreter Implementation

The interpreter is implemented in C++ and consists of several core components.

| Component    | Responsibility            |
| ------------ | ------------------------- |
| Lexer        | tokenizes source code     |
| Parser       | constructs AST            |
| Evaluator    | executes AST              |
| Environment  | manages variable state    |
| TraceEmitter | produces execution events |
| JSONWriter   | serializes events         |

---

# Trace Event Model

Each execution step produces a structured event.

Example:

```json
{
 "type": "VarWrite",
 "loc": { "line": 3, "col": 5 },
 "frame": { "name": "f", "depth": 1 },
 "name": "x",
 "old": 5,
 "new": 6
}
```

Events are written in **JSONL format** to support efficient streaming.

---

# Building the Interpreter

## Native Build

```
mkdir build
cd build
cmake ..
cmake --build .
```

---

## WebAssembly Build

Requires **Emscripten**.

```
mkdir build-wasm
cd build-wasm
emcmake cmake ..
cmake --build . --target vi_wasm
```

This produces:

```
vi_wasm.js
vi_wasm.wasm
```

These files power the browser execution environment.

---

# Running the UI Locally

Start a local server:

```
python -m http.server 8000
```

Then open:

```
http://localhost:8000
```

---

# Testing

Unit tests cover:

* lexer
* parser
* runtime
* trace generation
* WebAssembly runner

Run tests:

```
ctest --test-dir build -C Debug
```

---

# Repository Structure

```
visual-interpreter
│
├── index.html
├── src
├── tests
├── ui
│   ├── css
│   └── js
├── docs
└── bridge
```

---

# Research Context

This project was developed as part of a dissertation investigating:

* educational interpreters
* notional machines
* execution visualization
* trace-driven program understanding

The work explores whether exposing runtime execution events improves learners’ understanding of program behavior.

---

# License

MIT License

---

# Author

Uttam Torry
