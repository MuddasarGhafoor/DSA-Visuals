> Searching from the start and the goal at the same time, and stopping when the two searches meet.

## What It Is

Instead of one search that goes all the way from start to goal, **bidirectional search** runs two: one forward from the start, and one backward from the goal. They stop when they meet in the middle.

Imagine two people digging a tunnel from opposite sides of a mountain. Each only has to dig half the distance.

## Why It Is So Much Faster

If each node has `b` neighbors, and the goal is `d` steps away, a normal [[BFS]] explores about `b^d` nodes. Two searches that each go halfway explore about `2 × b^(d/2)`.

That is a huge difference, because the exponent is cut in half.

| Branching 10, Distance 6 | Nodes Explored |
| --- | --- |
| Normal BFS | About 1,000,000 |
| Bidirectional search | About 2,000 |

```text
Normal BFS:             Bidirectional:

         o                  o           o
       o o o               o o         o o
     o o o o o              o o o o o o o
   o o o o o o o             start   goal
     one huge circle       two small circles
```

## How It Works

1. Keep two frontiers and two visited records, one for each direction.
2. Expand one whole level of the smaller frontier. That keeps the work low.
3. When a newly reached node is already visited by the other side, the searches have met. Record the total length.
4. Finish that level, and return the shortest total found.

### When Does It Stop?

Finishing the level matters. Stopping at the very first meeting can miss a slightly shorter path, depending on the order of nodes within the level. Expanding one complete level before returning handles this for graphs where all edges cost the same.

## Worked Example

Find the distance from A to G.

```text
A -- B -- C -- D -- E -- F -- G
```

| Round | Expand | Forward Reached | Backward Reached |
| --- | --- | --- | --- |
| Start | | A | G |
| 1 | Backward | A | G, F |
| 2 | Forward | A, B | G, F |
| 3 | Backward | A, B | G, F, E |
| 4 | Forward | A, B, C | G, F, E |
| 5 | Backward | A, B, C | G, F, E, D |
| 6 | Forward reaches D | Met at D | |

The two sides take turns here, because their frontiers stay the same size. The forward side reached D in 3 steps, and the backward side reached it in 3 steps, so the total is 6.

## Code

```python
def bidirectional_search(graph, start, goal):
    if start == goal:
        return 0
    forward, backward = {start: 0}, {goal: 0}
    front_a, front_b = [start], [goal]
    while front_a and front_b:
        # Expand the smaller frontier, and take turns on a tie.
        if len(front_a) >= len(front_b):
            front_a, front_b = front_b, front_a
            forward, backward = backward, forward
        best = None
        next_level = []
        for node in front_a:
            for neighbor in graph[node]:
                if neighbor in backward:
                    total = forward[node] + 1 + backward[neighbor]
                    best = total if best is None else min(best, total)
                if neighbor not in forward:
                    forward[neighbor] = forward[node] + 1
                    next_level.append(neighbor)
        if best is not None:
            return best
        front_a = next_level
    return -1

line = {"A": ["B"], "B": ["A", "C"], "C": ["B", "D"], "D": ["C", "E"], "E": ["D", "F"], "F": ["E", "G"], "G": ["F"]}
print(bidirectional_search(line, "A", "G"))  # 6
print(bidirectional_search(line, "C", "C"))  # 0
print(bidirectional_search({"A": [], "B": []}, "A", "B"))  # -1
```

## Complexity

| Measure | [[BFS]] | Bidirectional |
| --- | --- | --- |
| Time | O(b^d) | O(b^(d/2)) |
| Space | O(b^d) | O(b^(d/2)) |

Here, `b` is the number of neighbors per node, and `d` is the distance. On small or thin graphs, both are bounded by `O(V + E)`.

## When You Can Use It

It needs three things:

- **A known goal.** You must be able to start searching from it.
- **Reversible edges.** To search backward, you must be able to find the nodes that lead *to* a node. In a directed graph, you need the reversed edges.
- **Goal not described by a condition.** "Reach any node with property X" gives you nothing to start from.

## Where It Is Used

- **Social networks:** the shortest connection between two people.
- **Map routing:** real routing systems search from both ends.
- **Puzzles** with a known end state, such as the Rubik's Cube.

## Common Mistakes

- **Stopping at the first meeting without care.** Finish the current level first, as above.
- **Following forward edges in the backward search.** On a directed graph, the backward search must use reversed edges.
- **Combining the distances wrongly.** The total is the forward distance, plus 1 for the connecting edge, plus the backward distance.
- **Using it with one frontier always larger.** Expanding only one side gives up the whole benefit.
