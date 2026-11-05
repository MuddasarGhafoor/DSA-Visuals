> How a computer works out a calculation: convert it to postfix, then evaluate it with a stack.

## What It Is

Working out `(8 + 4) * 3 - 6 / 2` looks easy to us, because we know the rules: parentheses first, then multiplication and division, and then addition and subtraction. A computer needs a clear method for those rules.

An **expression evaluator** typically works in two stages:

1. **Convert** the expression to postfix, which needs no parentheses and no precedence rules.
2. **Evaluate** the postfix form, using a [[Stack]].

## Three Ways to Write an Expression

The same calculation can be written in three notations. The only difference is where the operator goes.

| Notation | Where the Operator Goes | Add 2 and 3 | (2 + 3) × 4 |
| --- | --- | --- | --- |
| Infix | Between the values | `2 + 3` | `(2 + 3) * 4` |
| Prefix | Before the values | `+ 2 3` | `* + 2 3 4` |
| Postfix | After the values | `2 3 +` | `2 3 + 4 *` |

Infix is how people write math, but it needs parentheses and precedence. Prefix and postfix need neither, because the position of each operator already fixes the order. That is why computers prefer them.

## The Order of Operations

When several operators appear, this decides which runs first.

| Order | Operators | Equal Ones Run | Example |
| --- | --- | --- | --- |
| 1 | `( )` | | `(1 + 2) * 3 = 9` |
| 2 | `^` | Right to left | `2 ^ 3 ^ 2 = 512` |
| 3 | Unary minus | Right to left | `-2 ^ 2 = -4` |
| 4 | `*` `/` | Left to right | `8 / 4 * 2 = 4` |
| 5 | `+` `-` | Left to right | `5 - 2 - 1 = 2` |

## Evaluating Postfix

Postfix evaluation is simple, with just one stack. Read from left to right:

1. If the next piece is a **number**, push it.
2. If it is an **operator**, pop two values, work out the answer, and push that back.
3. When nothing is left to read, the one value on the stack is the result.

### Worked Example: (8 + 4) * 3

In postfix, this is `8 4 + 3 *`.

| Read | What Happens | Stack |
| --- | --- | --- |
| `8` | Push 8 | 8 |
| `4` | Push 4 | 8, 4 |
| `+` | Pop 4 and 8, work out 8 + 4 = 12, push 12 | 12 |
| `3` | Push 3 | 12, 3 |
| `*` | Pop 3 and 12, work out 12 × 3 = 36, push 36 | 36 |

One value is left, so the answer is **36**.

> The first value popped is the **right** side of the calculation. Order doesn't matter for 8 + 4, but `8 4 -` means 8 − 4, not 4 − 8.

## Code

This handles `+ - * / ^` and parentheses. The conversion step is explained in [[Notation Conversion]].

```python
import re

PRECEDENCE = {"+": 1, "-": 1, "*": 2, "/": 2, "^": 3}
RIGHT_TO_LEFT = {"^"}

def to_postfix(expression):
    output, stack = [], []
    for token in re.findall(r"\d+\.?\d*|[-+*/^()]", expression):
        if token[0].isdigit():
            output.append(token)
        elif token == "(":
            stack.append(token)
        elif token == ")":
            while stack[-1] != "(":
                output.append(stack.pop())
            stack.pop()
        else:
            while (stack and stack[-1] != "(" and (
                PRECEDENCE[stack[-1]] > PRECEDENCE[token]
                or (PRECEDENCE[stack[-1]] == PRECEDENCE[token] and token not in RIGHT_TO_LEFT)
            )):
                output.append(stack.pop())
            stack.append(token)
    return output + stack[::-1]

def evaluate_postfix(tokens):
    stack = []
    for token in tokens:
        if token in PRECEDENCE:
            right = stack.pop()
            left = stack.pop()
            if token == "/" and right == 0:
                raise ZeroDivisionError("Division by zero")
            stack.append({
                "+": left + right, "-": left - right, "*": left * right,
                "/": left / right if right else 0, "^": left ** right,
            }[token])
        else:
            stack.append(float(token))
    return stack[0]

def evaluate(expression):
    return evaluate_postfix(to_postfix(expression))

print(to_postfix("(8 + 4) * 3"))  # ['8', '4', '+', '3', '*']
print(evaluate("(8 + 4) * 3"))  # 36.0
print(evaluate("(8 + 4) * 3 - 6 / 2"))  # 33.0
print(evaluate("2 ^ 3 ^ 2"))  # 512.0
print(evaluate("10 - 4 - 3"))  # 3.0
```

## Complexity

| Stage | Time | Space |
| --- | --- | --- |
| Converting to postfix | O(n) | O(n) |
| Evaluating postfix | O(n) | O(n) |
| Total | O(n) | O(n) |

Each token is handled once, and pushed and popped at most once.

## Handling Unary Minus

A minus sign can mean two things. In `5 - 3`, it subtracts. In `-5` or `2 * -3`, it negates, using just one value.

You can tell them apart by what comes before. If there is no value directly before it, such as at the start, or after another operator or `(`, it is **unary**. In postfix, it is often written as `~`, so that it can't be confused with subtraction. The simulator uses this too: `5 ~` means −5.

## Errors to Catch

| Problem | Example | How It Is Found |
| --- | --- | --- |
| Too few values | `2 +` | A pop on an empty stack |
| Too many values | `1 2` | More than one value at the end |
| Unbalanced parentheses | `(2 + 3` | See [[Balanced Parentheses]] |
| Division by zero | `1 / (2 - 2)` | Checked before dividing |

## Try It

The simulator works out your own expression one step at a time. It also shows the [[Expression Tree]] collapsing in step with the stack.

## Common Mistakes

- **Reversing the operands.** The first pop is the right side, and this matters for `-`, `/`, and `^`.
- **Making `^` group from the left.** `2 ^ 3 ^ 2` means `2 ^ (3 ^ 2) = 512`, not `(2 ^ 3) ^ 2 = 64`.
- **Evaluating left to right, with no precedence.** `2 + 3 * 4` is 14, not 20.
- **Comparing floating-point results exactly.** `0.1 + 0.2` isn't exactly `0.3` in floating point.
