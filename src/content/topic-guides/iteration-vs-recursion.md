> The same problem solved with a loop and with recursion, comparing the steps and memory each one uses.

## What It Is

There are two ways to repeat work:

- **Iteration** uses a loop. A variable changes each time around, and the loop stops when a condition fails.
- **Recursion** uses a function that calls itself on a smaller version of the problem, until it reaches a case it can answer directly.

Anything you can write one way, you can also write the other way. The choice is about clarity and cost.

## Side by Side

Here is the factorial of `n`, written both ways.

```python
def factorial_loop(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def factorial_recursive(n):
    if n <= 1:
        return 1                            # base case
    return n * factorial_recursive(n - 1)   # smaller problem

print(factorial_loop(5))  # 120
print(factorial_recursive(5))  # 120
```

Both do the same multiplications. The recursive version needs extra memory, because every call waits on the stack for the one below it to finish.

## How They Compare

| | Iteration | Recursion |
| --- | --- | --- |
| Repeats with | A loop | Function calls |
| Keeps state in | Local variables | The [[Recursion and the Call Stack\|call stack]] |
| Stops when | The loop condition fails | It reaches the base case |
| Extra memory | Usually O(1) | O(depth) stack frames |
| Speed | Slightly faster | Each call has a small cost |
| If you forget to stop | The program hangs | The stack overflows |
| Reads best for | Simple repetition | Trees and branching problems |

## When Recursion Is the Better Fit

Recursion shines when a problem **branches**, so that each step leads to several smaller problems. Walking a tree is the classic example. The recursive code mirrors the shape of the data.

```python
def tree_sum(node):
    if node is None:
        return 0
    value, left, right = node
    return value + tree_sum(left) + tree_sum(right)

tree = (1, (2, None, None), (3, None, None))
print(tree_sum(tree))  # 6
```

A loop can do this too, but it has to manage its own [[Stack]], which is exactly what the recursion was doing for you.

```python
def tree_sum_loop(root):
    total = 0
    stack = [root]
    while stack:
        node = stack.pop()
        if node is not None:
            value, left, right = node
            total += value
            stack.append(left)
            stack.append(right)
    return total

print(tree_sum_loop((1, (2, None, None), (3, None, None))))  # 6
```

## When Iteration Is the Better Fit

Use a loop when the work is a straight line with no branching, or when the depth could be very large. Summing a million numbers with recursion would need a million stack frames, and most languages stop long before that. Python's default limit is about 1,000 calls.

## Tail Recursion

A call is a **tail call** when it is the very last thing a function does, with nothing left to compute afterward.

```python
def factorial_tail(n, result=1):
    if n <= 1:
        return result
    return factorial_tail(n - 1, n * result)  # nothing happens after this call

print(factorial_tail(5))  # 120
```

Some languages reuse the current frame for a tail call, so this uses `O(1)` memory like a loop. C and C++ compilers often do this when optimizing. Python and Java don't, so there it still uses `O(n)` frames.

## Common Mistakes

- **Assuming recursion is slower in Big-O terms.** The growth rate is usually the same, and only the constant and the memory differ. Fibonacci is the famous exception, and that is because the naive version repeats work. See [[Fibonacci (DP)]].
- **Using recursion on unbounded depth.** A linked list of a million nodes is a poor fit for recursion, even though the code looks neat.
- **Forgetting the base case.** Without one, or if a call doesn't move toward it, the recursion never stops.
