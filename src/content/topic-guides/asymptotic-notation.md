> Big-O, Omega, and Theta describe how a function grows, by giving an upper bound, a lower bound, or a tight bound.

## What It Is

Exact step counts are messy, and they change with the computer and the language. Asymptotic notation ignores those details and keeps only what matters: **how the cost grows as the input gets very large**.

It does this by dropping two things:

- **Constant factors.** `3n` and `100n` both grow in a straight line.
- **Smaller terms.** In `n² + 50n`, the `n²` eventually dwarfs the `50n`.

## The Three Main Notations

### Big-O: An Upper Bound

`f(n) = O(g(n))` means `f` grows **no faster than** `g`.

Formally, there are positive constants `c` and `n₀` such that `f(n) ≤ c · g(n)` for every `n ≥ n₀`.

### Big-Omega: A Lower Bound

`f(n) = Ω(g(n))` means `f` grows **at least as fast as** `g`.

Formally, there are positive constants `c` and `n₀` such that `f(n) ≥ c · g(n)` for every `n ≥ n₀`.

### Big-Theta: A Tight Bound

`f(n) = Θ(g(n))` means `f` grows **at the same rate as** `g`. It is true exactly when both `O(g(n))` and `Ω(g(n))` are true.

| Notation | Reads As | Like Comparing Numbers |
| --- | --- | --- |
| O | Grows no faster than | ≤ |
| Ω | Grows at least as fast as | ≥ |
| Θ | Grows at the same rate as | = |
| o (little-o) | Grows strictly slower than | < |
| ω (little-omega) | Grows strictly faster than | > |

## Worked Example

Show that `f(n) = 3n² + 5n + 2` is `Θ(n²)`.

### Upper Bound

We need `3n² + 5n + 2 ≤ c · n²`. Try `c = 4`. The inequality becomes `n² - 5n - 2 ≥ 0`, which is true from `n = 6` onward. So `c = 4` and `n₀ = 6` prove `f(n) = O(n²)`.

### Lower Bound

Every term is positive, so `3n² + 5n + 2 ≥ 3n²` for all `n ≥ 1`. So `c = 3` and `n₀ = 1` prove `f(n) = Ω(n²)`.

### Conclusion

Both bounds hold, so `f(n) = Θ(n²)`.

## How to Read It in Practice

Most code follows a few simple rules:

1. **Steps in sequence add.** `O(n) + O(n²)` is `O(n²)`, because the larger term wins.
2. **Nested loops multiply.** A loop of `n` inside a loop of `n` is `O(n²)`.
3. **Halving gives a logarithm.** A loop that halves `n` each time runs `O(log n)` times.
4. **The base of the logarithm doesn't matter.** `log₂ n` and `log₁₀ n` differ by a constant factor.

```python
def count_steps(n):
    steps = 0
    for i in range(n):          # runs n times
        steps += 1
    i = n
    while i > 1:                # runs about log2(n) times
        i //= 2
        steps += 1
    return steps                # n + log n, which is O(n)

print(count_steps(16))  # 20
```

## Common Mistakes

- **Saying Big-O means worst case.** They are separate ideas. Big-O is a kind of bound, and worst case is a kind of input. You can state a Big-O bound on the average case. See [[Best, Average, and Worst Case]].
- **Using a loose bound and calling it tight.** Binary search is `O(n)` too, since that is still a true upper bound. It just tells you very little, and `Θ(log n)` is the useful answer.
- **Forgetting that "eventually" matters.** An `O(n)` algorithm can be slower than an `O(n²)` one on small inputs if its constant is large.
