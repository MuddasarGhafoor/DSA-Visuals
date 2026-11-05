import { counted, bars, bucketsPanel, cells, choiceField, integer, numberField, numbers, row, seededRandom, tablePanel, textField, Trace, treePanel, visualTree, type BinaryNode, type Legend, type Metric, type Panel, type SimulatorDef, type Tone, type Values } from './kit.ts';

const orderField = choiceField('order', 'Order', [['asc', 'Ascending'], ['desc', 'Descending']]);
const legend: Legend = [{ tone: 'active', label: 'Comparing' }, { tone: 'new', label: 'Moved' }, { tone: 'done', label: 'In place' }];

const readValues = (values: Values) => numbers(values.values, { minCount: 1, maxCount: 16, min: -999, max: 999 });
const firstBefore = (desc: boolean) => (a: number, b: number) => (desc ? a > b : a < b);

type Counters = { comparisons: number; moves: number };
const counters = ({ comparisons, moves }: Counters, moveLabel = 'Swaps'): Metric[] => [{ label: 'Comparisons', value: comparisons }, { label: moveLabel, value: moves }];

// ---------- Bubble Sort ----------

const bubbleSort: SimulatorDef = {
  fields: [textField('values', 'Values', '5, 1, 4, 2, 8', { wide: true }), orderField, choiceField('early', 'Stop early', [['yes', 'When a pass has no swaps'], ['no', 'Never']])],
  examples: [
    { title: 'Unsorted', about: 'The largest value bubbles to the end in each pass.', values: { values: '5, 1, 4, 2, 8', order: 'asc', early: 'yes' } },
    { title: 'Already sorted', about: 'One pass with no swaps, and it stops: O(n).', values: { values: '1, 2, 3, 4, 5', order: 'asc', early: 'yes' } },
    { title: 'Reversed', about: 'The worst case: every pair has to swap.', values: { values: '6, 5, 4, 3, 2, 1', order: 'asc', early: 'yes' } },
  ],
  run(input) {
    const items = readValues(input);
    const before = firstBefore(input.order === 'desc');
    const count: Counters = { comparisons: 0, moves: 0 };
    const trace = new Trace();
    let sortedFrom = items.length;
    const scene = (tone?: (i: number) => Tone | undefined): Panel[] => [bars('Values', items, i => tone?.(i) ?? (i >= sortedFrom ? 'done' : undefined), undefined, legend)];
    for (let pass = 0; pass < items.length - 1; pass++) {
      trace.group = `Pass ${pass + 1}`;
      let swapped = false;
      for (let j = 0; j < items.length - 1 - pass; j++) {
        count.comparisons++;
        const swap = before(items[j + 1], items[j]);
        trace.add(`${items[j]} and ${items[j + 1]}`, swap ? 'They are out of order, so swap them.' : 'They are in order, so leave them.', scene(i => (i === j || i === j + 1 ? 'active' : undefined)), { tone: 'active', metrics: counters(count) });
        if (swap) {
          [items[j], items[j + 1]] = [items[j + 1], items[j]];
          count.moves++;
          swapped = true;
          trace.add('Swap', `${items[j]} now comes before ${items[j + 1]}.`, scene(i => (i === j || i === j + 1 ? 'new' : undefined)), { tone: 'new', metrics: counters(count) });
        }
      }
      sortedFrom = items.length - 1 - pass;
      trace.add(`${items[sortedFrom]} is in place`, swapped ? 'The extreme value of this pass has reached its final position.' : 'No swaps at all in this pass.', scene(), { tone: 'done', metrics: counters(count) });
      if (!swapped && input.early === 'yes') {
        sortedFrom = 0;
        trace.add('Stop early', 'A pass with no swaps means the list is already sorted.', scene(), { tone: 'done', metrics: counters(count) });
        break;
      }
    }
    trace.group = undefined;
    sortedFrom = 0;
    trace.finish('Sorted', `${counted(count.comparisons, 'comparison')} and ${counted(count.moves, 'swap')}. Bubble sort is stable, and takes O(n²) in the worst case.`, scene(), { metrics: counters(count) });
    return { frames: trace.frames, answer: { items, ...count } };
  },
};

// ---------- Selection Sort ----------

