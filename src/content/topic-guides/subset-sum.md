> Deciding whether some of the numbers in a list add up to an exact target.

## What It Is

Given a list of positive numbers and a target, is there a **subset** that adds up to exactly the target?

For `[3, 34, 4, 12, 5, 2]` and a target of 9, the answer is **yes**: 4 + 5 works, and so does 3 + 4 + 2. For a target of 30, the answer is **no**.

## Why Trying Everything Fails

Each number is either in or out, which gives `2ⁿ` subsets. At 60 numbers, that is about 10¹⁸. But most of those subsets lead to the same few totals, and that repetition is what dynamic programming uses.

## The Key Idea

Consider the last number. It is either in the subset or it isn't.

- **Leave it out:** the earlier numbers must reach the target on their own.
- **Put it in:** the earlier numbers must reach the target minus this number.

Let `can[i][s]` mean "some subset of the first `i` numbers adds up to `s`".

```text
can[i][s] = can[i-1][s]                       leave it out
         or can[i-1][s - value[i]]            put it in, if value[i] ≤ s

can[i][0] = true        (the empty subset adds up to 0)
can[0][s] = false       for any s > 0
```

## Worked Example

Numbers `[3, 4, 5]`, target 9. An X means that total can be reached.

| Numbers Used | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| None | X | | | | | | | | | |
| 3 | X | | | X | | | | | | |
| 3, 4 | X | | | X | X | | | X | | |
| 3, 4, 5 | X | | | X | X | X | | X | X | X |

The target 9 is reachable. To see one cell worked out: with 3, 4, 5 and total 9, leaving 5 out needs 9 from `{3, 4}`, which is no. Putting 5 in needs 4 from `{3, 4}`, which is yes.

### Finding the Subset

Walk back from the final cell. If a total was already reachable without the current number, skip it. Otherwise, use it and subtract. For 9: without 5 it wasn't reachable, so use 5, leaving 4. Without 4, total 4 wasn't reachable, so use 4, leaving 0. The answer is `{4, 5}`.

## Code

```python
def subset_sum(values, target):
    n = len(values)
    can = [[False] * (target + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        can[i][0] = True
    for i in range(1, n + 1):
        for s in range(1, target + 1):
            can[i][s] = can[i - 1][s]
            if values[i - 1] <= s and can[i - 1][s - values[i - 1]]:
                can[i][s] = True
    if not can[n][target]:
        return None
    chosen = []
    s = target
    for i in range(n, 0, -1):
        if not can[i - 1][s]:
            chosen.append(values[i - 1])
            s -= values[i - 1]
    return chosen[::-1]

print(subset_sum([3, 34, 4, 12, 5, 2], 9))  # [4, 5]
print(subset_sum([3, 34, 4, 12, 5, 2], 30))  # None
print(subset_sum([1, 2], 0))  # []
```

## Saving Memory

If you only need yes or no, one row is enough. Go through totals **from high to low**, so each number is used at most once.

```python
def subset_sum_small(values, target):
    can = [True] + [False] * target
    for value in values:
        for s in range(target, value - 1, -1):
            can[s] = can[s] or can[s - value]
    return can[target]

print(subset_sum_small([3, 34, 4, 12, 5, 2], 9))  # True
print(subset_sum_small([3, 34, 4, 12, 5, 2], 30))  # False
```

## Complexity

| Method | Time | Space |
| --- | --- | --- |
| Trying all subsets | O(2ⁿ) | O(n) |
| Table | O(n × T) | O(n × T) |
| One row | O(n × T) | O(T) |

Here, `T` is the target.

### Pseudo-Polynomial

`O(n × T)` looks like polynomial time, but it isn't really. Input size is measured in digits, and `T` can be exponentially larger than its number of digits. A target with 30 digits would need a table of 10³⁰ cells.

So the dynamic programming doesn't contradict the fact that subset sum is [[NP-Complete Problems|NP-complete]]. It is fast only when the numbers are small. This is called **pseudo-polynomial** time.

## Related Problems

| Problem | Question | Method |
| --- | --- | --- |
| Subset sum | Does a subset reach T? | This table |
| [[Sum of Subsets]] | List all subsets that reach T | [[Backtracking]] |
| [[Partition Problem]] | Can it be split into two equal groups? | Subset sum with T = total / 2 |
| [[0/1 Knapsack]] | Best value within a weight limit | The same table, with values |
| [[Coin Change]] | Fewest coins to reach T, using each many times | The same idea, going forward |

## Common Mistakes

- **Going forward with one row.** That lets a number be used more than once, which answers a different question.
- **Forgetting that 0 is reachable.** The empty subset adds up to 0, and all other totals build on that.
- **Assuming greedy works.** Taking the largest number first can overshoot, or block a valid answer.
- **Using it with very large targets.** The table's size depends on the target's value, whatever the size of the list.
