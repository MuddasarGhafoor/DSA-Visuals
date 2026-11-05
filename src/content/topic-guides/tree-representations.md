> Ways to store a tree in memory: linked nodes, an array, a parent list, or child and sibling links.

## What It Is

A tree is a picture in your head, and memory is just a long row of slots. A **tree representation** is the way you turn one into the other.

The right choice depends on what the tree looks like, and which questions you need to answer quickly.

## Linked Nodes

Each node is an object that holds its value and links to its children. This is the most common approach for binary trees.

```python
class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

root = Node(1, Node(2, Node(4)), Node(3))
print(root.left.left.value)  # 4
```

- **Good:** it can take any shape, and it is easy to insert and rearrange.
- **Not so good:** each node carries extra links, and finding a parent is hard unless you add a parent link.

For a tree where a node can have any number of children, store a list of children instead.

## Array Layout

A complete tree can be stored in an array with no links at all. Lay it out level by level.

```text
Tree:         1
            /   \
           2     3
          / \   /
         4   5 6

Array:   index  0  1  2  3  4  5
         value  1  2  3  4  5  6
```

The positions follow a formula, so the links are implied:

| Find | Starting at Index 0 | Starting at Index 1 |
| --- | --- | --- |
| Left child of i | `2i + 1` | `2i` |
| Right child of i | `2i + 2` | `2i + 1` |
| Parent of i | `(i - 1) // 2` | `i // 2` |

```python
tree = [1, 2, 3, 4, 5, 6]

def children(i):
    return [tree[c] for c in (2 * i + 1, 2 * i + 2) if c < len(tree)]

print(children(1))  # [4, 5]
print(tree[(5 - 1) // 2])  # 3
```

- **Good:** there is no memory for links, it is fast to read, and neighbors sit together in memory. This is how [[Heaps]] are stored.
- **Not so good:** gaps waste space. A chain of height `h` would need `2^h` slots to store `h` values.

## Parent List

For each node, store only its parent, with the root marked by -1. Here, node numbers are the array indexes.

```text
Tree:        0
            / \
           1   2
          /
         3

parent:  index  0   1   2   3
         value  -1  0   0   1
```

```python
parent = [-1, 0, 0, 1]

def path_to_root(node):
    path = []
    while node != -1:
        path.append(node)
        node = parent[node]
    return path

print(path_to_root(3))  # [3, 1, 0]
```

- **Good:** it is very compact, and walking up is easy. It suits questions like "who is above this?". [[Union-Find]] is built on this.
- **Not so good:** finding a node's children means scanning the whole list.

## First Child, Next Sibling

A node with many children could need a lot of links. Instead, each node stores just two: its **first child** and its **next sibling**. This turns any tree into a binary-shaped one.

```text
General tree:         As child and sibling links:
      A                    A
    / | \                  |
   B  C  D                 B -> C -> D
  / \                      |
 E   F                     E -> F
```

```python
class TreeNode:
    def __init__(self, value):
        self.value = value
        self.first_child = None
        self.next_sibling = None

def children_of(node):
    result = []
    child = node.first_child
    while child:
        result.append(child.value)
        child = child.next_sibling
    return result

a, b, c = TreeNode("A"), TreeNode("B"), TreeNode("C")
a.first_child = b
b.next_sibling = c
print(children_of(a))  # ['B', 'C']
```

- **Good:** every node has the same fixed size, however many children it has.
- **Not so good:** reaching the 10th child takes 10 steps.

## Adjacency List

A tree is a special kind of graph, so you can store it as one. Each node lists its neighbors. This is common in contests and graph problems, where a tree arrives as a list of edges. See [[Adjacency List vs Matrix]].

```python
edges = [(0, 1), (0, 2), (1, 3)]
neighbors = {}
for a, b in edges:
    neighbors.setdefault(a, []).append(b)
    neighbors.setdefault(b, []).append(a)
print(neighbors[1])  # [0, 3]
```

## How to Choose

| Representation | Space | Children | Parent | Best For |
| --- | --- | --- | --- | --- |
| Linked nodes | O(n) | O(1) | Needs extra link | [[Binary Search Tree\|Search trees]] |
| Array | O(2^h) | O(1) | O(1) | [[Heaps]] and complete trees |
| Parent list | O(n) | O(n) | O(1) | [[Union-Find]] |
| Child and sibling | O(n) | O(children) | Needs extra link | Trees with many children |
| Adjacency list | O(n) | O(children) | Needs a walk first | Graph-style problems |

## Common Mistakes

- **Using an array for an unbalanced tree.** The array size grows with the height, so gaps can use huge amounts of memory.
- **Mixing up the index formulas.** The formulas for arrays starting at 0 and at 1 differ. Pick one.
- **Walking back to the parent in an adjacency list.** Since edges go both ways, a traversal must remember where it came from.
