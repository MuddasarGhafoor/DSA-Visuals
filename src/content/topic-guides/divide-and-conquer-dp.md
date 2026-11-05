> Speeding up dynamic programming when the best split point only moves in one direction.

## What It Is

Some dynamic programming tables are filled with a formula like this:

```text
dp[g][i] = min over all j < i of ( dp[g-1][j] + cost(j, i) )
```

Computing each cell means trying every split point `j`, so the total time is `O(g × n²)`.

**Divide and conquer DP** is an optimization that cuts this to `O(g × n log n)`, for problems where the best split points have a special property.

## The Key Property

Let `opt[i]` be the best split point for position `i`. The trick applies when the split points never move backward:

```text
opt[1] ≤ opt[2] ≤ opt[3] ≤ ... ≤ opt[n]
```

In other words, if you extend the range, the best place to split can only stay the same or move right.

This means that once you know `opt[mid]` for a middle position, everything to the left of `mid` has its split at or before `opt[mid]`, and everything to the right has its split at or after it.

## How It Works

Instead of computing cells from left to right, compute the **middle** cell first.

1. Take the range of positions `[low, high]`, and its possible split points `[opt_low, opt_high]`.
2. Compute `dp[mid]` by trying every split in `[opt_low, opt_high]`. Note the best one, `best_j`.
3. Solve the left half using splits in `[opt_low, best_j]`.
4. Solve the right half using splits in `[best_j, opt_high]`.

```text
Positions:   1 ... mid ... n
Splits:      [opt_low ........ opt_high]
                   |
             best split found
             /                \
  left half uses:          right half uses:
  [opt_low, best_j]        [best_j, opt_high]
```

At each level of the recursion, the split ranges only overlap at their ends, so the total work per level is `O(n)`. With `log n` levels, that gives `O(n log n)` for each group.

## Worked Example

Split a list into `k` contiguous groups, to minimize the sum of the squares of the group totals. Squaring penalizes uneven groups, so this seeks a balanced split.

Take `[1, 3, 2, 6, 4]`, with `k = 2`.

| Split | Group Totals | Cost |
| --- | --- | --- |
| 1 \| 3, 2, 6, 4 | 1, 15 | 1 + 225 = 226 |
| 1, 3 \| 2, 6, 4 | 4, 12 | 16 + 144 = 160 |
| 1, 3, 2 \| 6, 4 | 6, 10 | 36 + 100 = **136** |
| 1, 3, 2, 6 \| 4 | 12, 4 | 144 + 16 = 160 |

The best cost is 136.

## Code

```python
def min_split_cost(values, groups):
    n = len(values)
    totals = [0]
    for value in values:
        totals.append(totals[-1] + value)

    def cost(j, i):
        return (totals[i] - totals[j]) ** 2      # the group holding values[j:i]

    previous = [float("inf")] * (n + 1)
    previous[0] = 0
    for _ in range(groups):
        current = [float("inf")] * (n + 1)

        def solve(low, high, opt_low, opt_high):
            if low > high:
                return
            mid = (low + high) // 2
            best_j = opt_low
            for j in range(opt_low, min(mid, opt_high + 1)):
                candidate = previous[j] + cost(j, mid)
                if candidate < current[mid]:
                    current[mid] = candidate
                    best_j = j
            solve(low, mid - 1, opt_low, best_j)
            solve(mid + 1, high, best_j, opt_high)

        solve(1, n, 0, n - 1)
        previous = current
    return previous[n]

print(min_split_cost([1, 3, 2, 6, 4], 2))  # 136
print(min_split_cost([1, 3, 2, 6, 4], 1))  # 256
print(min_split_cost([5, 5, 5, 5], 2))  # 200
```

## When Does the Property Hold?

You can't assume it. A common sufficient condition is the **quadrangle inequality** on the cost function. For all `a ≤ b ≤ c ≤ d`:

```text
cost(a, c) + cost(b, d) ≤ cost(a, d) + cost(b, c)
```

The squared-total cost above satisfies this, when the values aren't negative.

### A Practical Test

Compute the plain `O(n²)` version on small random inputs, and record `opt[i]`. If it ever decreases, the trick doesn't apply. If it never does, the trick is likely valid, though you should still look for a proof.

## Complexity

| Version | Time | Space |
| --- | --- | --- |
| Plain DP | O(g × n²) | O(n) |
| Divide and conquer DP | O(g × n log n) | O(n) |

Here, `g` is the number of groups, and `n` is the number of values. For `n = 100,000` and `g = 10`, that is 10¹¹ steps against about 1.7 × 10⁷ steps.

## Where It Is Used

- **Partitioning a list** into groups, to minimize a cost.
- **Placing facilities,** such as choosing `k` shop locations along a road.
- **Some scheduling problems** with convex costs.

## Common Mistakes

- **Applying it without the property.** It gives wrong answers with no warning.
- **Letting the split ranges overlap by too much.** Each half must use only its own range, or you lose the speedup.
- **A wrong default for `best_j`.** If no candidate is better, it must still be inside the allowed range, so start it at `opt_low`.
- **Slow cost functions.** The analysis assumes `cost(j, i)` takes `O(1)`. Use running totals, as above.
