> The longest subsequence of a string that reads the same forward and backward.

## What It Is

A **palindrome** reads the same in both directions, such as `racecar`. A **subsequence** keeps characters in order, but it can skip some.

The **longest palindromic subsequence** (LPS) is the longest subsequence of a string that is a palindrome.

For `character`, the answer is `carac`, with a length of 5.

```text
c h a r a c t e r
^   ^ ^ ^ ^
```

## The Key Idea

Look at the two **ends** of a range of the string. Let `lps[i][j]` be the answer for the part from position `i` to position `j`.

**If the two ends match,** both can wrap around the best palindrome inside:

```text
lps[i][j] = 2 + lps[i+1][j-1]
```

**If they differ,** they can't both be used. Drop one, and keep the better result:

```text
lps[i][j] = max( lps[i+1][j],  lps[i][j-1] )
```

The base cases are simple: a single character is a palindrome of length 1, and an empty range has length 0.

## Worked Example

Find the LPS of `bbbab`. Fill the table from short ranges to long ranges, since each range relies on shorter ones inside it.

| i \ j | 0 (b) | 1 (b) | 2 (b) | 3 (a) | 4 (b) |
| --- | --- | --- | --- | --- | --- |
| 0 (b) | 1 | 2 | 3 | 3 | 4 |
| 1 (b) | | 1 | 2 | 2 | 3 |
| 2 (b) | | | 1 | 1 | 3 |
| 3 (a) | | | | 1 | 1 |
| 4 (b) | | | | | 1 |

The answer is in the top-right cell: **4**, for `bbbb`.

Here are two cells worked out:

- `lps[2][4]` is the range `bab`. The ends match, so it is `2 + lps[3][3] = 2 + 1 = 3`.
- `lps[0][3]` is the range `bbba`. The ends differ, so it is `max(lps[1][3], lps[0][2]) = max(2, 3) = 3`.

## Code

```python
def lps_length(text):
    n = len(text)
    if n == 0:
        return 0
    table = [[0] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):         # go from the end, so inner ranges are ready
        table[i][i] = 1
        for j in range(i + 1, n):
            if text[i] == text[j]:
                table[i][j] = 2 + table[i + 1][j - 1]
            else:
                table[i][j] = max(table[i + 1][j], table[i][j - 1])
    return table[0][n - 1]

print(lps_length("bbbab"))  # 4
print(lps_length("character"))  # 5
print(lps_length("abc"))  # 1
```

## A Neat Shortcut

A palindrome reads the same in both directions, so the LPS must appear in both the string and its reverse. In fact, **the LPS of a string equals the [[Longest Common Subsequence]] of the string and its reverse**.

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

def lps_by_lcs(text):
    return lcs_length(text, text[::-1])

print(lps_by_lcs("bbbab"))  # 4
print(lps_by_lcs("character"))  # 5
```

## A Related Question

**What is the fewest characters you need to delete to make a string a palindrome?** It is the string's length minus its LPS, since you keep the LPS and delete everything else.

For `character`, that is `9 - 5 = 4` deletions. The fewest **inserts** to make a palindrome is the same number.

## Complexity

| Version | Time | Space |
| --- | --- | --- |
| Range table | O(n²) | O(n²) |
| Using only two rows | O(n²) | O(n) |
| Trying all subsequences | O(2ⁿ × n) | |

## Subsequence vs Substring

| | Palindromic Subsequence | Palindromic Substring |
| --- | --- | --- |
| Can skip characters | Yes | No |
| `character` | `carac`, length 5 | `ara`, length 3 |
| On a mismatch | Takes the better of two | The range isn't a palindrome at all |

## Why the Fill Order Matters

This is an **interval DP**: each answer depends on smaller ranges inside it. You must compute short ranges first. The outer loop goes from `n - 1` down to 0, which guarantees that `table[i + 1][...]` is ready. [[Matrix Chain Multiplication]] and [[Optimal BST]] use the same pattern.

## Common Mistakes

- **Filling the table in the wrong order.** Going from `i = 0` upward reads cells that haven't been computed yet.
- **Requiring adjacent characters.** That is the substring problem.
- **Adding 2 when `i == j`.** A single character counts once. The base case handles this, so set the diagonal to 1 first.
- **Reading the wrong cell.** The answer for the whole string is at `table[0][n - 1]`.
