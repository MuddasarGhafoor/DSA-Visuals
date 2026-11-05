> How running time grows with input size, comparing constant, logarithmic, linear, quadratic, and exponential growth side by side.

## What It Is

Big-O growth compares algorithms by asking one question: **when the input gets much bigger, how much slower does this get?**

An `O(n)` algorithm takes twice as long when the input doubles. An `O(n²)` algorithm takes four times as long. An `O(2ⁿ)` algorithm squares its time. That difference matters far more than any faster computer can make up for.

## The Common Growth Rates

From fastest to slowest:

| Name | Big-O | Example | When the Input Doubles |
| --- | --- | --- | --- |
| Constant | O(1) | Read an array element | No change |
| Logarithmic | O(log n) | [[Binary Search]] | One more step |
| Linear | O(n) | [[Linear Search]] | Twice as long |
| Linearithmic | O(n log n) | [[Merge Sort]] | A bit more than twice |
| Quadratic | O(n²) | [[Bubble Sort]] | Four times as long |
| Cubic | O(n³) | [[Floyd-Warshall]] | Eight times as long |
| Exponential | O(2ⁿ) | All subsets | Squares the time |
| Factorial | O(n!) | All orderings | Far worse than squaring |

## Seeing the Difference

This table shows the number of steps for each size of input.

| n | log n | n log n | n² | 2ⁿ | n! |
| --- | --- | --- | --- | --- | --- |
| 10 | 3 | 33 | 100 | 1,024 | 3.6 million |
| 20 | 4 | 86 | 400 | 1 million | 2.4 × 10¹⁸ |
| 100 | 7 | 664 | 10,000 | 1.3 × 10³⁰ | 9.3 × 10¹⁵⁷ |
| 1,000 | 10 | 9,966 | 1 million | Too large | Too large |
| 1,000,000 | 20 | 20 million | 10¹² | Too large | Too large |

### In Real Time

Suppose a computer does one billion simple steps per second:

| Algorithm | Input Size | Time |
| --- | --- | --- |
| O(n log n) | 1,000,000 | About 0.02 seconds |
| O(n²) | 1,000,000 | About 17 minutes |
| O(2ⁿ) | 50 | About 13 days |
| O(n!) | 20 | About 77 years |

This is why a good algorithm beats a fast computer. Making the machine 100 times faster only lets an `O(2ⁿ)` algorithm handle about 7 more items.

## Recognizing Each Rate in Code

```python
def constant(values):
    return values[0]                   # O(1): one step, whatever the size

def logarithmic(n):
    steps = 0
    while n > 1:                       # O(log n): n halves each time
        n //= 2
        steps += 1
    return steps

def linear(values):
    total = 0
    for value in values:               # O(n): one pass
        total += value
    return total

def quadratic(values):
    pairs = 0
    for a in values:                   # O(n²): a loop inside a loop
        for b in values:
            pairs += 1
    return pairs

print(logarithmic(1024))  # 10
print(linear([1, 2, 3]))  # 6
print(quadratic([1, 2, 3]))  # 9
```

## What Size of Input Can You Handle

A rough guide, for about one second of running time:

| Largest n | Algorithms That Fit |
| --- | --- |
| 10 to 12 | O(n!) |
| 20 to 25 | O(2ⁿ) |
| 400 | O(n³) |
| 10,000 | O(n²) |
| 1,000,000 | O(n log n) |
| 100,000,000 | O(n) |
| Any size | O(log n), O(1) |

## Common Mistakes

- **Judging by small inputs.** On 10 items, almost everything looks fast. Growth only shows on large inputs.
- **Ignoring constants completely.** Big-O compares growth, not real speed. For small inputs, a simple `O(n²)` sort can beat an `O(n log n)` one.
- **Assuming a loop always means O(n).** A loop can run `log n` times if it halves its counter. Look at how the counter changes, not only at the keyword.
