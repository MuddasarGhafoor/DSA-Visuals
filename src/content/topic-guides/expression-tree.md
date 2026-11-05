> A calculation drawn as a tree, with operators above the values they work on.

## What It Is

An **expression tree** shows a calculation as a [[Binary Tree Basics|binary tree]]. Each operator is an internal node, with its operands as children. Numbers are the leaves.

Here is `(2 + 3) * 4`:

```text
        *
       / \
      +   4
     / \
    2   3
```

The tree shows the order of operations in its shape. `+` is lower, so it must run first, and `*` at the root runs last, so its result is the final answer. There is no need for parentheses or precedence rules.

## Why It Is Useful

- **It makes the structure plain.** The grouping is visible, with no rules to remember.
- **It converts between notations.** Each traversal gives a different notation.
- **It is what compilers work with.** Code is often turned into a tree like this before being optimized or run.

## Reading It With Traversals

The three [[Tree Traversals]] give the three notations.

| Traversal | Order at Each Node | Gives You | For the Tree Above |
| --- | --- | --- | --- |
| Inorder | Left, node, right | Infix, once parentheses are added | `2 + 3 * 4` |
| Preorder | Node, left, right | Prefix | `* + 2 3 4` |
| Postorder | Left, right, node | Postfix | `2 3 + 4 *` |

Notice that plain inorder loses the grouping: it reads `2 + 3 * 4`, which means something else. To get a correct infix form, you must add parentheses around each operator's result.

## Building It From Postfix

Postfix makes building the tree easy, using a [[Stack]] of subtrees. Read from left to right:

1. A **number** becomes a one-node tree, which is pushed onto the stack.
2. An **operator** pops the subtrees it needs, becomes their parent, and pushes the result.
3. When the input ends, the one tree on the stack is the answer.

### Worked Example: `2 3 + 4 *`

| Read | What Happens | Stack of Trees |
| --- | --- | --- |
| `2` | Push a leaf | 2 |
| `3` | Push a leaf | 2, 3 |
| `+` | Pop 3 and 2, join them under + | (2 + 3) |
| `4` | Push a leaf | (2 + 3), 4 |
| `*` | Pop 4 and (2 + 3), join them under * | ((2 + 3) * 4) |

As in evaluation, the first value popped is the **right** child.

## Code

```python
class Node:
    def __init__(self, token, left=None, right=None):
        self.token = token
        self.left = left
        self.right = right

def build_tree(postfix):
    stack = []
    for token in postfix.split():
        if token in "+-*/^":
            right = stack.pop()              # the first pop is the right child
            left = stack.pop()
            stack.append(Node(token, left, right))
        else:
            stack.append(Node(token))
    return stack[0]

def prefix(node):
    return [node.token] + prefix(node.left) + prefix(node.right) if node.left else [node.token]

def postfix(node):
    return postfix(node.left) + postfix(node.right) + [node.token] if node.left else [node.token]

def infix(node):
    if not node.left:
        return node.token
    return f"({infix(node.left)} {node.token} {infix(node.right)})"

def evaluate(node):
    if not node.left:
        return float(node.token)
    a, b = evaluate(node.left), evaluate(node.right)
    return {"+": a + b, "-": a - b, "*": a * b, "/": a / b if b else 0, "^": a ** b}[node.token]

tree = build_tree("2 3 + 4 *")
print(" ".join(prefix(tree)))  # * + 2 3 4
print(" ".join(postfix(tree)))  # 2 3 + 4 *
print(infix(tree))  # ((2 + 3) * 4)
print(evaluate(tree))  # 20.0
```

## Evaluating It

A tree is evaluated in **postorder**: an operator needs both of its values before it can run. The recursion follows the shape directly:

1. If the node is a number, return it.
2. Otherwise, evaluate the left child and the right child, then apply the operator.

### Worked Example

| Step | Node | Calculation | Result |
| --- | --- | --- | --- |
| 1 | 2 | A leaf | 2 |
| 2 | 3 | A leaf | 3 |
| 3 | + | 2 + 3 | 5 |
| 4 | 4 | A leaf | 4 |
| 5 | * | 5 × 4 | **20** |

Compare this with the [[Expression Evaluator|postfix stack]]. They do exactly the same steps: the stack is just what the recursion would be holding.

## Unary Minus

A unary minus has just one child, so the tree isn't strictly binary at that node. `-5 + 2` looks like this:

```text
        +
       / \
      -   2
      |
      5
```

## Complexity

With `n` tokens:

| Operation | Time | Space |
| --- | --- | --- |
| Building from postfix | O(n) | O(n) |
| Any traversal | O(n) | O(h), the height |
| Evaluating | O(n) | O(h) |

## From Infix

To build a tree from everyday infix input, convert it to postfix first with [[Notation Conversion]], then build as above.

## Where It Is Used

- **Compilers,** which use trees to analyze and optimize code.
- **Calculators and spreadsheets.**
- **Symbolic math tools,** which can rewrite a tree to simplify an expression, or to find a derivative.

## Try It

The simulator builds your expression's tree from postfix, showing subtrees joining on the stack, and walks it in all three orders.

## Common Mistakes

- **Swapping the children.** The first pop is the right child. For `8 4 -`, swapping gives 4 − 8.
- **Using inorder with no parentheses.** It loses the grouping, so `(2 + 3) * 4` would read as `2 + 3 * 4`.
- **Evaluating an operator before its children.** The order must be postorder.
- **Assuming a balanced shape.** Expression trees take whatever shape the expression has. `1 + 2 + 3 + 4` is a long chain.
