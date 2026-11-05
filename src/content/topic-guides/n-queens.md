> Placing n queens on a chessboard so that none of them attack each other, a classic backtracking problem.

## What It Is

Place `n` chess queens on an `n × n` board so that no two attack each other. A queen attacks along its row, its column, and both diagonals.

Here is one of the 2 solutions for `n = 4`:

```text
. Q . .
. . . Q
Q . . .
. . Q .
```

The classic version uses a standard board with 8 queens, which has 92 solutions.

## Why Brute Force Fails

There are about 4.4 billion ways to place 8 queens on 64 squares. Checking them all would be very wasteful. Most of them fail right away, for example if two queens share a row.

[[Backtracking]] avoids this by never building on a position that is already wrong.

## The Key Insight

Exactly one queen must go in each row, since two in a row would attack each other. So you only have to choose **which column** for each row, and you can do that one row at a time.

1. Go to the next row.
2. Try each column. If a queen there isn't attacked by the queens above, place it, and move to the next row.
3. If no column works, go back to the previous row and move that queen.
4. If you place a queen in the last row, you have a solution.

## Worked Example: n = 4

| Step | Row | Action | Queens by Column |
| --- | --- | --- | --- |
| 1 | 0 | Place at column 0 | 0 |
| 2 | 1 | Columns 0 and 1 are attacked. Place at 2 | 0, 2 |
| 3 | 2 | Every column is attacked, so go back | 0, 2 |
| 4 | 1 | Move to column 3 | 0, 3 |
| 5 | 2 | Column 1 is safe | 0, 3, 1 |
| 6 | 3 | Every column is attacked, so go back | 0, 3, 1 |
| 7 | 2 | Nothing else works, so go back | 0, 3 |
| 8 | 1 | Nothing else works, so go back | 0 |
| 9 | 0 | Move to column 1 | 1 |
| 10 | 1 | Column 3 is safe | 1, 3 |
| 11 | 2 | Column 0 is safe | 1, 3, 0 |
| 12 | 3 | Column 2 is safe. **Solved** | 1, 3, 0, 2 |

## Checking Diagonals Quickly

Scanning the board for each check is slow. Instead, notice that all squares on a diagonal share a value:

```text
Going down and right: row - column is the same
Going down and left:  row + column is the same
```

So you can keep three sets: the used columns, the used `row - column` values, and the used `row + column` values. Each check then takes `O(1)`.

## Code

```python
def solve_queens(n):
    solutions = []
    columns = []
    used_cols, used_down, used_up = set(), set(), set()

    def place(row):
        if row == n:
            solutions.append(columns[:])
            return
        for col in range(n):
            if col in used_cols or row - col in used_down or row + col in used_up:
                continue                 # attacked, so prune this choice
            columns.append(col)
            used_cols.add(col)
            used_down.add(row - col)
            used_up.add(row + col)
            place(row + 1)
            columns.pop()                # undo everything
            used_cols.remove(col)
            used_down.remove(row - col)
            used_up.remove(row + col)

    place(0)
    return solutions

print(solve_queens(4))  # [[1, 3, 0, 2], [2, 0, 3, 1]]
print(len(solve_queens(6)))  # 4
print(len(solve_queens(8)))  # 92
```

## Solutions by Board Size

| n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Solutions | 1 | 0 | 0 | 2 | 10 | 4 | 40 | 92 | 352 | 724 |

Boards of size 2 and 3 have no solution at all.

## Complexity

| Measure | Cost |
| --- | --- |
| Time, upper bound | O(n!) |
| Space | O(n) |

The first row has `n` choices, the next has at most `n - 1` or fewer, and so on. In practice, pruning removes most of those. For 8 queens, only about 15,000 positions are visited.

## How Much Pruning Saves

| Approach for n = 8 | Positions Considered |
| --- | --- |
| Any 8 squares | About 4.4 billion |
| One queen per row | 16,777,216 |
| One per row and column | 40,320 |
| Backtracking, checking diagonals too | About 15,000 |

## Finding One Solution on a Large Board

To find just one solution for a very large `n`, an exact search is too slow. A randomized approach such as [[Hill Climbing]] can solve boards with thousands of queens in moments.

## Common Mistakes

- **Forgetting to undo.** All three sets and the list must be restored after the recursive call.
- **Mixing up the two diagonals.** One uses `row - col`, and the other uses `row + col`.
- **Checking only the row above.** A queen can attack from any earlier row, which the sets handle.
- **Saving the live list.** Store a copy with `columns[:]`, since the list keeps changing.
