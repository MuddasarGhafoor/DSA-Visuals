> A binary tree where smaller values go left and larger values go right, so searching can skip half the tree at each step.

## What It Is

A **binary search tree** (BST) is a [[Binary Tree Basics|binary tree]] that follows one rule at **every** node:

- Everything in its left subtree is smaller.
- Everything in its right subtree is larger.

```text
        40
       /  \
     20    60
    /  \     \
  10    30    70
```

That rule makes searching fast, just like [[Binary Search]]: at each node, you know which side to take, and you can ignore the other.

## Searching

Start at the root. If the target is smaller, go left. If it is larger, go right. If you reach an empty spot, the value isn't in the tree.

To find 30 in the tree above: 30 is less than 40, so go left. 30 is greater than 20, so go right. Found it.

## Inserting

Search for the value. When you reach an empty spot, that is where it belongs.

### Worked Example: Insert 25

| At | Compare | Decision |
| --- | --- | --- |
| 40 | 25 < 40 | Go left |
| 20 | 25 > 20 | Go right |
| 30 | 25 < 30 | Go left |
| Empty | | Place 25 here |

A new value always becomes a leaf. Existing nodes don't move.

## Deleting

First find the value. What happens next depends on how many children it has.

| The Node Has | What Happens | Why It Is Safe |
| --- | --- | --- |
| No children | Remove it | Nothing depends on it |
| One child | The child moves up into its place | The child is on the correct side of everything above |
| Two children | Replace it with its **inorder successor** | The successor is larger than the left side, and smaller than the rest of the right side |

### Worked Example: Delete 20 (Two Children)

The **inorder successor** is the next larger value: go right once, then as far left as possible. For 20 in the tree above, that is 30.

```text
Before:     40              After:      40
           /  \                        /  \
         20    60                    30    60
        /  \     \                  /        \
      10    30    70              10          70
```

Copy 30 into the node, then delete the old 30, which is a simpler case because a successor never has a left child.

## Code

```python
class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def search(node, value):
    while node and node.value != value:
        node = node.left if value < node.value else node.right
    return node is not None

def insert(node, value):
    if node is None:
        return Node(value)
    if value < node.value:
        node.left = insert(node.left, value)
    elif value > node.value:
        node.right = insert(node.right, value)
    return node                         # duplicates are ignored

def delete(node, value):
    if node is None:
        return None
    if value < node.value:
        node.left = delete(node.left, value)
    elif value > node.value:
        node.right = delete(node.right, value)
    elif node.left is None:
        return node.right               # no children, or only a right child
    elif node.right is None:
        return node.left                # only a left child
    else:
        successor = node.right          # two children
        while successor.left:
            successor = successor.left
        node.value = successor.value
        node.right = delete(node.right, successor.value)
    return node

def inorder(node):
    return inorder(node.left) + [node.value] + inorder(node.right) if node else []

root = None
for value in [40, 20, 60, 10, 30, 70]:
    root = insert(root, value)
print(inorder(root))  # [10, 20, 30, 40, 60, 70]
print(search(root, 30))  # True
root = delete(root, 20)
print(inorder(root))  # [10, 30, 40, 60, 70]
print(search(root, 20))  # False
```

## Sorted Output

An **inorder** traversal visits the left subtree, then the node, then the right subtree. In a BST, that gives the values in sorted order. See [[Tree Traversals]].

## Complexity

Every operation walks one path from the root, so the cost depends on the tree's height `h`.

| Operation | Average, Random Input | Worst Case |
| --- | --- | --- |
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |
| Inorder traversal | O(n) | O(n) |
| Space | O(n) | O(n) |

### The Problem: Shape Depends on Order

The same values can make very different trees.

```text
Insert 20, 10, 30:        Insert 10, 20, 30:

       20                  10
      /  \                   \
    10    30                  20
                                \
                                 30
```

Sorted input makes one long chain, and searching it is `O(n)`, no better than a list. Self-balancing trees such as the [[AVL Tree]] fix this.

## BST vs Other Structures

| | BST, Balanced | Sorted Array | [[Hash Tables\|Hash Table]] |
| --- | --- | --- | --- |
| Search | O(log n) | O(log n) | O(1) average |
| Insert or delete | O(log n) | O(n) | O(1) average |
| Sorted order | O(n) | O(n) | Needs a sort |
| Smallest or largest | O(log n) | O(1) | O(n) |

## Common Mistakes

- **Checking only the immediate children.** The rule covers the whole subtree. A node deep on the left must also be smaller than the root.
- **Forgetting to assign the result.** `insert` returns a node, so you must write `node.left = insert(...)`, or the change is lost.
- **Deleting two-child nodes by moving a child up.** Only a successor or predecessor keeps the order correct.
- **Assuming O(log n) is guaranteed.** It only holds if the tree stays balanced.
