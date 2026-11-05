> The fewest inserts, deletes, and replacements needed to turn one string into another.

## What It Is

The **edit distance** between two strings, also called the **Levenshtein distance**, is the smallest number of single-character changes that turn one into the other. Three changes are allowed:

| Operation | Example |
| --- | --- |
| Insert a character | `cat` → `cart` |
| Delete a character | `cart` → `cat` |
| Replace a character | `cat` → `cut` |

Turning `kitten` into `sitting` takes 3 changes:

```text
kitten -> sitten     replace k with s
sitten -> sittin     replace e with i
sittin -> sitting    insert g
```

Spell checkers use this to suggest the closest word, and it also helps to compare DNA sequences.

## The Key Idea

Compare the strings from the end. Let `dist[i][j]` be the edit distance between the first `i` characters of `a` and the first `j` characters of `b`.

**If the last characters match,** nothing needs doing to them:

```text
dist[i][j] = dist[i-1][j-1]
```

**If they differ,** try each of the three changes, and take the cheapest:

```text
dist[i][j] = 1 + min( dist[i-1][j-1],     replace a's last with b's last
                      dist[i-1][j],       delete a's last
                      dist[i][j-1] )      insert b's last at the end of a
```

### The Base Cases

Turning a string into an empty one takes one delete per character, so `dist[i][0] = i`. Building a string from nothing takes one insert per character, so `dist[0][j] = j`.

## Worked Example

Turn `horse` into `ros`.

|   | "" | r | o | s |
| --- | --- | --- | --- | --- |
| "" | 0 | 1 | 2 | 3 |
| h | 1 | 1 | 2 | 3 |
| o | 2 | 2 | 1 | 2 |
| r | 3 | 2 | 2 | 2 |
| s | 4 | 3 | 3 | 2 |
| e | 5 | 4 | 4 | 3 |

The answer is the bottom-right cell, **3**.

To see one cell worked out: the row `o` and the column `o` match, so that cell copies the diagonal, which is 1.

The three changes are:

```text
horse -> rorse     replace h with r
rorse -> rose      delete r
rose  -> ros       delete e
```

## Code

```python
def edit_distance(a, b):
    rows, cols = len(a) + 1, len(b) + 1
    dist = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        dist[i][0] = i
    for j in range(cols):
        dist[0][j] = j
    for i in range(1, rows):
        for j in range(1, cols):
            if a[i - 1] == b[j - 1]:
                dist[i][j] = dist[i - 1][j - 1]
            else:
                dist[i][j] = 1 + min(dist[i - 1][j - 1], dist[i - 1][j], dist[i][j - 1])
    return dist[-1][-1]

print(edit_distance("kitten", "sitting"))  # 3
print(edit_distance("horse", "ros"))  # 3
print(edit_distance("", "abc"))  # 3
print(edit_distance("same", "same"))  # 0
```

## Saving Memory

Each row only uses the row above, so you need only two rows.

```python
def edit_distance_small(a, b):
    previous = list(range(len(b) + 1))
    for i, char_a in enumerate(a, 1):
        current = [i]
        for j, char_b in enumerate(b, 1):
            if char_a == char_b:
                current.append(previous[j - 1])
            else:
                current.append(1 + min(previous[j - 1], previous[j], current[j - 1]))
        previous = current
    return previous[-1]

print(edit_distance_small("kitten", "sitting"))  # 3
```

If you need the actual list of changes, keep the full table, and walk back from the end.

## Complexity

| Version | Time | Space |
| --- | --- | --- |
| Full table | O(n × m) | O(n × m) |
| Two rows | O(n × m) | O(min(n, m)) |

## Where It Is Used

- **Spell checking:** suggest the dictionary words with the smallest distance.
- **DNA and protein analysis:** measure how similar two sequences are.
- **File comparison:** see what changed between two versions.
- **Fuzzy search:** find close matches when the query has a typo.

## Related Problems

| Problem | Allowed Changes | Link |
| --- | --- | --- |
| Edit distance | Insert, delete, replace | |
| [[Longest Common Subsequence]] | Insert, delete only | `n + m - 2 × LCS` gives that distance |
| [[Shortest Common Supersequence]] | Insert only | `n + m - LCS` gives its length |
| Hamming distance | Replace only | Strings must have equal length |

## Common Mistakes

- **Forgetting the base cases.** The first row and column must count up. They aren't all 0.
- **Adding 1 when characters match.** A match costs nothing, so copy the diagonal directly.
- **Mixing up which change goes where.** `dist[i-1][j]` is a delete from `a`, and `dist[i][j-1]` is an insert. Getting this wrong matters only when rebuilding the steps.
- **Indexing the strings by `i` and `j`.** The table is one larger than the strings, so the characters are at `i - 1` and `j - 1`.
