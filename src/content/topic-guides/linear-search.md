> Checking each value in turn until the target is found. It is simple, and works on any list.

## What It Is

**Linear search** looks at each value, one after another, until it finds the target or runs out of values.

It is how you would find a name on an unsorted sign-up sheet: start at the top, and read down until you see it.

## How It Works

1. Start at the first value.
2. If it equals the target, return its position.
3. Otherwise, move to the next value.
4. If you reach the end, the target isn't there.

## Worked Example

Find 9 in `[7, 3, 9, 1]`.

| Step | Index | Value | Equal to 9? |
| --- | --- | --- | --- |
| 1 | 0 | 7 | No |
| 2 | 1 | 3 | No |
| 3 | 2 | 9 | Yes, return 2 |

## Code

```python
def linear_search(values, target):
    for i, value in enumerate(values):
        if value == target:
            return i
    return -1

print(linear_search([7, 3, 9, 1], 9))  # 2
print(linear_search([7, 3, 9, 1], 8))  # -1
```

## Complexity

| Case | Comparisons | When |
| --- | --- | --- |
| Best | 1, which is O(1) | The target is first |
| Average | About n/2, which is O(n) | The target is somewhere in the middle |
| Worst | n, which is O(n) | The target is last or missing |
| Space | O(1) | Only a loop variable |

See [[Best, Average, and Worst Case]] for how the average is worked out.

## When to Use It

Linear search is often dismissed as too simple, but it is sometimes the right choice:

- **The data isn't sorted,** and you only search once. Sorting first costs `O(n log n)`, which is more than one `O(n)` scan.
- **The list is short.** For a few dozen items, it is often faster than fancier methods because each step is so cheap.
- **The structure has no random access.** On a [[Linked Lists|linked list]], there is no faster way to walk through it.
- **You need something other than equality.** "Find the first value above 100" works with no setup.
- **You are searching on a condition,** such as the first student with a passing grade.

If you search the same data many times, use [[Binary Search]] on sorted data, or a [[Hash Tables|hash table]].

| Method | Search | Setup Needed | Data Must Be |
| --- | --- | --- | --- |
| Linear search | O(n) | None | Anything |
| [[Binary Search]] | O(log n) | O(n log n) to sort | Sorted |
| [[Hash Tables\|Hash table]] | O(1) average | O(n) to build | Hashable |

## Useful Variations

### The Sentinel

A normal loop makes two checks per step: "am I at the end?" and "is this the target?". Placing the target at the end of the list as a **sentinel** guarantees the loop stops, so it needs only one check per step.

```python
def sentinel_search(values, target):
    values.append(target)      # the loop will always stop now
    i = 0
    while values[i] != target:
        i += 1
    values.pop()               # restore the list
    return i if i < len(values) else -1

print(sentinel_search([7, 3, 9, 1], 9))  # 2
print(sentinel_search([7, 3, 9, 1], 8))  # -1
```

### Finding All Matches

Keep going after each match, and collect the positions.

```python
def find_all(values, target):
    return [i for i, value in enumerate(values) if value == target]

print(find_all([1, 2, 1, 3, 1], 1))  # [0, 2, 4]
```

### Finding the Largest

Finding a maximum is a linear search that remembers the best value so far. Every value must be checked, since any of them could be the largest.

## Common Mistakes

- **Returning inside the wrong branch.** Writing `else: return -1` inside the loop stops after the first value. Return -1 only after the loop ends.
- **Using `in` inside a loop.** `x in my_list` is a linear search. Inside another loop, that makes the total `O(n²)`, and a set would fix it.
- **Searching sorted data slowly.** If your list is already sorted, [[Binary Search]] is free to use.
