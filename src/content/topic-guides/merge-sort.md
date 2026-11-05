> Splitting a list in half, sorting each half, and merging the two sorted halves back together.

## What It Is

**Merge sort** rests on a simple fact: **merging two sorted lists is easy**. You only need to look at the front of each one, and take the smaller value.

So it splits the list in half again and again until each piece has one value, which is already sorted. Then it merges the pieces back together. It is a classic example of [[Divide and Conquer]].

## How It Works

1. **Divide.** Split the list into two halves.
2. **Conquer.** Sort each half with merge sort.
3. **Combine.** Merge the two sorted halves into one sorted list.

The base case is a list of 0 or 1 values, which needs no sorting.

## Worked Example

Sort `[38, 27, 43, 3]`.

```text
Split:         [38, 27, 43, 3]
              /               \
         [38, 27]           [43, 3]
         /      \           /     \
      [38]     [27]      [43]     [3]

Merge:   \      /           \     /
         [27, 38]           [3, 43]
              \               /
           [3, 27, 38, 43]
```

### The Merge Step

Merging `[27, 38]` and `[3, 43]`:

| Left Front | Right Front | Take | Result So Far |
| --- | --- | --- | --- |
| 27 | 3 | 3 | 3 |
| 27 | 43 | 27 | 3, 27 |
| 38 | 43 | 38 | 3, 27, 38 |
| Empty | 43 | 43 | 3, 27, 38, 43 |

Each step takes one value, so merging `n` values takes `n` steps.

## Code

```python
def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:     # <= keeps the sort stable
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])         # one of these is empty
    result.extend(right[j:])
    return result

def merge_sort(values):
    if len(values) <= 1:
        return values
    middle = len(values) // 2
    return merge(merge_sort(values[:middle]), merge_sort(values[middle:]))

print(merge_sort([38, 27, 43, 3]))  # [3, 27, 38, 43]
print(merge_sort([5, 1, 4, 2, 8, 1]))  # [1, 1, 2, 4, 5, 8]
```

## Complexity

| Case | Time |
| --- | --- |
| Best | O(n log n) |
| Average | O(n log n) |
| Worst | O(n log n) |
| Space | O(n) |

### Why O(n log n)

The recurrence is `T(n) = 2T(n/2) + n`. As a tree:

```text
Level 0:     one list of n            merge cost: n
Level 1:     two lists of n/2         merge cost: n
Level 2:     four lists of n/4        merge cost: n
...
log n levels in total
```

Each level costs `n`, and there are `log₂ n` levels. The cost doesn't depend on the input order at all, which is why every case is the same. See [[Master Theorem]].

## Strengths and Weaknesses

### Strengths

- **Guaranteed speed.** It never degrades, unlike [[Quick Sort]].
- **Stable.** Equal values keep their order. See [[Stable vs Unstable Sorting]].
- **Works on linked lists.** Merging only needs to go forward, and it needs no extra space there.
- **Works on huge data.** It reads through its input in order, so it can merge data too large for memory, from files on disk. This is called **external sorting**.

### Weaknesses

- **Needs extra memory.** Arrays need `O(n)` for merging.
- **Often slower than Quick Sort on arrays,** because of all the copying.

## Worked Example: Counting Inversions

The merge step can do useful work on the side. An **inversion** is a pair of values in the wrong order. When a value from the right half is taken first, it jumps over everything still left in the left half, so each of those is one inversion.

```python
def count_inversions(values):
    if len(values) <= 1:
        return values, 0
    middle = len(values) // 2
    left, a = count_inversions(values[:middle])
    right, b = count_inversions(values[middle:])
    merged, i, j, count = [], 0, 0, a + b
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
            count += len(left) - i
    return merged + left[i:] + right[j:], count

print(count_inversions([2, 4, 1, 3, 5])[1])  # 3
```

## Common Mistakes

- **Using `<` in the merge.** With `<`, a value from the right is taken first on a tie, which makes the sort unstable.
- **Forgetting the leftovers.** When one side runs out, the rest of the other side must be added.
- **Allocating in every call.** Slicing makes copies at each level. Fast versions share one helper array.
- **Thinking it needs sorted input to be fast.** It costs the same on any input. Sorted data gives it no advantage unless you add a check.
