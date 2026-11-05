> Finding the shortest paths even with negative edge weights, and detecting negative cycles.

## What It Is

[[Dijkstra]] is fast, but it fails when an edge has a negative weight. **Bellman-Ford** finds the shortest paths from one starting node even when weights are negative, and it can also tell you when no shortest path exists.

Negative weights appear in real problems. In a currency exchange graph, a good trade can be modeled as a negative cost.

## The Key Idea: Relaxing

**Relaxing** an edge from `u` to `v` asks one question: is going through `u` a shorter way to reach `v`?

```text
if distance[u] + weight < distance[v]:
    distance[v] = distance[u] + weight
```

Bellman-Ford simply relaxes **every edge**, and repeats this `V - 1` times.

### Why V - 1 Rounds

A shortest path can't repeat a node, so it uses at most `V - 1` edges. After round 1, all shortest paths with 1 edge are correct. After round 2, all those with up to 2 edges are correct. After `V - 1` rounds, every shortest path is correct.

## Negative Cycles

A **negative cycle** is a loop whose total weight is below zero. Going around it lowers the cost forever, so no shortest path exists.

After `V - 1` rounds, everything should be final. So do one more round: **if any edge can still be relaxed, there is a negative cycle.**

## Worked Example

Start at A, with these edges: A→B (4), A→C (5), C→B (-3), B→D (2).

```text
      4
  A -----> B ---2---> D
  |        ^
  5        | -3
  v        |
  C -------+
```

Relaxing the edges in the order listed:

| Round | A→B | A→C | C→B | B→D | Distances: A, B, C, D |
| --- | --- | --- | --- | --- | --- |
| Start | | | | | 0, ∞, ∞, ∞ |
| 1 | B = 4 | C = 5 | B = 2 | D = 4 | 0, 2, 5, 4 |
| 2 | | | | | 0, 2, 5, 4 |

Round 2 changed nothing, so it can stop early. Notice that the best path to B goes through C, and it looks longer at first. Dijkstra would have finalized B at 4 too soon.

## Code

```python
def bellman_ford(nodes, edges, start):
    distance = {node: float("inf") for node in nodes}
    distance[start] = 0
    for _ in range(len(nodes) - 1):
        changed = False
        for u, v, weight in edges:
            if distance[u] + weight < distance[v]:
                distance[v] = distance[u] + weight
                changed = True
        if not changed:
            break                     # nothing moved, so nothing will
    for u, v, weight in edges:
        if distance[u] + weight < distance[v]:
            return None               # a negative cycle
    return distance

edges = [("A", "B", 4), ("A", "C", 5), ("C", "B", -3), ("B", "D", 2)]
print(bellman_ford("ABCD", edges, "A"))  # {'A': 0, 'B': 2, 'C': 5, 'D': 4}

cycle = [("A", "B", 1), ("B", "C", -1), ("C", "A", -1)]
print(bellman_ford("ABC", cycle, "A"))  # None
```

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(V × E) | `V - 1` rounds over `E` edges |
| Space | O(V) | One distance per node |
| Best case, with early exit | O(E) | One round with no changes |

## Bellman-Ford vs Others

| | [[BFS]] | [[Dijkstra]] | Bellman-Ford | [[Floyd-Warshall]] |
| --- | --- | --- | --- | --- |
| Edge weights | Equal | Non-negative | Any | Any |
| Starting points | One | One | One | All pairs |
| Detects negative cycles | No | No | Yes | Yes |
| Time | O(V + E) | O((V + E) log V) | O(V × E) | O(V³) |

Dijkstra is much faster, so use Bellman-Ford only when you may have negative edges.

## Where It Is Used

- **Currency arbitrage:** a negative cycle means a series of trades that makes a profit.
- **Network routing:** the distance-vector protocol RIP is based on it, since each router only needs to talk to its neighbors.

## Common Mistakes

- **Stopping too soon.** Without the changed check, it must do all `V - 1` rounds. With it, stop only after a full round of no changes.
- **Relaxing from an unreachable node.** `∞ + (-3)` is still infinity in Python, but in other languages a large "infinity" constant can drop. Skip unreachable nodes.
- **An undirected negative edge.** It is a negative cycle by itself, because you can go back and forth across it.
- **Forgetting the detection pass.** Without it, a negative cycle silently gives wrong distances.
