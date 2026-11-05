> A set answers "is this present?" and a map answers "what value goes with this key?".

## What It Is

These are two of the most used [[Abstract Data Types|abstract data types]] in programming.

- A **set** is a collection of unique values. Its main question is "is this value in here?"
- A **map** stores key-value pairs, with unique keys. Its main question is "what value goes with this key?" It is also called a dictionary or an associative array.

```text
Set:  { "ali", "sara", "omar" }

Map:  { "ali": 21, "sara": 22, "omar": 20 }
```

A set is really a map with no values, and many libraries build it that way.

## Operations

| Set | Map | What It Does |
| --- | --- | --- |
| add(x) | put(k, v) | Adds it, or updates the value if the key exists |
| remove(x) | remove(k) | Takes it out |
| contains(x) | get(k) | Looks it up |
| size() | size() | Counts the items |

Sets also support the usual operations from math.

| Operation | Meaning | Python |
| --- | --- | --- |
| Union | In either set | `a \| b` |
| Intersection | In both sets | `a & b` |
| Difference | In `a` but not `b` | `a - b` |

## Two Ways to Build Them

### Hash-Based

A [[Hash Tables|hash table]] gives `O(1)` on average, and keeps no useful order.

### Tree-Based

A balanced [[Binary Search Tree|binary search tree]], such as an [[AVL Tree]], gives `O(log n)` and keeps keys in sorted order.

| | Hash Set or Map | Tree Set or Map |
| --- | --- | --- |
| Add, remove, look up | O(1) average | O(log n) |
| Worst case | O(n) | O(log n) |
| Keys in sorted order | No | Yes |
| Smallest or largest key | O(n) | O(log n) |
| Keys in a range | O(n) | O(log n + k) |
| Key needs | A hash function | A way to compare |
| Python | `set`, `dict` | Not built in |
| Java | `HashSet`, `HashMap` | `TreeSet`, `TreeMap` |
| C++ | `unordered_set`, `unordered_map` | `set`, `map` |

Pick hash-based by default. Pick tree-based when you need sorted output, ranges, or a guaranteed worst case.

## Worked Examples

### Removing Duplicates

A set keeps only unique values. To keep the original order too, check before adding.

```python
def unique_in_order(values):
    seen = set()
    result = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result

print(unique_in_order([3, 1, 3, 2, 1]))  # [3, 1, 2]
```

Doing this with a list would be `O(n²)`, because `in` on a list checks every item. With a set, it is `O(n)`.

### Grouping

A map from a key to a list is a very common pattern. Here, words are grouped by their sorted letters, which puts anagrams together.

```python
def group_anagrams(words):
    groups = {}
    for word in words:
        key = "".join(sorted(word))
        groups.setdefault(key, []).append(word)
    return list(groups.values())

print(group_anagrams(["eat", "tea", "tan", "ate", "nat"]))  # [['eat', 'tea', 'ate'], ['tan', 'nat']]
```

### Comparing Two Lists

Set operations answer these questions in one line.

```python
enrolled = {"ali", "sara", "omar"}
present = {"sara", "omar", "zain"}
print(sorted(enrolled & present))  # ['omar', 'sara']
print(sorted(enrolled - present))  # ['ali']
print(sorted(present - enrolled))  # ['zain']
```

## When to Use Which

| You Need To | Use |
| --- | --- |
| Check whether something has been seen | Set |
| Remove duplicates | Set |
| Count how often each value appears | Map |
| Look up details by an ID | Map |
| Keep items in sorted order, with fast inserts | Tree-based set or map |
| Keep a list with a fixed order and repeats | Not a set: use a list |

## Common Mistakes

- **Searching a list when a set would do.** `x in my_list` inside a loop is a very common cause of slow code.
- **Relying on order.** Hash sets have no reliable order. Sort the output when order matters.
- **Using a changeable value as a key.** Python doesn't allow a list as a dictionary key, because changing it would change its hash.
- **Assuming `get` means present.** A missing key and a key with the value `None` can both return `None`. Use `in` to tell them apart.
