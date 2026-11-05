> Giving each node a color so that no two neighbors share one, using as few colors as possible.

## What It Is

**Graph coloring** gives each node a color, so that no edge joins two nodes of the same color. The goal is to use as few colors as possible. That smallest number is called the graph's **chromatic number**.

```text
A triangle needs 3 colors:     A square needs only 2:

     R                           R --- G
    / \                          |     |
   G---B                         G --- R
```

## Why It Matters

Coloring is a model for **sharing without clashes**. The colors are the resource, and the edges say who can't share.

| Problem | Nodes | Edges | Colors |
| --- | --- | --- | --- |
| Exam timetable | Exams | Share a student | Time slots |
| Map coloring | Regions | Share a border | Colors |
| Radio frequencies | Towers | Close enough to interfere | Frequencies |
| Compiler registers | Variables | In use at the same time | CPU registers |
| Sudoku | Cells | Same row, column, or box | Digits 1 to 9 |

## How Hard It Is

| Question | Difficulty |
| --- | --- |
| Can it be done with 2 colors? | Easy: O(V + E) |
| Can it be done with 3 or more colors? | [[NP-Complete Problems\|NP-complete]] |
| What is the fewest colors? | NP-hard |
| Any map on a flat surface | Always 4 colors or fewer, by the Four Color Theorem |

## Checking for Two Colors

A graph that can use 2 colors is called **bipartite**. Run [[BFS]] and give each level the opposite color. If two neighbors ever get the same color, it can't be done. This fails exactly when the graph has a cycle of odd length.

```python
from collections import deque

def two_colors(graph):
    color = {}
    for start in graph:
        if start in color:
            continue
        color[start] = 0
        queue = deque([start])
        while queue:
            node = queue.popleft()
            for neighbor in graph[node]:
                if neighbor not in color:
                    color[neighbor] = 1 - color[node]
                    queue.append(neighbor)
                elif color[neighbor] == color[node]:
                    return None
    return color

square = {0: [1, 3], 1: [0, 2], 2: [1, 3], 3: [2, 0]}
triangle = {0: [1, 2], 1: [0, 2], 2: [0, 1]}
print(two_colors(square))  # {0: 0, 1: 1, 3: 1, 2: 0}
print(two_colors(triangle))  # None
```

## Greedy Coloring

Go through the nodes one by one. Give each the smallest color that none of its neighbors has. This is fast, and it uses at most one color more than the highest degree. But it doesn't always find the fewest.

### Worked Example: A Five-Node Cycle

```text
Nodes 0 - 1 - 2 - 3 - 4 - back to 0
```

| Node | Neighbors Already Colored | Color Given |
| --- | --- | --- |
| 0 | None | 0 |
| 1 | 0 has color 0 | 1 |
| 2 | 1 has color 1 | 0 |
| 3 | 2 has color 0 | 1 |
| 4 | 3 has color 1, 0 has color 0 | 2 |

That is 3 colors, which is the true minimum, since an odd cycle can't use 2.

```python
def greedy_coloring(graph):
    color = {}
    for node in graph:
        taken = {color[n] for n in graph[node] if n in color}
        c = 0
        while c in taken:
            c += 1
        color[node] = c
    return color

cycle = {0: [1, 4], 1: [0, 2], 2: [1, 3], 3: [2, 4], 4: [3, 0]}
print(greedy_coloring(cycle))  # {0: 0, 1: 1, 2: 0, 3: 1, 4: 2}
```

The order matters a lot. A common improvement is to color the nodes with the most neighbors first, since they are the hardest to place.

## The Exact Answer: Backtracking

To get a guaranteed answer for `k` colors, try each color at each node, and back up when you get stuck. See [[Backtracking]].

```python
def can_color(graph, k):
    nodes = list(graph)
    color = {}
    def place(i):
        if i == len(nodes):
            return True
        node = nodes[i]
        for c in range(k):
            if all(color.get(n) != c for n in graph[node]):
                color[node] = c
                if place(i + 1):
                    return True
                del color[node]
        return False
    return place(0)

print(can_color(cycle, 2))  # False
print(can_color(cycle, 3))  # True
```

## Complexity

| Method | Time | Guarantee |
| --- | --- | --- |
| Two colors with BFS | O(V + E) | Exact |
| Greedy | O(V + E) | A valid coloring, maybe not the fewest colors |
| Backtracking | O(k^V) in the worst case | Exact |

## Common Mistakes

- **Assuming greedy finds the minimum.** It finds a valid coloring only. Bad orderings can use many more colors than needed.
- **Saying two colors means no cycles.** A square has a cycle and needs only 2 colors. Only **odd** cycles rule it out.
- **Forgetting disconnected parts.** Each component needs its own start, as in the outer loop above.
- **Using large degrees to judge.** A star has one very high-degree node, but needs only 2 colors.
