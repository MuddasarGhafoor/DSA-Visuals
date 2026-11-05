> Finding every subset of numbers that adds up to a target, using backtracking.

## What It Is

Given a list of positive numbers and a target, find **every subset** that adds up to the target.

For `[2, 3, 4, 5]` and a target of 9, the answers are `{2, 3, 4}` and `{4, 5}`.

This is a classic [[Backtracking]] exercise. It differs from [[Subset Sum]], which only asks **whether** a subset exists, and can be solved with a table. To list all the answers, you must actually build them.

## The Decision Tree

For each number, you make one choice: **put it in, or leave it out**. That gives a binary tree with `2ⁿ` leaves, one for each subset. Here is the start of it for `[2, 3, 4, 5]`:

```text
                          sum 0
                  in 2 /        \ out 2
                  sum 2          sum 0
            in 3 /   \ out 3    in 3 /  \ out 3
             sum 5   sum 2    sum 3     sum 0
              ...     ...      ...       ...
```

Checking all `2ⁿ` subsets would work, but pruning does far better.

## Two Pruning Rules

Sort the numbers first. Then you can cut off a branch as soon as either of these is true.

| Rule | Check | Why |
| --- | --- | --- |
| **Too large** | `sum + next value > target` | The numbers are sorted and positive, so every later one is also too large |
| **Too small** | `sum + all remaining values < target` | Even taking everything can't reach the target |

## Worked Example

Find subsets of `[2, 3, 4, 5]` that add up to 9. The total of all values is 14.

| Path | Sum | Remaining | Action |
| --- | --- | --- | --- |
| in 2 | 2 | 12 | Continue |
| in 2, in 3 | 5 | 9 | Continue |
| in 2, in 3, in 4 | 9 | 5 | **Found {2, 3, 4}** |
| in 2, in 3, out 4 | 5 | 5 | Adding 5 gives 10, which is too large, so back up |
| in 2, out 3, in 4 | 6 | 5 | Adding 5 gives 11, which is too large |
| in 2, out 3, out 4 | 2 | 5 | 2 + 5 = 7, which is too small, so back up |
| out 2, in 3, in 4 | 7 | 5 | Adding 5 gives 12, which is too large |
| out 2, in 3, out 4 | 3 | 5 | 3 + 5 = 8, which is too small |
| out 2, out 3, in 4 | 4 | 5 | Continue |
| out 2, out 3, in 4, in 5 | 9 | 0 | **Found {4, 5}** |

## Code

```python
def sum_of_subsets(values, target):
    values = sorted(values)
    result = []
    current = []

    def explore(i, total, remaining):
        if total == target:
            result.append(current[:])
            return
        if i == len(values) or total + values[i] > target or total + remaining < target:
            return                                  # prune this branch
        current.append(values[i])                   # put it in
        explore(i + 1, total + values[i], remaining - values[i])
        current.pop()                               # undo
        explore(i + 1, total, remaining - values[i])  # leave it out

    explore(0, 0, sum(values))
    return result

print(sum_of_subsets([5, 2, 4, 3], 9))  # [[2, 3, 4], [4, 5]]
print(sum_of_subsets([3, 34, 4, 12, 5, 2], 9))  # [[2, 3, 4], [4, 5]]
print(sum_of_subsets([1, 2], 10))  # []
```

## Complexity

| Measure | Cost | Note |
| --- | --- | --- |
| Time, worst case | O(2ⁿ) | Pruning usually cuts this a lot |
| Time per solution | O(n) | Copying it to the results |
| Space | O(n) | The recursion, not counting stored results |

## Sum of Subsets vs Subset Sum

| | Sum of Subsets | [[Subset Sum]] |
| --- | --- | --- |
| Question | List every subset | Does one exist? |
| Method | Backtracking | [[Memoization vs Tabulation\|Dynamic programming]] |
| Time | O(2ⁿ) | O(n × target) |
| Output size | May be exponential | One true or false |

If you only need a yes-or-no answer, use the dynamic programming version, which is far faster for small targets.

## Handling Duplicates

With repeated values, such as `[1, 1, 2]`, the same subset can come out twice. After a recursive call, skip any later values equal to the one you just used:

```python
def unique_subsets(values, target):
    values = sorted(values)
    result, current = [], []
    def explore(start, total):
        if total == target:
            result.append(current[:])
            return
        for i in range(start, len(values)):
            if i > start and values[i] == values[i - 1]:
                continue                  # the same value at this level gives a repeat
            if total + values[i] > target:
                break
            current.append(values[i])
            explore(i + 1, total + values[i])
            current.pop()
    explore(0, 0)
    return result

print(unique_subsets([1, 1, 2], 3))  # [[1, 2]]
```

## Common Mistakes

- **Pruning without sorting.** The "too large" check assumes later values aren't smaller.
- **Applying it to negative numbers.** With negatives, the sum can come back down, so neither pruning rule holds.
- **Stopping after the first answer.** If you need every subset, keep searching.
- **Forgetting to remove the value.** After exploring with a value in, it must come out again before exploring without it.
