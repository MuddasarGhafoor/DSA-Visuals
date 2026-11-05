> How a function that calls itself works, shown as frames being added to and removed from the call stack.

## What It Is

**Recursion** is when a function solves a problem by calling itself on a smaller version of that problem.

Imagine standing in a long line and wanting to know your position. You ask the person in front of you, who asks the person in front of them, and so on. The first person says "I'm number 1". Each person then adds one and passes the answer back. That is recursion: the question travels forward, and the answer travels back.

## The Two Parts

Every recursive function needs both of these:

- **A base case.** The smallest version, answered directly with no further calls.
- **A recursive case.** The function calls itself on a smaller input, and uses the result.

```python
def factorial(n):
    if n <= 1:                     # base case
        return 1
    return n * factorial(n - 1)    # recursive case

print(factorial(4))  # 24
```

## What the Call Stack Does

Each time a function is called, the computer creates a **stack frame**. A frame holds that call's arguments, its local variables, and where to return to. Frames are kept on the **call stack**, which works like any other [[Stack]]: the newest frame is on top, and only the top frame runs.

## Worked Example: factorial(4)

### Going Down

Each call pauses at its multiplication, because it needs the answer from below.

```text
factorial(4)   waiting for factorial(3)
factorial(3)   waiting for factorial(2)
factorial(2)   waiting for factorial(1)
factorial(1)   base case: returns 1
```

The stack is now 4 frames deep, and nothing has been multiplied yet.

### Coming Back Up

Each frame finishes and is removed, then passes its result to the frame below.

| Frame | Receives | Computes | Returns |
| --- | --- | --- | --- |
| factorial(1) | Nothing | Base case | 1 |
| factorial(2) | 1 | 2 × 1 | 2 |
| factorial(3) | 2 | 3 × 2 | 6 |
| factorial(4) | 6 | 4 × 6 | 24 |

## Work Before and After the Call

Where you put the work changes the order it happens in. This small example makes the stack visible.

```python
def count(n, log):
    if n == 0:
        return log
    log.append(f"down {n}")   # runs on the way down
    count(n - 1, log)
    log.append(f"up {n}")     # runs on the way back up
    return log

print(count(2, []))  # ['down 2', 'down 1', 'up 1', 'up 2']
```

## How to Think Recursively

Trying to trace every call in your head quickly gets confusing. Use this instead:

1. **Define what the function returns**, in one sentence.
2. **Handle the smallest input** directly.
3. **Assume the call works on a smaller input**, and use its answer to build yours.

For example, to sum a list: the sum of an empty list is 0, and the sum of any other list is its first value plus the sum of the rest. Trust that second call. You don't need to trace it.

## Complexity

| Measure | Depends On | factorial(n) |
| --- | --- | --- |
| Time | The number of calls × work per call | O(n) |
| Space | The deepest the stack gets | O(n) |

Space is the part people forget. Even with no arrays in sight, recursion uses memory for its frames.

## Common Mistakes

- **No base case, or one that is never reached.** `factorial(-1)` would never stop if the check were `n == 0`. The stack fills up and the program crashes with a **stack overflow**.
- **Not getting smaller.** Calling `f(n)` from `f(n)` never ends. Each call must move toward the base case.
- **Forgetting to return.** Writing `factorial(n - 1)` without `return` throws the answer away.
- **Repeating work.** Branching recursion can recompute the same input again and again. See [[Memoization vs Tabulation]].
