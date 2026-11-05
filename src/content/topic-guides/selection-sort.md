> Repeatedly finding the smallest remaining value and moving it into place.

## What It Is

**Selection sort** finds the smallest value and puts it first. Then it finds the next smallest and puts it second, and so on.

It is how you might tidy a row of books by height: scan for the shortest, put it at the left, then scan the rest for the next shortest.

The list has two parts at all times: a sorted part on the left, which holds the smallest values in their final positions, and an unsorted part on the right.

## How It Works

1. Scan the unsorted part to find its smallest value.
2. Swap that value with the first value of the unsorted part.
3. The sorted part has grown by one. Repeat until one value remains.

## Worked Example

Sort `[29, 10, 14, 37, 13]`. The `|` separates the sorted part.

| Step | Smallest Found | Swap | List After |
| --- | --- | --- | --- |
| 1 | 10 | 29 and 10 | 10 \| 29, 14, 37, 13 |
| 2 | 13 | 29 and 13 | 10, 13 \| 14, 37, 29 |
| 3 | 14 | None needed | 10, 13, 14 \| 37, 29 |
| 4 | 29 | 37 and 29 | 10, 13, 14, 29 \| 37 |

The last value is now in place automatically.

## Code

```python
def selection_sort(values):
    for start in range(len(values) - 1):
        smallest = start
        for i in range(start + 1, len(values)):
            if values[i] < values[smallest]:
                smallest = i
        values[start], values[smallest] = values[smallest], values[start]
    return values

print(selection_sort([29, 10, 14, 37, 13]))  # [10, 13, 14, 29, 37]
```

## Complexity

| Case | Comparisons | Swaps |
| --- | --- | --- |
| Best | O(n²) | 0 |
| Average | O(n²) | O(n) |
| Worst | O(n²) | n - 1 |
| Space | O(1) | |

It always does the same number of comparisons:

```text
(n - 1) + (n - 2) + ... + 1  =  n(n - 1) / 2
```

Even on a sorted list it does all of them, because it can't know the smallest value without checking every remaining value. So unlike [[Insertion Sort]] and [[Bubble Sort]], it doesn't speed up on nearly sorted data.

## Its One Real Strength: Few Writes

Selection sort makes at most `n - 1` swaps, the fewest of the simple sorts.

| Sort | Writes on 1,000 Reversed Values, Roughly |
| --- | --- |
| Selection sort | 1,000 |
| [[Insertion Sort]] | 500,000 |
| [[Bubble Sort]] | 1,000,000 |

This matters when writing is much more expensive than reading, such as with flash memory that wears out, or with very large records.

## Why It Isn't Stable

A swap can jump a value over an equal one. Take `[3a, 3b, 1]`, where the letters mark the original order:

```text
Step 1: the smallest is 1. Swap it with 3a.
Result: [1, 3b, 3a]
```

3a is now after 3b, so the order of equal values has changed. See [[Stable vs Unstable Sorting]].

## How It Compares

| | Selection | [[Insertion Sort\|Insertion]] | [[Bubble Sort\|Bubble]] | [[Heap Sort\|Heap]] |
| --- | --- | --- | --- | --- |
| Best case | O(n²) | O(n) | O(n) | O(n log n) |
| Worst case | O(n²) | O(n²) | O(n²) | O(n log n) |
| Swaps | O(n) | O(n²) | O(n²) | O(n log n) |
| Stable | No | Yes | Yes | No |

[[Heap Sort]] is the same idea with a faster way to find the extreme value: a heap finds it in `O(log n)`, instead of `O(n)` for a scan.

## Common Mistakes

- **Swapping as you scan.** Swapping every time you see a smaller value still sorts, but it throws away the low swap count. Remember the index, and swap once at the end.
- **Starting the inner loop at 0.** The sorted part is finished. The scan should start at `start + 1`.
- **Expecting speedup on sorted input.** It always does the same comparisons.
