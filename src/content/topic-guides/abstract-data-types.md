> An abstract data type describes what a structure can do, without saying how it is built.

## What It Is

An **abstract data type** (ADT) is a promise about behavior. It lists the operations you can perform and what each one does. It says nothing about memory, pointers, or arrays.

A **data structure** is the real thing in memory. It is one way of keeping that promise.

Think of a TV remote. The buttons are the ADT: volume up, volume down, next channel. The circuit board inside is the data structure. You can replace the board with a different design, and the buttons keep working the same way.

## Why It Matters

Separating the two ideas gives you three things:

- **You can reason about a problem first.** "I need last-in, first-out" tells you to use a stack long before you think about code.
- **You can swap the implementation.** A program that only calls `push` and `pop` doesn't care whether the stack uses an array or a linked list.
- **You can compare fairly.** Two structures with the same ADT differ only in speed and memory, so the choice becomes a clear tradeoff.

## Common ADTs

| ADT | Main Operations | Common Structures |
| --- | --- | --- |
| List | get, insert, remove by position | [[Dynamic Arrays]], [[Linked Lists]] |
| [[Stack]] | push, pop, peek | Array, linked list |
| [[Queue]] | enqueue, dequeue, front | [[Circular Queue]], linked list |
| [[Priority Queue]] | insert, remove the smallest | [[Heaps]] |
| Map | put, get, remove by key | [[Hash Tables]], balanced trees |
| Set | add, remove, contains | [[Hash Tables]], balanced trees |

## One ADT, Two Structures

### The Promise

A stack promises three things: `push` adds a value on top, `pop` removes and returns the top value, and `is_empty` says whether anything is left.

### Two Ways to Keep It

Here are two classes that keep that promise. The first stores values in an array. The second links nodes together.

```python
class ArrayStack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def pop(self):
        return self.items.pop()

    def is_empty(self):
        return not self.items


class LinkedStack:
    def __init__(self):
        self.top = None

    def push(self, value):
        self.top = (value, self.top)  # (value, the node below it)

    def pop(self):
        value, self.top = self.top
        return value

    def is_empty(self):
        return self.top is None


def reverse(values, stack):
    # This works with either stack, because it only uses the promised operations.
    for value in values:
        stack.push(value)
    result = []
    while not stack.is_empty():
        result.append(stack.pop())
    return result

print(reverse([1, 2, 3], ArrayStack()))  # [3, 2, 1]
print(reverse([1, 2, 3], LinkedStack()))  # [3, 2, 1]
```

The `reverse` function never changes. That is the whole point of an ADT.

## Comparing the Costs

| Operation | ArrayStack | LinkedStack |
| --- | --- | --- |
| push | O(1) on average, O(n) when the array must grow | O(1) always |
| pop | O(1) | O(1) |
| Extra memory | Unused spare slots | One link per value |

The behavior is identical, and only the costs differ. You choose based on which cost matters more to your program.

## Common Mistakes

- **Treating the two words as the same thing.** "Stack" is an ADT. "Array" is a data structure. An array can implement a stack, but it isn't one.
- **Reaching past the promise.** If your code reads `stack.items[0]` directly, it now depends on the array, and you lose the freedom to swap the structure.
- **Forgetting empty cases.** Decide what `pop` does on an empty stack, and make it part of the promise.
