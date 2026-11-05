> The same algorithm can be fast on one input and slow on another. These three cases say how much that can vary.

## What It Is

Running time depends on the input, not only on its size. Searching a list of a million values could take one step or a million steps, depending on where the target is. So for each input size, we ask three questions:

| Case | The Question |
| --- | --- |
| Best | What is the fewest steps any input of size `n` can take? |
| Worst | What is the most steps any input of size `n` can take? |
| Average | Over all inputs of size `n`, how many steps does it take on average? |

## Worked Example: Linear Search

[[Linear Search]] checks each element in order until it finds the target.

```python
def linear_search(values, target):
    for i, value in enumerate(values):
        if value == target:
            return i
    return -1

print(linear_search([7, 3, 9, 1], 7))  # 0
print(linear_search([7, 3, 9, 1], 8))  # -1
```

### Best Case

The target is first. It takes **1 comparison**, which is `O(1)`.

### Worst Case

The target is last, or not there at all. It takes **n comparisons**, which is `O(n)`.

### Average Case

Suppose the target is present, and every position is equally likely. The number of comparisons is 1, 2, ... up to `n`, each with the same chance. The average is:

```text
(1 + 2 + ... + n) / n  =  (n + 1) / 2
```

That is about half the list, which is still `O(n)`.

## Why Worst Case Gets the Most Attention

- **It is a guarantee.** The algorithm will never be slower than this, on any input.
- **It is often common.** Searching for something that isn't there is always the worst case.
- **It is easier to work out.** The average case needs an assumption about which inputs are likely, and real inputs may not match it.

The best case is the least useful of the three. Almost any algorithm can be fast on a lucky input, so it tells you very little.

## Examples That Differ a Lot

| Algorithm | Best | Average | Worst |
| --- | --- | --- | --- |
| [[Linear Search]] | O(1) | O(n) | O(n) |
| [[Binary Search]] | O(1) | O(log n) | O(log n) |
| [[Insertion Sort]] | O(n) | O(n²) | O(n²) |
| [[Merge Sort]] | O(n log n) | O(n log n) | O(n log n) |
| [[Quick Sort]] | O(n log n) | O(n log n) | O(n²) |
| [[Hash Tables]] lookup | O(1) | O(1) | O(n) |

Notice how a case can be the reason to choose an algorithm. Insertion sort is excellent on nearly sorted data, because that is close to its best case. Quick sort is usually the fastest in practice, even though its worst case is poor, because that worst case is rare with a good pivot.

## Common Mistakes

- **Mixing up cases and notation.** "Best case" doesn't mean Omega, and "worst case" doesn't mean Big-O. A case picks the input, and a notation states a bound on the cost for that input.
- **Saying the best case happens when n is small.** The cases compare inputs of the *same* size. "The list has one element" isn't a best case. "The target is first" is.
- **Quoting an average without its assumption.** Average-case results depend on what is assumed about the input, such as the values being in random order.
