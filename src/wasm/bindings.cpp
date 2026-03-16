#include "runner.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(visual_interpreter_wasm) {
    value_object<RunResult>("RunResult")
        .field("ok", &RunResult::ok)
        .field("trace_jsonl", &RunResult::trace_jsonl)
        .field("stdout_text", &RunResult::stdout_text)
        .field("error_text", &RunResult::error_text);

    function("run_source_to_trace", &run_source_to_trace);
}
#endif