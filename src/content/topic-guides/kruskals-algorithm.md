> Building a minimum spanning tree by adding the cheapest edges that form no cycle.

## What It Is

A **minimum spanning tree** (MST) connects all the nodes of a weighted graph with the lowest total edge cost, and no cycles. Imagine connecting several towns with roads, using as little road as possible.

**Kruskal's algorithm** builds it in a [[Greedy Algorithms|greedy]] way. It looks at the edges from cheapest to most expensive, and keeps each one that doesn't create a cycle.

## How It Works

1. Sort all the edges by cost.
2. Start with every node in its own group.
3. For each edge, in sorted order:
   - If its two ends are in different groups, keep the edge and merge the groups.
   - If they are in the same group, skip it, because it would form a cycle.
4. Stop after keeping `V - 1` edges.

A [[Union-Find]] structure tracks the groups, and makes the check very fast.

## Worked Example

```text
     1
  A --- B
  |   / |
  3  2  5
  | /   |
  C --- D
     4
```

The sorted edges are A-B (1), B-C (2), A-C (3), C-D (4), B-D (5).

| Edge | Cost | Groups Before | Decision |
| --- | --- | --- | --- |
| A-B | 1 | {A} {B} {C} {D} | Keep, and merge |
| B-C | 2 | {A, B} {C} {D} | Keep, and merge |
| A-C | 3 | {A, B, C} {D} | Skip: same group, so it would form a cycle |
| C-D | 4 | {A, B, C} {D} | Keep, and merge |

That makes 3 edges, for 4 nodes, so it is done. The total cost is 1 + 2 + 4 = **7**.

## Code

```python
class UnionFind:
    def __init__(self, nodes):
        self.parent = {node: node for node in nodes}

    def find(self, node):
        if self.parent[node] != node:
            self.parent[node] = self.find(self.parent[node])
        return self.parent[node]

    def union(self, a, b):
        root_a, root_b = self.find(a), self.find(b)
        if root_a == root_b:
            return False
        self.parent[root_a] = root_b
        return True

def kruskal(nodes, edges):
    groups = UnionFind(nodes)
    chosen, total = [], 0
    for cost, a, b in sorted(edges):
        if groups.union(a, b):
            chosen.append((a, b))
            total += cost
    return total, chosen

edges = [(1, "A", "B"), (2, "B", "C"), (3, "A", "C"), (4, "C", "D"), (5, "B", "D")]
print(kruskal("ABCD", edges))  # (7, [('A', 'B'), ('B', 'C'), ('C', 'D')])
```

## Why It Works

The reasoning relies on the **cut property**: take any way of splitting the nodes into two sides. The cheapest edge crossing between them is always safe to include in some MST.

When Kruskal's considers an edge joining two groups, it is the cheapest edge leaving each of those groups, since all cheaper edges have already been handled. So by the cut property, it is safe to keep.

## Complexity

| Step | Time |
| --- | --- |
| Sorting the edges | O(E log E) |
| All Union-Find operations | Almost O(E) |
| Total | O(E log E), the same as O(E log V) |
| Space | O(V + E) |

Sorting is the main cost, so if the edges are already sorted, it runs in nearly linear time.

## Kruskal's vs Prim's

| | Kruskal's | [[Prim's Algorithm\|Prim's]] |
| --- | --- | --- |
| Grows | A forest of pieces that merge | One tree, from a starting node |
| Picks | The cheapest edge overall | The cheapest edge touching the tree |
| Uses | Sorting and [[Union-Find]] | A [[Priority Queue]] |
| Best for | Sparse graphs | Dense graphs |
| Disconnected graphs | Gives a minimum spanning forest | Covers only one component |

Both always give a tree with the same minimum total cost. If several edges have equal costs, the trees themselves may differ.

## Worked Example: Clustering

Stopping Kruskal's early gives a useful way to form groups. If you stop when `k` groups are left, you get `k` clusters, with the largest possible gaps between them.

```python
def clusters(nodes, edges, k):
    groups = UnionFind(nodes)
    remaining = len(nodes)
    for cost, a, b in sorted(edges):
        if remaining == k:
            break
        if groups.union(a, b):
            remaining -= 1
    result = {}
    for node in nodes:
        result.setdefault(groups.find(node), []).append(node)
    return sorted(result.values())

edges = [(1, "A", "B"), (1, "C", "D"), (9, "B", "C")]
print(clusters("ABCD", edges, 2))  # [['A', 'B'], ['C', 'D']]
```

## Common Mistakes

- **Using a slow cycle check.** Running a [[DFS]] for each edge makes this `O(V × E)`. Use Union-Find.
- **Forgetting to sort.** Without sorted edges, the result isn't a minimum.
- **Assuming the graph is connected.** If it isn't, you get fewer than `V - 1` edges. Check the count at the end.
- **Confusing it with shortest paths.** An MST minimizes the **total** edge cost. It doesn't give the shortest route between two nodes.
