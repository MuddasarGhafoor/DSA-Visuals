> Growing a minimum spanning tree from one node, always adding the cheapest edge that reaches a new node.

## What It Is

A **minimum spanning tree** (MST) connects all the nodes of a weighted graph with the lowest total edge cost, and no cycles.

**Prim's algorithm** grows that tree outward from a single starting node. At each step, it adds the cheapest edge connecting the tree to a node that isn't in it yet.

Think of a town spreading out from one spot: each new road is the cheapest one that reaches a new place.

## How It Works

1. Start with any node in the tree.
2. Look at all the edges from the tree to nodes outside it.
3. Add the cheapest one, along with the new node it reaches.
4. Repeat until every node is in the tree.

A [[Priority Queue]] keeps the waiting edges in order, so finding the cheapest one is fast.

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

Start at A.

| Step | In the Tree | Edges to Choose From | Add |
| --- | --- | --- | --- |
| 1 | A | A-B (1), A-C (3) | A-B (1) |
| 2 | A, B | A-C (3), B-C (2), B-D (5) | B-C (2) |
| 3 | A, B, C | B-D (5), C-D (4) | C-D (4) |
| 4 | A, B, C, D | Done | |

Note that A-C (3) was skipped in the end, since C had already joined. The total cost is 1 + 2 + 4 = **7**, the same as [[Kruskal's Algorithm]] gives.

## Code

As with [[Dijkstra]], when an edge comes out of the queue leading to a node already in the tree, it is just skipped.

```python
import heapq

def prim(graph, start):
    in_tree = {start}
    waiting = [(cost, start, next_node) for next_node, cost in graph[start]]
    heapq.heapify(waiting)
    total, chosen = 0, []
    while waiting and len(in_tree) < len(graph):
        cost, a, b = heapq.heappop(waiting)
        if b in in_tree:
            continue
        in_tree.add(b)
        total += cost
        chosen.append((a, b))
        for next_node, edge_cost in graph[b]:
            if next_node not in in_tree:
                heapq.heappush(waiting, (edge_cost, b, next_node))
    return total, chosen

graph = {
    "A": [("B", 1), ("C", 3)],
    "B": [("A", 1), ("C", 2), ("D", 5)],
    "C": [("A", 3), ("B", 2), ("D", 4)],
    "D": [("B", 5), ("C", 4)],
}
print(prim(graph, "A"))  # (7, [('A', 'B'), ('B', 'C'), ('C', 'D')])
```

## Why It Works

At each step, the tree and the remaining nodes form a **cut**: a split of the nodes into two sides. The **cut property** says that the cheapest edge crossing any cut is always safe to include in some MST. Prim's always adds exactly that edge.

## Complexity

| Way to Find the Cheapest Edge | Time | Good For |
| --- | --- | --- |
| Scan an array | O(V²) | Dense graphs |
| Binary heap | O(E log V) | Sparse graphs |

Space is `O(V + E)`.

### The Dense-Graph Version

If the graph is dense, a heap can be slower than a plain array. Keep a `best_cost` for each node, and scan them all at each step. For an adjacency matrix, this version is simple and fast.

```python
def prim_dense(matrix):
    n = len(matrix)
    best = [float("inf")] * n
    best[0] = 0
    in_tree = [False] * n
    total = 0
    for _ in range(n):
        node = min((i for i in range(n) if not in_tree[i]), key=lambda i: best[i])
        in_tree[node] = True
        total += best[node]
        for other in range(n):
            if not in_tree[other] and 0 < matrix[node][other] < best[other]:
                best[other] = matrix[node][other]
    return total

matrix = [
    [0, 1, 3, 0],
    [1, 0, 2, 5],
    [3, 2, 0, 4],
    [0, 5, 4, 0],
]
print(prim_dense(matrix))  # 7
```

## Prim's vs Dijkstra's

The code is nearly identical, and that can be confusing. The difference lies in what is compared:

| | Prim's | [[Dijkstra]] |
| --- | --- | --- |
| Finds | A cheapest tree connecting everything | Shortest paths from one node |
| Key for a node | The cost of **one edge** into it | The **total distance** from the start |
| Result depends on the start | Same total cost for any start | Yes |

## Prim's vs Kruskal's

| | Prim's | [[Kruskal's Algorithm\|Kruskal's]] |
| --- | --- | --- |
| Grows | One connected tree | Separate pieces that merge |
| Needs | A [[Priority Queue]] | Sorting and [[Union-Find]] |
| Best for | Dense graphs | Sparse graphs |
| Disconnected graphs | Stops at one component | Gives a forest |

## Common Mistakes

- **Using total distance as the key.** That is Dijkstra, and it doesn't give an MST.
- **Not skipping nodes already in the tree.** Without the check, the result would contain cycles.
- **Using it with directed graphs.** MSTs are defined for undirected graphs. Each edge must appear in both directions in the adjacency list.
- **Assuming the graph is connected.** If it isn't, the tree stops short, so check how many nodes were reached.
