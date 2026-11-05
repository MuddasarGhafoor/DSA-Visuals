> Moving a stack of disks between three pegs, a classic first example of recursive thinking.

## What It Is

You have three pegs and a stack of disks on the first peg, from largest at the bottom to smallest at the top. The goal is to move the whole stack to the third peg, following two rules:

1. Move one disk at a time, taking the top disk from a peg.
2. Never put a larger disk on a smaller disk.

```text
    |        |        |
   =|=       |        |
  ==|==      |        |
 ===|===     |        |
--------------------------
    A        B        C
```

## The Key Insight

It looks like a tricky puzzle until you think about the **largest disk**. To move it to C, two things must be true: it must be the only disk on A, and C must be empty. That means every other disk has to be on B.

So moving `n` disks from A to C breaks into three steps:

1. Move the top `n - 1` disks from A to B, using C as spare space.
2. Move the largest disk from A to C.
3. Move the `n - 1` disks from B to C, using A as spare space.

Steps 1 and 3 are the same puzzle with one fewer disk. That is recursion.

## Code

```python
def hanoi(n, source, target, spare, moves):
    if n == 0:
        return moves
    hanoi(n - 1, source, spare, target, moves)   # clear the way
    moves.append((source, target))               # move the largest
    hanoi(n - 1, spare, target, source, moves)   # put the rest on top
    return moves

print(hanoi(2, "A", "C", "B", []))  # [('A', 'B'), ('A', 'C'), ('B', 'C')]
print(len(hanoi(3, "A", "C", "B", [])))  # 7
print(len(hanoi(10, "A", "C", "B", [])))  # 1023
```

## Worked Example: Three Disks

Disk 1 is the smallest, and disk 3 is the largest.

| Move | Disk | From | To | Part of the Plan |
| --- | --- | --- | --- | --- |
| 1 | 1 | A | C | Step 1: moving two disks to B |
| 2 | 2 | A | B | Step 1 |
| 3 | 1 | C | B | Step 1 is finished |
| 4 | 3 | A | C | Step 2: the largest disk moves |
| 5 | 1 | B | A | Step 3: moving two disks to C |
| 6 | 2 | B | C | Step 3 |
| 7 | 1 | A | C | Done |

## How Many Moves It Takes

Moving `n` disks means moving `n - 1` disks twice, plus one more move:

```text
T(n) = 2 · T(n - 1) + 1,  with T(0) = 0
```

Expanding it gives 1, 3, 7, 15, 31, and so on, which is `T(n) = 2ⁿ - 1`. See [[Recurrences]] for how to solve this kind of equation.

### Why It Can't Be Done in Fewer Moves

The largest disk has to move at least once, and when it moves, all `n - 1` other disks must be on the spare peg. Getting them there and getting them off again takes at least `T(n - 1)` moves each. So `2ⁿ - 1` is the true minimum, not just what this method happens to use.

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(2ⁿ) | One step per move |
| Stack space | O(n) | The recursion goes `n` calls deep |
| Output | 2ⁿ - 1 moves | Must be listed, so nothing can do better |

The growth is dramatic. At one move per second, 64 disks would take about 585 billion years.

## Why It Is Taught

It shows the most important skill in recursion: **trusting the smaller call**. You don't trace the 7 moves in your head. You only need to see that if `n - 1` disks can be moved, then `n` disks can be moved too.

## Common Mistakes

- **Mixing up the peg arguments.** The spare peg changes on each call. In the first call the target becomes the spare, and in the second call the source becomes the spare.
- **Trying to work it out one move at a time.** Focus on the largest disk and the three steps.
- **Assuming it will run for large n.** The answer needs `2ⁿ - 1` moves, so this is only practical for small `n`.
