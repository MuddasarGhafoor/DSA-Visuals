> Making the choice that looks best right now, and never going back on it.

## What It Is

A **greedy algorithm** builds a solution one step at a time. At each step, it takes whatever looks best at that moment, and it never reconsiders.

Think of making change with the largest coins first. To make 68 cents, take a quarter, then another, then a dime, a nickel, and pennies. You don't plan ahead. You just pick the largest coin that fits, and it works.

Greedy algorithms are usually simple and fast. The catch is that **they aren't always correct**.

## When Greedy Works

A greedy algorithm gives the best answer when a problem has two properties:

| Property | Meaning |
| --- | --- |
| **Greedy choice** | Some best solution starts with the choice that looks best right now |
| **Optimal substructure** | After that choice, what remains is a smaller problem of the same kind |

## When Greedy Fails

The coin example only works because of the coin values. Take coins of 1, 3, and 4, and make 6.

| Method | Coins Used | Count |
| --- | --- | --- |
| Greedy, largest first | 4, 1, 1 | 3 |
| Best | 3, 3 | 2 |

The tempting 4 was a mistake, and greedy can't take it back. This version needs dynamic programming. See [[Coin Change]].

```python
def greedy_coins(coins, amount):
    used = []
    for coin in sorted(coins, reverse=True):
        while amount >= coin:
            amount -= coin
            used.append(coin)
    return used

print(greedy_coins([25, 10, 5, 1], 68))  # [25, 25, 10, 5, 1, 1, 1]
print(greedy_coins([4, 3, 1], 6))  # [4, 1, 1]
```

## How to Prove It Works

Never trust a greedy idea just because it seems right. Try to prove it, or try to break it with a small example.

### The Exchange Argument

This is the most common proof:

1. Take any best solution.
2. If it differs from the greedy choice, swap in the greedy choice.
3. Show the result is no worse.

If that always works, then some best solution uses the greedy choice. [[Activity Selection]] has a clean example.

### Stays Ahead

Show that after every step, greedy's partial solution is at least as good as any other solution's.

## Classic Greedy Algorithms

| Problem | The Greedy Choice | Time |
| --- | --- | --- |
| [[Activity Selection]] | The activity that finishes first | O(n log n) |
| [[Fractional Knapsack]] | The highest value per weight | O(n log n) |
| [[Job Sequencing]] | The highest profit, placed as late as possible | O(n²), or better |
| [[Huffman Coding]] | Join the two rarest symbols | O(n log n) |
| [[Dijkstra]] | The closest unfinished node | O((V + E) log V) |
| [[Prim's Algorithm]] | The cheapest edge from the tree | O(E log V) |
| [[Kruskal's Algorithm]] | The cheapest edge that forms no cycle | O(E log E) |

## Greedy on Similar-Looking Problems

Small changes to a problem can decide whether greedy works.

| Works With Greedy | Doesn't Work With Greedy |
| --- | --- |
| [[Fractional Knapsack]] | [[0/1 Knapsack]] |
| [[Activity Selection]], counting activities | [[Weighted Job Scheduling]], maximizing value |
| [[Coin Change]] with US coins | [[Coin Change]] with coins 1, 3, 4 |
| Shortest paths with positive edges | Shortest paths with negative edges |

## Greedy vs Dynamic Programming

| | Greedy | [[Memoization vs Tabulation\|Dynamic Programming]] |
| --- | --- | --- |
| Decisions | One choice at each step | Considers every choice |
| Going back | Never | Compares all options |
| Speed | Usually very fast | Usually slower |
| Correctness | Only on suitable problems | Whenever subproblems combine |
| Proof | Needs an argument | Follows from the recurrence |

If greedy fails, try dynamic programming. If you need a good answer quickly and not the very best, a greedy method can still be useful as an **approximation**.

## How to Approach a Problem

1. Look for a natural rule, such as earliest, cheapest, or best ratio.
2. Try hard to break it with small examples.
3. If you can't break it, look for an exchange argument.
4. If you can break it, consider [[Memoization vs Tabulation|dynamic programming]].

## Common Mistakes

- **Assuming it works because it seems sensible.** Many reasonable rules fail. Test several small cases.
- **Testing only the given example.** A greedy rule can pass the sample and still be wrong in general.
- **Picking the wrong sort order.** For activities, sorting by start time fails, while finish time works.