const selectionSort: SimulatorDef = {
  fields: [textField('values', 'Values', '29, 10, 14, 37, 13', { wide: true }), orderField],
  examples: [
    { title: 'Unsorted', about: 'Find the smallest, and put it next in line.', values: { values: '29, 10, 14, 37, 13', order: 'asc' } },
    { title: 'Already sorted', about: 'It still makes every comparison, whatever the input.', values: { values: '1, 2, 3, 4, 5', order: 'asc' } },
    { title: 'Few swaps', about: 'It never makes more than n - 1 swaps.', values: { values: '5, 4, 3, 2, 1', order: 'asc' } },
  ],
  run(input) {
    const items = readValues(input);
    const before = firstBefore(input.order === 'desc');
    const count: Counters = { comparisons: 0, moves: 0 };
    const trace = new Trace();
    let placed = 0;
    const scene = (tone?: (i: number) => Tone | undefined): Panel[] => [bars('Values', items, i => tone?.(i) ?? (i < placed ? 'done' : undefined), undefined, legend)];
    for (let i = 0; i < items.length - 1; i++) {
      trace.group = `Position ${i}`;
      let best = i;
      for (let j = i + 1; j < items.length; j++) {
        count.comparisons++;
        const better = before(items[j], items[best]);
        trace.add(`${items[j]} and ${items[best]}`, better ? `${items[j]} is the new best.` : `${items[best]} stays the best so far.`, scene(at => (at === j ? 'active' : at === best ? 'accent' : undefined)), { tone: 'active', metrics: counters(count) });
        if (better) best = j;
      }
      if (best !== i) {
        [items[i], items[best]] = [items[best], items[i]];
        count.moves++;
        trace.add(`Swap into position ${i}`, `${items[i]} moves to position ${i}.`, scene(at => (at === i || at === best ? 'new' : undefined)), { tone: 'new', metrics: counters(count) });
      } else {
        trace.add(`${items[i]} stays`, 'It was already in the right place.', scene(at => (at === i ? 'done' : undefined)), { tone: 'done', metrics: counters(count) });
      }
      placed = i + 1;
    }
    trace.group = undefined;
    placed = items.length;
    trace.finish('Sorted', `${counted(count.comparisons, 'comparison')} and ${counted(count.moves, 'swap')}. It always takes O(n²) comparisons, and isn't stable, but it makes very few swaps.`, scene(), { metrics: counters(count) });
    return { frames: trace.frames, answer: { items, ...count } };
  },
};

// ---------- Insertion Sort ----------

const insertionSort: SimulatorDef = {
  fields: [textField('values', 'Values', '5, 2, 4, 6, 1', { wide: true }), orderField],
  examples: [
    { title: 'Unsorted', about: 'Like sorting cards in your hand.', values: { values: '5, 2, 4, 6, 1', order: 'asc' } },
    { title: 'Nearly sorted', about: 'Almost no work at all, which makes this very useful.', values: { values: '1, 2, 4, 3, 5, 6', order: 'asc' } },
    { title: 'Reversed', about: 'The worst case: every value slides to the front.', values: { values: '6, 5, 4, 3, 2, 1', order: 'asc' } },
  ],
  run(input) {
    const items = readValues(input);
    const before = firstBefore(input.order === 'desc');
    const count: Counters = { comparisons: 0, moves: 0 };
    const trace = new Trace();
    let sortedTo = 0;
    const scene = (tone?: (i: number) => Tone | undefined): Panel[] => [bars('Values', items, i => tone?.(i) ?? (i <= sortedTo ? 'done' : undefined), undefined, legend)];
    for (let i = 1; i < items.length; i++) {
      trace.group = `Insert ${items[i]}`;
      const key = items[i];
      let j = i - 1;
      trace.add(`Take ${key}`, i === 1 ? `The first value counts as sorted. Find where ${key} belongs around it.` : `The first ${i} values are sorted. Find where ${key} belongs among them.`, scene(at => (at === i ? 'accent' : undefined)), { tone: 'accent', metrics: counters(count, 'Shifts') });
      while (j >= 0) {
        count.comparisons++;
        if (!before(key, items[j])) {
          trace.add(`${items[j]} can stay`, `${key} goes right after ${items[j]}.`, scene(at => (at === j ? 'active' : at === j + 1 ? 'accent' : undefined)), { tone: 'active', metrics: counters(count, 'Shifts') });
          break;
        }
        items[j + 1] = items[j];
        items[j] = key;
        count.moves++;
        trace.add(`Shift ${items[j + 1]} right`, `${items[j + 1]} belongs after ${key}.`, scene(at => (at === j + 1 ? 'new' : at === j ? 'accent' : undefined)), { tone: 'new', metrics: counters(count, 'Shifts') });
        j--;
      }
      sortedTo = i;
      trace.add(`${key} is placed`, `The first ${i + 1} values are now sorted.`, scene(), { tone: 'done', metrics: counters(count, 'Shifts') });
    }
    trace.group = undefined;
    sortedTo = items.length;
    trace.finish('Sorted', `${counted(count.comparisons, 'comparison')} and ${counted(count.moves, 'shift')}. It is stable, takes O(n) on sorted input, and O(n²) in the worst case.`, scene(), { metrics: counters(count, 'Shifts') });
    return { frames: trace.frames, answer: { items, ...count } };
  },
};

// ---------- Merge Sort ----------

