> Checking that every bracket has a partner, in the right order, using a stack.

## What It Is

Text with brackets is **balanced** if every opening bracket has a matching closing bracket, and they close in the right order.

| Text | Balanced? | Why |
| --- | --- | --- |
| `()[]{}` | Yes | Each pair closes properly |
| `{[()]}` | Yes | Pairs are nested properly |
| `([)]` | No | `[` is opened last, but `)` tries to close first |
| `(()` | No | One `(` is never closed |
| `())` | No | A `)` arrives with nothing open |

Every compiler and code editor does this check, and it is the classic first use of a [[Stack]].

## Why a Stack and Not a Counter

For one kind of bracket, a counter is enough: add 1 on `(`, subtract 1 on `)`, and make sure it never goes below 0 and finishes at 0.

With several kinds, a counter fails. In `([)]`, the totals are all fine. Only the **order** is wrong.

A stack keeps that order. **The most recently opened bracket must close first**, which is exactly last in, first out.

## How It Works

Read the text from left to right.

1. If it is an **opening** bracket, push it onto the stack.
2. If it is a **closing** bracket:
   - If the stack is empty, there is nothing to close, so it fails.
   - If the top of the stack is the wrong type, it fails.
   - Otherwise, pop the top.
3. Skip any other character.
4. At the end, the stack must be empty. If not, something was never closed.

## Worked Examples

### A Balanced Case: `{[()]}`

| Read | Action | Stack, Bottom to Top |
| --- | --- | --- |
| `{` | Push | `{` |
| `[` | Push | `{ [` |
| `(` | Push | `{ [ (` |
| `)` | Matches `(`, so pop | `{ [` |
| `]` | Matches `[`, so pop | `{` |
| `}` | Matches `{`, so pop | Empty |

The stack is empty at the end, so it is **balanced**.

### A Failing Case: `([)]`

| Read | Action | Stack, Bottom to Top |
| --- | --- | --- |
| `(` | Push | `(` |
| `[` | Push | `( [` |
| `)` | The top is `[`, which doesn't match | **Stop: not balanced** |

## Code

```python
def check_brackets(text):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for position, char in enumerate(text, 1):
        if char in "([{":
            stack.append((char, position))
        elif char in pairs:
            if not stack:
                return f"Unmatched {char} at position {position}"
            top, opened_at = stack.pop()
            if top != pairs[char]:
                return f"{char} at position {position} can't close {top} from position {opened_at}"
    if stack:
        char, position = stack[-1]
        return f"{char} at position {position} was never closed"
    return "Balanced"

print(check_brackets("{[()]}"))  # Balanced
print(check_brackets("f(a[0], {b: 1})"))  # Balanced
print(check_brackets("([)]"))  # ) at position 3 can't close [ from position 2
print(check_brackets("(()"))  # ( at position 1 was never closed
print(check_brackets("())"))  # Unmatched ) at position 3
```

Storing the position with each bracket lets the error message name the exact spot, which is what a compiler does.

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(n) | One pass, with each bracket pushed and popped at most once |
| Space | O(n) | The stack, in the worst case, such as `((((` |

## The Three Ways to Fail

| Problem | Example | When It Is Found |
| --- | --- | --- |
| Wrong type | `([)]` | At the closing bracket |
| Nothing open | `())` | At the closing bracket |
| Never closed | `(()` | At the end |

A common bug is to check only the first two, and forget the check at the end.

## Where It Is Used

- **Code editors:** matching brackets, and warning about missing ones.
- **Compilers:** reporting errors while reading code.
- **Calculators:** checking an expression before working it out. See [[Expression Evaluator]].
- **HTML and XML:** matching opening and closing tags, using the same idea.

## Variations

- **Longest valid run.** Find the longest balanced part of a string of parentheses, by storing positions in the stack.
- **Fewest changes to balance.** Count how many brackets must be added or removed.
- **Ignoring brackets in strings.** A real compiler must skip brackets inside quotes and comments.

## Try It

The simulator shows the stack changing step by step, colors matched pairs by how deep they are, and names the exact problem.

## Common Mistakes

- **Forgetting the check at the end.** `((` never fails during the scan, and it is still unbalanced.
- **Popping from an empty stack.** Check first, or `)` will crash the program.
- **Only counting.** Equal counts don't mean balanced, as `)(` and `([)]` both show.
- **Comparing the wrong way round.** Compare the closing bracket's partner with the top of the stack.
