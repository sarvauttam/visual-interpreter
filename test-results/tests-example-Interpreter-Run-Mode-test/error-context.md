# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\example.spec.js >> Interpreter Run Mode test
- Location: tests\example.spec.js:3:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#output')
Expected substring: "5"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#output')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]: ◉
      - generic [ref=e7]:
        - heading "ISeeCode" [level=1] [ref=e8]
        - paragraph [ref=e9]: Learn code as you write it
    - navigation "Main navigation" [ref=e10]:
      - button "How to Use" [ref=e11] [cursor=pointer]
      - button "Upload File" [ref=e12] [cursor=pointer]
      - button "History" [ref=e13] [cursor=pointer]
      - button "Account" [ref=e14] [cursor=pointer]
  - main [ref=e15]:
    - generic [ref=e16]:
      - region "Code Editor" [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]:
            - heading "Code Editor" [level=2] [ref=e20]
            - paragraph [ref=e21]: Write your code here and click Run when you're ready.
          - generic [ref=e22]:
            - button "Clear" [ref=e23] [cursor=pointer]
            - button "Run" [ref=e24] [cursor=pointer]
        - generic "Editor tools" [ref=e25]:
          - generic "Font size controls" [ref=e26]:
            - button "−" [ref=e27] [cursor=pointer]
            - generic [ref=e28]: Font size
            - spinbutton "Font size" [ref=e29]: "16"
            - button "+" [ref=e30] [cursor=pointer]
          - button "B" [ref=e32] [cursor=pointer]:
            - strong: B
          - button "I" [ref=e33] [cursor=pointer]:
            - emphasis: I
          - button "U" [ref=e34] [cursor=pointer]:
            - generic: U
        - generic [ref=e35]:
          - generic [ref=e36]: Code input
          - generic [ref=e37]: "Explain-only mode: Python"
          - textbox "Code input" [ref=e38]:
            - /placeholder: "#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 5;\n    cout << x;\n    return 0;\n}"
            - text: print(5)
      - region "Output" [ref=e39]:
        - generic [ref=e41]:
          - heading "Output" [level=2] [ref=e42]
          - generic [ref=e43]: Explain-only · Python
          - paragraph [ref=e44]: This is where your program shows its result after you click Run.
        - paragraph [ref=e46]: Nothing has been run yet.
    - region "Explanations" [ref=e47]:
      - generic [ref=e49]:
        - heading "Explanations" [level=2] [ref=e50]
        - generic [ref=e51]: Explain-only · Python
        - paragraph [ref=e52]: Friendly guidance will appear here as you type and run your code.
      - article [ref=e56]:
        - generic [ref=e57]: Active explanation
        - 'heading "Line 1: This line performs an instruction" [level=3] [ref=e58]'
        - generic [ref=e59]: print(5)
        - paragraph [ref=e60]: It is a complete line of code, so the program can understand and use it.
        - list [ref=e61]:
          - listitem [ref=e62]: This line is finished, which means it has a complete meaning.
          - listitem [ref=e63]: As the explanation engine grows, this kind of line can receive an even more specific explanation.
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Interpreter Run Mode test', async ({ page }) => {
  4  |   await page.goto('http://localhost:5500');
  5  | 
  6  |   // Type code into your editor (adjust selector!)
  7  |   await page.fill('textarea', 'print(5)');
  8  | 
  9  |   // Click Run button (adjust text if needed)
  10 |   await page.click('text=Run');
  11 | 
  12 |   // Check output appears
> 13 |   await expect(page.locator('#output')).toContainText('5');
     |                                         ^ Error: expect(locator).toContainText(expected) failed
  14 | });
```