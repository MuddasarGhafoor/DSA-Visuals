> Three ways to choose the next slot after a collision, and the clustering problems each one solves or causes.

## What It Is

In [[Open Addressing]], when a key's slot is taken, you try another slot in the table. The order in which you try slots is called the **probe sequence**. There are three classic ways to choose it, and they differ in one main way: how well they avoid **clusters**, which are long runs of filled slots.

In all three, `i` is the attempt number (0, 1, 2, ...), `h(k)` is the hash of the key, and `m` is the table size.

## Linear Probing

Try the next slot, then the one after that, wrapping at the end.

```text
slot = (h(k) + i) % m
```

### Worked Example

Table of 7 slots, with `h(k) = k % 7`. Insert 10, 17, 3, 24.

| Key | h(k) | Slots Tried | Placed At |
| --- | --- | --- | --- |
| 10 | 3 | 3 | 3 |
| 17 | 3 | 3, 4 | 4 |
| 3 | 3 | 3, 4, 5 | 5 |
| 24 | 3 | 3, 4, 5, 6 | 6 |

### The Problem: Primary Clustering

Filled slots form long runs. Any new key that lands anywhere in a run has to walk to its end, and then it makes the run even longer. So long runs tend to get longer.

Linear probing is still popular, because neighboring slots load quickly in the processor's cache, which often makes it the fastest in practice while the table isn't too full.

## Quadratic Probing

Take bigger and bigger jumps, which breaks up runs.

```text
slot = (h(k) + i²) % m
```

### Worked Example

Same table and keys.

| Key | h(k) | Slots Tried | Placed At |
| --- | --- | --- | --- |
| 10 | 3 | 3 | 3 |
| 17 | 3 | 3, 4 | 4 |
| 3 | 3 | 3, 4, 7 % 7 = 0 | 0 |
| 24 | 3 | 3, 4, 0, 12 % 7 = 5 | 5 |

### The Problem: Secondary Clustering

Keys with the same starting slot still follow the same path. Also, the sequence may not reach every slot. If `m` is prime and the table is at most half full, it is guaranteed to find an empty slot.

## Double Hashing

Use a second hash function to choose the step size. Now two keys with the same starting slot usually take different paths.

```text
slot = (h1(k) + i × h2(k)) % m
```

The second hash must never be 0, or the probe would never move. A common choice is `h2(k) = 1 + (k % (m - 1))`, or `R - (k % R)` for a prime `R` smaller than `m`.

### Worked Example

Same keys, with `h2(k) = 5 - (k % 5)`.

| Key | h1 | h2 | Slots Tried | Placed At |
| --- | --- | --- | --- | --- |
| 10 | 3 | 5 | 3 | 3 |
| 17 | 3 | 3 | 3, 6 | 6 |
| 3 | 3 | 2 | 3, 5 | 5 |
| 24 | 3 | 1 | 3, 4 | 4 |

Each key took a different path, so nobody made a long walk.

## Code

```python
def probe_sequence(key, size, method):
    first = key % size
    if method == "linear":
        return [(first + i) % size for i in range(size)]
    if method == "quadratic":
        return [(first + i * i) % size for i in range(size)]
    step = 5 - (key % 5)
    return [(first + i * step) % size for i in range(size)]

def insert_all(keys, size, method):
    table = [None] * size
    for key in keys:
        for slot in probe_sequence(key, size, method):
            if table[slot] is None:
                table[slot] = key
                break
    return table

keys = [10, 17, 3, 24]
print(insert_all(keys, 7, "linear"))  # [None, None, None, 10, 17, 3, 24]
print(insert_all(keys, 7, "quadratic"))  # [3, None, None, 10, 17, 24, None]
print(insert_all(keys, 7, "double"))  # [None, None, None, 10, 24, 3, 17]
```

## How They Compare

| | Linear | Quadratic | Double Hashing |
| --- | --- | --- | --- |
| Clustering | Primary, the worst | Secondary | Almost none |
| Different probe sequences | m | m | About m² |
| Reaches every slot | Yes | Only if m is prime and half full | Yes, if `h2` and m share no factor |
| Cache speed | Best | Medium | Worst |
| Cost per probe | Lowest | Low | One extra hash |

### Roughly How Many Probes

For a search that fails, at a load factor `α`:

| Load Factor | Linear Probing | Double Hashing |
| --- | --- | --- |
| 50% | 2.5 | 2 |
| 75% | 8.5 | 4 |
| 90% | 50.5 | 10 |

The gap grows quickly as the table fills, which is why linear probing tables are kept fairly empty.

## Common Mistakes

- **A step size of 0 in double hashing.** The probe would stay in one slot forever.
- **A table size that shares a factor with the step.** With `m = 10` and a step of 5, only two slots are ever tried. Use a prime table size.
- **Quadratic probing past half full.** It can loop forever without finding a free slot, even with empty ones remaining.
