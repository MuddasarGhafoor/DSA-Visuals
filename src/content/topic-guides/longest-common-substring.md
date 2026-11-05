> The longest run of characters that appears, unbroken, in both of two strings.

## What It Is

A **substring** is a run of characters that sit next to each other, with no gaps. The **longest common substring** of two strings is the longest such run that appears in both.

For `abcdef` and `zcdemf`, the answer is `cde`, with a length of 3.

```text
a b [c d e] f
z [c d e] m f
```

The `f` at the end doesn't extend it, since `m` breaks the run in the second string.

## The Key Idea

Let `run[i][j]` be the length of the common run that **ends exactly** at `a[i - 1]` and `b[j - 1]`.

- **If the characters match,** the run grows by 1.
- **If they differ,** no common run can end here, so it **resets to 0**.

```text
run[i][j] = 1 + run[i-1][j-1]     if a[i-1] == b[j-1]
run[i][j] = 0                     otherwise
```

Unlike most tables, the answer isn't in the bottom-right cell. It is the **largest value anywhere** in the table, since the best run can end anywhere.

## Worked Example

Compare `abcd` and `xbcd`.

|   | "" | x | b | c | d |
| --- | --- | --- | --- | --- | --- |
| "" | 0 | 0 | 0 | 0 | 0 |
| a | 0 | 0 | 0 | 0 | 0 |
| b | 0 | 0 | 1 | 0 | 0 |
| c | 0 | 0 | 0 | 2 | 0 |
| d | 0 | 0 | 0 | 0 | 3 |

A growing run shows up as a diagonal: 1, 2, 3. The largest value is **3**, and it ends at `d`, so the answer is `bcd`.

## Code

```python
def longest_common_substring(a, b):
    run = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    best, end = 0, 0
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                run[i][j] = run[i - 1][j - 1] + 1
                if run[i][j] > best:
                    best, end = run[i][j], i
    return a[end - best:end]

print(longest_common_substring("abcdef", "zcdemf"))  # cde
print(longest_common_substring("abcd", "xbcd"))  # bcd
print(longest_common_substring("abc", "xyz"))  # 
```

## Saving Memory

Each cell only looks at the diagonal in the row above, so one row is enough, as long as you go through it **backward**. That way, the old value is still there when you need it.

```python
def longest_run_length(a, b):
    run = [0] * (len(b) + 1)
    best = 0
    for char_a in a:
        for j in range(len(b), 0, -1):     # backward, to keep the old diagonal
            run[j] = run[j - 1] + 1 if char_a == b[j - 1] else 0
            best = max(best, run[j])
    return best

print(longest_run_length("abcdef", "zcdemf"))  # 3
```

## Complexity

| Version | Time | Space |
| --- | --- | --- |
| Full table | O(n × m) | O(n × m) |
| One row | O(n × m) | O(min(n, m)) |
| Checking every pair of substrings | O(n² × m²) or worse | |

### A Faster Way With Hashing

Common substrings have a useful property: if there is a common substring of length `k`, there is also one of every shorter length. So you can run a [[Binary Search]] on the length, and test each length using [[String Hashing]]. This takes about `O((n + m) log(min(n, m)))`.

```python
def has_common_of_length(a, b, k):
    seen = {a[i:i + k] for i in range(len(a) - k + 1)}
    return any(b[j:j + k] in seen for j in range(len(b) - k + 1))

def longest_by_search(a, b):
    low, high = 0, min(len(a), len(b))
    while low < high:
        middle = (low + high + 1) // 2
        if has_common_of_length(a, b, middle):
            low = middle
        else:
            high = middle - 1
    return low

print(longest_by_search("abcdef", "zcdemf"))  # 3
```

For simplicity, this version compares real strings in a set. With rolling hashes, each length costs only `O(n + m)`.

## Substring vs Subsequence

| | Substring | [[Longest Common Subsequence\|Subsequence]] |
| --- | --- | --- |
| Characters must be adjacent | Yes | No |
| On a mismatch | Reset to 0 | Take the better neighbor |
| Where the answer is | The largest cell | The bottom-right cell |
| `abcd` and `axcd` | `cd`, length 2 | `acd`, length 3 |

## Where It Is Used

- **Plagiarism detection:** finding long shared passages.
- **DNA analysis:** finding shared sequences.
- **Compression:** finding repeated blocks.
- **File comparison:** spotting code that was copied.

## Common Mistakes

- **Reading the answer from the bottom-right cell.** That only covers runs ending at both last characters. Track the largest value.
- **Keeping a value on a mismatch.** A mismatch breaks the run, so it must reset to 0.
- **Going forward with one row.** The left cell has already been overwritten, so the diagonal is wrong.
- **Forgetting where the run ended.** To return the text rather than its length, record the end position too.
