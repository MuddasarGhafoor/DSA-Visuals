> Choosing a pivot, moving smaller values to its left and larger values to its right, then sorting each side.

## What It Is

**Quick sort** picks one value, called the **pivot**, and rearranges the list so that everything smaller is on its left and everything larger is on its right. The pivot is now in its final place, so you only need to sort the two sides, which is the same problem again.

It is a [[Divide and Conquer]] algorithm, and it is the fastest general-purpose sort in practice for arrays.

## How It Works

1. **Choose a pivot.**
2. **Partition.** Rearrange the list so that smaller values come before the pivot and larger values after it.
3. **Recurse** on the left side and the right side.

All the real work happens in the partition. Unlike [[Merge Sort]], there is nothing to do afterward.

### The Partition Step

One common method, the **Lomuto scheme**, uses the last value as the pivot. It keeps a marker `store` for where the next small value should go.

For each value, if it is smaller than the pivot, swap it into position `store` and move `store` forward. At the end, swap the pivot into position `store`.

## Worked Example

Partition `[8, 3, 7, 1, 5]`, with pivot 5.

| i | Value | Smaller Than 5? | Action | List | store |
| --- | --- | --- | --- | --- | --- |
| 0 | 8 | No | | 8, 3, 7, 1, 5 | 0 |
| 1 | 3 | Yes | Swap positions 0 and 1 | 3, 8, 7, 1, 5 | 1 |
| 2 | 7 | No | | 3, 8, 7, 1, 5 | 1 |
| 3 | 1 | Yes | Swap positions 1 and 3 | 3, 1, 7, 8, 5 | 2 |
| End | | | Swap pivot into position 2 | 3, 1, 5, 8, 7 | 2 |

Now 5 is in its final place. The left side `[3, 1]` holds the smaller values, and the right side `[8, 7]` holds the larger ones.

## Code

```python
import random

def partition(values, low, high):
    pivot = values[high]
    store = low
    for i in range(low, high):
        if values[i] < pivot:
            values[i], values[store] = values[store], values[i]
            store += 1
    values[store], values[high] = values[high], values[store]
    return store

def quick_sort(values, low=0, high=None):
    if high is None:
        high = len(values) - 1
    if low < high:
        # A random pivot makes the worst case very unlikely.
        chosen = random.randint(low, high)
        values[chosen], values[high] = values[high], values[chosen]
        middle = partition(values, low, high)
        quick_sort(values, low, middle - 1)
        quick_sort(values, middle + 1, high)
    return values

print(quick_sort([8, 3, 7, 1, 5]))  # [1, 3, 5, 7, 8]
print(quick_sort([4, 4, 2, 4, 1]))  # [1, 2, 4, 4, 4]
```

## Complexity

| Case | Time | When |
| --- | --- | --- |
| Best | O(n log n) | The pivot splits the list evenly |
| Average | O(n log n) | Random order, or a random pivot |
| Worst | O(n²) | The pivot is always the smallest or largest |
| Space | O(log n) average | The recursion stack |

### The Worst Case

If the pivot is always the smallest value, one side is empty and the other has `n - 1` values. That gives `T(n) = T(n - 1) + n`, which is `O(n²)`. Taking the last value as the pivot on an **already sorted list** causes exactly this.

### Why It Is Usually Fast

Even a poor split works well. A split of 90% and 10% at every level still gives `O(n log n)`, with a slightly larger constant. To be slow, the pivot has to be close to an extreme nearly every time, and a random choice makes that extremely unlikely.

## Choosing the Pivot

| Strategy | Good | Bad |
| --- | --- | --- |
| First or last value | Simple | Sorted input is the worst case |
| Random value | Very unlikely to go wrong | Needs a random number |
| Median of three | Picks well in practice | Slightly more work |

## Why It Beats Merge Sort on Arrays

- **In place.** It doesn't need a second array.
- **Good cache use.** It scans neighboring memory in order.
- **Small constant.** Each step is a simple comparison and an occasional swap.

The tradeoffs are that it isn't stable, and its worst case is `O(n²)`. Library sorts often combine it with [[Heap Sort]] as a fallback to guarantee `O(n log n)`.

## Common Mistakes

- **Many equal values.** With the simple scheme above, a list of all-equal values is a worst case. A **three-way partition**, which keeps the equal values together in the middle, fixes this.
- **Recursing on the pivot too.** The pivot is already in place. Including it can cause endless recursion.
- **A deep stack.** To keep it to `O(log n)`, recurse on the smaller side first, and loop on the larger one.
- **Assuming it is stable.** Long-range swaps can reorder equal values. See [[Stable vs Unstable Sorting]].
