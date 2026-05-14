const LIBRARIES = {
  iostream: {
    name: "iostream",
    role: "Lets your program use input and output tools like cout and cin.",
  },

  string: {
    name: "string",
    role: "Lets your program create and use text values with the string type.",
  },

  cmath: {
    name: "cmath",
    role: "Provides math functions like sqrt(), pow(), round(), and abs().",
  },

  vector: {
    name: "vector",
    role: "Lets your program store dynamic lists of values that can grow and shrink.",
  },

  algorithm: {
    name: "algorithm",
    role: "Provides useful algorithms like sort(), reverse(), find(), and max().",
  },

  map: {
    name: "map",
    role: "Lets your program store key-value pairs like a dictionary.",
  },

  set: {
    name: "set",
    role: "Stores unique values automatically without duplicates.",
  },

  queue: {
    name: "queue",
    role: "Provides queue data structures where items are processed in order.",
  },

  stack: {
    name: "stack",
    role: "Provides stack data structures where the last item added is removed first.",
  },

  deque: {
    name: "deque",
    role: "A double-ended queue that allows adding and removing from both ends.",
  },

  list: {
    name: "list",
    role: "Provides doubly linked lists for efficient insertions and deletions.",
  },

  array: {
    name: "array",
    role: "Lets your program use fixed-size arrays with STL features.",
  },

  utility: {
    name: "utility",
    role: "Provides helper tools like pair and swap.",
  },

  limits: {
    name: "limits",
    role: "Lets your program access information about data type limits.",
  },

  cstdlib: {
    name: "cstdlib",
    role: "Provides utilities like rand(), srand(), and memory tools.",
  },

  ctime: {
    name: "ctime",
    role: "Lets your program work with time and dates.",
  },

  fstream: {
    name: "fstream",
    role: "Lets your program read from and write to files.",
  },

  iomanip: {
    name: "iomanip",
    role: "Provides formatting tools for output like setw() and setprecision().",
  },

  climits: {
    name: "climits",
    role: "Provides minimum and maximum limits for integer types.",
  },

  cctype: {
    name: "cctype",
    role: "Provides character checking tools like isdigit() and isalpha().",
  },

  exception: {
    name: "exception",
    role: "Provides tools for handling runtime errors and exceptions.",
  },

  memory: {
    name: "memory",
    role: "Provides smart pointers and memory management utilities.",
  },

  functional: {
    name: "functional",
    role: "Provides function objects, lambdas, and callable utilities.",
  },

  tuple: {
    name: "tuple",
    role: "Lets your program group multiple values together into one object.",
  },

  bitset: {
    name: "bitset",
    role: "Provides compact storage and manipulation of bits.",
  },

  regex: {
    name: "regex",
    role: "Lets your program search and match text patterns using regular expressions.",
  },

  thread: {
    name: "thread",
    role: "Provides tools for running multiple tasks at the same time.",
  },

  chrono: {
    name: "chrono",
    role: "Lets your program measure time and durations accurately.",
  },

  random: {
    name: "random",
    role: "Provides advanced random number generators.",
  },

  numeric: {
    name: "numeric",
    role: "Provides numeric algorithms like accumulate().",
  },

  unordered_map: {
    name: "unordered_map",
    role: "Stores key-value pairs using hash tables for faster access.",
  },

  unordered_set: {
    name: "unordered_set",
    role: "Stores unique values using hash tables.",
  },

  valarray: {
    name: "valarray",
    role: "Provides arrays optimized for mathematical calculations.",
  },

  typeinfo: {
    name: "typeinfo",
    role: "Lets your program inspect type information during runtime.",
  },

  new: {
    name: "new",
    role: "Provides tools for dynamic memory allocation.",
  },

  initializer_list: {
    name: "initializer_list",
    role: "Lets objects be initialized using brace-enclosed lists.",
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function createLibraryInfoController(dom) {
  function getLibrariesFromSource(source) {
    const matches = String(source || "").matchAll(/#include\s*<([^>]+)>/g);

    return [...matches].map((match) => match[1].trim());
  }

  function render(source) {
    document.querySelector(".library-info-box")?.remove();

    const libraries = getLibrariesFromSource(source);

    if (!libraries.length || !dom.explanationContent) return;

    const box = document.createElement("div");
    box.className = "library-info-box";

    box.innerHTML = `
      <h3>Libraries used</h3>
      ${libraries.map((libraryName) => {
        const info = LIBRARIES[libraryName];

        if (!info) {
          return `
            <div class="library-insight-item">
              <strong>${escapeHtml(libraryName)}</strong>
              <p>This library is not explained yet.</p>
            </div>
          `;
        }

        return `
          <div class="library-insight-item">
            <strong>${escapeHtml(info.name)}</strong>
            <p>${escapeHtml(info.role)}</p>
          </div>
        `;
      }).join("")}
    `;

    dom.explanationContent.prepend(box);
  }

  return {
    render,
  };
}