> Finding the largest number that divides two numbers, with Euclid's algorithm, one of the oldest algorithms still in use.

## What It Is

The **greatest common divisor** (GCD) of two numbers is the largest number that divides both of them with no remainder.

For 48 and 18, the divisors of 48 are 1, 2, 3, 4, 6, 8, 12, 16, 24, 48, and the divisors of 18 are 1, 2, 3, 6, 9, 18. The largest one they share is **6**.

Listing divisors is slow for large numbers. **Euclid's algorithm** finds the answer in just a few steps.

## How Euclid's Algorithm Works

It relies on one fact:

> The GCD of `a` and `b` is the same as the GCD of `b` and `a mod b`.

So you keep replacing the pair with a smaller pair, until the second number reaches 0. The other number is then the GCD.

### Why the Fact Is True

Write `a = q · b + r`, where `r` is the remainder. Any number that divides both `a` and `b` also divides `r`, because `r = a - q · b`. Any number that divides both `b` and `r` also divides `a`. So the two pairs have exactly the same common divisors, and therefore the same largest one.

## Worked Example

Find the GCD of 48 and 18.

| a | b | a mod b |
| --- | --- | --- |
| 48 | 18 | 12 |
| 18 | 12 | 6 |
| 12 | 6 | 0 |
| 6 | 0 | Stop |

When `b` reaches 0, the answer is `a`, which is **6**.

## Code

The recursive version reads just like the fact above. The loop version does the same work with no call stack.

```python
def gcd_recursive(a, b):
    if b == 0:
        return a
    return gcd_recursive(b, a % b)

def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def lcm(a, b):
    return a // gcd(a, b) * b

print(gcd_recursive(48, 18))  # 6
print(gcd(48, 18))  # 6
print(gcd(17, 5))  # 1
print(lcm(4, 6))  # 12
```

## Least Common Multiple

The **least common multiple** (LCM) is the smallest number that both values divide. It comes straight from the GCD:

```text
lcm(a, b) = a × b / gcd(a, b)
```

Divide before you multiply, as the code does, so the intermediate result stays small.

## Complexity

| Measure | Cost | Why |
| --- | --- | --- |
| Time | O(log min(a, b)) | The numbers at least halve every two steps |
| Space, loop | O(1) | Two variables |
| Space, recursive | O(log min(a, b)) | One stack frame per step |

### Why It Is So Fast

After two steps, the larger number has dropped to less than half. If `a mod b` is large, it is close to `b`, and then the next remainder is small. The slowest inputs are two neighboring Fibonacci numbers, and even those need only about 90 steps for numbers near 10¹⁸.

## Where It Is Used

- **Simplifying fractions:** divide the top and bottom by their GCD.
- **Cryptography:** RSA key setup depends on a version of this algorithm.
- **Repeating schedules:** the LCM says when two repeating events next line up.

## Common Mistakes

- **Mishandling zero.** The GCD of `a` and 0 is `a`, and the code handles this. The case where both are 0 has no largest divisor, and is usually defined as 0.
- **Multiplying first in the LCM.** `a * b / gcd` can overflow in languages with fixed-size integers. Use `a / gcd * b`.
- **Using subtraction on large numbers.** The original subtraction form of the algorithm is correct, but for 1,000,000 and 1 it needs a million steps. The remainder form needs one.
