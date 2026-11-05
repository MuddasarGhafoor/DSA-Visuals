> Making an amount with the fewest coins, or counting all the ways to make it.

## What It Is

You have coins of certain values, with an unlimited supply of each, and a target amount. There are two classic questions:

1. **Fewest coins:** what is the smallest number of coins that makes the amount?
2. **Number of ways:** how many different combinations make the amount?

## Why Greedy Isn't Enough

Taking the largest coin first works for US coins, but not in general. Take coins of 1, 3, and 4, and make 6.

| Method | Coins | Count |
| --- | --- | --- |
| [[Greedy Algorithms\|Greedy]], largest first | 4, 1, 1 | 3 |
| Best | 3, 3 | 2 |

Dynamic programming always gets it right.

## Fewest Coins

### The Key Idea

Think about the **last coin** used. If it is coin `c`, then the rest makes `amount - c`, using as few coins as possible. So try every coin:

```text
best[0] = 0
best[a] = 1 + min( best[a - c] )     for every coin c ≤ a
```

### Worked Example: Coins 1, 3, 4, Amount 6

| Amount | Using 1 | Using 3 | Using 4 | best |
| --- | --- | --- | --- | --- |
| 0 | | | | 0 |
| 1 | 1 + 0 | | | 1 |
| 2 | 1 + 1 | | | 2 |
| 3 | 1 + 2 | 1 + 0 | | 1 |
| 4 | 1 + 1 | 1 + 1 | 1 + 0 | 1 |
| 5 | 1 + 1 | 1 + 2 | 1 + 1 | 2 |
| 6 | 1 + 2 | 1 + 1 | 1 + 2 | 2 |

The answer is **2**, which is 3 + 3.

### Code

```python
def min_coins(coins, amount):
    best = [0] + [float("inf")] * amount
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a:
                best[a] = min(best[a], 1 + best[a - coin])
    return best[amount] if best[amount] != float("inf") else -1

print(min_coins([1, 3, 4], 6))  # 2
print(min_coins([2], 3))  # -1
print(min_coins([1, 5, 10, 25], 68))  # 7
```

## Number of Ways

### The Key Idea

Count **combinations**, so that 1 + 2 and 2 + 1 aren't counted twice. To do this, handle one coin at a time. Each coin adds new ways to all the amounts it can reach.

```text
ways[0] = 1     (one way to make 0: use nothing)
for each coin c:
    for a from c up to the amount:
        ways[a] += ways[a - c]
```

### Worked Example: Coins 1, 2, 5, Amount 5

| After Adding | a=0 | a=1 | a=2 | a=3 | a=4 | a=5 |
| --- | --- | --- | --- | --- | --- | --- |
| No coins | 1 | 0 | 0 | 0 | 0 | 0 |
| Coin 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Coin 2 | 1 | 1 | 2 | 2 | 3 | 3 |
| Coin 5 | 1 | 1 | 2 | 2 | 3 | 4 |

The answer is **4**: 5, 2+2+1, 2+1+1+1, and 1+1+1+1+1.

### Code

```python
def count_ways(coins, amount):
    ways = [1] + [0] * amount
    for coin in coins:
        for a in range(coin, amount + 1):
            ways[a] += ways[a - coin]
    return ways[amount]

print(count_ways([1, 2, 5], 5))  # 4
print(count_ways([2], 3))  # 0
```

## Combinations vs Orderings

The order of the two loops changes what is being counted.

| Loops | Counts | Coins 1, 2, Amount 3 |
| --- | --- | --- |
| Coins outside, amounts inside | Combinations | 2: {1, 1, 1} and {1, 2} |
| Amounts outside, coins inside | Orderings | 3: 1+1+1, 1+2, and 2+1 |

```python
def count_orderings(coins, amount):
    ways = [1] + [0] * amount
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a:
                ways[a] += ways[a - coin]
    return ways[amount]

print(count_ways([1, 2], 3))  # 2
print(count_orderings([1, 2], 3))  # 3
```

## Complexity

With `n` coin types and an amount of `A`:

| Measure | Cost |
| --- | --- |
| Time | O(n × A) |
| Space | O(A) |

## When Greedy Does Work

Greedy is correct for coin systems where each coin value divides the next, such as 1, 5, 10, 50, and also for US coins. Modern currencies are usually designed this way. But never assume it for arbitrary coins.

## Common Mistakes

- **Using greedy on arbitrary coins.** It can give a wrong answer, or fail to find an answer that exists. With coins 3 and 4 and an amount of 6, greedy takes 4 and gets stuck.
- **Starting `best[0]` at infinity.** It must be 0, or nothing can ever build on it.
- **Forgetting the impossible case.** Report it clearly when an amount can't be made.
- **Swapping the loops.** Swapping them counts orderings when you meant combinations, and the reverse.
