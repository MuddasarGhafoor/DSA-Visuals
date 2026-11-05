> A first-in, first-out structure, where values join at the back and leave from the front.

## What It Is

A **queue** works like a line at a shop: new people join at the back, and the person at the front is served next. This rule is called **first in, first out** (FIFO).

```text
dequeue <-  [10] [20] [30] [40]  <- enqueue
            front           back
```

## Operations

| Operation | What It Does | Cost |
| --- | --- | --- |
| enqueue(value) | Adds a value at the back | O(1) |
| dequeue() | Removes and returns the front value | O(1) |
| front() | Reads the front value without removing it | O(1) |
| is_empty() | Says whether the queue has any values | O(1) |

## Ways to Build One

### With a Linked List

Keep pointers to both the head and the tail. Add at the tail, and remove at the head. Both are `O(1)`.

```python
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

class Queue:
    def __init__(self):
        self.head = None
        self.tail = None

    def enqueue(self, value):
        node = Node(value)
        if self.tail:
            self.tail.next = node
        else:
            self.head = node        # the queue was empty
        self.tail = node

    def dequeue(self):
        if self.head is None:
            raise IndexError("queue is empty")
        value = self.head.value
        self.head = self.head.next
        if self.head is None:
            self.tail = None        # the queue is empty again
        return value

queue = Queue()
queue.enqueue(10)
queue.enqueue(20)
print(queue.dequeue())  # 10
queue.enqueue(30)
print(queue.dequeue())  # 20
print(queue.dequeue())  # 30
```

### With an Array

A plain array is a poor fit, because removing from the front shifts everything, which costs `O(n)`. A [[Circular Queue]] solves this by wrapping around instead of shifting.

### With a Library

In Python, use `collections.deque`. Avoid `list.pop(0)`, which shifts the whole list every time.

## Worked Example: Tracing a Queue

| Operation | Queue, Front to Back | Returns |
| --- | --- | --- |
| enqueue 10 | 10 | |
| enqueue 20 | 10, 20 | |
| dequeue | 20 | 10 |
| enqueue 30 | 20, 30 | |
| dequeue | 30 | 20 |

## Worked Example: Hot Potato

People stand in a circle, passing a potato. After every `k` passes, whoever holds it leaves. A queue models this directly: passing the potato means moving the front person to the back.

```python
from collections import deque

def last_standing(names, k):
    queue = deque(names)
    while len(queue) > 1:
        for _ in range(k - 1):
            queue.append(queue.popleft())   # pass it along
        queue.popleft()                     # this person leaves
    return queue[0]

print(last_standing(["A", "B", "C", "D", "E"], 2))  # C
```

## Where It Is Used

- **[[BFS|Breadth-first search]]** visits nodes in the order it discovers them, which is what finds shortest paths in unweighted graphs.
- **Task scheduling.** Print jobs and web requests are handled in order of arrival.
- **Buffers.** A slow reader and a fast writer can work at different speeds, with a queue between them.
- **Message systems,** which pass work between separate programs.

## Queue vs Stack

| | [[Stack]] | Queue |
| --- | --- | --- |
| Rule | Last in, first out | First in, first out |
| Add at | Top | Back |
| Remove from | Top | Front |
| Graph search | [[DFS]] goes deep | [[BFS]] goes wide |
| Everyday image | A pile of plates | A line of people |

Related variations include the [[Deque]], which works at both ends, and the [[Priority Queue]], which serves the smallest value rather than the oldest.

## Common Mistakes

- **Using a list's front removal.** In many languages this is `O(n)`, which turns a linear algorithm into a quadratic one.
- **Forgetting the tail on the last removal.** When the queue becomes empty, the tail must be cleared too, or it keeps pointing at a removed node.
- **Removing from an empty queue.** Always check first, or define what should happen.
