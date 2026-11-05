> The longest set of values in a list that keep rising, staying in their original order.

## What It Is

Given a list of numbers, find the longest **subsequence** whose values strictly increase. A subsequence keeps the original order, but it can skip values.

For `[10, 9, 2, 5, 3, 7, 101, 18]`, one answer is `[2, 3, 7, 18]`, with a length of 4.

```text
10  9  2  5  3  7  101  18
       ^     ^  ^        ^
```

## The Key Idea

Let `best[i]` be the length of the longest increasing subsequence that **ends at position `i`**.

To end at `i`, it must extend a shorter subsequence that ends at some earlier, smaller value. So look at every earlier position `j`:

```text
best[i] = 1 + max( best[j] )     for all j < i with values[j] < values[i]
best[i] = 1                      if no earlier value is smaller
```

The final answer is the **largest value** in `best`, because the subsequence can end anywhere.

## Worked Example

Take `[10, 9, 2, 5, 3, 7, 101, 18]`.

| i | Value | Earlier Smaller Values | best[i] |
| --- | --- | --- | --- |
| 0 | 10 | None | 1 |
| 1 | 9 | None | 1 |
| 2 | 2 | None | 1 |
| 3 | 5 | 2 | 2 |
| 4 | 3 | 2 | 2 |
| 5 | 7 | 2, 5, 3 | 3 |
| 6 | 101 | All of them | 4 |
| 7 | 18 | 10, 9, 2, 5, 3, 7 | 4 |

The largest is **4**.

## Code: O(n²)

```python
def lis_length(values):
    if not values:
        return 0
    best = [1] * len(values)
    for i in range(len(values)):
        for j in range(i):
            if values[j] < values[i]:
                best[i] = max(best[i], best[j] + 1)
    return max(best)

print(lis_length([10, 9, 2, 5, 3, 7, 101, 18]))  # 4
print(lis_length([5, 4, 3]))  # 1
print(lis_length([]))  # 0
```

## A Faster Way: O(n log n)

There is a clever improvement, using [[Binary Search]].

Keep a list called `tails`, where `tails[k]` is the **smallest possible last value** of any increasing subsequence of length `k + 1`. A small tail is better, since more values can follow it.

For each new value:

- If it is larger than every tail, it extends the longest subsequence, so add it to the end.
- Otherwise, find the first tail that is at least as large, and replace it with this smaller value.

`tails` always stays sorted, which is why binary search works.

### Worked Example

| Value | Action | tails |
| --- | --- | --- |
| 10 | Add | 10 |
| 9 | Replace 10 | 9 |
| 2 | Replace 9 | 2 |
| 5 | Add | 2, 5 |
| 3 | Replace 5 | 2, 3 |
| 7 | Add | 2, 3, 7 |
| 101 | Add | 2, 3, 7, 101 |
| 18 | Replace 101 | 2, 3, 7, 18 |

The length of `tails` is the answer: **4**.

> `tails` isn't always an actual subsequence. For example, its values may come from different subsequences. Only its length is guaranteed to be meaningful.

```python
from bisect import bisect_left

def lis_fast(values):
    tails = []
    for value in values:
        position = bisect_left(tails, value)
        if position == len(tails):
            tails.append(value)
        else:
            tails[position] = value
    return len(tails)

print(lis_fast([10, 9, 2, 5, 3, 7, 101, 18]))  # 4
print(lis_fast([1, 2, 2, 3]))  # 3
```

Using `bisect_left` gives strictly increasing subsequences. For non-decreasing ones, use `bisect_right`.

## Getting the Actual Subsequence

In the `O(n²)` version, keep a `parent` for each position, and follow it back from the best one.

```python
def lis_sequence(values):
    best = [1] * len(values)
    parent = [-1] * len(values)
    for i in range(len(values)):
        for j in range(i):
            if values[j] < values[i] and best[j] + 1 > best[i]:
                best[i] = best[j] + 1
                parent[i] = j
    i = max(range(len(values)), key=lambda k: best[k])
    result = []
    while i != -1:
        result.append(values[i])
        i = parent[i]
    return result[::-1]

print(lis_sequence([10, 9, 2, 5, 3, 7, 101, 18]))  # [2, 5, 7, 101]
```

There can be several correct answers of the same length.

## Complexity

| Method | Time | Space |
| --- | --- | --- |
| Trying all subsequences | O(2ⁿ) | O(n) |
| Dynamic programming | O(n²) | O(n) |
| With binary search | O(n log n) | O(n) |

## Where It Is Used

- **Stacking boxes,** by sorting them by one side, then finding the LIS on the other.
- **Scheduling,** by choosing the most compatible jobs.
- **Measuring order,** since `n - LIS` is the fewest values you need to move to sort a list.

## Common Mistakes

- **Requiring neighbors.** A subsequence may skip values. Requiring them to be adjacent is a different, simpler problem.
- **Returning `best[n - 1]`.** The answer is the maximum of the whole array, not its last cell.
- **Reading `tails` as the answer.** It gives the correct length, but its values may not form a real subsequence.
- **Mixing up strict and non-strict.** `[1, 2, 2, 3]` has length 3 if strict, and 4 if not.
