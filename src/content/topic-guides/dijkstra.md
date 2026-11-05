> Finding the shortest paths from one starting point on a graph with non-negative weights.

## What It Is

**Dijkstra's algorithm** finds the cheapest route from one starting node to every other node, when all edge costs are zero or more. Maps use this kind of search to find routes.

It is a [[Greedy Algorithms|greedy]] algorithm. At each step, it takes the closest node it hasn't finished yet, and its distance becomes final.

## The Key Idea

Keep the best known distance to every node. Then repeat two steps:

1. **Pick** the unfinished node with the smallest distance. It is now final.
2. **Relax** its edges: for each neighbor, check whether going through this node is shorter.

### Why the Closest Node Is Final

Suppose the closest unfinished node is `u`, at distance `d`. Could a shorter way to `u` exist? Any other route must leave the finished nodes through some other unfinished node, which is already at distance `d` or more. Since edges can't be negative, continuing from there can't get below `d`.

That is why negative edges break it.

## Worked Example

Start at A.

```text
      4
  A ------ B
  |      / |
  1    2   1
  |  /     |
  C ------ D
      5
```

| Step | Pick | Updates | Distances: A, B, C, D |
| --- | --- | --- | --- |
| Start | | | 0, ∞, ∞, ∞ |
| 1 | A (0) | B = 4, C = 1 | 0, 4, 1, ∞ |
| 2 | C (1) | B = 1 + 2 = 3, D = 1 + 5 = 6 | 0, 3, 1, 6 |
| 3 | B (3) | D = 3 + 1 = 4 | 0, 3, 1, 4 |
| 4 | D (4) | None | 0, 3, 1, 4 |

The best route to D is A → C → B → D, at a cost of 4.

## Code

A [[Priority Queue]] finds the closest node quickly. When a distance improves, the code adds a new entry and leaves the old one in the queue. The old entry gets skipped when it comes out.

```python
import heapq

def dijkstra(graph, start):
    distance = {node: float("inf") for node in graph}
    distance[start] = 0
    parent = {start: None}
    waiting = [(0, start)]
    while waiting:
        current, node = heapq.heappop(waiting)
        if current > distance[node]:
            continue                       # a stale entry
        for neighbor, weight in graph[node]:
            candidate = current + weight
            if candidate < distance[neighbor]:
                distance[neighbor] = candidate
                parent[neighbor] = node
                heapq.heappush(waiting, (candidate, neighbor))
    return distance, parent

graph = {
    "A": [("B", 4), ("C", 1)],
    "B": [("A", 4), ("C", 2), ("D", 1)],
    "C": [("A", 1), ("B", 2), ("D", 5)],
    "D": [("B", 1), ("C", 5)],
}
distance, parent = dijkstra(graph, "A")
print(distance)  # {'A': 0, 'B': 3, 'C': 1, 'D': 4}
print(parent["D"], parent["B"])  # B C
```

## Complexity

| Way to Find the Closest | Time | Good For |
| --- | --- | --- |
| Scan an array | O(V²) | Dense graphs |
| Binary heap | O((V + E) log V) | Most graphs |

Space is `O(V + E)` with lazy deletion, since old entries wait in the queue.

## Why Negative Edges Break It

```text
A --4--> B
A --5--> C
C --(-3)--> B
```

Dijkstra finalizes B at 4 first, because 4 is smaller than 5. The real shortest route is A → C → B, at a cost of 2, but B is already final. Use [[Bellman-Ford]] for negative edges.

## Dijkstra vs Others

| | [[BFS]] | Dijkstra | [[Bellman-Ford]] | [[A* Search]] |
| --- | --- | --- | --- | --- |
| Edge costs | All equal | Non-negative | Any | Non-negative |
| Time | O(V + E) | O((V + E) log V) | O(V × E) | Often less than Dijkstra |
| Uses a goal estimate | No | No | No | Yes |

If all edges are 0 or 1, [[0-1 BFS]] is faster still.

## Common Mistakes

- **Using it with negative edges.** It may return a wrong answer with no warning.
- **Skipping the stale check.** Without it, old entries redo work, and the time can grow a lot.
- **Stopping too early on a target.** You can stop when the target is **popped**, not when it is first reached, because a shorter route may still show up.
- **Confusing it with Prim's.** Both use a heap. [[Prim's Algorithm]] compares single edge weights, while Dijkstra compares total distance from the start.
