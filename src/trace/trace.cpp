#include "trace/trace.h"

TraceEmitter::TraceEmitter(std::ostream* out) : out_(out) {
  if (out_) jw_ = std::make_unique<JsonWriter>(*out_);
}

void TraceEmitter::reset() {
  seq_ = 0;
}

void TraceEmitter::write_common_fields(const std::string& type, Loc loc, const FrameInfo& frame) {
  // seq increments per emitted event
  jw_->field_int("seq", ++seq_);
  jw_->field_string("type", type);

  // loc object
  jw_->key("loc");
  jw_->begin_object();
  jw_->field_int("line", loc.line);
  jw_->field_int("col", loc.col);
  jw_->end_object(); // ends loc object + newline? NO: our JsonWriter end_object emits '\n'
  // IMPORTANT: JsonWriter::end_object emits newline, but we need nested object close WITHOUT newline.
  // So we must not use end_object() for nested objects here.
}

//
// NOTE: Our JsonWriter currently always ends object with '\n'. That is fine for top-level events,
// but not for nested objects. We'll handle nested objects manually in EventBuilder (below) and
// in write_common_fields we will avoid end_object(). We'll do it by writing raw braces.
//

TraceEmitter::EventBuilder TraceEmitter::begin(const std::string& type, Loc loc, const FrameInfo& frame) {
  EventBuilder b;
  if (!enabled()) return b;

  b.t = this;
  b.active = true;

  // Start top-level object
  jw_->begin_object();

  jw_->field_int("seq", ++seq_);
  jw_->field_string("type", type);

  // loc
  jw_->key("loc");
  *(out_) << "{";
  jw_->field_int("line", loc.line);
  jw_->field_int("col", loc.col);
  *(out_) << "}";

  // frame
  jw_->key("frame");
  *(out_) << "{";
  jw_->field_string("name", frame.name);
  jw_->field_int("depth", frame.depth);
  *(out_) << "}";

  return b;
}

void TraceEmitter::emit_event(const std::string& type, Loc loc, const FrameInfo& frame) {
  if (!enabled()) return;
  auto e = begin(type, loc, frame);
  e.end();
}

void TraceEmitter::emit_error(const std::string& code, const std::string& message, Loc loc, const FrameInfo& frame) {
  if (!enabled()) return;
  auto e = begin("Error", loc, frame);
  e.field_string("code", code);
  e.field_string("message", message);
  e.end();
}

void TraceEmitter::emit_print(const std::string& text, Loc loc, const FrameInfo& frame) {
  if (!enabled()) return;
  auto e = begin("Print", loc, frame);
  e.field_string("text", text);
  e.end();
}

// ---- EventBuilder ----

void TraceEmitter::EventBuilder::field_string(const std::string& k, const std::string& v) {
  if (!active) return;
  t->jw_->key(k);
  t->jw_->value_string(v);
}

void TraceEmitter::EventBuilder::field_int(const std::string& k, int64_t v) {
  if (!active) return;
  t->jw_->key(k);
  t->jw_->value_int(v);
}

void TraceEmitter::EventBuilder::field_bool(const std::string& k, bool v) {
  if (!active) return;
  t->jw_->key(k);
  t->jw_->value_bool(v);
}

void TraceEmitter::EventBuilder::begin_object_field(const std::string& k) {
  if (!active) return;
  t->jw_->key(k);
  *(t->out_) << "{";
}

void TraceEmitter::EventBuilder::begin_array_field(const std::string& k) {
  if (!active) return;
  t->jw_->key(k);
  *(t->out_) << "[";
}

void TraceEmitter::EventBuilder::end_object() {
  if (!active) return;
  *(t->out_) << "}";
}

void TraceEmitter::EventBuilder::end_array() {
  if (!active) return;
  *(t->out_) << "]";
}

void TraceEmitter::EventBuilder::end() {
  if (!active) return;
  *(t->out_) << "}\n";
  active = false;
}