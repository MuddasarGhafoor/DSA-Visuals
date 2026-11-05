> Building a sorted section one value at a time, by sliding each new value back to its place.

## What It Is

**Insertion sort** works the way most people sort playing cards in their hand. You hold a sorted group of cards, pick up the next card, and slide it into the right place among the ones you hold.

The list is always in two parts: a sorted part on the left that grows by one each step, and an unsorted part on the right.

## How It Works

1. Treat the first value as a sorted part of size one.
2. Take the next value, and save it.
3. Compare it with the sorted values, from right to left. Shift each larger value one position to the right.
4. When you find a value that isn't larger, or reach the start, drop the saved value into the gap.
5. Repeat until no unsorted values are left.

## Worked Example

Sort `[5, 2, 4, 6, 1]`. The `|` separates the sorted part from the rest.

| Step | Take | What Shifts | List After |
| --- | --- | --- | --- |
| Start | | | 5 \| 2, 4, 6, 1 |
| 1 | 2 | 5 | 2, 5 \| 4, 6, 1 |
| 2 | 4 | 5 | 2, 4, 5 \| 6, 1 |
| 3 | 6 | Nothing | 2, 4, 5, 6 \| 1 |
| 4 | 1 | 6, 5, 4, 2 | 1, 2, 4, 5, 6 |

## Code

```python
def insertion_sort(values):
    for i in range(1, len(values)):
        current = values[i]
        j = i - 1
        while j >= 0 and values[j] > current:
            values[j + 1] = values[j]      # shift it right to make room
            j -= 1
        values[j + 1] = current
    return values

print(insertion_sort([5, 2, 4, 6, 1]))  # [1, 2, 4, 5, 6]
print(insertion_sort([1, 2, 3]))  # [1, 2, 3]
```

## Complexity

| Case | Time | When |
| --- | --- | --- |
| Best | O(n) | Already sorted: one comparison per value |
| Average | O(n²) | Random order |
| Worst | O(n²) | Reverse order: every value shifts all the way |
| Space | O(1) | One saved value |

## Why It Is Faster on Nearly Sorted Data

The work depends on how far values are from their right place. An **inversion** is a pair of values in the wrong order, and each shift fixes exactly one. So the running time is `O(n + d)`, where `d` is the number of inversions.

If the data has only a few values out of place, `d` is small and the sort is close to linear. This property is called being **adaptive**.

## Why It Is Used in Real Libraries

Despite being `O(n²)`, insertion sort shows up inside fast sorting code:

- **It is fast on small lists.** It has very little overhead, so it beats `O(n log n)` sorts below about 10 to 50 values.
- **It finishes off nearly sorted data.** Timsort, used in Python and Java, uses it on small runs. Many [[Quick Sort]] and [[Merge Sort]] libraries switch to it for small pieces.
- **It handles a stream of values.** It can sort values as they arrive, without seeing all of them first.

## Properties

- **Stable.** The check uses `>`, so an equal value never moves past another. See [[Stable vs Unstable Sorting]].
- **In place.** It needs just one extra variable.
- **Online.** It can sort data as it is received.

## How It Compares

| | Insertion | [[Selection Sort\|Selection]] | [[Bubble Sort\|Bubble]] |
| --- | --- | --- | --- |
| Best case | O(n) | O(n²) | O(n) |
| Worst case | O(n²) | O(n²) | O(n²) |
| Writes | Many on reversed data | At most n swaps | Many |
| Stable | Yes | No | Yes |
| Usually the fastest of the three | Yes | | |

## A Small Improvement

You can use [[Binary Search]] to find where a value belongs, which cuts the comparisons to `O(n log n)`. But the shifting is still `O(n²)`, so the total time doesn't improve.

## Common Mistakes

- **Overwriting the current value.** Save `values[i]` first, because the first shift writes over it.
- **Reading before the start.** Check `j >= 0` before reading `values[j]`.
- **Placing it at `j` instead of `j + 1`.** When the loop stops, `j` is at the value that stays put, or at -1. The gap is one to its right.
- **Using `>=`.** That moves equal values for no reason, and makes the sort unstable.
