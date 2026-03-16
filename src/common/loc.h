#pragma once
#include <cstdint>

struct Loc {
  int line = 1;
  int col  = 1;
};

inline Loc advance_loc(Loc loc, char ch) {
  if (ch == '\n') { loc.line += 1; loc.col = 1; }
  else { loc.col += 1; }
  return loc;
}
