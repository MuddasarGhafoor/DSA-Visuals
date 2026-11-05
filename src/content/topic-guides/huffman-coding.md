> Compressing text by giving shorter binary codes to the characters that appear most often.

## What It Is

Normally each character uses the same number of bits. ASCII uses 8 bits, whether the character is a common `e` or a rare `z`.

**Huffman coding** saves space by giving **short codes to common characters and long codes to rare ones**. It is the same idea as Morse code, where the common letter E is a single dot. It is used in formats such as ZIP, PNG, and JPEG.

## Why Codes Can't Be Ambiguous

With variable-length codes, you have to know where one code ends and the next begins. Suppose `a = 0`, `b = 1`, and `c = 01`. Then `01` could mean `ab` or `c`.

The fix is a **prefix code**: no code is the beginning of another code. Then a decoder can read bits until it matches a code, with no doubt at all.

## How It Works

Huffman builds a binary tree. Characters are leaves. Each left edge means 0, and each right edge means 1. Because characters only appear at leaves, no code can be a prefix of another.

1. Make a node for each character, with its frequency.
2. Take the **two lowest-frequency nodes** from a [[Priority Queue]].
3. Join them under a new parent, whose frequency is their sum.
4. Put the parent back in the queue.
5. Repeat until one node remains. That is the root.

## Worked Example

| Character | a | b | c | d | e | f |
| --- | --- | --- | --- | --- | --- | --- |
| Frequency | 45 | 13 | 12 | 16 | 9 | 5 |

### Building the Tree

| Step | Join the Two Smallest | New Node |
| --- | --- | --- |
| 1 | f (5), e (9) | 14 |
| 2 | c (12), b (13) | 25 |
| 3 | 14, d (16) | 30 |
| 4 | 25, 30 | 55 |
| 5 | a (45), 55 | 100 |

```text
              100
             /   \
          a:45    55
                 /   \
               25     30
              / \    /  \
           c:12 b:13 14  d:16
                    /  \
                  f:5  e:9
```

### The Codes

| Character | Code | Bits | Frequency × Bits |
| --- | --- | --- | --- |
| a | 0 | 1 | 45 |
| c | 100 | 3 | 36 |
| b | 101 | 3 | 39 |
| f | 1100 | 4 | 20 |
| e | 1101 | 4 | 36 |
| d | 111 | 3 | 48 |
| Total | | | **224** |

A fixed code would need 3 bits for 6 characters, so `3 × 100 = 300` bits. Huffman uses 224, which saves about 25%.

## Code

```python
import heapq

def huffman_codes(frequencies):
    # Each heap entry: (frequency, tie breaker, tree). A tree is a character or a (left, right) pair.
    heap = [(freq, i, char) for i, (char, freq) in enumerate(frequencies.items())]
    heapq.heapify(heap)
    counter = len(heap)
    while len(heap) > 1:
        f1, _, left = heapq.heappop(heap)
        f2, _, right = heapq.heappop(heap)
        heapq.heappush(heap, (f1 + f2, counter, (left, right)))
        counter += 1
    codes = {}
    def walk(tree, code):
        if isinstance(tree, tuple):
            walk(tree[0], code + "0")
            walk(tree[1], code + "1")
        else:
            codes[tree] = code or "0"     # a single character still needs a code
    walk(heap[0][2], "")
    return codes

frequencies = {"a": 45, "b": 13, "c": 12, "d": 16, "e": 9, "f": 5}
codes = huffman_codes(frequencies)
print(sum(frequencies[c] * len(codes[c]) for c in frequencies))  # 224
print(len(codes["a"]))  # 1
print(any(a != b and codes[b].startswith(codes[a]) for a in codes for b in codes))  # False
```

## Decoding

Start at the root. Go left on 0, and right on 1. When you reach a leaf, output its character, and go back to the root.

```python
def decode(bits, codes):
    lookup = {code: char for char, code in codes.items()}
    result, current = [], ""
    for bit in bits:
        current += bit
        if current in lookup:
            result.append(lookup[current])
            current = ""
    return "".join(result)

print(decode("0101100", {"a": "0", "b": "101", "c": "100"}))  # abc
```

The decoder must have the same tree or code table, so it is usually stored with the compressed data.

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Building the tree | O(n log n) | n - 1 joins, each using the heap |
| Space | O(n) | The tree, for n distinct characters |
| Encoding a text of length m | O(m) | One lookup per character |

## Why It Is Optimal

The two rarest characters should have the longest codes, and can be siblings at the bottom of the tree. Joining them never hurts. After joining, you have the same problem with one fewer symbol, so the same argument repeats. This is a classic [[Greedy Algorithms|greedy]] proof.

Huffman coding gives the best possible code for coding characters one at a time.

## Common Mistakes

- **Picking the wrong nodes.** Always join the two **smallest** frequencies, including internal nodes, and not only the characters.
- **Comparing trees on a frequency tie.** In Python, a tie would try to compare the trees themselves, which fails. Add a counter, as the code does.
- **Forgetting a single-character text.** The tree would have only a root, so its code would be empty. Handle this case separately.
- **Expecting a unique answer.** Ties can give different trees. All of them have the same total cost.
