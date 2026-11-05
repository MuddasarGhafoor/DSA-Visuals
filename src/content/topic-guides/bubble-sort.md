> Repeatedly swapping neighbors that are out of order, so the largest values rise to the end.

## What It Is

**Bubble sort** walks through the list comparing each pair of neighbors, and swaps them if they are in the wrong order. After one full pass, the largest value has "bubbled" up to the end. Repeat for the rest of the list.

It is the sort most people learn first. It is too slow for real use, but it is a clear introduction to how sorting and swapping work.

## How It Works

1. Start at the beginning of the list.
2. Compare the first two values. If the left one is larger, swap them.
3. Move one position right, and repeat until the end.
4. The largest value is now in its final place, so the next pass can stop one position earlier.
5. Repeat until a full pass makes no swaps.

## Worked Example

Sort `[5, 1, 4, 2, 8]`.

### Pass 1

| Compare | Action | List |
| --- | --- | --- |
| 5 and 1 | Swap | 1, 5, 4, 2, 8 |
| 5 and 4 | Swap | 1, 4, 5, 2, 8 |
| 5 and 2 | Swap | 1, 4, 2, 5, 8 |
| 5 and 8 | Keep | 1, 4, 2, 5, 8 |

8 is now in its final place.

### Pass 2

| Compare | Action | List |
| --- | --- | --- |
| 1 and 4 | Keep | 1, 4, 2, 5, 8 |
| 4 and 2 | Swap | 1, 2, 4, 5, 8 |
| 4 and 5 | Keep | 1, 2, 4, 5, 8 |

### Pass 3

No swaps happen, so the list is sorted and the algorithm stops.

## Code

```python
def bubble_sort(values):
    for end in range(len(values) - 1, 0, -1):
        swapped = False
        for i in range(end):
            if values[i] > values[i + 1]:
                values[i], values[i + 1] = values[i + 1], values[i]
                swapped = True
        if not swapped:
            break                # no swaps means it is already sorted
    return values

print(bubble_sort([5, 1, 4, 2, 8]))  # [1, 2, 4, 5, 8]
print(bubble_sort([1, 2, 3]))  # [1, 2, 3]
```

The `swapped` flag is an important improvement. Without it, the sort always does every pass, even on a sorted list.

## Complexity

| Case | Time | When |
| --- | --- | --- |
| Best | O(n) | Already sorted: one pass, no swaps |
| Average | O(n²) | Random order |
| Worst | O(n²) | Reverse order |
| Space | O(1) | Swaps happen inside the list |

### Why It Is O(n²)

The first pass makes `n - 1` comparisons, the next makes `n - 2`, and so on:

```text
(n - 1) + (n - 2) + ... + 1  =  n(n - 1) / 2
```

For 10,000 values, that is about 50 million comparisons.

## Properties

- **Stable.** Equal values are never swapped, because the check uses `>` and not `>=`. See [[Stable vs Unstable Sorting]].
- **In place.** It only needs one extra variable for swapping.
- **Adaptive.** With the flag, it speeds up on nearly sorted data.

## How It Compares

| Sort | Average | Swaps or Moves | Best Feature |
| --- | --- | --- | --- |
| Bubble sort | O(n²) | Many | Simple to learn |
| [[Selection Sort]] | O(n²) | Very few | Fewest writes |
| [[Insertion Sort]] | O(n²) | Fewer than bubble | Fast on nearly sorted data |
| [[Merge Sort]] | O(n log n) | | Reliable on large data |

Bubble sort does more swaps than insertion sort on the same data, and is slower in practice. There is rarely a practical reason to choose it, other than teaching.

## Common Mistakes

- **Going past the end.** Comparing `values[i + 1]` when `i` is the last index goes out of bounds. Stop one position earlier.
- **Not shrinking the range.** After each pass, the end of the list is done. Checking it again is wasted work.
- **Using `>=`.** That swaps equal values for no reason, and makes the sort unstable.
- **Calling it fast because of the best case.** `O(n)` only applies to data that is already sorted.
