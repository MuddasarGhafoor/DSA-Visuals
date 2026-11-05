> Finding a pattern by comparing hash values, using a rolling hash that updates in one step as the window slides.

## What It Is

**Rabin-Karp** finds a pattern in a text by comparing **numbers instead of strings**. It works out a hash of the pattern, and a hash of each window of text the same length. Only when the two hashes match does it compare the actual characters.

Comparing two numbers takes one step, so most positions are ruled out instantly.

## The Rolling Hash

Hashing each window from scratch would take `O(m)` per window, which is no better than [[Naive Pattern Matching]]. The clever part is that the next window's hash can be worked out from the current one in `O(1)`: remove the character leaving, and add the character entering.

Think of it as a number. With a window of `3 4 2` in base 10:

```text
Current window:  3 4 2     =  342
Slide right:       4 2 7   =  ?

Remove the leading 3:   342 - 3 × 100  =  42
Shift left:             42 × 10        =  420
Add the new 7:          420 + 7        =  427
```

In general, with base `p` and a window of size `m`:

```text
new_hash = (old_hash - leaving × p^(m-1)) × p + entering     (mod q)
```

## Worked Example

Search for `"cab"` in `"abcabd"`, with `p = 10`, `q = 101`, and a = 1, b = 2, c = 3, d = 4.

The pattern is `3 1 2`, so its hash is `312 % 101 = 9`.

| Window | Digits | Hash | Match? |
| --- | --- | --- | --- |
| abc | 1 2 3 | 123 % 101 = 22 | No |
| bca | 2 3 1 | 231 % 101 = 29 | No |
| cab | 3 1 2 | 312 % 101 = 9 | Hash matches, characters match. Found at 2 |
| abd | 1 2 4 | 124 % 101 = 23 | No |

## Code

```python
def rabin_karp(text, pattern, base=256, prime=1_000_000_007):
    n, m = len(text), len(pattern)
    if m == 0 or m > n:
        return []
    leading = pow(base, m - 1, prime)       # the weight of the first character
    target = window = 0
    for i in range(m):
        target = (target * base + ord(pattern[i])) % prime
        window = (window * base + ord(text[i])) % prime

    matches = []
    for start in range(n - m + 1):
        # Only compare characters when the numbers agree.
        if window == target and text[start:start + m] == pattern:
            matches.append(start)
        if start < n - m:
            window = (window - ord(text[start]) * leading) % prime
            window = (window * base + ord(text[start + m])) % prime
    return matches

print(rabin_karp("abcabd", "cab"))  # [2]
print(rabin_karp("aaaa", "aa"))  # [0, 1, 2]
print(rabin_karp("hello", "z"))  # []
```

## Spurious Hits

Two different strings can have the same hash. A hash match that turns out wrong is called a **spurious hit**, and that is why the characters are still compared. With a large prime, these are rare.

If the check were skipped, the search would be faster, and it could occasionally report a false match.

## Complexity

| Case | Time | When |
| --- | --- | --- |
| Average | O(n + m) | Few hash matches |
| Worst | O(n × m) | Many hash matches, such as `aaaa...` with pattern `aa` |
| Space | O(1) extra | |

Every real match costs `m` comparisons, so a text with many matches takes longer. A poor choice of `q`, or inputs designed to collide, can also trigger the worst case.

## Why Use It

Its special strength is **searching for many patterns of the same length at once**. Put all the pattern hashes in a [[Sets and Maps|set]], and check each window against the set in `O(1)`. [[KMP]] would need a separate pass for each pattern.

```python
def find_any(text, patterns, length):
    wanted = set(patterns)
    return [i for i in range(len(text) - length + 1) if text[i:i + length] in wanted]

print(find_any("abcabd", ["cab", "abd"], 3))  # [2, 3]
```

This kind of search is used in:

- **Plagiarism detection,** comparing many short phrases across documents.
- **Finding repeated content,** such as duplicate blocks in files.

| | [[Naive Pattern Matching\|Naive]] | [[KMP]] | Rabin-Karp |
| --- | --- | --- | --- |
| Worst case | O(n × m) | O(n + m) | O(n × m) |
| Average case | O(n) on normal text | O(n + m) | O(n + m) |
| Extra space | O(1) | O(m) | O(1) |
| Many patterns | One pass each | One pass each | One pass overall |

## Common Mistakes

- **Negative hashes.** In C and Java, `(window - leaving) % q` can be negative. Add `q` before taking the remainder. Python handles this correctly.
- **Skipping the character check.** A hash match isn't proof.
- **A small prime.** A small `q` gives many spurious hits, which brings back the slow worst case.
- **Overflow.** Multiplying before reducing can overflow fixed-size integers. Use 64-bit values, and reduce often.
