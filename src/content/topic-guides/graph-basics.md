> What vertices and edges are, and what makes a graph directed, weighted, cyclic, or connected.

## What It Is

A **graph** is a set of things and the connections between them. The things are called **vertices** or **nodes**, and the connections are called **edges**.

```text
Ali --- Sara
 |        |
Omar --- Zain
```

Graphs can model almost anything with connections:

| Real World | Vertices | Edges |
| --- | --- | --- |
| Friends | People | Friendships |
| Road map | Places | Roads |
| The web | Pages | Links |
| Course plan | Courses | Prerequisites |
| Computer network | Machines | Cables |

We usually write `V` for the number of vertices, and `E` for the number of edges.

## Kinds of Graphs

### Directed or Undirected

In an **undirected** graph, an edge goes both ways, like a friendship. In a **directed** graph, each edge has a direction, like following someone online. Directed edges are often drawn with arrows.

```text
Undirected:  A --- B        Directed:  A ---> B
```

### Weighted or Unweighted

In a **weighted** graph, each edge has a number, such as a distance or a price. In an **unweighted** graph, all edges count the same.

### Cyclic or Acyclic

A **cycle** is a path that returns to where it started without reusing an edge. A graph with no cycles is **acyclic**. A directed acyclic graph, or **DAG**, is especially useful for describing dependencies. See [[Topological Sort]].

### Connected or Disconnected

An undirected graph is **connected** if you can get from every node to every other node. The separate pieces of a disconnected graph are called its **connected components**.

### Sparse or Dense

A **sparse** graph has few edges, near `V`. A **dense** graph has many, near `V²`. This decides how you should store it. See [[Adjacency List vs Matrix]].

## Key Words

| Term | Meaning |
| --- | --- |
| Adjacent | Two nodes joined by an edge. They are also called neighbors. |
| Degree | The number of edges at a node |
| In-degree, out-degree | In a directed graph: edges coming in, and edges going out |
| Path | A series of edges connecting one node to another |
| Simple path | A path that doesn't repeat a node |
| Cycle | A path that returns to its start |
| Self-loop | An edge from a node to itself |

## Useful Facts

### The Handshake Rule

Every edge touches two ends, so adding up all the degrees counts each edge twice:

```text
sum of all degrees = 2 × E
```

### Most Possible Edges

| Graph Type | Most Edges |
| --- | --- |
| Undirected, no self-loops | V(V - 1) / 2 |
| Directed, no self-loops | V(V - 1) |

### Trees Are Graphs

A **tree** is a connected graph with no cycles. A tree with `V` nodes always has exactly `V - 1` edges. Remove any edge, and it splits in two. Add any edge, and it forms a cycle.

## Code

The usual way to store a graph is a dictionary from each node to its list of neighbors.

```python
edges = [("A", "B"), ("A", "C"), ("B", "C"), ("C", "D"), ("E", "F")]

graph = {}
for a, b in edges:
    graph.setdefault(a, []).append(b)
    graph.setdefault(b, []).append(a)

def degree(node):
    return len(graph[node])

def count_components():
    seen = set()
    count = 0
    for start in graph:
        if start not in seen:
            count += 1
            stack = [start]
            while stack:
                node = stack.pop()
                if node not in seen:
                    seen.add(node)
                    stack.extend(graph[node])
    return count

print(degree("C"))  # 3
print(sum(degree(node) for node in graph))  # 10
print(count_components())  # 2
```

The degrees add up to 10, which is twice the 5 edges, as the handshake rule says. The two components are A, B, C, D and E, F.

## What Comes Next

| To Do This | Read |
| --- | --- |
| Store a graph | [[Adjacency List vs Matrix]] |
| Visit every node | [[BFS]], [[DFS]] |
| Find shortest paths | [[Dijkstra]], [[Bellman-Ford]], [[Floyd-Warshall]] |
| Connect everything cheaply | [[Prim's Algorithm]], [[Kruskal's Algorithm]] |
| Order tasks | [[Topological Sort]] |

## Common Mistakes

- **Treating a directed edge as two-way.** Check the problem statement. A one-way street can't be driven both ways.
- **Assuming a graph is connected.** Always consider that there may be nodes you can't reach from your start.
- **Writing `V` for `E` in a cost.** Costs often depend on both. `O(V + E)` isn't the same as `O(V)`, because `E` can be as large as `V²`.
- **Forgetting that a node may have no edges.** Such a node might not appear in an edge list at all.
