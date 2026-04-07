# ISeeCode — Learn Code While You Write It

ISeeCode is a browser-based visual code learning system that explains code line by line while the user writes it.

Unlike a traditional IDE, compiler, or interpreter, ISeeCode is designed around a **learning-first workflow**. Its goal is not only to run code, but to help users understand what each line is doing in real time — even when the code is incomplete, partially written, or not directly executable.

**Repository:** `https://github.com/sarvauttam/visual-interpreter`  
**Live Demo:** `https://sarvauttam.github.io/visual-interpreter`

---

## What is ISeeCode?

Most programming tools focus on one of two things:

- executing code
- highlighting syntax

ISeeCode focuses on something different:

> **understanding code while it is being written**

As the user types or uploads code, the system analyzes the input, detects its structure and likely language, selects the appropriate interaction mode, and generates clear human-readable explanations.

This makes the system especially useful for beginners, learners reviewing unfamiliar code, and situations where code is still incomplete and cannot yet be executed normally.

---

## Core Features

### Live Explanation Engine

- Explains code line by line while the user types
- Generates readable explanations instead of raw technical output
- Handles incomplete code more gracefully than a traditional execution-only tool
- Supports learning during writing, not only after execution

### Dual-Mode System

ISeeCode uses two operating modes depending on the type of source code.

#### Run Mode

- Executes code in the browser through a WebAssembly-based teaching interpreter
- Produces runtime output
- Adds execution-aware explanations
- Intended for a simplified internal teaching language

#### Explain-only Mode

- Activates automatically for real-world code that should be explained instead of executed
- Focuses on code structure, purpose, and intent
- Works with incomplete, partially written, or unsupported code
- Supports uncertainty-aware phrasing for weak or mixed snippets

This separation is one of the central design decisions of the project. It allows the system to remain educational even when execution is not appropriate.

### Multi-Language Awareness

The explain-only subsystem currently supports language-aware detection and explanation for:

- C++
- Python
- JavaScript
- C#

The system uses profile-based detection and confidence-aware phrasing to adapt explanations when the code is clear, uncertain, incomplete, or mixed.

### File Upload Support

- Upload code files directly into the interface
- Detect the likely language automatically
- Route the source into the appropriate mode
- Preserve the same explanation workflow for pasted and uploaded code

### History System

- Stores previous work locally using browser storage
- Allows quick restoration of prior code
- Helps maintain learning continuity across sessions

### Inline Guidance

- Notes
- hints
- explanation cards
- output feedback
- synchronized mode indicators

### Modular User Interface

- Separate editor, explanation, output, and history areas
- Reusable badge and card styling
- Clear visual hierarchy designed for readability during learning
- CSS organized into modular files for maintainability

---

## How It Works

1. The user writes or uploads code.
2. The system analyzes the input.
3. It estimates:
   - likely language
   - code structure
   - confidence of detection
   - whether the snippet appears incomplete
4. It selects one of two modes:
   - **Run Mode** for executable teaching-language input
   - **Explain-only Mode** for real-world or non-runnable code
5. The interface updates:
   - explanation cards
   - output panel
   - mode badges
   - history state

---

## Architecture Overview

The project is designed as a modular browser-based system.

### Frontend Modules

- `app.js` — main orchestration
- `editor.js` — editor interaction and input behavior
- `runner.js` — execution pipeline for the teaching runtime
- `explanations.js` — explanation rendering and pipeline coordination
- `explainOnly.js` — explain-only analysis and rendering flow
- `history.js` — local persistence
- `dom.js` — DOM mapping and shared references

### Explain-only Architecture

The explain-only subsystem is built around language profiles and shared explanation utilities.

#### Language Profiles

Separate profiles are used for:

- C++
- Python
- JavaScript
- C#

Each profile defines language-specific signals and explanation rules for constructs such as:

- comments
- conditionals
- loops
- functions
- imports
- declarations
- output statements
- flow-control statements

#### Shared Rule Utilities

