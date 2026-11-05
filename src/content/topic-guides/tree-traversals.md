> The ways to visit every node of a tree: inorder, preorder, postorder, and level by level.

## What It Is

A **traversal** visits every node of a tree exactly once. A list has one obvious order, but a tree has several, and each is useful for different jobs.

There are two families:

- **Depth-first:** go all the way down one branch before trying the next. Inorder, preorder, and postorder are all depth-first. See [[DFS]].
- **Breadth-first:** visit one whole level at a time. This is called level-order. See [[BFS]].

## The Three Depth-First Orders

The only difference is **when you visit the node itself**, compared with its subtrees. The left subtree always goes before the right.

| Traversal | Order at Each Node | Memory Trick |
| --- | --- | --- |
| Preorder | **Node**, left, right | Node comes first |
| Inorder | Left, **node**, right | Node is in the middle |
| Postorder | Left, right, **node** | Node comes last |

## Worked Example

```text
        40
       /  \
     20    60
    /  \
  10    30
```

| Traversal | Visit Order | Useful For |
| --- | --- | --- |
| Preorder | 40, 20, 10, 30, 60 | Copying a tree, since parents come before children |
| Inorder | 10, 20, 30, 40, 60 | Getting a [[Binary Search Tree]] in sorted order |
| Postorder | 10, 30, 20, 60, 40 | Deleting a tree or evaluating it, since children come before parents |
| Level-order | 40, 20, 60, 10, 30 | Going through a tree by distance from the root |

### Tracing Inorder

At 40, go left first. At 20, go left first. At 10, there is nothing on the left, so visit 10. Back at 20, visit 20, then go right and visit 30. Back at 40, visit 40. Then go right and visit 60.

## Code

```python
from collections import deque

class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

def preorder(node):
    return [node.value] + preorder(node.left) + preorder(node.right) if node else []

def inorder(node):
    return inorder(node.left) + [node.value] + inorder(node.right) if node else []

def postorder(node):
    return postorder(node.left) + postorder(node.right) + [node.value] if node else []

def level_order(root):
    result = []
    queue = deque([root] if root else [])
    while queue:
        node = queue.popleft()
        result.append(node.value)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return result

tree = Node(40, Node(20, Node(10), Node(30)), Node(60))
print(preorder(tree))  # [40, 20, 10, 30, 60]
print(inorder(tree))  # [10, 20, 30, 40, 60]
print(postorder(tree))  # [10, 30, 20, 60, 40]
print(level_order(tree))  # [40, 20, 60, 10, 30]
```

## Without Recursion

Recursion uses the call stack, so you can replace it with your own [[Stack]]. This avoids running out of stack on a very deep tree.

Here is inorder: go left as far as possible, pushing nodes as you go. Then pop a node, visit it, and go right.

```python
def inorder_loop(root):
    result, stack = [], []
    node = root
    while node or stack:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        result.append(node.value)
        node = node.right
    return result

print(inorder_loop(Node(2, Node(1), Node(3))))  # [1, 2, 3]
```

## Complexity

| Traversal | Time | Space |
| --- | --- | --- |
| Depth-first, recursive or with a stack | O(n) | O(h), the height of the tree |
| Level-order, with a queue | O(n) | O(w), the widest level |

Every node is visited once, so the time is always `O(n)`. The difference is in space. A balanced tree has `h` close to `log n`, while its widest level holds about `n / 2` nodes, so depth-first uses less memory there.

## Rebuilding a Tree

Can you rebuild a tree from its traversal? One order isn't enough, because different trees can share it. But **inorder plus preorder** does identify a tree with unique values: the first preorder value is the root, and its position in the inorder list splits the left side from the right.

## The Link to Expressions

In an [[Expression Tree]], each traversal gives a different notation:

| Traversal | Gives You | For (2 + 3) × 4 |
| --- | --- | --- |
| Preorder | Prefix | `× + 2 3 4` |
| Inorder | Infix | `2 + 3 × 4`, once parentheses are added back |
| Postorder | Postfix | `2 3 + 4 ×` |

## Common Mistakes

- **Forgetting the empty case.** The recursion must stop at `None`, or it crashes at every leaf.
- **Expecting inorder to sort any tree.** It only sorts a [[Binary Search Tree]].
- **Using inorder on a tree with more than two children.** "In the middle" has no clear meaning there. Preorder and postorder still work.
- **Using level-order with a stack.** A stack gives a depth-first order. Level-order needs a [[Queue]].
