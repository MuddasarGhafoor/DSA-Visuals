> Spending more memory to save time, or the reverse, as hashing and memoization do.

## What It Is

Many problems can be solved faster if you are willing to use more memory, and with less memory if you are willing to wait longer. This is the **time-space tradeoff**.

Think of a printed multiplication table. Looking up 7 × 8 is instant, but the table takes up paper. Working it out yourself needs no paper, but takes longer.

The idea behind most of these speedups is the same: **store something once, so you don't have to work it out again.**

## Worked Example: Finding a Duplicate

Does a list contain the same value twice? Here are three solutions, each with a different balance.

```python
def has_duplicate_slow(values):
    # O(n²) time, O(1) space: compare every pair.
    for i in range(len(values)):
        for j in range(i + 1, len(values)):
            if values[i] == values[j]:
                return True
    return False

def has_duplicate_sorted(values):
    # O(n log n) time, O(n) space: duplicates end up side by side.
    ordered = sorted(values)
    return any(a == b for a, b in zip(ordered, ordered[1:]))

def has_duplicate_fast(values):
    # O(n) time, O(n) space: remember everything seen so far.
    seen = set()
    for value in values:
        if value in seen:
            return True
        seen.add(value)
    return False

print(has_duplicate_slow([3, 1, 4, 1]))  # True
print(has_duplicate_sorted([3, 1, 4, 1]))  # True
print(has_duplicate_fast([3, 1, 4]))  # False
```

| Solution | Time | Extra Space | For 1,000,000 Values |
| --- | --- | --- | --- |
| Compare every pair | O(n²) | O(1) | Several minutes, almost no memory |
| Sort, then scan | O(n log n) | O(n) | Under a second, a full copy |
| Remember in a set | O(n) | O(n) | Fastest, memory for a [[Hash Tables\|hash table]] |

## Common Forms of the Tradeoff

### Caching Answers

Save the result of a calculation the first time, and reuse it. [[Memoization vs Tabulation|Memoization]] uses this to turn an exponential [[Fibonacci (DP)|Fibonacci]] into a linear one.

### Building an Index

Spend memory on a lookup structure ahead of time, so that searches become fast. A [[Hash Tables|hash table]] gives `O(1)` lookups in exchange for extra slots. A database index works the same way.

### Precomputing

Work out answers before they are asked for. For example, store a running total of an array, so that the sum of any range takes one subtraction and no loop.

```python
def build_totals(values):
    totals = [0]
    for value in values:
        totals.append(totals[-1] + value)
    return totals

def range_sum(totals, low, high):
    return totals[high + 1] - totals[low]

totals = build_totals([2, 4, 6, 8])
print(range_sum(totals, 1, 3))  # 18
```

### Going the Other Way

Sometimes memory is the scarce resource, so you give up time to save it.

- **Compression** stores data in less space, and takes time to decompress.
- **[[Bit Array|Bit arrays]]** pack many true-or-false values together, and take a little extra work to read each one.
- **Rolling arrays** in dynamic programming keep only the last row of a table. See [[Space Complexity]].

## How to Choose

Ask these questions:

1. **What is the limit?** An answer that takes an hour may be fine for a nightly report, and useless for a web page.
2. **How often does it run?** Precomputing pays off when the same work repeats many times.
3. **How much memory is really available?** An `O(n)` set is no use if `n` values don't fit.
4. **Can it get better on both sides?** Not everything is a tradeoff. A better algorithm can improve time and space together.

## Common Mistakes

- **Assuming more memory always helps.** A cache only helps if the same questions come back.
- **Ignoring the cost to build.** An index takes time to create and keep up to date, so it may not be worth it for a one-time search.
- **Saving memory too early.** In most programs, memory is cheap compared to the time of the people waiting. Measure first.
