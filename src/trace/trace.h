#pragma once
#include <cstdint>
#include <memory>
#include <optional>
#include <ostream>
#include <string>

#include "common/loc.h"
#include "trace/json_writer.h"

struct FrameInfo {
  std::string name;   // e.g. "<global>" or function name
  int depth = 0;      // 0 global, 1 inside a function, etc.
};

class TraceEmitter {
public:
  // If out is null, tracing is disabled.
  explicit TraceEmitter(std::ostream* out);

  bool enabled() const { return out_ != nullptr; }

  // Reset sequence counter to 0.
  void reset();

  // Emit basic event with required common fields.
  void emit_event(const std::string& type, Loc loc, const FrameInfo& frame);

  // Emit helpers for common extra fields used later.
  void emit_error(const std::string& code, const std::string& message, Loc loc, const FrameInfo& frame);

  // For Print event: items array + text
  void emit_print(const std::string& text, Loc loc, const FrameInfo& frame);

  // Low-level access: start an event and allow caller to add extra fields
  // Usage:
  //   auto e = trace.begin("VarRead", loc, frame);
  //   e.field_string("name","x"); ...
  struct EventBuilder {
    TraceEmitter* t = nullptr;
    bool active = false;

    void field_string(const std::string& k, const std::string& v);
    void field_int(const std::string& k, int64_t v);
    void field_bool(const std::string& k, bool v);

    // nested objects
    void begin_object_field(const std::string& k);
    void end_object();

    // arrays
    void begin_array_field(const std::string& k);
    void end_array();

    // finish the JSON object line
    void end();
  };

  EventBuilder begin(const std::string& type, Loc loc, const FrameInfo& frame);

private:
  std::ostream* out_ = nullptr;
  int64_t seq_ = 0;
  std::unique_ptr<JsonWriter> jw_;

  void write_common_fields(const std::string& type, Loc loc, const FrameInfo& frame);
};
