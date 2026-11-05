> Writing the cost of a recursive algorithm as an equation, then solving it by substitution or a recursion tree.

## What It Is

A loop's cost is easy to read: count how many times it runs. A recursive function is harder, because its cost depends on itself. A **recurrence** captures that by defining the cost in terms of smaller inputs.

## Writing a Recurrence

Look at the function and ask three questions:

1. How many recursive calls does it make?
2. How big is the input to each call?
3. How much work does it do outside those calls?

```python
def binary_search(values, target, low, high):
    if low > high:
        return -1
    mid = (low + high) // 2                                     # constant work
    if values[mid] == target:
        return mid
    if values[mid] < target:
        return binary_search(values, target, mid + 1, high)     # one call, half the size
    return binary_search(values, target, low, mid - 1)

print(binary_search([1, 3, 5, 7, 9], 7, 0, 4))  # 3
```

This makes one call on half the input, plus constant work, so `T(n) = T(n/2) + O(1)`.

## Common Recurrences

| Recurrence | Example | Solution |
| --- | --- | --- |
| `T(n) = T(n/2) + 1` | [[Binary Search]] | O(log n) |
| `T(n) = T(n - 1) + 1` | Sum of a list | O(n) |
| `T(n) = 2T(n/2) + 1` | Visiting a balanced tree | O(n) |
| `T(n) = 2T(n/2) + n` | [[Merge Sort]] | O(n log n) |
| `T(n) = T(n - 1) + n` | [[Selection Sort]] | O(n²) |
| `T(n) = 2T(n - 1) + 1` | [[Tower of Hanoi]] | O(2ⁿ) |
| `T(n) = T(n - 1) + T(n - 2) + 1` | Naive [[Fibonacci (DP)\|Fibonacci]] | O(1.62ⁿ) |

## Three Ways to Solve One

### Expanding Step by Step

Keep substituting the recurrence into itself until you see the pattern.

```text
T(n) = T(n - 1) + n
     = T(n - 2) + (n - 1) + n
     = T(n - 3) + (n - 2) + (n - 1) + n
     ...
     = T(0) + 1 + 2 + ... + n
     = n(n + 1) / 2, which is O(n²)
```

### The Recursion Tree

Draw each call as a node labeled with its own work, then add up each level. Here is `T(n) = 2T(n/2) + n`:

```text
Level 0:              n                 total: n
Level 1:         n/2     n/2            total: n
Level 2:       n/4 n/4 n/4 n/4          total: n
...
Level log n:   1 1 1 1 1 ... 1          total: n
```

Each level adds up to `n`, and there are about `log₂ n` levels. So the total is `O(n log n)`.

### Guess and Prove

Guess an answer, then prove it by induction. This is called the **substitution method**.

Claim: for `T(n) = 2T(n/2) + n`, we have `T(n) ≤ c · n log₂ n`. Assume it is true for `n/2`, then substitute:

```text
T(n) ≤ 2 · c(n/2) log₂(n/2) + n
     = c · n (log₂ n - 1) + n
     = c · n log₂ n - c · n + n
     ≤ c · n log₂ n     whenever c ≥ 1
```

### The Shortcut

For the form `T(n) = aT(n/b) + f(n)`, the [[Master Theorem]] gives the answer directly.

## Checking With Real Numbers

When in doubt, compute it. If the formula is right, the two columns will match.

```python
def hanoi_moves(n):
    if n == 0:
        return 0
    return 2 * hanoi_moves(n - 1) + 1

print([hanoi_moves(n) for n in range(1, 6)])  # [1, 3, 7, 15, 31]
print([2 ** n - 1 for n in range(1, 6)])  # [1, 3, 7, 15, 31]
```

## Common Mistakes

- **Forgetting the base case.** A recurrence needs one. It usually doesn't change the Big-O answer, but it is part of a correct definition.
- **Counting calls but not their sizes.** `2T(n/2)` is `O(n)` with constant extra work, while `2T(n - 1)` is exponential. Both make two calls.
- **Treating work per level as constant.** In `T(n) = T(n - 1) + n`, each level does a different amount of work, so you need to add them up.
