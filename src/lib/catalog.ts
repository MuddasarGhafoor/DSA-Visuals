import { ArrowDownWideNarrow, Calculator, Gauge, Grid3x3, Hash, Network, Puzzle, Rows3, Search, Server, Type, Waypoints, type LucideIcon } from 'lucide-react';

export type TopicLevel = 'Core' | 'Important' | 'Advanced';

/** A topic without an href is marked "Soon" and has a Coming Soon page. Building a module means adding its href here. */
export type Topic = { title: string; level: TopicLevel; href?: string };
export type TopicGroup = { id: string; title: string; shortTitle?: string; summary: string; Icon: LucideIcon; topics: Topic[] };

export const LEVELS: { level: TopicLevel; hint: string }[] = [
  { level: 'Core', hint: 'Start here. Most courses and roadmaps cover these.' },
  { level: 'Important', hint: 'Build on the core. These come up often.' },
  { level: 'Advanced', hint: 'Go deeper once the rest feels comfortable.' },
];

const core = (title: string, href?: string): Topic => ({ title, level: 'Core', href });
const important = (title: string): Topic => ({ title, level: 'Important' });
const advanced = (title: string): Topic => ({ title, level: 'Advanced' });

// Categories are listed in a suggested learning order.
export const catalog: TopicGroup[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    summary: 'How to measure an algorithm, and how recursion works.',
    Icon: Gauge,
    topics: [core('Big-O Growth Comparison'), core('Best, Average, and Worst Case'), core('Recursion and the Call Stack'), core('Iteration vs Recursion'), important('Bit Manipulation')],
  },
  {
    id: 'linear',
    title: 'Linear Structures',
    summary: 'Values stored one after another.',
    Icon: Rows3,
    topics: [core('Arrays'), core('Dynamic Arrays'), core('Strings'), core('Linked Lists'), core('Doubly and Circular Linked Lists'), core('Stack'), core('Queue'), core('Circular Queue'), core('Deque'), important('Matrix')],
  },
  {
    id: 'hashing',
    title: 'Hashing',
    summary: 'Finding a value by computing where it belongs.',
    Icon: Hash,
    topics: [core('Hash Tables'), core('Chaining'), core('Open Addressing'), core('Rehashing'), core('Sets and Maps')],
  },
  {
    id: 'searching',
    title: 'Searching',
    summary: 'Finding a value in a collection.',
    Icon: Search,
    topics: [core('Linear Search'), core('Binary Search'), important('Binary Search on the Answer')],
  },
  {
    id: 'sorting',
    title: 'Sorting',
    summary: 'Putting values in order, and what each method costs.',
    Icon: ArrowDownWideNarrow,
    topics: [core('Bubble Sort'), core('Selection Sort'), core('Insertion Sort'), core('Merge Sort'), core('Quick Sort'), core('Heap Sort'), core('Stable vs Unstable Sorting'), important('Counting Sort'), important('Radix Sort'), important('Bucket Sort')],
  },
  {
    id: 'trees',
    title: 'Trees',
    summary: 'Hierarchies that make searching and ordering fast.',
    Icon: Network,
    topics: [core('Binary Tree Basics'), core('Binary Search Tree', '/trees/bst'), core('AVL Tree', '/trees/avl'), core('Heaps'), core('Priority Queue'), important('Trie'), important('Red-Black Tree'), advanced('B-Tree and B+ Tree'), advanced('Segment Tree'), advanced('Fenwick Tree')],
  },
  {
    id: 'graphs',
    title: 'Graphs',
    summary: 'Nodes and connections: paths, networks, and dependencies.',
    Icon: Waypoints,
    topics: [
      core('Adjacency List vs Matrix'), core('BFS'), core('DFS'), core('Dijkstra'), core("Prim's Algorithm"), core("Kruskal's Algorithm"),
      important('Topological Sort'), important('Cycle Detection'), important('Connected Components'), important('Union-Find'), important('Bellman-Ford'), important('Floyd-Warshall'),
      advanced('A* Search'), advanced('Maximum Flow'), advanced('Bipartite Matching'),
    ],
  },
  {
    id: 'techniques',
    title: 'Problem-Solving Techniques',
    shortTitle: 'Problem-Solving T',
    summary: 'Reusable ways to approach a new problem.',
    Icon: Puzzle,
    topics: [core('Brute Force'), core('Two Pointers'), core('Sliding Window'), core('Divide and Conquer'), core('Greedy Algorithms'), core('Backtracking'), important('Prefix Sums'), important('Monotonic Stack'), important('Intervals')],
  },
  {
    id: 'dp',
    title: 'Dynamic Programming',
    summary: 'Solving big problems by reusing smaller answers.',
    Icon: Grid3x3,
    topics: [core('Memoization vs Tabulation'), core('0/1 Knapsack'), core('Coin Change'), core('Longest Common Subsequence'), important('Edit Distance'), important('Longest Increasing Subsequence'), important('Matrix Chain Multiplication')],
  },
  {
    id: 'strings',
    title: 'String Algorithms',
    summary: 'Finding patterns in text efficiently.',
    Icon: Type,
    topics: [important('KMP'), important('Rabin-Karp'), advanced('Boyer-Moore'), advanced('Suffix Array'), advanced('Regex Matching')],
  },
  {
    id: 'expressions',
    title: 'Expressions and Parsing',
    summary: 'How programs read and work out calculations.',
    Icon: Calculator,
    topics: [core('Expression Evaluator', '/expressions'), important('Infix to Postfix (Shunting Yard)'), important('Tokenizer')],
  },
  {
    id: 'systems',
    title: 'In Real Systems',
    summary: 'Structures behind caches, databases, and distributed systems.',
    Icon: Server,
    topics: [important('LRU Cache'), important('Bloom Filter'), important('Skip List'), important('Consistent Hashing'), advanced('B+ Tree Database Index'), advanced('LSM Tree')],
  },
];

export const allTopics = catalog.flatMap(group => group.topics);
export const liveTopics = allTopics.filter(topic => topic.href);

export function groupStatus(group: TopicGroup): string {
  const live = group.topics.filter(topic => topic.href).length;
  return live ? `${live} of ${group.topics.length} ready` : `${group.topics.length} topics`;
}

/** A topic's own tool, or its Coming Soon page. */
export function topicHref(topic: Topic): string {
  const slug = topic.title.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return topic.href ?? `/topics/${slug}`;
}

/** The topic whose page is at this path, with its category. */
export function topicAt(path: string): { topic: Topic; group: TopicGroup } | undefined {
  for (const group of catalog) {
    const topic = group.topics.find(t => topicHref(t) === path);
    if (topic) return { topic, group };
  }
}
