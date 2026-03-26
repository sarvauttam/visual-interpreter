T01 — Declaration + expression precedence

Goal: Let, ExprStart/Value/Op, VarDeclare, Print

Program:

let x = 2 + 3 * 4;
print("x=", x);


Expect: x= 14

Verify: events include ExprOp "*", then ExprOp "+", then VarDeclare x=14, and a VarRead of x during print.

2.2) T02 — Assignment + VarWrite old/new

Goal: Assign, VarWrite, VarRead

Program:

let x = 1;
x = x + 5;
print(x);


Expect: 6

Verify: assignment emits VarRead x=1, then VarWrite x old=1 new=6.

2.3) T03 — If/else branch decision

Goal: If, BranchDecision, StepStart/End

Program:

let a = 3;
if (a > 5) { print("then"); }
else { print("else"); }


Expect: else

Verify: BranchDecision condValue=0 taken="else" and VarRead a.

2.4) T04 — While loop iterations + exit

Goal: LoopCheck, LoopIterationStart, LoopExit, repeated VarWrite

Program:

let i = 0;
while (i < 3) {
  print("i=", i);
  i = i + 1;
}


Expect: three lines: i= 0, i= 1, i= 2

Verify: loop emits 3 iteration starts and one loop exit; each iteration reads and writes i.

2.5) T05 — Short-circuit OR skips RHS

Goal: ShortCircuit for ||, call not executed

Program:

func side() { print("SIDE"); return 1; }

let x = 0;
if (true || side()) { x = 1; }
print("x=", x);


Expect: no SIDE output; then x= 1

Verify: a ShortCircuit op="||" skipped="rhs" occurs; no CallStart for side() in that expression.

2.6) T06 — Short-circuit AND skips RHS

Goal: ShortCircuit for &&

Program:

func side() { print("SIDE"); return 1; }

let x = 0;
if (false && side()) { x = 1; }
print("x=", x);


Expect: no SIDE; then x= 0

Verify: ShortCircuit op="&&" lhsValue=0 skipped="rhs".

2.7) T07 — Function call args eval order

Goal: CallStart, multiple CallArg in order, CallEnter, Return

Program:

func f(a, b, c) { return a*100 + b*10 + c; }

let x = f(1, 2+1, 4);
print(x);


Expect: 134

Verify: CallArg index 1 value 1; index 2 value 3 (with its own expr events); index 3 value 4; then CallEnter.

2.8) T08 — Return; and fallthrough return 0

Goal: Return implicit=true

Program:

func r1() { return; }
func r2() { let x = 9; }

let a = r1();
let b = r2();
print("a=", a, "b=", b);


Expect: a= 0 b= 0

Verify: Return value=0 implicit=true for both functions (one from return;, one from end-of-function).

2.9) T09 — Runtime error: divide by zero (halts)

Goal: Error DivideByZero, stop execution

Program:

let x = 1 / 0;
print("AFTER");


Expect: program errors; no AFTER

Verify: Error code="DivideByZero" appears; no subsequent Print.

2.10) T10 — Scope resolution: local vs global

Goal: frame-based lookup, VarRead resolution order

Program:

let x = 5;

func useLocal(x) {
  print("in=", x);
  x = x + 1;
  print("after=", x);
  return x;
}

let y = useLocal(10);
print("global x=", x, "y=", y);