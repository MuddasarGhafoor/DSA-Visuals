> Choosing which timed jobs to do for the highest profit, by taking the most valuable ones first.

## What It Is

You have a set of jobs. Each one takes **one unit of time**, has a **deadline**, and earns a **profit** if it finishes by its deadline. You can do only one job at a time. Which jobs should you do, and in what order, to earn the most?

## The Key Idea

Take jobs from the **most profitable to the least**. For each one, place it in the **latest free time slot** on or before its deadline.

Choosing the latest slot keeps the earlier slots free for jobs with tighter deadlines. A job that could run at time 3 shouldn't use up time 1.

## How It Works

1. Sort the jobs by profit, highest first.
2. For each job, look for a free slot, starting at its deadline and going backward.
3. If you find one, schedule the job there. If not, skip it.

## Worked Example

| Job | Deadline | Profit |
| --- | --- | --- |
| A | 2 | 100 |
| B | 1 | 19 |
| C | 2 | 27 |
| D | 1 | 25 |
| E | 3 | 15 |

Sorted by profit: A, C, D, B, E.

| Job | Deadline | Slots Tried | Result | Slots 1, 2, 3 |
| --- | --- | --- | --- | --- |
| A (100) | 2 | 2 | Slot 2 | \_, A, \_ |
| C (27) | 2 | 2, 1 | Slot 1 | C, A, \_ |
| D (25) | 1 | 1 | Nothing free, so skip it | C, A, \_ |
| B (19) | 1 | 1 | Nothing free, so skip it | C, A, \_ |
| E (15) | 3 | 3 | Slot 3 | C, A, E |

The schedule is C, A, E, with a total profit of 27 + 100 + 15 = **142**.

## Code

```python
def job_sequencing(jobs):
    latest = max(deadline for _, deadline, _ in jobs)
    slots = [None] * (latest + 1)         # slot 0 isn't used
    total = 0
    for name, deadline, profit in sorted(jobs, key=lambda job: -job[2]):
        for t in range(deadline, 0, -1):
            if slots[t] is None:
                slots[t] = name
                total += profit
                break
    return total, [job for job in slots[1:] if job]

jobs = [("A", 2, 100), ("B", 1, 19), ("C", 2, 27), ("D", 1, 25), ("E", 3, 15)]
print(job_sequencing(jobs))  # (142, ['C', 'A', 'E'])
```

## Why It Works

This is an exchange argument. Suppose a best schedule leaves out a profitable job `X` that could have fit, and includes a less profitable job `Y` instead. Swapping `Y` for `X` raises the profit, so that schedule couldn't have been the best.

Placing jobs as late as possible means a job only blocks a slot that other jobs are less likely to need.

## Complexity

| Version | Time | Why |
| --- | --- | --- |
| Simple scan, as above | O(n²) | Each job may scan back through all the slots |
| With [[Union-Find]] | O(n log n) | Finding the latest free slot becomes almost instant |
| Space | O(n) | The slots |

### Faster With Union-Find

[[Union-Find]] can track "the latest free slot at or before `t`". Each slot starts as its own group. When a slot is filled, it is merged with the slot before it. Now `find(t)` jumps straight to the answer, with no scanning.

```python
def job_sequencing_fast(jobs):
    latest = max(deadline for _, deadline, _ in jobs)
    parent = list(range(latest + 1))
    def find(t):
        if parent[t] != t:
            parent[t] = find(parent[t])
        return parent[t]
    total = 0
    for _, deadline, profit in sorted(jobs, key=lambda job: -job[2]):
        slot = find(deadline)
        if slot > 0:                 # slot 0 means nothing is free
            total += profit
            parent[slot] = slot - 1
    return total

print(job_sequencing_fast([("A", 2, 100), ("B", 1, 19), ("C", 2, 27), ("D", 1, 25), ("E", 3, 15)]))  # 142
```

## Related Scheduling Problems

| Problem | Jobs Have | Goal | Method |
| --- | --- | --- | --- |
| Job sequencing | A deadline, a profit, and a length of 1 | Most profit | Greedy |
| [[Activity Selection]] | A fixed start and finish | Most jobs | Greedy |
| [[Weighted Job Scheduling]] | A fixed start, finish, and profit | Most profit | Dynamic programming |

Note that the unit-time rule matters. If jobs have different lengths, the greedy method no longer works in general, and the problem becomes much harder.

## Common Mistakes

- **Placing jobs in the earliest slot.** That can use up a slot needed by a job with a tighter deadline. Fill from the deadline backward.
- **Sorting by deadline.** Sort by profit, so the most valuable jobs get first choice.
- **An off-by-one in the slots.** A deadline of 2 means slots 1 and 2 are both allowed.
- **Forgetting to allow for larger deadlines.** Size the slots using the largest deadline, not the number of jobs.
