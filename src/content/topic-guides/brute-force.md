> Trying every possibility and keeping the best, the simple starting point for any problem.

## What It Is

**Brute force** solves a problem by trying every possible answer and checking each one. It uses no clever insight, only the computer's speed.

To open a 3-digit lock, try 000, then 001, then 002, and so on, up to 999. It may take a while, but it is certain to work.

## How It Works

1. **List** every possible answer.
2. **Check** whether each one is valid, or how good it is.
3. **Keep** the best one, or stop at the first valid one.

## Worked Example: Two Numbers That Add Up to a Target

Find two values in a list that add up to 9. Brute force checks every pair.

```python
def two_sum(values, target):
    for i in range(len(values)):
        for j in range(i + 1, len(values)):
            if values[i] + values[j] == target:
                return i, j
    return None

print(two_sum([2, 7, 11, 15], 9))  # (0, 1)
```

There are `n(n - 1) / 2` pairs, so it takes `O(n²)`. A [[Hash Tables|hash table]] solves this in `O(n)`, and that is typical: brute force gives you something to improve on.

## Worked Example: The Traveling Salesperson

A salesperson must visit every city once and return home, as cheaply as possible. No fast method is known for this. See [[NP-Complete Problems]].

```python
from itertools import permutations

def shortest_tour(distances):
    cities = range(1, len(distances))
    best = float("inf")
    for order in permutations(cities):
        total = 0
        current = 0
        for city in order:
            total += distances[current][city]
            current = city
        total += distances[current][0]       # return home
        best = min(best, total)
    return best

distances = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
]
print(shortest_tour(distances))  # 80
```

Here, 4 cities give only 6 orders. But with 20 cities there are about 10¹⁷, which would take years. This is the weakness of brute force: **the number of possibilities explodes**.

## How Big It Gets

| What You Are Trying | Count | For n = 20 |
| --- | --- | --- |
| All pairs | n² / 2 | 190 |
| All triples | n³ / 6 | 1,140 |
| All subsets | 2ⁿ | About 1 million |
| All orderings | n! | About 2.4 × 10¹⁸ |

See [[Big-O Growth Comparison]] for how long each takes.

## Why Learn It

Even though it is often too slow, it is valuable:

- **It is a starting point.** Write the simple version first, then look for wasted work. Most faster algorithms come from noticing what brute force repeats.
- **It is easy to get right.** There is little room for clever bugs.
- **It checks other code.** Run your fast solution and the brute force on thousands of small random inputs, and compare the results. This finds bugs very reliably.
- **It may be enough.** If `n` is small, the simple solution is often the best engineering choice.
- **It may be the only way.** Some problems have no known fast method.

## Making It Faster

| If You Notice That... | Try |
| --- | --- |
| Partial answers can fail early | [[Backtracking]] |
| The same subproblems repeat | [[Memoization vs Tabulation\|Dynamic programming]] |
| The problem splits into independent parts | [[Divide and Conquer]] |
| A simple rule always picks well | [[Greedy Algorithms]] |
| You keep looking values up | A [[Hash Tables\|hash table]] |
| You keep searching sorted data | [[Binary Search]] |

## Example: Checking a Fast Solution

Here, a fast solution is compared against brute force on random inputs.

```python
import random

def max_pair_brute(values):
    return max(a + b for i, a in enumerate(values) for b in values[i + 1:])

def max_pair_fast(values):
    first, second = sorted(values)[-2:]
    return first + second

random.seed(1)
agree = all(
    max_pair_brute(v) == max_pair_fast(v)
    for v in ([random.randint(-50, 50) for _ in range(8)] for _ in range(500))
)
print(agree)  # True
```

## Common Mistakes

- **Stopping at brute force when `n` is large.** Check the limits first. With `n = 100,000`, an `O(n²)` solution won't finish.
- **Skipping it entirely.** Going straight to a clever solution often produces a bug, with nothing to check it against.
- **Missing a possibility.** Brute force is only correct if it really covers every case, including the empty one and the last one.
