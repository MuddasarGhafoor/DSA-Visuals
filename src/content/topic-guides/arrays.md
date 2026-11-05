> Values stored side by side in memory, and what reading, inserting, and removing each cost.

## What It Is

An **array** stores values in one continuous block of memory, side by side. Every slot is the same size, and each has a number called its **index**. Most languages count from 0.

```text
index:     0    1    2    3    4
         +----+----+----+----+----+
values:  | 12 | 45 |  7 | 30 | 18 |
         +----+----+----+----+----+
```

## Why Reading Is Instant

The computer doesn't search for a slot. It calculates the address:

```text
address of index i = start address + i × size of one slot
```

If the array starts at address 1000 and each value takes 4 bytes, then index 3 is at `1000 + 3 × 4 = 1012`. That is one calculation, however long the array is. This is called **random access**, and it is what makes arrays special.

## What Each Operation Costs

| Operation | Cost | Why |
| --- | --- | --- |
| Read or write by index | O(1) | The address is calculated directly |
| Search, unsorted | O(n) | Must check each value |
| Search, sorted | O(log n) | Can use [[Binary Search]] |
| Insert or remove at the end | O(1) | Nothing else moves |
| Insert or remove at the start | O(n) | Every value must shift |
| Insert or remove in the middle | O(n) | Half the values shift, on average |

## Worked Example: Inserting in the Middle

To insert 99 at index 1, every value from index 1 onward must first move one slot to the right. Go from the end, so nothing gets overwritten.

```text
Start:    12  45   7  30  __
Shift:    12  45   7  __  30
Shift:    12  45  __   7  30
Shift:    12  __  45   7  30
Place:    12  99  45   7  30
```

```python
def insert_at(values, count, index, new_value):
    # values has room for one more. count is how many slots are in use.
    for i in range(count, index, -1):
        values[i] = values[i - 1]       # shift right
    values[index] = new_value

def remove_at(values, count, index):
    for i in range(index, count - 1):
        values[i] = values[i + 1]       # shift left

slots = [12, 45, 7, 30, None]
insert_at(slots, 4, 1, 99)
print(slots)  # [12, 99, 45, 7, 30]
remove_at(slots, 5, 0)
print(slots[:4])  # [99, 45, 7, 30]
```

## Two-Dimensional Arrays

A grid is stored as one long block, usually one row after another. This is called **row-major order**.

```text
Grid:         In memory:
1 2 3         1 2 3 4 5 6
4 5 6
```

For a grid with `C` columns, the value at row `r` and column `c` is at position `r × C + c`. So reading it is still `O(1)`.

## Strengths and Weaknesses

### Strengths

- **Fast reads** by index.
- **Little extra memory,** because only the values are stored.
- **Fast in practice.** Neighboring values sit together in memory, so the processor's cache can load them in advance.

### Weaknesses

- **Fixed size.** A plain array can't grow. [[Dynamic Arrays]] solve this.
- **Slow inserts and removals** anywhere except the end. [[Linked Lists]] solve this, at the cost of slow reads.

## Common Mistakes

- **Off-by-one errors.** An array of length `n` has indexes 0 to `n - 1`. Index `n` is outside it.
- **Overwriting while shifting.** When shifting right, go from the end. When shifting left, go from the start.
- **Removing while looping forward.** Removing an item shifts the rest left, so the next one gets skipped.
- **Forgetting that a slice can copy.** In Python, `values[1:]` makes a new list and costs `O(n)`.
