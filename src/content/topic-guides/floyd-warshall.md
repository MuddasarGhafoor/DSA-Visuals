> Finding the shortest path between every pair of nodes, by allowing one more node as a stopover each round.

## What It Is

[[Dijkstra]] and [[Bellman-Ford]] find shortest paths from one starting node. **Floyd-Warshall** finds them between **every pair of nodes**, all at once, in just a few lines of code.

It is a dynamic programming algorithm, and it allows negative edges, as long as there are no negative cycles.

## The Key Idea

Number the nodes from 0 to `V - 1`. Now ask a smaller question:

> What is the shortest path from `i` to `j`, using only the first `k` nodes as stopovers?

When `k` is 0, no stopovers are allowed, so the answer is just the direct edge. Then you allow one more node at a time. For each pair, there are two choices when allowing node `k`:

- **Don't use `k`:** the best path stays as it was.
- **Use `k`:** go from `i` to `k`, then from `k` to `j`.

So:

```text
dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
```

After every node has been allowed, the table holds the true shortest paths.

## Worked Example

```text
0 --3--> 1 --1--> 2
 \                ^
  -------7--------+
```

### Start: Direct Edges Only

```text
     0  1  2
  0  0  3  7
  1  ∞  0  1
  2  ∞  ∞  0
```

### Allow Node 0 as a Stopover

No path goes through node 0, since nothing leads into it, so nothing changes.

### Allow Node 1 as a Stopover

The pair (0, 2): the direct cost is 7, and going through 1 costs `3 + 1 = 4`, so it improves.

```text
     0  1  2
  0  0  3  4
  1  ∞  0  1
  2  ∞  ∞  0
```

### Allow Node 2 as a Stopover

Nothing leaves node 2, so nothing changes. The table above is final.

## Code

```python
INF = float("inf")

def floyd_warshall(matrix):
    n = len(matrix)
    dist = [row[:] for row in matrix]
    for k in range(n):               # the outer loop must be k
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return dist

def has_negative_cycle(dist):
    return any(dist[i][i] < 0 for i in range(len(dist)))

graph = [
    [0, 3, 7],
    [INF, 0, 1],
    [INF, INF, 0],
]
result = floyd_warshall(graph)
print(result[0][2])  # 4
print(result[1][0])  # inf
print(has_negative_cycle(result))  # False
print(has_negative_cycle(floyd_warshall([[0, 1], [-2, 0]])))  # True
```

## Complexity

| Measure | Cost |
| --- | --- |
| Time | O(V³) |
| Space | O(V²) |

## Recovering the Path

The table holds only costs. To get the route, keep a second table, where `next[i][j]` is the first step from `i` toward `j`. When a stopover improves a pair, set `next[i][j] = next[i][k]`.

## Negative Cycles

After the algorithm finishes, look at the diagonal. A node's distance to itself starts at 0. If `dist[i][i]` has become negative, a negative cycle passes through node `i`.

## When to Use It

| Situation | Best Choice | Time |
| --- | --- | --- |
| One start, non-negative edges | [[Dijkstra]] | O((V + E) log V) |
| One start, negative edges | [[Bellman-Ford]] | O(V × E) |
| All pairs, dense graph | Floyd-Warshall | O(V³) |
| All pairs, sparse graph | [[Dijkstra]] from every node | O(V × (V + E) log V) |

Floyd-Warshall is ideal for small graphs, up to about 400 nodes, because the code is short and the constant is small. Above that, the `V³` grows too large.

## Reachability

A variation answers "can `i` reach `j` at all?". Replace the numbers with true or false:

```python
def transitive_closure(reach):
    n = len(reach)
    result = [row[:] for row in reach]
    for k in range(n):
        for i in range(n):
            for j in range(n):
                result[i][j] = result[i][j] or (result[i][k] and result[k][j])
    return result

reach = [[True, True, False], [False, True, True], [False, False, True]]
print(transitive_closure(reach)[0][2])  # True
```

## Common Mistakes

- **The wrong loop order.** `k` must be the **outer** loop. This is the most common bug, because the code still runs and gives wrong answers.
- **Using 0 for "no edge".** Use infinity for a missing edge, and 0 only on the diagonal.
- **Overflow with infinity.** In C and Java, adding to a large "infinity" can overflow into a negative number. Check for infinity, or use a smaller constant.
- **Using it on large graphs.** 10,000 nodes would need 10¹² steps.
