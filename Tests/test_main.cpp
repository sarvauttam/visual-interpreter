#include "test_main.h"

void test_wasm_runner_basic();
void test_wasm_runner_basic();

int main() {
  for (auto& t : test_registry()) {
    std::cout << "[TEST] " << t.name << "\n";
    t.fn();
  }

  if (g_failures == 0) {
    std::cout << "ALL TESTS PASSED\n";
    return 0;
  }
  std::cout << g_failures << " TEST(S) FAILED\n";
  return 1;
}
