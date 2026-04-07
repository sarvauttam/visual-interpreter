# 🧠 ISeeCode — Learn Code While You Write It

ISeeCode is a browser-based visual learning interface that explains code as you type, helping beginners understand what their code actually does — not just whether it runs.

Github : https://github.com/sarvauttam/visual-interpreter
Live Demo: https://sarvauttam.github.io/visual-interpreter


---

# 🚀 What is ISeeCode?

Most tools focus on:

* running code
* or highlighting syntax

ISeeCode focuses on something different:

> **Understanding code in real time.**

As you type or upload code, the system:

* analyzes it
* detects its structure and language
* generates clear, human-readable explanations

---

# ✨ Core Features

### 🧠 Live Explanation Engine

* Explains code line-by-line as you type
* Avoids guessing on incomplete lines
* Provides hints instead of misleading output

---

### 🔄 Dual Mode System (Key Innovation)

#### ▶️ Run Mode

* Executes a simplified teaching language in the browser (via WebAssembly)
* Produces real output
* Adds runtime-aware explanations

#### 📖 Explain-Only Mode

* Automatically activates for real-world code (C++, Python, JavaScript, C#)
* Focuses on understanding, not execution
* Works even with incomplete or non-runnable code

---

### 🌍 Multi-Language Awareness

Supports detection and explanation for:

* C++
* Python
* JavaScript
* C#

(Execution is limited to the internal teaching language)

---

### 📁 File Upload Support

* Upload code files directly
* Automatically detects language
* Switches to the appropriate mode

---

### 🕘 History System

* Saves previous runs locally
* Restore past code instantly
* Keeps learning flow uninterrupted

---

### 🎯 Clean, Modular UI

* Structured panels for:

  * Editor
  * Explanation
  * Output
* Synchronized mode indicators across UI
* Built with a scalable CSS + JS architecture

---

# ⚙️ How It Works

1. Write or upload code

2. The system analyzes the input

3. It detects:

   * language
   * completeness
   * intent

4. It chooses a mode:

   * Run Mode → executes code
   * Explain-Only Mode → explains code

5. The UI updates:

   * explanations panel
   * output panel
   * mode badges

---

# 🏗️ Architecture Overview

### Frontend (Modular JS)

* `app.js` → orchestration layer
* `editor.js` → editor behavior & input handling
* `runner.js` → WASM execution engine
* `explanations.js` → explanation pipeline
* `explainOnly.js` → language-aware explanation mode
* `history.js` → local storage system
* `dom.js` → DOM references

---

### UI System

* Modular CSS structure:

  * `base.css` → global styles
  * `layout.css` → structure
  * `editor.css` → editor
  * `explanations.css` → explanation UI
  * `output.css` → output UI
  * `history.css` → history UI
  * `modals.css` → modal system
  * `components.css` → reusable UI components
  * `badges.css` → mode indicators

---

### Execution Layer

* WebAssembly-based interpreter
* Designed for a simplified teaching language
* Not a full C++ runtime

---

# ⚠️ Limitations

* The interpreter does **not support full C++ or other real languages**
* Explain-only mode does **not execute code**
* Language detection is heuristic-based
* WASM execution is limited to a controlled syntax

---

# 🔮 Future Improvements

* Smarter language detection
* More advanced explanation engine
* Step-by-step execution visualization
* Better runtime tracing
* User accounts and saved work
* Expanded language support

---

# 💡 Why This Project Matters

Beginners often struggle because:

* code runs, but they don’t understand *why*
* errors appear without clear meaning
* tutorials don’t match their own code

ISeeCode bridges that gap:

> It turns code into explanations — in real time.

---

# 🧪 Project Status

* ✅ UI architecture stabilized
* ✅ Explain-only mode implemented
* ✅ Multi-language detection working
* ✅ Modular CSS system implemented
* ⚠️ WASM runtime limited to teaching subset
* 🚧 Ongoing improvements in explanation quality

---

# 📸 Demo

<img width="921" height="641" alt="image" src="https://github.com/user-attachments/assets/a7fedc01-9e2b-4e7e-9245-32bc4e480f32" />
<img width="627" height="812" alt="image" src="https://github.com/user-attachments/assets/7f9dfa5c-9322-4b02-a638-047251ddf45a" />
<img width="636" height="376" alt="image" src="https://github.com/user-attachments/assets/fbd79428-abe4-47bb-9121-cf662e4075e5" />
<img width="1306" height="836" alt="image" src="https://github.com/user-attachments/assets/286cdb88-3ec4-4708-9550-3c382015435e" />




---

# 📬 Feedback

If you have suggestions, ideas, or want to build on this:

👉 Open an issue or fork the repo.

---

# 🧠 Final Note

This is not just a code runner.

It is an attempt to rethink how people **learn programming while writing code**.
