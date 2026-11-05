> Handling collisions in a hash table by trying other slots until a free one is found.

## What It Is

In a [[Hash Tables|hash table]], two keys can land on the same slot. **Open addressing** handles this with no extra lists: every entry lives in the table itself. If a key's slot is taken, you try another slot, and keep going until you find a free one.

The series of slots you try is called the **probe sequence**. The ways of choosing it are covered in [[Linear/Quadratic Probing and Double Hashing]].

## How It Works

### Insert

Follow the probe sequence until you find an empty slot, and put the key there.

### Search

Follow the same sequence. There are three possible outcomes:

- You find the key, so you are done.
- You find an **empty** slot, so the key isn't in the table. If it were, insert would have stopped here.
- You have tried every slot, so the key isn't in the table.

### Delete: The Tricky Part

You can't just empty the slot, because that would break the search for other keys. Here's why, with linear probing:

```text
A, B, and C all hash to slot 2:

slot:    2    3    4
        [A]  [B]  [C]

Delete B by emptying its slot:

slot:    2    3    4
        [A]  [ ]  [C]

Search for C: check slot 2 (A), then slot 3 (empty), so stop.
The search says C isn't here, but it is!
```

The fix is a **tombstone**: a marker that says "something used to be here, so keep looking". Searches pass over tombstones, and inserts can reuse them.

## Code

This version uses linear probing.

```python
EMPTY = object()
TOMBSTONE = object()

class OpenTable:
    def __init__(self, size=8):
        self.slots = [EMPTY] * size

    def _probe(self, key):
        start = hash(key) % len(self.slots)
        for i in range(len(self.slots)):
            yield (start + i) % len(self.slots)

    def put(self, key, value):
        free = None
        for i in self._probe(key):
            slot = self.slots[i]
            if slot is EMPTY:
                self.slots[free if free is not None else i] = (key, value)
                return
            if slot is TOMBSTONE:
                if free is None:
                    free = i              # reuse it, once we know the key is new
            elif slot[0] == key:
                self.slots[i] = (key, value)
                return
        if free is None:
            raise OverflowError("table is full")
        self.slots[free] = (key, value)

    def get(self, key):
        for i in self._probe(key):
            slot = self.slots[i]
            if slot is EMPTY:
                return None
            if slot is not TOMBSTONE and slot[0] == key:
                return slot[1]
        return None

    def remove(self, key):
        for i in self._probe(key):
            slot = self.slots[i]
            if slot is EMPTY:
                return False
            if slot is not TOMBSTONE and slot[0] == key:
                self.slots[i] = TOMBSTONE
                return True
        return False

table = OpenTable(8)
# In Python, hash(n) is n for small integers, so these three all start at slot 2.
table.put(2, "A")
table.put(10, "B")
table.put(18, "C")
print(table.remove(10))  # True
print(table.get(18))  # C
```

## Load Factor Matters More Here

The **load factor** `α` is the fraction of slots in use. Because all entries live in the table, it can't go above 1, and performance drops sharply as it gets close.

On average, with a good probe sequence, an unsuccessful search takes about `1 / (1 - α)` probes.

| Load Factor | Average Probes |
| --- | --- |
| 50% | 2 |
| 75% | 4 |
| 90% | 10 |
| 99% | 100 |

So these tables are usually kept below about 70% full, with [[Rehashing]] when they pass that.

## Compared to Chaining

| | Open Addressing | [[Chaining]] |
| --- | --- | --- |
| Memory | One array, no links | Extra links for lists |
| Cache speed | Very good | Weaker, nodes are scattered |
| Fill level | Must stay below 1 | Can go above 1 |
| Delete | Needs tombstones | Simple |
| Near full | Slows down sharply | Slows down gently |
| Used in | Python `dict` | Java `HashMap` |

## Common Mistakes

- **Emptying a slot on delete.** This silently breaks later searches. Use a tombstone.
- **Stopping a search at a tombstone.** Only a truly empty slot ends a search.
- **Never cleaning up tombstones.** They slow searches down just like real entries. A resize removes them, since only live entries are copied.
- **Letting the table fill up.** At 100% full, searching for a missing key checks every slot.
