> A compact array that stores one true-or-false value in each bit.

## What It Is

A normal array of booleans usually uses a whole byte for each value, which wastes 7 of its 8 bits. A **bit array** stores each true-or-false value in a single bit, so it fits 8 values where a normal array fits one.

For one million flags, that is about 125 KB where a byte array needs about 1 MB.

## How It Works

Memory can't be addressed one bit at a time, so the bits are packed into a list of **words**, such as 8-bit bytes or 64-bit integers. To reach bit `i`, you work out two things:

| Question | Formula, With 8-Bit Words | For i = 19 |
| --- | --- | --- |
| Which word holds it? | `i // 8` | 2 |
| Which bit in that word? | `i % 8` | 3 |

```text
bit index:   7 6 5 4 3 2 1 0   15 ... 8   23 ... 16
             word 0            word 1     word 2
                                               ^ bit 19 is bit 3 of word 2
```

## Code

Each operation uses a mask built with a shift. See [[Bit Manipulation]] for how masks work.

```python
class BitArray:
    def __init__(self, size):
        self.size = size
        self.words = [0] * ((size + 7) // 8)

    def set(self, i):
        self.words[i // 8] |= 1 << (i % 8)

    def clear(self, i):
        self.words[i // 8] &= ~(1 << (i % 8))

    def get(self, i):
        return (self.words[i // 8] >> (i % 8)) & 1 == 1

    def count(self):
        return sum(bin(word).count("1") for word in self.words)

bits = BitArray(100)
bits.set(19)
bits.set(3)
print(bits.get(19))  # True
print(bits.get(20))  # False
print(bits.count())  # 2
bits.clear(19)
print(bits.get(19))  # False
print(len(bits.words))  # 13
```

## Worked Example: Setting Bit 19

1. Find the word: `19 // 8 = 2`.
2. Find the bit: `19 % 8 = 3`.
3. Build the mask: `1 << 3` gives `0000 1000`.
4. OR it into word 2. That bit becomes 1, and the others stay as they were.

## Complexity

| Operation | Time | Why |
| --- | --- | --- |
| Get, set, or clear one bit | O(1) | A division and one bitwise step |
| Count all set bits | O(n / w) | One step per word, with `w` bits per word |
| AND, OR, or XOR of two arrays | O(n / w) | One step per word |
| Space | n / 8 bytes | One bit per value |

The whole-array operations are what make bit arrays so fast. A 64-bit processor handles 64 values in one step.

## Where It Is Used

- **Sets of small numbers.** Bit `i` being 1 means `i` is in the set. Union and intersection become single OR and AND operations.
- **Finding primes.** A prime sieve up to a billion fits in about 125 MB as bits.
- **Tracking free space.** File systems keep a bit for each disk block, to show whether it is in use.
- **Graphs.** A dense adjacency matrix can use one bit per possible edge.

## Tradeoffs

- **A little slower per access,** since each read needs a shift and a mask, while a byte array reads directly.
- **Harder to write to safely from several threads,** because setting one bit means rewriting the whole word.
- **Only two states per value.** Anything else needs more bits.

## Common Mistakes

- **Rounding down the word count.** `size // 8` is too small for 100 bits. Use `(size + 7) // 8`, which rounds up.
- **Using a mask to clear without NOT.** Clearing needs `& ~mask`. Writing `& mask` clears every bit *except* the one you wanted.
- **Forgetting the unused bits.** The last word can have spare bits. Keep them at 0, or `count` can come out wrong after an operation such as NOT.
