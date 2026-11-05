> Building the binary search tree with the lowest average search cost, when some keys are searched more often than others.

## What It Is

A balanced [[Binary Search Tree]] is the best choice when every key is equally likely. But real searches aren't even. In a dictionary, "the" is looked up far more than "quark". If you know how often each key is searched, you should put the common ones **near the top**.

An **optimal BST** is the tree with the lowest total search cost, for known search frequencies.

## How the Cost Is Measured

A key at depth 1 (the root) takes 1 comparison, at depth 2 it takes 2, and so on.

```text
cost = sum of ( frequency of key × depth of key )
```

Take three keys in sorted order: 10 with frequency 34, 12 with frequency 8, and 20 with frequency 50.

| Root | Tree Shape | Cost |
| --- | --- | --- |
| 10 | 10 → 12 → 20 (a chain to the right) | 34×1 + 8×2 + 50×3 = 200 |
| 10 | 10 → 20 → 12 | 34×1 + 50×2 + 8×3 = 158 |
| 12 | 12, with 10 and 20 below | 8×1 + 34×2 + 50×2 = 176 |
| 20 | 20 → 10 → 12 | 50×1 + 34×2 + 8×3 = **142** |
| 20 | 20 → 12 → 10 | 50×1 + 8×2 + 34×3 = 168 |

The best tree has 20 at the top, because it is searched the most. Note that a perfectly balanced tree, the one with 12 at the root, isn't the best.

## Why Greedy Fails

Putting the most frequent key at the root seems natural, and it worked above. But it can fail, because the keys must stay in sorted order. A frequent key at one end of the order pushes all the others to one side, which can make the whole tree long and costly.

## The Key Idea

Some key must be the root. Once you pick it, all smaller keys go on the left, and all larger keys go on the right. Those are smaller versions of the same problem.

Let `cost[i][j]` be the lowest cost for the keys from `i` to `j`. If `r` is the root:

```text
cost[i][j] = min over r from i to j of:
             cost[i][r-1] + cost[r+1][j] + sum(freq[i..j])
```

### Why Add the Sum?

Placing a subtree under a root pushes every key in it one level deeper, which adds that key's frequency once. Including the root itself, that adds up to `sum(freq[i..j])`, whichever root you pick.

## Worked Example

With frequencies `[34, 8, 50]`, fill the table by range length.

| Range | Sum of Frequencies | Best Root | Cost |
| --- | --- | --- | --- |
| 10 | 34 | 10 | 34 |
| 12 | 8 | 12 | 8 |
| 20 | 50 | 20 | 50 |
| 10, 12 | 42 | 10 | 42 + 8 = 50 |
| 12, 20 | 58 | 20 | 58 + 8 = 66 |
| 10, 12, 20 | 92 | 20 | 92 + 50 = **142** |

For the full range, the options are:

| Root | Left Cost | Right Cost | Sum | Total |
| --- | --- | --- | --- | --- |
| 10 | 0 | 66 | 92 | 158 |
| 12 | 34 | 50 | 92 | 176 |
| 20 | 50 | 0 | 92 | 142 |

## Code

```python
def optimal_bst(freq):
    n = len(freq)
    cost = [[0] * n for _ in range(n)]
    root = [[0] * n for _ in range(n)]
    totals = [0]
    for value in freq:
        totals.append(totals[-1] + value)
    for i in range(n):
        cost[i][i] = freq[i]
        root[i][i] = i
    for length in range(2, n + 1):              # shortest ranges first
        for i in range(n - length + 1):
            j = i + length - 1
            weight = totals[j + 1] - totals[i]
            cost[i][j] = float("inf")
            for r in range(i, j + 1):
                left = cost[i][r - 1] if r > i else 0
                right = cost[r + 1][j] if r < j else 0
                if left + right + weight < cost[i][j]:
                    cost[i][j] = left + right + weight
                    root[i][j] = r
    return cost[0][n - 1], root

best, root = optimal_bst([34, 8, 50])
print(best)  # 142
print(root[0][2])  # 2
print(optimal_bst([34, 50])[0])  # 118
```

## Complexity

| Version | Time | Space |
| --- | --- | --- |
| The table above | O(n³) | O(n²) |
| With Knuth's optimization | O(n²) | O(n²) |

Knuth noticed that the best root never moves backward as a range grows, which greatly narrows the search. That is the same kind of property as in [[Divide and Conquer DP]].

## Comparing Tree Types

| Tree | When to Use It | Build Time | Search |
| --- | --- | --- | --- |
| [[AVL Tree\|Balanced tree]] | Frequencies are unknown or even | O(n log n) | O(log n) worst case |
| Optimal BST | Frequencies are known, and data doesn't change | O(n³) | Best possible on average |

Optimal BSTs suit fixed data with known use, such as a compiler's keyword table. If keys get added or frequencies change, the tree has to be rebuilt.

## Compared to Huffman Coding

[[Huffman Coding]] also puts frequent items near the top, and it is much faster at `O(n log n)`. The difference is that Huffman's items can go anywhere. A BST must keep its keys in sorted order, which is why it needs dynamic programming.

## Common Mistakes

- **Using a greedy root.** The most frequent key isn't always the best root.
- **Forgetting the sum.** It is what accounts for every key moving one level down.
- **Filling the table in the wrong order.** Short ranges must come first.
- **Unsorted keys.** The method requires keys in sorted order, since the subtrees come from ranges.
