> Rewriting a calculation between infix, prefix, and postfix, in all six directions, using a stack.

## What It Is

The same calculation can be written in three ways. The only difference is where the operator goes.

| Notation | Operator Goes | Example | Parentheses |
| --- | --- | --- | --- |
| **Infix** | Between its operands | `A + B * C` | Sometimes needed |
| **Prefix** | Before its operands | `+ A * B C` | Never needed |
| **Postfix** | After its operands | `A B C * +` | Never needed |

People write infix, but it is hard for a computer to read, because the order of work depends on precedence and parentheses. Prefix and postfix spell out the order directly, which makes them simple to evaluate. See [[Expression Evaluator]].

With three notations, there are six conversions. Every one of them uses a [[Stack]].

| From | To | Method |
| --- | --- | --- |
| Infix | Postfix | Operators wait on a stack: the shunting yard |
| Infix | Prefix | An operator stack and an operand stack, or reversing |
| Postfix | Infix or Prefix | A stack of finished pieces, reading from the left |
| Prefix | Infix or Postfix | A stack of finished pieces, reading from the right |

## Infix to Postfix

This is the **shunting yard algorithm**, invented by Edsger Dijkstra. The name comes from a railway yard, where cars move aside onto a side track and come back in a different order.

Operands keep their order, and go straight to the output. Operators can't go out right away, because a later operator might need to run first. So they wait on the stack, which acts as the side track.

Read the tokens from left to right.

1. An **operand** goes straight to the output.
2. An **operator** first pops every operator that must run before it, and then goes on the stack.
3. An **opening parenthesis** goes on the stack, and acts as a wall.
4. A **closing parenthesis** pops to the output until it reaches its opening one, and both are discarded.
5. When the input ends, everything left on the stack is popped to the output.

### When Does an Operator Pop?

The operator on top of the stack pops if:

- It binds **tighter** than the incoming one, or
- They are **equal**, and they group from the **left**.

| Operators | Strength | Equal Ones Group |
| --- | --- | --- |
| `+` `-` | Weakest | From the left |
| `*` `/` | Stronger | From the left |
| Unary minus | Stronger still | From the right |
| `^` | Strongest | From the right |

This explains two examples. `10 - 4 - 3` pops the first `-`, because subtraction groups from the left. `2 ^ 3 ^ 2` keeps the first `^` waiting, because powers group from the right.

### Worked Example: `A + B * C`

| Read | Action | Stack | Output |
| --- | --- | --- | --- |
| `A` | To the output | | A |
| `+` | Stack is empty, so push | + | A |
| `B` | To the output | + | A B |
| `*` | * binds tighter than +, so + waits. Push | + * | A B |
| `C` | To the output | + * | A B C |
| End | Pop everything | | A B C * + |

### Worked Example: `(A + B) * C`

