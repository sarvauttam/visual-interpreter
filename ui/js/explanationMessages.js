function safe(value) {
  return String(value ?? "");
}

function code(value) {
  return `<code>${safe(value)}</code>`;
}

export const EXPLANATION_MESSAGES = {
  include: [
    ({ libraryName, libraryRole }) => `
      <p>Your program is importing the <strong>${safe(libraryName)}</strong> library.</p>
      <p>A library is like a toolbox. It gives your program extra abilities before the main code runs.</p>
      <p>${safe(libraryRole)}</p>
    `,

    ({ libraryName, libraryRole }) => `
      <p>This line connects your program to ${code(`#include <${safe(libraryName)}>`)}.</p>
      <p>Without the right library, some words and tools may not be recognized by C++.</p>
      <p>${safe(libraryRole)}</p>
    `,

    ({ libraryName, libraryRole }) => `
      <p>The program is asking C++ to load <strong>${safe(libraryName)}</strong>.</p>
      <p>Think of this as preparing the ingredients before cooking the program.</p>
      <p>${safe(libraryRole)}</p>
    `,
  ],

  namespace: [
    () => `
      <p>This line lets you write simple names like ${code("cout")} instead of longer names like ${code("std::cout")}.</p>
      <p>It saves typing, especially for beginners.</p>
    `,

    () => `
      <p>${code("using namespace std;")} tells C++ that you want to use the standard C++ toolbox directly.</p>
      <p>That is why ${code("cout")} can be written without ${code("std::")} before it.</p>
    `,

    () => `
      <p>This line makes common C++ tools easier to access.</p>
      <p>For beginner programs, it keeps the code cleaner and less distracting.</p>
    `,
  ],

  mainFunction: [
    () => `
      <p>${code("main()")} is the starting point of a C++ program.</p>
      <p>When the program runs, C++ begins executing instructions from here.</p>
    `,

    () => `
      <p>This line opens the main function.</p>
      <p>You can think of it as the front door where the program enters and starts working.</p>
    `,

    () => `
      <p>Every complete C++ program needs a main function.</p>
      <p>The code inside its braces is the part that actually runs first.</p>
    `,
  ],

  openingBrace: [
    () => `
      <p>This opening brace starts a block of code.</p>
      <p>Everything after it belongs inside that block until a matching closing brace appears.</p>
    `,

    () => `
      <p>The ${code("{")} symbol means “start this section.”</p>
      <p>C++ uses braces to group instructions together.</p>
    `,
  ],

  closingBrace: [
    () => `
      <p>This closing brace ends the current block of code.</p>
      <p>It matches an earlier opening brace.</p>
    `,

    () => `
      <p>The ${code("}")} symbol means this section is finished.</p>
      <p>In this program, it usually closes the main function.</p>
    `,
  ],

  coutString: [
    ({ value }) => `
      <p>This line prints the message ${code(`"${safe(value)}"`)} to the screen.</p>
      <p>${code("cout")} is used when your program wants to show something to the user.</p>
    `,

    ({ value }) => `
      <p>The program is speaking to the user here.</p>
      <p>It displays ${code(`"${safe(value)}"`)} using ${code("cout")}.</p>
    `,

    ({ value }) => `
      <p>This output line sends text to the screen.</p>
      <p>The text inside quotes, ${code(`"${safe(value)}"`)}, is printed exactly as written.</p>
    `,
  ],

  coutVariable: [
    ({ variableName }) => `
      <p>This line prints the value stored inside <strong>${safe(variableName)}</strong>.</p>
      <p>Instead of printing fixed text, it shows whatever value the variable currently holds.</p>
    `,

    ({ variableName }) => `
      <p>${code("cout")} is displaying a variable here.</p>
      <p>The program looks inside <strong>${safe(variableName)}</strong> and prints its value.</p>
    `,

    ({ variableName }) => `
      <p>This line helps the user see what is stored in <strong>${safe(variableName)}</strong>.</p>
      <p>That is useful when you want to show results or debug your program.</p>
    `,
  ],

  coutExpression: [
    () => `
      <p>This line prints the result of an expression.</p>
      <p>C++ calculates the expression first, then sends the result to the screen using ${code("cout")}.</p>
    `,

    () => `
      <p>The program is producing output based on a calculation or combined values.</p>
      <p>The ${code("<<")} operator pushes that result into ${code("cout")}.</p>
    `,
  ],

  endl: [
    () => `
      <p>${code("endl")} moves the output to the next line.</p>
      <p>It is like pressing Enter after printing something.</p>
    `,

    () => `
      <p>This part creates a line break in the output.</p>
      <p>Without it, the next output may appear on the same line.</p>
    `,
  ],

  cin: [
    ({ variableName }) => `
      <p>This line waits for the user to type something.</p>
      <p>The typed value is stored inside <strong>${safe(variableName)}</strong>.</p>
    `,

    ({ variableName }) => `
      <p>${code("cin")} is used for input.</p>
      <p>Here, the program receives a value and places it into <strong>${safe(variableName)}</strong>.</p>
    `,

    ({ variableName }) => `
      <p>This is how the program listens to the user.</p>
      <p>The ${code(">>")} operator sends the typed input into <strong>${safe(variableName)}</strong>.</p>
    `,
  ],

  variableDeclaration: [
    ({ type, variableName, value }) => `
      <p>This line creates a <strong>${safe(type)}</strong> variable named <strong>${safe(variableName)}</strong>.</p>
      <p>A variable is like a labeled box where the program stores information.</p>
      ${value !== undefined ? `<p>Here, the starting value is ${code(value)}.</p>` : ""}
    `,

    ({ type, variableName, value }) => `
      <p>The program is setting up storage space for <strong>${safe(variableName)}</strong>.</p>
      <p>The type ${code(type)} tells C++ what kind of value this variable should hold.</p>
      ${value !== undefined ? `<p>It begins with the value ${code(value)}.</p>` : ""}
    `,

    ({ type, variableName }) => `
      <p>This line introduces a new variable: <strong>${safe(variableName)}</strong>.</p>
      <p>Because it is a ${code(type)}, C++ knows what kind of data belongs inside it.</p>
    `,
  ],

  assignment: [
    ({ variableName, value }) => `
      <p>This line changes the value of <strong>${safe(variableName)}</strong>.</p>
      <p>After this line runs, the variable stores ${code(value)}.</p>
    `,

    ({ variableName, value }) => `
      <p>The program is updating a variable.</p>
      <p><strong>${safe(variableName)}</strong> now points to the new value ${code(value)}.</p>
    `,
  ],

  ifStatement: [
    ({ condition }) => `
      <p>This is a decision line.</p>
      <p>The program checks whether ${code(condition)} is true before running the code inside the braces.</p>
    `,

    ({ condition }) => `
      <p>${code("if")} lets the program choose what to do.</p>
      <p>If ${code(condition)} is true, the next block runs. If not, it gets skipped.</p>
    `,

    ({ condition }) => `
      <p>This condition acts like a gate.</p>
      <p>The program only enters the block when ${code(condition)} passes.</p>
    `,
  ],

  elseStatement: [
    () => `
      <p>${code("else")} gives the program a backup path.</p>
      <p>If the earlier ${code("if")} condition was false, this block can run instead.</p>
    `,

    () => `
      <p>This line means “otherwise.”</p>
      <p>It handles what should happen when the first condition does not pass.</p>
    `,
  ],

  elseIfStatement: [
    ({ condition }) => `
      <p>${code("else if")} checks another condition when the first ${code("if")} was false.</p>
      <p>Here, the new condition is ${code(condition)}.</p>
    `,

    ({ condition }) => `
      <p>This creates another possible path for the program.</p>
      <p>The program tests ${code(condition)} only if the earlier condition failed.</p>
    `,
  ],

  forLoop: [
    ({ initializer, condition, update }) => `
      <p>This is a loop, which means it can repeat code multiple times.</p>
      <p>It starts with ${code(initializer)}, keeps going while ${code(condition)} is true, and updates using ${code(update)}.</p>
    `,

    () => `
      <p>A ${code("for")} loop is useful when you know how many times you want to repeat something.</p>
      <p>The code inside the loop runs again and again until the loop condition becomes false.</p>
    `,

    ({ condition }) => `
      <p>This loop repeats while ${code(condition)} stays true.</p>
      <p>Each repeat is called an iteration.</p>
    `,
  ],

  whileLoop: [
    ({ condition }) => `
      <p>This loop keeps running while ${code(condition)} is true.</p>
      <p>Before every repeat, C++ checks the condition again.</p>
    `,

    ({ condition }) => `
      <p>A ${code("while")} loop is like saying “keep doing this as long as ${safe(condition)} remains true.”</p>
      <p>Be careful: if the condition never becomes false, the loop may run forever.</p>
    `,
  ],

  doWhileLoop: [
    ({ condition }) => `
      <p>This loop runs the code first, then checks ${code(condition)} afterward.</p>
      <p>That means a do-while loop always runs at least once.</p>
    `,

    () => `
      <p>A ${code("do while")} loop is different from a normal while loop.</p>
      <p>It performs the action first before asking whether it should repeat.</p>
    `,
  ],

  returnStatement: [
    () => `
      <p>${code("return 0;")} tells the computer the program finished successfully.</p>
    `,

    () => `
      <p>This line ends the main function.</p>
      <p>The value 0 usually means everything went okay.</p>
    `,

    () => `
      <p>The program is now ready to stop.</p>
      <p>Returning 0 is a common way to say “no error happened.”</p>
    `,
  ],

  functionDefinition: [
    ({ returnType, functionName }) => `
      <p>This line defines a function named <strong>${safe(functionName)}</strong>.</p>
      <p>The return type ${code(returnType)} tells C++ what kind of value the function gives back.</p>
    `,

    ({ functionName }) => `
      <p>A function is a reusable group of instructions.</p>
      <p>Here, the program is creating a function called <strong>${safe(functionName)}</strong>.</p>
    `,
  ],

  functionCall: [
    ({ functionName }) => `
      <p>This line calls the function <strong>${safe(functionName)}</strong>.</p>
      <p>Calling a function means telling its instructions to run now.</p>
    `,

    ({ functionName }) => `
      <p>The program is using a function named <strong>${safe(functionName)}</strong>.</p>
      <p>Functions help keep code organized and reusable.</p>
    `,
  ],

  comment: [
    () => `
      <p>This is a comment.</p>
      <p>C++ ignores it when running the program, but humans can read it to understand the code.</p>
    `,

    () => `
      <p>Comments are notes for people, not commands for the computer.</p>
      <p>They help explain what the code is supposed to do.</p>
    `,
  ],

  blankLine: [
    () => `
      <p>This blank line does not change how the program runs.</p>
      <p>It simply makes the code easier to read.</p>
    `,
  ],

  arithmetic: [
    ({ expression }) => `
      <p>This line uses arithmetic.</p>
      <p>C++ calculates ${code(expression)} using math rules before storing or printing the result.</p>
    `,

    ({ expression }) => `
      <p>The program is doing a calculation here.</p>
      <p>The expression ${code(expression)} is evaluated before the line finishes.</p>
    `,
  ],

  comparison: [
    ({ expression }) => `
      <p>This comparison checks whether ${code(expression)} is true or false.</p>
      <p>Comparisons are often used inside decisions and loops.</p>
    `,

    ({ expression }) => `
      <p>The program is asking a yes-or-no question here.</p>
      <p>${code(expression)} will become either true or false.</p>
    `,
  ],

  increment: [
    ({ variableName }) => `
      <p>This line increases <strong>${safe(variableName)}</strong> by 1.</p>
      <p>It is commonly used in loops to move to the next step.</p>
    `,

    ({ variableName }) => `
      <p>${code(`${safe(variableName)}++`)} is a shortcut.</p>
      <p>It means “add 1 to ${safe(variableName)}.”</p>
    `,
  ],

  decrement: [
    ({ variableName }) => `
      <p>This line decreases <strong>${safe(variableName)}</strong> by 1.</p>
      <p>It is the opposite of incrementing.</p>
    `,

    ({ variableName }) => `
      <p>${code(`${safe(variableName)}--`)} is a shortcut.</p>
      <p>It means “subtract 1 from ${safe(variableName)}.”</p>
    `,
  ],

  arrayDeclaration: [
    ({ type, variableName, size }) => `
      <p>This line creates an array named <strong>${safe(variableName)}</strong>.</p>
      <p>An array stores multiple ${code(type)} values under one name.</p>
      <p>The size ${code(size)} tells how many items it can hold.</p>
    `,

    ({ variableName }) => `
      <p>An array is like a row of boxes.</p>
      <p>Here, the row is named <strong>${safe(variableName)}</strong>.</p>
    `,
  ],

  vectorDeclaration: [
    ({ type, variableName }) => `
      <p>This line creates a vector named <strong>${safe(variableName)}</strong>.</p>
      <p>A vector is like an array that can grow or shrink while the program runs.</p>
      <p>It stores values of type ${code(type)}.</p>
    `,

    ({ variableName }) => `
      <p>The program is creating a flexible list called <strong>${safe(variableName)}</strong>.</p>
      <p>Vectors are useful when you do not know the exact number of items ahead of time.</p>
    `,
  ],

  classDefinition: [
    ({ className }) => `
      <p>This line begins a class named <strong>${safe(className)}</strong>.</p>
      <p>A class is a blueprint for creating objects.</p>
    `,

    ({ className }) => `
      <p>The program is defining a custom type called <strong>${safe(className)}</strong>.</p>
      <p>Classes help group data and behavior together.</p>
    `,
  ],

  structDefinition: [
    ({ structName }) => `
      <p>This line begins a struct named <strong>${safe(structName)}</strong>.</p>
      <p>A struct groups related pieces of data together.</p>
    `,

    ({ structName }) => `
      <p>The program is creating a simple custom data shape called <strong>${safe(structName)}</strong>.</p>
      <p>Structs are useful when several values belong together.</p>
    `,
  ],

  unknown: [
    () => `
      <p>This line is not recognized by the current explanation system yet.</p>
      <p>That does not always mean it is wrong. It may simply be outside the beginner subset ISeeCode currently explains.</p>
    `,

    () => `
      <p>ISeeCode does not have a detailed explanation for this line yet.</p>
      <p>As the supported C++ subset grows, this type of line can receive a better explanation.</p>
    `,
  ],

  incomplete: [
    () => `
      <p>This line looks like it is still being written.</p>
      <p>Finish the line so ISeeCode can explain it clearly.</p>
    `,

    () => `
      <p>You are partway through a valid C++ idea.</p>
      <p>Keep typing until the line is complete.</p>
    `,
  ],

  errorHint: [
    ({ message }) => `
      <p><strong>Fix needed:</strong> ${safe(message)}</p>
      <p>Small syntax mistakes can stop a program from running, so fix this before moving on.</p>
    `,

    ({ message }) => `
      <p><strong>Something needs attention:</strong> ${safe(message)}</p>
      <p>Once this is corrected, ISeeCode can explain the line more confidently.</p>
    `,
  ],
};

export function pickExplanation(type, context = {}) {
  const messages = EXPLANATION_MESSAGES[type] || EXPLANATION_MESSAGES.unknown;
  const indexSeed = safe(context.lineText || context.variableName || context.libraryName || type).length;
  const message = messages[indexSeed % messages.length];
  return message(context);
}