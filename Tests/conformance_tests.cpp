#include "test_main.h"
#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <cstdio>
#include <cstdlib>
#include <stdexcept>
static std::string g_helper_error;

#ifdef _WIN32
  #define POPEN _popen
  #define PCLOSE _pclose
#else
  #define POPEN popen
  #define PCLOSE pclose
#endif

static std::string read_all_or_throw(const std::string& path) {
  std::ifstream in(path, std::ios::binary);
  if (!in.good()) throw std::runtime_error("Could not open file: " + path);
  std::ostringstream ss;
  ss << in.rdbuf();
  return ss.str();
}

static void write_text_or_throw(const std::string& path, const std::string& text) {
  std::ofstream out(path, std::ios::binary);
  if (!out.good()) throw std::runtime_error("Could not write file: " + path);
  out << text;
}

static std::vector<std::string> read_lines_or_throw(const std::string& path) {
  std::ifstream in(path);
  if (!in.good()) throw std::runtime_error("Could not open file: " + path);
  std::vector<std::string> lines;
  std::string line;
  while (std::getline(in, line)) {
    if (!line.empty()) lines.push_back(line);
  }
  return lines;
}

static bool contains_substr(const std::vector<std::string>& lines, const std::string& needle) {
  for (const auto& l : lines) if (l.find(needle) != std::string::npos) return true;
  return false;
}

static int index_of(const std::vector<std::string>& lines, const std::string& needle) {
  for (int i = 0; i < (int)lines.size(); ++i) {
    if (lines[i].find(needle) != std::string::npos) return i;
  }
  return -1;
}

static std::string run_vi_capture_stdout_or_throw(const std::string& program_src,
                                                  const std::string& trace_path) {
  // Write program file in the *current working directory* of the test binary.
  write_text_or_throw("program_tmp.txt", program_src);

  // Remove old trace if exists
  std::remove(trace_path.c_str());

#ifdef _WIN32
  // vi.exe is at build/Debug/vi.exe while tests run at build/tests/Debug/
  std::string cmd = "..\\Debug\\vi.exe program_tmp.txt --trace " + trace_path;
#else
  std::string cmd = "../vi program_tmp.txt --trace " + trace_path;
#endif

  std::string out;
  FILE* pipe = POPEN(cmd.c_str(), "r");
  if (!pipe) throw std::runtime_error("Failed to run command: " + cmd);

  char buf[256];
  while (fgets(buf, sizeof(buf), pipe)) out += buf;

  int rc = PCLOSE(pipe);
  (void)rc; // Some error tests may have nonzero exit later; we assert behavior via stdout/trace.

  return out;
}

static std::string run_vi_capture_stdout(const std::string& program_src,
                                        const std::string& trace_path) {
  try {
    g_helper_error.clear();
    return run_vi_capture_stdout_or_throw(program_src, trace_path);
  } catch (const std::exception& ex) {
    g_helper_error = ex.what();
    return ""; // safe default
  }
}

static std::vector<std::string> read_lines(const std::string& path) {
  try {
    g_helper_error.clear();
    return read_lines_or_throw(path);
  } catch (const std::exception& ex) {
    g_helper_error = ex.what();
    return {}; // safe default
  }
}

// ----------------------
// T01 precedence
// ----------------------
TEST(T01_precedence) {
  std::string out = run_vi_capture_stdout("print(1 + 2 * 3);\n", "trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  REQUIRE(out == "7\n");
}

// ----------------------
// T02 var write old/new
// ----------------------
TEST(T02_var_write_old_new) {
  (void)run_vi_capture_stdout("let x = 1;\n"
                             "x = x + 2;\n",
                             "trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  auto lines = read_lines("trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  REQUIRE(contains_substr(lines, "\"type\":\"VarWrite\""));
  REQUIRE(contains_substr(lines, "\"old\":\"1\""));
  REQUIRE(contains_substr(lines, "\"new\":\"3\""));
}

// ----------------------
// T03 if/else decision
// ----------------------
TEST(T03_if_else_branch_decision) {
  std::string out = run_vi_capture_stdout(
    "func f(a){\n"
    "  if (a == 1) { return 7; }\n"
    "  return 9;\n"
    "}\n"
    "print(f(1));\n"
    "print(f(2));\n",
    "trace_tmp.jsonl"
  );
  REQUIRE(g_helper_error.empty());
  REQUIRE(out == "7\n9\n");
  auto lines = read_lines("trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  REQUIRE(contains_substr(lines, "\"type\":\"BranchDecision\""));
  REQUIRE(contains_substr(lines, "\"cond\":true"));
  REQUIRE(contains_substr(lines, "\"cond\":false"));
}

// ----------------------
// T04 while iteration + exit
// ----------------------
TEST(T04_while_loop_events) {
  std::string out = run_vi_capture_stdout(
    "let x = 0;\n"
    "while (x < 3) { x = x + 1; }\n"
    "print(x);\n",
    "trace_tmp.jsonl"
  );
  REQUIRE(g_helper_error.empty());
  REQUIRE(out == "3\n");
  auto lines = read_lines("trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  REQUIRE(contains_substr(lines, "\"type\":\"LoopCheck\""));
  REQUIRE(contains_substr(lines, "\"type\":\"LoopIterationStart\""));
  REQUIRE(contains_substr(lines, "\"type\":\"LoopExit\""));
  REQUIRE(contains_substr(lines, "\"iters\":3"));
}

