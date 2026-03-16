#include "trace/json_writer.h"
#include <sstream>
#include <iomanip>

JsonWriter::JsonWriter(std::ostream& out) : out_(out) {}

void JsonWriter::maybe_comma() {
  if (need_comma_) out_ << ",";
  need_comma_ = true;
}

void JsonWriter::begin_object() {
  need_comma_ = false;
  out_ << "{";
}

void JsonWriter::end_object() {
  out_ << "}\n";
  need_comma_ = false;
}

void JsonWriter::key(const std::string& k) {
  maybe_comma();
  write_quoted(k);
  out_ << ":";
  // next thing written is a value, not a key, so keep need_comma_ false for that value
  need_comma_ = false;
}

void JsonWriter::comma() {
  out_ << ",";
}

void JsonWriter::begin_array() {
  out_ << "[";
  need_comma_ = false;
}

void JsonWriter::end_array() {
  out_ << "]";
  need_comma_ = true;
}

void JsonWriter::write_quoted(const std::string& s) {
  out_ << "\"" << escape(s) << "\"";
}

std::string JsonWriter::escape(const std::string& s) {
  std::ostringstream oss;
  for (unsigned char c : s) {
    switch (c) {
      case '\"': oss << "\\\""; break;
      case '\\': oss << "\\\\"; break;
      case '\n': oss << "\\n"; break;
      case '\t': oss << "\\t"; break;
      case '\r': oss << "\\r"; break;
      default:
        if (c < 0x20) {
          // control char -> \u00XX
          oss << "\\u"
              << std::hex << std::setw(4) << std::setfill('0')
              << (int)c
              << std::dec;
        } else {
          oss << (char)c;
        }
    }
  }
  return oss.str();
}

void JsonWriter::value_string(const std::string& s) {
  write_quoted(s);
  need_comma_ = true;
}

void JsonWriter::value_int(int64_t v) {
  out_ << v;
  need_comma_ = true;
}

void JsonWriter::value_bool(bool v) {
  out_ << (v ? "true" : "false");
  need_comma_ = true;
}

void JsonWriter::field_string(const std::string& k, const std::string& v) {
  key(k);
  value_string(v);
}

void JsonWriter::field_int(const std::string& k, int64_t v) {
  key(k);
  value_int(v);
}

void JsonWriter::field_bool(const std::string& k, bool v) {
  key(k);
  value_bool(v);
}
