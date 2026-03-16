#include "wasm/runner.h"

#include <stdexcept>
#include <string>

static void require_true(bool condition, const std::string& message) {
    if (!condition) {
        throw std::runtime_error(message);
    }
}

void test_wasm_runner_basic() {
    const std::string source =
        "let x = 0;\n"
        "func inc(){ x = x + 1; return x; }\n"
        "func f(a,b){ return a*10 + b; }\n"
        "print(f(inc(), inc()));\n";

    RunResult result = run_source_to_trace(source);

    require_true(result.ok, "run_source_to_trace should succeed");
    require_true(!result.trace_jsonl.empty(), "trace_jsonl should not be empty");
    require_true(result.trace_jsonl.find("\"type\":\"ProgramStart\"") != std::string::npos,
                 "trace should contain ProgramStart");
    require_true(result.trace_jsonl.find("\"type\":\"Print\"") != std::string::npos,
                 "trace should contain Print");
    require_true(result.stdout_text.find("12") != std::string::npos,
                 "stdout_text should contain printed output");
}