> Measuring how much extra memory an algorithm uses as its input grows.

## What It Is

Time isn't the only cost. **Space complexity** measures how much memory an algorithm needs as its input grows. It uses the same Big-O notation as time.

## Two Ways to Count

| Term | What It Counts |
| --- | --- |
| Auxiliary space | Only the extra memory the algorithm adds |
| Total space | The input plus the extra memory |

Most of the time, people mean auxiliary space. An algorithm that sorts an array using only a few variables is `O(1)` auxiliary space, even though the array itself takes `O(n)`.

An algorithm that uses `O(1)` auxiliary space is called **in-place**.

## What Takes Up Space

Look for these three things:

1. **Variables.** A fixed number of them is `O(1)`, however large their values.
2. **New structures.** A new array or map of size `n` is `O(n)`, and a table of `n` by `n` is `O(n²)`.
3. **Recursion.** Each active call holds a stack frame, so a recursion `d` calls deep uses `O(d)` space, even with no arrays.

## Worked Examples

### In Place vs a Copy

Both functions reverse a list in `O(n)` time, but their memory use differs.

```python
def reversed_copy(values):
    result = []                     # a new list of n values: O(n) space
    for value in values:
        result.insert(0, value)
    return result

def reverse_in_place(values):
    low, high = 0, len(values) - 1  # two variables: O(1) space
    while low < high:
        values[low], values[high] = values[high], values[low]
        low += 1
        high -= 1
    return values

print(reversed_copy([1, 2, 3]))  # [3, 2, 1]
print(reverse_in_place([1, 2, 3]))  # [3, 2, 1]
```

### Hidden Recursion Space

This function creates no arrays, yet it uses `O(n)` space, because `n` calls are waiting on the stack at the deepest point.

```python
def total(n):
    if n == 0:
        return 0
    return n + total(n - 1)

print(total(100))  # 5050
```

The space depends on the **deepest** moment, not the total number of calls. A balanced tree traversal makes `n` calls, but only `O(log n)` are ever active at once.

## Common Algorithms

| Algorithm | Time | Auxiliary Space | Why |
| --- | --- | --- | --- |
| [[Bubble Sort]] | O(n²) | O(1) | Swaps inside the array |
| [[Heap Sort]] | O(n log n) | O(1) | The heap lives inside the array |
| [[Quick Sort]] | O(n log n) | O(log n) | The recursion stack, on average |
| [[Merge Sort]] | O(n log n) | O(n) | Needs a second array to merge into |
| [[Counting Sort]] | O(n + k) | O(n + k) | A count array and an output array |
| [[BFS]] | O(V + E) | O(V) | The queue and the visited list |
| [[Longest Common Subsequence]] | O(nm) | O(nm) | A table of answers |

## Why It Matters

- **Memory can run out.** A table of 100,000 by 100,000 needs 10 billion cells, which is far more than most machines can hold.
- **Using memory takes time.** Allocating and filling large structures is slow, and reading far-apart memory is slower than reading nearby memory.
- **You can often save it.** Many dynamic programming solutions only need the last row of their table, which cuts `O(nm)` space to `O(m)`.

## Common Mistakes

- **Counting the input as extra.** If the function only reads its input, that input doesn't add to auxiliary space.
- **Forgetting the call stack.** A recursive function can't be `O(1)` space unless the language reuses frames for tail calls.
- **Counting total calls instead of depth.** Space is about what exists at the same moment. Memory from a finished call is free to reuse.
