> Cutting a rod into pieces to earn the most, a classic first dynamic programming problem.

## What It Is

A company buys long steel rods, cuts them, and sells the pieces. The price depends on the length, and not always in proportion. Given a rod of length `n` and a price for each length, **how should you cut it to earn the most?**

| Length | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Price | 1 | 5 | 8 | 9 | 10 | 17 | 17 | 20 |

For a rod of length 4, the options are:

| Cuts | Earnings |
| --- | --- |
| 4 | 9 |
| 1 + 3 | 1 + 8 = 9 |
| **2 + 2** | **5 + 5 = 10** |
| 1 + 1 + 2 | 1 + 1 + 5 = 7 |
| 1 + 1 + 1 + 1 | 4 |

Cutting it in half earns the most: **10**.

## Why Trying Everything Fails

At each of the `n - 1` possible cut points, you either cut or don't, giving `2^(n-1)` ways. A rod of length 40 has over 500 billion.

The plain recursion is just as bad, because the same lengths get solved again and again.

## The Key Idea

Whatever the best plan is, it has a **first piece**. Say it has length `i`. You earn its price, and then you have a rod of length `n - i` left, which is the same problem again, only smaller.

So try every first piece:

```text
best[0] = 0
best[n] = max( price[i] + best[n - i] )     for i from 1 to n
```

## Worked Example

Fill in `best` from small to large, using the price table above.

| n | Options | best[n] | First Piece |
| --- | --- | --- | --- |
| 1 | 1 + 0 | 1 | 1 |
| 2 | 1 + 1, 5 + 0 | 5 | 2 |
| 3 | 1 + 5, 5 + 1, 8 + 0 | 8 | 3 |
| 4 | 1 + 8, 5 + 5, 8 + 1, 9 + 0 | 10 | 2 |
| 5 | 1 + 10, 5 + 8, 8 + 5, 9 + 1, 10 + 0 | 13 | 2 |
| 6 | Best is 17 + 0 | 17 | 6 |
| 7 | Best is 1 + 17 | 18 | 1 |
| 8 | Best is 5 + 17 | 22 | 2 |

For length 8, the first piece has length 2, which leaves 6, and the best for 6 is one piece. So the plan is **2 + 6**, which earns 5 + 17 = **22**.

## Code

### Memoized

```python
def rod_memo(prices, n, saved=None):
    if saved is None:
        saved = {}
    if n == 0:
        return 0
    if n not in saved:
        saved[n] = max(prices[i - 1] + rod_memo(prices, n - i, saved) for i in range(1, n + 1))
    return saved[n]

prices = [1, 5, 8, 9, 10, 17, 17, 20]
print(rod_memo(prices, 4))  # 10
print(rod_memo(prices, 8))  # 22
```

### Tabulated, With the Cuts

```python
def rod_cutting(prices, n):
    best = [0] * (n + 1)
    first = [0] * (n + 1)              # the best first piece for each length
    for length in range(1, n + 1):
        for i in range(1, length + 1):
            earned = prices[i - 1] + best[length - i]
            if earned > best[length]:
                best[length] = earned
                first[length] = i
    pieces = []
    while n > 0:
        pieces.append(first[n])
        n -= first[n]
    return best[-1], pieces

print(rod_cutting([1, 5, 8, 9, 10, 17, 17, 20], 8))  # (22, [2, 6])
print(rod_cutting([1, 5, 8, 9, 10, 17, 17, 20], 5))  # (13, [2, 3])
```

## Why Greedy Fails

A natural idea is to take the length with the best price per unit first.

| Length | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| Price | 1 | 5 | 8 | 9 |
| Price per unit | 1 | 2.5 | 2.67 | 2.25 |

For a rod of length 4, greedy takes length 3 first (the best ratio), leaving length 1, and that earns 8 + 1 = 9. The best is 2 + 2, which earns 10.

## Complexity

| Method | Time | Space |
| --- | --- | --- |
| Plain recursion | O(2ⁿ) | O(n) |
| Memoized or tabulated | O(n²) | O(n) |

For each length up to `n`, you try up to `n` first pieces, which gives `O(n²)`.

## It Is an Unbounded Knapsack

Rod cutting is a special case of the [[Unbounded Knapsack]]:

| Rod Cutting | [[Unbounded Knapsack]] |
| --- | --- |
| Rod length | Bag capacity |
| Piece length | Item weight |
| Piece price | Item value |
| Can cut many of one length | Can take many of one item |

## Variations

- **With a fixed cost per cut:** subtract the cost for each piece that isn't the whole remaining rod.
- **With a limit on the number of cuts:** add the number of cuts to the state.
- **Maximum product of pieces:** multiply lengths instead of adding prices.

## Common Mistakes

- **An off-by-one in the prices.** With a list starting at index 0, the price of length `i` is `prices[i - 1]`.
- **Assuming the whole rod is a bad choice.** Selling it uncut is one of the options, and for length 6 above it is the best.
- **Using the price per unit.** It fails, as shown above.
- **Starting without `best[0] = 0`.** All other answers build on this base case.
