> Turning strings into numbers, so that strings and their substrings can be compared quickly.

## What It Is

Comparing two strings of length `n` takes up to `n` steps. **String hashing** turns each string into a single number, and comparing two numbers takes one step. If the numbers differ, the strings are certainly different. If they match, the strings are almost certainly the same.

## Polynomial Hashing

Treat the string as a number written in a large base `p`, and keep the result small with a remainder.

```text
hash(s) = s[0]·p^(n-1) + s[1]·p^(n-2) + ... + s[n-1]·p^0     (mod m)
```

The position of each character matters, so "ab" and "ba" get different results. That is what the simple sum of characters gets wrong.

You compute it left to right. For each character, multiply what you have by `p` and add the character. This is called **Horner's method**, and it takes `O(n)` steps.

### Choosing p and m

- **p** should be larger than the alphabet. 31 or 131 are common choices for text.
- **m** should be a large prime, such as `1,000,000,007`, so that results rarely collide.

## Worked Example

Hash "cab" with `p = 31` and `m = 1009`, using a = 1, b = 2, c = 3.

| Character | Calculation | Hash |
| --- | --- | --- |
| c | 0 × 31 + 3 | 3 |
| a | 3 × 31 + 1 | 94 |
| b | 94 × 31 + 2 | 2916 % 1009 = 898 |

## The Real Power: Substrings in O(1)

After `O(n)` of setup, you can get the hash of **any substring** in one step. This works just like a running total.

Build `prefix[i]`, the hash of the first `i` characters. Then the hash of the substring from `l` up to but not including `r` is:

```text
hash(l, r) = prefix[r] - prefix[l] · p^(r - l)     (mod m)
```

The subtraction removes the characters before `l`, and the multiplication lines up their positions.

## Code

```python
P = 131
M = 1_000_000_007

class StringHasher:
    def __init__(self, text):
        self.prefix = [0] * (len(text) + 1)
        self.power = [1] * (len(text) + 1)
        for i, char in enumerate(text):
            self.prefix[i + 1] = (self.prefix[i] * P + ord(char)) % M
            self.power[i + 1] = (self.power[i] * P) % M

    def substring(self, left, right):
        # The hash of text[left:right], in O(1).
        return (self.prefix[right] - self.prefix[left] * self.power[right - left]) % M

text = "abcabc"
hasher = StringHasher(text)
print(hasher.substring(0, 3) == hasher.substring(3, 6))  # True
print(hasher.substring(0, 3) == hasher.substring(1, 4))  # False
```

## Worked Example: Counting Distinct Substrings

How many different substrings of length `k` does a text have? Comparing them directly costs `O(n × k)`. With hashes, each one is a single number, so a set can count them in `O(n)`.

```python
def count_distinct(text, k):
    hasher = StringHasher(text)
    return len({hasher.substring(i, i + k) for i in range(len(text) - k + 1)})

print(count_distinct("abcabc", 3))  # 3
```

## Collisions

Different strings can have the same hash. With `m` near 10⁹, the chance for any one pair is about one in a billion. But across many pairs, the risk grows: compare 100,000 strings against each other, and a collision becomes likely, as with the birthday paradox.

### Reducing the Risk

- **Check on a match.** Compare the actual strings when the hashes match. This removes wrong answers entirely, and [[Rabin-Karp]] does this.
- **Use two hashes.** Use two different pairs of `p` and `m`, and treat strings as equal only if both match. The chance drops to about 10⁻¹⁸.
- **Pick p at random.** This stops anyone from crafting inputs that collide on purpose.

## Complexity

| Step | Time | Space |
| --- | --- | --- |
| Setup | O(n) | O(n) |
| Hash of any substring | O(1) | None |
| Compare two substrings | O(1) | None |

## Common Mistakes

- **Mapping a to 0.** Then "a" and "aa" both hash to 0. Start at 1, or use the character code.
- **Negative results.** In C, C++, and Java, subtraction can leave a negative remainder. Add `m` before taking the remainder.
- **Overflow.** Multiplying two values near 10⁹ needs 64 bits. A 32-bit integer overflows.
- **Treating equal hashes as proof.** Unless the result can tolerate rare mistakes, confirm with a real comparison.
