> Exploring a graph by going as deep as possible down each path before backing up.

## What It Is

**Depth-first search** (DFS) explores a graph by following one path as far as it can. When it reaches a dead end, it backs up to the most recent choice, and tries another way.

It is how you might explore a maze: keep walking, and when you get stuck, return to the last junction and take a different turn.

## How It Works

1. Mark the current node as visited.
2. For each neighbor that hasn't been visited, go there and repeat from step 1.
3. When there are no unvisited neighbors left, go back.

Going back is handled by the [[Recursion and the Call Stack|call stack]], or by your own [[Stack]].

## Worked Example

```text
A --- B --- E
|     |
C --- D --- F
```

Start at A, taking neighbors in alphabetical order.

| Step | At | Action | Stack, Bottom to Top |
| --- | --- | --- | --- |
| 1 | A | Go to B | A |
| 2 | B | Go to D (A is visited) | A, B |
| 3 | D | Go to C (B is visited) | A, B, D |
| 4 | C | A and D are visited, so back up | A, B, D, C |
| 5 | D | Go to F | A, B, D |
| 6 | F | Dead end, so back up | A, B, D, F |
| 7 | D | Nothing left, so back up | A, B, D |
| 8 | B | Go to E | A, B |
| 9 | E | Dead end, and everything finishes | A, B, E |

The visit order is A, B, D, C, F, E.

## Code

```python
def dfs(graph, start):
    visited = []
    def visit(node):
        visited.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visit(neighbor)
    visit(start)
    return visited

def dfs_loop(graph, start):
    visited = []
    stack = [start]
    while stack:
        node = stack.pop()
        if node not in visited:
            visited.append(node)
            for neighbor in reversed(graph[node]):
                stack.append(neighbor)
    return visited

graph = {
    "A": ["B", "C"], "B": ["A", "D", "E"], "C": ["A", "D"],
    "D": ["B", "C", "F"], "E": ["B"], "F": ["D"],
}
print(dfs(graph, "A"))  # ['A', 'B', 'D', 'C', 'F', 'E']
print(dfs_loop(graph, "A"))  # ['A', 'B', 'D', 'C', 'F', 'E']
```

For speed, real code uses a set for `visited`. These versions use a list to keep the order easy to print.

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(V + E) | Each node is visited once, and each edge is looked at once or twice |
| Space | O(V) | The visited record, plus the stack, which can reach `V` deep |

## Finding a Cycle

DFS gives a neat way to detect cycles in a directed graph. Give each node one of three colors:

| Color | Meaning |
| --- | --- |
| White | Not visited yet |
| Gray | Currently on the stack: we are still exploring below it |
| Black | Completely finished |

If you reach a **gray** node, you have found a way back to a node you are still inside. That is a cycle.

```python
def has_cycle(graph):
    color = {node: "white" for node in graph}
    def visit(node):
        color[node] = "gray"
        for neighbor in graph[node]:
            if color[neighbor] == "gray":
                return True
            if color[neighbor] == "white" and visit(neighbor):
                return True
        color[node] = "black"
        return False
    return any(color[node] == "white" and visit(node) for node in graph)

print(has_cycle({"A": ["B"], "B": ["C"], "C": ["A"]}))  # True
print(has_cycle({"A": ["B", "C"], "B": ["C"], "C": []}))  # False
```

## Where It Is Used

- **[[Topological Sort|Topological sorting]],** by listing nodes as they finish, and reversing that.
- **Cycle detection,** as above.
- **Connected components,** by starting a new search from each unvisited node.
- **Solving mazes and puzzles.** See [[Backtracking]].
- **Exploring a tree.** The [[Tree Traversals|tree traversals]] are all DFS.

## DFS vs BFS

| | DFS | [[BFS]] |
| --- | --- | --- |
| Uses | A stack, or recursion | A queue |
| Explores | Deep first | Wide first |
| Finds shortest paths | No | Yes, with equal costs |
| Memory on a wide tree | Low | High |
| Memory on a deep tree | High | Low |
| Best for | Cycles, ordering, exploring every path | Distances |

## Common Mistakes

- **Expecting a shortest path.** DFS finds *a* path. It may be very long.
- **Forgetting to mark visited.** On a graph with cycles, it would loop forever.
- **Running out of stack.** Recursion on a graph with a million nodes in a line can overflow. Use the loop version.
- **Assuming one call reaches everything.** On a disconnected graph, loop over all the nodes.
- **Marking too early in the loop version.** Mark nodes when they are popped, to keep the same order as recursion.
