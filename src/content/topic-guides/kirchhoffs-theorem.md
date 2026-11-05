> Counting the spanning trees of a graph, using the determinant of a matrix built from the graph.

## What It Is

A **spanning tree** is a set of edges that connects all the nodes of a graph with no cycles. A graph can have many of them. [[Kruskal's Algorithm]] and [[Prim's Algorithm]] find the cheapest one. **Kirchhoff's theorem**, also called the matrix tree theorem, answers a different question: **how many are there?**

It feels like magic: a single determinant gives the exact count, even when there are billions of them.

## Spanning Trees by Hand

A triangle has 3 edges and 3 nodes. A spanning tree needs 2 edges, and you can drop any one of the 3. So there are 3 spanning trees.

```text
Triangle:     Tree 1:      Tree 2:      Tree 3:
   A            A            A            A
  / \          /              \          / \
 B---C        B---C        B---C        B   C
```

Listing them gets out of hand quickly. A complete graph of 10 nodes has 100 million.

## The Theorem

### Step 1: Build the Laplacian Matrix

The **Laplacian matrix** `L` is the degree of each node on the diagonal, and -1 for each edge.

```text
L[i][i] = degree of node i
L[i][j] = -1 if i and j are joined by an edge
L[i][j] = 0 otherwise
```

### Step 2: Remove a Row and a Column

Remove any one row, and the column with the same number. It doesn't matter which, since the result is always the same.

### Step 3: Take the Determinant

The determinant of what is left is the number of spanning trees.

## Worked Example: A Triangle

Each of the three nodes has degree 2, and each pair is joined.

```text
L =   2  -1  -1
     -1   2  -1
     -1  -1   2
```

Remove the last row and the last column:

```text
  2  -1
 -1   2
```

The determinant is `2 × 2 - (-1) × (-1) = 4 - 1 = 3`. That matches the 3 trees we counted by hand.

## Code

A determinant can be found by **Gaussian elimination**: use row operations to clear everything below the diagonal, and then multiply the diagonal. Python's `Fraction` keeps the numbers exact, so rounding can't spoil the count.

```python
from fractions import Fraction

def determinant(matrix):
    m = [[Fraction(x) for x in row] for row in matrix]
    n = len(m)
    result = Fraction(1)
    for col in range(n):
        pivot = next((r for r in range(col, n) if m[r][col] != 0), None)
        if pivot is None:
            return 0
        if pivot != col:
            m[col], m[pivot] = m[pivot], m[col]
            result = -result             # swapping rows flips the sign
        result *= m[col][col]
        for r in range(col + 1, n):
            factor = m[r][col] / m[col][col]
            for c in range(col, n):
                m[r][c] -= factor * m[col][c]
    return int(result)

def count_spanning_trees(node_count, edges):
    laplacian = [[0] * node_count for _ in range(node_count)]
    for a, b in edges:
        laplacian[a][a] += 1
        laplacian[b][b] += 1
        laplacian[a][b] -= 1
        laplacian[b][a] -= 1
    minor = [row[:-1] for row in laplacian[:-1]]    # drop the last row and column
    return determinant(minor)

triangle = [(0, 1), (1, 2), (0, 2)]
square = [(0, 1), (1, 2), (2, 3), (3, 0)]
complete4 = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]
print(count_spanning_trees(3, triangle))  # 3
print(count_spanning_trees(4, square))  # 4
print(count_spanning_trees(4, complete4))  # 16
print(count_spanning_trees(4, [(0, 1), (2, 3)]))  # 0
```

The last one has two separate pieces, so it can't have a spanning tree, and the formula correctly gives 0.

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Building the Laplacian | O(V²) | A table of V by V |
| Determinant | O(V³) | Gaussian elimination |
| Total | O(V³) | |
| Space | O(V²) | |

The count can be astronomically large, yet the time is only `O(V³)`. There is no need to list a single tree.

## Handling Variations

- **Repeated edges:** the formula handles them, by subtracting 1 for each copy.
- **Weighted edges:** use the weight in place of 1. The result is the sum, over all spanning trees, of the product of their edge weights.
- **Checking connectivity:** a result of 0 means the graph isn't connected.

## Cayley's Formula

For a complete graph of `n` nodes, the answer has a simple form: `n^(n-2)` spanning trees. For 4 nodes, that is `4² = 16`, which matches the code.

## Common Mistakes

- **Taking the determinant of the full Laplacian.** It is always 0. You must remove a row and a column first.
- **Removing different numbered rows and columns.** Remove the same number from both.
- **Using floating-point numbers.** The answer is an exact integer, and rounding errors can make it wrong. Use fractions, or arithmetic with a prime modulus.
- **Forgetting that it counts, and doesn't find.** To find a cheapest spanning tree, use [[Kruskal's Algorithm]].
