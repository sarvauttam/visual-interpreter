#pragma once
#include <string>
#include <unordered_map>
#include <optional>

#include "runtime/value.h"

enum class RuntimeErrorCode {
  UndefinedVariable,
  RedeclareVariable,
  AssignToUndefined
};

struct RuntimeError {
  RuntimeErrorCode code;
  std::string message;
};

class Env {
public:
  // Declare a new variable in THIS env. Error if already exists.
  bool declare(const std::string& name, const Value& v, RuntimeError& outErr) {
    if (vars_.find(name) != vars_.end()) {
      outErr = {RuntimeErrorCode::RedeclareVariable,
                "RedeclareVariable: '" + name + "'"};
      return false;
    }
    vars_[name] = v;
    return true;
  }

  // Assign in THIS env only. Error if missing.
  bool assign_local(const std::string& name, const Value& v, RuntimeError& outErr) {
    auto it = vars_.find(name);
    if (it == vars_.end()) {
      outErr = {RuntimeErrorCode::AssignToUndefined,
                "AssignToUndefined: '" + name + "'"};
      return false;
    }
    it->second = v;
    return true;
  }

  // Read from THIS env only. Error if missing.
  bool get_local(const std::string& name, Value& out, RuntimeError& outErr) const {
    auto it = vars_.find(name);
    if (it == vars_.end()) {
      outErr = {RuntimeErrorCode::UndefinedVariable,
                "UndefinedVariable: '" + name + "'"};
      return false;
    }
    out = it->second;
    return true;
  }

  bool contains_local(const std::string& name) const {
    return vars_.find(name) != vars_.end();
  }

private:
  std::unordered_map<std::string, Value> vars_;
};
