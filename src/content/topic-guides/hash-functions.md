> Turning a key of any kind into a number, spreading keys evenly so few of them collide.

## What It Is

A **hash function** takes a key, such as a name or a number, and turns it into an integer. A [[Hash Tables|hash table]] then uses that integer to pick a slot.

```text
"cat"  ->  hash function  ->  1548  ->  1548 % 10  ->  slot 8
```

It is like a filing rule that says where a document belongs, so you can go straight to it instead of looking through every drawer.

## What Makes a Good One

| Property | Meaning | Why It Matters |
| --- | --- | --- |
| Deterministic | The same key always gives the same number | Otherwise you could never find a stored key |
| Uniform | Keys spread evenly across the slots | Fewer collisions mean faster lookups |
| Fast | Takes little time to compute | It runs on every operation |
| Sensitive | Similar keys give very different numbers | Real keys often look alike, such as `user1` and `user2` |

A **collision** is when two keys give the same slot. Collisions can't be avoided, because there are far more possible keys than slots. A good function just makes them rare, and the table handles the rest with [[Chaining]] or [[Open Addressing]].

## Common Methods

### Division

Use the remainder after dividing by the number of slots.

```text
h(k) = k mod m
```

Choose `m` carefully. With `m = 100`, the hash is just the last two digits of the key, and it ignores the rest. A **prime** number not close to a power of 2 spreads keys better.

### Multiplication

Multiply the key by a constant between 0 and 1, keep the fractional part, and scale it up to the table size.

```text
h(k) = floor(m × (k × A mod 1)),   with A ≈ 0.6180339887
```

This works for any table size, including powers of 2. The constant is a common choice suggested by Donald Knuth.

### Strings

Each character must affect the result, and so must its position. Otherwise "cat" and "act" would collide. The usual method is **polynomial hashing**, which is covered in [[String Hashing]].

## Code

```python
def division_hash(key, slots):
    return key % slots

def multiplication_hash(key, slots):
    fraction = (key * 0.6180339887) % 1
    return int(slots * fraction)

def text_hash(text, slots):
    value = 0
    for char in text:
        value = (value * 31 + ord(char)) % slots
    return value

print(division_hash(1234, 10))  # 4
print(multiplication_hash(1234, 10))  # 6
print(text_hash("cat", 101) == text_hash("act", 101))  # False
```

## Worked Example: Why the Table Size Matters

Suppose your keys are all multiples of 10: 10, 20, 30, 40, 50, 60.

| Key | k % 10 | k % 7 |
| --- | --- | --- |
| 10 | 0 | 3 |
| 20 | 0 | 6 |
| 30 | 0 | 2 |
| 40 | 0 | 5 |
| 50 | 0 | 1 |
| 60 | 0 | 4 |

With 10 slots, every key collides at slot 0. With 7 slots, a prime, they all spread out. The pattern in the keys shares a factor with 10, and not with 7.

## Bad Examples

- **First letter of a name.** Many people's names start with S or M, and hardly any with X.
- **String length.** Most words are short, so a few slots get nearly everything.
- **Sum of characters.** "cat" and "act" give the same total, so all anagrams collide.

## Hash Tables vs Cryptography

| | Table Hash | Cryptographic Hash, Such as SHA-256 |
| --- | --- | --- |
| Goal | Speed and an even spread | Being impossible to reverse or forge |
| Speed | Very fast | Much slower |
| Output | A small integer | A long, fixed-size value |
| Used for | Lookups | Passwords, signatures, file checks |

## Common Mistakes

- **Using an equal hash for unequal things, or the reverse.** If two keys count as equal, they must have the same hash. In Java, overriding `equals` without `hashCode` breaks this rule.
- **Hashing mutable keys.** If a key changes after it is stored, its hash changes too, and the entry can't be found.
- **Ignoring part of the key.** Hashing only the first few characters makes keys with a shared prefix collide.
- **Negative remainders.** In C and Java, a negative value `% m` can be negative, which isn't a valid index.
