> Finding the cheapest set of edges whose removal splits a graph, with Stoer-Wagner or Karger's algorithm.

## What It Is

A **cut** divides a graph's nodes into two groups. The **cost of the cut** is the total weight of the edges that cross between the groups. A **minimum cut** is the cheapest possible cut.

Put another way: what is the least you have to remove to break the graph into two pieces? It measures where a network is weakest.

```text
A --5-- B
|       |
3       3
|       |
C --5-- D
```

| Split | Edges Crossing | Cost |
| --- | --- | --- |
| {A, B} and {C, D} | A-C, B-D | 3 + 3 = 6 |
| {A, C} and {B, D} | A-B, C-D | 5 + 5 = 10 |
| {A} and the rest | A-B, A-C | 5 + 3 = 8 |

The minimum cut here costs **6**. It isn't the split with the fewest nodes on one side: what counts is the total weight of the edges that cross.

## Two Different Questions

| Problem | Question | Usual Method |
| --- | --- | --- |
| Global min cut | The cheapest way to split the graph, anywhere | Stoer-Wagner, or Karger |
| s-t min cut | The cheapest way to separate two given nodes | Maximum flow |

### The Link to Maximum Flow

Imagine each edge as a pipe, with its weight as its capacity. The **max-flow min-cut theorem** says that the most water you can send from `s` to `t` equals the cost of the cheapest cut separating them. So an s-t min cut can be found by any maximum flow algorithm, such as Ford-Fulkerson.

This guide focuses on the global min cut.

## The Stoer-Wagner Algorithm

It finds the global min cut without any flow algorithm.

### One Phase

1. Start with any node in a group `A`.
2. Repeatedly add the node **most strongly connected** to `A`, which means the largest total edge weight into `A`.
3. Call the last two nodes added `s` and `t`.
4. The cut that separates `t` from everything else is called the **cut of the phase**. Its cost is the total edge weight into `t`.

The surprising fact: this cut is a minimum cut between `s` and `t`.

### The Whole Algorithm

Now either the global min cut separates `s` and `t`, in which case the cut of the phase is the answer, or it keeps them together, in which case they can be **merged** into one node without losing anything.

So repeat the phase `V - 1` times, merging `s` and `t` each time, and keep the cheapest cut of the phase.

## Worked Example

Two triangles of heavy edges are joined by one light edge.

```text
    0           3
   / \         / \
  3   3       3   3
 /     \     /     \
1---3---2-1-4---3---5
```

Every edge inside a triangle costs 3, and the edge between them costs 1. The min cut is that single edge, at a cost of **1**.

## Code

```python
def stoer_wagner(weights):
    w = [row[:] for row in weights]
    nodes = list(range(len(w)))
    best = float("inf")
    while len(nodes) > 1:
        strength = {node: 0 for node in nodes}
        remaining = set(nodes)
        previous = last = None
        for _ in range(len(nodes)):
            node = max(remaining, key=lambda n: strength[n])
            remaining.remove(node)
            previous, last = last, node
            for other in remaining:
                strength[other] += w[node][other]
        best = min(best, strength[last])        # the cut of the phase
        for other in nodes:                     # merge last into previous
            w[previous][other] += w[last][other]
            w[other][previous] = w[previous][other]
        w[previous][previous] = 0
        nodes.remove(last)
    return best

def build(size, edges):
    w = [[0] * size for _ in range(size)]
    for a, b, cost in edges:
        w[a][b] = w[b][a] = cost
    return w

triangles = build(6, [(0, 1, 3), (1, 2, 3), (0, 2, 3), (3, 4, 3), (4, 5, 3), (3, 5, 3), (2, 4, 1)])
print(stoer_wagner(triangles))  # 1

cycle = build(4, [(0, 1, 1), (1, 2, 1), (2, 3, 1), (3, 0, 1)])
print(stoer_wagner(cycle))  # 2
```

A cycle needs two edges removed to split it, so the second answer is 2.

## Karger's Randomized Algorithm

There is also a surprisingly simple method that relies on chance:

1. Pick a random edge.
2. **Contract** it: merge its two ends into one node, and keep the other edges.
3. Repeat until only two nodes remain. The edges between them form a cut.

A cheap cut has few edges, so random picks tend to miss them. A single run finds the true min cut with a chance of at least `2 / (V(V - 1))`, which is low. But running it `O(V² log V)` times makes failure extremely unlikely.

## Complexity

| Algorithm | Time | Result |
| --- | --- | --- |
| Stoer-Wagner | O(V³) with this simple form | Always correct |
| Karger, one run | O(V²) | Correct with a small chance |
| Karger, repeated | O(V⁴ log V) | Correct with high probability |
| Karger-Stein | O(V² log³ V) | Correct with high probability |

## Where It Is Used

- **Network reliability:** finding the weakest set of links.
- **Image segmentation:** separating an object from its background.
- **Clustering:** splitting data into two loosely connected groups.

## Common Mistakes

- **Mixing up the two problems.** A global min cut isn't the same as a cut between two chosen nodes.
- **Assuming a min cut is one edge.** It is often several light edges.
- **Forgetting to merge weights.** When merging two nodes, edge weights to any other node must be added, not replaced.
- **Treating one Karger run as the answer.** A single run usually fails. Repeat it many times, and keep the best.
