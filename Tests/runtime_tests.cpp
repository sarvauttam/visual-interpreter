#include "test_main.h"
#include <string>
#include "lexer/lexer.h"
#include "parser/parser.h"
#include "runtime/evaluator.h"

static bool run_program(const std::string& src, std::string& outErr) {
  Lexer lex(src);
  auto toks = lex.tokenize_all();
  if (toks.size() > 0 && toks[0].kind == TokenKind::Invalid) {
    outErr = "LexError";
    return false;
  }

  Parser p(toks);
  auto prog = p.parse_program();
  if (p.error()) {
    outErr = "ParseError";
    return false;
  }

  Evaluator ev;
  if (!ev.exec_program(prog)) {
    if (ev.last_error()) outErr = ev.last_error()->message;
    else outErr = "RuntimeError";
    return false;
  }
  outErr.clear();
  return true;
}

TEST(rt_arith_and_assign_ok) {
  std::string err;
  bool ok = run_program(
    "let x = 1;"
    "let y = 2;"
    "x = x + y*3;"
    "print(x);",
    err
  );
  REQUIRE(ok);
}

TEST(rt_redeclare_fails) {
  std::string err;
  bool ok = run_program("let x=1; let x=2;", err);
  REQUIRE(!ok);
  REQUIRE(err.find("RedeclareVariable") != std::string::npos);
}

TEST(rt_assign_undefined_fails) {
  std::string err;
  bool ok = run_program("x=1;", err);
  REQUIRE(!ok);
  REQUIRE(err.find("AssignToUndefined") != std::string::npos);
}

TEST(rt_undefined_read_fails) {
  std::string err;
  bool ok = run_program("print(y);", err);
  REQUIRE(!ok);
  REQUIRE(err.find("UndefinedVariable") != std::string::npos);
}

TEST(rt_divide_by_zero_fails) {
  std::string err;
  bool ok = run_program("let x = 1/0;", err);
  REQUIRE(!ok);
  REQUIRE(err.find("DivideByZero") != std::string::npos);
}
TEST(rt_if_else_executes_correct_branch) {
  std::string err;
  bool ok = run_program(
    "let x = 0;"
    "if (true) { x = 5; } else { x = 9; }"
    "print(x);",
    err
  );
  REQUIRE(ok);
}

TEST(rt_while_loops_until_false) {
  std::string err;
  bool ok = run_program(
    "let x = 0;"
    "while (x < 3) { x = x + 1; }"
    "print(x);",
    err
  );
  REQUIRE(ok);
}

TEST(rt_call_unknown_function_fails) {
  std::string err;
  bool ok = run_program("print(nope(1));", err);
  REQUIRE(!ok);
  REQUIRE(err.find("UnknownFunction") != std::string::npos);
}

TEST(rt_call_arity_mismatch_fails) {
  std::string err;
  bool ok = run_program(
    "func f(a,b){ return a+b; }"
    "print(f(1));",
    err
  );
  REQUIRE(!ok);
  REQUIRE(err.find("ArityMismatch") != std::string::npos);
}

TEST(rt_param_shadows_global) {
  std::string err;
  bool ok = run_program(
    "let a = 100;"
    "func f(a){ return a+1; }"
    "print(f(1));"
    "print(a);",
    err
  );
  REQUIRE(ok);
}
