> Storing key-value pairs so that a value can be found by its key, usually in constant time.

## What It Is

A **hash table** stores key-value pairs, and finds any value by its key in about one step, no matter how many pairs it holds.

An [[Arrays|array]] gives instant access if you know the index. A hash table extends that idea to any kind of key: a [[Hash Functions|hash function]] turns the key into an index.

```text
key "cat" -> hash -> index 2

index:  0        1        2          3        4
       [ __ ]  [ __ ]  [cat: 7]   [ __ ]  [dog: 3]
```

It is like a library that works out exactly which shelf a book belongs on from its title, so nobody ever has to search the whole building.

## How It Works

### The Three Steps

1. **Hash** the key to a large integer.
2. **Compress** that integer to a valid index, usually with `hash % number_of_slots`.
3. **Handle collisions** if another key is already there.

### Collisions

Two different keys can land on the same index. There are two main ways to handle that:

| Strategy | The Idea |
| --- | --- |
| [[Chaining]] | Each slot holds a small list of entries |
| [[Open Addressing]] | Try other slots in the table until one is free |

## Code

This table uses chaining, and grows when it gets too full.

```python
class HashTable:
    def __init__(self):
        self.buckets = [[] for _ in range(8)]
        self.count = 0

    def _index(self, key):
        return hash(key) % len(self.buckets)

    def put(self, key, value):
        bucket = self.buckets[self._index(key)]
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value
                return
        bucket.append([key, value])
        self.count += 1
        if self.count / len(self.buckets) > 0.75:
            self._grow()

    def get(self, key, default=None):
        for stored, value in self.buckets[self._index(key)]:
            if stored == key:
                return value
        return default

    def _grow(self):
        pairs = [pair for bucket in self.buckets for pair in bucket]
        self.buckets = [[] for _ in range(len(self.buckets) * 2)]
        for key, value in pairs:
            self.buckets[self._index(key)].append([key, value])

ages = HashTable()
ages.put("ali", 21)
ages.put("sara", 22)
ages.put("ali", 23)
print(ages.get("ali"))  # 23
print(ages.get("omar", "unknown"))  # unknown
for i in range(20):
    ages.put(i, i)
print(ages.get(13))  # 13
print(len(ages.buckets))  # 32
```

## Complexity

| Operation | Average | Worst Case |
| --- | --- | --- |
| Insert | O(1) | O(n) |
| Search | O(1) | O(n) |
| Delete | O(1) | O(n) |
| Space | O(n) | O(n) |

The worst case happens if many keys collide. It is rare with a good hash function, and when the table keeps its **load factor**, the ratio of entries to slots, under control with [[Rehashing]].

## Worked Example: Counting Words

Hash tables make counting easy. Without one, you would search a list for every word, which is `O(n²)`.

```python
def count_words(words):
    counts = {}
    for word in words:
        counts[word] = counts.get(word, 0) + 1
    return counts

print(count_words(["a", "b", "a", "c", "a"]))  # {'a': 3, 'b': 1, 'c': 1}
```

## Worked Example: Two Sum

Given a list, find two values that add up to a target. Checking all pairs takes `O(n²)`. A hash table remembers what you have seen, which brings it down to `O(n)`.

```python
def two_sum(values, target):
    seen = {}
    for i, value in enumerate(values):
        needed = target - value
        if needed in seen:
            return seen[needed], i
        seen[value] = i
    return None

print(two_sum([2, 7, 11, 15], 9))  # (0, 1)
```

## Compared to Other Structures

| Need | Hash Table | Sorted Array | [[Binary Search Tree\|Balanced Tree]] |
| --- | --- | --- | --- |
| Find by key | O(1) | O(log n) | O(log n) |
| Insert | O(1) | O(n) | O(log n) |
| Smallest or largest | O(n) | O(1) | O(log n) |
| All keys in order | O(n log n) | O(n) | O(n) |
| Range of keys | O(n) | O(log n + k) | O(log n + k) |

Choose a hash table when you only need to look things up by an exact key. Choose a tree when order matters.

## Common Mistakes

- **Expecting any order.** Hash tables don't keep keys sorted. Python's `dict` keeps insertion order, but that is a language feature and not a property of hashing.
- **Using a changeable key.** If a key changes after being stored, its hash changes, and the entry is lost. That is why Python doesn't allow a list as a key.
- **Treating O(1) as a guarantee.** It is an average. A bad hash function, or an attacker who chooses the keys, can force the worst case.
