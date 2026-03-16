#include "runtime/evaluator.h"
#include <iostream>
#include <stdexcept>

void Evaluator::set_error(RuntimeErrorCode code, const std::string& msg) {
  if (!err_) err_ = RuntimeError{code, msg};
}

void Evaluator::emit_simple(const std::string& type, Loc loc) {
  if (trace_ && trace_->enabled()) trace_->emit_event(type, loc, current_frame_);
}

void Evaluator::emit_error_event(const std::string& code, const std::string& message, Loc loc) {
  if (trace_ && trace_->enabled()) trace_->emit_error(code, message, loc, current_frame_);
}

bool Evaluator::declare_var(const std::string& name, const Value& v) {
  RuntimeError e{};
  if (frame_) {
    if (!frame_->declare(name, v, e)) { set_error(e.code, e.message); return false; }
    if (trace_ && trace_->enabled()) {
      auto ev = trace_->begin("VarDeclare", current_loc_, current_frame_);
      ev.field_string("name", name);
      ev.field_string("value", v.to_string());
      ev.end();
    }
    return true;
  }
  if (!global_.declare(name, v, e)) { set_error(e.code, e.message); return false; }
  if (trace_ && trace_->enabled()) {
    auto ev = trace_->begin("VarDeclare", current_loc_, current_frame_);
    ev.field_string("name", name);
    ev.field_string("value", v.to_string());
    ev.end();
  }
  return true;
}

bool Evaluator::assign_var(const std::string& name, const Value& v) {
  RuntimeError e{};
  Value oldv;
    bool had_old = false;

    // Read old value (frame wins, else global)
    if (frame_ && frame_->contains_local(name)) {
      RuntimeError e2{};
      if (!frame_->get_local(name, oldv, e2)) { set_error(e2.code, e2.message); return false; }
      had_old = true;
    } else if (global_.contains_local(name)) {
      RuntimeError e2{};
      if (!global_.get_local(name, oldv, e2)) { set_error(e2.code, e2.message); return false; }
      had_old = true;
    }

  
  // // If name exists in frame, assign there
  // if (frame_ && frame_->contains_local(name)) {
  //   if (!frame_->assign_local(name, v, e)) { set_error(e.code, e.message); return false; }
  //     if (trace_ && trace_->enabled() && had_old) {
  //     auto ev = trace_->begin("VarWrite", current_loc_, current_frame_);
  //     ev.field_string("name", name);
  //     ev.field_string("old", oldv.to_string());
  //     ev.field_string("new", v.to_string());
  //     ev.end();
  //   }
  //   return true;
  // }

  // Otherwise assign in global if exists
  if (global_.contains_local(name)) {
    if (!global_.assign_local(name, v, e)) { set_error(e.code, e.message); return false; }
    if (trace_ && trace_->enabled()) {
     //TRACE: VarWrite with old/new (T02)
      if (trace_ && trace_->enabled()) {
        auto ev = trace_->begin("VarWrite", current_loc_, current_frame_);
        ev.field_string("name", name);
        ev.field_string("old", oldv.to_string());
        ev.field_string("new", v.to_string());
        ev.end();
      }
    }
    return true;
  }

  // Missing everywhere => AssignToUndefined
  e = {RuntimeErrorCode::AssignToUndefined, "AssignToUndefined: '" + name + "'"};
  set_error(e.code, e.message);
  return false;
}

bool Evaluator::get_var(const std::string& name, Value& out) {
  RuntimeError e{};

  // frame first
  if (frame_ && frame_->contains_local(name)) {
    if (!frame_->get_local(name, out, e)) { set_error(e.code, e.message); return false; }
    if (trace_ && trace_->enabled()) {
      auto ev = trace_->begin("VarRead", current_loc_, current_frame_);
      ev.field_string("name", name);
      ev.field_string("value", out.to_string());
      ev.end();
    }
    return true;
  }

  // then global
  if (!global_.get_local(name, out, e)) {
    set_error(e.code, e.message);
    return false;
  }
  if (trace_ && trace_->enabled()) {
    auto ev = trace_->begin("VarRead", current_loc_, current_frame_);
    ev.field_string("name", name);
    ev.field_string("value", out.to_string());
    ev.end();
  }
  return true;
}

