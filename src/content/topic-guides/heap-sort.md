> Building a heap, then repeatedly moving its largest value to the end. It is worth reading the Heaps guide first.

## What It Is

**Heap sort** uses a max [[Heaps|heap]] to find the largest remaining value quickly. It builds a heap from the list, swaps the largest value to the end, and repairs the heap. Then it repeats for the rest.

You can think of it as [[Selection Sort]] with a better way of finding the largest value: `O(log n)` per selection instead of `O(n)`.

## How It Works

A heap fits inside the array itself, with no extra structure. For the value at index `i`, its children are at `2i + 1` and `2i + 2`.

### Phase 1: Build the Max Heap

Start from the last parent, and work back to the root. At each one, **sift down**: swap the value with its larger child until it is larger than both children.

### Phase 2: Sort

Repeat until the heap is empty:

1. The largest value is at index 0. Swap it with the last value in the heap.
2. Shrink the heap by one. The value at the end is now in its final place.
3. Sift the new root down to repair the heap.

## Worked Example

Sort `[4, 10, 3, 5, 1]`.

### Building the Heap

The last parent is at index 1.

| Step | Action | Array |
| --- | --- | --- |
| Index 1 (value 10) | Children 5 and 1 are smaller, so keep it | 4, 10, 3, 5, 1 |
| Index 0 (value 4) | Swap with larger child 10 | 10, 4, 3, 5, 1 |
| Continue with 4 | Swap with larger child 5 | 10, 5, 3, 4, 1 |

```text
        10
       /  \
      5    3
     / \
    4   1
```

### Sorting

The `|` marks where the sorted part begins.

| Step | Array After Swap and Sift |
| --- | --- |
| Move 10 to the end | 5, 4, 3, 1 \| 10 |
| Move 5 to the end | 4, 1, 3 \| 5, 10 |
| Move 4 to the end | 3, 1 \| 4, 5, 10 |
| Move 3 to the end | 1 \| 3, 4, 5, 10 |

## Code

```python
def sift_down(values, start, end):
    parent = start
    while True:
        child = 2 * parent + 1
        if child >= end:
            return
        if child + 1 < end and values[child + 1] > values[child]:
            child += 1                      # pick the larger child
        if values[parent] >= values[child]:
            return
        values[parent], values[child] = values[child], values[parent]
        parent = child

def heap_sort(values):
    n = len(values)
    for start in range(n // 2 - 1, -1, -1):
        sift_down(values, start, n)         # build the heap
    for end in range(n - 1, 0, -1):
        values[0], values[end] = values[end], values[0]
        sift_down(values, 0, end)           # repair what is left
    return values

print(heap_sort([4, 10, 3, 5, 1]))  # [1, 3, 4, 5, 10]
print(heap_sort([2, 1]))  # [1, 2]
```

## Complexity

| Part | Time | Why |
| --- | --- | --- |
| Building the heap | O(n) | Most nodes are near the bottom, and sift only a short way |
| Each removal | O(log n) | Sifts down the height of the tree |
| All removals | O(n log n) | n removals |
| Total, in every case | O(n log n) | |
| Space | O(1) | Everything happens inside the array |

### Why Building Is Only O(n)

It looks like `n` sifts at `log n` each, but half the nodes are leaves and don't sift at all, a quarter sift at most one level, and so on. Those costs add up to less than `2n`.

## How It Compares

| | Heap Sort | [[Merge Sort]] | [[Quick Sort]] |
| --- | --- | --- | --- |
| Worst case | O(n log n) | O(n log n) | O(n²) |
| Extra space | O(1) | O(n) | O(log n) |
| Stable | No | Yes | No |
| Speed in practice | Slower | Good | Usually fastest |

Heap sort is the only one of these with both a guaranteed `O(n log n)` and `O(1)` space. It tends to be slower in practice because jumping around the heap isn't friendly to the processor's cache.

## Not Stable

The swap to the end can jump a value past another equal value, so equal values may change order. See [[Stable vs Unstable Sorting]].

## Common Mistakes

- **Using a min heap for ascending order.** With the largest-to-end approach, you need a **max** heap.
- **Sifting past the shrinking end.** The `end` argument must exclude the values already sorted.
- **Starting the build at the wrong index.** The last parent is at `n // 2 - 1`. Leaves are already valid heaps.
- **Comparing with just one child.** Always swap with the larger child, or the heap property breaks.
