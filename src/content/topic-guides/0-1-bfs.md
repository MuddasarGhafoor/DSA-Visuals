> Finding shortest paths when every edge costs 0 or 1, in linear time, using a deque.

## What It Is

[[BFS]] finds shortest paths when all edges cost the same. [[Dijkstra]] handles any non-negative costs, but needs a heap, which costs an extra `log V`. **0-1 BFS** sits between them: it handles graphs where every edge costs **0 or 1**, and it runs in `O(V + E)`, the same as plain BFS.

These graphs come up more often than you might expect. For example: moving through a grid where walking through open cells is free, but breaking a wall costs 1.

## The Key Idea

Dijkstra always processes the closest unfinished node next. With only 0 and 1 edges, the waiting nodes never differ by more than 1 in distance. So you don't need a heap to keep them in order. A [[Deque]] is enough:

- An edge of cost **0** leads to a node at the **same** distance, so it goes to the **front**.
- An edge of cost **1** leads to a node one further away, so it goes to the **back**.

The deque always stays sorted by distance, with no extra work.

## How It Works

1. Set every distance to infinity, except the start, which is 0. Put the start in the deque.
2. Take the node from the front.
3. For each edge from that node, if it gives a shorter distance, update it. Then add the neighbor to the front (cost 0) or the back (cost 1).
4. Repeat until the deque is empty.

## Worked Example

```text
A --0-- B --1-- C
|               |
1               0
|               |
D ------1------ E
```

Start at A.

| Step | Take | Updates | Deque After |
| --- | --- | --- | --- |
| 1 | A (0) | B = 0, D = 1 | B, D |
| 2 | B (0) | C = 1 | D, C |
| 3 | D (1) | E = 2 | C, E |
| 4 | C (1) | E = 1, which goes to the front | E, E |
| 5 | E (1) | Nothing shorter | E |
| 6 | E (stale) | Nothing shorter | Empty |

The final distances are A = 0, B = 0, C = 1, D = 1, E = 1.

## Code

```python
from collections import deque

def zero_one_bfs(graph, start):
    distance = {node: float("inf") for node in graph}
    distance[start] = 0
    waiting = deque([start])
    while waiting:
        node = waiting.popleft()
        for neighbor, cost in graph[node]:
            if distance[node] + cost < distance[neighbor]:
                distance[neighbor] = distance[node] + cost
                if cost == 0:
                    waiting.appendleft(neighbor)
                else:
                    waiting.append(neighbor)
    return distance

graph = {
    "A": [("B", 0), ("D", 1)],
    "B": [("A", 0), ("C", 1)],
    "C": [("B", 1), ("E", 0)],
    "D": [("A", 1), ("E", 1)],
    "E": [("C", 0), ("D", 1)],
}
print(zero_one_bfs(graph, "A"))  # {'A': 0, 'B': 0, 'C': 1, 'D': 1, 'E': 1}
```

A node can enter the deque more than once, as E does above. That is fine: the later copy finds nothing shorter, and does nothing.

## Complexity

| Measure | 0-1 BFS | [[Dijkstra]] |
| --- | --- | --- |
| Time | O(V + E) | O((V + E) log V) |
| Space | O(V) | O(V) |
| Edge costs | Only 0 and 1 | Any non-negative cost |

Each edge can only improve a node a small number of times, so the total stays linear.

## Where It Is Used

- **Fewest walls to break** in a grid.
- **Fewest edges to reverse** to connect two nodes: following an edge forward costs 0, and going against it costs 1.
- **Fewest changes,** such as bus transfers, where staying on a bus is free and switching costs 1.

## Common Mistakes

- **Pushing cost-0 neighbors to the back.** That breaks the sorted order, and can give wrong answers or extra work.
- **Marking nodes as visited when added.** A node may be reached later at a lower cost. Only skip it if the new distance isn't shorter.
- **Using it with other costs.** With an edge cost of 2, the deque no longer stays sorted. Use [[Dijkstra]].
