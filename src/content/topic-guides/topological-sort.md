> Ordering tasks so that each one comes after everything it depends on.

## What It Is

Some tasks must come before others. You must put on socks before shoes, and take Programming I before Programming II. A **topological sort** puts tasks in an order where every task comes after the tasks it depends on.

The tasks and their dependencies form a directed graph, with an edge from `A` to `B` meaning "A must come before B".

```text
socks ---> shoes
pants ---> shoes
shirt ---> tie ---> jacket
```

One valid order is: socks, pants, shoes, shirt, tie, jacket. There are many others.

> A topological order exists only if the graph has **no cycles**. If A needs B and B needs A, neither can go first. Such a graph is called a directed acyclic graph, or DAG, when it has no cycles.

## Kahn's Algorithm

This method follows how you would really plan: do whatever has nothing left waiting on it.

The **in-degree** of a node is how many edges come into it, which means how many tasks must happen first.

1. Count the in-degree of every node.
2. Put all nodes with in-degree 0 in a [[Queue]].
3. Take a node, and add it to the result.
4. Reduce the in-degree of each node it points to. Any that reach 0 join the queue.
5. Repeat. If the result is missing some nodes at the end, the graph has a cycle.

### Worked Example

Edges: 5→2, 5→0, 4→0, 4→1, 2→3, 3→1.

```text
5 ---> 2 ---> 3
|             |
v             v
0 <--- 4 ---> 1
```

| Step | Take | In-Degrees That Change | Queue After |
| --- | --- | --- | --- |
| Start | | | 4, 5 |
| 1 | 4 | 0 → 1 left, 1 → 1 left | 5 |
| 2 | 5 | 2 → 0 left, 0 → 0 left | 2, 0 |
| 3 | 2 | 3 → 0 left | 0, 3 |
| 4 | 0 | None | 3 |
| 5 | 3 | 1 → 0 left | 1 |
| 6 | 1 | None | Empty |

The order is 4, 5, 2, 0, 3, 1.

```python
from collections import deque

def kahn(node_count, edges):
    next_nodes = [[] for _ in range(node_count)]
    in_degree = [0] * node_count
    for a, b in edges:
        next_nodes[a].append(b)
        in_degree[b] += 1
    queue = deque(n for n in range(node_count) if in_degree[n] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for following in next_nodes[node]:
            in_degree[following] -= 1
            if in_degree[following] == 0:
                queue.append(following)
    return order if len(order) == node_count else None    # None means a cycle

edges = [(5, 2), (5, 0), (4, 0), (4, 1), (2, 3), (3, 1)]
print(kahn(6, edges))  # [4, 5, 2, 0, 3, 1]
print(kahn(2, [(0, 1), (1, 0)]))  # None
```

## The DFS Method

[[DFS]] gives another way. A node finishes only after everything it points to has finished. So if you list nodes **as they finish**, and then reverse that list, you get a valid order.

```python
def dfs_topological(node_count, edges):
    next_nodes = [[] for _ in range(node_count)]
    for a, b in edges:
        next_nodes[a].append(b)
    visited = [False] * node_count
    finished = []
    def visit(node):
        visited[node] = True
        for following in next_nodes[node]:
            if not visited[following]:
                visit(following)
        finished.append(node)     # all of its dependents are done
    for node in range(node_count):
        if not visited[node]:
            visit(node)
    return finished[::-1]

print(dfs_topological(6, [(5, 2), (5, 0), (4, 0), (4, 1), (2, 3), (3, 1)]))  # [5, 4, 2, 3, 1, 0]
```

The answer differs from Kahn's, and both are correct. This simple version assumes there are no cycles. To detect them, use the three colors described in [[DFS]].

## Complexity

| Method | Time | Space |
| --- | --- | --- |
| Kahn's | O(V + E) | O(V) |
| DFS | O(V + E) | O(V) |

## Kahn's vs DFS

| | Kahn's | DFS |
| --- | --- | --- |
| Finds a cycle | Yes, automatically | Needs extra tracking |
| Style | A loop | Recursive |
| Deep graphs | Safe | May overflow the stack |
| Good for | Scheduling in parallel, since the queue holds what is ready | Short code |

## Where It Is Used

- **Build systems,** which compile files after what they depend on.
- **Course planning,** which orders courses by their prerequisites.
- **Package managers,** which install dependencies first.
- **Spreadsheets,** which recalculate cells after the cells they use.
- **Shortest paths in a DAG,** which relax edges in topological order, for `O(V + E)` total.

## Common Mistakes

- **Expecting one correct answer.** There are usually many valid orders, and a test should check the rule rather than one exact order.
- **Getting the edge direction backward.** If you read "A depends on B" as `A → B`, the result comes out in reverse.
- **Forgetting to check for cycles.** Kahn's silently returns a partial list if you skip the length check.
- **Forgetting to reverse in the DFS method.** The finish order is backward.