bool Evaluator::exec_program(const Program& program) {
  err_.reset();
  emit_simple("ProgramStart", Loc{1,1});

  functions_.clear();
  returning_ = false;
  return_value_ = Value::make_int(0);

  // First pass: register functions
  for (const auto& st : program.statements) {
    if (auto f = dynamic_cast<const FuncDecl*>(st.get())) {
      if (!exec_func_decl(f)) {
        if (err_) emit_error_event("RuntimeError", err_->message, Loc{1,1});
        return false;
      }
    }
  }

  // Second pass: execute non-function statements
  for (const auto& st : program.statements) {
    if (dynamic_cast<const FuncDecl*>(st.get())) continue;

    emit_simple("StepStart", st->loc);
    bool ok = exec_stmt(st.get());
    emit_simple("StepEnd", st->loc);


    if (!ok) {
      if (err_) emit_error_event("RuntimeError", err_->message, Loc{1,1});
      return false;
    }
  }

  emit_simple("ProgramEnd", Loc{1,1});
  return true;
}

bool Evaluator::exec_stmt(const Stmt* s) {
    current_loc_ = s ? s->loc : Loc{1,1};
  if (returning_) return true; // stop executing more statements
  if (auto p = dynamic_cast<const ReturnStmt*>(s)) return exec_return(p);
  if (auto p = dynamic_cast<const LetStmt*>(s)) return exec_let(p);
  if (auto p = dynamic_cast<const AssignStmt*>(s)) return exec_assign(p);
  if (auto p = dynamic_cast<const ExprStmt*>(s)) return exec_exprstmt(p);
  if (auto p = dynamic_cast<const PrintStmt*>(s)) return exec_print(p);
  if (auto p = dynamic_cast<const IfStmt*>(s)) return exec_if(p);
  if (auto p = dynamic_cast<const WhileStmt*>(s)) return exec_while(p);

  // Not implemented yet (if/while/func/return/input)
  set_error(RuntimeErrorCode::UndefinedVariable, "Runtime: statement kind not implemented yet");
  return false;
}

bool Evaluator::exec_func_decl(const FuncDecl* f) {
  if (functions_.find(f->name) != functions_.end()) {
    set_error(RuntimeErrorCode::RedeclareVariable,
              "Function redeclared: '" + f->name + "'");
    return false;
  }
  functions_[f->name] = f;
  return true;
}

bool Evaluator::exec_if(const IfStmt* s) {
  current_loc_ = s->loc;

  Value cond;
  if (!eval_expr(s->condition.get(), cond)) return false;

  // TRACE: BranchDecision (always emitted)
  if (trace_ && trace_->enabled()) {
    auto ev = trace_->begin("BranchDecision", s->loc, current_frame_);
    ev.field_bool("cond", cond.truthy());
    ev.field_string("taken", cond.truthy() ? "then" : "else");
    ev.end();
  }

  const auto& branch = cond.truthy() ? s->thenBranch : s->elseBranch;
  for (const auto& st : branch) {
    if (!exec_stmt(st.get())) return false;
    if (returning_) break;
  }
  return true;
}


bool Evaluator::exec_while(const WhileStmt* s) {
  current_loc_ = s->loc;

  int64_t iter = 0;

  while (true) {
    Value cond;
    if (!eval_expr(s->condition.get(), cond)) return false;

    // TRACE: LoopCheck
    if (trace_ && trace_->enabled()) {
      auto ev = trace_->begin("LoopCheck", s->loc, current_frame_);
      ev.field_bool("cond", cond.truthy());
      ev.field_int("iter", iter);
      ev.end();
    }

    if (!cond.truthy()) {
      // TRACE: LoopExit
      if (trace_ && trace_->enabled()) {
        auto ev = trace_->begin("LoopExit", s->loc, current_frame_);
        ev.field_int("iters", iter);
        ev.end();
      }
      break;
    }

    // TRACE: LoopIterationStart
    if (trace_ && trace_->enabled()) {
      auto ev = trace_->begin("LoopIterationStart", s->loc, current_frame_);
      ev.field_int("iter", iter);
      ev.end();
    }

    for (const auto& st : s->body) {
      if (!exec_stmt(st.get())) return false;
      if (returning_) break;
    }
    if (returning_) break;

    ++iter;
  }

  return true;
}


bool Evaluator::exec_let(const LetStmt* s) {
  Value v;
  if (!eval_expr(s->initializer.get(), v)) return false;
  return declare_var(s->name, v);
}

bool Evaluator::exec_assign(const AssignStmt* s) {
  Value v;
  if (!eval_expr(s->value.get(), v)) return false;
  return assign_var(s->name, v);
}

bool Evaluator::exec_exprstmt(const ExprStmt* s) {
  Value v;
  return eval_expr(s->expr.get(), v);
}

