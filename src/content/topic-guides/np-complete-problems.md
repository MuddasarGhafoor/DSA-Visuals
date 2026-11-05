> The hardest problems in NP: a fast solution to any one of them would give a fast solution to all of them.

## What It Is

A problem is **NP-complete** if both of these are true:

1. **It is in NP.** A proposed answer can be checked quickly, in polynomial time.
2. **It is NP-hard.** Every problem in NP can be converted into it quickly.

Together, these make NP-complete problems the hardest problems in NP. They also tie them together: find a fast algorithm for one, and you have a fast algorithm for all of them. Nobody has found one for any of them, and most researchers believe none exists. See [[P vs NP]].

## Famous Examples

All of these are written as yes-or-no questions, which is the standard form.

| Problem | The Question | A Checkable Answer |
| --- | --- | --- |
| SAT | Can this logic formula be made true? | True or false for each variable |
| Vertex Cover | Can k nodes touch every edge? | The k nodes |
| Independent Set | Are there k nodes with no edges between them? | The k nodes |
| Hamiltonian Cycle | Is there a cycle through every node exactly once? | The order of nodes |
| Traveling Salesperson | Is there a tour of length at most L? | The order of cities |
| [[Subset Sum]] | Does some subset add up to T? | The subset |
| [[Graph Coloring]] | Can k colors color this graph with no clashes? | A color for each node |

## Checking Is Easy

Finding an answer may take a huge search, but checking one is quick. That is what "in NP" means.

```python
def is_vertex_cover(edges, cover, k):
    if len(cover) > k:
        return False
    return all(u in cover or v in cover for u, v in edges)

def is_subset_sum(values, chosen, target):
    return set(chosen) <= set(values) and sum(chosen) == target

edges = [(1, 2), (2, 3), (3, 4)]
print(is_vertex_cover(edges, {2, 3}, 2))  # True
print(is_vertex_cover(edges, {1, 4}, 2))  # False
print(is_subset_sum([3, 7, 1, 8], [7, 1], 8))  # True
```

## How to Prove a Problem Is NP-Complete

The first NP-complete problem, SAT, was proved by the **Cook-Levin theorem** in 1971. After that, there is a much easier route, called a **reduction**:

1. **Show it is in NP.** Describe a short answer and a fast way to check it.
2. **Pick a known NP-complete problem**, such as 3-SAT.
3. **Convert it.** Give a fast way to turn any instance of the known problem into an instance of your problem, so that the answers match.

The direction matters: you reduce the known hard problem **to** your problem. That shows yours is at least as hard.

### Example: Independent Set to Vertex Cover

In any graph, a set of nodes is independent exactly when all the *other* nodes form a vertex cover. If no edge lies inside the set, every edge must touch a node outside it.

So a graph with `n` nodes has an independent set of size `k` exactly when it has a vertex cover of size `n - k`. That one fast conversion proves Vertex Cover is at least as hard as Independent Set.

## What to Do With One in Practice

Being NP-complete doesn't mean giving up. It means you shouldn't expect a perfect, fast, general solution.

| Approach | The Idea | Example |
| --- | --- | --- |
| Small inputs | An exponential search is fine if `n` is small | [[Backtracking]] for 20 items |
| Special cases | Your inputs may be easier than the general problem | [[Graph Coloring]] with 2 colors is easy |
| Approximation | Accept an answer that is provably close | A 2-approximation for Vertex Cover |
| Heuristics | Accept a good answer with no guarantee | [[Hill Climbing]] |
| Pseudo-polynomial | Fast when the numbers are small | [[Subset Sum]] and [[0/1 Knapsack]] with dynamic programming |

## NP-Hard and NP-Complete

An **NP-hard** problem is at least as hard as everything in NP, but it doesn't have to be in NP itself. "Find the shortest tour" is NP-hard. Its yes-or-no version, "is there a tour of length at most L?", is NP-complete, because a tour can be checked quickly, and it is hard to check that a tour is the very shortest.

## Common Mistakes

- **Reducing in the wrong direction.** Showing your problem converts to a hard problem proves nothing, because an easy problem can do that too.
- **Calling NP-complete problems impossible.** They can be solved. The issue is that known exact methods take too long on large inputs.
- **Assuming a small change keeps it hard.** Finding a cycle through every *node* is NP-complete, but finding a cycle through every *edge* (an Euler circuit) is easy.
