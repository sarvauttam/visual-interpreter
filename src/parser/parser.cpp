#include "parser/parser.h"
#include <utility>
#include <memory>
#include <initializer_list>

Parser::Parser(std::vector<Token> tokens) : toks_(std::move(tokens)) {}

const Token& Parser::peek() const {
  if (pos_ >= toks_.size()) return toks_.back();
  return toks_[pos_];
}

const Token& Parser::prev() const {
  if (pos_ == 0) return toks_[0];
  return toks_[pos_ - 1];
}

bool Parser::at_end() const {
  return peek().kind == TokenKind::End;
}

bool Parser::check(TokenKind k) const {
  if (at_end()) return false;
  return peek().kind == k;
}

bool Parser::match(TokenKind k) {
  if (check(k)) {
    ++pos_;
    return true;
  }
  return false;
}

bool Parser::match_any(std::initializer_list<TokenKind> kinds) {
  for (auto k : kinds) {
    if (check(k)) { ++pos_; return true; }
  }
  return false;
}

bool Parser::expect(TokenKind k, const char* msg) {
  if (match(k)) return true;
  set_error(msg, peek().loc);
  return false;
}

void Parser::set_error(const std::string& msg, Loc loc) {
  if (!error_) error_ = ParseError{msg, loc};
}

Program Parser::parse_program() {
  Program p;

  while (!at_end() && !error_) {
    if (match(TokenKind::KwFunc)) {
      auto fn = parse_func_decl();
      if (!fn) break;
      p.statements.push_back(std::move(fn));
      continue;
    }

    auto s = parse_stmt();
    if (!s) break;
    p.statements.push_back(std::move(s));
  }

  return p;
}

std::string Parser::op_lexeme(TokenKind k) {
  switch (k) {
    case TokenKind::OrOr: return "||";
    case TokenKind::AndAnd: return "&&";
    case TokenKind::EqualEqual: return "==";
    case TokenKind::BangEqual: return "!=";
    case TokenKind::Less: return "<";
    case TokenKind::LessEqual: return "<=";
    case TokenKind::Greater: return ">";
    case TokenKind::GreaterEqual: return ">=";
    case TokenKind::Plus: return "+";
    case TokenKind::Minus: return "-";
    case TokenKind::Star: return "*";
    case TokenKind::Slash: return "/";
    case TokenKind::Percent: return "%";
    default: return "?";
  }
}

std::unique_ptr<Expr> Parser::parse_expr() {
  return parse_or();
}

std::unique_ptr<Expr> Parser::parse_left_assoc(
    std::unique_ptr<Expr>(Parser::*next)(),
    std::initializer_list<TokenKind> ops) {

  auto left = (this->*next)();
  if (!left) return nullptr;

  while (!at_end() && error_ == std::nullopt) {
    TokenKind op_kind = peek().kind;

    bool is_op = false;
    for (auto k : ops) if (op_kind == k) { is_op = true; break; }
    if (!is_op) break;

    ++pos_; // consume operator
    Token opTok = prev();

    auto right = (this->*next)();
    if (!right) return nullptr;

    auto bin = std::make_unique<BinaryExpr>(op_lexeme(op_kind), std::move(left), std::move(right));
    bin->loc = opTok.loc;
    left = std::move(bin);
  }
  return left;
}

std::unique_ptr<Expr> Parser::parse_or() {
  return parse_left_assoc(&Parser::parse_and, {TokenKind::OrOr});
}

std::unique_ptr<Expr> Parser::parse_and() {
  return parse_left_assoc(&Parser::parse_equality, {TokenKind::AndAnd});
}

std::unique_ptr<Expr> Parser::parse_equality() {
  return parse_left_assoc(&Parser::parse_relational, {TokenKind::EqualEqual, TokenKind::BangEqual});
}

std::unique_ptr<Expr> Parser::parse_relational() {
  return parse_left_assoc(&Parser::parse_add, {TokenKind::Less, TokenKind::LessEqual, TokenKind::Greater, TokenKind::GreaterEqual});
}

std::unique_ptr<Expr> Parser::parse_add() {
  return parse_left_assoc(&Parser::parse_mul, {TokenKind::Plus, TokenKind::Minus});
}

std::unique_ptr<Expr> Parser::parse_mul() {
  return parse_left_assoc(&Parser::parse_unary, {TokenKind::Star, TokenKind::Slash, TokenKind::Percent});
}

std::unique_ptr<Expr> Parser::parse_unary() {
  if (match(TokenKind::Bang)) {
    Token opTok = prev();
    auto rhs = parse_unary();
    if (!rhs) return nullptr;
    auto u = std::make_unique<UnaryExpr>("!", std::move(rhs));
    u->loc = opTok.loc;
    return u;
  }

  if (match(TokenKind::Minus)) {
    Token opTok = prev();
    auto rhs = parse_unary();
    if (!rhs) return nullptr;
    auto u = std::make_unique<UnaryExpr>("-", std::move(rhs));
    u->loc = opTok.loc;
    return u;
  }

  return parse_primary();
}

