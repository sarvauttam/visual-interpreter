#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <vector>

#include "lexer/lexer.h"
#include "parser/parser.h"
#include "runtime/evaluator.h"
#include "trace/trace.h"
#include "wasm/runner.h"

static std::string read_file(const std::string& path) {
  std::ifstream in(path, std::ios::binary);
  if (!in) return "";
  std::ostringstream ss;
  ss << in.rdbuf();
  return ss.str();
}

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "Usage: vi <program.txt> [--trace <trace.jsonl>]\n";
    return 1;
  }

  std::string program_path = argv[1];

  // Optional: --trace <file>
  std::string trace_path;
  for (int i = 2; i < argc; ++i) {
    std::string a = argv[i];
    if (a == "--trace" && i + 1 < argc) {
      trace_path = argv[i + 1];
      ++i;
    }
  }

  // Read source file
  std::ifstream in(program_path, std::ios::binary);
  if (!in) {
    std::cerr << "Could not open source file: " << program_path << "\n";
    return 1;
  }
  std::ostringstream ss;
  ss << in.rdbuf();
  std::string source = ss.str();

  // Lex
  Lexer lex(source);
  auto tokens = lex.tokenize_all();

  // Parse  ✅ HERE
  Parser parser(tokens);
  auto program = parser.parse_program();              // <-- put this here
  if (parser.error()) {
    std::cerr << "ParseError "
              << parser.error()->loc.line << ":" << parser.error()->loc.col
              << " " << parser.error()->message << "\n";
    return 1;
  }

  // Evaluator
  Evaluator eval;

  // Trace setup (optional)
  std::unique_ptr<std::ofstream> trace_file;
  std::unique_ptr<TraceEmitter> emitter;
  if (!trace_path.empty()) {
    trace_file = std::make_unique<std::ofstream>(trace_path, std::ios::binary);
    if (!trace_file->is_open()) {
      std::cerr << "Could not open trace file: " << trace_path << "\n";
      return 1;
    }
    emitter = std::make_unique<TraceEmitter>(trace_file.get());
    emitter->reset();
    eval.set_trace(emitter.get());
  }

  // Execute ✅ HERE
  if (!eval.exec_program(program)) {                 // <-- and here
    if (eval.last_error()) {
      std::cerr << "RuntimeError: " << eval.last_error()->message << "\n";
    } else {
      std::cerr << "RuntimeError\n";
    }
    return 1;
  }

  return 0;
}
