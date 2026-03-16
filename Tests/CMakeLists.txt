add_executable(vi_tests
  test_main.cpp
  lexer_tests.cpp
  parser_tests.cpp
  runtime_tests.cpp
  trace_tests.cpp
  conformance_tests.cpp
  wasm_runner_tests.cpp
)

target_include_directories(vi_tests PRIVATE ../src)

# Compile the core sources into the test executable
target_sources(vi_tests PRIVATE
  ../src/lexer/lexer.cpp
  ../src/parser/parser.cpp
  ../src/runtime/evaluator.cpp
  ../src/trace/json_writer.cpp
  ../src/trace/trace.cpp
  ../src/wasm/runner.cpp
)

add_test(NAME vi_tests COMMAND vi_tests)