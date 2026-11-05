> Arrays that grow by themselves, copying into a larger block when they run out of room.

## What It Is

A plain [[Arrays|array]] has a fixed size. A **dynamic array** gives the same fast access, and it can grow. Python's `list`, C++'s `vector`, Java's `ArrayList`, and JavaScript's arrays all work this way.

It keeps two numbers:

- **Size:** how many values it holds.
- **Capacity:** how many slots are available.

```text
capacity 8, size 5:
+----+----+----+----+----+----+----+----+
| 12 | 45 |  7 | 30 | 18 | __ | __ | __ |
+----+----+----+----+----+----+----+----+
```

## How It Grows

Adding a value when there is room is just one write. When the array is full, it does the following:

1. Allocate a new block, usually **twice** the capacity.
2. Copy every value into it.
3. Free the old block.
4. Add the new value.

That copy is expensive, but it happens rarely, and each one buys a lot of free space.

## Code

```python
class DynamicArray:
    def __init__(self):
        self.capacity = 1
        self.size = 0
        self.items = [None] * self.capacity
        self.copies = 0                  # counts values copied, to show the cost

    def append(self, value):
        if self.size == self.capacity:
            self._resize(self.capacity * 2)
        self.items[self.size] = value
        self.size += 1

    def _resize(self, new_capacity):
        fresh = [None] * new_capacity
        for i in range(self.size):
            fresh[i] = self.items[i]
            self.copies += 1
        self.items = fresh
        self.capacity = new_capacity

    def get(self, index):
        if not 0 <= index < self.size:
            raise IndexError(index)
        return self.items[index]

array = DynamicArray()
for value in range(9):
    array.append(value)
print(array.get(8))  # 8
print(array.capacity)  # 16
print(array.copies)  # 15
```

## Why Appending Is O(1) on Average

One append can cost `O(n)`, because of the copy. But across many appends, the average is constant. This way of counting is called **amortized analysis**.

Look at the cost of filling an array from capacity 1 up to `n`:

| Append Number | Happens When | Values Copied |
| --- | --- | --- |
| 2nd | Capacity 1 is full | 1 |
| 3rd | Capacity 2 is full | 2 |
| 5th | Capacity 4 is full | 4 |
| 9th | Capacity 8 is full | 8 |

The total copied is `1 + 2 + 4 + ... + n`, which is less than `2n`. Adding the `n` writes gives fewer than `3n` steps for `n` appends. That is about 3 steps per append, which is `O(1)` amortized.

### Why Doubling and Not Adding a Fixed Amount

Suppose the array grew by a fixed 10 slots each time. It would copy 10, 20, 30, ... values, which adds up to about `n² / 20` for `n` appends. Each append then costs `O(n)` on average. **Growing by a factor** is what keeps it constant.

Doubling isn't the only choice. Python grows by about 1.125, and some libraries use 1.5. Smaller factors waste less memory and copy more often.

## Complexity

| Operation | Cost |
| --- | --- |
| Read or write by index | O(1) |
| Append | O(1) amortized, O(n) in the worst case |
| Remove from the end | O(1) amortized |
| Insert or remove elsewhere | O(n) |
| Space | O(n), with up to double in spare slots |

## Shrinking

Some implementations shrink as values are removed, but not as soon as the array is half empty. If one extra append or remove could trigger a resize each time, the same few operations could repeat the expensive copy. The usual rule is to halve the capacity when the array is only **one quarter** full.

## Common Mistakes

- **Keeping a pointer into the array.** In languages like C++, a resize moves the data, so an old pointer or iterator now points at freed memory.
- **Inserting at the front in a loop.** Each insert is `O(n)`, so `n` of them are `O(n²)`. Append, then reverse once at the end.
- **Not reserving space when you know the size.** If you know you'll need a million items, allocate them up front to avoid every copy.
