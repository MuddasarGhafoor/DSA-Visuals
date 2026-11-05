> Tracking which items belong to the same group, with merges and lookups that are almost instant.

## What It Is

**Union-Find**, also called a **disjoint set**, tracks a collection of items split into separate groups. It answers one question and does one job, both very quickly:

- **Find:** which group is this item in? Two items are in the same group if they have the same answer.
- **Union:** merge these two groups into one.

Imagine friend groups at a university. When two people from different groups become friends, the two groups merge. You often need to ask: are these two people connected?

## How It Works

Each group is stored as a tree, using just a parent list. See [[Tree Representations]]. The **root** of the tree names the group.

```text
parent:  index  0  1  2  3  4
         value  0  0  1  3  3

Groups:    0          3
           |          |
           1          4
           |
           2
```

- **Find** walks up the parents until it reaches a root.
- **Union** finds both roots, and points one at the other.

## Two Key Speedups

Without care, the trees can become long chains, and `find` can take `O(n)`. Two small tricks fix this completely.

### Path Compression

During a `find`, point every node you pass directly at the root. The next lookup is then almost immediate.

```text
Before find(2):   0 <- 1 <- 2

After find(2):    0 <- 1
                  ^
                  +--- 2
```

### Union by Size

Attach the smaller tree under the larger one. This keeps the trees short, because a node's depth only grows when its group at least doubles in size.

## Code

```python
class UnionFind:
    def __init__(self, count):
        self.parent = list(range(count))
        self.size = [1] * count
        self.groups = count

    def find(self, node):
        if self.parent[node] != node:
            self.parent[node] = self.find(self.parent[node])     # path compression
        return self.parent[node]

    def union(self, a, b):
        root_a, root_b = self.find(a), self.find(b)
        if root_a == root_b:
            return False                                         # already together
        if self.size[root_a] < self.size[root_b]:
            root_a, root_b = root_b, root_a
        self.parent[root_b] = root_a                             # union by size
        self.size[root_a] += self.size[root_b]
        self.groups -= 1
        return True

    def connected(self, a, b):
        return self.find(a) == self.find(b)

people = UnionFind(5)
people.union(0, 1)
people.union(1, 2)
people.union(3, 4)
print(people.connected(0, 2))  # True
print(people.connected(0, 3))  # False
print(people.groups)  # 2
print(people.union(0, 2))  # False
```

## Worked Example

Start with 5 separate items.

| Operation | Groups After | Note |
| --- | --- | --- |
| union(0, 1) | {0, 1} {2} {3} {4} | |
| union(1, 2) | {0, 1, 2} {3} {4} | 2 joins the larger tree |
| union(3, 4) | {0, 1, 2} {3, 4} | |
| connected(0, 2) | | Same root, so true |
| connected(0, 3) | | Different roots, so false |
| union(0, 2) | | Same root already, so nothing changes |

## Complexity

| Version | Each Operation |
| --- | --- |
| No speedups | O(n) in the worst case |
| Path compression or union by size alone | O(log n) amortized |
| Both | O(α(n)) amortized |

`α(n)` is the **inverse Ackermann function**, which grows unbelievably slowly. It is at most 4 for any number of items that could ever fit in a computer, so in practice each operation is constant time.

Space is `O(n)`.

## Worked Example: Finding a Cycle

For an undirected graph, process each edge. If both ends are already in the same group, the edge closes a cycle.

```python
def has_cycle(node_count, edges):
    groups = UnionFind(node_count)
    for a, b in edges:
        if not groups.union(a, b):
            return True
    return False

print(has_cycle(3, [(0, 1), (1, 2), (2, 0)]))  # True
print(has_cycle(4, [(0, 1), (1, 2), (2, 3)]))  # False
```

## Where It Is Used

- **[[Kruskal's Algorithm]],** to check whether an edge would form a cycle.
- **Connected components** when edges arrive one at a time. [[BFS]] would need to start over each time.
- **Image processing,** to label connected regions of pixels.
- **Percolation and network connectivity** studies.

## What It Can't Do

- **Undo a union,** at least not simply. Merging is one-way.
- **List a group's members** without an extra structure.
- **Split a group** in two.

## Common Mistakes

- **Comparing parents instead of roots.** Two nodes in the same group can have different parents. Always compare `find(a)` and `find(b)`.
- **Linking the nodes, not the roots.** `parent[a] = b` can break the structure. Link the two roots.
- **Forgetting the speedups.** Without them, a long chain makes every operation slow.
- **Deep recursion in `find`.** On very long chains, before compression, recursion can overflow. Union by size keeps depth at `O(log n)`, which prevents this.