// ----------------------
// T05 short-circuit OR
// ----------------------
TEST(T05_short_circuit_or) {
  std::string out = run_vi_capture_stdout("print(true || (1/0));\n", "trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  REQUIRE(out == "1\n");
  auto lines = read_lines("trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  REQUIRE(contains_substr(lines, "\"type\":\"ShortCircuit\""));
  REQUIRE(contains_substr(lines, "\"op\":\"||\""));
  REQUIRE(contains_substr(lines, "\"reason\":\"lhs_true\""));
}

// ----------------------
// T06 short-circuit AND
// ----------------------
TEST(T06_short_circuit_and) {
  std::string out = run_vi_capture_stdout("print(false && (1/0));\n", "trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  REQUIRE(out == "0\n");
  auto lines = read_lines("trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());
  REQUIRE(contains_substr(lines, "\"type\":\"ShortCircuit\""));
  REQUIRE(contains_substr(lines, "\"op\":\"&&\""));
  REQUIRE(contains_substr(lines, "\"reason\":\"lhs_false\""));
}

// ----------------------
// T07 arg eval order
// ----------------------
TEST(T07_arg_eval_order) {
  std::string out = run_vi_capture_stdout(
    "let x = 0;\n"
    "func inc(){ x = x + 1; return x; }\n"
    "func f(a,b){ return a*10 + b; }\n"
    "print(f(inc(), inc()));\n",
    "trace_tmp.jsonl"
  );
  REQUIRE(g_helper_error.empty());
  (void)out; // we validate via trace ordering

  auto lines = read_lines("trace_tmp.jsonl");
  REQUIRE(g_helper_error.empty());

  // Find first two CallArg events; ensure they are index 0 then index 1 in that order.
  int first = index_of(lines, "\"type\":\"CallArg\"");
  REQUIRE(first >= 0);
  REQUIRE(lines[first].find("\"index\":0") != std::string::npos);

  int second = -1;
  for (int i = first + 1; i < (int)lines.size(); ++i) {
    if (lines[i].find("\"type\":\"CallArg\"") != std::string::npos) { second = i; break; }
  }
  REQUIRE(second >= 0);
  REQUIRE(lines[second].find("\"index\":1") != std::string::npos);
}

// ----------------------
// T08 return; + fallthrough
// ----------------------
TEST(T08_return_and_fallthrough) {
  std::string out = run_vi_capture_stdout(
    "func a(){ return; }\n"
    "func b(){ let x = 1; }\n"
    "print(a());\n"
    "print(b());\n",
    "trace_tmp.jsonl"
  );
  REQUIRE(g_helper_error.empty());
  REQUIRE(out == "0\n0\n");
}

// ----------------------
// T09 divide-by-zero halting
// ----------------------
TEST(T09_divide_by_zero_halts) {
  std::string out = run_vi_capture_stdout(
    "let x = 1/0;\n"
    "print(99);\n",
    "trace_tmp.jsonl"
  );
  REQUIRE(g_helper_error.empty());
  REQUIRE(out == "");
}

// ----------------------
// T10 local vs global resolution
// ----------------------
TEST(T10_local_vs_global) {
  std::string out = run_vi_capture_stdout(
    "let a = 100;\n"
    "func f(a){ return a+1; }\n"
    "print(f(1));\n"
    "print(a);\n",
    "trace_tmp.jsonl"
  );
  REQUIRE(g_helper_error.empty());
  REQUIRE(out == "2\n100\n");
}
