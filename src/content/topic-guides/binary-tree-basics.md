> Nodes, children, levels, and height, plus the shapes a binary tree can take.

## What It Is

A **tree** stores data in a hierarchy, like a family tree or the folders on a computer. A **binary tree** is a tree where each node has at most two children, called the **left child** and the **right child**.

```text
          A          <- the root
         / \
        B   C
       / \    \
      D   E    F     <- D, E, and F are leaves
```

## The Words You Need

| Term | Meaning | In the Picture |
| --- | --- | --- |
| Node | One item in the tree | A, B, C, ... |
| Root | The node at the top, which has no parent | A |
| Edge | The link between a parent and a child | A to B |
| Parent | The node directly above | B is D's parent |
| Child | A node directly below | D and E are B's children |
| Siblings | Nodes with the same parent | D and E |
| Leaf | A node with no children | D, E, F |
| Internal node | A node with at least one child | A, B, C |
| Subtree | A node and everything below it | B, D, and E |
| Depth | Number of edges from the root down to a node | D has depth 2 |
| Height | Number of levels from a node to its lowest leaf | A has height 3 |

> Books define height in two ways: by counting nodes or counting edges. Here, it counts nodes, so an empty tree has height 0 and a single node has height 1. This matches the simulators. Many books would call a single node height 0.

## The Shapes It Can Take

### Full

Every node has either 0 or 2 children, never 1.

### Perfect

All internal nodes have 2 children, and all leaves are at the same level. Every level is completely filled.

### Complete

Every level is full, except possibly the last, which fills from the left. [[Heaps]] have this shape, which lets them live in an array.

### Balanced

For every node, the heights of the two sides differ by only a small amount. This keeps the tree short. An [[AVL Tree]] allows a difference of at most 1.

### Degenerate

Every node has only one child, so the tree is really a [[Linked Lists|linked list]], and it loses all its speed.

```text
Perfect:        Complete:       Degenerate:
    1               1           1
   / \             / \           \
  2   3           2   3           2
 / \ / \         / \               \
4  5 6  7       4   5               3
```

## Useful Facts

| Fact | Formula | For Height 3 |
| --- | --- | --- |
| Most nodes on level i, counting from 0 | 2^i | Level 2 has 4 |
| Most nodes in a tree of height h | 2^h - 1 | 7 |
| Fewest nodes in a tree of height h | h | 3 |
| Smallest height for n nodes | ⌈log₂(n + 1)⌉ | 7 nodes need height 3 |
| Largest height for n nodes | n | A chain |
| Leaves in a full tree | internal nodes + 1 | |

The most important line is the smallest height. With a million nodes, a well-shaped tree needs only 20 levels. That is why balanced trees are so fast.

## Code

Most tree code is recursive, because each subtree is itself a tree.

```python
class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

def size(node):
    if node is None:
        return 0
    return 1 + size(node.left) + size(node.right)

def height(node):
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))

def count_leaves(node):
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return count_leaves(node.left) + count_leaves(node.right)

tree = Node("A", Node("B", Node("D"), Node("E")), Node("C", None, Node("F")))
print(size(tree))  # 6
print(height(tree))  # 3
print(count_leaves(tree))  # 3
```

Each function follows the same pattern: handle the empty tree, then combine the answers from the two subtrees. Each one visits every node once, so each takes `O(n)` time and `O(h)` stack space.

## Where Trees Are Used

- **[[Binary Search Tree|Binary search trees]],** for keeping data sorted and searchable.
- **[[Heaps]],** for quickly finding the smallest or largest value.
- **[[Expression Tree|Expression trees]],** for representing calculations.
- **[[Huffman Coding]] trees,** for compressing data.

## Common Mistakes

- **Mixing up depth and height.** Depth counts down from the root. Height counts down to the lowest leaf.
- **Forgetting the height convention.** Check whether a book counts nodes or edges, since answers differ by one.
- **Assuming every binary tree is a BST.** A binary tree only limits the number of children. The ordering rule is extra.
- **Forgetting the empty case.** Recursive code must handle `None`, or it crashes on the first leaf.