bool Evaluator::exec_print(const PrintStmt* s) {
  std::string text;
  bool first = true;
  for (const auto& item : s->items) {
    Value v;
    if (!eval_expr(item.get(), v)) return false;
    if (!first) text += " ";
    text += v.to_string();
    first = false;
  }
  if (out_) {
      (*out_) << text << "\n";
  }
  if (trace_ && trace_->enabled()) {
    trace_->emit_print(text, current_loc_, current_frame_);
  }
  return true;
}

bool Evaluator::eval_expr(const Expr* e, Value& out) {
  if (auto p = dynamic_cast<const IntExpr*>(e)) { out = Value::make_int(p->value); return true; }
  if (auto p = dynamic_cast<const BoolExpr*>(e)) { out = Value::make_bool(p->value); return true; }
  if (auto p = dynamic_cast<const CallExpr*>(e)) { return call_function(p, out); }
  if (auto p = dynamic_cast<const VarExpr*>(e)) {
    Value v;
    if (!get_var(p->name, v)) return false;
    out = v;
    return true;
  }
  if (auto p = dynamic_cast<const UnaryExpr*>(e)) return eval_unary(p, out);
  if (auto p = dynamic_cast<const BinaryExpr*>(e)) return eval_binary(p, out);

  // Not implemented yet: CallExpr, StringExpr
  set_error(RuntimeErrorCode::UndefinedVariable, "Runtime: expression kind not implemented yet");
  return false;
}

bool Evaluator::eval_unary(const UnaryExpr* e, Value& out) {
  Value rhs;
  if (!eval_expr(e->operand.get(), rhs)) return false;

  if (e->op == "-") {
    if (!rhs.is_int()) {
      set_error(RuntimeErrorCode::UndefinedVariable, "TypeError: unary '-' expects int");
      return false;
    }
    out = Value::make_int(-rhs.i); // wrap is default on overflow in two's complement; acceptable assumption
    return true;
  }

  if (e->op == "!") {
    out = Value::make_bool(!rhs.truthy());
    return true;
  }

  set_error(RuntimeErrorCode::UndefinedVariable, "Unknown unary operator");
  return false;
}

bool Evaluator::eval_binary(const BinaryExpr* e, Value& out) {
  Value a, b;
  if (!eval_expr(e->left.get(), a)) return false;

  // Short-circuit for && and ||
  if (e->op == "&&") {
    if (!a.truthy()) {
      // TRACE: ShortCircuit (skipped RHS)
      if (trace_ && trace_->enabled()) {
        auto ev = trace_->begin("ShortCircuit", e->loc, current_frame_);
        ev.field_string("op", "&&");
        ev.field_string("reason", "lhs_false");
        ev.end();
      }
      out = Value::make_bool(false);
      return true;
    }
  }

  if (e->op == "||") {
    if (a.truthy()) {
      // TRACE: ShortCircuit (skipped RHS)
      if (trace_ && trace_->enabled()) {
        auto ev = trace_->begin("ShortCircuit", e->loc, current_frame_);
        ev.field_string("op", "||");
        ev.field_string("reason", "lhs_true");
        ev.end();
      }
      out = Value::make_bool(true);
      return true;
    }
  }

  if (!eval_expr(e->right.get(), b)) return false;

  auto require_ints = [&]() -> bool {
    if (!a.is_int() || !b.is_int()) {
      set_error(RuntimeErrorCode::UndefinedVariable, "TypeError: operator expects int operands");
      return false;
    }
    return true;
  };

  if (e->op == "+") { if (!require_ints()) return false; out = Value::make_int(a.i + b.i); return true; }
  if (e->op == "-") { if (!require_ints()) return false; out = Value::make_int(a.i - b.i); return true; }
  if (e->op == "*") { if (!require_ints()) return false; out = Value::make_int(a.i * b.i); return true; }

  if (e->op == "/") {
    if (!require_ints()) return false;
    if (b.i == 0) { set_error(RuntimeErrorCode::UndefinedVariable, "DivideByZero"); return false; }
    out = Value::make_int(a.i / b.i);
    return true;
  }

  if (e->op == "%") {
    if (!require_ints()) return false;
    if (b.i == 0) { set_error(RuntimeErrorCode::UndefinedVariable, "DivideByZero"); return false; }
    out = Value::make_int(a.i % b.i);
    return true;
  }

  // comparisons (ints)
  if (e->op == "<")  { if (!require_ints()) return false; out = Value::make_bool(a.i < b.i); return true; }
  if (e->op == "<=") { if (!require_ints()) return false; out = Value::make_bool(a.i <= b.i); return true; }
  if (e->op == ">")  { if (!require_ints()) return false; out = Value::make_bool(a.i > b.i); return true; }
  if (e->op == ">=") { if (!require_ints()) return false; out = Value::make_bool(a.i >= b.i); return true; }

  // equality (allow int/bool cross? We'll do strict by type for MVP.)
  if (e->op == "==") {
    if (a.type != b.type) { out = Value::make_bool(false); return true; }
    out = Value::make_bool(a.is_int() ? (a.i == b.i) : (a.b == b.b));
    return true;
  }
  if (e->op == "!=") {
    if (a.type != b.type) { out = Value::make_bool(true); return true; }
    out = Value::make_bool(a.is_int() ? (a.i != b.i) : (a.b != b.b));
    return true;
  }

  set_error(RuntimeErrorCode::UndefinedVariable, "Unknown binary operator: " + e->op);
  return false;
}

