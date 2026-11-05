> Spreading values into ranges, sorting each range, and joining them back together.

## What It Is

**Bucket sort** divides the range of values into equal parts called **buckets**. It places each value in the bucket for its range, sorts each bucket, and joins the buckets in order.

Imagine sorting exam papers by score. You first make ten piles: 0 to 9, 10 to 19, and so on. Each pile is small and quick to sort, and once they are sorted, you just stack the piles in order.

## How It Works

1. Create `k` empty buckets.
2. For each value, work out its bucket from its size, and put it there.
3. Sort each bucket, usually with [[Insertion Sort]], since the buckets are small.
4. Join the buckets from lowest to highest.

## Worked Example

Sort `[0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68]` with 10 buckets. A value `x` goes into bucket `int(x × 10)`.

| Bucket | Range | After Spreading | After Sorting |
| --- | --- | --- | --- |
| 1 | 0.1 to 0.2 | 0.17, 0.12 | 0.12, 0.17 |
| 2 | 0.2 to 0.3 | 0.26, 0.21, 0.23 | 0.21, 0.23, 0.26 |
| 3 | 0.3 to 0.4 | 0.39 | 0.39 |
| 6 | 0.6 to 0.7 | 0.68 | 0.68 |
| 7 | 0.7 to 0.8 | 0.78, 0.72 | 0.72, 0.78 |
| 9 | 0.9 to 1.0 | 0.94 | 0.94 |

Joining them gives the sorted list.

## Code

```python
def insertion_sort(values):
    for i in range(1, len(values)):
        current = values[i]
        j = i - 1
        while j >= 0 and values[j] > current:
            values[j + 1] = values[j]
            j -= 1
        values[j + 1] = current

def bucket_sort(values, bucket_count=10):
    if not values:
        return []
    low, high = min(values), max(values)
    if low == high:
        return list(values)
    buckets = [[] for _ in range(bucket_count)]
    width = (high - low) / bucket_count
    for value in values:
        index = min(int((value - low) / width), bucket_count - 1)
        buckets[index].append(value)
    result = []
    for bucket in buckets:
        insertion_sort(bucket)
        result.extend(bucket)
    return result

print(bucket_sort([0.78, 0.17, 0.39, 0.26, 0.72]))  # [0.17, 0.26, 0.39, 0.72, 0.78]
print(bucket_sort([29, 3, 45, 11, 38, 3]))  # [3, 3, 11, 29, 38, 45]
```

The `min(...)` keeps the largest value from landing one bucket past the end.

## Complexity

With `n` values and `k` buckets:

| Case | Time | When |
| --- | --- | --- |
| Best | O(n + k) | Values spread evenly, so buckets are small |
| Average | O(n + k) | Values spread evenly, with k close to n |
| Worst | O(n²) | Almost all values land in one bucket |
| Space | O(n + k) | The buckets themselves |

### Why Evenly Spread Input Matters

If there are about as many buckets as values, each bucket holds about one value, and sorting them is almost free. But suppose your data is `[1, 2, 3, 4, 1000]`. Most values land in the lowest bucket, and the sort does `O(n²)` work on it.

So bucket sort is only fast when you know something about your data.

## Choosing the Number of Buckets

- **Too few:** the buckets are large, and sorting them is slow.
- **Too many:** you waste memory and time on empty buckets.
- **A good default:** about one bucket per value.

## Bucket Sort vs Its Relatives

| Sort | How It Spreads Values | Works Best On |
| --- | --- | --- |
| [[Counting Sort]] | One bucket per exact value | Small integer ranges |
| Bucket sort | One bucket per range | Evenly spread values, including decimals |
| [[Radix Sort]] | Buckets by digit, one digit at a time | Fixed-length numbers and strings |

## Properties

- **Stable,** as long as each bucket's sort is stable.
- **Not a comparison sort overall.** It uses the value itself to choose a bucket, which is how it beats `O(n log n)` on suitable data.
- **Good for parallel work.** Each bucket can be sorted separately. Large-scale distributed sorting works much like this.

## Common Mistakes

- **Assuming it is always O(n).** That needs an even spread. Clustered data ruins it.
- **Going out of range on the largest value.** `(max - min) / width` equals exactly `bucket_count`, which is one past the last bucket.
- **Dividing by zero.** If all values are equal, the width is 0, so handle that first.
- **Negative values.** A formula like `int(x × 10)` breaks on negative numbers. Subtract the minimum first, as the code does.
