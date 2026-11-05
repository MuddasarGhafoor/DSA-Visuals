> Trying the pattern at every position of the text, the simple starting point for string matching.

## What It Is

**Pattern matching** means finding where a short string, the **pattern**, appears inside a longer string, the **text**. This is what happens when you press Ctrl+F.

The **naive** approach is the most direct one: line the pattern up at the first position, compare character by character, and if anything differs, slide it one position to the right and start over.

## How It Works

For each starting position in the text:

1. Compare the pattern with the text at this position, one character at a time.
2. If every character matches, record the position.
3. On the first mismatch, stop comparing, and move to the next starting position.

## Worked Example

Search for `ABC` in `ABABC`.

```text
Position 0:   A B A B C
              A B C
              ✓ ✓ ✗       mismatch on the third character

Position 1:   A B A B C
                A B C
                ✗         mismatch right away

Position 2:   A B A B C
                  A B C
                  ✓ ✓ ✓   found at position 2
```

## Code

```python
def naive_search(text, pattern):
    matches = []
    for start in range(len(text) - len(pattern) + 1):
        i = 0
        while i < len(pattern) and text[start + i] == pattern[i]:
            i += 1
        if i == len(pattern):
            matches.append(start)
    return matches

print(naive_search("ABABC", "ABC"))  # [2]
print(naive_search("AAAA", "AA"))  # [0, 1, 2]
print(naive_search("hello", "xyz"))  # []
```

There are `n - m + 1` starting positions, where `n` is the text length and `m` is the pattern length.

## Complexity

| Case | Comparisons | Example |
| --- | --- | --- |
| Best | O(n) | Most positions fail on the first character |
| Worst | O(n × m) | Text `AAAAAAAA`, pattern `AAAB` |
| Space | O(1) | Just the loop counters |

### Why the Worst Case Happens

In the worst case, every position matches almost the whole pattern before failing.

```text
Text:    A A A A A A A A
Pattern: A A A B            3 matches, then a mismatch
           A A A B          3 matches, then a mismatch
             A A A B        and so on
```

All that work gets thrown away at each step. The algorithm has already seen those `A`s, and it compares them again.

## When It Is Good Enough

On ordinary text, a mismatch usually comes on the first or second character, so it runs close to `O(n)`. It is also simple, and it needs no setup.

- **Short patterns and texts,** where the difference doesn't matter.
- **One-off searches** in normal text.

Many standard library searches started out close to this, with some tweaks.

## How to Do Better

Each faster method fixes the same waste: the information from earlier comparisons being thrown away.

| Algorithm | The Idea | Worst Case | Extra Space |
| --- | --- | --- | --- |
| Naive | Try every position | O(n × m) | O(1) |
| [[KMP]] | Use earlier matches to slide further | O(n + m) | O(m) |
| [[Rabin-Karp]] | Compare hashes before comparing characters | O(n × m), rarely | O(1) |

## Common Mistakes

- **The wrong loop bound.** The last possible start is `n - m`, so the range must go up to `n - m + 1`. Going further reads past the end of the text.
- **Not handling an empty pattern.** Decide what it means. By convention, an empty pattern matches at every position.
- **Sliding too far after a match.** If you jump past the whole match, you miss overlaps, such as `AA` appearing 3 times in `AAAA`.