bool Evaluator::call_function(const CallExpr* c, Value& out) {
  if (trace_ && trace_->enabled()) {
  auto e = trace_->begin("CallStart", c->loc, current_frame_);
  e.field_string("callee", c->callee);
  e.field_int("argc", (int64_t)c->args.size());
  e.end();
}

  // 1) Lookup
  auto it = functions_.find(c->callee);
  if (it == functions_.end()) {
    set_error(RuntimeErrorCode::UndefinedVariable,
              "UnknownFunction: '" + c->callee + "'");
    return false;
  }
  const FuncDecl* f = it->second;

  // 2) Arity check
  if (c->args.size() != f->params.size()) {
    set_error(RuntimeErrorCode::UndefinedVariable,
              "ArityMismatch: '" + c->callee + "'");
    return false;
  }

  // 3) Evaluate arguments in CALLER context (frame unchanged)
  std::vector<Value> argVals;
  argVals.reserve(c->args.size());
  for (size_t i = 0; i < c->args.size(); ++i) {
  Value v;
  if (!eval_expr(c->args[i].get(), v)) return false;
  argVals.push_back(v);

  // TRACE: CallArg (caller frame, left-to-right)
  if (trace_ && trace_->enabled()) {
    auto ev = trace_->begin("CallArg", c->loc, current_frame_);
    ev.field_int("index", (int64_t)i);
    ev.field_string("value", v.to_string());
    ev.end();
  }
}

  // 4) Create local frame + bind parameters
  Env local;
  for (size_t i = 0; i < f->params.size(); ++i) {
    RuntimeError e{};
    if (!local.declare(f->params[i], argVals[i], e)) {
      set_error(e.code, e.message);
      return false;
    }
  }

  // 5) Activate frame for ENTIRE body execution
  Env* saved_frame = frame_;
  frame_ = &local;

  FrameInfo saved_trace_frame = current_frame_;
  current_frame_.name = c->callee;
  current_frame_.depth = saved_trace_frame.depth + 1;

    // TRACE: CallEnter (callee frame)
  if (trace_ && trace_->enabled()) {
    auto ev = trace_->begin("CallEnter", c->loc, current_frame_);
    ev.field_string("callee", c->callee);
    ev.end();
  }



  // 6) Save caller return state and reset for this call
  bool saved_returning = returning_;
  Value saved_return_value = return_value_;
  returning_ = false;
  return_value_ = Value::make_int(0);

  auto restore_all = [&]() {
    frame_ = saved_frame;
    returning_ = saved_returning;
    return_value_ = saved_return_value;
    current_frame_ = saved_trace_frame;
  };


  // 7) Execute body with exec_stmt (this will trigger exec_return anywhere, even inside if/while)
  for (const auto& st : f->body) {
    if (!exec_stmt(st.get())) { restore_all(); return false; }
    if (returning_) break;
  }

  // 8) Produce result: returned value or fallthrough 0
  Value result = returning_ ? return_value_ : Value::make_int(0);

  // TRACE: Return (callee frame) — must happen BEFORE restore_all()
  if (trace_ && trace_->enabled()) {
    auto ev = trace_->begin("Return", c->loc, current_frame_);
    ev.field_string("value", result.to_string());
    ev.end();
  }

  // 9) Restore caller context/state
  restore_all();

  out = result;
  return true;
}

bool Evaluator::exec_return(const ReturnStmt* s) {
  Value v = Value::make_int(0);
  if (s->value) {
    if (!eval_expr(s->value.get(), v)) return false;
  }
  returning_ = true;
  return_value_ = v;
  return true;
}