> The two ways to reuse smaller answers: saving results from the top down, or filling a table from the bottom up.

## What It Is

**Dynamic programming** solves a problem by combining answers to smaller versions of it, and it never solves the same smaller version twice. There are two ways to do that:

- **Memoization (top-down):** write the recursion as normal, but save each answer the first time you compute it.
- **Tabulation (bottom-up):** fill in a table, starting from the smallest answers and working up.

Both give the same answers with the same Big-O time. The choice is about convenience and practical details.

## When Dynamic Programming Applies

A problem needs two properties:

| Property | Meaning |
| --- | --- |
| **Overlapping subproblems** | The same smaller questions come up repeatedly |
| **Optimal substructure** | The best answer can be built from best answers to smaller questions |

## Worked Example: Paths on a Grid

Starting at the top-left of a grid, moving only right or down, how many paths reach the bottom-right?

To reach a cell, you must come from above or from the left. So:

```text
paths(r, c) = paths(r - 1, c) + paths(r, c - 1)
paths(0, c) = 1 and paths(r, 0) = 1
```

### Memoization

The code follows the formula directly. The dictionary is the only addition.

```python
def paths_memo(r, c, saved=None):
    if saved is None:
        saved = {}
    if r == 0 or c == 0:
        return 1
    if (r, c) not in saved:
        saved[(r, c)] = paths_memo(r - 1, c, saved) + paths_memo(r, c - 1, saved)
    return saved[(r, c)]

print(paths_memo(2, 2))  # 6
print(paths_memo(16, 16))  # 601080390
```

### Tabulation

The same formula fills in a table, in an order where each needed cell is already done.

```python
def paths_table(rows, cols):
    table = [[1] * (cols + 1) for _ in range(rows + 1)]
    for r in range(1, rows + 1):
        for c in range(1, cols + 1):
            table[r][c] = table[r - 1][c] + table[r][c - 1]
    return table[rows][cols]

print(paths_table(2, 2))  # 6
print(paths_table(16, 16))  # 601080390
```

| r \ c | 0 | 1 | 2 |
| --- | --- | --- | --- |
| 0 | 1 | 1 | 1 |
| 1 | 1 | 2 | 3 |
| 2 | 1 | 3 | 6 |

## How They Compare

| | Memoization | Tabulation |
| --- | --- | --- |
| Direction | From the big problem, down | From the smallest problems, up |
| Style | Recursive | Loops |
| Which subproblems | Only the ones needed | All of them |
| Order to work out | Happens by itself | You must choose it |
| Stack overflow risk | Yes, on deep problems | No |
| Speed in practice | A bit slower, from calls | A bit faster |
| Saving memory | Hard | Often easy |
| Easiest to write | Usually this one | Takes more thought |

## Saving Memory With Tabulation

If each row depends only on the row above, you can throw the older rows away. That is hard to do with memoization, since you don't control the order.

```python
def paths_small(rows, cols):
    row = [1] * (cols + 1)
    for _ in range(rows):
        for c in range(1, cols + 1):
            row[c] += row[c - 1]
    return row[cols]

print(paths_small(2, 2))  # 6
```

This takes the space from `O(rows × cols)` down to `O(cols)`.

## When Memoization Wins: Few Subproblems Needed

Tabulation solves every subproblem, even ones the answer doesn't use. If only a small part of the table is reached, memoization can be much faster.

```python
def count_calls(amount, coins):
    # Fewest coins, counting how many different amounts are really visited.
    saved = {}
    def best(left):
        if left == 0:
            return 0
        if left not in saved:
            saved[left] = min((1 + best(left - c) for c in coins if c <= left), default=float("inf"))
        return saved[left]
    return best(amount), len(saved)

print(count_calls(1000, [500, 200]))  # (2, 8)
```

To make 1,000 from coins of 500 and 200, memoization visits only 8 amounts. A table would fill in all 1,000.

## A Recipe for Any DP Problem

1. **Define the state.** What does `dp[i]` or `dp[i][j]` mean, in one sentence?
2. **Write the recurrence.** How does an answer depend on smaller ones?
3. **Set the base cases.** What can you answer directly?
4. **Choose the order.** For tabulation, every dependency must be computed first.
5. **Find the answer.** Which cell holds it?

Writing the memoized version first is often the easiest way to get the recurrence right. You can convert it to a table later.

## Complexity

For both styles, the time is:

```text
(number of different subproblems) × (work per subproblem)
```

| Problem | Subproblems | Work per Subproblem | Time |
| --- | --- | --- | --- |
| [[Fibonacci (DP)]] | n | O(1) | O(n) |
| [[Coin Change]] | Amount A | n coins | O(n × A) |
| [[0/1 Knapsack]] | n × W | O(1) | O(n × W) |
| [[Matrix Chain Multiplication]] | n² | O(n) | O(n³) |

## Common Mistakes

- **Sharing the saved dictionary by accident.** In Python, a default like `saved={}` is shared between calls, which can return stale answers when the inputs differ. Use `None`, as above.
- **Using a bad key.** The key must include everything that changes the answer. Otherwise, different problems get the same saved result.
- **The wrong fill order.** A table cell can't use a cell that hasn't been filled in yet.
- **Calling it DP without overlap.** If subproblems never repeat, saving does nothing. That is plain [[Divide and Conquer]].
