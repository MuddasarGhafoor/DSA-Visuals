> Finding the cheapest route across a grid, moving only right or down.

## What It Is

Each cell of a grid has a cost. Start at the top-left corner, and reach the bottom-right corner, moving only **right** or **down**. The cost of a route is the sum of the cells it passes through. **What is the cheapest route?**

```text
1  3  1
1  5  1
4  2  1
```

Here, the best route is 1 → 3 → 1 → 1 → 1, for a total of **7**.

## Why Greedy Fails

Always stepping to the cheaper neighbor can lead into an expensive area later. In this grid, greedy goes down first, since 1 is less than 3:

| Route | Cells | Total |
| --- | --- | --- |
| Greedy | 1, 1, 4, 2, 1 | 9 |
| Best | 1, 3, 1, 1, 1 | 7 |

The cheap first step led to the expensive 4.

## Why Trying Everything Fails

A grid of `n × m` has many routes: a 20 × 20 grid has about 35 billion. Yet many routes share the same parts, so the same subproblems repeat, which makes this a good fit for dynamic programming.

## The Key Idea

To reach a cell, the last move came from either above or the left. So the cheapest way to reach a cell is its own cost, plus the cheaper of those two.

```text
best[r][c] = cost[r][c] + min( best[r-1][c],  best[r][c-1] )
```

The first row can only be reached from the left, and the first column only from above, so each is just a running total.

## Worked Example

Fill the table from the top-left, row by row.

| Step | Cell | Calculation | best |
| --- | --- | --- | --- |
| 1 | (0, 0) | The start | 1 |
| 2 | (0, 1) | 1 + 3 | 4 |
| 3 | (0, 2) | 4 + 1 | 5 |
| 4 | (1, 0) | 1 + 1 | 2 |
| 5 | (1, 1) | 5 + min(4, 2) | 7 |
| 6 | (1, 2) | 1 + min(5, 7) | 6 |
| 7 | (2, 0) | 2 + 4 | 6 |
| 8 | (2, 1) | 2 + min(7, 6) | 8 |
| 9 | (2, 2) | 1 + min(6, 8) | 7 |

The finished table:

```text
1  4  5
2  7  6
6  8  7
```

The answer is the bottom-right cell, **7**.

## Code

```python
def min_cost_path(grid):
    rows, cols = len(grid), len(grid[0])
    best = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            if r == 0 and c == 0:
                best[r][c] = grid[r][c]
            elif r == 0:
                best[r][c] = grid[r][c] + best[r][c - 1]
            elif c == 0:
                best[r][c] = grid[r][c] + best[r - 1][c]
            else:
                best[r][c] = grid[r][c] + min(best[r - 1][c], best[r][c - 1])

    route = [(rows - 1, cols - 1)]        # walk back to find the route
    r, c = rows - 1, cols - 1
    while r or c:
        if c == 0 or (r > 0 and best[r - 1][c] <= best[r][c - 1]):
            r -= 1
        else:
            c -= 1
        route.append((r, c))
    return best[-1][-1], route[::-1]

grid = [[1, 3, 1], [1, 5, 1], [4, 2, 1]]
print(min_cost_path(grid))  # (7, [(0, 0), (0, 1), (0, 2), (1, 2), (2, 2)])
```

## Saving Memory

Each row depends only on the row above, so one row is enough.

```python
def min_cost_small(grid):
    row = [float("inf")] * len(grid[0])
    row[0] = 0
    for values in grid:
        row[0] += values[0]
        for c in range(1, len(values)):
            row[c] = values[c] + min(row[c], row[c - 1])
    return row[-1]

print(min_cost_small([[1, 3, 1], [1, 5, 1], [4, 2, 1]]))  # 7
```

Here, before each update, `row[c]` still holds the value from the row above, and `row[c - 1]` already holds the current row's value.

## Complexity

| Version | Time | Space |
| --- | --- | --- |
| Full table | O(n × m) | O(n × m) |
| One row | O(n × m) | O(m) |
| Trying all routes | Exponential | O(n + m) |

## If Moves Can Go Any Direction

The method relies on moves going only right and down, which gives a natural order to fill the table. If you can also move up and left, there is no such order, because a route could loop back.

That version needs [[Dijkstra]], treating each cell as a graph node.

| Allowed Moves | Method | Time |
| --- | --- | --- |
| Right and down | This table | O(n × m) |
| All four directions, no negative costs | [[Dijkstra]] | O(n × m × log(n × m)) |

## Similar Problems

- **Counting routes:** add instead of taking the minimum. See [[Memoization vs Tabulation]].
- **Most gold collected:** use the maximum instead of the minimum.
- **Routes with blocked cells:** treat a blocked cell as infinite cost.
- **Adding a diagonal move:** add a third option to the minimum.

## Common Mistakes

- **Using the greedy choice.** It looks right on many small grids, and it is still wrong.
- **Forgetting the first row and column.** They have only one way in, so they need special handling.
- **Leaving out the start or end cell.** Both costs count toward the total.
- **Using it when moves can go in every direction.** The fill order breaks, so the answers can be wrong.
