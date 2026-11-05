> A forest of binomial trees, which makes merging two heaps fast.

## What It Is

A normal binary [[Heaps|heap]] is great at finding the smallest value, but merging two of them takes `O(n)`. A **binomial heap** can merge two heaps in `O(log n)`.

It does this by storing its values in a small collection of special trees, called **binomial trees**.

## Binomial Trees

Binomial trees are built by a simple rule. `B0` is a single node. `Bk` is made by joining two copies of `B(k-1)`, with one root becoming the first child of the other.

```text
B0:   o      B1:   o      B2:     o         B3:        o
                   |             /|                  / | \
                   o            o o                 o  o  o
                                |                  /|  |
                                o                 o o  o
                                                  |
                                                  o
```

A tree `Bk` has these properties:

| Property | Value | For B3 |
| --- | --- | --- |
| Number of nodes | 2^k | 8 |
| Height, in edges | k | 3 |
| Children of the root | k | 3 |
| Nodes at depth d | C(k, d), hence the name | 1, 3, 3, 1 |

## The Heap

A **binomial heap** is a list of binomial trees that follows two rules:

1. **Heap order.** In each tree, every node is smaller than or equal to its children. So each root is the smallest value in its tree.
2. **At most one of each size.** There is at most one `B0`, one `B1`, one `B2`, and so on.

### It Matches Binary Numbers

Rule 2 means a heap's trees match the binary digits of its size. A heap of 13 values, which is `1101` in binary, has exactly one `B3`, one `B2`, and one `B0`.

```text
13 = 8 + 4 + 1   ->   B3 + B2 + B0
```

So a heap of `n` values has at most `log₂ n + 1` trees.

## Merging: Like Binary Addition

Merging two heaps works just like adding two binary numbers.

Go through the tree sizes from smallest to largest. If you end up with two trees of the same size, **link** them: the root with the larger value becomes a child of the other. That makes one tree of the next size up, which is like carrying a 1.

### Worked Example

Merge a heap of 3 values (`B1 + B0`) with a heap of 1 value (`B0`). In binary, that is `11 + 1 = 100`.

| Size | Trees Present | Action | Carry |
| --- | --- | --- | --- |
| B0 | B0, B0 | Link them | B1 |
| B1 | B1, carried B1 | Link them | B2 |
| B2 | Carried B2 | Keep it | None |

The result is a single `B2` with 4 values, matching binary `100`.

Linking takes `O(1)`, and there are `O(log n)` sizes, so merging takes `O(log n)`.

## Everything Else Uses Merge

| Operation | How It Works | Time |
| --- | --- | --- |
| Insert | Make a one-value heap, and merge it in | O(log n), and O(1) amortized |
| Find the smallest | Check each root | O(log n) |
| Remove the smallest | Remove that root. Its children form a new heap, so merge that back in | O(log n) |
| Merge two heaps | As above | O(log n) |

## Code

Each tree is stored as a node with a list of children. The heap keeps its roots sorted by size.

```python
class Tree:
    def __init__(self, value):
        self.value = value
        self.children = []         # always ordered from largest to smallest
        self.order = 0             # k, for a tree Bk

def link(a, b):
    # Joins two trees of the same size, keeping the smaller value on top.
    if b.value < a.value:
        a, b = b, a
    a.children.insert(0, b)
    a.order += 1
    return a

def merge(left, right):
    # Both lists are sorted by order. This works like adding binary numbers.
    trees = sorted(left + right, key=lambda tree: tree.order)
    result = []
    for tree in trees:
        while result and result[-1].order == tree.order:
            tree = link(result.pop(), tree)
        result.append(tree)
    return result

def insert(heap, value):
    return merge(heap, [Tree(value)])

def extract_min(heap):
    smallest = min(heap, key=lambda tree: tree.value)
    heap = [tree for tree in heap if tree is not smallest]
    return smallest.value, merge(heap, list(reversed(smallest.children)))

heap = []
for value in [5, 3, 8, 1, 9, 2]:
    heap = insert(heap, value)
print([tree.order for tree in heap])  # [1, 2]
result = []
while heap:
    value, heap = extract_min(heap)
    result.append(value)
print(result)  # [1, 2, 3, 5, 8, 9]
```

Six values is `110` in binary, which is one `B2` and one `B1`, so the orders come out as `[1, 2]`.

## Compared to a Binary Heap

| Operation | Binary Heap | Binomial Heap |
| --- | --- | --- |
| Find the smallest | O(1) | O(log n) |
| Insert | O(log n) | O(1) amortized |
| Remove the smallest | O(log n) | O(log n) |
| Merge two heaps | O(n) | O(log n) |
| Fits in a plain array | Yes | No |

Use a binary heap unless you need to merge often. It is simpler, and it is faster in practice.

## Common Mistakes

- **Keeping two trees of the same size.** That breaks rule 2. Keep linking until all sizes are different, as with a carry that continues.
- **Linking the wrong way round.** The larger root must become the child, to keep heap order.
- **Forgetting the order of the children.** The children of a removed root must be put back in increasing size before merging.
