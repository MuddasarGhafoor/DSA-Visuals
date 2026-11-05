> The longest sequence of characters that appears in the same order in two strings, not necessarily side by side.

## What It Is

A **subsequence** keeps some characters of a string, in their original order, and may skip others. From `ABCDE`, you can get `ACE`, but not `AEC`, since that would change the order.

The **longest common subsequence** (LCS) of two strings is the longest subsequence that appears in both.

For `ABCBDAB` and `BDCABA`, one LCS is `BCBA`, with a length of 4.

```text
A B C B D A B
  ^ ^ ^   ^

B D C A B A
^   ^   ^ ^
```

This is how tools compare files. `git diff` is based on this idea: the lines in the LCS stayed the same, and everything else was added or removed.

## The Key Idea

Compare the last characters of the two strings.

**If they match,** that character is part of the LCS. Remove it from both, and solve the rest.

```text
lcs[i][j] = 1 + lcs[i-1][j-1]
```

**If they differ,** at least one of them isn't in the LCS. Try dropping each one, and keep the better result.

```text
lcs[i][j] = max( lcs[i-1][j],  lcs[i][j-1] )
```

Here, `lcs[i][j]` means the LCS length for the first `i` characters of `a` and the first `j` characters of `b`. With an empty string, the answer is 0.

## Worked Example

Find the LCS of `ABCB` and `BDCB`.

|   | "" | B | D | C | B |
| --- | --- | --- | --- | --- | --- |
| "" | 0 | 0 | 0 | 0 | 0 |
| A | 0 | 0 | 0 | 0 | 0 |
| B | 0 | 1 | 1 | 1 | 1 |
| C | 0 | 1 | 1 | 2 | 2 |
| B | 0 | 1 | 1 | 2 | 3 |

The length is **3**. The bottom-right cell has matching characters (B and B), so it adds 1 to the diagonal value of 2.

### Rebuilding the Answer

Start at the bottom-right cell, and walk back:

- If the characters match, keep that character, and move diagonally.
- Otherwise, move to the larger neighbor, up or left.

Reading the kept characters in reverse gives `BCB`.

## Code

```python
def lcs(a, b):
    table = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                table[i][j] = 1 + table[i - 1][j - 1]
            else:
                table[i][j] = max(table[i - 1][j], table[i][j - 1])

    i, j = len(a), len(b)
    kept = []
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            kept.append(a[i - 1])
            i -= 1
            j -= 1
        elif table[i - 1][j] >= table[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return "".join(reversed(kept))

print(lcs("ABCB", "BDCB"))  # BCB
print(len(lcs("ABCBDAB", "BDCABA")))  # 4
print(lcs("abc", "xyz"))  # 
```

There can be several different LCSs of the same length. This code returns one of them.

## Saving Memory

To get only the length, each row needs just the row above.

```python
def lcs_length(a, b):
    previous = [0] * (len(b) + 1)
    for char_a in a:
        current = [0]
        for j, char_b in enumerate(b, 1):
            if char_a == char_b:
                current.append(previous[j - 1] + 1)
            else:
                current.append(max(previous[j], current[j - 1]))
        previous = current
    return previous[-1]

print(lcs_length("ABCBDAB", "BDCABA"))  # 4
```

## Complexity

| Version | Time | Space |
| --- | --- | --- |
| Full table | O(n × m) | O(n × m) |
| Two rows, length only | O(n × m) | O(min(n, m)) |
| Trying all subsequences | O(2ⁿ × m) | |

## Subsequence vs Substring

These are easy to mix up.

| | Subsequence | [[Longest Common Substring\|Substring]] |
| --- | --- | --- |
| Characters must be adjacent | No | Yes |
| On a mismatch | Takes the better neighbor | Resets to 0 |
| `ABCD` and `ACBD` | `ABD`, length 3 | `A`, length 1 |

## Problems That Build on It

| Problem | How LCS Helps |
| --- | --- |
| [[Longest Palindromic Subsequence]] | The LCS of a string and its reverse |
| [[Shortest Common Supersequence]] | Its length is `n + m - LCS` |
| [[Edit Distance]] with only inserts and deletes | The distance is `n + m - 2 × LCS` |
| Comparing files | Lines not in the LCS changed |

## Common Mistakes

- **Requiring the characters to be side by side.** That is the substring problem.
- **Adding 1 on a mismatch.** Only a match adds to the length.
- **Using `i` and `j` directly on the strings.** The table is one larger than the strings, so use `i - 1` and `j - 1`.
- **Expecting a unique answer.** There may be several correct LCSs.