const mergeSort: SimulatorDef = {
  fields: [textField('values', 'Values', '38, 27, 43, 3, 9, 82, 10', { wide: true }), orderField],
  examples: [
    { title: 'Seven values', about: 'Split in half until each piece has one value, then merge.', values: { values: '38, 27, 43, 3, 9, 82, 10', order: 'asc' } },
    { title: 'Four values', about: 'A short run to see the merging clearly.', values: { values: '38, 27, 43, 3', order: 'asc' } },
    { title: 'Equal values', about: 'Merging takes from the left on a tie, which keeps it stable.', values: { values: '2, 1, 2, 1', order: 'asc' } },
  ],
  run(input) {
    const items = readValues(input);
    const before = firstBefore(input.order === 'desc');
    const trace = new Trace();
    const count = { comparisons: 0, moves: 0 };
    const metrics = () => [{ label: 'Comparisons', value: count.comparisons }, { label: 'Values copied', value: count.moves }];
    let maxDepth = 0;
    const scene = (low: number, high: number, tone: (i: number) => Tone | undefined, extra: Panel[] = []): Panel[] => [
      cells('The array', row(items, { tone: i => tone(i) ?? (i < low || i > high ? 'muted' : undefined) })),
      ...extra,
    ];
    const sort = (low: number, high: number, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      if (low >= high) return;
      const mid = (low + high) >> 1;
      trace.group = `Depth ${depth}`;
      trace.add(`Split ${low} to ${high}`, `Into ${low} to ${mid}, and ${mid + 1} to ${high}. Each side gets sorted first.`, scene(low, high, i => (i <= mid && i >= low ? 'path' : i > mid && i <= high ? 'value' : undefined)), { tone: 'path', metrics: metrics() });
      sort(low, mid, depth + 1);
      sort(mid + 1, high, depth + 1);
      trace.group = `Depth ${depth}`;
      const left = items.slice(low, mid + 1);
      const right = items.slice(mid + 1, high + 1);
      const merged: number[] = [];
      let i = 0;
      let j = 0;
      const panels = (active?: 'left' | 'right'): Panel[] => [
        cells('Merging', [
          row(left, { label: 'Left', hideIndex: true, tone: at => (at < i ? 'muted' : at === i ? (active === 'left' ? 'new' : 'active') : undefined) }),
          row(right, { label: 'Right', hideIndex: true, tone: at => (at < j ? 'muted' : at === j ? (active === 'right' ? 'new' : 'active') : undefined) }),
          row(merged, { label: 'Merged', hideIndex: true, tone: at => (at === merged.length - 1 ? 'new' : 'done') }),
        ]),
      ];
      while (i < left.length && j < right.length) {
        count.comparisons++;
        const takeRight = before(right[j], left[i]);
        trace.add(`${left[i]} and ${right[j]}`, takeRight ? `${right[j]} comes first, so take it from the right.` : `${left[i]} comes first${left[i] === right[j] ? ', as ties go to the left, which keeps the sort stable' : ''}.`, scene(low, high, () => undefined, panels()), { tone: 'active', metrics: metrics() });
        if (takeRight) {
          merged.push(right[j++]);
          count.moves++;
          trace.add(`Take ${merged.at(-1)}`, 'It joins the merged list.', scene(low, high, () => undefined, panels()), { tone: 'new', metrics: metrics() });
        } else {
          merged.push(left[i++]);
          count.moves++;
          trace.add(`Take ${merged.at(-1)}`, 'It joins the merged list.', scene(low, high, () => undefined, panels()), { tone: 'new', metrics: metrics() });
        }
      }
      while (i < left.length || j < right.length) {
        const fromLeft = i < left.length;
        merged.push(fromLeft ? left[i++] : right[j++]);
        count.moves++;
        trace.add(`Take ${merged.at(-1)}`, `The other side is used up, so the rest of the ${fromLeft ? 'left' : 'right'} side comes over in order.`, scene(low, high, () => undefined, panels()), { tone: 'new', metrics: metrics() });
      }
      merged.forEach((value, at) => {
        items[low + at] = value;
      });
      trace.add(`${low} to ${high} is sorted`, 'The merged values go back into the array.', scene(low, high, i2 => (i2 >= low && i2 <= high ? 'done' : undefined)), { tone: 'done', metrics: metrics() });
    };
    sort(0, items.length - 1, 0);
    trace.group = undefined;
    trace.finish('Sorted', `${counted(count.comparisons, 'comparison')} across ${counted(maxDepth, 'level')} of splitting. Merge sort always takes O(n log n), and uses O(n) extra memory for the merged list.`, [cells('The array', row(items, { tone: () => 'done' }))], { metrics: metrics() });
    return { frames: trace.frames, answer: { items, ...count } };
  },
};

// ---------- Quick Sort ----------

