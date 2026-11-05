> Sorting integers from a small range by counting how many times each value appears.

## What It Is

Most sorts work by comparing values. **Counting sort** never compares two values. It counts how often each value appears, then uses those counts to work out where each value belongs.

Imagine sorting a pile of exam papers graded 0 to 5. You don't compare papers against each other. You count how many have each grade, and you know straight away that the 3s start after all the 0s, 1s, and 2s.

This only works when the values are integers from a fairly small range.

## How It Works

For values from 0 up to `k`:

1. **Count.** Make an array of `k + 1` zeros, and count each value.
2. **Accumulate.** Add up the counts from left to right. Each entry now says how many values are less than or equal to that one, which tells you where it ends.
3. **Place.** Walk through the input **from the end to the start**, put each value at its position, and lower that position by one.

## Worked Example

Sort `[2, 5, 3, 0, 2, 3, 0, 3]`.

### Step 1: Count

```text
value:   0  1  2  3  4  5
count:   2  0  2  3  0  1
```

### Step 2: Accumulate

```text
value:   0  1  2  3  4  5
ends at: 2  2  4  7  7  8
```

So the 3s end at position 7, which means they fill positions 4, 5, and 6 (counting from 0).

### Step 3: Place

| Reading | Position | Output |
| --- | --- | --- |
| 3 (last value) | 6 | `_ _ _ _ _ _ 3 _` |
| 0 | 1 | `_ 0 _ _ _ _ 3 _` |
| 3 | 5 | `_ 0 _ _ _ 3 3 _` |
| 2 | 3 | `_ 0 _ 2 _ 3 3 _` |
| 0 | 0 | `0 0 _ 2 _ 3 3 _` |
| 3 | 4 | `0 0 _ 2 3 3 3 _` |
| 5 | 7 | `0 0 _ 2 3 3 3 5` |
| 2 | 2 | `0 0 2 2 3 3 3 5` |

## Code

```python
def counting_sort(values, max_value):
    counts = [0] * (max_value + 1)
    for value in values:
        counts[value] += 1
    for i in range(1, len(counts)):
        counts[i] += counts[i - 1]        # now it says where each value ends
    output = [0] * len(values)
    for value in reversed(values):        # backward, so equal values keep their order
        counts[value] -= 1
        output[counts[value]] = value
    return output

print(counting_sort([2, 5, 3, 0, 2, 3, 0, 3], 5))  # [0, 0, 2, 2, 3, 3, 3, 5]
```

## Sorting Records by a Key

The simple approach of writing out each value `count` times only works for plain numbers. The accumulate step matters because real data has **records** attached to its keys. Here, each student keeps their name while being sorted by grade.

```python
def sort_by_grade(students, max_grade):
    counts = [0] * (max_grade + 1)
    for _, grade in students:
        counts[grade] += 1
    for i in range(1, len(counts)):
        counts[i] += counts[i - 1]
    output = [None] * len(students)
    for student in reversed(students):
        counts[student[1]] -= 1
        output[counts[student[1]]] = student
    return output

students = [("Ali", 2), ("Sara", 1), ("Omar", 2), ("Zain", 0)]
print(sort_by_grade(students, 2))  # [('Zain', 0), ('Sara', 1), ('Ali', 2), ('Omar', 2)]
```

Ali stays before Omar, as in the input. Working backward is what keeps this [[Stable vs Unstable Sorting|stable]], and it is what makes [[Radix Sort]] possible.

## Complexity

With `n` values in a range of size `k`:

| Measure | Cost |
| --- | --- |
| Time, in every case | O(n + k) |
| Space | O(n + k) |

### When It Beats Comparison Sorts

Comparison sorts can't beat `O(n log n)`, but counting sort isn't one. It is `O(n)` when `k` is about the same size as `n` or smaller.

| Situation | Good Fit? |
| --- | --- |
| 1,000,000 exam grades from 0 to 100 | Excellent |
| Ages of people | Excellent |
| 10 numbers up to one billion | Terrible: a billion-slot array |
| Decimal numbers or long strings | Doesn't apply directly |

## Handling Negative Numbers

Shift everything by the minimum value, so that the range starts at 0: use `value - min_value` as the index.

## Common Mistakes

- **Using it on a huge range.** Time and memory depend on `k`, whatever `n` is.
- **Going forward in the placing step.** It still sorts, but equal values reverse, so it is no longer stable.
- **Allocating `k` slots rather than `k + 1`.** Values run from 0 to `k`, which is `k + 1` different values.
