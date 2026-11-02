import type { Notation } from '../lib/expressions.ts';
import type { TreeMode, TreeOperation } from '../lib/trees.ts';

export type ExpressionExample = { input: string; notation: Notation; about: string; result?: number; error?: boolean };
export type TreeExample = { title: string; about: string; seed?: string; operation: TreeOperation; values: string; rotations?: number };
export type ExampleLevel<T> = { level: string; hint: string; items: T[] };

export const expressionExamples: ExampleLevel<ExpressionExample>[] = [
  {
    level: 'Easy',
    hint: 'One idea at a time',
    items: [
      { input: '2 + 3 * 4', notation: 'infix', about: 'Multiplication before addition', result: 14 },
      { input: '(2 + 3) * 4', notation: 'infix', about: 'Parentheses go first', result: 20 },
      { input: '10 - 4 - 3', notation: 'infix', about: 'Left to right at equal precedence', result: 3 },
      { input: '2 ^ 5', notation: 'infix', about: 'A single power', result: 32 },
    ],
  },
  {
    level: 'Medium',
    hint: 'Precedence and shortcuts',
    items: [
      { input: '(8 + 4) * 3 - 6 / 2', notation: 'infix', about: 'All the usual operators together', result: 33 },
      { input: '2 ^ 3 ^ 2', notation: 'infix', about: 'Powers group from the right', result: 512 },
      { input: '-2 ^ 2 + 10', notation: 'infix', about: 'Unary minus applies after the power', result: 6 },
      { input: '2(3 + 4)(5 - 1)', notation: 'infix', about: 'Implicit multiplication', result: 56 },
      { input: '100 / 5 / 2 * 3', notation: 'infix', about: 'A chain of division and multiplication', result: 30 },
    ],
  },
  {
    level: 'Hard',
    hint: 'Deep nesting and negatives',
    items: [
      { input: '((15 / (7 - (1 + 1))) * 3) - (2 + (1 + 1))', notation: 'infix', about: 'Nested parentheses', result: 5 },
      { input: '-(3 + 4) * -2 ^ 2', notation: 'infix', about: 'Two unary minus signs', result: 28 },
      { input: '2 ^ -2 * 8 + 0.5', notation: 'infix', about: 'Negative power with decimals', result: 2.5 },
      { input: '(1.5 + 2.5) ^ (9 / 3) - 4 * 2.5', notation: 'infix', about: 'Worked-out power and decimals', result: 54 },
    ],
  },
  {
    level: 'Complex',
    hint: 'Large trees, many steps',
    items: [
      { input: '((2 + 3) * (4 - 1) ^ 2 - 5) / (10 - 2 * 3) + 7 ^ 2', notation: 'infix', about: 'A wide, balanced tree', result: 59 },
      { input: '2(3 + 4(5 - 6(7 - 8)))', notation: 'infix', about: 'A deep tree that leans right', result: 94 },
      { input: '((1 + 2) * (3 + 4)) ^ 2 / ((5 + 6) * (7 - 4) - 12)', notation: 'infix', about: 'Two big subtrees meet at the root', result: 21 },
      { input: '(1 + 2 * 3 - 4 / 2) ^ 2 - (5 - 6 + 7) * (8 + 9 / 3)', notation: 'infix', about: 'Long stack of pending values', result: -41 },
    ],
  },
  {
    level: 'Notations',
    hint: 'Prefix and postfix input',
    items: [
      { input: '* + 2 3 4', notation: 'prefix', about: 'Prefix: the operator comes first', result: 20 },
      { input: '2 3 + 4 *', notation: 'postfix', about: 'Postfix: the operator comes last', result: 20 },
      { input: '- * 5 6 / 8 2', notation: 'prefix', about: 'Prefix with two subtrees', result: 26 },
      { input: '5 1 2 + 4 * + 3 -', notation: 'postfix', about: 'A longer postfix chain', result: 14 },
      { input: '5 ~ 2 ^', notation: 'postfix', about: '~ is unary minus', result: 25 },
    ],
  },
  {
    level: 'Error checks',
    hint: 'See how bad input is explained',
    items: [
      { input: '1 / (2 - 2)', notation: 'infix', about: 'Division by zero', error: true },
      { input: '(2 + 3', notation: 'infix', about: 'Unclosed parenthesis', error: true },
      { input: '1 2 + 3', notation: 'infix', about: 'Missing operator', error: true },
      { input: '(-8) ^ (1 / 3)', notation: 'infix', about: 'No real result', error: true },
      { input: '1 2 3 +', notation: 'postfix', about: 'Too many operands', error: true },
    ],
  },
];