const quickSort: SimulatorDef = {
  fields: [
    textField('values', 'Values', '8, 3, 7, 1, 5, 9, 2', { wide: true }),
    orderField,
    choiceField('pivot', 'Pivot', [['last', 'Last value'], ['first', 'First value'], ['median', 'Median of three'], ['random', 'Random']]),
  ],
  examples: [
    { title: 'Random order', about: 'A mixed list usually splits well.', values: { values: '8, 3, 7, 1, 5, 9, 2', order: 'asc', pivot: 'last' } },
    { title: 'Sorted input', about: 'With the last value as pivot, this is the worst case: O(n²).', values: { values: '1, 2, 3, 4, 5, 6, 7', order: 'asc', pivot: 'last' } },
    { title: 'Median of three', about: 'The same sorted input now splits evenly.', values: { values: '1, 2, 3, 4, 5, 6, 7', order: 'asc', pivot: 'median' } },
    { title: 'Random pivot', about: 'Bad splits become unlikely on any input.', values: { values: '1, 2, 3, 4, 5, 6, 7', order: 'asc', pivot: 'random' } },
  ],
  run(input) {
    const items = readValues(input);
    const before = firstBefore(input.order === 'desc');
    const choice = input.pivot;
    const random = seededRandom(items.length * 97 + items[0]);
    const trace = new Trace();
    const count: Counters = { comparisons: 0, moves: 0 };
    const fixed = new Set<number>();
    let deepest = 0;
    const scene = (low: number, high: number, tone: (i: number) => Tone | undefined, pointers?: Record<number, string>): Panel[] => [
      cells('The array', row(items, { pointers, tone: i => tone(i) ?? (fixed.has(i) ? 'done' : i < low || i > high ? 'muted' : undefined) }), { legend: [{ tone: 'accent', label: 'Pivot' }, { tone: 'path', label: 'Before the pivot' }, { tone: 'active', label: 'Comparing' }, { tone: 'done', label: 'In place' }] }),
    ];
    const metrics = () => [...counters(count), { label: 'Deepest call', value: deepest }];
    const sort = (low: number, high: number, depth: number) => {
      deepest = Math.max(deepest, depth);
      if (low > high) return;
      if (low === high) {
        fixed.add(low);
        trace.add(`${items[low]} stands alone`, 'One value is already sorted.', scene(low, high, i => (i === low ? 'done' : undefined)), { tone: 'done', metrics: metrics() });
        return;
      }
      trace.group = `Partition ${low} to ${high}`;
      let pick = high;
      if (choice === 'first') pick = low;
      else if (choice === 'random') pick = low + random(high - low + 1);
      else if (choice === 'median') {
        const mid = (low + high) >> 1;
        const three = [low, mid, high].sort((a, b) => items[a] - items[b]);
        pick = three[1];
      }
      trace.add(`Pivot is ${items[pick]}`, choice === 'median' ? `The median of ${items[low]}, ${items[(low + high) >> 1]}, and ${items[high]} is ${items[pick]}.` : `This run picks the ${choice} value as the pivot.`, scene(low, high, i => (i === pick ? 'accent' : undefined)), { tone: 'accent', metrics: metrics() });
      if (pick !== high) {
        [items[pick], items[high]] = [items[high], items[pick]];
        count.moves++;
        trace.add('Move the pivot to the end', 'This keeps it out of the way while the others are compared.', scene(low, high, i => (i === high ? 'accent' : undefined)), { tone: 'new', metrics: metrics() });
      }
      const pivot = items[high];
      let boundary = low;
      for (let j = low; j < high; j++) {
        count.comparisons++;
        const goes = before(items[j], pivot);
        trace.add(`${items[j]} and ${pivot}`, goes ? `${items[j]} belongs before the pivot.` : `${items[j]} stays after the pivot.`, scene(low, high, i => (i === high ? 'accent' : i === j ? 'active' : i >= low && i < boundary ? 'path' : undefined), { [boundary]: 'boundary', [j]: boundary === j ? 'boundary, j' : 'j' }), { tone: 'active', metrics: metrics() });
        if (goes) {
          if (boundary !== j) {
            [items[boundary], items[j]] = [items[j], items[boundary]];
            count.moves++;
            trace.add('Swap', `${items[boundary]} moves into the group before the pivot.`, scene(low, high, i => (i === high ? 'accent' : i === boundary || i === j ? 'new' : i >= low && i < boundary ? 'path' : undefined)), { tone: 'new', metrics: metrics() });
          }
          boundary++;
        }
      }
      if (boundary !== high) {
        [items[boundary], items[high]] = [items[high], items[boundary]];
        count.moves++;
      }
      fixed.add(boundary);
      const leftSize = boundary - low;
      const rightSize = high - boundary;
      trace.add(`${pivot} is in place`, `It is now at index ${boundary}, with ${leftSize} value${leftSize === 1 ? '' : 's'} before it and ${rightSize} after it. Neither group ever needs to cross it again.`, scene(low, high, i => (i === boundary ? 'done' : i >= low && i < boundary ? 'path' : undefined)), { tone: 'done', metrics: metrics() });
      sort(low, boundary - 1, depth + 1);
      sort(boundary + 1, high, depth + 1);
    };
    sort(0, items.length - 1, 1);
    trace.group = undefined;
    items.forEach((_, i) => fixed.add(i));
    trace.finish('Sorted', `${counted(count.comparisons, 'comparison')} and ${counted(count.moves, 'swap')}, with calls ${deepest} deep. Quick sort averages O(n log n). Bad pivots can make it O(n²). It isn't stable.`, scene(0, items.length - 1, () => undefined), { metrics: metrics() });
    return { frames: trace.frames, answer: { items, deepest, ...count } };
  },
};

// ---------- Heap Sort ----------

