> A formula that gives the running time of many divide-and-conquer recurrences directly.

## What It Is

Many [[Divide and Conquer]] algorithms have a running time of this form:

```text
T(n) = a · T(n / b) + f(n)
```

| Symbol | Meaning | In Merge Sort |
| --- | --- | --- |
| `a` | How many smaller problems you make (a ≥ 1) | 2 |
| `b` | How much smaller each one is (b > 1) | 2 |
| `f(n)` | Work to split and combine | n |

The **Master Theorem** gives the answer by comparing `f(n)` with one special value.

## The Idea

Picture the recursion as a tree. Two forces compete:

- **The leaves.** The number of leaves is `n^(log_b a)`. Call this exponent `c`, so `c = log_b a`.
- **The work at each level.** This comes from `f(n)`.

Whichever grows faster decides the answer. If they match, every level does about the same work, and you multiply by the number of levels.

## The Three Cases

Let `c = log_b a`, and compare `f(n)` with `n^c`.

### Case 1: The Leaves Win

If `f(n)` grows polynomially slower than `n^c`, that is, `f(n) = O(n^(c - ε))` for some `ε > 0`, then:

```text
T(n) = Θ(n^c)
```

### Case 2: A Tie

If `f(n) = Θ(n^c · logᵏ n)` for some `k ≥ 0`, then:

```text
T(n) = Θ(n^c · log^(k+1) n)
```

The most common version has `k = 0`: when `f(n) = Θ(n^c)`, the answer is `Θ(n^c · log n)`.

### Case 3: The Top Wins

If `f(n)` grows polynomially faster than `n^c`, that is, `f(n) = Ω(n^(c + ε))`, and also `a · f(n/b) ≤ k · f(n)` for some `k < 1` (the *regularity condition*), then:

```text
T(n) = Θ(f(n))
```

## Worked Examples

### Merge Sort

`T(n) = 2T(n/2) + n`. Here `c = log₂ 2 = 1`, so `n^c = n`. And `f(n) = n` matches it. This is Case 2, which gives **Θ(n log n)**.

### Binary Search

`T(n) = T(n/2) + 1`. Here `c = log₂ 1 = 0`, so `n^c = 1`. And `f(n) = 1` matches it. This is Case 2, which gives **Θ(log n)**.

### Case 1 and Case 3 Examples

| Recurrence | c | Compare f(n) | Case | Answer |
| --- | --- | --- | --- | --- |
| `8T(n/2) + n²` | 3 | n² is slower than n³ | 1 | Θ(n³) |
| `7T(n/2) + n²` | 2.81 | n² is slower than n^2.81 | 1 | Θ(n^2.81) |
| `3T(n/2) + n` | 1.58 | n is slower than n^1.58 | 1 | Θ(n^1.58) |
| `2T(n/2) + n log n` | 1 | Matches n, with k = 1 | 2 | Θ(n log² n) |
| `2T(n/2) + n²` | 1 | n² is faster than n | 3 | Θ(n²) |

## Checking It Yourself

You can compute a recurrence directly and watch it follow the formula. This one doubles `n` and checks the ratio to `n log n`.

```python
from math import log2

def merge_sort_cost(n):
    if n <= 1:
        return 1
    return 2 * merge_sort_cost(n // 2) + n

for n in [2 ** 10, 2 ** 15, 2 ** 20]:
    print(round(merge_sort_cost(n) / (n * log2(n)), 2))
# 1.1, 1.07, 1.05: the ratio settles toward a constant, so the cost is Θ(n log n).
```

## When It Doesn't Apply

The theorem only covers the exact form above. It says nothing about these:

- **`T(n) = T(n - 1) + n`.** The size shrinks by subtracting, not dividing. Use the methods in [[Recurrences]], which give `Θ(n²)`.
- **`T(n) = 2T(n/2) + n / log n`.** Here `f(n)` is slower than `n`, but not by a polynomial factor, so it falls in the gap between the cases.
- **`T(n) = T(n/3) + T(2n/3) + n`.** The smaller problems have different sizes. Use a recursion tree.

## Common Mistakes

- **Comparing `f(n)` with `n` rather than with `n^c`.** The comparison is always against the leaf count.
- **Skipping the regularity condition in Case 3.** It almost always holds for simple functions, but it is part of the theorem.
- **Applying it to `T(n) = 2T(n - 1) + 1`.** That is the recurrence for [[Tower of Hanoi]], and it is exponential.
