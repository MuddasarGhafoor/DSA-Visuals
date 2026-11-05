> The question of whether every problem with quickly checkable answers can also be solved quickly.

## What It Is

Some problems are easy to solve. Others seem hard to solve, yet a proposed answer is easy to check.

Think of a Sudoku puzzle. Filling in a blank grid can take a long search. But if someone hands you a finished grid, you can check every row, column, and box in moments.

**P vs NP** asks whether that gap is real: **if an answer can be checked quickly, can it also always be found quickly?** Nobody knows. It is one of the most famous open problems in computer science, and the Clay Mathematics Institute offers one million dollars for a proof either way.

## The Two Classes

Here, "quickly" means in **polynomial time**, such as `O(n)`, `O(n²)`, or `O(n³)`. The classes contain yes-or-no problems.

| Class | Stands For | Meaning | Example |
| --- | --- | --- | --- |
| P | Polynomial time | Can be **solved** quickly | Is this list sorted? Is there a path from A to B? |
| NP | Nondeterministic polynomial time | A yes answer can be **checked** quickly | Does some subset add up to T? |

> NP doesn't mean "not polynomial". It comes from an imaginary machine that could guess the right answer and then check it.

## How They Relate

Every problem in P is also in NP. If you can solve a problem quickly, you can check an answer quickly too, by solving it and comparing. So P is inside NP.

The open question is whether they are the same set.

```text
If P ≠ NP (what most researchers believe):

    +----------------------------+
    | NP                         |
    |   +------+    +---------+  |
    |   |  P   |    | NP-     |  |
    |   |      |    | complete|  |
    |   +------+    +---------+  |
    +----------------------------+

If P = NP, all three regions are the same set.
```

## Solving vs Checking in Code

For [[Subset Sum]], the only general approach known takes exponential time in the worst case, while checking takes just one pass.

```python
from itertools import combinations

def solve(values, target):
    # Tries every subset: up to 2^n of them.
    for size in range(len(values) + 1):
        for chosen in combinations(values, size):
            if sum(chosen) == target:
                return chosen
    return None

def check(chosen, target):
    # One pass: O(n).
    return sum(chosen) == target

answer = solve([3, 34, 4, 12, 5, 2], 9)
print(answer)  # (4, 5)
print(check(answer, 9))  # True
```

With 60 values, `solve` could need about 10¹⁸ tries, while `check` still needs at most 60 additions.

## Why It Matters

### If P = NP

Thousands of hard problems in scheduling, logistics, chip design, and biology would have fast solutions. Much of today's cryptography would also be at risk, because breaking a code is a problem whose answers can be checked quickly.

### If P ≠ NP

Then some problems really are hard, and no amount of cleverness will give a fast exact solution. Most researchers believe this is the case, though nobody has proved it.

## How Problems Can Look Similar but Differ

Small changes can move a problem from easy to apparently hard.

| In P (Easy) | NP-Complete (Hard) |
| --- | --- |
| Shortest path | Longest simple path |
| Cycle through every edge (Euler) | Cycle through every node (Hamiltonian) |
| Color a graph with 2 colors | Color a graph with 3 colors |
| 2-SAT | 3-SAT |

## Common Mistakes

- **Thinking NP means "cannot be solved quickly".** Everything in P is also in NP. NP only says that answers can be checked quickly.
- **Thinking NP-complete problems have been proved hard.** They are believed to be hard. Proving that any one of them needs more than polynomial time would settle P vs NP.
- **Mixing up hard and impossible.** These problems can all be solved, given enough time. Problems that no algorithm can solve at all, such as the halting problem, are a different category.
