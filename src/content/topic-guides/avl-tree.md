> A binary search tree that stays short, by rotating whenever one side gets too tall.

## What It Is

A plain [[Binary Search Tree]] can turn into one long chain, and a chain is as slow to search as a list. An **AVL tree** prevents that. After every insert and delete, it checks whether the tree has become lopsided, and fixes it with small rearrangements called **rotations**.

Named after its inventors, Adelson-Velsky and Landis, it was the first self-balancing binary search tree.

## Height and Balance

Every node stores its **height**: how many levels it and everything below it take up. An empty tree has height 0, and a single node has height 1.

Its **balance factor** is the difference between its two sides:

```text
balance = height(left) - height(right)
```

The AVL rule is that every node's balance must be **-1, 0, or +1**. Positive means the left side is taller, and negative means the right side is taller. If a node reaches +2 or -2, it must be fixed.

## Rotations

A **rotation** moves a child up and its parent down. It shortens the taller side, and it keeps the left-to-right sorted order.

```text
Right rotation at 30:

      30                20
     /                 /  \
    20        ->     10    30
   /
  10
```

### The Four Cases

Look at which side is too tall, then which way the extra node leans. A straight line needs one rotation, and a zig-zag needs two.

| Case | Shape | Insert in This Order | The Fix |
| --- | --- | --- | --- |
| Left-Left | Straight, leaning left | 30, 20, 10 | Rotate right at 30 |
| Right-Right | Straight, leaning right | 10, 20, 30 | Rotate left at 10 |
| Left-Right | Zig-zag, left then right | 30, 10, 20 | Rotate left at 10, then right at 30 |
| Right-Left | Zig-zag, right then left | 10, 30, 20 | Rotate right at 30, then left at 10 |

### Worked Example: Left-Right

Insert 30, 10, 20.

```text
Step 1: 20 goes right of 10.    Step 2: Rotate left at 10.    Step 3: Rotate right at 30.

      30  (balance +2)               30                             20
     /                              /                              /  \
    10                             20                            10    30
      \                           /
       20                        10
```

All balances are back to 0, and the values still read 10, 20, 30 from left to right.

## Code

```python
class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None
        self.height = 1

def height(node):
    return node.height if node else 0

def update(node):
    node.height = 1 + max(height(node.left), height(node.right))

def balance(node):
    return height(node.left) - height(node.right)

def rotate_right(node):
    child = node.left
    node.left = child.right
    child.right = node
    update(node)            # the lower node first
    update(child)
    return child

def rotate_left(node):
    child = node.right
    node.right = child.left
    child.left = node
    update(node)
    update(child)
    return child

def rebalance(node):
    update(node)
    if balance(node) > 1:                 # left side too tall
        if balance(node.left) < 0:        # zig-zag: Left-Right
            node.left = rotate_left(node.left)
        return rotate_right(node)
    if balance(node) < -1:                # right side too tall
        if balance(node.right) > 0:       # zig-zag: Right-Left
            node.right = rotate_right(node.right)
        return rotate_left(node)
    return node

def insert(node, value):
    if node is None:
        return Node(value)
    if value < node.value:
        node.left = insert(node.left, value)
    elif value > node.value:
        node.right = insert(node.right, value)
    return rebalance(node)

def inorder(node):
    return inorder(node.left) + [node.value] + inorder(node.right) if node else []

root = None
for value in [10, 20, 30, 40, 50, 60, 70]:
    root = insert(root, value)
print(inorder(root))  # [10, 20, 30, 40, 50, 60, 70]
print(root.value)  # 40
print(root.height)  # 3
```

Sorted input that would make a plain BST 7 levels tall gives a perfectly balanced tree of 3 levels.

## Deleting

Deleting works as in a [[Binary Search Tree]], with a rebalance at each node on the way back up. An insert needs at most one fix (one or two rotations), but a delete can need fixes at several levels, all the way to the root.

## Complexity

| Operation | Time | Why |
| --- | --- | --- |
| Search | O(log n) | The height is always small |
| Insert | O(log n) | Walk down, then rebalance on the way up |
| Delete | O(log n) | The same, with possibly more rotations |
| One rotation | O(1) | Just a few links change |
| Space | O(n) | One node per value |

### How Short It Stays

An AVL tree with `n` values is at most about `1.44 × log₂ n` levels tall. For 1,000,000 values, that is at most about 28 levels. A plain BST could need 1,000,000.

## AVL vs Plain BST

| | Plain BST | AVL Tree |
| --- | --- | --- |
| Search, worst case | O(n) | O(log n) |
| Insert, worst case | O(n) | O(log n) |
| Extra per node | None | A height |
| Code | Simple | More complex |
| Sorted input | A long chain | Stays balanced |

Other self-balancing trees make different tradeoffs. Red-black trees rebalance less often, and allow slightly taller trees.

## Common Mistakes

- **Updating heights in the wrong order.** After a rotation, update the lower node first, because the upper node's height depends on it.
- **Treating a zig-zag as a straight line.** A single rotation on a Left-Right case only moves the problem. Check the child's balance.
- **Forgetting the moved subtree.** In a right rotation, the child's right subtree must become the old parent's left subtree.
- **Rebalancing only at the bottom.** Every node on the path back to the root must be checked.
