#pragma once

#include <string>

struct RunResult {
    bool ok = false;

    std::string trace_jsonl;
    std::string stdout_text;
    std::string error_text;
};

RunResult run_source_to_trace(const std::string& source);