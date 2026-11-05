> Two ways to store a graph, and what each one costs in memory and lookup time.

## What It Is

A [[Graph Basics|graph]] needs to be stored in memory somehow. There are two standard ways, and the choice affects the speed of everything that follows.

Take this graph, with 4 nodes and 4 edges:

```text
0 --- 1
|     |
|     |
2 --- 3
```

## Adjacency Matrix

Use a grid of `V` by `V`. The cell at row `i` and column `j` is 1 if there is an edge from `i` to `j`, and 0 if not.

```text
     0  1  2  3
  0  0  1  1  0
  1  1  0  0  1
  2  1  0  0  1
  3  0  1  1  0
```

For an undirected graph, the grid is symmetric. For a weighted graph, store the weight instead of 1.

## Adjacency List

For each node, keep a list of only its neighbors.

```text
0: 1, 2
1: 0, 3
2: 0, 3
3: 1, 2
```

For a weighted graph, each entry stores both the neighbor and the weight.

## Code

```python
def to_matrix(node_count, edges):
    matrix = [[0] * node_count for _ in range(node_count)]
    for a, b in edges:
        matrix[a][b] = 1
        matrix[b][a] = 1
    return matrix

def to_list(node_count, edges):
    neighbors = [[] for _ in range(node_count)]
    for a, b in edges:
        neighbors[a].append(b)
        neighbors[b].append(a)
    return neighbors

edges = [(0, 1), (0, 2), (1, 3), (2, 3)]
matrix = to_matrix(4, edges)
neighbors = to_list(4, edges)
print(matrix[0][3])  # 0
print(matrix[0][1])  # 1
print(neighbors[0])  # [1, 2]
print(sum(matrix[3]))  # 2
```

## How They Compare

| Operation | Matrix | List | Why |
| --- | --- | --- | --- |
| Is there an edge from u to v? | O(1) | O(degree of u) | The matrix reads one cell, and the list must scan |
| List all neighbors of u | O(V) | O(degree of u) | The matrix must check every column |
| Add an edge | O(1) | O(1) | |
| Remove an edge | O(1) | O(degree of u) | The list must find it first |
| Add a node | O(V²) | O(1) | The matrix must grow |
| Space | O(V²) | O(V + E) | |
| Visit every edge | O(V²) | O(V + E) | |

## How to Choose

It mostly depends on how many edges the graph has compared with how many it could have.

- A **sparse** graph has few edges, near `V`. Road networks and friend networks are like this.
- A **dense** graph has many edges, near `V²`.

| Situation | Use | Why |
| --- | --- | --- |
| Sparse graph | List | Saves a huge amount of memory |
| [[BFS]], [[DFS]], [[Dijkstra]] | List | They spend their time listing neighbors |
| Dense graph | Matrix | Costs about the same memory, and it is simpler |
| Many "is there an edge?" questions | Matrix | O(1) per question |
| [[Floyd-Warshall]] | Matrix | It works on a full table anyway |

### Why Memory Decides It

Take a social network with 1,000,000 people, each with about 100 friends.

| | Entries Stored | At 4 Bytes Each |
| --- | --- | --- |
| Matrix | 1,000,000 × 1,000,000 = 10¹² | About 4 terabytes |
| List | 2 × 50,000,000 edges = 100,000,000 | About 400 megabytes |

### Why Speed Follows

BFS on a list takes `O(V + E)`. On a matrix, it takes `O(V²)`, because listing each node's neighbors means scanning a whole row. For the network above, that is the difference between about 10⁸ and 10¹² steps.

Most graph code uses adjacency lists. When in doubt, choose a list.

## Edge List: A Third Option

You can also store just a list of `(u, v, weight)` entries. It is compact, but finding a node's neighbors means scanning everything. It suits algorithms that only process all edges, such as [[Kruskal's Algorithm]] and [[Bellman-Ford]].

## Common Mistakes

- **Adding an undirected edge only once.** It must go both ways: `u` to `v`, and `v` to `u`.
- **Using 0 to mean "no edge" when a weight can be 0.** Use infinity or `None` for "no edge" in a weighted matrix.
- **Allocating a matrix for a huge sparse graph.** It runs out of memory before the algorithm even starts.
- **Assuming a list is sorted.** Neighbors appear in the order they were added. Sort them if you need a set order.
