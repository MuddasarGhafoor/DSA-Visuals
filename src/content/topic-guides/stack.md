> A last-in, first-out structure, where values are pushed onto and popped off the top.

## What It Is

A **stack** works like a pile of plates: you add to the top, and you take from the top. The last plate added is the first one you can remove. This rule is called **last in, first out** (LIFO).

```text
push 30 ->  | 30 |  <- top
            | 20 |
            | 10 |
            +----+
```

## Operations

| Operation | What It Does | Cost |
| --- | --- | --- |
| push(value) | Puts a value on top | O(1) |
| pop() | Removes and returns the top value | O(1) |
| peek() | Reads the top value without removing it | O(1) |
| is_empty() | Says whether the stack has any values | O(1) |

## Ways to Build One

A stack is an [[Abstract Data Types|abstract data type]], so it can be built in more than one way.

| Built On | push and pop | Good | Not So Good |
| --- | --- | --- | --- |
| [[Dynamic Arrays\|Dynamic array]] | O(1) amortized | Fast, little memory | Occasional copy when it grows |
| [[Linked Lists\|Linked list]] | O(1) | No copying | One extra link per value |

```python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def pop(self):
        if not self.items:
            raise IndexError("stack is empty")
        return self.items.pop()

    def peek(self):
        return self.items[-1]

    def is_empty(self):
        return not self.items

stack = Stack()
stack.push(10)
stack.push(20)
print(stack.peek())  # 20
print(stack.pop())  # 20
print(stack.pop())  # 10
print(stack.is_empty())  # True
```

## Worked Examples

### Reversing

Pushing values and then popping them gives them back in the opposite order.

```python
def reverse_text(text):
    stack = list(text)
    return "".join(stack.pop() for _ in range(len(stack)))

print(reverse_text("stack"))  # kcats
```

### The Next Greater Element

For each value in a list, find the next value to its right that is larger. A stack holds the values still waiting for an answer.

```python
def next_greater(values):
    answer = [-1] * len(values)
    waiting = []                         # indexes that have no answer yet
    for i, value in enumerate(values):
        while waiting and values[waiting[-1]] < value:
            answer[waiting.pop()] = value
        waiting.append(i)
    return answer

print(next_greater([2, 1, 5, 3, 6]))  # [5, 5, 6, 6, -1]
```

Each index is pushed and popped at most once, so this is `O(n)`, not `O(n²)`.

## Where It Is Used

Whenever the most recent thing must be dealt with first, a stack fits.

- **Function calls.** The [[Recursion and the Call Stack|call stack]] holds a frame for each active call.
- **Undo.** The last action is the first one undone.
- **Brackets.** The most recently opened bracket must close first. See [[Balanced Parentheses]].
- **Expressions.** Postfix evaluation and [[Notation Conversion|infix conversion]] both rely on stacks. See [[Expression Evaluator]].
- **[[DFS|Depth-first search]]** and [[Backtracking]], which return to the most recent choice.
- **The back button.** The page you just left is the one you return to.

## Common Mistakes

- **Popping an empty stack.** This is called an **underflow**. Check first, or decide on a clear error.
- **Reading the wrong end.** With an array, the top is the *end*. Using the start of the array makes every push and pop `O(n)`.
- **Forgetting that pop removes.** Use `peek` when you only want to look.
- **Getting operand order wrong.** When evaluating `8 4 -`, the first value popped is the right operand: 8 − 4, not 4 − 8.