const bst: ExampleLevel<TreeExample>[] = [
  {
    level: 'Easy',
    hint: 'How values find their place',
    items: [
      { title: 'First three nodes', about: 'Smaller left, larger right', operation: 'insert', values: '5, 3, 8' },
      { title: 'Balanced seven', about: 'A perfect tree, from a good order', operation: 'insert', values: '40, 20, 60, 10, 30, 50, 70' },
    ],
  },
  {
    level: 'Medium',
    hint: 'The three kinds of delete',
    items: [
      { title: 'Delete a leaf', about: 'No children, so it just goes', seed: '40, 20, 60, 10, 30', operation: 'delete', values: '10' },
      { title: 'Delete with one child', about: 'The child moves up', seed: '40, 20, 60, 10', operation: 'delete', values: '20' },
      { title: 'Delete with two children', about: 'The inorder successor steps in', seed: '50, 30, 70, 20, 40, 60, 80', operation: 'delete', values: '30' },
    ],
  },
  {
    level: 'Hard',
    hint: 'When order ruins the shape',
    items: [
      { title: 'Sorted input', about: 'Becomes a chain, height equals nodes', operation: 'insert', values: '10, 20, 30, 40, 50, 60' },
      { title: 'Zig-zag', about: 'Long path with alternating turns', operation: 'insert', values: '50, 10, 40, 20, 30' },
      { title: 'Delete the root', about: 'Successor search from the top', seed: '50, 30, 70, 20, 40, 60, 80, 65', operation: 'delete', values: '50' },
    ],
  },
  {
    level: 'Complex',
    hint: 'Bigger trees and batches',
    items: [
      { title: 'Fifteen nodes', about: 'Four full levels', operation: 'insert', values: '80, 40, 120, 20, 60, 100, 140, 10, 30, 50, 70, 90, 110, 130, 150' },
      { title: 'Batch delete', about: 'Leaf, one child and two children in a row', seed: '50, 30, 70, 20, 40, 60, 80, 10, 45, 75', operation: 'delete', values: '10, 20, 70, 50' },
    ],
  },
];

const avl: ExampleLevel<TreeExample>[] = [
  {
    level: 'Easy',
    hint: 'One rotation',
    items: [
      { title: 'Left-Left case', about: 'Rotate right once', operation: 'insert', values: '30, 20, 10', rotations: 1 },
      { title: 'Right-Right case', about: 'Rotate left once', operation: 'insert', values: '10, 20, 30', rotations: 1 },
    ],
  },
  {
    level: 'Medium',
    hint: 'Double rotations',
    items: [
      { title: 'Left-Right case', about: 'Rotate left, then right', operation: 'insert', values: '30, 10, 20', rotations: 2 },
      { title: 'Right-Left case', about: 'Rotate right, then left', operation: 'insert', values: '10, 30, 20', rotations: 2 },
    ],
  },
  {
    level: 'Hard',
    hint: 'Rotations further up the tree',
    items: [
      { title: 'Sorted input stays short', about: 'The input that ruins a BST', operation: 'insert', values: '10, 20, 30, 40, 50, 60, 70', rotations: 4 },
      { title: 'Delete triggers a rotation', about: 'Removing a node can unbalance too', seed: '20, 10, 30, 5', operation: 'delete', values: '30', rotations: 1 },
      { title: 'Deep double rotation', about: 'Fixes a subtree, not the root', seed: '40, 20, 60, 10, 30', operation: 'insert', values: '25', rotations: 2 },
    ],
  },
  {
    level: 'Complex',
    hint: 'Chain reactions',
    items: [
      { title: 'Two rotations from one delete', about: 'The fix makes a higher node unbalanced', seed: '8, 5, 11, 3, 7, 10, 12, 2, 4, 6, 9, 1', operation: 'delete', values: '12', rotations: 2 },
      { title: 'Fifteen in sorted order', about: 'Rotations keep it perfectly balanced', operation: 'insert', values: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15', rotations: 11 },
    ],
  },
];

export const treeExamples: Record<TreeMode, ExampleLevel<TreeExample>[]> = { bst, avl };
