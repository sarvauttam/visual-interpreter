Locked decisions (final for Phase 2 spec)

Integer overflow: wrap (two’s complement behavior assumed; document as implementation-defined but tested on typical platforms).

print formatting: auto-space between comma-separated arguments, plus newline at end.

Step 4 — Execution Event Model (for visualization)

2.1) Global rules (apply to all events)

Event stream is an ordered list emitted during execution.

Every event has these required fields:

seq (int): monotonically increasing event number starting at 1

type (string): event type name

ts (string/int): optional timestamp; for MVP you can omit or use monotonic counter

loc (object): { "line": int, "col": int } (best-effort)

frame (object): { "name": "global" | functionName, "depth": int }

Verification: seq must have no gaps; frame.depth increases on call and decreases on return.

2.2) Event types (complete list for Standard)
I’m keeping this minimal but sufficient for your thesis claim. Anything not listed is out-of-scope.

A) Execution flow

ProgramStart

ProgramEnd

StepStart (statement-level stepping)

StepEnd

B) Variables / environments
5. VarDeclare
6. VarRead
7. VarWrite

C) Expressions (breakdown)
8. ExprStart
9. ExprValue
10. ExprOp (apply operator)
11. ShortCircuit (explicitly marks skipping RHS)

D) Control flow
12. BranchDecision
13. LoopCheck
14. LoopIterationStart
15. LoopExit

E) Functions
16. CallStart
17. CallArg
18. CallEnter
19. Return

F) IO
20. Print
21. Input

G) Errors
22. Error

Field specs + example JSON for each event
(All examples omit ts for brevity.)

3.1) ProgramStart

Required fields: seq,type,loc,frame,version

{"seq":1,"type":"ProgramStart","version":"v0","loc":{"line":1,"col":1},"frame":{"name":"global","depth":0}}


3.2) ProgramEnd

Fields: exitCode (0 success)

{"seq":250,"type":"ProgramEnd","exitCode":0,"loc":{"line":42,"col":1},"frame":{"name":"global","depth":0}}


3.3) StepStart

Fields: stmtKind (enum), src (string snippet optional)

stmtKind ∈ Let,Assign,If,While,Return,Print,Input,ExprStmt,Block

{"seq":5,"type":"StepStart","stmtKind":"Let","src":"let x = 2 + 3 * 4;","loc":{"line":1,"col":1},"frame":{"name":"global","depth":0}}


3.4) StepEnd

Fields: none beyond common

{"seq":18,"type":"StepEnd","loc":{"line":1,"col":1},"frame":{"name":"global","depth":0}}


3.5) VarDeclare

Fields: name, value

{"seq":17,"type":"VarDeclare","name":"x","value":14,"loc":{"line":1,"col":1},"frame":{"name":"global","depth":0}}


3.6) VarRead

Fields: name, value

{"seq":40,"type":"VarRead","name":"x","value":14,"loc":{"line":3,"col":6},"frame":{"name":"global","depth":0}}


3.7) VarWrite

Fields: name, old, new

{"seq":88,"type":"VarWrite","name":"i","old":1,"new":2,"loc":{"line":6,"col":9},"frame":{"name":"global","depth":0}}


3.8) ExprStart

Fields: exprId (string/int), repr (string)

{"seq":6,"type":"ExprStart","exprId":"E12","repr":"2 + 3 * 4","loc":{"line":1,"col":9},"frame":{"name":"global","depth":0}}


3.9) ExprValue

Fields: exprId, value, kind ∈ Int,Bool

{"seq":7,"type":"ExprValue","exprId":"E13","kind":"Int","value":2,"loc":{"line":1,"col":9},"frame":{"name":"global","depth":0}}


3.10) ExprOp

Fields: op, lhs, rhs, result

lhs/rhs/result are objects: { "exprId": "...", "value": int }

{"seq":12,"type":"ExprOp","op":"*",
 "lhs":{"exprId":"E14","value":3},
 "rhs":{"exprId":"E15","value":4},
 "result":{"exprId":"E16","value":12},
 "loc":{"line":1,"col":13},"frame":{"name":"global","depth":0}}


3.11) ShortCircuit

Fields: op (&& or ||), lhsValue, skipped ("rhs"), result

{"seq":120,"type":"ShortCircuit","op":"||","lhsValue":1,"skipped":"rhs","result":1,
 "loc":{"line":10,"col":7},"frame":{"name":"global","depth":0}}


3.12) BranchDecision

Fields: condValue, taken ("then"/"else")

{"seq":55,"type":"BranchDecision","condValue":0,"taken":"else",
 "loc":{"line":4,"col":1},"frame":{"name":"global","depth":0}}


3.13) LoopCheck

Fields: condValue

{"seq":70,"type":"LoopCheck","condValue":1,"loc":{"line":6,"col":1},"frame":{"name":"global","depth":0}}


3.14) LoopIterationStart

Fields: iter (0-based or 1-based; choose 1-based for readability)

{"seq":71,"type":"LoopIterationStart","iter":1,"loc":{"line":6,"col":1},"frame":{"name":"global","depth":0}}


3.15) LoopExit

Fields: reason ∈ ConditionFalse

{"seq":105,"type":"LoopExit","reason":"ConditionFalse","loc":{"line":6,"col":1},"frame":{"name":"global","depth":0}}


3.16) CallStart

Fields: func

{"seq":30,"type":"CallStart","func":"add","loc":{"line":8,"col":9},"frame":{"name":"global","depth":0}}


3.17) CallArg

Fields: index (1-based), value

{"seq":31,"type":"CallArg","func":"add","index":1,"value":3,"loc":{"line":8,"col":13},"frame":{"name":"global","depth":0}}


3.18) CallEnter

Fields: func, params (object mapping)

{"seq":33,"type":"CallEnter","func":"add","params":{"a":3,"b":4},
 "loc":{"line":2,"col":1},"frame":{"name":"add","depth":1}}


3.19) Return

Fields: value, implicit (bool) — true if return; or fallthrough end-of-function

{"seq":48,"type":"Return","value":0,"implicit":true,
 "loc":{"line":5,"col":3},"frame":{"name":"f","depth":1}}


3.20) Print

Fields: items (array of rendered strings), text (final line)

Auto-space rule applied between items.

{"seq":90,"type":"Print","items":["x=","14"],"text":"x= 14",
 "loc":{"line":2,"col":1},"frame":{"name":"global","depth":0}}


3.21) Input

Fields: name, raw (string), value (int) OR ok:false

{"seq":15,"type":"Input","name":"x","raw":"42","value":42,"ok":true,
 "loc":{"line":3,"col":1},"frame":{"name":"global","depth":0}}


3.22) Error

Fields: code (enum), message, stack (array of frame names)

code ∈ LexError,ParseError,UndefinedVariable,RedeclareVariable,AssignToUndefined,DivideByZero,InputError,UnknownFunction,ArityMismatch

{"seq":22,"type":"Error","code":"DivideByZero","message":"division by zero",
 "stack":["global"],"loc":{"line":1,"col":12},"frame":{"name":"global","depth":0}}

 All events are JSON objects, emitted as JSON Lines (one per line).