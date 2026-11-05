> The knapsack problem where each item can be taken any number of times.

## What It Is

You have a bag with a weight limit, and several kinds of items, each with a weight and a value. There is an **unlimited supply** of each kind. What is the highest total value that fits?

It is like packing a bag from a shop that never runs out. Compare this with the [[0/1 Knapsack]], where each item can be taken only once.

## The Key Idea

Think about the **last item** added to the bag. If it is an item with weight `w` and value `v`, the rest of the bag holds the best possible value for a capacity of `C - w`.

So try each item as the last one:

```text
best[0] = 0
best[C] = max( value[i] + best[C - weight[i]] )     for every item that fits
```

The difference from 0/1 is subtle but important. Here, `best[C - w]` may already include this same item, and that is allowed.

## Worked Example

Capacity 8, with these items:

| Item | Weight | Value |
| --- | --- | --- |
| A | 1 | 10 |
| B | 3 | 40 |
| C | 4 | 50 |
| D | 5 | 70 |

| Capacity | Options | best |
| --- | --- | --- |
| 0 | | 0 |
| 1 | A: 10 + 0 | 10 |
| 2 | A: 10 + 10 | 20 |
| 3 | A: 10 + 20, B: 40 + 0 | 40 |
| 4 | A: 10 + 40, B: 40 + 10, C: 50 + 0 | 50 |
| 5 | A: 10 + 50, B: 40 + 20, C: 50 + 10, D: 70 + 0 | 70 |
| 6 | A: 10 + 70, B: 40 + 40, C: 50 + 20, D: 70 + 10 | 80 |
| 7 | A: 10 + 80, B: 40 + 50, C: 50 + 40, D: 70 + 20 | 90 |
| 8 | A: 10 + 90, B: 40 + 70, C: 50 + 50, D: 70 + 40 | 110 |

The answer is **110**, using B and D (weights 3 + 5, values 40 + 70).

## Code

```python
def unbounded_knapsack(items, capacity):
    best = [0] * (capacity + 1)
    last = [None] * (capacity + 1)
    for c in range(1, capacity + 1):
        for i, (weight, value) in enumerate(items):
            if weight <= c and value + best[c - weight] > best[c]:
                best[c] = value + best[c - weight]
                last[c] = i

    counts = [0] * len(items)
    c = capacity
    while c > 0 and last[c] is not None:
        counts[last[c]] += 1
        c -= items[last[c]][0]
    return best[capacity], counts

items = [(1, 10), (3, 40), (4, 50), (5, 70)]
print(unbounded_knapsack(items, 8))  # (110, [0, 1, 0, 1])
print(unbounded_knapsack([(2, 3)], 7))  # (9, [3])
```

## One Line of Difference

With one array, the 0/1 and unbounded versions differ only in the direction of the loop.

```python
def knapsack_01(items, capacity):
    best = [0] * (capacity + 1)
    for weight, value in items:
        for c in range(capacity, weight - 1, -1):   # backward: each item once
            best[c] = max(best[c], value + best[c - weight])
    return best[capacity]

def knapsack_unbounded(items, capacity):
    best = [0] * (capacity + 1)
    for weight, value in items:
        for c in range(weight, capacity + 1):       # forward: may reuse the item
            best[c] = max(best[c], value + best[c - weight])
    return best[capacity]

items = [(2, 3)]
print(knapsack_01(items, 7))  # 3
print(knapsack_unbounded(items, 7))  # 9
```

### Why the Direction Matters

Going **forward**, `best[c - weight]` was already updated for this item, so it may contain this item already, which allows reuse. Going **backward**, `best[c - weight]` still holds the value from before this item was considered, so the item is used at most once.

## Complexity

| Measure | Cost |
| --- | --- |
| Time | O(n × W) |
| Space | O(W) |

Here, `n` is the number of kinds of items, and `W` is the capacity. It is **pseudo-polynomial**, because `W` is a value and not a count.

## The Whole Family

| Problem | Copies | Parts | Method |
| --- | --- | --- | --- |
| [[0/1 Knapsack]] | 0 or 1 | No | Dynamic programming, backward |
| Unbounded knapsack | Any number | No | Dynamic programming, forward |
| [[Fractional Knapsack]] | 0 or 1 | Yes | [[Greedy Algorithms\|Greedy]] |

### Problems That Are Really This One

| Problem | Item Weight | Item Value | Goal |
| --- | --- | --- | --- |
| [[Rod Cutting]] | Piece length | Piece price | Most money |
| [[Coin Change]], fewest coins | Coin value | 1 per coin | Fewest coins, exact amount |
| [[Coin Change]], number of ways | Coin value | | Count the ways |

## Why Greedy Fails

Taking the best value per weight first seems right, but leftover space can't always be used. With a capacity of 6 and items A (weight 4, value 5) and B (weight 3, value 3):

| Method | Items | Value |
| --- | --- | --- |
| Greedy, best ratio first | A only, with 2 units wasted | 5 |
| Best | B, B | 6 |

## Common Mistakes

- **Going backward by habit.** That gives the 0/1 answer, which uses each item at most once.
- **Requiring the bag to be exactly full when it needn't be.** In this version, the bag can have space left. If it must be exactly full, start with `best[c] = -infinity` for `c > 0`.
- **Using it for items with zero weight.** A zero-weight item with positive value can be taken forever, so such items need separate handling.
