> A stable sort keeps equal values in their original order. An unstable sort may not.

## What It Is

Sometimes two values count as equal, yet they aren't the same thing. Two students might have the same grade but different names.

A sort is **stable** if values that count as equal stay in the same order they started in. An **unstable** sort may rearrange them.

## Worked Example

Sort these students by grade only.

| Input Order | Name | Grade |
| --- | --- | --- |
| 1 | Ali | B |
| 2 | Sara | A |
| 3 | Omar | B |
| 4 | Zain | A |

```text
Stable result:      Sara A, Zain A, Ali B, Omar B
                    Sara stays before Zain, and Ali stays before Omar.

Unstable result:    Zain A, Sara A, Omar B, Ali B
                    The grades are in order, but the ties have been reshuffled.
```

Both results are sorted by grade. Only the stable one keeps the original order for ties.

## Why It Matters

### Sorting by Several Columns

This is the main reason. Suppose you want students sorted by grade, and alphabetically within each grade. With a stable sort, you just sort by name first, then by grade.

```python
students = [("Omar", "B"), ("Zain", "A"), ("Ali", "B"), ("Sara", "A")]

by_name = sorted(students, key=lambda s: s[0])
by_grade = sorted(by_name, key=lambda s: s[1])     # Python's sort is stable

print(by_grade)  # [('Sara', 'A'), ('Zain', 'A'), ('Ali', 'B'), ('Omar', 'B')]
```

The second sort keeps the alphabetical order for students with the same grade. This is how clicking on column headers in a spreadsheet can work.

### Other Algorithms Depend on It

[[Radix Sort]] relies on a stable sort for each digit. Without stability, each pass would destroy the previous one.

### Predictable Results

A stable sort gives the same output order each time for the same input, which helps with testing and with interfaces where rows shouldn't jump around.

## Which Sorts Are Stable

| Algorithm | Stable? | Why |
| --- | --- | --- |
| [[Bubble Sort]] | Yes | Only swaps neighbors that are strictly out of order |
| [[Insertion Sort]] | Yes | Stops at the first value that isn't larger |
| [[Merge Sort]] | Yes | Takes from the left half on ties |
| [[Counting Sort]] | Yes | Places values from the end, going backward |
| [[Radix Sort]] | Yes | Each pass is stable |
| [[Bucket Sort]] | Yes, if its inner sort is | Buckets keep arrival order |
| [[Selection Sort]] | No | A long-range swap can jump over an equal value |
| [[Quick Sort]] | No | Partitioning swaps across long distances |
| [[Heap Sort]] | No | Moving values through the heap reorders ties |

## Testing a Sort

To test stability, tag each value with its original position, sort, and check that equal values still have increasing positions.

```python
def is_stable(sort_function, values):
    tagged = [(value, i) for i, value in enumerate(values)]
    result = sort_function(tagged)
    return all(
        not (a[0] == b[0] and a[1] > b[1])
        for a, b in zip(result, result[1:])
    )

def insertion(items):
    items = list(items)
    for i in range(1, len(items)):
        current = items[i]
        j = i - 1
        while j >= 0 and items[j][0] > current[0]:
            items[j + 1] = items[j]
            j -= 1
        items[j + 1] = current
    return items

def selection(items):
    items = list(items)
    for start in range(len(items) - 1):
        smallest = min(range(start, len(items)), key=lambda i: items[i][0])
        items[start], items[smallest] = items[smallest], items[start]
    return items

print(is_stable(insertion, [3, 3, 1]))  # True
print(is_stable(selection, [3, 3, 1]))  # False
```

A sort can pass this on one input and still be unstable, so a single passing test doesn't prove stability. One failing test does prove it isn't stable.

## Making Any Sort Stable

Add the original position to the sort key, and use it to break ties. For example, sort by `(grade, original_index)`. Equal grades then compare by position, so their order is kept. This takes `O(n)` extra space.

## What Languages Use

| Language | Default Sort | Stable? |
| --- | --- | --- |
| Python | Timsort | Yes |
| Java, objects | Timsort | Yes |
| Java, primitives | Dual-pivot quicksort | No, and it can't matter for plain numbers |
| JavaScript | Timsort in modern engines | Yes, required since 2019 |
| C++ `sort` | Introsort | No: use `stable_sort` |

## Common Mistakes

- **Expecting stability from any library sort.** Check the documentation. C++ `std::sort` isn't stable.
- **Sorting columns in the wrong order.** With stable sorts, the **last** sort is the main key. So sort by the least important column first.
- **Breaking stability with `>=`.** In bubble or insertion sort, using `>=` instead of `>` moves equal values past each other.
- **Thinking it matters for plain numbers.** If equal values are truly identical, stability has no visible effect. It only matters when records carry other data.
