> Choosing the order of matrix multiplications that takes the least work.

## What It Is

Matrix multiplication is **associative**: `(AB)C` gives the same result as `A(BC)`. But the amount of work can be very different.

**Matrix chain multiplication** finds the order of multiplications with the lowest cost. It doesn't do the multiplying. It only finds the best way to place the parentheses.

## Why the Order Matters

Multiplying a `p × q` matrix by a `q × r` matrix takes `p × q × r` scalar multiplications, and gives a `p × r` matrix.

Take A as `10 × 30`, B as `30 × 5`, and C as `5 × 60`.

| Order | Step 1 | Step 2 | Total |
| --- | --- | --- | --- |
| `(AB)C` | AB: 10 × 30 × 5 = 1,500 | (AB)C: 10 × 5 × 60 = 3,000 | **4,500** |
| `A(BC)` | BC: 30 × 5 × 60 = 9,000 | A(BC): 10 × 30 × 60 = 18,000 | **27,000** |

The same result costs 6 times as much with the wrong order.

## Why Trying Everything Fails

The number of ways to place parentheses grows very quickly. These are the Catalan numbers: 10 matrices have 4,862 orders, and 20 matrices have about 1.7 billion.

## The Key Idea

Whatever the best order is, it has a **last multiplication**, which splits the chain into two parts. So for each range, try every split point.

The dimensions are given as a list `d`, where matrix `i` is `d[i-1] × d[i]`. Let `cost[i][j]` be the lowest cost to multiply matrices `i` through `j`.

```text
cost[i][i] = 0     (a single matrix needs no multiplying)

cost[i][j] = min over all k from i to j-1 of:
             cost[i][k] + cost[k+1][j] + d[i-1] × d[k] × d[j]
```

The three parts of the sum are the cost of the left part, the cost of the right part, and the cost to multiply the two results together.

## Worked Example

Take dimensions `[40, 20, 30, 10, 30]`, which describe 4 matrices: A1 is 40×20, A2 is 20×30, A3 is 30×10, and A4 is 10×30.

Fill the table by chain length, shortest first.

| Range | Best Split | Cost |
| --- | --- | --- |
| A1 A2 | | 40 × 20 × 30 = 24,000 |
| A2 A3 | | 20 × 30 × 10 = 6,000 |
| A3 A4 | | 30 × 10 × 30 = 9,000 |
| A1 A2 A3 | A1 (A2 A3) | 6,000 + 40 × 20 × 10 = 14,000 |
| A2 A3 A4 | (A2 A3) A4 | 6,000 + 20 × 10 × 30 = 12,000 |
| A1 to A4 | (A1 (A2 A3)) A4 | 14,000 + 40 × 10 × 30 = **26,000** |

## Code

```python
def matrix_chain(d):
    n = len(d) - 1                                   # the number of matrices
    cost = [[0] * (n + 1) for _ in range(n + 1)]
    split = [[0] * (n + 1) for _ in range(n + 1)]
    for length in range(2, n + 1):                   # shortest chains first
        for i in range(1, n - length + 2):
            j = i + length - 1
            cost[i][j] = float("inf")
            for k in range(i, j):
                candidate = cost[i][k] + cost[k + 1][j] + d[i - 1] * d[k] * d[j]
                if candidate < cost[i][j]:
                    cost[i][j] = candidate
                    split[i][j] = k

    def parens(i, j):
        if i == j:
            return f"A{i}"
        k = split[i][j]
        return f"({parens(i, k)} {parens(k + 1, j)})"

    return cost[1][n], parens(1, n)

print(matrix_chain([10, 30, 5, 60]))  # (4500, '((A1 A2) A3)')
print(matrix_chain([40, 20, 30, 10, 30]))  # (26000, '((A1 (A2 A3)) A4)')
```

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(n³) | About n² ranges, with up to n splits each |
| Space | O(n²) | The cost and split tables |
| Trying all orders | O(4ⁿ / n^1.5) | The Catalan numbers |

## The Interval DP Pattern

This is the classic **interval DP**. The shape appears in many problems:

1. The state is a range: `cost[i][j]`.
2. Try every place to split the range.
3. Fill the table by increasing range length.

| Problem | The Range Is | Splitting Means |
| --- | --- | --- |
| Matrix chain | A run of matrices | The last multiplication |
| [[Optimal BST]] | A run of keys | Which key is the root |
| [[Longest Palindromic Subsequence]] | A part of the string | Trimming its ends |

## Why Greedy Fails

Taking the cheapest multiplication first seems sensible, and it fails. Take A as `2 × 2`, B as `2 × 4`, and C as `4 × 3`.

| Method | Step 1 | Step 2 | Total |
| --- | --- | --- | --- |
| Cheapest first, `(AB)C` | AB: 2 × 2 × 4 = 16 | (AB)C: 2 × 4 × 3 = 24 | 40 |
| Best, `A(BC)` | BC: 2 × 4 × 3 = 24 | A(BC): 2 × 2 × 3 = 12 | **36** |

The cheap first step left a more expensive step afterward. There is no simple rule that avoids this, which is why every split must be tried.

## Common Mistakes

- **Using the wrong indexes for the cost.** The cost of the final multiply is `d[i-1] × d[k] × d[j]`.
- **Filling row by row.** Short ranges must be ready first, so loop on length. Row-by-row order reads empty cells.
- **Thinking it multiplies matrices.** It only decides the order. The multiplying happens afterward.
- **Mixing up counts.** A dimension list of length 5 describes 4 matrices.
