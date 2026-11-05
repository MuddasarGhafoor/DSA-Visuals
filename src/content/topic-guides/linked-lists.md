> Nodes that each point to the next one, and how pointers change on insert and delete.

## What It Is

A **linked list** stores values in separate **nodes**, which can be anywhere in memory. Each node holds a value and a link to the next node. The list keeps a pointer to the first node, called the **head**, and the last node's link is empty.

```text
head
 |
 v
[10 | -]--> [20 | -]--> [30 | -]--> None
```

Think of a treasure hunt: each clue tells you where the next one is, and to reach the fifth clue you must follow the first four.

## How It Compares to an Array

| Operation | Array | Linked List | Why |
| --- | --- | --- | --- |
| Read by index | O(1) | O(n) | A list must walk from the head |
| Insert at the front | O(n) | O(1) | A list changes one link |
| Insert after a known node | O(n) | O(1) | No values shift |
| Search | O(n) | O(n) | Both check each value |
| Extra memory | None | One link per value | |
| Cache speed | Fast | Slow | List nodes are scattered |

Use a linked list when you often insert or remove at known positions, and rarely jump to an index.

## Core Operations

### Inserting at the Front

Point the new node at the old head, then move the head.

```text
Before:  head -> [20] -> [30]
Step 1:  [10] -> [20] -> [30]      new node points at the old head
Step 2:  head -> [10] -> [20] -> [30]
```

The order matters. If you moved the head first, you would lose the rest of the list.

### Removing a Node

To remove a node, make the node before it skip over it.

```text
Before:  [10] -> [20] -> [30]
After:   [10] ----------> [30]
```

### Code

```python
class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next

class LinkedList:
    def __init__(self):
        self.head = None

    def push_front(self, value):
        self.head = Node(value, self.head)

    def remove(self, value):
        if self.head is None:
            return False
        if self.head.value == value:
            self.head = self.head.next
            return True
        node = self.head
        while node.next:
            if node.next.value == value:
                node.next = node.next.next     # skip over it
                return True
            node = node.next
        return False

    def to_list(self):
        result, node = [], self.head
        while node:
            result.append(node.value)
            node = node.next
        return result

items = LinkedList()
for value in [30, 20, 10]:
    items.push_front(value)
print(items.to_list())  # [10, 20, 30]
print(items.remove(20))  # True
print(items.to_list())  # [10, 30]
```

## Worked Example: Reversing a List

Reversing is the classic linked list exercise. Walk through the list with three pointers, and turn each link around.

```python
def reverse(head):
    previous = None
    node = head
    while node:
        following = node.next      # save it before we overwrite the link
        node.next = previous       # turn this link around
        previous = node            # move both pointers forward
        node = following
    return previous                # the new head

def build(values):
    head = None
    for value in reversed(values):
        head = Node(value, head)
    return head

def values_of(head):
    result = []
    while head:
        result.append(head.value)
        head = head.next
    return result

print(values_of(reverse(build([1, 2, 3]))))  # [3, 2, 1]
```

| Step | previous | node | Done So Far |
| --- | --- | --- | --- |
| Start | None | 1 | |
| 1 | 1 | 2 | 1 → None |
| 2 | 2 | 3 | 2 → 1 → None |
| 3 | 3 | None | 3 → 2 → 1 → None |

This takes `O(n)` time and `O(1)` space.

## Where It Is Used

- **[[Stack|Stacks]] and [[Queue|queues]],** where work only happens at the ends.
- **[[Chaining]] in hash tables,** where each slot holds a short list.
- **Adjacency lists for graphs.** See [[Adjacency List vs Matrix]].

## Common Mistakes

- **Losing the rest of the list.** Save `node.next` before you change it.
- **Following an empty link.** Reading `node.next.value` crashes if `node.next` is `None`, so check first.
- **Forgetting the head case.** Removing the first node changes the head, and has no node before it. A sentinel node removes this special case. See [[Doubly and Circular Linked Lists]].
- **Assuming insert is always O(1).** It is `O(1)` only once you have the position. Finding the position still takes `O(n)`.
