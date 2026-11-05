> Working directly on the binary digits of a number with AND, OR, XOR, and shifts.

## What It Is

Computers store every integer in binary. **Bit manipulation** means working on those binary digits directly, using operators the processor runs in a single step.

For example, 13 in binary is `1101`: that is 8 + 4 + 0 + 1.

## The Operators

| Operator | Symbol | Rule | Example with `1100` and `1010` |
| --- | --- | --- | --- |
| AND | `&` | 1 only if both bits are 1 | `1000` |
| OR | `\|` | 1 if either bit is 1 | `1110` |
| XOR | `^` | 1 if the bits differ | `0110` |
| NOT | `~` | Flips every bit | `~x` equals `-x - 1` in Python |
| Left shift | `<<` | Moves bits left | `3 << 2` is 12, the same as multiplying by 4 |
| Right shift | `>>` | Moves bits right | `12 >> 2` is 3, the same as dividing by 4 |

## Working With One Bit

To work on bit number `i`, counted from 0 at the right, first build a **mask** with `1 << i`.

| Task | Expression | Why It Works |
| --- | --- | --- |
| Read bit i | `(x >> i) & 1` | Moves the bit to the end, then keeps only it |
| Set bit i to 1 | `x \| (1 << i)` | OR with 1 always gives 1 |
| Clear bit i to 0 | `x & ~(1 << i)` | AND with 0 always gives 0 |
| Flip bit i | `x ^ (1 << i)` | XOR with 1 always flips |

## Useful Tricks

### Check for Odd or Even

The last bit decides, so `x & 1` is 1 for odd numbers and 0 for even numbers.

### Clear the Lowest 1 Bit

`x & (x - 1)` removes the lowest 1. Subtracting 1 flips that bit and every 0 to its right, so the AND wipes them all out.

```text
x       = 1101 0100
x - 1   = 1101 0011
x & x-1 = 1101 0000
```

This gives a fast way to count the 1 bits, because the loop runs once per 1 bit. It also gives a quick test for powers of two, since they have exactly one 1 bit.

### XOR Cancels Pairs

Two facts make XOR special: `a ^ a = 0` and `a ^ 0 = a`. If you XOR a whole list, every value that appears twice cancels out, and only the value that appears once is left.

```python
def count_ones(x):
    count = 0
    while x:
        x &= x - 1      # removes the lowest 1 bit
        count += 1
    return count

def is_power_of_two(x):
    return x > 0 and x & (x - 1) == 0

def single_number(values):
    result = 0
    for value in values:
        result ^= value
    return result

print(count_ones(13))  # 3
print(is_power_of_two(64))  # True
print(is_power_of_two(70))  # False
print(single_number([4, 1, 2, 1, 2]))  # 4
```

## Using Bits as a Set

An integer can store a set of small numbers. Bit `i` being 1 means `i` is in the set. This saves memory, and set operations become single steps.

| Set Operation | With Bits |
| --- | --- |
| Union | `a \| b` |
| Intersection | `a & b` |
| Add item i | `a \| (1 << i)` |
| Contains i | `(a >> i) & 1` |
| All subsets of n items | The numbers 0 to `2ⁿ - 1` |

This is the idea behind a [[Bit Array]].

## Complexity

Each operator on a normal machine integer takes `O(1)` time. Going over all the bits of a `b`-bit number takes `O(b)`, and `count_ones` above takes one step per 1 bit.

## Common Mistakes

- **Forgetting parentheses.** In C and C++, `x & 1 == 0` means `x & (1 == 0)`, because `==` runs first. Write `(x & 1) == 0` in every language, so the order is never in doubt.
- **Shifting too far.** In languages with fixed-size integers, shifting by the full width or more gives wrong or undefined results.
- **Right-shifting negative numbers.** Whether the sign is kept depends on the language and the type. Check before relying on it.
