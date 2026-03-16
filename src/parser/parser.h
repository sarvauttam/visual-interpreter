#pragma once
#include <string>
#include <vector>
#include <optional>
#include <memory>

#include "lexer/token.h"
#include "ast/ast.h"

struct ParseError {
  std::string message;
  Loc loc;
};

class Parser {
public:
  explicit Parser(std::vector<Token> tokens);

  // Parse whole program.
  // On failure: returns empty Program with error() set.
  Program parse_program();

    // Test hook: parse a single expression from the token stream.
  // Consumes tokens for the expression and expects End afterwards.
  std::unique_ptr<Expr> parse_expression_for_test();

    // Test hook: parse a single statement and expect End afterwards.
  std::unique_ptr<Stmt> parse_statement_for_test();

  const std::optional<ParseError>& error() const { return error_; }

private:
  std::vector<Token> toks_;
  size_t pos_ = 0;
  std::optional<ParseError> error_;

  // ---- Token helpers ----
  const Token& peek() const;
  const Token& prev() const;
  bool at_end() const;

  bool check(TokenKind k) const;
  bool match(TokenKind k);
  bool match_any(std::initializer_list<TokenKind> kinds);

  // Consume expected token or set error.
  bool expect(TokenKind k, const char* msg);

  // Sync after error (optional, but helps later)
  void set_error(const std::string& msg, Loc loc);

    // ---- Expressions (Step 3C) ----
  std::unique_ptr<Expr> parse_expr();

  std::unique_ptr<Expr> parse_or();
  std::unique_ptr<Expr> parse_and();
  std::unique_ptr<Expr> parse_equality();
  std::unique_ptr<Expr> parse_relational();
  std::unique_ptr<Expr> parse_add();
  std::unique_ptr<Expr> parse_mul();
  std::unique_ptr<Expr> parse_unary();
  std::unique_ptr<Expr> parse_primary();

  // utility for binary chains
  std::unique_ptr<Expr> parse_left_assoc(
  std::unique_ptr<Expr>(Parser::*next)(),
  std::initializer_list<TokenKind> ops);

  static std::string op_lexeme(TokenKind k);

    // ---- Statements (Step 3D) ----
  std::unique_ptr<Stmt> parse_stmt();
  std::unique_ptr<Stmt> parse_let_stmt();
  std::unique_ptr<Stmt> parse_assign_or_expr_stmt();

  std::unique_ptr<Stmt> parse_print_stmt();
  std::unique_ptr<Stmt> parse_input_stmt();

    std::unique_ptr<Stmt> parse_if_stmt();
  std::unique_ptr<Stmt> parse_while_stmt();

  // Parses a block: '{' { stmt } '}'
  std::vector<std::unique_ptr<Stmt>> parse_block();

    std::unique_ptr<Stmt> parse_return_stmt();
  std::unique_ptr<Stmt> parse_func_decl();

  std::vector<std::string> parse_param_list();
  
};
