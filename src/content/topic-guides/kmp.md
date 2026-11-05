> Finding a pattern in text in linear time, by never re-reading a character of the text.

## What It Is

**KMP**, the Knuth-Morris-Pratt algorithm, finds a pattern in a text in `O(n + m)` time, where `n` is the text length and `m` is the pattern length.

[[Naive Pattern Matching]] throws away what it learned at every mismatch, and slides back to try again. KMP keeps that knowledge. When a mismatch happens, the characters that already matched tell it exactly how far the pattern can safely slide.

## The Key Idea

Suppose you are searching for `ABABC`, and you have matched `ABAB` when the next character fails.

```text
Text:     A B A B A B C
Pattern:  A B A B C
                  ^ mismatch: text has A, pattern wants C
```

You know the last four characters of the text were `ABAB`. The pattern starts with `AB`, and `ABAB` ends with `AB`. So the pattern can slide so that its first `AB` sits on top of those last two characters, without reading them again.

```text
Text:     A B A B A B C
Pattern:      A B A B C
                  ^ continue from here
```

The text pointer never moves backward. That is what makes it linear.

## The Failure Table

To slide correctly, KMP first studies the pattern alone. For each position `i`, the **failure table** stores the length of the longest proper prefix of `pattern[0..i]` that is also a suffix of it. "Proper" means it can't be the whole string.

Here it is for `ABABC`:

| i | Pattern So Far | Longest Prefix That Is Also a Suffix | failure[i] |
| --- | --- | --- | --- |
| 0 | A | None | 0 |
| 1 | AB | None | 0 |
| 2 | ABA | A | 1 |
| 3 | ABAB | AB | 2 |
| 4 | ABABC | None | 0 |

When a mismatch happens after matching `k` characters, the pattern falls back to position `failure[k - 1]`.

## Code

```python
def build_failure(pattern):
    failure = [0] * len(pattern)
    length = 0                          # the current matched prefix
    for i in range(1, len(pattern)):
        while length > 0 and pattern[i] != pattern[length]:
            length = failure[length - 1]
        if pattern[i] == pattern[length]:
            length += 1
        failure[i] = length
    return failure

def kmp_search(text, pattern):
    failure = build_failure(pattern)
    matches = []
    k = 0                               # how many pattern characters are matched
    for i, char in enumerate(text):
        while k > 0 and char != pattern[k]:
            k = failure[k - 1]          # slide the pattern, keeping i in place
        if char == pattern[k]:
            k += 1
        if k == len(pattern):
            matches.append(i - k + 1)
            k = failure[k - 1]          # keep looking for overlapping matches
    return matches

print(build_failure("ABABC"))  # [0, 0, 1, 2, 0]
print(kmp_search("ABABABC", "ABABC"))  # [2]
print(kmp_search("AAAAA", "AA"))  # [0, 1, 2, 3]
```

## Worked Example

Search for `ABABC` in `ABABABC`.

| i | Text Char | k Before | What Happens | k After |
| --- | --- | --- | --- | --- |
| 0 | A | 0 | Match | 1 |
| 1 | B | 1 | Match | 2 |
| 2 | A | 2 | Match | 3 |
| 3 | B | 3 | Match | 4 |
| 4 | A | 4 | Pattern wants C. Fall back to failure[3] = 2, then A matches | 3 |
| 5 | B | 3 | Match | 4 |
| 6 | C | 4 | Match, and the whole pattern is found at index 2 | 5 |

## Why It Is Linear

The inner `while` loop looks as if it could make this quadratic, but it can't. `k` increases by at most 1 per character of the text, and each step of the `while` loop decreases it. It can't decrease more times than it increased, so the total number of fallbacks is at most `n`.

## Complexity

| Part | Time | Space |
| --- | --- | --- |
| Building the failure table | O(m) | O(m) |
| Searching | O(n) | O(1) extra |
| Total | O(n + m), in every case | O(m) |

## When to Use It

- **Long texts or repetitive patterns,** where the naive approach could be slow.
- **Streaming input,** because it never needs to look back at the text.
- **A guaranteed worst case.** [[Rabin-Karp]] is also `O(n + m)` on average, but can slow down on hash collisions.

For several patterns at once, Rabin-Karp is usually easier to adapt.

## Common Mistakes

- **Not looping the fallback.** A single `if` isn't enough. The pattern may need to fall back several times.
- **Starting the table at i = 0.** That compares the first character with itself, and every prefix would match the whole string. Start at 1.
- **Forgetting to fall back after a match.** Without `k = failure[k - 1]`, the next character reads past the end of the pattern, and overlapping matches are lost.
