#include "test_main.h"
#include <sstream>
#include "trace/trace.h"
#include "lexer/lexer.h"
#include "parser/parser.h"
#include "runtime/evaluator.h"

TEST(trace_emits_one_event) {
  std::ostringstream oss;
  TraceEmitter tr(&oss);
  tr.reset();

  FrameInfo fr;
  fr.name = "<global>";
  fr.depth = 0;

  tr.emit_event("ProgramStart", Loc{1,1}, fr);

  std::string s = oss.str();
  REQUIRE(s.find("\"type\":\"ProgramStart\"") != std::string::npos);
  REQUIRE(s.find("\"seq\":1") != std::string::npos);
}


TEST(trace_emits_var_events_and_print) {
  std::ostringstream oss;
  TraceEmitter tr(&oss);
  tr.reset();

  const std::string src =
    "let x = 1;"
    "x = x + 2;"
    "print(x);";

  Lexer lex(src);
  auto toks = lex.tokenize_all();
  Parser p(toks);
  auto prog = p.parse_program();
  REQUIRE(!p.error().has_value());

  Evaluator ev;
  ev.set_trace(&tr);

  bool ok = ev.exec_program(prog);
  REQUIRE(ok);

  std::string s = oss.str();
  REQUIRE(s.find("\"type\":\"VarDeclare\"") != std::string::npos);
  REQUIRE(s.find("\"type\":\"VarRead\"") != std::string::npos);
  REQUIRE(s.find("\"type\":\"VarWrite\"") != std::string::npos);
  REQUIRE(s.find("\"type\":\"Print\"") != std::string::npos);
  REQUIRE(s.find("\"text\":\"3\"") != std::string::npos);
}
