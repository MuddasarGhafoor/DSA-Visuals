import { ArrowDownWideNarrow, Calculator, Gauge, Grid3x3, Hash, Network, Puzzle, Rows3, Search, Waypoints, type LucideIcon } from 'lucide-react';

/** Every topic has a guide at /topics/<slug>. Simulator is the address of its tool, once that tool is built. */
export type Topic = { title: string; simulator?: string };
export type TopicGroup = { id: string; title: string; summary: string; Icon: LucideIcon; topics: Topic[] };

const topic = (title: string, simulator?: string): Topic => ({ title, simulator });

const byTitle = (a: Topic, b: Topic) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base', numeric: true });

// Categories are in a suggested learning order. Topics are shown alphabetically inside each one.
export const catalog: TopicGroup[] = ([
  {
    id: 'foundations',
    title: 'Foundations',
    summary: 'What data structures are, how to measure algorithms, how recursion works, and which problems are hard.',
    Icon: Gauge,
    topics: [
      topic('Abstract Data Types'), topic('Asymptotic Notation'), topic('Best, Average, and Worst Case'), topic('Big-O Growth Comparison'), topic('Bit Manipulation'), topic('GCD'), topic('Iteration vs Recursion'), topic('Master Theorem'),
      topic('NP-Complete Problems'), topic('P vs NP'), topic('Recurrences'), topic('Recursion and the Call Stack'), topic('Space Complexity'), topic('Time-Space Tradeoff'), topic('Tower of Hanoi'),
    ],
  },
  {
    id: 'linear',
    title: 'Linear Structures',
    summary: 'Values stored one after another.',
    Icon: Rows3,
    topics: [
      topic('Arrays'), topic('Bit Array'), topic('Circular Queue'), topic('Deque'), topic('Doubly and Circular Linked Lists'), topic('Dynamic Arrays'), topic('Linked Lists'), topic('Queue'), topic('Stack'), topic('Strings'),
    ],
  },
  {
    id: 'hashing',
    title: 'Hashing',
    summary: 'Finding a value by computing where it belongs.',
    Icon: Hash,
    topics: [
      topic('Chaining'), topic('Hash Functions'), topic('Hash Tables'), topic('Linear/Quadratic Probing and Double Hashing'), topic('Open Addressing'), topic('Rehashing'), topic('Sets and Maps'), topic('String Hashing'),
    ],
  },
  {
    id: 'searching',
    title: 'Searching',
    summary: 'Finding a value in a collection, or a pattern in text.',
    Icon: Search,
    topics: [
      topic('Binary Search'), topic('KMP'), topic('Linear Search'), topic('Naive Pattern Matching'), topic('Rabin-Karp'),
    ],
  },
  {
    id: 'sorting',
    title: 'Sorting',
    summary: 'Putting values in order, and what each method costs.',
    Icon: ArrowDownWideNarrow,
    topics: [
      topic('Bubble Sort'), topic('Bucket Sort'), topic('Counting Sort'), topic('Heap Sort'), topic('Insertion Sort'), topic('Merge Sort'), topic('Quick Sort'), topic('Radix Sort'), topic('Selection Sort'), topic('Stable vs Unstable Sorting'),
    ],
  },
  {
    id: 'trees',
    title: 'Trees and Heaps',
    summary: 'Hierarchies that make searching and ordering fast.',
    Icon: Network,
    topics: [
      topic('AVL Tree', '/trees/avl'), topic('Binary Search Tree', '/trees/bst'), topic('Binary Tree Basics'), topic('Binomial Heap'), topic('Heaps'), topic('Priority Queue'), topic('Tree Representations'), topic('Tree Traversals'),
    ],
  },
  {
    id: 'graphs',
    title: 'Graphs',
    summary: 'Nodes and connections: paths, networks, and dependencies.',
    Icon: Waypoints,
    topics: [
      topic('0-1 BFS'), topic('A* Search'), topic('Adjacency List vs Matrix'), topic('Bellman-Ford'), topic('BFS'), topic('Bidirectional Search'), topic('DFS'), topic('Dijkstra'), topic('Floyd-Warshall'),
      topic('Graph Basics'), topic('Graph Coloring'), topic('Iterative Deepening DFS'), topic("Kirchhoff's Theorem"), topic("Kruskal's Algorithm"), topic('Min Cut'), topic("Prim's Algorithm"), topic('Topological Sort'), topic('Union-Find'),
    ],
  },
  {
    id: 'techniques',
    title: 'Problem-Solving Techniques',
    summary: 'Reusable ways to approach a new problem.',
    Icon: Puzzle,
    topics: [
      topic('Activity Selection'), topic('Alpha-Beta Pruning'), topic('Backtracking'), topic('Brute Force'), topic('Divide and Conquer'), topic('Fractional Knapsack'), topic('Greedy Algorithms'),
      topic('Hill Climbing'), topic('Huffman Coding'), topic('Job Sequencing'), topic('Minimax'), topic('N-Queens'), topic('Sum of Subsets'),
    ],
  },
  {
    id: 'dp',
    title: 'Dynamic Programming',
    summary: 'Solving big problems by reusing smaller answers.',
    Icon: Grid3x3,
    topics: [
      topic('0/1 Knapsack'), topic('Assembly Line Scheduling'), topic('Coin Change'), topic('Divide and Conquer DP'), topic('Edit Distance'), topic('Fibonacci (DP)'), topic('Longest Common Subsequence'), topic('Longest Common Substring'), topic('Longest Increasing Subsequence'), topic('Longest Palindromic Subsequence'),
      topic('Matrix Chain Multiplication'), topic('Memoization vs Tabulation'), topic('Min Cost Path'), topic('Optimal BST'), topic('Partition Problem'), topic('Rod Cutting'), topic('Shortest Common Supersequence'), topic('Subset Sum'), topic('Unbounded Knapsack'), topic('Weighted Job Scheduling'),
    ],
  },
  {
    id: 'expressions',
    title: 'Expressions',
    summary: 'How programs read and work out calculations.',
    Icon: Calculator,
    topics: [
      topic('Balanced Parentheses', '/expressions/balanced-parentheses'), topic('Expression Evaluator', '/expressions'), topic('Expression Tree', '/expressions/expression-tree'), topic('Notation Conversion'),
    ],
  },
] satisfies TopicGroup[]).map(group => ({ ...group, topics: [...group.topics].sort(byTitle) }));

export const allTopics = catalog.flatMap(group => group.topics);

export function groupStatus(group: TopicGroup): string {
  const total = group.topics.length;
  return `${total} ${total === 1 ? 'topic' : 'topics'}`;
}

export const topicSlug = (item: Topic) => item.title.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The address of a topic's guide. */
export const guideHref = (item: Topic) => `/topics/${topicSlug(item)}`;

/** The address of a topic's simulator. A few topics have a page of their own, and the rest share /simulate. */
export const simulatorHref = (item: Topic) => item.simulator ?? `/simulate/${topicSlug(item)}`;

export const topicByTitle = (title: string) => allTopics.find(item => item.title === title);

/** The topic whose guide or simulator is at this path, with its category. */
export function topicAt(path: string): { topic: Topic; group: TopicGroup } | undefined {
  for (const group of catalog) {
    const found = group.topics.find(item => guideHref(item) === path || simulatorHref(item) === path);
    if (found) return { topic: found, group };
  }
}
