> Running depth-limited DFS again and again with a growing limit, to get the shortest path with very little memory.

## What It Is

[[BFS]] finds the shortest path, but it can run out of memory on large searches, because it stores a whole level of nodes at once. [[DFS]] uses very little memory, but it can miss the shortest path, and it can get lost going deep down one branch.

**Iterative deepening depth-first search** (IDDFS) gets the best of both. It runs DFS with a depth limit of 0, then a limit of 1, then 2, and so on, until it finds the goal.

## How It Works

1. Set the depth limit to 0.
2. Run a DFS that stops going deeper at the limit.
3. If the goal was found, stop.
4. Otherwise, increase the limit by 1, and start again from the beginning.

Because the limit grows one step at a time, the first time it finds the goal must be at the shallowest depth, just like BFS.

## Worked Example

Find G in this tree.

```text
        A
       / \
      B   C
     / \   \
    D   E   G
```

| Limit | Nodes Visited | Found G? |
| --- | --- | --- |
| 0 | A | No |
| 1 | A, B, C | No |
| 2 | A, B, D, E, C, G | Yes, at depth 2 |

## Isn't That Wasteful?

It looks wasteful, because the top levels are searched again and again. But in a tree that branches, **almost all the nodes are at the bottom**, so the repeated levels cost very little.

With 10 children per node and a goal at depth 5:

| Depth | Nodes at This Depth | Times Visited |
| --- | --- | --- |
| 0 | 1 | 6 |
| 1 | 10 | 5 |
| 2 | 100 | 4 |
| 3 | 1,000 | 3 |
| 4 | 10,000 | 2 |
| 5 | 100,000 | 1 |

The total is 123,456 visits. A single BFS would visit 111,111 nodes. So the repetition adds only about 11%.

## Code

```python
def depth_limited(graph, node, goal, limit, path):
    if node == goal:
        return path + [node]
    if limit == 0:
        return None
    for neighbor in graph[node]:
        if neighbor not in path:                      # avoid looping on this path
            found = depth_limited(graph, neighbor, goal, limit - 1, path + [node])
            if found:
                return found
    return None

def iddfs(graph, start, goal, max_depth=50):
    for limit in range(max_depth + 1):
        found = depth_limited(graph, start, goal, limit, [])
        if found:
            return found
    return None

graph = {
    "A": ["B", "C"], "B": ["D", "E"], "C": ["G"],
    "D": [], "E": [], "G": [],
}
print(iddfs(graph, "A", "G"))  # ['A', 'C', 'G']
print(iddfs(graph, "A", "Z"))  # None
```

## Complexity

Here, `b` is the number of children per node, and `d` is the depth of the goal.

| | [[BFS]] | [[DFS]] | IDDFS |
| --- | --- | --- | --- |
| Time | O(b^d) | O(b^m), where m is the deepest path | O(b^d) |
| Memory | O(b^d) | O(m) | O(d) |
| Finds the shortest path | Yes | No | Yes, with equal edge costs |
| Works when the tree is huge or infinite | Runs out of memory | Can get lost | Yes |

The memory is the main advantage. BFS at depth 10 with 10 children per node would need to store about 10 billion nodes. IDDFS needs to store only 10.

## When to Use It

- **The search space is huge or infinite,** such as all possible game positions.
- **The depth of the answer is unknown.**
- **Memory is the limit.**
- **Game engines.** Chess programs use it because it gives a usable answer at any moment: if time runs out, use the result from the last finished depth. See [[Minimax]].

For a small graph with memory to spare, plain [[BFS]] is simpler and faster.

## Common Mistakes

- **Repeatedly visiting nodes on a graph with many routes.** This simple version only avoids cycles on the current path. A node reachable by many paths may be searched many times.
- **Using it where BFS fits.** On a graph small enough to fit in memory, BFS does less work.
- **Using a shared visited set across limits.** A node marked at one depth might be reachable sooner on another path. Reset for each limit, or track by depth.
- **Assuming it handles different edge costs.** It finds the fewest edges, not the lowest cost.
