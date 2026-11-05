> Deciding whether a list can be split into two groups with equal totals.

## What It Is

Given a list of positive numbers, can you split it into **two groups with the same total**?

- `[1, 5, 11, 5]` can be split into `{1, 5, 5}` and `{11}`, each adding up to 11.
- `[1, 2, 3, 5]` can't, because its total is 11, which is odd.

Think of two people sharing a set of items fairly, so that each gets exactly the same value.

## The Key Insight

If the list adds up to `T`, each group must add up to `T / 2`. That gives two simple facts:

1. **If `T` is odd, the answer is no,** since two equal whole numbers can't add up to an odd total.
2. **If `T` is even, you only need to find one subset that adds up to `T / 2`.** Everything else automatically forms the other group, with the same total.

So this is really just [[Subset Sum]], with the target set to half of the total.

## The Dynamic Programming Table

Let `can[s]` mean "some subset of the values seen so far adds up to `s`".

For each value `v`, a total `s` can be reached if it could already be reached, or if `s - v` could be reached, by adding `v` to it.

```text
can[0] = true
can[s] = can[s] or can[s - v]
```

## Worked Example

Take `[1, 5, 11, 5]`. The total is 22, so the target is 11.

This table shows which totals can be reached after each value. An X means yes.

| After Value | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| None | X | | | | | | | | | | | |
| 1 | X | X | | | | | | | | | | |
| 5 | X | X | | | | X | X | | | | | |
| 11 | X | X | | | | X | X | | | | | X |
| 5 | X | X | | | | X | X | | | | X | X |

Total 11 is reachable, so the answer is **yes**.

## Code

As with the [[0/1 Knapsack]], go through totals **from high to low**, so each value is used at most once.

```python
def can_partition(values):
    total = sum(values)
    if total % 2 == 1:
        return False
    target = total // 2
    can = [False] * (target + 1)
    can[0] = True
    for value in values:
        for s in range(target, value - 1, -1):      # backward!
            if can[s - value]:
                can[s] = True
    return can[target]

print(can_partition([1, 5, 11, 5]))  # True
print(can_partition([1, 2, 3, 5]))  # False
print(can_partition([2, 2, 3, 5]))  # False
```

The last example has an even total of 12, so the target is 6. But no subset of `[2, 2, 3, 5]` adds up to 6, so an even total alone isn't enough.

## Getting the Groups

To see the groups themselves, remember which value first reached each total, then walk back from the target.

```python
def partition_groups(values):
    total = sum(values)
    if total % 2 == 1:
        return None
    target = total // 2
    came_from = {0: None}
    for i, value in enumerate(values):
        for s in list(came_from):
            if s + value <= target and s + value not in came_from:
                came_from[s + value] = (s, i)
    if target not in came_from:
        return None
    chosen = set()
    s = target
    while came_from[s] is not None:
        s, i = came_from[s]
        chosen.add(i)
    return [values[i] for i in sorted(chosen)], [values[i] for i in range(len(values)) if i not in chosen]

print(partition_groups([1, 5, 11, 5]))  # ([11], [1, 5, 5])
```

## The Closest Split

If an exact split isn't possible, you may want the smallest difference. Find the largest reachable total `s` that is at most `T / 2`. The difference is then `T - 2s`.

```python
def smallest_difference(values):
    total = sum(values)
    reachable = {0}
    for value in values:
        reachable |= {s + value for s in reachable}
    best = max(s for s in reachable if s <= total // 2)
    return total - 2 * best

print(smallest_difference([1, 6, 11, 5]))  # 1
print(smallest_difference([1, 5, 11, 5]))  # 0
```

## Complexity

| Method | Time | Space |
| --- | --- | --- |
| Trying all subsets | O(2ⁿ) | O(n) |
| The table | O(n × T) | O(T) |

Here, `T` is the total of the values. That makes it **pseudo-polynomial**: it is fast when the numbers are small, and impractical when they are huge. The partition problem is one of the classic [[NP-Complete Problems]].

## Common Mistakes

- **Stopping at "the total is even".** That is required, but it isn't enough, as `[2, 2, 3, 5]` shows.
- **Going forward through the totals.** That lets a value be used twice. `[3]`, with a target of 6, would wrongly reach 6.
- **Assuming a greedy method works.** Giving each value to the group with the smaller total sounds fair, and it can fail. On `[3, 3, 2, 2, 2]`, it gives 7 and 5, while `{3, 3}` and `{2, 2, 2}` are equal.
- **Forgetting negative numbers.** With negative values, the table's indexes need shifting.
