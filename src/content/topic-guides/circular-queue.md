> A queue in a fixed array, whose front and back wrap around to reuse free space.

## What It Is

A [[Queue]] built on a plain array has a problem. As values leave from the front, empty slots pile up there, and the back eventually hits the end of the array even though there is free space.

```text
Plain array queue after some removals:
[ __ | __ | __ | 40 | 50 ]
                  ^front   ^back has nowhere to go
```

Shifting everything left would fix it, but that costs `O(n)` every time. A **circular queue** fixes it for free by treating the array as if its end were joined to its start. When an index runs off the end, it wraps around to 0.

## How It Works

The trick is the remainder operator. Moving forward one slot becomes:

```text
next = (index + 1) % capacity
```

With a capacity of 5, moving forward from index 4 gives `(4 + 1) % 5 = 0`, which is back at the start.

The queue keeps three things: the array, the index of the **front**, and the **count** of values stored. The back position is calculated when needed: `(front + count) % capacity`.

## Worked Example

Capacity 4, starting empty.

| Operation | Array | Front | Count |
| --- | --- | --- | --- |
| enqueue 10 | `10 __ __ __` | 0 | 1 |
| enqueue 20 | `10 20 __ __` | 0 | 2 |
| enqueue 30 | `10 20 30 __` | 0 | 3 |
| dequeue, gives 10 | `__ 20 30 __` | 1 | 2 |
| enqueue 40 | `__ 20 30 40` | 1 | 3 |
| enqueue 50, wraps | `50 20 30 40` | 1 | 4 |
| dequeue, gives 20 | `50 __ 30 40` | 2 | 3 |

The value 50 went into slot 0, reusing the space that 10 left behind. Nothing ever shifted.

## Code

```python
class CircularQueue:
    def __init__(self, capacity):
        self.items = [None] * capacity
        self.capacity = capacity
        self.front = 0
        self.count = 0

    def enqueue(self, value):
        if self.count == self.capacity:
            raise OverflowError("queue is full")
        back = (self.front + self.count) % self.capacity
        self.items[back] = value
        self.count += 1

    def dequeue(self):
        if self.count == 0:
            raise IndexError("queue is empty")
        value = self.items[self.front]
        self.items[self.front] = None
        self.front = (self.front + 1) % self.capacity
        self.count -= 1
        return value

queue = CircularQueue(4)
for value in [10, 20, 30]:
    queue.enqueue(value)
print(queue.dequeue())  # 10
queue.enqueue(40)
queue.enqueue(50)
print(queue.items)  # [50, 20, 30, 40]
print(queue.dequeue())  # 20
```

## Telling Full From Empty

If you keep only a `front` and a `back` index, then `front == back` could mean either empty or full. There are three common ways to tell them apart:

| Approach | How It Works | Cost |
| --- | --- | --- |
| Keep a count | The code above: full when count equals capacity | One extra variable |
| Leave one slot empty | Full when `(back + 1) % capacity == front` | One wasted slot |
| Keep a flag | Record whether the last operation added or removed | One extra variable |

## Complexity

| Operation | Time | Space |
| --- | --- | --- |
| enqueue | O(1) | No extra |
| dequeue | O(1) | No extra |
| Whole queue | | O(capacity), fixed up front |

Every operation is `O(1)` in the worst case, with no growing and no shifting. That predictability is why it is popular.

## Where It Is Used

- **Keyboard and network buffers,** where one part of a system writes while another reads.
- **Streaming audio and video,** which keep a fixed window of recent data.
- **Embedded systems,** where memory is fixed and allocating more isn't an option.
- **Keeping the last n items,** such as recent log lines, by overwriting the oldest.

## Common Mistakes

- **Forgetting to wrap.** Every index update needs `% capacity`, including the calculation of the back.
- **Confusing full and empty.** Test both with the same input, then choose one approach from the table above.
- **Calculating the back with `front + count - 1` to insert.** That is the *last used* slot. The next free slot is `front + count`.
