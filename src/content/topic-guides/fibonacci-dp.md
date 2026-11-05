> The simplest example of dynamic programming, showing how saving answers turns exponential time into linear time.

## What It Is

The **Fibonacci sequence** starts with 0 and 1, and each number after that is the sum of the two before it.

```text
0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, ...
```

As a rule: `fib(0) = 0`, `fib(1) = 1`, and `fib(n) = fib(n - 1) + fib(n - 2)`.

It looks trivial, but it is the best first example of **dynamic programming**, because it shows the problem that dynamic programming solves.

## The Naive Way and Its Problem

The definition turns straight into code, and the code is terribly slow.

```python
def fib_naive(n):
    if n < 2:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)

print(fib_naive(10))  # 55
```

Look at the calls it makes for `fib(5)`:

```text
                        fib(5)
                 /                  \
            fib(4)                  fib(3)
           /      \                /      \
       fib(3)    fib(2)        fib(2)    fib(1)
       /    \     /   \        /    \
   fib(2) fib(1) ...  ...    ...    ...
```

`fib(3)` is computed twice, `fib(2)` three times, and so on. The same work is repeated again and again, and the number of calls grows exponentially: about `1.62ⁿ`. `fib(50)` would need tens of billions of calls.

## The Fix: Save the Answers

There are only `n + 1` different questions. Each one needs answering just once.

### Memoization: Top-Down

Keep the recursion, and remember each answer the first time you compute it.

```python
def fib_memo(n, saved={}):
    if n < 2:
        return n
    if n not in saved:
        saved[n] = fib_memo(n - 1) + fib_memo(n - 2)
    return saved[n]

print(fib_memo(50))  # 12586269025
```

### Tabulation: Bottom-Up

Fill a table from the smallest answer upward. No recursion is needed.

```python
def fib_table(n):
    if n < 2:
        return n
    table = [0] * (n + 1)
    table[1] = 1
    for i in range(2, n + 1):
        table[i] = table[i - 1] + table[i - 2]
    return table[n]

print(fib_table(50))  # 12586269025
```

### Saving Memory

Each step uses only the last two values, so you don't need the whole table.

```python
def fib(n):
    previous, current = 0, 1
    for _ in range(n):
        previous, current = current, previous + current
    return previous

print(fib(50))  # 12586269025
print(fib(0))  # 0
print(fib(1))  # 1
```

## Worked Example

Filling the table for `fib(6)`:

| i | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fib(i) | 0 | 1 | 1 | 2 | 3 | 5 | 8 |

Each cell adds the two cells to its left.

## Complexity

| Method | Time | Space |
| --- | --- | --- |
| Naive recursion | O(1.62ⁿ) | O(n), the call stack |
| Memoization | O(n) | O(n) |
| Tabulation | O(n) | O(n) |
| Two variables | O(n) | O(1) |

### The Difference in Practice

| n | Naive Calls | Table Steps |
| --- | --- | --- |
| 10 | 177 | 9 |
| 30 | About 2.7 million | 29 |
| 50 | About 40 billion | 49 |

## What It Teaches

Dynamic programming applies when a problem has two properties, and Fibonacci shows both clearly:

| Property | Meaning | In Fibonacci |
| --- | --- | --- |
| **Overlapping subproblems** | The same smaller problems come up again and again | `fib(3)` is needed many times |
| **Optimal substructure** | The answer is built from answers to smaller problems | `fib(n)` comes from `fib(n - 1)` and `fib(n - 2)` |

The same steps solve harder problems such as the [[0/1 Knapsack]] and [[Edit Distance]]:

1. Define what each smaller answer means.
2. Write how it depends on smaller ones.
3. Solve the base cases.
4. Save the answers, using [[Memoization vs Tabulation|memoization or tabulation]].

## A Faster Way

Fibonacci can be done in `O(log n)` steps with repeated squaring of a 2 × 2 matrix, using the same idea as fast power in [[Divide and Conquer]]. It is rarely needed.

## Common Mistakes

- **Recursing with no saving.** It is the classic example of hidden exponential time.
- **Overflow.** `fib(93)` is too large for a signed 64-bit integer. Python handles this, but C and Java don't.
- **Off-by-one in the start.** Some books start at `fib(1) = 1` and `fib(2) = 1`. Check which is used.
- **A default dictionary that survives calls.** In Python, the `saved={}` default is shared between calls. That is handy here, but it can surprise you elsewhere.
