import type { SimulatorDef } from './kit.ts';

type Category = Record<string, SimulatorDef>;

/** Each category is its own file, loaded only when one of its simulators opens. */
const CATEGORIES: Record<string, () => Promise<{ simulators: Category }>> = {
  foundations: () => import('./foundations.ts'),
  linear: () => import('./linear.ts'),
  hashing: () => import('./hashing.ts'),
  searching: () => import('./searching.ts'),
  sorting: () => import('./sorting.ts'),
  trees: () => import('./trees.ts'),
  graphs: () => import('./graphs.ts'),
  techniques: () => import('./techniques.ts'),
  dp: () => import('./dp.ts'),
  expressions: () => import('./expressions.ts'),
};

const SLUGS: Record<string, string[]> = {
  foundations: ['abstract-data-types', 'asymptotic-notation', 'best-average-and-worst-case', 'big-o-growth-comparison', 'bit-manipulation', 'gcd', 'iteration-vs-recursion', 'master-theorem', 'np-complete-problems', 'p-vs-np', 'recurrences', 'recursion-and-the-call-stack', 'space-complexity', 'time-space-tradeoff', 'tower-of-hanoi'],
  linear: ['arrays', 'bit-array', 'circular-queue', 'deque', 'doubly-and-circular-linked-lists', 'dynamic-arrays', 'linked-lists', 'queue', 'stack', 'strings'],
  hashing: ['chaining', 'hash-functions', 'hash-tables', 'linear-quadratic-probing-and-double-hashing', 'open-addressing', 'rehashing', 'sets-and-maps', 'string-hashing'],
  searching: ['binary-search', 'kmp', 'linear-search', 'naive-pattern-matching', 'rabin-karp'],
  sorting: ['bubble-sort', 'bucket-sort', 'counting-sort', 'heap-sort', 'insertion-sort', 'merge-sort', 'quick-sort', 'radix-sort', 'selection-sort', 'stable-vs-unstable-sorting'],
  trees: ['binary-tree-basics', 'binomial-heap', 'heaps', 'priority-queue', 'tree-representations', 'tree-traversals'],
  graphs: ['0-1-bfs', 'a-search', 'adjacency-list-vs-matrix', 'bellman-ford', 'bfs', 'bidirectional-search', 'dfs', 'dijkstra', 'floyd-warshall', 'graph-basics', 'graph-coloring', 'iterative-deepening-dfs', 'kirchhoffs-theorem', 'kruskals-algorithm', 'min-cut', 'prims-algorithm', 'topological-sort', 'union-find'],
  techniques: ['activity-selection', 'alpha-beta-pruning', 'backtracking', 'brute-force', 'divide-and-conquer', 'fractional-knapsack', 'greedy-algorithms', 'hill-climbing', 'huffman-coding', 'job-sequencing', 'minimax', 'n-queens', 'sum-of-subsets'],
  dp: ['0-1-knapsack', 'assembly-line-scheduling', 'coin-change', 'divide-and-conquer-dp', 'edit-distance', 'fibonacci-dp', 'longest-common-subsequence', 'longest-common-substring', 'longest-increasing-subsequence', 'longest-palindromic-subsequence', 'matrix-chain-multiplication', 'memoization-vs-tabulation', 'min-cost-path', 'optimal-bst', 'partition-problem', 'rod-cutting', 'shortest-common-supersequence', 'subset-sum', 'unbounded-knapsack', 'weighted-job-scheduling'],
  expressions: ['notation-conversion'],
};

export const simulatorSlugs = Object.values(SLUGS).flat();

export async function loadSimulator(slug: string): Promise<SimulatorDef> {
  const category = Object.keys(SLUGS).find(name => SLUGS[name].includes(slug));
  if (!category) throw new Error(`No simulator called ${slug}.`);
  const { simulators } = await CATEGORIES[category]();
  return simulators[slug];
}
