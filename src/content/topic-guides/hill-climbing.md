> Improving a solution with small changes until no nearby change helps.

## What It Is

**Hill climbing** finds a good solution by starting somewhere and making small improvements. At each step, it looks at nearby solutions, and moves to one that is better. When nothing nearby is better, it stops.

Imagine climbing a hill in thick fog. You can only feel the ground around your feet, so you keep stepping uphill. When every direction goes down, you stop, and you assume you are at the top.

It is a **heuristic**: fast and simple, and it usually gives a good answer, but it doesn't guarantee the best one.

## What You Need

| Part | Meaning | In the Traveling Salesperson Problem |
| --- | --- | --- |
| A solution | A complete answer | An order of cities |
| A score | How good it is | The total distance, lower is better |
| Neighbors | Small changes to a solution | Swap two cities in the order |

## How It Works

1. Start with any solution, often a random one.
2. Look at its neighbors.
3. If one is better, move to it, and go back to step 2.
4. If none is better, stop.

## Worked Example: Two Peaks

Each position has a height, and a neighbor is one step left or right.

```text
height:   1  3  5  4  2  6  9  7
index:    0  1  2  3  4  5  6  7
```

| Start | Path | Stops At | Height | Best Overall? |
| --- | --- | --- | --- | --- |
| Index 0 | 1 → 3 → 5 | Index 2 | 5 | No, stuck on a small peak |
| Index 4 | 2 → 6 → 9 | Index 6 | 9 | Yes |

From index 2, both neighbors are lower, so it stops, even though a higher peak exists nearby. This is the central weakness.

## Code

```python
def hill_climb(heights, start):
    current = start
    while True:
        neighbors = [i for i in (current - 1, current + 1) if 0 <= i < len(heights)]
        best = max(neighbors, key=lambda i: heights[i])
        if heights[best] <= heights[current]:
            return current             # nothing nearby is better
        current = best

def with_restarts(heights, starts):
    return max((heights[hill_climb(heights, s)] for s in starts))

heights = [1, 3, 5, 4, 2, 6, 9, 7]
print(heights[hill_climb(heights, 0)])  # 5
print(heights[hill_climb(heights, 4)])  # 9
print(with_restarts(heights, [0, 4]))  # 9
```

## Where It Gets Stuck

| Problem | What Happens | Picture |
| --- | --- | --- |
| **Local maximum** | Every neighbor is worse, but a better peak exists elsewhere | A small hill next to a mountain |
| **Plateau** | All neighbors have the same score, so there is no direction to go | A flat area |
| **Ridge** | The way up needs a move the neighbor rule can't make | A narrow diagonal ridge on a grid |

## Ways to Do Better

| Method | The Idea |
| --- | --- |
| **Random restarts** | Run it many times from random starts, and keep the best |
| **Sideways moves** | Allow a limited number of equal moves, to cross a plateau |
| **Stochastic hill climbing** | Pick randomly among the better neighbors |
| **First improvement** | Take the first better neighbor found, which is faster when there are many neighbors |
| **Accepting worse moves** | Sometimes step downhill to escape. This is the idea behind simulated annealing. |

Random restarts are simple, and they are very effective. They need only a few extra lines of code.

## Worked Example: N-Queens

Hill climbing can solve [[N-Queens]] for large boards, where an exact search would be far too slow.

- **Solution:** one queen per column, in any row.
- **Score:** the number of attacking pairs, where lower is better and 0 solves it.
- **Neighbor:** move one queen within its column.

```python
import random

def attacks(rows):
    count = 0
    for a in range(len(rows)):
        for b in range(a + 1, len(rows)):
            if rows[a] == rows[b] or abs(rows[a] - rows[b]) == b - a:
                count += 1
    return count

def solve_queens(n, tries=100):
    for _ in range(tries):
        rows = [random.randrange(n) for _ in range(n)]
        while True:
            options = [
                (attacks(rows[:c] + [r] + rows[c + 1:]), c, r)
                for c in range(n) for r in range(n) if r != rows[c]
            ]
            score, column, row = min(options)
            if score >= attacks(rows):
                break
            rows[column] = row
        if attacks(rows) == 0:
            return rows
    return None

random.seed(3)
print(attacks(solve_queens(8)))  # 0
```

## Complexity

The number of steps depends on the problem, and it is usually small.

| Measure | Cost |
| --- | --- |
| Each step | (Number of neighbors) × (cost to score one) |
| Memory | O(1) extra, just the current solution |

The low memory use is a major strength. Unlike [[BFS]] or [[A* Search]], it doesn't keep anything it has already visited.

## When to Use It

- **The problem is too large for an exact method,** such as [[NP-Complete Problems]].
- **A good answer is enough,** and it needn't be perfect.
- **Scores are easy to compute,** and small changes are natural.

Don't use it when you need a guaranteed best answer.

## Hill Climbing vs Greedy

They are similar, since neither looks back. A [[Greedy Algorithms|greedy algorithm]] **builds** a solution piece by piece. Hill climbing **improves** a complete solution, and it can keep going until it runs out of improvements.

## Common Mistakes

- **Trusting a single run.** One run often lands on a local maximum. Use restarts.
- **Looping forever on a plateau.** If you allow equal moves, set a limit on them.
- **Poor neighbors.** If each change is too large, the search is close to random. If it is too small, the search gets stuck.