const heapSort: SimulatorDef = {
  fields: [textField('values', 'Values', '4, 10, 3, 5, 1', { wide: true }), orderField],
  examples: [
    { title: 'Five values', about: 'First build a heap, then pull values off the top.', values: { values: '4, 10, 3, 5, 1', order: 'asc' } },
    { title: 'Descending', about: 'A min-heap sorts the other way around.', values: { values: '4, 10, 3, 5, 1', order: 'desc' } },
    { title: 'Equal values', about: 'Heap sort isn\'t stable, so equal values can swap order.', values: { values: '5, 5, 2, 8, 2', order: 'asc' } },
  ],
  run(input) {
    const items = readValues(input);
    const desc = input.order === 'desc';
    const higher = (a: number, b: number) => (desc ? a < b : a > b);
    const trace = new Trace();
    const count: Counters = { comparisons: 0, moves: 0 };
    let size = items.length;
    const tree = (at: number, marks: Record<number, Tone>): BinaryNode | null => {
      if (at >= size) return null;
      return { id: `n${at}`, label: String(items[at]), tone: marks[at] ?? 'value', sub: String(at), left: tree(2 * at + 1, marks), right: tree(2 * at + 2, marks) };
    };
    const scene = (marks: Record<number, Tone> = {}): Panel[] => [
      treePanel('The heap', visualTree(tree(0, marks)), 'Heap as a tree', { empty: 'The heap is empty' }),
      cells('The same values, as an array', row(items, { tone: i => marks[i] ?? (i >= size ? 'done' : undefined) })),
    ];
    const metrics = () => counters(count);
    const siftDown = (start: number) => {
      let at = start;
      while (true) {
        const left = 2 * at + 1;
        const right = 2 * at + 2;
        let top = at;
        if (left < size) {
          count.comparisons++;
          if (higher(items[left], items[top])) top = left;
        }
        if (right < size) {
          count.comparisons++;
          if (higher(items[right], items[top])) top = right;
        }
        if (top === at) {
          trace.add(`${items[at]} can stay`, 'It is not below either child, so the heap rule holds here.', scene({ [at]: 'done' }), { tone: 'muted', metrics: metrics() });
          return;
        }
        trace.add(`${items[top]} moves up`, `${items[top]} should be above ${items[at]}, so they swap.`, scene({ [at]: 'active', [top]: 'active' }), { tone: 'active', metrics: metrics() });
        [items[at], items[top]] = [items[top], items[at]];
        count.moves++;
        at = top;
      }
    };
    trace.group = `Build a ${desc ? 'min' : 'max'}-heap`;
    trace.add('Start', `Read the array as a tree: the children of index i are at 2i + 1 and 2i + 2. Fix the tree from the last parent upward. A ${desc ? 'min' : 'max'}-heap keeps the ${desc ? 'smallest' : 'largest'} value on top.`, scene(), { tone: 'muted', metrics: metrics() });
    for (let i = (items.length >> 1) - 1; i >= 0; i--) {
      trace.add(`Fix node ${i}`, `Sift ${items[i]} down until it is above its children.`, scene({ [i]: 'accent' }), { tone: 'accent', metrics: metrics() });
      siftDown(i);
    }
    trace.group = 'Pull values off the top';
    for (let end = items.length - 1; end > 0; end--) {
      [items[0], items[end]] = [items[end], items[0]];
      count.moves++;
      size = end;
      trace.add(`${items[end]} goes to index ${end}`, 'The top of the heap belongs at the end of the sorted part. The last leaf moves to the top, so the heap needs fixing.', scene({ 0: 'accent' }), { tone: 'new', metrics: metrics() });
      siftDown(0);
    }
    trace.group = undefined;
    size = 0;
    trace.finish('Sorted', `${counted(count.comparisons, 'comparison')} and ${counted(count.moves, 'swap')}. Heap sort always takes O(n log n), uses O(1) extra memory, and isn't stable.`, [cells('The array', row(items, { tone: () => 'done' }))], { metrics: metrics() });
    return { frames: trace.frames, answer: { items, ...count } };
  },
};

// ---------- Counting Sort ----------

