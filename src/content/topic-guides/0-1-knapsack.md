> Choosing whole items to fit a weight limit for the highest total value, the classic dynamic programming problem.

## What It Is

You have a bag that can hold a limited weight, and a set of items that each have a weight and a value. Each item is **all or nothing**: take it once, or leave it. What is the highest total value that fits?

It is called **0/1** because for each item, you choose 0 copies or 1 copy.

## Why the Obvious Ideas Fail

- **Try every subset.** With `n` items, there are `2ⁿ` subsets. At 50 items, that is far too many.
- **Take the best value per weight.** This works for the [[Fractional Knapsack]], but not here. A good ratio can leave unusable space.

## The Key Idea

Look at the last item. There are only two options:

- **Leave it out.** The answer is the best using the earlier items, with the same capacity.
- **Take it,** if it fits. The answer is its value, plus the best using the earlier items with less capacity.

Let `best[i][w]` be the highest value using the first `i` items with capacity `w`.

```text
best[i][w] = best[i-1][w]                                     if the item is too heavy

best[i][w] = max( best[i-1][w],                               leave it out
                  value[i] + best[i-1][w - weight[i]] )       take it
```

## Worked Example

Capacity 7, with these items:

| Item | Weight | Value |
| --- | --- | --- |
| A | 1 | 1 |
| B | 3 | 4 |
| C | 4 | 5 |
| D | 5 | 7 |

Each cell is the best value for that row's items and that column's capacity.

| Items \ Capacity | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| None | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| A | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| A, B | 0 | 1 | 1 | 4 | 5 | 5 | 5 | 5 |
| A, B, C | 0 | 1 | 1 | 4 | 5 | 6 | 6 | 9 |
| A, B, C, D | 0 | 1 | 1 | 4 | 5 | 7 | 8 | 9 |

The answer is **9**. To see one entry worked out: at row C, capacity 7, leaving C out gives 5, and taking C gives `5 + best[B][3] = 5 + 4 = 9`.

### Which Items Were Taken

Walk back from the bottom-right cell. If a cell differs from the one above it, that item was taken. Here, 9 at D equals the 9 above, so D wasn't taken. Then 9 at C differs from 5, so C was taken, leaving capacity 3. The 4 at B differs from the 1 above it, so B was taken. The result is **B and C**.

## Code

```python
def knapsack(items, capacity):
    n = len(items)
    best = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        weight, value = items[i - 1]
        for w in range(capacity + 1):
            best[i][w] = best[i - 1][w]
            if weight <= w:
                best[i][w] = max(best[i][w], value + best[i - 1][w - weight])

    chosen = []
    w = capacity
    for i in range(n, 0, -1):
        if best[i][w] != best[i - 1][w]:
            chosen.append(i - 1)
            w -= items[i - 1][0]
    return best[n][capacity], chosen[::-1]

items = [(1, 1), (3, 4), (4, 5), (5, 7)]
print(knapsack(items, 7))  # (9, [1, 2])
```

## Saving Memory

Each row only uses the row above, so one array is enough. Go through capacities **from high to low**, so each item is used at most once.

```python
def knapsack_small(items, capacity):
    best = [0] * (capacity + 1)
    for weight, value in items:
        for w in range(capacity, weight - 1, -1):   # backward!
            best[w] = max(best[w], value + best[w - weight])
    return best[capacity]

print(knapsack_small([(1, 1), (3, 4), (4, 5), (5, 7)], 7))  # 9
```

Going forward would let an item be used repeatedly, which solves the [[Unbounded Knapsack]] instead.

## Complexity

| Version | Time | Space |
| --- | --- | --- |
| Full table | O(n × W) | O(n × W) |
| One array | O(n × W) | O(W) |

Here, `W` is the capacity.

### Pseudo-Polynomial

`O(n × W)` looks fast, but `W` is a number, not a count of items. A capacity of a billion needs a table of a billion cells. So it is called **pseudo-polynomial**. The problem is still [[NP-Complete Problems|NP-complete]] when weights can be huge.

## The Knapsack Family

| Problem | Copies of an Item | Parts of an Item | Method |
| --- | --- | --- | --- |
| 0/1 Knapsack | 0 or 1 | No | This table |
| [[Unbounded Knapsack]] | Any number | No | The same table, forward |
| [[Fractional Knapsack]] | 0 or 1 | Yes | [[Greedy Algorithms\|Greedy]] |
| [[Subset Sum]] | 0 or 1 | No | Value equals weight |

## Common Mistakes

- **Going forward with one array.** That allows an item to be used more than once.
- **Trying a greedy rule.** Taking the best ratio first can give the wrong answer.
- **An off-by-one in the table.** Row `i` describes item `i - 1`. Size the table `n + 1` by `W + 1`.
- **Using it for huge capacities.** With a capacity of 10⁹, the table won't fit in memory.
