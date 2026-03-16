#pragma once
#include <cstdint>
#include <string>
#include <stdexcept>

enum class ValueType : uint8_t {
  Int,
  Bool
};

struct Value {
  ValueType type = ValueType::Int;
  int64_t i = 0;     // used for Int
  bool b = false;    // used for Bool

  static Value make_int(int64_t v) {
    Value x;
    x.type = ValueType::Int;
    x.i = v;
    return x;
  }

  static Value make_bool(bool v) {
    Value x;
    x.type = ValueType::Bool;
    x.b = v;
    return x;
  }

  bool is_int() const { return type == ValueType::Int; }
  bool is_bool() const { return type == ValueType::Bool; }

  // For your language: bool prints as 1/0
  std::string to_string() const {
    if (type == ValueType::Int) return std::to_string(i);
    return b ? "1" : "0";
  }

  // Convert to truthiness for control flow and &&/||.
  // Spec says bool is 0/1, but we allow int in conditions too:
  // 0 => false, nonzero => true. (If you want to forbid later, do it here.)
  bool truthy() const {
    if (type == ValueType::Bool) return b;
    return i != 0;
  }
};
