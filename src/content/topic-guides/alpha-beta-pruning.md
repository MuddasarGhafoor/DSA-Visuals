> Speeding up minimax by skipping branches that can't change the final decision.

## What It Is

[[Minimax]] finds the best move in a game by checking every possible future. That number of futures grows exponentially, so it soon becomes too slow.

**Alpha-beta pruning** gives the **exact same answer**, while skipping large parts of the tree. It notices when a branch can't possibly affect the final decision, and it stops looking at that branch.

## The Key Idea

Imagine you are choosing between two boxes, and your opponent will then give you the worst item from the box you pick.

- **Box A** holds items worth 3 and 5. Your opponent would give you 3.
- **Box B**'s first item is worth 2.

You can stop looking in Box B right now. Your opponent could give you 2 or less from it, and you already have a guaranteed 3 from Box A. Whatever else is in Box B doesn't matter.

## Alpha and Beta

Two numbers track what each player can already guarantee:

| Value | Meaning | Starts At |
| --- | --- | --- |
| Alpha | The best score the maximizer can already guarantee | -∞ |
| Beta | The best score the minimizer can already guarantee | +∞ |

**When alpha ≥ beta, stop searching this branch.** One of the players already has a better option elsewhere, so play would never reach here.

- Maximizer nodes raise alpha.
- Minimizer nodes lower beta.

## Worked Example

The tree has the maximizer at the root, and minimizers below it. Leaves are written as lists.

```text
           MAX
         /     \
      MIN       MIN
      / \       / \
     3   5     2   9
```

| Visit | At | alpha | beta | What Happens |
| --- | --- | --- | --- | --- |
| Leaf 3 | Left MIN | -∞ | 3 | MIN lowers beta to 3 |
| Leaf 5 | Left MIN | -∞ | 3 | 5 isn't lower, so it returns 3 |
| | Root MAX | 3 | ∞ | MAX raises alpha to 3 |
| Leaf 2 | Right MIN | 3 | 2 | Beta drops to 2, and now alpha ≥ beta |
| Leaf 9 | | | | **Skipped** |

The root's answer is `max(3, 2) = 3`, the same as plain minimax, using only 3 of the 4 leaves.

## Code

Leaves are numbers, and a list is a node with children.

```python
def alpha_beta(node, maximizing, alpha, beta, visited):
    if not isinstance(node, list):
        visited.append(node)
        return node
    if maximizing:
        best = float("-inf")
        for child in node:
            best = max(best, alpha_beta(child, False, alpha, beta, visited))
            alpha = max(alpha, best)
            if alpha >= beta:
                break                  # the minimizer above won't allow this
        return best
    best = float("inf")
    for child in node:
        best = min(best, alpha_beta(child, True, alpha, beta, visited))
        beta = min(beta, best)
        if alpha >= beta:
            break                      # the maximizer above won't allow this
    return best

visited = []
print(alpha_beta([[3, 5], [2, 9]], True, float("-inf"), float("inf"), visited))  # 3
print(visited)  # [3, 5, 2]
```

## Complexity

With `b` moves per position and a search depth of `d`:

| Case | Leaves Visited | When |
| --- | --- | --- |
| Worst | b^d, the same as minimax | The worst moves are tried first |
| Best | About b^(d/2) | The best moves are tried first |

The best case is dramatic: it lets you search **twice as deep** in the same time. With 35 moves per position in chess, depth 6 goes from about 1.8 billion positions to about 43,000.

## Move Ordering

Pruning works best when good moves come first, since they tighten alpha and beta early. Common ways to improve the order:

- **Captures first,** in chess-like games.
- **The best move from a shallower search.** This combines well with [[Iterative Deepening DFS]].
- **Moves that caused cutoffs elsewhere.**

## Is It Safe?

Yes. A skipped branch can't change the value at the root, so alpha-beta always returns the same result as [[Minimax]]. It only skips work, and doesn't guess. It is not a heuristic.

## Common Mistakes

- **Passing the wrong bounds down.** Each child receives the current alpha and beta. Update them as the loop goes, and don't reuse the starting values.
- **Updating the wrong value.** Maximizer nodes change alpha. Minimizer nodes change beta.
- **Returning alpha or beta in place of the node's value.** It can work in careful forms, but it easily causes bugs. Returning `best` is simplest.
- **Ignoring move order.** Without good ordering, you may get little benefit.
