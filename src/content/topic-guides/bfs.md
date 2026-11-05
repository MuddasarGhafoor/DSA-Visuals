> Exploring a graph level by level with a queue, which finds the shortest path when every edge costs the same.

## What It Is

**Breadth-first search** (BFS) visits a graph in rings. It starts at one node, then visits all of its neighbors, then all of their neighbors, and so on. Nothing two steps away is visited until everything one step away is done.

Think of dropping a stone in a pond. The ripple reaches near points first, and spreads outward evenly.

This gives BFS its key property: **it reaches each node by a path with the fewest possible edges.**

## How It Works

BFS uses a [[Queue]], which keeps the nodes in the order they were discovered.

1. Put the start node in the queue, and mark it as visited.
2. Take the node at the front.
3. For each neighbor that hasn't been visited, mark it as visited and add it to the back.
4. Repeat until the queue is empty.

## Worked Example

```text
A --- B --- E
|     |
C --- D --- F
```

Start at A, taking neighbors in alphabetical order.

| Step | Take | Newly Discovered | Queue After | Distances |
| --- | --- | --- | --- | --- |
| 1 | A | B, C | B, C | B = 1, C = 1 |
| 2 | B | D, E | C, D, E | D = 2, E = 2 |
| 3 | C | None | D, E | |
| 4 | D | F | E, F | F = 3 |
| 5 | E | None | F | |
| 6 | F | None | Empty | |

The visit order is A, B, C, D, E, F.

## Code

```python
from collections import deque

def bfs(graph, start):
    distance = {start: 0}
    parent = {start: None}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in distance:     # mark it as soon as it is found
                distance[neighbor] = distance[node] + 1
                parent[neighbor] = node
                queue.append(neighbor)
    return distance, parent

def path_to(parent, node):
    path = []
    while node is not None:
        path.append(node)
        node = parent[node]
    return path[::-1]

graph = {
    "A": ["B", "C"], "B": ["A", "D", "E"], "C": ["A", "D"],
    "D": ["B", "C", "F"], "E": ["B"], "F": ["D"],
}
distance, parent = bfs(graph, "A")
print(distance["F"])  # 3
print(path_to(parent, "F"))  # ['A', 'B', 'D', 'F']
```

Storing each node's parent lets you rebuild the actual path, by following the parents back from the end.

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(V + E) | Each node is taken once, and each edge is looked at once or twice |
| Space | O(V) | The queue and the visited record |

This assumes an adjacency list. With a matrix, it is `O(V²)`. See [[Adjacency List vs Matrix]].

## Why It Gives Shortest Paths

The queue always holds nodes at distance `d`, followed by nodes at distance `d + 1`, and nothing else. So nodes are reached in order of distance, and the first time a node is reached is by a shortest route.

This only holds if every edge costs the same. With different costs, use [[Dijkstra]].

## Where It Is Used

- **Shortest paths** in unweighted graphs, such as the fewest moves in a puzzle or the fewest links between people.
- **Spreading,** such as web crawlers visiting nearby pages first.
- **Connected components,** by running it from each unvisited node.
- **Checking for two colors,** by coloring each level differently. See [[Graph Coloring]].
- **Grids,** where each cell is a node, and neighbors are the adjacent cells.

```python
def grid_steps(grid, start, goal):
    steps = {start: 0}
    queue = deque([start])
    while queue:
        row, col = queue.popleft()
        if (row, col) == goal:
            return steps[goal]
        for r, c in ((row + 1, col), (row - 1, col), (row, col + 1), (row, col - 1)):
            if 0 <= r < len(grid) and 0 <= c < len(grid[0]) and grid[r][c] == "." and (r, c) not in steps:
                steps[(r, c)] = steps[(row, col)] + 1
                queue.append((r, c))
    return -1

print(grid_steps(["..#", ".##", "..."], (0, 0), (2, 2)))  # 4
```

## BFS vs DFS

| | BFS | [[DFS]] |
| --- | --- | --- |
| Uses | A queue | A stack, or recursion |
| Explores | Level by level | As deep as possible first |
| Finds shortest paths | Yes, with equal edge costs | No |
| Memory | The widest level | The deepest path |
| Best for | Distances | Cycles and ordering |

## Common Mistakes

- **Marking nodes when they are taken, not when found.** A node can then enter the queue many times, which can make the search far slower.
- **Using a list as the queue.** `list.pop(0)` is `O(n)`, so use `collections.deque`.
- **Forgetting disconnected parts.** One run only reaches what is connected to the start.
- **Using it on weighted graphs.** It finds the fewest edges, which may not be the lowest cost.