std::unique_ptr<Expr> Parser::parse_primary() {
  if (match(TokenKind::IntLiteral)) {
    const auto& t = prev();
    int64_t v = 0;
    try { v = std::stoll(t.lexeme); }
    catch (...) { set_error("Invalid integer literal", t.loc); return nullptr; }

    auto n = std::make_unique<IntExpr>(v);
    n->loc = t.loc;
    return n;
  }

  if (match(TokenKind::KwTrue)) {
    Token t = prev();
    auto n = std::make_unique<BoolExpr>(true);
    n->loc = t.loc;
    return n;
  }

  if (match(TokenKind::KwFalse)) {
    Token t = prev();
    auto n = std::make_unique<BoolExpr>(false);
    n->loc = t.loc;
    return n;
  }

  if (match(TokenKind::StringLiteral)) {
    Token t = prev();
    auto n = std::make_unique<StringExpr>(t.lexeme);
    n->loc = t.loc;
    return n;
  }

  // Identifier or CallExpr (single call, no chaining)
  if (match(TokenKind::Identifier)) {
    Token idTok = prev();
    std::string name = idTok.lexeme;

    if (match(TokenKind::LParen)) {
      std::vector<std::unique_ptr<Expr>> args;
      if (!check(TokenKind::RParen)) {
        while (true) {
          auto a = parse_expr();
          if (!a) return nullptr;
          args.push_back(std::move(a));
          if (match(TokenKind::Comma)) continue;
          break;
        }
      }
      if (!expect(TokenKind::RParen, "Expected ')' after call arguments")) return nullptr;

      auto c = std::make_unique<CallExpr>(std::move(name), std::move(args));
      c->loc = idTok.loc;
      return c;
    }

    auto v = std::make_unique<VarExpr>(std::move(name));
    v->loc = idTok.loc;
    return v;
  }

  if (match(TokenKind::LParen)) {
    auto e = parse_expr();
    if (!e) return nullptr;
    if (!expect(TokenKind::RParen, "Expected ')'")) return nullptr;
    return e;
  }

  set_error("Expected expression", peek().loc);
  return nullptr;
}

std::unique_ptr<Expr> Parser::parse_expression_for_test() {
  auto e = parse_expr();
  if (!e) return nullptr;

  if (!at_end()) {
    set_error("Expected end of input after expression", peek().loc);
    return nullptr;
  }
  return e;
}

std::unique_ptr<Stmt> Parser::parse_statement_for_test() {
  auto s = parse_stmt();
  if (!s) return nullptr;

  if (!at_end()) {
    set_error("Expected end of input after statement", peek().loc);
    return nullptr;
  }
  return s;
}

/* =========================
   3.2 Fix statement node locations
   ========================= */

std::unique_ptr<Stmt> Parser::parse_stmt() {
  // Disallow nested functions: only top-level allowed
  if (check(TokenKind::KwFunc)) {
    set_error("Functions are only allowed at top-level", peek().loc);
    return nullptr;
  }

  if (match(TokenKind::KwLet)) return parse_let_stmt();
  if (match(TokenKind::KwPrint)) return parse_print_stmt();
  if (match(TokenKind::KwInput)) return parse_input_stmt();
  if (match(TokenKind::KwIf)) return parse_if_stmt();
  if (match(TokenKind::KwWhile)) return parse_while_stmt();
  if (match(TokenKind::KwReturn)) return parse_return_stmt();
  return parse_assign_or_expr_stmt();
}


std::unique_ptr<Stmt> Parser::parse_return_stmt() {
  Token retTok = prev(); // 'return'

  std::unique_ptr<Expr> value = nullptr;
  if (!check(TokenKind::Semicolon)) {
    value = parse_expr();
    if (!value) return nullptr;
  }

  if (!expect(TokenKind::Semicolon, "Expected ';' after return")) return nullptr;

  auto r = std::make_unique<ReturnStmt>();
  r->value = std::move(value);
  r->loc = retTok.loc;
  return r;
}

std::vector<std::string> Parser::parse_param_list() {
  std::vector<std::string> params;
  if (check(TokenKind::RParen)) return params;

  while (true) {
    if (!expect(TokenKind::Identifier, "Expected parameter name")) return params;
    params.push_back(prev().lexeme);
    if (match(TokenKind::Comma)) continue;
    break;
  }
  return params;
}

std::unique_ptr<Stmt> Parser::parse_func_decl() {
  Token funcTok = prev(); // 'func'

  if (!expect(TokenKind::Identifier, "Expected function name after 'func'")) return nullptr;
  std::string name = prev().lexeme;

  if (!expect(TokenKind::LParen, "Expected '(' after function name")) return nullptr;
  auto params = parse_param_list();
  if (error_) return nullptr;
  if (!expect(TokenKind::RParen, "Expected ')' after parameter list")) return nullptr;

  auto body = parse_block();
  if (error_) return nullptr;

  auto f = std::make_unique<FuncDecl>();
  f->name = std::move(name);
  f->params = std::move(params);
  f->body = std::move(body);
  f->loc = funcTok.loc;
  return f;
}

