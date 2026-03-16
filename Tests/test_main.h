#pragma once
#include <iostream>
#include <string>
#include <vector>
#include <functional>

inline int g_failures = 0;

struct TestCase {
  const char* name;
  std::function<void()> fn;
};

inline std::vector<TestCase>& test_registry() {
  static std::vector<TestCase> reg;
  return reg;
}

inline void register_test(const char* name, std::function<void()> fn) {
  test_registry().push_back(TestCase{name, std::move(fn)});
}

#define TEST(name) \
  static void name(); \
  struct name##_registrar { \
    name##_registrar() { register_test(#name, &name); } \
  }; \
  inline name##_registrar name##_registrar_instance; \
  static void name()

#define REQUIRE(cond) do { \
  if (!(cond)) { \
    std::cerr << "  FAIL: " #cond " at " << __FILE__ << ":" << __LINE__ << "\n"; \
    ++g_failures; \
    return; \
  } \
} while(0)

#define REQUIRE_EQ(a,b) do { \
  auto _a = (a); auto _b = (b); \
  if (!(_a == _b)) { \
    std::cerr << "  FAIL: expected equality at " << __FILE__ << ":" << __LINE__ << "\n"; \
    std::cerr << "    left:  " << _a << "\n"; \
    std::cerr << "    right: " << _b << "\n"; \
    ++g_failures; \
    return; \
  } \
} while(0)