| Read | Action | Stack | Output |
| --- | --- | --- | --- |
| `(` | Push the wall | ( | |
| `A` | To the output | ( | A |
| `+` | The wall stops any popping. Push | ( + | A |
| `B` | To the output | ( + | A B |
| `)` | Pop back to the wall, and drop both | | A B + |
| `*` | Stack is empty, so push | * | A B + |
| `C` | To the output | * | A B + C |
| End | Pop everything | | A B + C * |

The parentheses are gone, and `+` now comes before `*`. The grouping is carried by the order.

## Infix to Prefix

There are two common methods, and they give the same answer.

### Method 1: Two Stacks

Keep operators on one stack, and finished pieces of prefix on another. The rules for when an operator runs are exactly the same as in the shunting yard.

When an operator runs, pop two pieces. The first one popped is the right side. Then push `operator left right` as one new piece.

| Read | Action | Operators | Pieces |
| --- | --- | --- | --- |
| `A` | A finished piece | | A |
| `+` | Push | + | A |
| `B` | A finished piece | + | A, B |
| `*` | * binds tighter, so + waits. Push | + * | A, B |
| `C` | A finished piece | + * | A, B, C |
| End | Apply * | + | A, * B C |
| End | Apply + | | + A * B C |

### Method 2: Reverse, Convert, Reverse

This is the method many textbooks teach.

1. Reverse the tokens, and swap each `(` with `)`.
2. Convert to postfix.
3. Reverse the output.

Reading backward flips how operators group, so step 2 needs one change: operators of equal strength **wait**, and only `^` pops. Without that change, `A - B - C` would come out wrong.

```text
Infix:             A + B * C
Reversed:          C * B + A
Converted:         C B * A +
Reversed again:    + A * B C
```

## Postfix to Infix or Prefix

Postfix is the easiest input, because an operator always comes after its operands. By the time you read an operator, both of its pieces are already on the stack.

1. Read from the **left**.
2. An operand goes on the stack.
3. An operator pops two pieces. The **first one popped is the right side**. Join them, and push the result.
4. One piece remains at the end, and that is the answer.

Only the way the pieces join changes with the target.

| Target | Join As | `A B + C *` Gives |
| --- | --- | --- |
| Infix | `(left op right)` | `((A + B) * C)` |
| Prefix | `op left right` | `* + A B C` |

The fully parenthesized form is always correct. To keep only the parentheses you need, add them around a piece only when its operator is weaker than the new one, or equal to it on the side that would change the grouping. That gives `(A + B) * C`.

### Worked Example: `A B + C *` to Infix

| Read | Action | Stack |
| --- | --- | --- |
| `A` | Push | A |
| `B` | Push | A, B |
| `+` | Pop B, then A | (A + B) |
| `C` | Push | (A + B), C |
| `*` | Pop C, then (A + B) | ((A + B) * C) |

## Prefix to Infix or Postfix

Prefix is postfix seen in a mirror, so the method is the same with two changes.

1. Read from the **right**.
2. When an operator pops two pieces, the **first one popped is the left side**.

### Worked Example: `* + A B - C D` to Postfix

| Read | Action | Stack |
| --- | --- | --- |
| `D` | Push | D |
| `C` | Push | D, C |
| `-` | Pop C (left), then D (right) | C D - |
| `B` | Push | C D -, B |
| `A` | Push | C D -, B, A |
| `+` | Pop A (left), then B (right) | C D -, A B + |
| `*` | Pop A B + (left), then C D - (right) | A B + C D - * |

## Code

```python
PRECEDENCE = {"+": 1, "-": 1, "*": 2, "/": 2, "^": 3}

def should_pop(top, incoming):
    if top == "(":
        return False
    if PRECEDENCE[top] > PRECEDENCE[incoming]:
        return True
    return PRECEDENCE[top] == PRECEDENCE[incoming] and incoming != "^"

def infix_to_postfix(tokens):
    output, stack = [], []
    for token in tokens:
        if token == "(":
            stack.append(token)
        elif token == ")":
            while stack[-1] != "(":
                output.append(stack.pop())
            stack.pop()                          # drop the wall
        elif token in PRECEDENCE:
            while stack and should_pop(stack[-1], token):
                output.append(stack.pop())
            stack.append(token)
        else:
            output.append(token)                 # an operand
    while stack:
        output.append(stack.pop())
    return " ".join(output)

def infix_to_prefix(tokens):
    pieces, stack = [], []
    def apply():
        op = stack.pop()
        right = pieces.pop()                     # the first popped is the right side
        left = pieces.pop()
        pieces.append(f"{op} {left} {right}")
    for token in tokens:
        if token == "(":
            stack.append(token)
        elif token == ")":
            while stack[-1] != "(":
                apply()
            stack.pop()
        elif token in PRECEDENCE:
            while stack and should_pop(stack[-1], token):
                apply()
            stack.append(token)
        else:
            pieces.append(token)
    while stack:
        apply()
    return pieces[0]

def from_postfix(tokens, join):
    stack = []
    for token in tokens:
        if token in PRECEDENCE:
            right = stack.pop()                  # the first popped is the right side
            left = stack.pop()
            stack.append(join(token, left, right))
        else:
            stack.append(token)
    return stack[0]

def from_prefix(tokens, join):
    stack = []
    for token in reversed(tokens):
        if token in PRECEDENCE:
            left = stack.pop()                   # the first popped is the left side
            right = stack.pop()
            stack.append(join(token, left, right))
        else:
            stack.append(token)
    return stack[0]

to_infix = lambda op, left, right: f"({left} {op} {right})"
to_prefix = lambda op, left, right: f"{op} {left} {right}"
to_postfix = lambda op, left, right: f"{left} {right} {op}"

print(infix_to_postfix("A + B * C".split()))  # A B C * +
print(infix_to_postfix("( A + B ) * C".split()))  # A B + C *
print(infix_to_postfix("10 - 4 - 3".split()))  # 10 4 - 3 -
print(infix_to_postfix("2 ^ 3 ^ 2".split()))  # 2 3 2 ^ ^
print(infix_to_prefix("( A - B / C ) * ( A / K - L )".split()))  # * - A / B C - / A K L
print(from_postfix("A B + C *".split(), to_infix))  # ((A + B) * C)
print(from_postfix("A B + C *".split(), to_prefix))  # * + A B C
print(from_prefix("* + A B C".split(), to_infix))  # ((A + B) * C)
print(from_prefix("* + A B - C D".split(), to_postfix))  # A B + C D - *
```

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Tokens handled | O(n) | Each token is pushed and popped at most once |
| Time, joining text | O(n²) in the worst case | Each join copies the text of both pieces |
| Space | O(n) | The stack holds at most every token |

The shunting yard stays O(n) overall, because it only appends tokens to the output. The other conversions build longer pieces of text as they go, and that copying is where the extra cost comes from. Building a tree instead of text avoids it. See [[Expression Tree]].

## Unary Minus

A minus sign is **unary** if there is no value directly before it: at the start, after another operator, or after `(`. It takes only one operand, so it needs its own symbol in prefix and postfix. The simulator writes it as `~`.

| Infix | Postfix | Why |
| --- | --- | --- |
| `-2 ^ 2` | `2 2 ^ ~` | `^` is stronger, so the result is −4 |
| `2 ^ -2` | `2 2 ~ ^` | The minus applies to the exponent |
| `(-2) ^ 2` | `2 ~ 2 ^` | The parentheses make the result 4 |

## Try It

The simulator handles all six conversions, with letters or numbers. It shows the stacks, each comparison it makes, and the result, and it finishes with the expression in every notation and as a tree.

## Common Mistakes

- **Using `>` for every comparison.** Equal left-grouping operators must pop too, or `10 - 4 - 3` is read as `10 - (4 - 3)`.
- **Popping for `^`.** Equal `^` operators must not pop, because they group from the right.
- **Popping past a parenthesis.** The opening parenthesis is a wall. Stop there.
- **Mixing up left and right.** In postfix input, the first popped is the right side. In prefix input, it is the left side. Getting this wrong turns `A - B` into `B - A`.
- **Reading prefix from the left.** Prefix must be read from the right, so that the operands are on the stack before their operator.
- **Using the normal pop rule after reversing.** The reverse method flips how operators group, so equal operators must wait.
- **Forgetting the end.** The operators left on the stack must still be handled.
