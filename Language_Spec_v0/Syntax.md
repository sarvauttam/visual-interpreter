Locked decisions (I will treat these as constraints)

Subset chosen: Standard (MVP + Functions)

Variables: explicit declarations only (let x = ...;)

Logic: short-circuit for && and ||

Step 2 — Concrete syntax specification (Lexing + EBNF + precedence + examples)

2.1) Tokens and lexical rules (what you must implement + what you should expect)

Whitespace

Spaces, tabs, newlines separate tokens; ignored except for line/column tracking.

Expected: programs can be formatted freely.

Verify: let x=1; and let x = 1 ; parse identically.

Comments

Line comment: // ... to end of line.

Block comment: /* ... */ (no nesting required).

Expected: comments are skipped by lexer.

Verify: inserting comments between tokens doesn’t change AST.

Identifiers

Regex: [A-Za-z_][A-Za-z0-9_]*

Case-sensitive.

Reserved keywords (cannot be identifiers):
let, func, return, if, else, while, true, false, print, input

Verify: let if = 3; must be a lexical/parse error.

Integer literals

Regex: 0|[1-9][0-9]*

No underscores.

Unary minus is an operator, not part of the literal token.

Verify: -5 tokenizes as - then 5.

String literals (print-only arguments, not a variable type)

Delimited by " … "

Escape sequences supported: \", \\, \n, \t

No multi-line strings.

Verify: print("a\nb"); produces a newline in output.

Operators and punctuation

Punctuation: ( ) { } , ;

Assignment: =

Arithmetic: + - * / %

Comparison: < <= > >= == !=

Logical: && || !

Longest-match rule: <= is one token, not < then =.

Verify: a==b parses as equality, not assignment.

Error lexing rule

Any unknown character → LexError with position.

Unterminated string/comment → LexError.

Verify: print("hi); must error at end-of-file.

2.2) EBNF grammar (single source of truth)

Start symbol

Program        ::= { TopLevelDecl } EOF ;
TopLevelDecl   ::= FuncDecl | Stmt ;


Function declarations

FuncDecl       ::= "func" Identifier "(" [ ParamList ] ")" Block ;
ParamList      ::= Identifier { "," Identifier } ;


Statements

Stmt           ::= LetStmt
                 | AssignStmt
                 | IfStmt
                 | WhileStmt
                 | ReturnStmt
                 | PrintStmt
                 | InputStmt
                 | ExprStmt
                 | Block ;

Block          ::= "{" { Stmt } "}" ;

LetStmt        ::= "let" Identifier "=" Expr ";" ;
AssignStmt     ::= Identifier "=" Expr ";" ;

IfStmt         ::= "if" "(" Expr ")" Block [ "else" Block ] ;
WhileStmt      ::= "while" "(" Expr ")" Block ;

ReturnStmt     ::= "return" [ Expr ] ";" ;

PrintStmt      ::= "print" "(" [ PrintArgs ] ")" ";" ;
PrintArgs      ::= PrintArg { "," PrintArg } ;
PrintArg       ::= StringLiteral | Expr ;

InputStmt      ::= "input" "(" Identifier ")" ";" ;

ExprStmt       ::= Expr ";" ;


Expressions (precedence ladder)

Expr           ::= OrExpr ;

OrExpr         ::= AndExpr { "||" AndExpr } ;
AndExpr        ::= EqExpr  { "&&" EqExpr  } ;

EqExpr         ::= RelExpr { ( "==" | "!=" ) RelExpr } ;
RelExpr        ::= AddExpr { ( "<" | "<=" | ">" | ">=" ) AddExpr } ;

AddExpr        ::= MulExpr { ( "+" | "-" ) MulExpr } ;
MulExpr        ::= UnaryExpr { ( "*" | "/" | "%" ) UnaryExpr } ;

UnaryExpr      ::= ( "!" | "-" ) UnaryExpr
                 | CallExpr ;

CallExpr       ::= Primary { "(" [ ArgList ] ")" } ;
ArgList        ::= Expr { "," Expr } ;

Primary        ::= IntegerLiteral
                 | "true"
                 | "false"
                 | Identifier
                 | "(" Expr ")" ;


Notes (scope control)

No for loop (avoid extra syntax; while is enough).

No variable declarations without init (forces deterministic VarCreate + first value).

No string variables; only string literals for print.

2.3) Operator precedence table (highest → lowest)

Unary: ! - (right-associative)

Multiplicative: * / % (left)

Additive: + - (left)

Relational: < <= > >= (left)

Equality: == != (left)

Logical AND: && (left, short-circuit)

Logical OR: || (left, short-circuit)

Expected: 1 + 2 * 3 == 7 && false || true parses as (((1 + (2*3)) == 7) && false) || true.

2.4) Examples of valid programs (copy-paste sanity tests)

Hello + arithmetic

let x = 2 + 3 * 4;
print("x=", x);


If/else

let a = 10;
if (a > 5) {
  print("big");
} else {
  print("small");
}


While loop

let i = 0;
while (i < 3) {
  print("i=", i);
  i = i + 1;
}


Short-circuit demonstration

func side() {
  print("SIDE");
  return true;
}

let x = 0;
if (true || side()) { print("ok"); }
if (false && side()) { print("no"); }


Function call + return

func add(a, b) {
  return a + b;
}

let z = add(3, 4);
print("z=", z);