const countingSort: SimulatorDef = {
  fields: [textField('values', 'Values', '2, 5, 3, 0, 2, 3, 0, 3', { wide: true }), orderField],
  examples: [
    { title: 'Small numbers', about: 'No comparisons: just count, then place.', values: { values: '2, 5, 3, 0, 2, 3, 0, 3', order: 'asc' } },
    { title: 'Negative values', about: 'Shifting by the smallest value makes these work too.', values: { values: '-2, 3, 0, -2, 1', order: 'asc' } },
    { title: 'A wide range', about: 'A large range means a large count table, even for few values.', values: { values: '1, 40, 2', order: 'asc' } },
  ],
  run(input) {
    const items = readValues(input);
    const low = Math.min(...items);
    const high = Math.max(...items);
    if (high - low > 60) throw new Error('Keep the values within a range of 60, because the count table needs one slot for each possible value.');
    const desc = input.order === 'desc';
    const size = high - low + 1;
    const counts = new Array<number>(size).fill(0);
    const output = new Array<number | ''>(items.length).fill('');
    const trace = new Trace();
    const heads = Array.from({ length: size }, (_, i) => i + low);
    const scene = (at: number | undefined, slot: number | undefined, spot?: number, label = 'Counts'): Panel[] => [
      cells('Input', row(items, { tone: i => (i === at ? 'active' : undefined) })),
      tablePanel(label, [counts], { colHead: heads, tone: (_, c) => (c === slot ? 'new' : undefined) }),
      cells('Output', row(output, { tone: i => (i === spot ? 'new' : output[i] !== '' ? 'done' : undefined) })),
    ];
    trace.group = 'Count';
    items.forEach((value, i) => {
      counts[value - low]++;
      trace.add(`Count ${value}`, `The count for ${value} is now ${counts[value - low]}.`, scene(i, value - low), { tone: 'active' });
    });
    trace.group = 'Add up';
    const indices = desc ? [...heads.keys()].reverse() : [...heads.keys()];
    indices.slice(1).forEach((slot, order) => {
      counts[slot] += counts[indices[order]];
      trace.add(`Running total at ${slot + low}`, counts[slot] ? `Now ${counted(counts[slot], 'value')} ${counts[slot] === 1 ? 'comes' : 'come'} before or at ${slot + low} in the output. The last ${slot + low} goes at position ${counts[slot] - 1}.` : `Nothing comes before or at ${slot + low} yet.`, scene(undefined, slot, undefined, 'Running totals'), { tone: 'new' });
    });
    trace.group = 'Place';
    for (let i = items.length - 1; i >= 0; i--) {
      const slot = items[i] - low;
      counts[slot]--;
      output[counts[slot]] = items[i];
      trace.add(`${items[i]} goes to ${counts[slot]}`, 'Going backward through the input keeps equal values in their original order, which makes this stable.', scene(i, slot, counts[slot], 'Running totals'), { tone: 'new' });
    }
    trace.group = undefined;
    trace.finish('Sorted', `No comparisons at all. It took O(n + k), where n = ${items.length} values and k = ${size} possible values.`, [cells('Output', row(output, { tone: () => 'done' }))], { metrics: [{ label: 'Values', value: items.length }, { label: 'Range', value: size }] });
    return { frames: trace.frames, answer: { items: output } };
  },
};

// ---------- Radix Sort ----------

const radixSort: SimulatorDef = {
  fields: [textField('values', 'Values', '170, 45, 75, 90, 802, 24, 2, 66', { wide: true }), orderField, choiceField('base', 'Base', [['10', 'Base 10'], ['2', 'Base 2']])],
  examples: [
    { title: 'Base 10', about: 'Sort by ones, then tens, then hundreds.', values: { values: '170, 45, 75, 90, 802, 24, 2, 66', order: 'asc', base: '10' } },
    { title: 'Base 2', about: 'More passes, with only two buckets in each.', values: { values: '5, 3, 7, 1, 6', order: 'asc', base: '2' } },
  ],
  run(input) {
    let items = numbers(input.values, { minCount: 1, maxCount: 14, min: 0, max: 99999 });
    const desc = input.order === 'desc';
    const base = Number(input.base);
    const trace = new Trace();
    const largest = Math.max(...items);
    let place = 1;
    let pass = 0;
    const digit = (value: number) => Math.floor(value / place) % base;
    const order = (buckets: number[][]) => (desc ? [...buckets].reverse() : buckets);
    const highlight = (value: number, width: number) => {
      const text = value.toString(base).padStart(width, '0');
      return text;
    };
    const width = Math.max(1, largest.toString(base).length);
    do {
      pass++;
      trace.group = `Pass ${pass}: place value ${place}`;
      const buckets: number[][] = Array.from({ length: base }, () => []);
      const scene = (at?: number): Panel[] => [
        cells('Current order', row(items, { tone: i => (i === at ? 'active' : undefined), hideIndex: true, sub: i => highlight(items[i], width) })),
        bucketsPanel(`Buckets for place value ${place}`, buckets.map((values, b) => ({ label: String(b), items: values, tone: at !== undefined && digit(items[at]) === b ? 'active' as Tone : undefined }))),
      ];
      items.forEach((value, i) => {
        buckets[digit(value)].push(value);
        trace.add(`${value} goes in bucket ${digit(value)}`, `The digit at place value ${place} is ${digit(value)}.`, scene(i), { tone: 'active' });
      });
      items = order(buckets).flat();
      trace.add('Collect the buckets', 'Reading the buckets in order keeps earlier passes intact, because each bucket keeps its values in the order they arrived.', scene(), { tone: 'new' });
      place *= base;
    } while (Math.floor(largest / place) > 0);
    trace.group = undefined;
    trace.finish('Sorted', `${pass} passes, one for each digit. Radix sort takes O(d × (n + b)), and relies on each pass being stable.`, [cells('Result', row(items, { tone: () => 'done' }))], { metrics: [{ label: 'Passes', value: pass }, { label: 'Buckets', value: base }] });
    return { frames: trace.frames, answer: { items, passes: pass } };
  },
};

// ---------- Bucket Sort ----------

