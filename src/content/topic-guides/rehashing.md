> Growing a hash table when it gets too full, by moving every entry into a larger table.

## What It Is

A [[Hash Tables|hash table]] is fast only while it has enough free slots. As it fills up, collisions become common and lookups slow down. **Rehashing** fixes this: when the table gets too full, build a bigger table and move everything into it.

It is the same idea as a [[Dynamic Arrays|dynamic array]] growing, with one important difference.

## Why You Must Rehash, Not Just Copy

A key's slot depends on the table size: `slot = hash(key) % size`. When the size changes, the correct slot changes too. Copying entries to the same positions would leave them where searches can't find them.

So every entry has to be hashed again, which is where the name comes from.

| Key | Hash | Slot in Size 4 | Slot in Size 8 |
| --- | --- | --- | --- |
| A | 13 | 1 | 5 |
| B | 22 | 2 | 6 |
| C | 9 | 1 | 1 |
| D | 16 | 0 | 0 |

Notice that A and C shared a slot before, and they don't after. Growing the table also breaks up collisions.

## When to Do It

Watch the **load factor**, the ratio of entries to slots:

```text
α = entries / slots
```

When it passes a threshold, resize.

| Table Type | Typical Threshold | Example |
| --- | --- | --- |
| [[Chaining]] | 0.75 to 1.0 | Java `HashMap` uses 0.75 |
| [[Open Addressing]] | 0.5 to 0.7 | Python `dict` uses about 0.66 |

## Code

```python
class GrowingTable:
    def __init__(self):
        self.buckets = [[] for _ in range(4)]
        self.count = 0
        self.rehashes = 0

    def put(self, key, value):
        bucket = self.buckets[hash(key) % len(self.buckets)]
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value
                return
        bucket.append([key, value])
        self.count += 1
        if self.count / len(self.buckets) > 0.75:
            self._rehash()

    def _rehash(self):
        old = self.buckets
        self.buckets = [[] for _ in range(len(old) * 2)]
        for bucket in old:
            for key, value in bucket:
                # The slot is worked out again from the new size.
                self.buckets[hash(key) % len(self.buckets)].append([key, value])
        self.rehashes += 1

    def get(self, key):
        for stored, value in self.buckets[hash(key) % len(self.buckets)]:
            if stored == key:
                return value
        return None

table = GrowingTable()
for i in range(100):
    table.put(i, i * i)
print(table.get(50))  # 2500
print(len(table.buckets))  # 256
print(table.rehashes)  # 6
```

## Worked Example

Start with 4 slots and a threshold of 0.75, and keep inserting.

| Entries | Slots | Load Factor | What Happens |
| --- | --- | --- | --- |
| 3 | 4 | 0.75 | Not above the threshold |
| 4 | 4 | 1.00 | Rehash to 8 slots |
| 6 | 8 | 0.75 | Not above the threshold |
| 7 | 8 | 0.875 | Rehash to 16 slots |
| 13 | 16 | 0.81 | Rehash to 32 slots |

## The Cost

One rehash is expensive: it touches every entry, so it costs `O(n)`. But because the table doubles, this happens rarely.

Across `n` inserts, the rehashes move `1 + 2 + 4 + ... + n` entries, which adds up to less than `2n`. So inserting is still `O(1)` **amortized**, which is the same result as for [[Dynamic Arrays]].

## Other Details

### Choosing the New Size

- **Doubling** is simple. If the size is a power of 2, the remainder becomes a fast bit mask.
- **The next prime after doubling** spreads keys better when using the plain `key % size`.

### Tombstones

In [[Open Addressing]], deleted entries leave markers behind. Rehashing copies only the live entries, so it clears them all. Some tables rehash at the same size for this reason alone.

### Avoiding the Pause

Moving everything at once causes one slow insert, which matters in real-time systems. **Incremental rehashing** keeps both tables for a while, and moves a few entries with each operation. Redis does this.

## Common Mistakes

- **Copying entries by position.** Each key must go to its new slot, or it can't be found again.
- **Growing by a fixed amount.** Adding 10 slots each time makes inserting `O(n)` on average. Grow by a multiple.
- **Modifying a table while looping over it.** Inserting into a table during a loop can trigger a rehash, which invalidates the loop.