To reduce duplication and improve consistency, shared explanation helpers are used for common rule families such as:

- comments
- loops
- conditionals
- return / break / continue
- brace blocks
- fallback phrasing

This improves maintainability and makes it easier to extend the explain-only engine without repeating the same logic in every language profile.

#### Confidence and Uncertainty Handling

The explain-only engine uses confidence-aware detection and softer phrasing when needed.

It can respond differently when code is:

- clearly identifiable
- weakly matched
- incomplete
- mixed across more than one style

This is important because learning tools should avoid sounding overly certain when the input itself is uncertain.

### UI Styling Structure

The UI styling is modularized into dedicated files such as:

- `base.css`
- `layout.css`
- `editor.css`
- `explanations.css`
- `output.css`
- `history.css`
- `modals.css`
- `components.css`
- `badges.css`
- `responsive.css`

This keeps presentation concerns separated and makes the interface easier to maintain and refine.

### Execution Layer

- WebAssembly-based teaching runtime
- Designed for controlled educational execution
- Separate from explain-only logic
- Not intended to be a full compiler or full-language browser runtime

---

## Why This Project Matters

Beginners often struggle because:

- code may run without being understood
- errors often appear before the learner understands the structure
- tutorials rarely match the learner’s own partially written code
- many tools stop being useful the moment code becomes incomplete

ISeeCode addresses that gap by turning source code into guided explanations in real time.

Instead of asking only, “Does the code run?”, the system also asks:

> “Can the user understand what this line is trying to do?”

---

## Current Strengths

- Learning-first design rather than execution-first design
- Real-time explanation while typing
- Dual-mode architecture for execution and non-execution scenarios
- Support for incomplete and non-runnable code
- Modular frontend structure
- Shared explanation-rule utilities for cleaner maintainability
- Multi-language explain-only support
- Confidence-aware phrasing for uncertain snippets

---

## Limitations

This project is intentionally honest about its current boundaries.

- The WebAssembly runner supports a **simplified teaching language**, not full production C++, Python, JavaScript, or C#.
- Explain-only mode is **rule-based**, not semantic or AI-driven.
- Language detection is **heuristic-based** and may be uncertain for mixed snippets.
- Explanation quality can vary depending on the structure and clarity of the input.
- The system does not yet provide full step-by-step runtime visualization for complex real-language execution.

These limitations are design trade-offs, not accidental omissions. The current system prioritizes clarity, responsiveness, and educational value inside a browser environment.

---

## Future Improvements

Planned or possible future extensions include:

- deeper execution visualization
- smarter runtime trace integration
- stronger mixed-language handling
- more advanced explanation generation
- expanded language support
- user accounts and persistent saved work
- richer learning analytics and guided feedback

---

## Tech Stack

- JavaScript
- HTML
- CSS
- WebAssembly

---

## Project Status

- UI architecture stabilized
- Explain-only mode implemented
- Language-aware detection working
- Shared rule utilities introduced for explanation consistency
- Confidence-aware explain-only phrasing added
- Modular CSS structure in place
- Ongoing improvements in explanation quality and learning UX

---

## Screenshots / Demo

<img width="1416" height="102" alt="image" src="https://github.com/user-attachments/assets/9a691ed9-07c4-4595-8f28-cdd3c8dce84c" />
<img width="742" height="523" alt="image" src="https://github.com/user-attachments/assets/08a30671-c34e-424b-9eca-751bd473f207" />
<img width="672" height="271" alt="image" src="https://github.com/user-attachments/assets/a63dd145-eafa-4e89-bb86-a82047cf61f3" />
<img width="672" height="472" alt="image" src="https://github.com/user-attachments/assets/3f827867-6cee-4062-be61-fd76991214fc" />

## Feedback

Suggestions, issues, and contributions are welcome.

If you want to improve the project, open an issue or fork the repository.

---

## Final Note

ISeeCode is not just a code runner.

It is an educational interface designed to help users **understand code while writing it**, including cases where the code is unfinished, uncertain, or not directly executable.
