#pragma once

#include <cstdint>
#include <string>
#include <stdexcept>

enum class ValueType : uint8_t {
  Int,
  Bool,
  String
};

struct Value {
  ValueType type = ValueType::Int;

  int64_t i = 0;          // used for Int
  bool b = false;         // used for Bool
  std::string s = "";     // used for String

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

  static Value make_string(std::string v) {
    Value x;
    x.type = ValueType::String;
    x.s = std::move(v);
    return x;
  }

  bool is_int() const {
    return type == ValueType::Int;
  }

  bool is_bool() const {
    return type == ValueType::Bool;
  }

  bool is_string() const {
    return type == ValueType::String;
  }

  std::string to_string() const {
    if (type == ValueType::Int) {
      return std::to_string(i);
    }

    if (type == ValueType::Bool) {
      return b ? "1" : "0";
    }

    return s;
  }

  bool truthy() const {
    if (type == ValueType::Bool) {
      return b;
    }

    if (type == ValueType::String) {
      return !s.empty();
    }

    return i != 0;
  }
};