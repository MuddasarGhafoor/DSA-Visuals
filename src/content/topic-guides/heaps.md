> A tree stored in an array, where the smallest or largest value is always on top.

## What It Is

A **binary heap** is a [[Binary Tree Basics|binary tree]] that follows two rules:

1. **Shape.** It is **complete**: every level is full, except possibly the last, which fills from the left.
2. **Order.** In a **min heap**, every parent is smaller than or equal to its children. In a **max heap**, every parent is larger than or equal to its children.

```text
Min heap:
         1
       /   \
      3     2
     / \   /
    7   4 5
```

The smallest value is always at the root, so you can read it in `O(1)`.

> A heap isn't fully sorted. Here, 3 and 2 have no required order, and neither do 7, 4, and 5. The rule only compares parents with their own children.

## Stored in an Array

Because the tree is complete, it has no gaps, so it fits in an array with no links at all. For the node at index `i`:

| Find | Formula |
| --- | --- |
| Parent | `(i - 1) // 2` |
| Left child | `2 * i + 1` |
| Right child | `2 * i + 2` |

```text
index:  0  1  2  3  4  5
value:  1  3  2  7  4  5
```

The node at index 1 (value 3) has children at indexes 3 and 4 (values 7 and 4).

## Operations

### Insert: Sift Up

1. Add the new value at the end, which keeps the shape.
2. While it is smaller than its parent, swap them.

### Remove the Smallest: Sift Down

1. Save the root.
2. Move the last value to the root, which keeps the shape.
3. While it is larger than a child, swap it with its **smaller** child.

### Worked Example: Insert 0

```text
Add at the end:   1 3 2 7 4 5 0     0's parent is 2
Swap with 2:      1 3 0 7 4 5 2     0's parent is 1
Swap with 1:      0 3 1 7 4 5 2     0 is at the root, so stop
```

## Code

```python
class MinHeap:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)
        i = len(self.items) - 1
        while i > 0:
            parent = (i - 1) // 2
            if self.items[parent] <= self.items[i]:
                break
            self.items[parent], self.items[i] = self.items[i], self.items[parent]
            i = parent

    def pop(self):
        items = self.items
        smallest = items[0]
        last = items.pop()
        if items:
            items[0] = last
            i = 0
            while True:
                left, right = 2 * i + 1, 2 * i + 2
                child = i
                if left < len(items) and items[left] < items[child]:
                    child = left
                if right < len(items) and items[right] < items[child]:
                    child = right
                if child == i:
                    break
                items[i], items[child] = items[child], items[i]
                i = child
        return smallest

heap = MinHeap()
for value in [5, 3, 8, 1, 2]:
    heap.push(value)
print(heap.items[0])  # 1
print([heap.pop() for _ in range(5)])  # [1, 2, 3, 5, 8]
```

## Building a Heap Quickly

Inserting `n` values one at a time takes `O(n log n)`. There is a faster way: put them all in the array, then sift down each parent, from the last one back to the root. This takes only `O(n)`, because most nodes are near the bottom and barely move.

In Python, `heapq.heapify` does this.

## Complexity

| Operation | Time | Why |
| --- | --- | --- |
| Read the smallest | O(1) | It is at index 0 |
| Insert | O(log n) | Sifts up the height of the tree |
| Remove the smallest | O(log n) | Sifts down the height of the tree |
| Build from a list | O(n) | Most nodes barely move |
| Search for any value | O(n) | The order doesn't help |
| Space | O(n) | One array |

## Where It Is Used

- **[[Priority Queue|Priority queues]],** the main reason heaps exist.
- **[[Heap Sort]],** which sorts in place.
- **[[Dijkstra]]** and **[[Prim's Algorithm]],** which always need the closest node next.
- **Finding the k largest values.** Keep a min heap of size `k`, for `O(n log k)` total.

```python
import heapq

def k_largest(values, k):
    heap = []
    for value in values:
        heapq.heappush(heap, value)
        if len(heap) > k:
            heapq.heappop(heap)    # drop the smallest of the k + 1
    return sorted(heap, reverse=True)

print(k_largest([5, 1, 9, 3, 7], 2))  # [9, 7]
```

## Common Mistakes

- **Swapping with either child when sifting down.** Always pick the smaller child in a min heap, or the larger one in a max heap. Otherwise, the rule breaks.
- **Expecting a sorted array.** Only the root is guaranteed. Getting everything in order means removing values one by one.
- **Off-by-one in the formulas.** The formulas differ if an array starts at index 1, where the children are at `2i` and `2i + 1`.
- **Searching a heap.** To find an arbitrary value, a heap gives no help. Use a [[Hash Tables|hash table]] alongside it if you need this.
