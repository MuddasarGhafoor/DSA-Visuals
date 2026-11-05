> Text as a sequence of characters, with common operations such as slicing, reversing, and comparing.

## What It Is

A **string** is a sequence of characters. In memory it is usually an [[Arrays|array]] of numbers, where each number stands for a character.

```text
index:     0    1    2    3    4
          'h'  'e'  'l'  'l'  'o'
codes:    104  101  108  108  111
```

The mapping from characters to numbers is called an **encoding**. ASCII covers English letters and symbols in 7 bits. **Unicode** covers every language and emoji, and is usually stored as UTF-8, where one character can take 1 to 4 bytes.

## Mutable and Immutable

A key design choice is whether a string can be changed after it is created.

| Language | Strings Are | What Happens on `s[0] = 'H'` |
| --- | --- | --- |
| Python, Java, JavaScript | Immutable | Not allowed. You must build a new string. |
| C, C++ | Mutable | Changes it in place |

### The Hidden Cost

Because immutable strings can't change, `s = s + "x"` copies the whole string each time. In a loop, that adds up.

```python
def build_slow(n):
    text = ""
    for _ in range(n):
        text += "x"         # may copy all of text each time: O(n²) in total
    return text

def build_fast(n):
    pieces = []
    for _ in range(n):
        pieces.append("x")  # O(1) amortized
    return "".join(pieces)  # one copy at the end: O(n) in total

print(build_slow(3))  # xxx
print(build_fast(3))  # xxx
```

Building with a list and joining at the end is the standard fix. Java has `StringBuilder` for the same reason.

## Common Operations

| Operation | Cost | Notes |
| --- | --- | --- |
| Read a character by index | O(1) | With a fixed-width encoding |
| Length | O(1) | O(n) in C, which must find the terminator |
| Compare two strings | O(n) | Stops at the first difference |
| Slice or substring | O(k) | Copies k characters in most languages |
| Concatenate | O(n + m) | Creates a new string |
| Search for a pattern | O(n × m) | Faster with [[KMP]] or [[Rabin-Karp]] |

## Worked Examples

### Checking for a Palindrome

A palindrome reads the same in both directions. Compare from both ends, moving inward.

```python
def is_palindrome(text):
    low, high = 0, len(text) - 1
    while low < high:
        if text[low] != text[high]:
            return False
        low += 1
        high -= 1
    return True

print(is_palindrome("racecar"))  # True
print(is_palindrome("hello"))  # False
```

### Checking for an Anagram

Two words are anagrams if they use the same letters the same number of times. Count them with an array of 26 slots, using each character's code to find its slot.

```python
def is_anagram(a, b):
    if len(a) != len(b):
        return False
    counts = [0] * 26
    for x, y in zip(a, b):
        counts[ord(x) - ord("a")] += 1
        counts[ord(y) - ord("a")] -= 1
    return all(count == 0 for count in counts)

print(is_anagram("listen", "silent"))  # True
print(is_anagram("hello", "world"))  # False
```

This takes `O(n)` time and `O(1)` space, because the count array has a fixed size. Sorting both words would also work, but costs `O(n log n)`.

## How Comparison Works

Strings compare character by character, using their codes. This has some surprises:

- `"Zebra" < "apple"` is true, because capital letters have lower codes in ASCII.
- `"10" < "9"` is true, because `'1'` comes before `'9'`.
- `"app" < "apple"` is true, because a prefix comes first.

## Common Mistakes

- **Building strings with `+` in a loop.** This can turn `O(n)` work into `O(n²)`.
- **Assuming one character is one byte.** In UTF-8, `"é"` takes 2 bytes, and many emoji take 4.
- **Comparing with the wrong operator.** In Java, `==` compares references, so use `.equals()`. In C, use `strcmp`.
- **Comparing numbers as text.** Convert them to numbers first, or `"10"` sorts before `"9"`.
- **Forgetting that case matters.** `"Hello"` and `"hello"` are different strings, so convert both first if case shouldn't count.
