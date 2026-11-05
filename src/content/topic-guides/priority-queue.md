> A queue that always serves its highest-priority value next, usually built on a heap.

## What It Is

A normal [[Queue]] serves whoever has waited longest. A **priority queue** serves whoever is most important, whatever order they arrived in.

Think of a hospital emergency room. A patient with a serious injury goes before someone who has been waiting longer with a mild one.

## Operations

| Operation | What It Does |
| --- | --- |
| insert(value, priority) | Adds a value with its priority |
| extract_min() | Removes and returns the highest-priority value |
| peek() | Reads the highest-priority value without removing it |
| decrease_key(value, priority) | Raises a value's priority |

A priority queue is an [[Abstract Data Types|abstract data type]]. It says what happens, and leaves open how to build it. Usually, the smallest number means the highest priority.

## Ways to Build One

| Structure | Insert | Extract | Peek | Notes |
| --- | --- | --- | --- | --- |
| Unsorted list | O(1) | O(n) | O(n) | Fine if extracts are rare |
| Sorted list | O(n) | O(1) | O(1) | Fine if inserts are rare |
| [[Binary Search Tree\|Balanced tree]] | O(log n) | O(log n) | O(log n) | Also keeps everything in order |
| [[Heaps\|Binary heap]] | O(log n) | O(log n) | O(1) | The standard choice |

The heap wins because it has good speed on all three operations, and it fits in a plain array.

## Code

Python's `heapq` module turns a list into a min heap. Storing `(priority, value)` pairs makes it compare priorities first.

```python
import heapq

class PriorityQueue:
    def __init__(self):
        self.heap = []
        self.counter = 0     # breaks ties, in the order things arrived

    def insert(self, value, priority):
        heapq.heappush(self.heap, (priority, self.counter, value))
        self.counter += 1

    def extract_min(self):
        priority, _, value = heapq.heappop(self.heap)
        return value

    def is_empty(self):
        return not self.heap

tasks = PriorityQueue()
tasks.insert("write report", 3)
tasks.insert("fix outage", 1)
tasks.insert("reply to email", 2)
tasks.insert("restart server", 1)
print(tasks.extract_min())  # fix outage
print(tasks.extract_min())  # restart server
print(tasks.extract_min())  # reply to email
```

### Why the Counter

Without it, two equal priorities would make Python compare the values themselves, which may not be possible. The counter also keeps ties in order of arrival, so the queue behaves in a stable, fair way.

## Worked Example: Merging Sorted Lists

Merge several sorted lists into one. At any moment, the next value must be the front of one of the lists, so keep those fronts in a priority queue.

```python
import heapq

def merge_sorted(lists):
    heap = []
    for i, values in enumerate(lists):
        if values:
            heap.append((values[0], i, 0))
    heapq.heapify(heap)
    result = []
    while heap:
        value, i, position = heapq.heappop(heap)
        result.append(value)
        if position + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][position + 1], i, position + 1))
    return result

print(merge_sorted([[1, 4, 7], [2, 5], [3, 6]]))  # [1, 2, 3, 4, 5, 6, 7]
```

With `k` lists and `n` values in total, this takes `O(n log k)`.

## Changing a Priority

[[Dijkstra]] often needs to raise the priority of a value already in the queue. There are two common approaches:

| Approach | How It Works | Tradeoff |
| --- | --- | --- |
| Lazy deletion | Insert the value again with the new priority. Skip stale copies when they come out. | Simple, and uses a little more memory |
| Indexed heap | Keep a map from each value to its heap position, and sift it up | No extra copies, more code |

Most programs use lazy deletion, since it is so simple.

## Where It Is Used

- **Graph algorithms:** [[Dijkstra]], [[Prim's Algorithm]], and [[A* Search]] all need the closest node next.
- **Compression:** [[Huffman Coding]] repeatedly joins the two rarest symbols.
- **Scheduling:** operating systems choose the next process by priority.
- **Simulations:** events are processed in order of time.
- **Finding the top k items** from a huge stream.

## Common Mistakes

- **Confusing it with sorting.** A priority queue only guarantees the next value, not the full order, so it is cheaper than keeping everything sorted.
- **Assuming equal priorities come out in arrival order.** A plain heap doesn't guarantee that. Add a counter, as the code does.
- **Mixing up min and max.** Python's `heapq` only has a min heap. For a max heap, store negative priorities.
- **Scanning the queue to change a priority.** A linear search defeats the purpose. Use one of the approaches above.
