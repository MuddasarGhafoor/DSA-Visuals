> Finding a shortest path faster than Dijkstra, by using an estimate of the distance left to guide the search.

## What It Is

[[Dijkstra]] explores outward in every direction, like a ripple in a pond. If you know where the target is, that is wasteful: much of the work goes in the wrong direction.

**A\*** (say "A-star") adds a sense of direction. It prefers nodes that look closer to the goal, while still guaranteeing the shortest path, as long as its estimate follows one simple rule.

## The Formula

A\* gives each node a score:

```text
f(n) = g(n) + h(n)
```

| Part | Meaning |
| --- | --- |
| `g(n)` | The actual cost from the start to `n`, so far |
| `h(n)` | The **heuristic**: an estimate of the cost from `n` to the goal |
| `f(n)` | The estimated total cost of a path through `n` |

It always expands the node with the lowest `f`, using a [[Priority Queue]].

Notice the two extremes. If `h` is always 0, then A\* is exactly Dijkstra. If it used only `h`, it would rush toward the goal, and could miss the shortest path.

## Choosing the Heuristic

The heuristic is what makes A\* work. It must be **admissible**: it must never overestimate the true remaining cost. An optimistic guess keeps A\* from wrongly giving up on the best path.

| Movement | Heuristic | Formula |
| --- | --- | --- |
| Grid, 4 directions | Manhattan distance | `abs(dx) + abs(dy)` |
| Grid, 8 directions | Chebyshev distance | `max(abs(dx), abs(dy))`, if diagonals cost 1 |
| Any direction | Straight-line distance | `sqrt(dx² + dy²)` |

A better estimate, one closer to the true cost while still not above it, means fewer nodes are explored.

## Worked Example

On this grid, go from S to G, moving in 4 directions, where `#` is a wall.

```text
S . . .
. # # .
. . . G
```

S is at (0, 0) and G is at (2, 3), so `h(S) = 2 + 3 = 5`.

| Expand | g | h | f | Why This One |
| --- | --- | --- | --- | --- |
| (0, 0) S | 0 | 5 | 5 | The start |
| (0, 1) | 1 | 4 | 5 | The lowest f, and a tie with (1, 0) |
| (0, 2) | 2 | 3 | 5 | It keeps moving toward G |
| (0, 3) | 3 | 2 | 5 | |
| (1, 3) | 4 | 1 | 5 | |
| (2, 3) G | 5 | 0 | 5 | The goal, at a total cost of 5 |

A\* went straight there, expanding only 6 cells. Every cell on this route has the same `f`, and ties go to the cell closest to the goal. Dijkstra would have spread out across the whole grid.

## Code

```python
import heapq

def a_star(grid, start, goal):
    def h(cell):
        return abs(cell[0] - goal[0]) + abs(cell[1] - goal[1])

    best = {start: 0}
    waiting = [(h(start), h(start), start)]    # ties go to the cell closest to the goal
    expanded = 0
    while waiting:
        f, _, cell = heapq.heappop(waiting)
        if f > best[cell] + h(cell):
            continue                       # a stale entry: a better path was found
        expanded += 1
        if cell == goal:
            return best[cell], expanded
        row, col = cell
        for next_cell in ((row + 1, col), (row - 1, col), (row, col + 1), (row, col - 1)):
            r, c = next_cell
            if 0 <= r < len(grid) and 0 <= c < len(grid[0]) and grid[r][c] != "#":
                cost = best[cell] + 1
                if cost < best.get(next_cell, float("inf")):
                    best[next_cell] = cost
                    heapq.heappush(waiting, (cost + h(next_cell), h(next_cell), next_cell))
    return None, expanded

grid = ["....", ".##.", "...."]
print(a_star(grid, (0, 0), (2, 3)))  # (5, 6)
print(a_star(["#.", ".."], (1, 0), (0, 1))[0])  # 2
```

## Complexity

| Measure | Cost |
| --- | --- |
| Time, worst case | Like Dijkstra: O((V + E) log V) with `h = 0` |
| Time in practice | Often far less, depending on the heuristic |
| Space | O(V), since it stores everything it has seen |

Memory is often its real limit on very large maps.

## A\* vs Other Searches

| | [[BFS]] | [[Dijkstra]] | A\* |
| --- | --- | --- | --- |
| Edge costs | Equal | Non-negative | Non-negative |
| Uses a goal estimate | No | No | Yes |
| Finds the shortest path | Yes | Yes | Yes, if `h` is admissible |
| Needs a known goal | No | No | Yes |
| Single target, large map | Slow | Slow | Fast |

Use Dijkstra when you need distances to every node, or have no useful heuristic.

## Where It Is Used

Video game pathfinding, map routing, robot motion planning, and puzzle solvers.

## Common Mistakes

- **Overestimating.** An inadmissible `h` can return a path that isn't the shortest. Sometimes this is done on purpose, to trade accuracy for speed.
- **Using the wrong distance.** Straight-line distance is valid on a 4-direction grid but weak. Manhattan distance is the better fit there.
- **Skipping the stale check.** A node can be in the queue several times. Without the check, it does wasted work.
- **Sorting by `h` alone.** That is greedy best-first search, which doesn't guarantee the shortest path.