std::unique_ptr<Stmt> Parser::parse_let_stmt() {
  Token letTok = prev(); // 'let'

  if (!expect(TokenKind::Identifier, "Expected identifier after 'let'")) return nullptr;
  std::string name = prev().lexeme;

  if (!expect(TokenKind::Assign, "Expected '=' after variable name")) return nullptr;

  auto init = parse_expr();
  if (!init) return nullptr;

  if (!expect(TokenKind::Semicolon, "Expected ';' after let statement")) return nullptr;

  auto n = std::make_unique<LetStmt>(std::move(name), std::move(init));
  n->loc = letTok.loc;
  return n;
}

std::unique_ptr<Stmt> Parser::parse_assign_or_expr_stmt() {
  // assignment: Identifier '=' expr ';'
  // expr-stmt: expr ';'

  if (check(TokenKind::Identifier)) {
    if (pos_ + 1 < toks_.size() && toks_[pos_ + 1].kind == TokenKind::Assign) {
      match(TokenKind::Identifier);
      Token idTok = prev();
      std::string name = idTok.lexeme;

      match(TokenKind::Assign);

      auto val = parse_expr();
      if (!val) return nullptr;

      if (!expect(TokenKind::Semicolon, "Expected ';' after assignment")) return nullptr;

      auto n = std::make_unique<AssignStmt>(std::move(name), std::move(val));
      n->loc = idTok.loc;
      return n;
    }
  }

  auto e = parse_expr();
  if (!e) return nullptr;
  if (!expect(TokenKind::Semicolon, "Expected ';' after expression")) return nullptr;

  auto n = std::make_unique<ExprStmt>(std::move(e));
  n->loc = n->expr->loc;
  return n;
}

std::unique_ptr<Stmt> Parser::parse_print_stmt() {
  Token printTok = prev(); // 'print'

  if (!expect(TokenKind::LParen, "Expected '(' after 'print'")) return nullptr;

  std::vector<std::unique_ptr<Expr>> items;
  if (!check(TokenKind::RParen)) {
    while (true) {
      auto e = parse_expr();
      if (!e) return nullptr;
      items.push_back(std::move(e));
      if (match(TokenKind::Comma)) continue;
      break;
    }
  }

  if (!expect(TokenKind::RParen, "Expected ')' after print arguments")) return nullptr;
  if (!expect(TokenKind::Semicolon, "Expected ';' after print statement")) return nullptr;

  auto n = std::make_unique<PrintStmt>(std::move(items));
  n->loc = printTok.loc;
  return n;
}

std::unique_ptr<Stmt> Parser::parse_input_stmt() {
  Token inputTok = prev(); // 'input'

  if (!expect(TokenKind::LParen, "Expected '(' after 'input'")) return nullptr;
  if (!expect(TokenKind::Identifier, "Expected identifier inside input(...)")) return nullptr;
  std::string name = prev().lexeme;
  if (!expect(TokenKind::RParen, "Expected ')' after input identifier")) return nullptr;
  if (!expect(TokenKind::Semicolon, "Expected ';' after input statement")) return nullptr;

  auto n = std::make_unique<InputStmt>(std::move(name));
  n->loc = inputTok.loc;
  return n;
}

std::vector<std::unique_ptr<Stmt>> Parser::parse_block() {
  std::vector<std::unique_ptr<Stmt>> out;

  if (!expect(TokenKind::LBrace, "Expected '{' to start block")) return out;

  while (!at_end() && !check(TokenKind::RBrace) && !error_) {
    auto s = parse_stmt();
    if (!s) break;
    out.push_back(std::move(s));
  }

  expect(TokenKind::RBrace, "Expected '}' to end block");
  return out;
}

std::unique_ptr<Stmt> Parser::parse_if_stmt() {
  Token ifTok = prev(); // 'if'

  if (!expect(TokenKind::LParen, "Expected '(' after 'if'")) return nullptr;
  auto cond = parse_expr();
  if (!cond) return nullptr;
  if (!expect(TokenKind::RParen, "Expected ')' after if condition")) return nullptr;

  auto thenBlock = parse_block();
  if (error_) return nullptr;

  std::vector<std::unique_ptr<Stmt>> elseBlock;
  if (match(TokenKind::KwElse)) {
    elseBlock = parse_block();
    if (error_) return nullptr;
  }

  auto node = std::make_unique<IfStmt>();
  node->condition = std::move(cond);
  node->thenBranch = std::move(thenBlock);
  node->elseBranch = std::move(elseBlock);
  node->loc = ifTok.loc;
  return node;
}

std::unique_ptr<Stmt> Parser::parse_while_stmt() {
  Token whileTok = prev(); // 'while'

  if (!expect(TokenKind::LParen, "Expected '(' after 'while'")) return nullptr;
  auto cond = parse_expr();
  if (!cond) return nullptr;
  if (!expect(TokenKind::RParen, "Expected ')' after while condition")) return nullptr;

  auto body = parse_block();
  if (error_) return nullptr;

  auto node = std::make_unique<WhileStmt>();
  node->condition = std::move(cond);
  node->body = std::move(body);
  node->loc = whileTok.loc;
  return node;
}
