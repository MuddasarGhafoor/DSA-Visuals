> Choosing the most non-overlapping activities, by always taking the one that finishes first.

## What It Is

You have one room, and many events that each have a start time and a finish time. Two events can't overlap. How many can you fit in?

That is the **activity selection problem**. It has a simple, elegant solution: **always pick the event that finishes earliest**, because that leaves the most time for everything else.

## How It Works

1. Sort the activities by finish time.
2. Take the first activity.
3. Go through the rest in order. Take an activity if it starts at or after the finish time of the last one taken.

## Worked Example

The activities below are already sorted by finish time.

| Activity | Start | Finish | Compatible with the Last Taken? | Decision |
| --- | --- | --- | --- | --- |
| A | 1 | 4 | Nothing taken yet | Take |
| B | 3 | 5 | 3 < 4, so no | Skip |
| C | 0 | 6 | 0 < 4, so no | Skip |
| D | 5 | 7 | 5 ≥ 4, so yes | Take |
| E | 3 | 9 | 3 < 7, so no | Skip |
| F | 6 | 10 | 6 < 7, so no | Skip |
| G | 8 | 11 | 8 ≥ 7, so yes | Take |
| H | 2 | 14 | 2 < 11, so no | Skip |
| I | 12 | 16 | 12 ≥ 11, so yes | Take |

The result is A, D, G, I, which is 4 activities.

## Code

```python
def select_activities(activities):
    chosen = []
    last_finish = float("-inf")
    for name, start, finish in sorted(activities, key=lambda a: a[2]):
        if start >= last_finish:
            chosen.append(name)
            last_finish = finish
    return chosen

activities = [("A", 1, 4), ("B", 3, 5), ("C", 0, 6), ("D", 5, 7), ("E", 3, 9),
              ("F", 6, 10), ("G", 8, 11), ("H", 2, 14), ("I", 12, 16)]
print(select_activities(activities))  # ['A', 'D', 'G', 'I']
```

## Why It Works

This is the classic **exchange argument**. Take any best schedule, and look at its first activity.

Suppose it isn't the one that finishes earliest, `A`. Swap it for `A`. Since `A` finishes no later, it can't clash with anything else in the schedule. The schedule still has the same number of activities, so it is still a best one.

So there is always a best schedule that starts with `A`. Remove `A` and everything that overlaps it, and the same reasoning applies to what is left.

## Other Greedy Rules That Fail

This is why you need the proof, and shouldn't just trust a rule that seems sensible.

| Rule | Why It Fails |
| --- | --- |
| Earliest start | One long event that starts first can block many short ones |
| Shortest duration | A short event can overlap two others that would fit together |
| Fewest overlaps | There are examples where it gives a worse answer too |

### An Example of Shortest Duration Failing

```text
A: [0----3]          B: [3----6]
         C: [2--4]
```

The shortest is C, which blocks both A and B, giving 1 activity. Earliest finish takes A and then B, giving 2.

## Complexity

| Step | Time |
| --- | --- |
| Sorting by finish time | O(n log n) |
| The scan | O(n) |
| Total | O(n log n), or O(n) if already sorted |
| Space | O(n) for the sorted copy |

## When Activities Have Different Values

If some activities are worth more than others, the greedy rule stops working, because one valuable long event might beat several short ones. That version needs dynamic programming. See [[Weighted Job Scheduling]].

| Version | Goal | Method |
| --- | --- | --- |
| Activity selection | Most activities | Greedy, earliest finish |
| [[Weighted Job Scheduling]] | Highest total value | Dynamic programming |
| [[Job Sequencing]] | Highest profit, with deadlines | Greedy, highest profit first |

## Common Mistakes

- **Sorting by start time.** That is the most common error. Sort by **finish** time.
- **Using `>` where touching is allowed.** If one event can start the moment another ends, use `>=`. Check the problem's rule.
- **Applying it to weighted problems.** Counting and maximizing value are different problems.
