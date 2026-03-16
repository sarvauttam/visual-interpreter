function double(x) {
  let result = x * 2;
  print("Doubling:", x);
  return result;
}

let n = 3;

if (n < 5) {
  print("n is small");
}

let value = double(n);
print("Final value:", value);