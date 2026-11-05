> Choosing the best move in a two-player game, by assuming your opponent will also play their best.

## What It Is

In a two-player game such as tic-tac-toe or chess, a good move depends on what your opponent will do next. **Minimax** handles this by assuming **your opponent always plays their best move**, and choosing your move with that in mind.

It looks ahead at every possible sequence of moves, and picks the move whose **worst outcome is the best**.

## The Two Players

Each final position has a score from your point of view.

| Player | Goal | At Their Turn |
| --- | --- | --- |
| **Max** (you) | Make the score high | Picks the child with the highest score |
| **Min** (your opponent) | Make the score low | Picks the child with the lowest score |

Scores are passed up the tree, level by level. In tic-tac-toe, you might use +1 for a win, 0 for a draw, and -1 for a loss.

## Worked Example

It is your turn at the top, and you have two moves. Your opponent then answers, leading to the scores at the bottom.

```text
             MAX
           /     \
        MIN       MIN
        / \       / \
       3   5     2   9
```

Work from the bottom up:

1. **Left MIN** chooses between 3 and 5, and picks **3**.
2. **Right MIN** chooses between 2 and 9, and picks **2**.
3. **MAX** chooses between 3 and 2, and picks **3**.

So you take the left move, for a guaranteed score of 3. The 9 looks tempting, but your opponent would never let you have it.

## Code

Here, a leaf is a number, and a node is a list of its children.

```python
def minimax(node, maximizing):
    if not isinstance(node, list):
        return node
    scores = [minimax(child, not maximizing) for child in node]
    return max(scores) if maximizing else min(scores)

print(minimax([[3, 5], [2, 9]], True))  # 3
print(minimax([[[1, 2], [3, 4]], [[5, 6], [7, 8]]], True))  # 6
```

## Worked Example: Tic-Tac-Toe

The real version is the same idea, plus the rules of the game.

```python
LINES = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]

def winner(board):
    for a, b, c in LINES:
        if board[a] != " " and board[a] == board[b] == board[c]:
            return board[a]
    return None

def score(board, player):
    won = winner(board)
    if won == "X":
        return 1
    if won == "O":
        return -1
    if " " not in board:
        return 0                         # a draw
    results = []
    for i in range(9):
        if board[i] == " ":
            board[i] = player            # try the move
            results.append(score(board, "O" if player == "X" else "X"))
            board[i] = " "               # undo it
    return max(results) if player == "X" else min(results)

# X to play, and X can win at once in the top row.
print(score(list("XX OO    "), "X"))  # 1
# With perfect play from an empty board, the game is always a draw.
print(score(list(" " * 9), "X"))  # 0
```

The try-and-undo pattern is the same as in [[Backtracking]].

## Complexity

With `b` moves per position and a search depth of `d`:

| Measure | Cost |
| --- | --- |
| Time | O(b^d) |
| Space | O(d), the recursion depth |

That grows fast.

| Game | Moves per Turn | Typical Length | Positions |
| --- | --- | --- | --- |
| Tic-tac-toe | About 5 | 9 | Fewer than 10⁶ |
| Chess | About 35 | 80 | About 10¹²³ |
| Go | About 250 | 150 | About 10³⁶⁰ |

## Handling Big Games

Real games have far too many positions to search. Two ideas make it practical.

### Limit the Depth

Stop searching after a few moves, and estimate the position with an **evaluation function**. In chess, that might add up the value of each side's pieces. The result is only as good as the estimate.

### Skip Branches

[[Alpha-Beta Pruning]] gives the same answer as minimax while skipping large parts of the tree, often allowing a search twice as deep.

These are combined with [[Iterative Deepening DFS]], so that an answer is ready whenever time runs out.

## Which Games It Fits

Minimax applies to games that are:

- **Two-player.** One player's gain is the other's loss.
- **Turn-based.**
- **Fully visible.** There are no hidden cards.
- **Without chance.** Dice need a variation called expectimax.

## Common Mistakes

- **Scoring from the wrong side.** All scores must be from one player's point of view, or the max and min levels make no sense.
- **Forgetting to undo moves.** Changes made during the search must be reversed, or later branches see a wrong board.
- **Assuming a poor opponent.** Minimax expects the best play, so against a weak opponent it may not take a chance on a bigger win.
- **Preferring a slow win.** All wins can look equal. Adjust the score by depth, so a faster win scores higher.
