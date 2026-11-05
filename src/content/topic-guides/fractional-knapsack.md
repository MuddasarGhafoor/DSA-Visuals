> Filling a knapsack by value per weight, when items can be split.

## What It Is

You have a bag with a weight limit, and items that each have a weight and a value. You want the most value possible. In this version, **you can take part of an item**, as if the items were gold dust or sacks of rice.

Being able to split items makes the problem easy: **take whatever is worth the most per kilogram**.

## How It Works

1. Work out each item's **value per unit of weight**.
2. Sort the items by that ratio, highest first.
3. Take each item in full, as long as it fits.
4. When an item doesn't fit, take just enough of it to fill the bag.

## Worked Example

The bag holds 50 kg.

| Item | Value | Weight | Value per kg |
| --- | --- | --- | --- |
| A | 60 | 10 | 6 |
| B | 100 | 20 | 5 |
| C | 120 | 30 | 4 |

Go through them from the best ratio to the worst.

| Item | Room Left Before | Take | Value Added | Total Value |
| --- | --- | --- | --- | --- |
| A | 50 | All 10 kg | 60 | 60 |
| B | 40 | All 20 kg | 100 | 160 |
| C | 20 | 20 of 30 kg | 120 × 20/30 = 80 | 240 |

The answer is **240**.

## Code

```python
def fractional_knapsack(items, capacity):
    total = 0.0
    for value, weight in sorted(items, key=lambda item: item[0] / item[1], reverse=True):
        if capacity <= 0:
            break
        taken = min(weight, capacity)
        total += value * taken / weight
        capacity -= taken
    return total

print(fractional_knapsack([(60, 10), (100, 20), (120, 30)], 50))  # 240.0
print(fractional_knapsack([(10, 2)], 1))  # 5.0
```

## Why It Works

Suppose a best solution doesn't take as much as it could of the highest-ratio item, but does take some of a lower-ratio item.

Swap a small amount of the lower-ratio item for the same weight of the higher-ratio item. The weight stays the same, and the value goes up. So the solution wasn't the best after all.

Therefore, the best solution always uses the highest ratio as much as possible. Splitting is what makes this swap possible.

## Complexity

| Step | Time |
| --- | --- |
| Sorting | O(n log n) |
| Filling | O(n) |
| Total | O(n log n) |
| Space | O(n) for the sorted copy |

## Why Greedy Fails Without Splitting

In the [[0/1 Knapsack]], each item must be taken whole. The same greedy rule goes wrong on the same items:

| Approach | Items Taken | Weight | Value |
| --- | --- | --- | --- |
| Greedy by ratio, whole items only | A, B | 30 kg | 160, with 20 kg wasted |
| Best choice | B, C | 50 kg | 220 |

Greedy took A first, and that left too little room. With no splitting, the unused space can't be filled, so a locally good choice can spoil the whole result. The 0/1 version needs dynamic programming.

| | Fractional | [[0/1 Knapsack]] | [[Unbounded Knapsack]] |
| --- | --- | --- | --- |
| Can take part of an item | Yes | No | No |
| Copies of each item | One | One | Unlimited |
| Method | Greedy | Dynamic programming | Dynamic programming |
| Time | O(n log n) | O(n × W) | O(n × W) |

## Where It Is Used

- **Loading goods** that can be divided, such as fuel, grain, or liquids.
- **Budget allocation,** where money can be split between options with different returns.
- **Bounds for the 0/1 version.** The fractional answer is an upper limit on the 0/1 answer, which helps to prune a search.

## Common Mistakes

- **Sorting by value or by weight alone.** The ratio is what counts. Item C has the highest value, but the worst ratio.
- **Applying it to whole items.** The greedy method is only correct when items can be split.
- **Integer division.** In languages like C, `value / weight` can round down and give a wrong order. Use floating-point numbers, or compare by cross-multiplying.
