> A double-ended queue, which adds and removes values at both ends.

## What It Is

A **deque** (say "deck") is short for *double-ended queue*. You can add or remove values at either end, and all four operations are fast.

```text
          push_front                         push_back
              ->    +----+----+----+----+    <-
                    | 10 | 20 | 30 | 40 |
              <-    +----+----+----+----+    ->
          pop_front                          pop_back
```

It generalizes two structures you already know:

- Use one end only, and it is a [[Stack]].
- Add at one end and remove at the other, and it is a [[Queue]].

## Two Ways to Build One

### On a Circular Array

Use the same wrap-around idea as a [[Circular Queue]], and allow the front index to move backward too.

```python
class Deque:
    def __init__(self, capacity):
        self.items = [None] * capacity
        self.capacity = capacity
        self.front = 0
        self.count = 0

    def push_back(self, value):
        self.items[(self.front + self.count) % self.capacity] = value
        self.count += 1

    def push_front(self, value):
        self.front = (self.front - 1) % self.capacity   # wraps below 0
        self.items[self.front] = value
        self.count += 1

    def pop_front(self):
        value = self.items[self.front]
        self.front = (self.front + 1) % self.capacity
        self.count -= 1
        return value

    def pop_back(self):
        self.count -= 1
        return self.items[(self.front + self.count) % self.capacity]

deque = Deque(4)
deque.push_back(20)
deque.push_back(30)
deque.push_front(10)
print(deque.pop_back())  # 30
print(deque.pop_front())  # 10
print(deque.pop_front())  # 20
```

For brevity, this version doesn't check for full or empty. Real code must.

### On a Doubly Linked List

A [[Doubly and Circular Linked Lists|doubly linked list]] already has fast access to both ends, and it grows without limit. Each value costs two extra links, though.

| | Circular Array | Doubly Linked List |
| --- | --- | --- |
| All four end operations | O(1) | O(1) |
| Read by index | O(1) | O(n) |
| Growing | Must copy when full | One node at a time |
| Memory per value | Just the value | The value and two links |
| Speed in practice | Faster, values sit together | Slower, nodes are scattered |

## Worked Example: Sliding Window Maximum

A classic use of a deque: find the largest value in each window of size `k` as it slides across a list.

Keep a deque of indexes whose values are in decreasing order. The front is always the largest in the window.

1. Remove from the front if that index has left the window.
2. Remove from the back while those values are smaller than the new one. They can never be the maximum again.
3. Add the new index at the back.

```python
from collections import deque as Queue

def window_max(values, k):
    candidates = Queue()    # indexes, with values in decreasing order
    result = []
    for i, value in enumerate(values):
        if candidates and candidates[0] <= i - k:
            candidates.popleft()
        while candidates and values[candidates[-1]] < value:
            candidates.pop()
        candidates.append(i)
        if i >= k - 1:
            result.append(values[candidates[0]])
    return result

print(window_max([1, 3, 2, 5, 4, 1], 3))  # [3, 5, 5, 5]
```

Each index enters and leaves the deque at most once, so the total time is `O(n)`, even with the inner loop.

## Complexity

| Operation | Time |
| --- | --- |
| push_front, push_back | O(1) |
| pop_front, pop_back | O(1) |
| Read an end | O(1) |
| Search | O(n) |

## Where It Is Used

- **Undo with a limit.** Add new actions at one end, and drop the oldest from the other.
- **Task stealing,** where a worker takes from one end and others steal from the other.
- **Shortest paths with 0 and 1 weights.** See [[0-1 BFS]].

## Common Mistakes

- **Using a plain list as a deque.** In Python, `list.pop(0)` and `list.insert(0, x)` are `O(n)`. Use `collections.deque`.
- **A negative index in other languages.** `(front - 1) % capacity` wraps correctly in Python, but gives a negative number in C and Java. Write `(front - 1 + capacity) % capacity`.
- **Mixing up which end is which.** Decide on front and back, and use those names everywhere.
