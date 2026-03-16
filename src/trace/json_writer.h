#pragma once
#include <ostream>
#include <string>
#include <cstdint>

class JsonWriter {
public:
  explicit JsonWriter(std::ostream& out);

  // Writes a single JSON object per call, ending with '\n'
  void begin_object();
  void end_object(); // also writes '\n'

  void key(const std::string& k);

  void value_string(const std::string& s);
  void value_int(int64_t v);
  void value_bool(bool v);

  void begin_array();
  void end_array();

  // Convenience: write "key": <value>
  void field_string(const std::string& k, const std::string& v);
  void field_int(const std::string& k, int64_t v);
  void field_bool(const std::string& k, bool v);

  // raw: for writing commas between fields/items
  void comma();

  // Escapes and quotes string (public for reuse)
  static std::string escape(const std::string& s);

private:
  std::ostream& out_;
  bool need_comma_ = false;

  void write_quoted(const std::string& s);
  void maybe_comma();
};
