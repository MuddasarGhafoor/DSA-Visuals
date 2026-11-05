> Finding a value in a sorted list by repeatedly cutting the search range in half.

## What It Is

Imagine looking up a word in a paper dictionary. You don't start at page one. You open near the middle, see whether your word comes before or after, and throw away half the book. Repeat, and you find the word in a handful of steps.

**Binary search** does exactly this on a sorted list. Each comparison removes half of what is left.

> It only works if the list is sorted. On an unsorted list, the comparison tells you nothing about which half to keep.

## How It Works

Keep two markers, `low` and `high`, around the part of the list that could still hold the target.

1. Look at the middle value.
2. If it equals the target, you are done.
3. If it is smaller than the target, the target must be to the right, so move `low` past the middle.
4. If it is larger than the target, the target must be to the left, so move `high` before the middle.
5. If `low` passes `high`, the range is empty, so the target isn't in the list.

## Worked Example

Find 23 in this sorted list.

```text
index:   0   1   2   3   4   5   6   7   8
value:   2   5   8  12  16  23  38  56  72
```

| Step | low | high | mid | Value at mid | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 8 | 4 | 16 | 16 < 23, so go right |
| 2 | 5 | 8 | 6 | 38 | 38 > 23, so go left |
| 3 | 5 | 5 | 5 | 23 | Found at index 5 |

Three comparisons, where a [[Linear Search]] would have needed six.

## Code

```python
def binary_search(values, target):
    low, high = 0, len(values) - 1
    while low <= high:
        mid = (low + high) // 2
        if values[mid] == target:
            return mid
        if values[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

values = [2, 5, 8, 12, 16, 23, 38, 56, 72]
print(binary_search(values, 23))  # 5
print(binary_search(values, 7))  # -1
```

## Complexity

| Case | Time | Why |
| --- | --- | --- |
| Best | O(1) | The middle is the target |
| Average and worst | O(log n) | The range halves each step |
| Space, loop | O(1) | Three variables |
| Space, recursive | O(log n) | One stack frame per step |

The recurrence is `T(n) = T(n/2) + 1`. See [[Master Theorem]].

### How Fast Is That

| List Size | Linear Search, Worst | Binary Search, Worst |
| --- | --- | --- |
| 1,000 | 1,000 | 10 |
| 1,000,000 | 1,000,000 | 20 |
| 1,000,000,000 | 1,000,000,000 | 30 |

## Finding a Boundary

Binary search can do more than find an exact match. A very useful version finds the **first position where a condition becomes true**. For example, the first value that is at least `x`.

```python
def first_at_least(values, x):
    low, high = 0, len(values)
    while low < high:
        mid = (low + high) // 2
        if values[mid] >= x:
            high = mid          # mid could be the answer, so keep it
        else:
            low = mid + 1
    return low

values = [1, 3, 3, 3, 8]
print(first_at_least(values, 3))  # 1
print(first_at_least(values, 4))  # 4
print(first_at_least(values, 9))  # 5
```

This handles duplicates correctly, and it also says where to insert a new value to keep the list sorted.

## Common Mistakes

- **Off-by-one errors.** Decide whether `high` is included in the range. If it is, loop on `low <= high` and use `high = mid - 1`. If it isn't, loop on `low < high` and use `high = mid`.
- **An infinite loop.** Writing `low = mid` can stop the range from shrinking when `low` and `high` are neighbors.
- **Overflow in the middle.** In C and Java, `(low + high) / 2` can overflow on huge arrays. Write `low + (high - low) / 2`.
- **Forgetting to sort.** Sorting costs `O(n log n)`, so for a single search on unsorted data, a linear search is cheaper.
- **Using it on a linked list.** Reaching the middle takes `O(n)`, so the speedup is lost.
