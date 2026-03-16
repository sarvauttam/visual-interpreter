#pragma once
#include <memory>
#include <string>
#include <vector>
#include <cstdint>
#include "common/loc.h"

struct Expr {
  Loc loc{1,1};
  virtual ~Expr() = default;
};

struct Stmt {
  Loc loc{1,1};
  virtual ~Stmt() = default;
};

struct IntExpr : Expr {
  int64_t value;
  explicit IntExpr(int64_t v) : value(v) {}
};

struct BoolExpr : Expr {
  bool value;
  explicit BoolExpr(bool v) : value(v) {}
};

struct StringExpr : Expr {
  std::string value; // literal only (print support)
  explicit StringExpr(std::string v) : value(std::move(v)) {}
};

struct VarExpr : Expr {
  std::string name;
  explicit VarExpr(std::string n) : name(std::move(n)) {}
};

struct UnaryExpr : Expr {
  std::string op; // "!" or "-"
  std::unique_ptr<Expr> operand;
  UnaryExpr(std::string o, std::unique_ptr<Expr> e)
    : op(std::move(o)), operand(std::move(e)) {}
};

struct BinaryExpr : Expr {
  std::string op; // "+", "-", "*", "==", "&&", etc.
  std::unique_ptr<Expr> left;
  std::unique_ptr<Expr> right;
  BinaryExpr(std::string o,
             std::unique_ptr<Expr> l,
             std::unique_ptr<Expr> r)
    : op(std::move(o)), left(std::move(l)), right(std::move(r)) {}
};

// IMPORTANT: Only Identifier(args) allowed — no call chaining
struct CallExpr : Expr {
  std::string callee; // identifier only
  std::vector<std::unique_ptr<Expr>> args;
  CallExpr(std::string c,
           std::vector<std::unique_ptr<Expr>> a)
    : callee(std::move(c)), args(std::move(a)) {}
};

struct LetStmt : Stmt {
  std::string name;
  std::unique_ptr<Expr> initializer;
  LetStmt(std::string n, std::unique_ptr<Expr> e)
    : name(std::move(n)), initializer(std::move(e)) {}
};

struct AssignStmt : Stmt {
  std::string name;
  std::unique_ptr<Expr> value;
  AssignStmt(std::string n, std::unique_ptr<Expr> v)
    : name(std::move(n)), value(std::move(v)) {}
};

struct ExprStmt : Stmt {
  std::unique_ptr<Expr> expr;
  explicit ExprStmt(std::unique_ptr<Expr> e)
    : expr(std::move(e)) {}
};

struct PrintStmt : Stmt {
  std::vector<std::unique_ptr<Expr>> items;
  explicit PrintStmt(std::vector<std::unique_ptr<Expr>> i)
    : items(std::move(i)) {}
};

struct InputStmt : Stmt {
  std::string name;
  explicit InputStmt(std::string n)
    : name(std::move(n)) {}
};

struct IfStmt : Stmt {
  std::unique_ptr<Expr> condition;
  std::vector<std::unique_ptr<Stmt>> thenBranch;
  std::vector<std::unique_ptr<Stmt>> elseBranch;
};

struct WhileStmt : Stmt {
  std::unique_ptr<Expr> condition;
  std::vector<std::unique_ptr<Stmt>> body;
};

struct ReturnStmt : Stmt {
  std::unique_ptr<Expr> value; // may be null (return;)
};

struct FuncDecl : Stmt {
  std::string name;
  std::vector<std::string> params;
  std::vector<std::unique_ptr<Stmt>> body;
};

struct Program {
  std::vector<std::unique_ptr<Stmt>> statements;
};
