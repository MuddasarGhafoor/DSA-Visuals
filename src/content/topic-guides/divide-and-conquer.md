> Splitting a problem into smaller parts, solving each one, and combining the results.

## What It Is

**Divide and conquer** solves a big problem by breaking it into smaller problems of the same kind, solving each, and combining the answers.

Imagine sorting a huge stack of exam papers with friends. You split the stack in two, and hand each half to a friend, who splits and hands it on. Once the small piles are sorted, you merge them back together.

## The Three Steps

| Step | What Happens | In [[Merge Sort]] |
| --- | --- | --- |
| **Divide** | Split the problem into smaller problems | Cut the list in half |
| **Conquer** | Solve each one, recursively | Sort each half |
| **Combine** | Join the answers into one | Merge the two sorted halves |

The recursion stops at a **base case**, a problem small enough to answer directly.

## Classic Examples

| Algorithm | Divide | Combine | Time |
| --- | --- | --- | --- |
| [[Binary Search]] | Pick one half | Nothing | O(log n) |
| [[Merge Sort]] | Split in half | Merge, the real work | O(n log n) |
| [[Quick Sort]] | Partition, the real work | Nothing | O(n log n) average |
| Fast power | Half the exponent | Square the result | O(log n) |

Notice that the work can be in different places. Merge sort does its work when combining, and quick sort does its work when dividing.

## Worked Example: Fast Power

Computing `2¹⁰` by multiplying 10 times is slow. But `2¹⁰ = (2⁵)²`, and `2⁵ = 2 × (2²)²`. Each step cuts the exponent in half.

```python
def power(base, exponent):
    if exponent == 0:
        return 1
    half = power(base, exponent // 2)
    if exponent % 2 == 0:
        return half * half
    return half * half * base

print(power(2, 10))  # 1024
print(power(3, 5))  # 243
```

That takes `O(log n)` multiplications, instead of `O(n)`. For an exponent of a billion, it is about 30 steps.

## Worked Example: Maximum Subarray

Find the contiguous part of a list with the largest sum. Split the list in half. The best part must be in one of three places:

1. Entirely in the left half.
2. Entirely in the right half.
3. Crossing the middle.

The first two are recursive calls. The crossing case is easy: go outward from the middle in each direction, keeping the best total.

```python
def max_subarray(values, low=0, high=None):
    if high is None:
        high = len(values) - 1
    if low == high:
        return values[low]
    middle = (low + high) // 2

    best_left = total = float("-inf")
    running = 0
    for i in range(middle, low - 1, -1):
        running += values[i]
        best_left = max(best_left, running)

    best_right = float("-inf")
    running = 0
    for i in range(middle + 1, high + 1):
        running += values[i]
        best_right = max(best_right, running)

    return max(
        max_subarray(values, low, middle),
        max_subarray(values, middle + 1, high),
        best_left + best_right,
    )

print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))  # 6
```

The best part is `[4, -1, 2, 1]`. This takes `O(n log n)`, compared with `O(n²)` for checking every part.

## Working Out the Cost

The running time follows a [[Recurrences|recurrence]]:

```text
T(n) = a · T(n / b) + f(n)
```

Here, `a` is the number of smaller problems, `n / b` is the size of each one, and `f(n)` is the work to split and combine. The [[Master Theorem]] solves most of these directly.

## When It Works Well

- **The parts are independent.** They don't need each other's answers.
- **Combining is cheap.** If combining costs too much, the gain is lost.
- **The split is balanced.** Halves are ideal. A very uneven split, like the worst case of [[Quick Sort]], loses the benefit.

### A Bonus: Parallel Work

Because the parts are independent, each can run on a different processor. That makes it a natural fit for parallel computing.

## Divide and Conquer vs Dynamic Programming

Both break problems into smaller ones. The difference is whether those smaller problems **overlap**.

| | Divide and Conquer | [[Memoization vs Tabulation\|Dynamic Programming]] |
| --- | --- | --- |
| Smaller problems | Independent | Repeat many times |
| Solves each | As it comes | Once, then reuses the answer |
| Example | [[Merge Sort]] | [[Fibonacci (DP)]] |

## Common Mistakes

- **Forgetting the base case.** Without one, the recursion never ends.
- **Overlapping subproblems.** If the same smaller problem comes up repeatedly, plain recursion can become exponential. Use memoization.
- **An expensive combine step.** With a combine cost of `n²`, splitting may not help at all.
- **Slicing on every call.** Copying sublists can add a hidden `O(n)` per call. Passing index ranges avoids this.