const bucketSort: SimulatorDef = {
  fields: [textField('values', 'Values', '29, 3, 45, 11, 38, 3', { wide: true }), numberField('buckets', 'Buckets', 5, 1, 10), orderField],
  examples: [
    { title: 'Evenly spread', about: 'Each bucket holds a few values, so sorting them is quick.', values: { values: '29, 3, 45, 11, 38, 3', buckets: '5', order: 'asc' } },
    { title: 'Clustered', about: 'Most values land in one bucket, which is the worst case.', values: { values: '1, 2, 3, 4, 5, 6, 100', buckets: '5', order: 'asc' } },
  ],
  run(input) {
    const items = readValues(input);
    const count = integer(input.buckets, 'Buckets', 1, 10);
    const desc = input.order === 'desc';
    const low = Math.min(...items);
    const high = Math.max(...items);
    const width = (high - low + 1) / count;
    const buckets: number[][] = Array.from({ length: count }, () => []);
    const trace = new Trace();
    const output: number[] = [];
    const label = (b: number) => `${Math.ceil(low + b * width)} to ${Math.ceil(low + (b + 1) * width) - 1}`;
    const scene = (at?: number, active?: number): Panel[] => [
      cells('Input', row(items, { tone: i => (i === at ? 'active' : undefined), hideIndex: true })),
      bucketsPanel('Buckets', buckets.map((values, b) => ({ label: label(b), items: values, tone: b === active ? 'active' as Tone : undefined }))),
      cells('Output', row(output, { hideIndex: true, tone: () => 'done' })),
    ];
    trace.group = 'Scatter';
    items.forEach((value, i) => {
      const b = Math.min(count - 1, Math.floor((value - low) / width));
      buckets[b].push(value);
      trace.add(`${value} goes in bucket ${b}`, `(${value} - ${low}) ÷ ${Math.round(width * 100) / 100}, rounded down, is ${b}.`, scene(i, b), { tone: 'active' });
    });
    trace.group = 'Sort each bucket';
    buckets.forEach((values, b) => {
      if (!values.length) return;
      values.sort((x, y) => (desc ? y - x : x - y));
      trace.add(`Sort bucket ${b}`, values.length === 1 ? 'One value is already sorted.' : `Insertion sort handles ${values.length} values quickly.`, scene(undefined, b), { tone: 'new' });
    });
    trace.group = 'Gather';
    for (const b of desc ? [...buckets.keys()].reverse() : [...buckets.keys()]) {
      if (!buckets[b].length) continue;
      output.push(...buckets[b]);
      trace.add(`Add bucket ${b}`, 'Buckets are in order, so joining them gives a sorted list.', scene(undefined, b), { tone: 'done' });
    }
    trace.group = undefined;
    const busiest = Math.max(...buckets.map(values => values.length));
    trace.finish('Sorted', `The fullest bucket held ${busiest} of ${items.length} values. Evenly spread input gives O(n + k), while clustered input falls back to the cost of the inner sort.`, [cells('Output', row(output, { tone: () => 'done' }))], { metrics: [{ label: 'Fullest bucket', value: busiest }] });
    return { frames: trace.frames, answer: { items: output, busiest } };
  },
};

// ---------- Stable vs Unstable Sorting ----------

