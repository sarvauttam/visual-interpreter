#include "runner.h"

#include <sstream>
#include <vector>

#include "../lexer/lexer.h"
#include "../parser/parser.h"
#include "../ast/ast.h"
#include "../runtime/evaluator.h"
#include "../trace/trace.h"
#include "../trace/json_writer.h"

RunResult run_source_to_trace(const std::string& source) {
    RunResult result;

    try {
        Lexer lexer(source);
        std::vector<Token> tokens = lexer.tokenize_all();

        Parser parser(tokens);
        Program program = parser.parse_program();

        std::ostringstream trace_stream;
        std::ostringstream stdout_stream;
        TraceEmitter trace_emitter(&trace_stream);

        Evaluator evaluator;
        evaluator.set_trace(&trace_emitter);
        evaluator.set_output_stream(&stdout_stream);
        evaluator.exec_program(program);

        result.ok = true;
        result.trace_jsonl = trace_stream.str();
        result.stdout_text = stdout_stream.str();
    } catch (const RuntimeError& e) {
        result.ok = false;
        result.error_text = e.message;
    } catch (const std::exception& e) {
        result.ok = false;
        result.error_text = e.what();
    }

    return result;
}