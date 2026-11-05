> Choosing non-overlapping jobs for the highest total profit, using dynamic programming and binary search.

## What It Is

Each job has a start time, a finish time, and a profit. You can only do one job at a time. Which set of non-overlapping jobs earns the most?

Without profits, this is [[Activity Selection]], and a simple greedy rule solves it. With profits, that rule fails.

## Why Greedy Fails

Here, taking the job that finishes first gives far less than the best answer.

| Job | Start | Finish | Profit |
| --- | --- | --- | --- |
| A | 1 | 2 | 50 |
| B | 3 | 5 | 20 |
| C | 6 | 19 | 100 |
| D | 2 | 100 | 200 |

| Method | Jobs | Profit |
| --- | --- | --- |
| Earliest finish first | A, B, C | 170 |
| **Best** | A, D | **250** |

Taking the highest profit first also fails in other cases, since one big job can block several that are worth more together.

## The Key Idea

Sort the jobs by finish time. Then for each job, there are just two choices:

- **Skip it.** The answer is the best using the earlier jobs.
- **Take it.** You earn its profit, plus the best from jobs that finish before it starts.

Let `best[i]` be the highest profit using the first `i` jobs, in order of finish time. Let `p(i)` be how many jobs finish no later than job `i` starts.

```text
best[0] = 0
best[i] = max( best[i - 1],                   skip job i
               profit[i] + best[p(i)] )       take job i
```

Because the jobs are sorted by finish time, you can find `p(i)` with a [[Binary Search]].

## Worked Example

Sorted by finish time:

| i | Job | Start | Finish | Profit | Earlier Jobs That Fit | p(i) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | A | 1 | 2 | 50 | None | 0 |
| 2 | B | 3 | 5 | 20 | A | 1 |
| 3 | C | 6 | 19 | 100 | A, B | 2 |
| 4 | D | 2 | 100 | 200 | A | 1 |

Now fill in `best`.

| i | Skip: best[i-1] | Take: profit + best[p(i)] | best[i] |
| --- | --- | --- | --- |
| 1 | 0 | 50 + 0 = 50 | 50 |
| 2 | 50 | 20 + 50 = 70 | 70 |
| 3 | 70 | 100 + 70 = 170 | 170 |
| 4 | 170 | 200 + 50 = 250 | **250** |

## Code

```python
from bisect import bisect_right

def weighted_jobs(jobs):
    # Each job is (start, finish, profit).
    jobs = sorted(jobs, key=lambda job: job[1])
    finishes = [job[1] for job in jobs]
    best = [0] * (len(jobs) + 1)
    took = [False] * (len(jobs) + 1)
    earlier = [0] * (len(jobs) + 1)
    for i, (start, finish, profit) in enumerate(jobs, 1):
        # How many of the earlier jobs finish by this job's start.
        p = bisect_right(finishes, start, 0, i - 1)
        earlier[i] = p
        best[i] = best[i - 1]
        if profit + best[p] > best[i]:
            best[i] = profit + best[p]
            took[i] = True

    chosen = []
    i = len(jobs)
    while i > 0:
        if took[i]:
            chosen.append(jobs[i - 1])
            i = earlier[i]
        else:
            i -= 1
    return best[-1], chosen[::-1]

jobs = [(3, 5, 20), (1, 2, 50), (6, 19, 100), (2, 100, 200)]
print(weighted_jobs(jobs))  # (250, [(1, 2, 50), (2, 100, 200)])
```

## Complexity

| Step | Time |
| --- | --- |
| Sorting | O(n log n) |
| One binary search for each job | O(n log n) |
| Filling the table | O(n) |
| Total | O(n log n) |
| Space | O(n) |

Without binary search, finding `p(i)` by scanning makes it `O(n²)`.

## Touching Times

Decide whether a job can start exactly when another ends. The code above allows it, since `bisect_right` includes jobs that finish exactly at the start time. If that isn't allowed, use `bisect_left`.

## Related Problems

| Problem | Jobs Have | Goal | Method |
| --- | --- | --- | --- |
| [[Activity Selection]] | Fixed times | Most jobs | [[Greedy Algorithms\|Greedy]] |
| Weighted job scheduling | Fixed times and profits | Most profit | Dynamic programming |
| [[Job Sequencing]] | Deadlines and profits, length 1 | Most profit | Greedy |

Notice that setting every profit to 1 turns this into activity selection. The dynamic programming still works there, it is just more than that problem needs.

## The Same Pattern Elsewhere

"Take it or skip it, then jump to the last compatible choice" appears in many problems. It is the same shape as the [[0/1 Knapsack]], with `p(i)` taking the place of the reduced capacity.

## Common Mistakes

- **Using a greedy rule.** It works only when all profits are equal.
- **Sorting by start time.** The recurrence relies on all compatible earlier jobs forming a prefix of the sorted list, which only finish-time order guarantees.
- **Taking `i - 1` for the previous job when taking a job.** That job may overlap. You must jump to `p(i)`.
- **A binary search range that includes the job itself.** Search only among the earlier jobs. A job shouldn't count as compatible with itself.
