#include "test_main.h"
#include <algorithm>
#include <string>
#include "lexer/lexer.h"
#include "parser/parser.h"
#include "ast/ast.h"

static std::unique_ptr<Expr> parse_expr_ok(const std::string& src) {
  Lexer lex(src);
  auto toks = lex.tokenize_all();
  Parser p(toks);
  auto e = p.parse_expression_for_test();

  if (!e) {
    std::cerr << "  FAIL: parse_expr_ok got null for: " << src << "\n";
    ++g_failures;
    return nullptr;
  }
  if (p.error().has_value()) {
    std::cerr << "  FAIL: parse_expr_ok parse error for: " << src << "\n";
    std::cerr << "        at " << p.error()->loc.line << ":" << p.error()->loc.col
              << " " << p.error()->message << "\n";
    ++g_failures;
    return nullptr;
  }
  return e;
}


static const BinaryExpr* as_bin(const std::unique_ptr<Expr>& e) {
  return dynamic_cast<const BinaryExpr*>(e.get());
}
static const UnaryExpr* as_un(const std::unique_ptr<Expr>& e) {
  return dynamic_cast<const UnaryExpr*>(e.get());
}
static const IntExpr* as_int(const std::unique_ptr<Expr>& e) {
  return dynamic_cast<const IntExpr*>(e.get());
}
static const VarExpr* as_var(const std::unique_ptr<Expr>& e) {
  return dynamic_cast<const VarExpr*>(e.get());
}
static const CallExpr* as_call(const std::unique_ptr<Expr>& e) {
  return dynamic_cast<const CallExpr*>(e.get());
}

TEST(test_precedence_mul_over_add) {
  auto e = parse_expr_ok("1 + 2 * 3");
  auto top = as_bin(e);
  REQUIRE(e != nullptr);
  REQUIRE(top && top->op == "+");

  REQUIRE(as_int(top->left) && as_int(top->left)->value == 1);

  auto right = as_bin(top->right);
  REQUIRE(right && right->op == "*");
  REQUIRE(as_int(right->left) && as_int(right->left)->value == 2);
  REQUIRE(as_int(right->right) && as_int(right->right)->value == 3);
}

TEST(test_parentheses_override) {
  auto e = parse_expr_ok("(1 + 2) * 3");
  REQUIRE(e != nullptr);
  auto top = as_bin(e);
  REQUIRE(top && top->op == "*");

  auto left = as_bin(top->left);
  REQUIRE(left && left->op == "+");
  REQUIRE(as_int(left->left) && as_int(left->left)->value == 1);
  REQUIRE(as_int(left->right) && as_int(left->right)->value == 2);

  REQUIRE(as_int(top->right) && as_int(top->right)->value == 3);
}

TEST(test_unary_binds_tight) {
  auto e = parse_expr_ok("-1 * 2");
  REQUIRE(e != nullptr);
  auto top = as_bin(e);
  REQUIRE(top && top->op == "*");

  auto left = as_un(top->left);
  REQUIRE(left && left->op == "-");
  REQUIRE(as_int(left->operand) && as_int(left->operand)->value == 1);

  REQUIRE(as_int(top->right) && as_int(top->right)->value == 2);
}

TEST(test_call_expr_single_level) {
  auto e = parse_expr_ok("f(1, x)");
  REQUIRE(e != nullptr);
  auto c = as_call(e);
  REQUIRE(c != nullptr);
  REQUIRE(c->callee == "f");
  REQUIRE(c->args.size() == 2);
}

TEST(test_identifier_not_call) {
  auto e = parse_expr_ok("x");
  REQUIRE(e != nullptr);
  auto v = as_var(e);
  REQUIRE(v != nullptr);
  REQUIRE(v->name == "x");
}

static std::unique_ptr<Stmt> parse_stmt_ok(const std::string& src) {
  Lexer lex(src);
  auto toks = lex.tokenize_all();
  Parser p(toks);
  auto s = p.parse_statement_for_test();

  if (!s) {
    std::cerr << "  FAIL: parse_stmt_ok got null for: " << src << "\n";
    ++g_failures;
    return nullptr;
  }
  if (p.error().has_value()) {
    std::cerr << "  FAIL: parse_stmt_ok parse error for: " << src << "\n";
    std::cerr << "        at " << p.error()->loc.line << ":" << p.error()->loc.col
              << " " << p.error()->message << "\n";
    ++g_failures;
    return nullptr;
  }
  return s;
}

