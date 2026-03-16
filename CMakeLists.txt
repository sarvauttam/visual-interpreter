cmake_minimum_required(VERSION 3.20)
project(visual_interpreter LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(vi
  src/main.cpp
  src/lexer/lexer.cpp
  src/parser/parser.cpp
  src/runtime/evaluator.cpp
  src/trace/json_writer.cpp
  src/trace/trace.cpp
  src/wasm/runner.cpp
)


target_include_directories(vi PRIVATE src)

if (MSVC)
  target_compile_options(vi PRIVATE /W4)
else()
  target_compile_options(vi PRIVATE -Wall -Wextra -Wpedantic)
endif()

enable_testing()
add_subdirectory(tests)

if (EMSCRIPTEN)
  add_executable(vi_wasm
    src/lexer/lexer.cpp
    src/parser/parser.cpp
    src/runtime/evaluator.cpp
    src/trace/json_writer.cpp
    src/trace/trace.cpp
    src/wasm/runner.cpp
    src/wasm/bindings.cpp
  )

  target_include_directories(vi_wasm PRIVATE src)

  set_target_properties(vi_wasm PROPERTIES SUFFIX ".js")

  target_link_options(vi_wasm PRIVATE
    "--bind"
    "-sMODULARIZE=1"
    "-sEXPORT_NAME=VisualInterpreterModule"
    "-sENVIRONMENT=web"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sNO_EXIT_RUNTIME=1"
    "-sEXPORT_ES6=0"
  )
endif()