const stableVsUnstable: SimulatorDef = {
  fields: [
    textField('records', 'Records (name:key)', 'Ann:2, Bob:1, Cid:2, Dee:1, Eli:3', { wide: true }),
    choiceField('algorithm', 'Algorithm', [['insertion', 'Insertion sort (stable)'], ['merge', 'Merge sort (stable)'], ['selection', 'Selection sort (unstable)'], ['heap', 'Heap sort (unstable)']]),
  ],
  examples: [
    { title: 'Stable', about: 'Ann stays before Cid, and Bob before Dee.', values: { records: 'Ann:2, Bob:1, Cid:2, Dee:1, Eli:3', algorithm: 'insertion' } },
    { title: 'Unstable', about: 'A long swap jumps over an equal record.', values: { records: 'A:2, B:2, C:1', algorithm: 'selection' } },
    { title: 'Heap sort', about: 'Heap moves don\'t respect the original order.', values: { records: 'A:3, B:3, C:3, D:1', algorithm: 'heap' } },
  ],
  run(input) {
    const parts = input.records.split(/[,\n]+/).map(part => part.trim()).filter(Boolean);
    if (parts.length < 2) throw new Error('Enter at least two records, such as Ann:2, Bob:1.');
    if (parts.length > 10) throw new Error('Use at most 10 records, so every step stays readable.');
    const records = parts.map((part, at) => {
      const match = part.match(/^(\w+)\s*:\s*(-?\d+)$/);
      if (!match) throw new Error(`“${part}” isn't a record. Write them like Ann:2.`);
      return { name: match[1], key: Number(match[2]), at };
    });
    type Rec = (typeof records)[number];
    const list = [...records];
    const trace = new Trace();
    const text = (rec: Rec) => `${rec.name}:${rec.key}`;
    const scene = (marks: Record<number, Tone> = {}): Panel[] => [
      cells('Records', row(list.map(text), { tone: i => marks[i] })),
      tablePanel('Equal keys, and their order so far', [...new Set(records.map(rec => rec.key))].sort((a, b) => a - b).filter(key => records.filter(rec => rec.key === key).length > 1).map(key => [key, list.filter(rec => rec.key === key).map(rec => rec.name).join(', '), records.filter(rec => rec.key === key).map(rec => rec.name).join(', ')]), { colHead: ['Key', 'Now', 'Originally'], zone: 'side' }),
    ];
    trace.add('Start', 'Sorting looks only at the key. A stable sort keeps records with equal keys in their original order.', scene(), { tone: 'muted' });
    const algorithm = input.algorithm;
    if (algorithm === 'insertion') {
      for (let i = 1; i < list.length; i++) {
        let j = i;
        while (j > 0 && list[j - 1].key > list[j].key) {
          [list[j - 1], list[j]] = [list[j], list[j - 1]];
          trace.add(`${list[j - 1].name} moves left`, `Its key is strictly smaller. Equal keys never pass each other, because the test uses “greater than”.`, scene({ [j - 1]: 'new' }), { tone: 'new' });
          j--;
        }
      }
    } else if (algorithm === 'merge') {
      const sort = (low: number, high: number) => {
        if (low >= high) return;
        const mid = (low + high) >> 1;
        sort(low, mid);
        sort(mid + 1, high);
        const left = list.slice(low, mid + 1);
        const right = list.slice(mid + 1, high + 1);
        let i = 0;
        let j = 0;
        let k = low;
        while (i < left.length || j < right.length) {
          const takeLeft = j >= right.length || (i < left.length && left[i].key <= right[j].key);
          list[k++] = takeLeft ? left[i++] : right[j++];
        }
        const marks = Object.fromEntries(Array.from({ length: high - low + 1 }, (_, at) => [low + at, 'new' as Tone]));
        trace.add(`Merge ${low} to ${high}`, 'On a tie, the left record goes first, which is what keeps the sort stable.', scene(marks), { tone: 'new' });
      };
      sort(0, list.length - 1);
    } else if (algorithm === 'selection') {
      for (let i = 0; i < list.length - 1; i++) {
        let best = i;
        for (let j = i + 1; j < list.length; j++) if (list[j].key < list[best].key) best = j;
        if (best !== i) {
          const jumped = list[i];
          [list[i], list[best]] = [list[best], list[i]];
          trace.add(`Swap ${list[i].name} and ${jumped.name}`, `${jumped.name} jumps a long way to index ${best}, and it may pass a record with the same key.`, scene({ [i]: 'new', [best]: 'danger' }), { tone: 'new' });
        }
      }
    } else {
      const down = (start: number, size: number) => {
        let at = start;
        while (true) {
          const left = 2 * at + 1;
          const right = left + 1;
          let top = at;
          if (left < size && list[left].key > list[top].key) top = left;
          if (right < size && list[right].key > list[top].key) top = right;
          if (top === at) return;
          [list[at], list[top]] = [list[top], list[at]];
          trace.add(`Swap ${list[at].name} and ${list[top].name}`, 'Heap moves follow the tree shape, and pay no attention to the original order.', scene({ [at]: 'new', [top]: 'new' }), { tone: 'new' });
          at = top;
        }
      };
      for (let i = (list.length >> 1) - 1; i >= 0; i--) down(i, list.length);
      for (let end = list.length - 1; end > 0; end--) {
        [list[0], list[end]] = [list[end], list[0]];
        trace.add(`${list[end].name} goes to index ${end}`, 'The top of the heap goes to the end.', scene({ [end]: 'new' }), { tone: 'new' });
        down(0, end);
      }
    }
    const stable = list.every((rec, i) => i === 0 || list[i - 1].key !== rec.key || list[i - 1].at < rec.at);
    const hasEqual = new Set(records.map(rec => rec.key)).size < records.length;
    trace.finish(!hasEqual ? 'Sorted, with no equal keys' : stable ? 'Order was kept' : 'Order changed', !hasEqual ? 'Every key is different, so stability can\'t show here.' : stable ? 'Records with equal keys stayed in their original order on this input.' : 'Some records with equal keys swapped order. This algorithm isn\'t stable.', scene(), { tone: stable ? 'done' : 'danger', metrics: [{ label: 'Equal keys kept in order', value: stable ? 'Yes' : 'No', tone: stable ? 'done' : 'danger' }] });
    return { frames: trace.frames, answer: { names: list.map(rec => rec.name), keys: list.map(rec => rec.key), stable } };
  },
};

export const simulators: Record<string, SimulatorDef> = {
  'bubble-sort': bubbleSort,
  'bucket-sort': bucketSort,
  'counting-sort': countingSort,
  'heap-sort': heapSort,
  'insertion-sort': insertionSort,
  'merge-sort': mergeSort,
  'quick-sort': quickSort,
  'radix-sort': radixSort,
  'selection-sort': selectionSort,
  'stable-vs-unstable-sorting': stableVsUnstable,
};
