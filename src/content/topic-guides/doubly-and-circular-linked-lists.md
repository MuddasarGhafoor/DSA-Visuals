> Linked lists that can also move backward, or that loop from the last node to the first.

## What It Is

A singly [[Linked Lists|linked list]] can only move forward, and its last node points to nothing. Two variations remove those limits.

### Doubly Linked List

Each node points to the next node **and** the previous one, so you can move in both directions.

```text
None <- [10] <-> [20] <-> [30] -> None
```

### Circular Linked List

The last node points back to the first, so there is no end.

```text
[10] -> [20] -> [30]
  ^                |
  +----------------+
```

The two ideas can be combined into a **circular doubly linked list**.

## How They Compare

| Operation | Singly | Doubly | Why Doubly Helps |
| --- | --- | --- | --- |
| Insert at the front | O(1) | O(1) | |
| Insert at the back, with a tail pointer | O(1) | O(1) | |
| Remove from the back | O(n) | O(1) | The tail knows its previous node |
| Remove a node you already have | O(n) | O(1) | The node knows its previous node |
| Move backward | Not possible | O(1) per step | |
| Memory per node | One link | Two links | Costs more |

## Removing a Node

This is the main reason to use a doubly linked list. Given a node, you can unlink it directly, because it knows both of its neighbors. A singly linked list would have to walk from the head to find the node before it.

```text
Before:   [10] <-> [20] <-> [30]
Unlink 20:
          [10].next = [30]
          [30].prev = [10]
After:    [10] <-> [30]
```

## Sentinels Keep the Code Simple

Inserting and removing normally need special checks for the first and last nodes. A **sentinel** is a dummy node that sits at both ends. With one, every real node always has a neighbor on each side, so those checks disappear.

```python
class Node:
    def __init__(self, value=None):
        self.value = value
        self.prev = self
        self.next = self

class DoublyLinkedList:
    def __init__(self):
        self.sentinel = Node()   # circular: it is its own neighbor when empty

    def insert_after(self, node, value):
        fresh = Node(value)
        fresh.prev = node
        fresh.next = node.next
        node.next.prev = fresh
        node.next = fresh
        return fresh

    def push_front(self, value):
        return self.insert_after(self.sentinel, value)

    def push_back(self, value):
        return self.insert_after(self.sentinel.prev, value)

    def remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def to_list(self):
        result = []
        node = self.sentinel.next
        while node is not self.sentinel:
            result.append(node.value)
            node = node.next
        return result

items = DoublyLinkedList()
items.push_back(20)
middle = items.push_back(30)
items.push_front(10)
print(items.to_list())  # [10, 20, 30]
items.remove(middle)
print(items.to_list())  # [10, 20]
```

Notice that this list is circular and doubly linked, and that `remove` has no special cases at all.

## Walking a Circular List

A circular list has no `None` to stop at, so you stop when you get back to where you started.

```python
def walk_circle(start, steps):
    # Each node is (value, next), stored in a dictionary.
    result = []
    node = start
    for _ in range(steps):
        result.append(node)
        node = links[node]
    return result

links = {"A": "B", "B": "C", "C": "A"}
print(walk_circle("A", 5))  # ['A', 'B', 'C', 'A', 'B']
```

## Where They Are Used

- **Doubly linked:** browser back and forward, undo and redo, and an LRU cache, which must move any item to the front in `O(1)`.
- **Circular:** turn-based games and round-robin scheduling, where you keep cycling through the same items.
- **Both:** [[Deque|deques]] and the lists inside many standard libraries.

## Common Mistakes

- **Updating links in the wrong order.** When inserting, set the new node's own links first. If you overwrite `node.next` first, you lose the rest of the list.
- **Updating only one direction.** Every change has to fix both `next` and `prev`. Forgetting one leaves a list that looks right going forward and wrong going backward.
- **Looping forever.** A loop that waits for `None` never ends on a circular list.
