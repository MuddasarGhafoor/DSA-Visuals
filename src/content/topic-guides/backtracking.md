> Building a solution step by step, and undoing a step as soon as it can't lead anywhere.

## What It Is

**Backtracking** tries to build a solution one choice at a time. As soon as a partial solution breaks a rule, it undoes the last choice and tries a different one.

Think of walking through a maze. At each junction you pick a path. If you hit a dead end, you walk back to the last junction and try another way. You don't start over from the entrance.

It is much better than [[Brute Force]], because it throws away whole families of bad candidates at once: if a partial solution is already wrong, no solution built on it can be right.

## The Pattern

Nearly every backtracking solution has this same shape:

```text
def explore(partial):
    if partial is a complete solution:
        record it
        return
    for each possible next choice:
        if the choice is allowed:
            make the choice
            explore(partial)
            undo the choice      <- this is the backtrack
```

The three questions to ask are: what is a choice, when is it allowed, and when am I done?

## Worked Example: Permutations

List all the orderings of `[1, 2, 3]`. A choice means picking the next number, and it is allowed if that number hasn't been used.

```text
                        []
          /              |              \
        [1]             [2]             [3]
       /   \           /   \           /   \
    [1,2] [1,3]     [2,1] [2,3]     [3,1] [3,2]
      |     |         |     |         |     |
   [1,2,3] [1,3,2] [2,1,3] [2,3,1] [3,1,2] [3,2,1]
```

```python
def permutations(values):
    result = []
    current = []
    used = [False] * len(values)
    def explore():
        if len(current) == len(values):
            result.append(current[:])     # save a copy
            return
        for i, value in enumerate(values):
            if not used[i]:
                used[i] = True            # choose
                current.append(value)
                explore()                 # explore
                current.pop()             # undo
                used[i] = False
    explore()
    return result

print(permutations([1, 2, 3]))  # [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
```

## Worked Example: All Subsets

For each value, there are two choices: leave it out, or put it in.

```python
def subsets(values):
    result = []
    current = []
    def explore(i):
        if i == len(values):
            result.append(current[:])
            return
        explore(i + 1)                    # leave values[i] out
        current.append(values[i])         # put it in
        explore(i + 1)
        current.pop()                     # undo
    explore(0)
    return result

print(subsets([1, 2]))  # [[], [2], [1], [1, 2]]
```

## Pruning: Where the Speed Comes From

**Pruning** means cutting off a branch as soon as you know it can't work. The earlier you can cut, the better. For [[N-Queens]] with 8 queens, brute force would consider about 4.4 billion placements, while backtracking looks at only about 15,000 positions.

| Problem | The Pruning Check |
| --- | --- |
| [[N-Queens]] | Does this queen attack an earlier one? |
| [[Sum of Subsets]] | Has the total passed the target? |
| [[Graph Coloring]] | Does this node share a color with a neighbor? |
| Sudoku | Is this digit already in the row, column, or box? |
| Maze | Is this cell a wall, or already on the path? |

## Complexity

The worst case is usually exponential, and depends on the problem.

| Problem | Worst Case |
| --- | --- |
| Subsets | O(2ⁿ) |
| Permutations | O(n!) |
| [[Graph Coloring]] with k colors | O(k^V) |

Space is usually `O(depth)` for the recursion, not counting any stored results. Good pruning can make it far faster in practice, even though the worst-case bound stays the same.

## Backtracking vs Others

| | [[Brute Force]] | Backtracking | [[Memoization vs Tabulation\|Dynamic Programming]] |
| --- | --- | --- | --- |
| Tries | Every complete candidate | Partial candidates, with pruning | Each distinct subproblem once |
| Best for | Very small inputs | Listing all solutions | Counting or optimizing, with overlapping subproblems |

## Common Mistakes

- **Forgetting to undo.** Everything you change before the recursive call must be restored after it. This is the most common bug.
- **Saving a reference, not a copy.** Writing `result.append(current)` stores one list that later changes. Use `current[:]`.
- **Pruning too late.** Check a choice before going deeper. Checking only at the end is just brute force.
- **Using it where dynamic programming fits.** If the same subproblems keep repeating and you only need the best value, memoization will be far faster.
