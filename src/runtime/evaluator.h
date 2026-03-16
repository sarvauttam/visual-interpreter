#pragma once
#include <vector>
#include <string>
#include <optional>
#include <unordered_map>
#include <ostream>
#include <iostream>

#include "ast/ast.h"
#include "runtime/env.h"
#include "trace/trace.h"
#include "common/loc.h"


class Evaluator {
public:
  Evaluator() = default;

  // Execute a whole program (top-level only for now).
  // Returns false on runtime error.
  bool exec_program(const Program& program);

  const std::optional<RuntimeError>& last_error() const { return err_; }

  void set_trace(TraceEmitter* t) { 
    trace_ = t; 
  }
  void set_output_stream(std::ostream* out) { 
    out_ = out; 
  }


private:
  Env global_;
  std::optional<RuntimeError> err_;
  std::ostream* out_ = &std::cout;

  // ---- statement execution ----
  bool exec_stmt(const Stmt* s);

  bool exec_let(const LetStmt* s);
  bool exec_assign(const AssignStmt* s);
  bool exec_exprstmt(const ExprStmt* s);
  bool exec_print(const PrintStmt* s);

  // ---- expression evaluation ----
  bool eval_expr(const Expr* e, Value& out);

  bool eval_unary(const UnaryExpr* e, Value& out);
  bool eval_binary(const BinaryExpr* e, Value& out);
  bool exec_if(const IfStmt* s);
  bool exec_while(const WhileStmt* s);

  std::unordered_map<std::string, const FuncDecl*> functions_;

  bool exec_func_decl(const FuncDecl* f); // registers function

  // Call support
  bool call_function(const CallExpr* c, Value& out);

  // helpers
  void set_error(RuntimeErrorCode code, const std::string& msg);

  Env* frame_ = nullptr; // nullptr means "no function frame"
    // Variable resolution: frame first, then global.
  bool get_var(const std::string& name, Value& out);
  bool assign_var(const std::string& name, const Value& v);
  bool declare_var(const std::string& name, const Value& v);

  bool returning_ = false;
  Value return_value_ = Value::make_int(0);

  bool exec_return(const ReturnStmt* s);

  TraceEmitter* trace_ = nullptr;
  FrameInfo current_frame_{"<global>", 0};

  void emit_simple(const std::string& type, Loc loc);
  void emit_error_event(const std::string& code, const std::string& message, Loc loc);

  Loc current_loc_{1,1};





};
