> The shortest string that contains both of two strings as subsequences.

## What It Is

A string `s` is a **supersequence** of another string if you can get the other string by deleting characters from `s`. The **shortest common supersequence** (SCS) of two strings is the shortest string that contains both of them this way.

For `abac` and `cab`, the SCS is `cabac`, with a length of 5.

```text
cabac contains abac:   c [a b a c]  (delete the first c)
cabac contains cab:    [c a b] a c  (delete the last a and c)
```

## The Key Insight

Writing both strings one after the other always works: `abaccab` has length 7. To shorten it, **let the two strings share characters where they can**.

The characters they can share, in order, are exactly a [[Longest Common Subsequence]]. Each shared character saves one position. So:

```text
length of SCS = length(a) + length(b) - length(LCS)
```

For `abac` and `cab`, the LCS is `ab`, of length 2, so the SCS has length `4 + 3 - 2 = 5`.

## The Direct Recurrence

You can also compute it directly. Let `scs[i][j]` be the SCS length for the first `i` characters of `a` and the first `j` characters of `b`.

**If the last characters match,** one shared character serves both:

```text
scs[i][j] = 1 + scs[i-1][j-1]
```

**If they differ,** the supersequence must end in one of them. Try both, and take the shorter result:

```text
scs[i][j] = 1 + min( scs[i-1][j],  scs[i][j-1] )
```

With an empty string, the SCS is the other string, so `scs[i][0] = i` and `scs[0][j] = j`.

## Worked Example

For `abac` and `cab`:

|   | "" | c | a | b |
| --- | --- | --- | --- | --- |
| "" | 0 | 1 | 2 | 3 |
| a | 1 | 2 | 2 | 3 |
| b | 2 | 3 | 3 | 3 |
| a | 3 | 4 | 4 | 4 |
| c | 4 | 4 | 5 | 5 |

The answer is the bottom-right cell: **5**.

### Rebuilding the String

Start at the bottom-right cell, and walk back to the top-left.

- If the characters match, write that character once, and move diagonally.
- Otherwise, move to the smaller neighbor, and write the character of the string you step back in.
- When one string runs out, write the rest of the other.

Reversing what you wrote gives the SCS.

## Code

```python
def scs(a, b):
    n, m = len(a), len(b)
    table = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        for j in range(m + 1):
            if i == 0 or j == 0:
                table[i][j] = i + j
            elif a[i - 1] == b[j - 1]:
                table[i][j] = 1 + table[i - 1][j - 1]
            else:
                table[i][j] = 1 + min(table[i - 1][j], table[i][j - 1])

    i, j = n, m
    result = []
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            result.append(a[i - 1])
            i -= 1
            j -= 1
        elif table[i - 1][j] <= table[i][j - 1]:
            result.append(a[i - 1])
            i -= 1
        else:
            result.append(b[j - 1])
            j -= 1
    result.extend(reversed(a[:i]))
    result.extend(reversed(b[:j]))
    return "".join(reversed(result))

def contains_subsequence(text, part):
    letters = iter(text)
    return all(char in letters for char in part)

answer = scs("abac", "cab")
print(len(answer))  # 5
print(contains_subsequence(answer, "abac"), contains_subsequence(answer, "cab"))  # True True
print(scs("abc", ""))  # abc
print(scs("abc", "abc"))  # abc
```

There can be several correct answers of the same length.

## Using the LCS to Build It

You can also build it from an LCS: write the characters of both strings in order, but write each LCS character only once.

```text
a = a b a c      LCS = a b
b = c a b

Characters of b before the shared 'a':   c
Shared 'a':                              a
Shared 'b':                              b
Rest of a:                               a c

Result: c a b a c
```

## Complexity

| Measure | Cost |
| --- | --- |
| Time | O(n × m) |
| Space | O(n × m) to build the string |
| Space, length only | O(min(n, m)), using two rows |

## How It Relates to Others

| Problem | Meaning | Formula |
| --- | --- | --- |
| [[Longest Common Subsequence]] | The most that can be shared | Base problem |
| Shortest common supersequence | The least you can write to include both | `n + m - LCS` |
| [[Edit Distance]], with no replace | Changes to get from one to the other | `n + m - 2 × LCS` |

## More Than Two Strings

With two strings, this is easy. With many strings, finding the shortest common supersequence becomes [[NP-Complete Problems|NP-hard]], even though the two-string case takes `O(n × m)`. DNA assembly faces a closely related problem.

## Common Mistakes

- **Confusing it with a substring.** The strings needn't appear as unbroken runs.
- **Using `max` as in LCS.** LCS maximizes what is kept, while SCS minimizes the length, so it uses `min`.
- **Forgetting the leftovers.** When one string runs out while rebuilding, the rest of the other must still be added.
- **Getting the base case wrong.** The first row and column count up, because an empty string's SCS is the other string.
