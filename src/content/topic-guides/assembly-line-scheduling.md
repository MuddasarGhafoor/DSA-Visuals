> Finding the fastest route through two parallel assembly lines, with a cost for switching between them.

## What It Is

A factory has **two assembly lines**, each with the same `n` stations in the same order. A product must pass through station 1, then station 2, and so on, in either line. Each station takes a different amount of time on each line.

The product can stay on its line for free, or **switch** to the other line for a transfer cost. There is also a cost for entering and for leaving each line.

**What is the fastest way through the factory?**

```text
          a1,1      a1,2      a1,3
enter -> [ 7 ] --> [ 9 ] --> [ 3 ] -> leave
            \  t  /   \  t  /
             \   /     \   /
              \ /       \ /
              / \       / \
             /   \     /   \
enter -> [ 8 ] --> [ 5 ] --> [ 6 ] -> leave
          a2,1      a2,2      a2,3
```

This is a classic first example of dynamic programming, from older editions of the CLRS textbook.

## Why Trying Everything Fails

At each of the `n` stations you pick one of 2 lines, which gives `2ⁿ` possible routes. For 100 stations, that could never finish.

## The Key Idea

Think about the fastest way to reach station `j` on line 1. The product must have just come from station `j - 1`, and only two places are possible:

- **Line 1, station j - 1,** and it stayed on the line.
- **Line 2, station j - 1,** and it paid to switch.

You only need the best time to reach each of those. Whatever happened earlier doesn't matter any more. So:

```text
f1[j] = a1[j] + min( f1[j-1],  f2[j-1] + t2[j-1] )
f2[j] = a2[j] + min( f2[j-1],  f1[j-1] + t1[j-1] )
```

| Symbol | Meaning |
| --- | --- |
| `f1[j]`, `f2[j]` | Fastest time to finish station `j` on line 1 or line 2 |
| `a1[j]`, `a2[j]` | Time at station `j` on each line |
| `t1[j]` | Cost to switch from line 1 to line 2, after station `j` |
| `t2[j]` | Cost to switch from line 2 to line 1, after station `j` |
| `e1`, `e2`, `x1`, `x2` | Costs to enter and to leave each line |

The first station is just `f1[1] = e1 + a1[1]`, and the same for line 2. The final answer is the smaller of `f1[n] + x1` and `f2[n] + x2`.

## Worked Example

With 6 stations, entering costs 2 and 4, and leaving costs 3 and 2.

| Station | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Line 1 time | 7 | 9 | 3 | 4 | 8 | 4 |
| Line 2 time | 8 | 5 | 6 | 4 | 5 | 7 |
| Switch 1 → 2 after it | 2 | 3 | 1 | 3 | 4 | |
| Switch 2 → 1 after it | 2 | 1 | 2 | 2 | 1 | |

Filling in the table from left to right:

| Station | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| `f1` | 9 | 18 | 20 | 24 | 32 | 35 |
| `f2` | 12 | 16 | 22 | 25 | 30 | 37 |

To see one worked out, take `f1[2]`:

```text
stay on line 1:   f1[1] + 9     = 9 + 9      = 18
switch from 2:    f2[1] + 1 + 9 = 12 + 1 + 9 = 22
best = 18
```

Finally, line 1 finishes at `35 + 3 = 38`, and line 2 at `37 + 2 = 39`. The answer is **38**.

## Code

```python
def fastest_way(a1, a2, t1, t2, e1, e2, x1, x2):
    f1, f2 = e1 + a1[0], e2 + a2[0]
    line1, line2 = [1], [2]             # the best route to each line, so far
    for j in range(1, len(a1)):
        stay1, switch1 = f1 + a1[j], f2 + t2[j - 1] + a1[j]
        stay2, switch2 = f2 + a2[j], f1 + t1[j - 1] + a2[j]
        new_line1 = line1 + [1] if stay1 <= switch1 else line2 + [1]
        new_line2 = line2 + [2] if stay2 <= switch2 else line1 + [2]
        f1, f2 = min(stay1, switch1), min(stay2, switch2)
        line1, line2 = new_line1, new_line2
    if f1 + x1 <= f2 + x2:
        return f1 + x1, line1
    return f2 + x2, line2

time, route = fastest_way(
    [7, 9, 3, 4, 8, 4], [8, 5, 6, 4, 5, 7],
    [2, 3, 1, 3, 4], [2, 1, 2, 2, 1],
    2, 4, 3, 2,
)
print(time)  # 38
print(route)  # [1, 2, 1, 2, 2, 1]
```

The route reads: station 1 on line 1, station 2 on line 2, station 3 on line 1, stations 4 and 5 on line 2, and station 6 on line 1.

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(n) | Two calculations per station |
| Space, for the time only | O(1) | Only the last station's values are needed |
| Space, with the route | O(n) | To remember each decision |

Compare `O(n)` with `2ⁿ` routes: this is what dynamic programming buys.

## It Is Really a Shortest Path

Each station is a node, and each move has a cost. The factory forms a DAG, so this is a shortest path problem in disguise. [[Dijkstra]] would solve it too, but this table is simpler, because the stations already come in a natural order.

## Why It Works

It has the two properties all dynamic programming needs:

- **Optimal substructure.** The fastest route through station `j` must use a fastest route to the station before it. Otherwise, you could swap in the faster route and improve the total.
- **Overlapping subproblems.** Both `f1[j]` and `f2[j]` rely on the same two values from the previous station.

## Common Mistakes

- **Charging the switch at the wrong index.** The transfer happens after station `j - 1`, so it uses `t[j - 1]`.
- **Using the wrong line's switch cost.** Coming from line 2 uses `t2`, and coming from line 1 uses `t1`.
- **Forgetting entry and exit costs.** Both can change which route wins.
- **Overwriting a value too early.** Compute both new values before replacing the old ones, because each depends on both old values.