static const LetStmt* as_let(const std::unique_ptr<Stmt>& s) {
  return dynamic_cast<const LetStmt*>(s.get());
}
static const AssignStmt* as_assign(const std::unique_ptr<Stmt>& s) {
  return dynamic_cast<const AssignStmt*>(s.get());
}
static const ExprStmt* as_exprstmt(const std::unique_ptr<Stmt>& s) {
  return dynamic_cast<const ExprStmt*>(s.get());
}

TEST(test_let_stmt) {
  auto s = parse_stmt_ok("let x = 1 + 2*3;");
  REQUIRE(s != nullptr);
  auto l = as_let(s);
  REQUIRE(l != nullptr);
  REQUIRE(l->name == "x");
}

TEST(test_assign_stmt) {
  auto s = parse_stmt_ok("x = 42;");
  REQUIRE(s != nullptr);
  auto a = as_assign(s);
  REQUIRE(a != nullptr);
  REQUIRE(a->name == "x");
}

TEST(test_expr_stmt_call) {
  auto s = parse_stmt_ok("f(1,2);");
  REQUIRE(s != nullptr);
  auto es = as_exprstmt(s);
  REQUIRE(es != nullptr);
  REQUIRE(as_call(es->expr) != nullptr);
}

TEST(test_print_stmt) {
  auto s = parse_stmt_ok("print(1, x, true);");
  REQUIRE(s != nullptr);
  auto p = dynamic_cast<const PrintStmt*>(s.get());
  REQUIRE(p != nullptr);
  REQUIRE(p->items.size() == 3);
}

TEST(test_input_stmt) {
  auto s = parse_stmt_ok("input(x);");
  REQUIRE(s != nullptr);
  auto in = dynamic_cast<const InputStmt*>(s.get());
  REQUIRE(in != nullptr);
  REQUIRE(in->name == "x");
}

TEST(test_if_else_stmt) {
  auto s = parse_stmt_ok("if (true) { let x = 1; } else { x = 2; }");
  REQUIRE(s != nullptr);
  auto n = dynamic_cast<const IfStmt*>(s.get());
  REQUIRE(n != nullptr);
  REQUIRE(n->thenBranch.size() == 1);
  REQUIRE(n->elseBranch.size() == 1);
}

TEST(test_while_stmt) {
  auto s = parse_stmt_ok("while (x < 10) { x = x + 1; }");
  REQUIRE(s != nullptr);
  auto n = dynamic_cast<const WhileStmt*>(s.get());
  REQUIRE(n != nullptr);
  REQUIRE(n->body.size() == 1);
}

TEST(test_return_stmt_empty) {
  auto s = parse_stmt_ok("return;");
  REQUIRE(s != nullptr);
  auto r = dynamic_cast<const ReturnStmt*>(s.get());
  REQUIRE(r != nullptr);
  REQUIRE(r->value == nullptr);
}

TEST(test_return_stmt_value) {
  auto s = parse_stmt_ok("return 123;");
  REQUIRE(s != nullptr);
  auto r = dynamic_cast<const ReturnStmt*>(s.get());
  REQUIRE(r != nullptr);
  REQUIRE(r->value != nullptr);
}

TEST(test_func_decl_top_level) {
  Lexer lex("func add(a,b){ return a+b; }");
  auto toks = lex.tokenize_all();
  Parser p(toks);
  auto prog = p.parse_program();
  REQUIRE(!p.error().has_value());
  REQUIRE(prog.statements.size() == 1);
  auto f = dynamic_cast<const FuncDecl*>(prog.statements[0].get());
  REQUIRE(f != nullptr);
  REQUIRE(f->name == "add");
  REQUIRE(f->params.size() == 2);
  REQUIRE(f->body.size() == 1);
}

TEST(test_func_not_allowed_in_block) {
  Lexer lex("if(true){ func x(){ return; } }");
  auto toks = lex.tokenize_all();
  Parser p(toks);
  auto prog = p.parse_program();
  REQUIRE(p.error().has_value()); // should fail because 'func' appears in block
}
