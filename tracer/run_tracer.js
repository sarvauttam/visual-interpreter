// Minimal JSONL tracer for the VI Trace Visualizer
// This runs a program and logs events into trace.jsonl

const fs = require("fs");
const vm = require("vm");

// Where to write the trace
const traceFile = fs.createWriteStream("trace.jsonl", { flags: "w" });

// Event counter
let seq = 0;

// Helper to write one JSONL event
function log(event) {
  event.seq = seq++;
  traceFile.write(JSON.stringify(event) + "\n");
}

// Provide a fake "print" function so the program can call it
function print(...args) {
  log({ type: "Print", value: args.join(" ") });
}

// Wrap the program execution in a VM context
function runProgram(filename) {
  const code = fs.readFileSync(filename, "utf8");

  const context = {
    print,
    console,
    log,
  };

  vm.createContext(context);

  log({ type: "Start" });
  vm.runInContext(code, context);
  log({ type: "End" });

  traceFile.end();
}

// Run the test program
runProgram("test_program.js");