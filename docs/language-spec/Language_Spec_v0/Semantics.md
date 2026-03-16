Locked decisions (added to spec)

Calls: forbid call-chaining → only Identifier "(" [args] ")" is a call form.

Functions: top-level only (no nested function declarations).

Return: allow return; and treat as return 0.

Step 3 — Semantics (informal but precise)

2.1) Runtime values and types

Value domain: Int64 plus Bool (represented as 0/1 is allowed internally).

Truthiness rule: an expression is true iff its evaluated integer value is non-zero.

Boolean literals: true → 1, false → 0.
Expected: if (2) { ... } executes the then-branch.
Verify: write let x = 2; if (x) { print("T"); } else { print("F"); } → prints T.

2.2) Program structure and execution order

A program is a sequence of top-level declarations: function declarations and statements.

Function declarations are processed first to populate the function table (name → function AST).

They do not execute their bodies at definition time.

After the function table is built, top-level statements execute in source order.
Expected: calling a function defined later works.
Verify: put let x = f(1); before func f(a){ return a+1; } → still works.

2.3) Environments and scope rules

Two scope kinds:

Global environment: stores top-level let variables.

Function call environment (frame): stores parameters and locals declared with let inside that function body.

Block { ... } does NOT create a new scope in Standard (scope control).

All let inside a function belong to that function frame.

All let at top-level belong to global env.

Name resolution (when reading an identifier):

If inside a function: look in current frame, else look in global.

If not found → runtime error UndefinedVariable.

Declaration rule:

let x = expr; creates variable x in the current environment.

Declaring a name that already exists in the same environment is an error RedeclareVariable.

Assignment rule:

x = expr; requires x already exists in current frame or global (as per resolution).

Otherwise error AssignToUndefined.
Expected: let x = 1; { let x = 2; } is a redeclare error at same scope level.
Verify: run it and confirm the interpreter raises the correct runtime error event.

2.4) Expression evaluation order

All expressions evaluate left-to-right.

Binary operators:

Evaluate left operand, then right operand (except short-circuit operators below).

Then apply operator.

Unary operators:

Evaluate operand first, then apply operator.

Parentheses force evaluation grouping.
Verify: with events later, you should see operand events in left-to-right order.

2.5) Short-circuit semantics (&&, ||)

For A && B:

Evaluate A.

If A is false (0), result is 0 and B is not evaluated.

Else evaluate B, result is truthiness of B.

For A || B:

Evaluate A.

If A is true (non-zero), result is 1 and B is not evaluated.

Else evaluate B, result is truthiness of B.
Expected: side effects in skipped operand do not occur (e.g., print inside a function not called).
Verify: your earlier side() program prints SIDE zero times in the skipped cases.

2.6) Operator semantics (core rules)

Arithmetic:

+ - * % standard integer math.

/ is integer division truncating toward zero (C++ default for ints).

Division/modulo by zero → runtime error DivideByZero.

Comparisons:

< <= > >= == != yield 1 if true else 0.

Logical:

!x yields 1 if x is false else 0.
Verify: print(5/2); prints 2. print(!0); prints 1.

2.7) Statements semantics

let x = expr;

Evaluate expr, then bind x to that value.

x = expr;

Evaluate expr, then store into existing x.

if (cond) {T} else {E}

Evaluate cond.

If cond truthy → execute T block statements sequentially.

Else if else exists → execute E block sequentially.

while (cond) {B}

Loop:

Evaluate cond.

If false → exit loop.

Else execute B statements sequentially, then repeat.

print(...)

Evaluate arguments left-to-right.

For string literals, output literal content.

For expressions, output integer value as decimal.

Join outputs without automatic spaces (scope control); user supplies spaces via literals.

Append newline at end of each print call.

input(x)

Read an integer from stdin.

Store into existing x. If parse fails → InputError.
Verify: print("a", 1, "b"); prints a1b\n.

2.8) Functions: call model

Function signature: name + parameter list (all parameters are int/bool values).

Call evaluation:

Evaluate argument expressions left-to-right in caller environment.

Create new frame mapping params → argument values.

Execute function body statements.

Return:

return expr; evaluates expr and exits function with that value.

return; exits function with value 0.

If control reaches end of function body without return → return 0.

Recursion:

Allowed by semantics (call stack frames), but you do not need to optimize or promise deep recursion.
Verify: function without return returns 0: func f(){ let x=1; } let y=f(); print(y); prints 0.

2.9) Error behavior (precise policy)

On first error:

Stop execution immediately.

Emit an Error execution event with:

error code (enum)

message

source location (line/col or token span)

current call stack (function names)

No recovery required.
Verify: let x = 1/0; halts; no further statements run.