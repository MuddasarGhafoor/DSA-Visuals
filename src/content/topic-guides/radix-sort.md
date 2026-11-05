> Sorting numbers one digit at a time, using a stable sort for each digit.

## What It Is

**Radix sort** sorts numbers without comparing them to each other. It looks at one digit at a time, and groups values by that digit. Starting from the **last** digit, it repeats until every digit has been used.

The surprise is that going from the least important digit to the most important one works, and that it depends on each pass being [[Stable vs Unstable Sorting|stable]].

## How It Works

This common version is called **LSD radix sort**, for least significant digit.

1. Sort all the values by their last digit, using a stable sort.
2. Sort them by the next digit to the left, using a stable sort.
3. Repeat for each digit, up to the longest number.

## Worked Example

Sort `[170, 45, 75, 90, 802, 24, 2, 66]`.

| Pass | Sorted by | Result |
| --- | --- | --- |
| 1 | Ones digit | 170, 90, 802, 2, 24, 45, 75, 66 |
| 2 | Tens digit | 802, 2, 24, 45, 66, 170, 75, 90 |
| 3 | Hundreds digit | 2, 24, 45, 66, 75, 90, 170, 802 |

### Why Stability Matters

Look at 170 and 75 in pass 3. Both have hundreds digits that decide their order: 75 has 0, and 170 has 1. Now take 24 and 2. Both have a hundreds digit of 0, so pass 3 can't tell them apart. They stay in the order pass 2 left them in, which is exactly the correct order for those lower digits.

Each pass keeps the work of the previous passes for any values that tie. If the inner sort weren't stable, the earlier work would be lost.

## Code

Each pass uses [[Counting Sort]], since there are only 10 possible digits.

```python
def sort_by_digit(values, place):
    counts = [0] * 10
    for value in values:
        counts[(value // place) % 10] += 1
    for digit in range(1, 10):
        counts[digit] += counts[digit - 1]
    output = [0] * len(values)
    for value in reversed(values):         # backward keeps it stable
        digit = (value // place) % 10
        counts[digit] -= 1
        output[counts[digit]] = value
    return output

def radix_sort(values):
    if not values:
        return []
    place = 1
    while max(values) // place > 0:
        values = sort_by_digit(values, place)
        place *= 10
    return values

print(radix_sort([170, 45, 75, 90, 802, 24, 2, 66]))  # [2, 24, 45, 66, 75, 90, 170, 802]
print(radix_sort([3, 1, 2]))  # [1, 2, 3]
```

## Complexity

With `n` values, `d` digits, and a base of `b`:

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(d × (n + b)) | `d` passes of counting sort |
| Space | O(n + b) | The output and count arrays |

If `d` and `b` are small constants, this is effectively `O(n)`.

### Compared to O(n log n)

| Sorting 1,000,000 Values | Steps, Roughly |
| --- | --- |
| Comparison sort: `n log n` | 20,000,000 comparisons |
| Radix sort, 32-bit values, base 256: 4 passes | 4,000,000 simple moves |

Using a larger base means fewer passes. Base 256 reads one byte at a time, so a 32-bit integer takes only 4 passes.

## Where It Fits

### Good For

- **Integers of limited size,** such as IDs and phone numbers.
- **Fixed-length strings,** such as postal codes or dates like `2026-11-05`.
- **Very large collections of small keys.**

### Not Good For

- **Very long keys.** `d` becomes large, which removes the advantage.
- **Decimal numbers,** without extra work on their format.
- **Saving memory.** It needs a second array, unlike [[Quick Sort]].

## MSD: The Other Direction

**MSD radix sort** starts at the most important digit, and sorts each group separately. It suits variable-length strings, and can stop early once a group has only one value. It is more complex, because it recurses into many groups.

| | LSD | MSD |
| --- | --- | --- |
| Starts from | The last digit | The first digit |
| Structure | A simple loop | Recursive |
| Variable-length keys | Needs padding | Handles them naturally |
| Early exit | No | Yes |

## Common Mistakes

- **Using an unstable inner sort.** The result will simply be wrong, because each pass undoes the last.
- **Starting from the first digit** with the simple loop. That is a different algorithm, and needs recursion.
- **Negative numbers.** The digit formula assumes non-negative values. Sort the negatives separately and reverse them, or shift all values up.
- **Different string lengths.** Pad them to the same length before using LSD, or `"ab"` and `"abc"` won't line up.
