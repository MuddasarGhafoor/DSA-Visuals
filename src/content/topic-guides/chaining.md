> Handling collisions in a hash table by keeping a small list of entries at each slot.

## What It Is

In a [[Hash Tables|hash table]], two keys can land on the same slot. This is called a **collision**. **Chaining** handles it in the simplest way: every slot holds a small list, and all the keys that land there go into that list.

```text
slot
 0  -> [ apple ]
 1  -> ( empty )
 2  -> [ cat ] -> [ dog ] -> [ fig ]     three keys landed here
 3  -> [ egg ]
 4  -> ( empty )
```

## How It Works

Every operation starts the same way: hash the key to find the slot, and then work on the list in that slot.

| Operation | Steps |
| --- | --- |
| Insert | Hash the key. If it is already in the list, update its value. If not, add it to the list. |
| Search | Hash the key. Walk the list, comparing keys. |
| Delete | Hash the key. Find it in the list and remove it. |

## Code

```python
class ChainedHashTable:
    def __init__(self, slots=8):
        self.buckets = [[] for _ in range(slots)]
        self.count = 0

    def _bucket(self, key):
        return self.buckets[hash(key) % len(self.buckets)]

    def put(self, key, value):
        bucket = self._bucket(key)
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value         # the key exists: update it
                return
        bucket.append([key, value])
        self.count += 1

    def get(self, key):
        for stored, value in self._bucket(key):
            if stored == key:
                return value
        return None

    def remove(self, key):
        bucket = self._bucket(key)
        for i, pair in enumerate(bucket):
            if pair[0] == key:
                bucket.pop(i)
                self.count -= 1
                return True
        return False

table = ChainedHashTable()
table.put("cat", 1)
table.put("dog", 2)
table.put("cat", 3)
print(table.get("cat"))  # 3
print(table.count)  # 2
print(table.remove("dog"))  # True
print(table.get("dog"))  # None
```

## Worked Example

Take 5 slots, and use `key % 5` as the hash. Insert 12, 7, 22, and 5.

| Key | key % 5 | Slot After Insert |
| --- | --- | --- |
| 12 | 2 | slot 2: 12 |
| 7 | 2 | slot 2: 12, 7 |
| 22 | 2 | slot 2: 12, 7, 22 |
| 5 | 0 | slot 0: 5 |

Searching for 22 hashes to slot 2, then compares with 12, then 7, then 22, which is 3 comparisons. Searching for 5 needs only 1.

## How Fast It Is

It depends on the **load factor**, written `α` (alpha), which is the average number of entries per slot:

```text
α = number of entries / number of slots
```

With a good [[Hash Functions|hash function]], every list has about `α` entries.

| Operation | Average | Worst Case |
| --- | --- | --- |
| Search | O(1 + α) | O(n) |
| Insert | O(1 + α) | O(n) |
| Delete | O(1 + α) | O(n) |

The worst case happens if every key lands in one slot, which turns the table into a single long list.

### Keeping It Fast

If the slots grow along with the entries, `α` stays below a fixed limit and every operation stays `O(1)` on average. This growing step is called [[Rehashing]]. Java's `HashMap` resizes when `α` passes 0.75.

## Chaining vs Open Addressing

| | Chaining | [[Open Addressing]] |
| --- | --- | --- |
| Where collisions go | A list at the slot | Another slot in the table |
| Load factor | Can go above 1 | Must stay below 1 |
| Deleting | Simple | Needs care |
| Extra memory | One link per entry | None per entry |
| Cache speed | Slower, nodes are scattered | Faster, slots are side by side |

Chaining is simple and forgiving. Performance fades slowly as the table fills, so it is a safe default.

## Common Mistakes

- **Adding without checking for the key.** That stores the same key twice, and later searches may return the old value.
- **Never resizing.** With a fixed number of slots, the lists keep growing, and `O(1)` slowly becomes `O(n)`.
- **Using a poor hash function.** If many keys land in the same slot, chaining can't help. For example, `key % 10` on multiples of 10 puts everything in slot 0.
