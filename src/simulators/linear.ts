import { counted, bars, cells, choiceField, integer, logPanel, numberField, numbers, operations, opsField, row, stackPanel, textField, Trace, whenChoice, words, type Panel, type SimulatorDef, type Tone } from './kit.ts';

type LinkNode = { id: string; value: string; tone?: Tone; tags?: string[] };

// ---------- Arrays ----------

const arrays: SimulatorDef = {
  fields: [
    textField('values', 'Start with', '12, 45, 7, 30'),
    opsField('ops', 'Operations', 'read 2, insert 1 99, delete 0, search 30', [{ label: 'Read', op: 'read', takesValue: true }, { label: 'Write', op: 'write', takesValue: true }, { label: 'Insert', op: 'insert', takesValue: true }, { label: 'Delete', op: 'delete', takesValue: true }, { label: 'Search', op: 'search', takesValue: true }, { label: 'Append', op: 'append', takesValue: true }]),
  ],
  examples: [
    { title: 'Reading is instant', about: 'Any index takes one step, wherever it is.', values: { values: '12, 45, 7, 30', ops: 'read 0, read 3' } },
    { title: 'Inserting at the front', about: 'Every value has to shift right first.', values: { values: '1, 2, 3, 4, 5', ops: 'insert 0 9' } },
    { title: 'Deleting from the middle', about: 'Everything after it shifts left.', values: { values: '1, 2, 3, 4, 5', ops: 'delete 2' } },
  ],
  run(input) {
    const items = numbers(input.values, { minCount: 0, maxCount: 12 }).map(String);
    const list = operations(input.ops, { read: 1, write: 2, insert: 2, delete: 1, search: 1, append: 1 }, 10);
    const trace = new Trace();
    const log: { text: string; tone?: Tone }[] = [];
    let moves = 0;
    const scene = (tone?: (i: number) => Tone | undefined): Panel[] => [cells('Array', row(items, { tone })), logPanel('Results', log)];
    const metrics = () => [{ label: 'Length', value: items.length }, { label: 'Values moved', value: moves }];
    trace.add('Start', 'An array keeps its values side by side, so index i is found directly: start address + i × slot size.', scene(), { tone: 'muted', metrics: metrics() });
    const inRange = (i: number, top: number, name: string) => {
      if (Number.isInteger(i) && i >= 0 && i < top) return true;
      log.push({ text: `${name}: index ${i} is out of range`, tone: 'danger' });
      trace.add(`${name} ${i}: out of range`, `Valid indexes run from 0 to ${top - 1}.`, scene(), { tone: 'danger', metrics: metrics() });
      return false;
    };
    for (const { op, value, second } of list) {
      trace.group = `${op} ${value}${second ? ` ${second}` : ''}`;
      const index = Number(value);
      if (op === 'read') {
        if (!inRange(index, items.length, 'Read')) continue;
        log.push({ text: `read ${index} = ${items[index]}` });
        trace.add(`Read index ${index}`, `The address is calculated directly, so this takes one step: O(1).`, scene(i => (i === index ? 'active' : undefined)), { tone: 'active', metrics: metrics() });
      } else if (op === 'write') {
        if (!inRange(index, items.length, 'Write')) continue;
        items[index] = second!;
        moves++;
        trace.add(`Write ${second} at ${index}`, 'Overwriting one slot takes one step: O(1).', scene(i => (i === index ? 'new' : undefined)), { tone: 'new', metrics: metrics() });
      } else if (op === 'append') {
        items.push(value!);
        moves++;
        trace.add(`Append ${value}`, 'Nothing else has to move, so adding at the end takes one step.', scene(i => (i === items.length - 1 ? 'new' : undefined)), { tone: 'new', metrics: metrics() });
      } else if (op === 'insert') {
        if (!inRange(index, items.length + 1, 'Insert')) continue;
        items.push('');
        for (let i = items.length - 1; i > index; i--) {
          items[i] = items[i - 1];
          items[i - 1] = '';
          moves++;
          trace.add(`Shift index ${i - 1} right`, 'Go from the end, so nothing gets overwritten.', scene(at => (at === i ? 'active' : at === i - 1 ? 'muted' : undefined)), { tone: 'active', metrics: metrics() });
        }
        items[index] = second!;
        moves++;
        trace.add(`Place ${second} at ${index}`, 'The gap is open, so the new value goes in. Inserting costs O(n), because of the shifting.', scene(i => (i === index ? 'new' : undefined)), { tone: 'new', metrics: metrics() });
      } else if (op === 'delete') {
        if (!inRange(index, items.length, 'Delete')) continue;
        const removed = items[index];
        items[index] = '';
        trace.add(`Remove ${removed}`, 'This leaves a gap that must be closed.', scene(i => (i === index ? 'danger' : undefined)), { tone: 'danger', metrics: metrics() });
        for (let i = index; i < items.length - 1; i++) {
          items[i] = items[i + 1];
          items[i + 1] = '';
          moves++;
          trace.add(`Shift index ${i + 1} left`, 'Each later value moves one slot to the left.', scene(at => (at === i ? 'active' : undefined)), { tone: 'active', metrics: metrics() });
        }
        items.pop();
      } else {
        let found = -1;
        for (let i = 0; i < items.length; i++) {
          trace.add(`Check index ${i}`, `Is ${items[i]} equal to ${value}?`, scene(at => (at === i ? 'active' : at < i ? 'muted' : undefined)), { tone: 'active', metrics: metrics() });
          if (items[i] === value) {
            found = i;
            break;
          }
        }
        log.push({ text: found >= 0 ? `search ${value}: index ${found}` : `search ${value}: not found`, tone: found >= 0 ? 'done' : 'danger' });
        trace.add(found >= 0 ? `Found at ${found}` : 'Not found', 'An unsorted array has to be searched one value at a time: O(n).', scene(i => (i === found ? 'done' : undefined)), { tone: found >= 0 ? 'done' : 'danger', metrics: metrics() });
      }
    }
    trace.group = undefined;
    trace.finish('Finished', `The array now holds ${items.length} values, and ${moves} values were moved or written in total.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { items: items.map(Number), log: log.map(line => line.text) } };
  },
};

// ---------- Bit Array ----------

const bitArray: SimulatorDef = {
  fields: [
    numberField('size', 'Bits', 20, 1, 40),
    opsField('ops', 'Operations', 'set 3, set 19, get 19, get 4, clear 19, count', [{ label: 'Set', op: 'set', takesValue: true }, { label: 'Clear', op: 'clear', takesValue: true }, { label: 'Get', op: 'get', takesValue: true }, { label: 'Flip', op: 'flip', takesValue: true }, { label: 'Count', op: 'count' }]),
  ],
  examples: [
    { title: 'Set and read', about: 'Index 19 is word 2, bit 3.', values: { size: '20', ops: 'set 19, get 19, get 18' } },
    { title: 'A set of numbers', about: 'Each bit says whether its number is in the set.', values: { size: '16', ops: 'set 1, set 4, set 9, count, clear 4, count' } },
  ],
  run(input) {
    const size = integer(input.size, 'Bits', 1, 40);
    const list = operations(input.ops, { set: 1, clear: 1, get: 1, flip: 1, count: 0 });
    const words8 = new Array<number>(Math.ceil(size / 8)).fill(0);
    const log: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    const scene = (at?: number, tone: Tone = 'active'): Panel[] => [
      cells('Words of 8 bits', words8.map((word, w) => row(Array.from({ length: 8 }, (_, b) => (word >> (7 - b)) & 1), {
        label: `Word ${w}`, hideIndex: true,
        tone: b => (at !== undefined && Math.floor(at / 8) === w && 7 - b === at % 8 ? tone : (word >> (7 - b)) & 1 ? 'value' : undefined),
        sub: b => String(w * 8 + 7 - b),
      })), { small: true }),
      logPanel('Results', log),
    ];
    const memory = [{ label: 'Bytes used', value: words8.length }, { label: 'As a byte array', value: size }];
    trace.add('Start', `${size} true-or-false values fit in ${words8.length} byte${words8.length === 1 ? '' : 's'}, where a normal array would need ${size}.`, scene(), { tone: 'muted', metrics: memory });
    for (const { op, value } of list) {
      if (op === 'count') {
        const total = words8.reduce((sum, word) => sum + word.toString(2).split('1').length - 1, 0);
        log.push({ text: `count = ${total}` });
        trace.add(`Count: ${total}`, 'A whole word can be counted at once, so this takes one step per word.', scene(), { tone: 'accent', metrics: memory });
        continue;
      }
      const i = Number(value);
      if (!Number.isInteger(i) || i < 0 || i >= size) {
        log.push({ text: `${op} ${value}: out of range`, tone: 'danger' });
        trace.add(`${op} ${value}: out of range`, `Valid bit indexes run from 0 to ${size - 1}.`, scene(), { tone: 'danger', metrics: memory });
        continue;
      }
      const word = Math.floor(i / 8);
      const bit = i % 8;
      const where = `Word ${i} // 8 = ${word}, and bit ${i} % 8 = ${bit}. The mask is 1 << ${bit}.`;
      if (op === 'get') {
        const result = (words8[word] >> bit) & 1;
        log.push({ text: `get ${i} = ${result}` });
        trace.add(`Get ${i}: ${result}`, `${where} Shift and AND to read it.`, scene(i, result ? 'done' : 'active'), { tone: 'active', metrics: memory });
      } else {
        if (op === 'set') words8[word] |= 1 << bit;
        else if (op === 'clear') words8[word] &= ~(1 << bit);
        else words8[word] ^= 1 << bit;
        trace.add(`${op[0].toUpperCase()}${op.slice(1)} ${i}`, `${where} ${op === 'set' ? 'OR with the mask turns it on.' : op === 'clear' ? 'AND with the inverted mask turns it off.' : 'XOR with the mask flips it.'}`, scene(i, 'new'), { tone: 'new', metrics: memory });
      }
    }
    trace.finish('Finished', 'Every operation took one step, however large the array is.', scene(), { metrics: memory });
    return { frames: trace.frames, answer: { words: words8, log: log.map(line => line.text) } };
  },
};

// ---------- Circular Queue ----------

const circularQueue: SimulatorDef = {
  fields: [
    numberField('capacity', 'Capacity', 4, 1, 12),
    opsField('ops', 'Operations', 'enqueue 10, enqueue 20, enqueue 30, dequeue, enqueue 40, enqueue 50, dequeue', [{ label: 'Enqueue', op: 'enqueue', takesValue: true }, { label: 'Dequeue', op: 'dequeue' }, { label: 'Front', op: 'front' }]),
  ],
  examples: [
    { title: 'Wrapping around', about: 'The back reuses the slot that the front freed.', values: { capacity: '4', ops: 'enqueue 10, enqueue 20, enqueue 30, dequeue, enqueue 40, enqueue 50' } },
    { title: 'Full and empty', about: 'See what happens at both limits.', values: { capacity: '2', ops: 'enqueue 1, enqueue 2, enqueue 3, dequeue, dequeue, dequeue' } },
  ],
  run(input) {
    const capacity = integer(input.capacity, 'Capacity', 1, 12);
    const list = operations(input.ops, { enqueue: 1, dequeue: 0, front: 0 });
    const slots = new Array<string>(capacity).fill('');
    let front = 0;
    let count = 0;
    const log: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    const scene = (at?: number, tone: Tone = 'new'): Panel[] => {
      const pointers: Record<number, string> = {};
      const back = (front + count) % capacity;
      pointers[front] = 'front';
      pointers[back] = pointers[back] ? 'front, next' : 'next';
      return [cells('Slots (the end wraps back to the start)', row(slots, { pointers, tone: i => (i === at ? tone : slots[i] ? 'value' : undefined) })), logPanel('Results', log)];
    };
    const metrics = () => [{ label: 'Front', value: front }, { label: 'Count', value: count }, { label: 'Capacity', value: capacity }];
    trace.add('Start', 'The queue is empty. The next free slot is always (front + count) % capacity.', scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value } of list) {
      if (op === 'enqueue') {
        if (count === capacity) {
          log.push({ text: `enqueue ${value}: full`, tone: 'danger' });
          trace.add(`Enqueue ${value}: full`, `All ${capacity} slots are in use, so this value can't be added.`, scene(), { tone: 'danger', metrics: metrics() });
          continue;
        }
        const back = (front + count) % capacity;
        slots[back] = value!;
        count++;
        trace.add(`Enqueue ${value}`, `(${front} + ${count - 1}) % ${capacity} = ${back}, so it goes in slot ${back}. Nothing has to shift.`, scene(back), { tone: 'new', metrics: metrics() });
      } else if (!count) {
        log.push({ text: `${op}: empty`, tone: 'danger' });
        trace.add(`${op}: empty`, 'The queue is empty, so there is nothing at the front.', scene(), { tone: 'danger', metrics: metrics() });
      } else if (op === 'front') {
        log.push({ text: `front = ${slots[front]}` });
        trace.add(`Front is ${slots[front]}`, 'Reading the front changes nothing.', scene(front, 'active'), { tone: 'active', metrics: metrics() });
      } else {
        const out = slots[front];
        slots[front] = '';
        const was = front;
        front = (front + 1) % capacity;
        count--;
        log.push({ text: `dequeue = ${out}` });
        trace.add(`Dequeue ${out}`, `The front moves from ${was} to (${was} + 1) % ${capacity} = ${front}. Slot ${was} can be reused.`, scene(was, 'danger'), { tone: 'accent', metrics: metrics() });
      }
    }
    trace.finish('Finished', `Every operation took one step, and nothing ever shifted. ${count} value${count === 1 ? ' is' : 's are'} left.`, scene(), { metrics: metrics() });
    const contents = Array.from({ length: count }, (_, i) => slots[(front + i) % capacity]);
    return { frames: trace.frames, answer: { contents: contents.map(Number), front, log: log.map(line => line.text) } };
  },
};

// ---------- Deque ----------

const deque: SimulatorDef = {
  fields: [opsField('ops', 'Operations', 'pushback 20, pushback 30, pushfront 10, popback, popfront', [{ label: 'Push Front', op: 'pushfront', takesValue: true }, { label: 'Push Back', op: 'pushback', takesValue: true }, { label: 'Pop Front', op: 'popfront' }, { label: 'Pop Back', op: 'popback' }])],
  examples: [
    { title: 'Both ends', about: 'Add and remove at either end.', values: { ops: 'pushback 20, pushback 30, pushfront 10, popback, popfront' } },
    { title: 'As a stack', about: 'Using only one end gives last in, first out.', values: { ops: 'pushback 1, pushback 2, pushback 3, popback, popback' } },
    { title: 'As a queue', about: 'Add at one end, and remove at the other.', values: { ops: 'pushback 1, pushback 2, pushback 3, popfront, popfront' } },
  ],
  run(input) {
    const list = operations(input.ops, { pushfront: 1, pushback: 1, popfront: 0, popback: 0 });
    const items: string[] = [];
    const log: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    const scene = (at?: number, tone: Tone = 'new'): Panel[] => [
      cells('Deque', row(items, { hideIndex: true, pointers: items.length ? { 0: items.length === 1 ? 'front, back' : 'front', ...(items.length > 1 ? { [items.length - 1]: 'back' } : {}) } : undefined, tone: i => (i === at ? tone : undefined) })),
      logPanel('Removed', log),
    ];
    trace.add('Start', 'A deque can add and remove at both ends, all in one step.', scene(), { tone: 'muted' });
    for (const { op, value } of list) {
      if (op === 'pushfront') {
        items.unshift(value!);
        trace.add(`Push ${value} at the front`, 'It becomes the new front value.', scene(0), { tone: 'new' });
      } else if (op === 'pushback') {
        items.push(value!);
        trace.add(`Push ${value} at the back`, 'It becomes the new back value.', scene(items.length - 1), { tone: 'new' });
      } else if (!items.length) {
        log.push({ text: `${op}: empty`, tone: 'danger' });
        trace.add(`${op}: empty`, 'There is nothing to remove.', scene(), { tone: 'danger' });
      } else {
        const out = op === 'popfront' ? items.shift()! : items.pop()!;
        log.push({ text: `${op === 'popfront' ? 'front' : 'back'}: ${out}` });
        trace.add(`Pop ${out} from the ${op === 'popfront' ? 'front' : 'back'}`, 'One end gives up its value in one step.', scene(), { tone: 'accent' });
      }
    }
    trace.finish('Finished', `${items.length} value${items.length === 1 ? ' is' : 's are'} left.`, scene());
    return { frames: trace.frames, answer: { items: items.map(Number), log: log.map(line => line.text) } };
  },
};

// ---------- Linked lists, in all their forms ----------

function runList(kind: 'single' | 'double' | 'circular' | 'circular-double', opsText: string) {
  const list = operations(opsText, { addfirst: 1, addlast: 1, insert: 2, delete: 1, search: 1, reverse: 0, backward: 0 });
  const double = kind === 'double' || kind === 'circular-double';
  const circular = kind === 'circular' || kind === 'circular-double';
  let serial = 0;
  let nodes: { id: string; value: string }[] = [];
  const log: { text: string; tone?: Tone }[] = [];
  const trace = new Trace();
  let changes = 0;
  const scene = (marks: Record<number, Tone> = {}): Panel[] => [
    { kind: 'links', title: circular ? 'The list (the last node links back to the first)' : 'The list', double, circular, nodes: nodes.map((node, i) => ({ ...node, tone: marks[i], tags: [...(i === 0 ? ['head'] : []), ...(i === nodes.length - 1 ? ['tail'] : [])] } as LinkNode)) },
    logPanel('Results', log),
  ];
  const metrics = () => [{ label: 'Length', value: nodes.length }, { label: 'Links changed', value: changes }];
  const linksPer = double ? 2 : 1;
  const walk = (upTo: number, why: string) => {
    for (let i = 0; i < upTo; i++) trace.add(`Walk to node ${i}`, why, scene({ [i]: 'active' }), { tone: 'active', metrics: metrics() });
  };
  trace.add('Start', double ? 'Each node links to the next one and to the previous one.' : 'Each node links to the next one.', scene(), { tone: 'muted', metrics: metrics() });
  for (const { op, value, second } of list) {
    trace.group = `${op}${value ? ` ${value}` : ''}${second ? ` ${second}` : ''}`;
    if (op === 'addfirst') {
      nodes.unshift({ id: `n${serial++}`, value: value! });
      changes += linksPer + (circular ? 1 : 0);
      trace.add(`Add ${value} at the head`, `The new node points at the old head, and the head moves to it.${circular ? ' The tail also links back to it.' : ''} This takes one step.`, scene({ 0: 'new' }), { tone: 'new', metrics: metrics() });
    } else if (op === 'addlast') {
      if (kind === 'single' || kind === 'circular') walk(nodes.length, 'A singly linked list has to walk to its last node. Keeping a tail pointer would avoid this.');
      nodes.push({ id: `n${serial++}`, value: value! });
      changes += linksPer + (circular ? 1 : 0);
      trace.add(`Add ${value} at the tail`, double ? 'The tail is known, so this takes one step.' : 'The old last node now points at the new one.', scene({ [nodes.length - 1]: 'new' }), { tone: 'new', metrics: metrics() });
    } else if (op === 'insert') {
      const index = Number(value);
      if (!Number.isInteger(index) || index < 0 || index > nodes.length) {
        log.push({ text: `insert: position ${value} is out of range`, tone: 'danger' });
        trace.add(`Position ${value} is out of range`, `Valid positions run from 0 to ${nodes.length}.`, scene(), { tone: 'danger', metrics: metrics() });
        continue;
      }
      walk(index, 'Reaching a position means following the links from the head.');
      nodes.splice(index, 0, { id: `n${serial++}`, value: second! });
      changes += linksPer * 2;
      trace.add(`Insert ${second} at position ${index}`, 'Only the neighboring links change. No values shift, unlike an array.', scene({ [index]: 'new' }), { tone: 'new', metrics: metrics() });
    } else if (op === 'delete' || op === 'search') {
      let found = -1;
      for (let i = 0; i < nodes.length; i++) {
        trace.add(`Check ${nodes[i].value}`, `Is it ${value}?`, scene({ [i]: 'active' }), { tone: 'active', metrics: metrics() });
        if (nodes[i].value === value) {
          found = i;
          break;
        }
      }
      if (found < 0) {
        log.push({ text: `${op} ${value}: not found`, tone: 'danger' });
        trace.add(`${value} isn't in the list`, 'The walk reached the end without finding it.', scene(), { tone: 'danger', metrics: metrics() });
      } else if (op === 'search') {
        log.push({ text: `search ${value}: position ${found}`, tone: 'done' });
        trace.add(`Found ${value} at position ${found}`, 'A linked list has no random access, so searching takes O(n).', scene({ [found]: 'done' }), { tone: 'done', metrics: metrics() });
      } else {
        trace.add(`Unlink ${value}`, double ? 'The node knows both neighbors, so they can link to each other directly.' : 'The node before it now skips over it.', scene({ [found]: 'danger' }), { tone: 'danger', metrics: metrics() });
        nodes.splice(found, 1);
        changes += linksPer;
        log.push({ text: `deleted ${value}` });
        trace.add(`${value} is gone`, 'No other values had to move.', scene(), { tone: 'accent', metrics: metrics() });
      }
    } else if (op === 'reverse') {
      const reversed: typeof nodes = [];
      for (const node of nodes) {
        reversed.unshift(node);
        changes += linksPer;
        trace.add(`Turn ${node.value}'s link around`, 'Walk the list with three pointers: previous, current, and next. Each step turns one link around.', scene(Object.fromEntries(nodes.map((_, i) => [i, nodes[i] === node ? 'active' : reversed.includes(nodes[i]) ? 'done' : 'muted'])) as Record<number, Tone>), { tone: 'active', metrics: metrics() });
      }
      nodes = reversed;
      trace.add('Reversed', 'The old tail is the new head. This took O(n) time and O(1) extra space.', scene(), { tone: 'new', metrics: metrics() });
    } else {
      if (!double) {
        log.push({ text: 'backward: needs previous links', tone: 'danger' });
        trace.add('Can\'t walk backward', 'A singly linked list has no previous links, so it can only go forward.', scene(), { tone: 'danger', metrics: metrics() });
      } else {
        const seen: string[] = [];
        for (let i = nodes.length - 1; i >= 0; i--) {
          seen.push(nodes[i].value);
          trace.add(`Back to ${nodes[i].value}`, 'Each node knows the one before it.', scene({ [i]: 'active' }), { tone: 'active', metrics: metrics() });
        }
        log.push({ text: `backward: ${seen.join(', ')}` });
      }
    }
  }
  trace.group = undefined;
  trace.finish('Finished', `The list holds ${nodes.length} nodes. ${changes} links were changed in total, and no values were shifted.`, scene(), { metrics: metrics() });
  return { frames: trace.frames, answer: { items: nodes.map(node => Number(node.value)), log: log.map(line => line.text) } };
}

const linkedOps = [{ label: 'Add First', op: 'addfirst', takesValue: true }, { label: 'Add Last', op: 'addlast', takesValue: true }, { label: 'Insert', op: 'insert', takesValue: true }, { label: 'Delete', op: 'delete', takesValue: true }, { label: 'Search', op: 'search', takesValue: true }, { label: 'Reverse', op: 'reverse' }];

const linkedLists: SimulatorDef = {
  fields: [opsField('ops', 'Operations', 'addlast 10, addlast 20, addlast 30, addfirst 5, insert 2 15, delete 20, search 30, reverse', linkedOps)],
  examples: [
    { title: 'Add at the head', about: 'One step, whatever the length.', values: { ops: 'addfirst 3, addfirst 2, addfirst 1' } },
    { title: 'Reverse', about: 'Each link gets turned around.', values: { ops: 'addlast 1, addlast 2, addlast 3, addlast 4, reverse' } },
    { title: 'Delete', about: 'The node before it skips over it.', values: { ops: 'addlast 1, addlast 2, addlast 3, delete 2, delete 9' } },
  ],
  run: values => runList('single', values.ops),
};

const doublyCircular: SimulatorDef = {
  fields: [
    choiceField('kind', 'Kind', [['double', 'Doubly linked'], ['circular', 'Circular, singly linked'], ['circular-double', 'Circular, doubly linked']]),
    opsField('ops', 'Operations', 'addlast 10, addlast 20, addlast 30, addfirst 5, delete 20, backward', [...linkedOps.slice(0, 5), { label: 'Backward', op: 'backward' }]),
  ],
  examples: [
    { title: 'Walk backward', about: 'Only doubly linked lists can do this.', values: { kind: 'double', ops: 'addlast 1, addlast 2, addlast 3, backward' } },
    { title: 'A circular list', about: 'The last node links back to the first.', values: { kind: 'circular', ops: 'addlast 1, addlast 2, addlast 3, addfirst 0' } },
    { title: 'Singly linked limits', about: 'Going backward isn\'t possible here.', values: { kind: 'circular', ops: 'addlast 1, addlast 2, backward' } },
  ],
  run: values => runList(values.kind as 'double' | 'circular' | 'circular-double', values.ops),
};

// ---------- Dynamic Arrays ----------

const dynamicArrays: SimulatorDef = {
  fields: [numberField('count', 'Append this many', 9, 1, 40), choiceField('growth', 'When full', [['double', 'Double the capacity'], ['half', 'Grow by 1.5 times'], ['fixed', 'Add 4 more slots']]), numberField('start', 'Start capacity', 1, 1, 8)],
  examples: [
    { title: 'Doubling', about: '9 appends copy only 15 values in total.', values: { count: '9', growth: 'double', start: '1' } },
    { title: 'Fixed growth', about: 'Copies pile up much faster on long runs.', values: { count: '30', growth: 'fixed', start: '1' } },
  ],
  run(values) {
    const count = integer(values.count, 'Count', 1, 40);
    let capacity = integer(values.start, 'Start capacity', 1, 8);
    const growth = values.growth;
    const trace = new Trace();
    let size = 0;
    let copies = 0;
    const costs: number[] = [];
    const scene = (fresh?: number): Panel[] => [
      cells(`Capacity ${capacity}`, row(Array.from({ length: capacity }, (_, i) => (i < size ? i + 1 : '')), { tone: i => (i === fresh ? 'new' : i < size ? 'value' : 'muted'), hideIndex: true }), { small: capacity > 16 }),
      bars('Cost of each append', costs, i => (costs[i] > 1 ? 'danger' : 'done'), costs.map((_, i) => String(i + 1))),
    ];
    const metrics = () => [{ label: 'Size', value: size }, { label: 'Capacity', value: capacity }, { label: 'Values copied', value: copies }, { label: 'Average cost', value: size ? Math.round(((copies + size) / size) * 100) / 100 : 0 }];
    for (let i = 1; i <= count; i++) {
      let cost = 1;
      if (size === capacity) {
        const next = growth === 'double' ? capacity * 2 : growth === 'half' ? Math.max(capacity + 1, Math.ceil(capacity * 1.5)) : capacity + 4;
        trace.add(`Full: grow to ${next}`, capacity === 1 ? `The one slot is in use. A new block of ${next} slots is allocated, and the value is copied into it.` : `All ${capacity} slots are in use. A new block of ${next} slots is allocated, and all ${size} values are copied into it.`, scene(), { tone: 'danger', metrics: metrics() });
        copies += size;
        cost += size;
        capacity = next;
      }
      size++;
      costs.push(cost);
      trace.add(`Append ${i}${cost > 1 ? ` (cost ${cost})` : ''}`, cost > 1 ? `This append cost ${cost}: ${counted(cost - 1, 'copy', 'copies')} plus one write.` : 'There is room, so this takes one write.', scene(size - 1), { tone: cost > 1 ? 'accent' : 'new', metrics: metrics() });
    }
    const average = Math.round(((copies + size) / size) * 100) / 100;
    trace.finish('Finished', growth === 'fixed' ? `${size} appends cost ${copies + size} steps, an average of ${average} each. With a fixed amount, that average keeps growing with n.` : `${size} appends cost ${copies + size} steps, an average of ${average} each. Growing by a factor keeps the average constant: O(1) amortized.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { capacity, copies, size } };
  },
};

// ---------- Queue ----------

const queue: SimulatorDef = {
  fields: [
    choiceField('built', 'Built on', [['linked', 'Linked list'], ['array', 'Array, shifting']]),
    opsField('ops', 'Operations', 'enqueue 10, enqueue 20, dequeue, enqueue 30, front, dequeue', [{ label: 'Enqueue', op: 'enqueue', takesValue: true }, { label: 'Dequeue', op: 'dequeue' }, { label: 'Front', op: 'front' }]),
  ],
  examples: [
    { title: 'First in, first out', about: 'Values leave in the order they arrived.', values: { built: 'linked', ops: 'enqueue 1, enqueue 2, enqueue 3, dequeue, dequeue, dequeue' } },
    { title: 'The cost of an array', about: 'Each dequeue shifts everything left.', values: { built: 'array', ops: 'enqueue 1, enqueue 2, enqueue 3, enqueue 4, dequeue, dequeue' } },
    { title: 'Empty queue', about: 'There is nothing to remove.', values: { built: 'linked', ops: 'enqueue 1, dequeue, dequeue' } },
  ],
  run(input) {
    const list = operations(input.ops, { enqueue: 1, dequeue: 0, front: 0 });
    const asArray = input.built === 'array';
    const items: string[] = [];
    const log: { text: string; tone?: Tone }[] = [];
    let moves = 0;
    const trace = new Trace();
    const scene = (at?: number, tone: Tone = 'new'): Panel[] => [
      cells('Queue', row(items, { hideIndex: true, pointers: items.length ? { 0: items.length === 1 ? 'front, back' : 'front', ...(items.length > 1 ? { [items.length - 1]: 'back' } : {}) } : undefined, tone: i => (i === at ? tone : undefined) })),
      logPanel('Results', log),
    ];
    const metrics = () => [{ label: 'Size', value: items.length }, { label: asArray ? 'Values shifted' : 'Links changed', value: moves }];
    trace.add('Start', 'New values join at the back, and the front value leaves first.', scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value } of list) {
      if (op === 'enqueue') {
        items.push(value!);
        moves += asArray ? 0 : 1;
        trace.add(`Enqueue ${value}`, 'It joins at the back, in one step.', scene(items.length - 1), { tone: 'new', metrics: metrics() });
      } else if (!items.length) {
        log.push({ text: `${op}: empty`, tone: 'danger' });
        trace.add(`${op}: empty`, 'The queue is empty.', scene(), { tone: 'danger', metrics: metrics() });
      } else if (op === 'front') {
        log.push({ text: `front = ${items[0]}` });
        trace.add(`Front is ${items[0]}`, 'Reading the front changes nothing.', scene(0, 'active'), { tone: 'active', metrics: metrics() });
      } else {
        const out = items.shift()!;
        moves += asArray ? items.length : 1;
        log.push({ text: `dequeue = ${out}` });
        trace.add(`Dequeue ${out}`, asArray ? `The array has to shift ${counted(items.length, 'value')} left, which costs O(n). A circular queue avoids this.` : 'The head pointer moves to the next node, in one step.', scene(), { tone: 'accent', metrics: metrics() });
      }
    }
    trace.finish('Finished', `Values left in the order they arrived. ${items.length} remain.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { items: items.map(Number), moves, log: log.map(line => line.text) } };
  },
};

// ---------- Stack ----------

const stack: SimulatorDef = {
  fields: [opsField('ops', 'Operations', 'push 10, push 20, push 30, peek, pop, pop', [{ label: 'Push', op: 'push', takesValue: true }, { label: 'Pop', op: 'pop' }, { label: 'Peek', op: 'peek' }])],
  examples: [
    { title: 'Last in, first out', about: 'The last value pushed comes off first.', values: { ops: 'push 1, push 2, push 3, pop, pop, pop' } },
    { title: 'Underflow', about: 'Popping an empty stack fails.', values: { ops: 'push 1, pop, pop' } },
  ],
  run(input) {
    const list = operations(input.ops, { push: 1, pop: 0, peek: 0 });
    const items: string[] = [];
    const log: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    const scene = (tone?: Tone): Panel[] => [stackPanel('Stack', items, { zone: 'main', tone: i => (i === items.length - 1 ? tone : undefined), empty: 'The stack is empty' }), logPanel('Results', log)];
    const metrics = () => [{ label: 'Size', value: items.length }, { label: 'Top', value: items.at(-1) ?? 'None' }];
    trace.add('Start', 'A stack only works at its top, like a pile of plates.', scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value } of list) {
      if (op === 'push') {
        items.push(value!);
        trace.add(`Push ${value}`, `${value} goes on top, in one step.`, scene('new'), { tone: 'new', metrics: metrics() });
      } else if (!items.length) {
        log.push({ text: `${op}: empty`, tone: 'danger' });
        trace.add(`${op}: empty`, 'This is called an underflow. There is nothing on the stack.', scene(), { tone: 'danger', metrics: metrics() });
      } else if (op === 'peek') {
        log.push({ text: `peek = ${items.at(-1)}` });
        trace.add(`Peek: ${items.at(-1)}`, 'Peek reads the top without removing it.', scene('active'), { tone: 'active', metrics: metrics() });
      } else {
        const out = items.pop()!;
        log.push({ text: `pop = ${out}` });
        trace.add(`Pop ${out}`, 'The most recent value comes off first.', scene(), { tone: 'accent', metrics: metrics() });
      }
    }
    trace.finish('Finished', `${items.length} value${items.length === 1 ? ' is' : 's are'} left on the stack.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { items: items.map(Number), log: log.map(line => line.text) } };
  },
};

// ---------- Strings ----------

const strings: SimulatorDef = {
  fields: [
    textField('text', 'Text', 'racecar'),
    choiceField('op', 'Operation', [['palindrome', 'Check for a palindrome'], ['reverse', 'Reverse it'], ['vowels', 'Count the vowels'], ['anagram', 'Anagram of the second text?'], ['compare', 'Compare with the second text'], ['codes', 'Show character codes']]),
    whenChoice(textField('second', 'Second text', 'silent'), 'op', 'anagram', 'compare'),
  ],
  examples: [
    { title: 'Palindrome', about: 'Compare from both ends, moving inward.', values: { text: 'racecar', op: 'palindrome' } },
    { title: 'Anagram', about: 'Count the letters with an array of 26 slots.', values: { text: 'listen', second: 'silent', op: 'anagram' } },
    { title: 'Compare', about: 'Stops at the first difference.', values: { text: 'apple', second: 'apply', op: 'compare' } },
    { title: 'Capital letters', about: 'Capitals have lower codes, so Zebra comes before apple.', values: { text: 'Zebra', second: 'apple', op: 'compare' } },
  ],
  run(input) {
    const text = words(input.text, { label: 'some text', maxLength: 16 });
    const op = input.op;
    const trace = new Trace();
    const chars = [...text];
    const line = (values: string[], options: Parameters<typeof row>[1] = {}) => row(values, { sub: i => String(values[i]?.charCodeAt(0) ?? ''), ...options });
    let answer: unknown;
    let summary: { label: string; value: string | number; tone?: Tone }[] = [];
    if (op === 'palindrome') {
      let low = 0;
      let high = chars.length - 1;
      let ok = true;
      while (low < high) {
        const same = chars[low] === chars[high];
        trace.add(`${chars[low]} and ${chars[high]}`, same ? 'They match, so move both pointers inward.' : 'They differ, so this isn\'t a palindrome.', [cells('Text', line(chars, { pointers: { [low]: 'low', [high]: 'high' }, tone: i => (i === low || i === high ? (same ? 'active' : 'danger') : i < low || i > high ? 'done' : undefined) }))], { tone: same ? 'active' : 'danger' });
        if (!same) {
          ok = false;
          break;
        }
        low++;
        high--;
      }
      trace.finish(ok ? 'A palindrome' : 'Not a palindrome', ok ? `“${text}” reads the same in both directions.` : `“${text}” reads differently from each end.`, [cells('Text', line(chars, { tone: () => (ok ? 'done' : undefined) }))], { tone: ok ? 'done' : 'danger' });
      answer = ok;
      summary = [{ label: 'Palindrome', value: ok ? 'Yes' : 'No', tone: ok ? 'done' : 'danger' }];
    } else if (op === 'reverse') {
      const items = [...chars];
      for (let low = 0, high = items.length - 1; low < high; low++, high--) {
        [items[low], items[high]] = [items[high], items[low]];
        trace.add(`Swap ${low} and ${high}`, 'Swap the two ends, then move inward.', [cells('Text', line(items, { pointers: { [low]: 'low', [high]: 'high' }, tone: i => (i === low || i === high ? 'new' : undefined) }))], { tone: 'new' });
      }
      const result = items.join('');
      trace.finish(`Result: ${result}`, 'In languages where strings can\'t change, you would build a new string this way, from a list of characters.', [cells('Text', line(items, { tone: () => 'done' }))]);
      answer = result;
      summary = [{ label: 'Reversed', value: result, tone: 'done' }];
    } else if (op === 'vowels') {
      let count = 0;
      chars.forEach((char, i) => {
        const vowel = 'aeiouAEIOU'.includes(char);
        if (vowel) count++;
        trace.add(`${char}: ${vowel ? 'a vowel' : 'not a vowel'}`, `Vowels so far: ${count}.`, [cells('Text', line(chars, { tone: at => (at === i ? (vowel ? 'new' : 'active') : at < i ? 'muted' : undefined) }))], { tone: vowel ? 'new' : 'muted', metrics: [{ label: 'Vowels', value: count }] });
      });
      trace.finish(`${count} vowels`, `Going through ${chars.length} characters once takes O(n).`, [cells('Text', line(chars, { tone: i => ('aeiouAEIOU'.includes(chars[i]) ? 'done' : undefined) }))], { metrics: [{ label: 'Vowels', value: count, tone: 'done' }] });
      answer = count;
    } else if (op === 'anagram' || op === 'compare') {
      const second = words(input.second, { label: 'the second text', maxLength: 16 });
      const other = [...second];
      if (op === 'anagram') {
        const counts: Record<string, number> = {};
        const scene = (): Panel[] => [cells('Texts', [row(chars, { label: 'First', hideIndex: true }), row(other, { label: 'Second', hideIndex: true })]), { kind: 'buckets', title: 'Letter counts', zone: 'side', buckets: Object.entries(counts).map(([letter, value]) => ({ label: letter, items: [{ value: String(value), tone: value === 0 ? 'done' : 'danger' }] })) }];
        if (chars.length !== other.length) {
          trace.finish('Not anagrams', 'The lengths differ, so they can\'t use the same letters.', scene(), { tone: 'danger' });
          return { frames: trace.frames, answer: false, summary: [{ label: 'Anagram', value: 'No', tone: 'danger' }] };
        }
        chars.forEach((char, i) => {
          counts[char] = (counts[char] ?? 0) + 1;
          counts[other[i]] = (counts[other[i]] ?? 0) - 1;
          trace.add(`+${char}, -${other[i]}`, 'Add 1 for each letter in the first text, and subtract 1 for each letter in the second.', scene(), { tone: 'active' });
        });
        const ok = Object.values(counts).every(value => value === 0);
        trace.finish(ok ? 'Anagrams' : 'Not anagrams', ok ? 'Every count returned to 0, so both use the same letters.' : 'Some counts aren\'t 0, so the letters differ.', scene(), { tone: ok ? 'done' : 'danger' });
        answer = ok;
        summary = [{ label: 'Anagram', value: ok ? 'Yes' : 'No', tone: ok ? 'done' : 'danger' }];
      } else {
        const limit = Math.min(chars.length, other.length);
        let result = chars.length === other.length ? 0 : chars.length < other.length ? -1 : 1;
        for (let i = 0; i < limit; i++) {
          const a = chars[i].charCodeAt(0);
          const b = other[i].charCodeAt(0);
          const same = a === b;
          trace.add(`${chars[i]} (${a}) and ${other[i]} (${b})`, same ? 'They match, so look at the next pair.' : `They differ, so the character codes decide: ${a < b ? 'the first' : 'the second'} text comes first.`, [cells('Texts', [line(chars, { label: 'First', tone: at => (at === i ? (same ? 'active' : 'danger') : at < i ? 'done' : undefined) }), line(other, { label: 'Second', tone: at => (at === i ? (same ? 'active' : 'danger') : at < i ? 'done' : undefined) })])], { tone: same ? 'active' : 'danger' });
          if (!same) {
            result = a < b ? -1 : 1;
            break;
          }
        }
        const word = result === 0 ? 'They are equal' : result < 0 ? `“${text}” comes first` : `“${second}” comes first`;
        trace.finish(word, 'Comparison goes character by character, and stops at the first difference. If one text runs out first, the shorter one comes first.', [cells('Texts', [line(chars, { label: 'First' }), line(other, { label: 'Second' })])]);
        answer = result;
        summary = [{ label: 'Result', value: word, tone: 'done' }];
      }
    } else {
      chars.forEach((char, i) => trace.add(`${char} = ${char.charCodeAt(0)}`, `The computer stores “${char}” as the number ${char.charCodeAt(0)}.`, [cells('Characters and their codes', line(chars, { tone: at => (at === i ? 'active' : undefined) }))], { tone: 'active' }));
      trace.finish('Finished', 'A string is really an array of numbers. An encoding says which number stands for which character.', [cells('Characters and their codes', line(chars))]);
      answer = chars.map(char => char.charCodeAt(0));
    }
    return { frames: trace.frames, summary, answer };
  },
};

export const simulators: Record<string, SimulatorDef> = {
  arrays,
  'bit-array': bitArray,
  'circular-queue': circularQueue,
  deque,
  'doubly-and-circular-linked-lists': doublyCircular,
  'dynamic-arrays': dynamicArrays,
  'linked-lists': linkedLists,
  queue,
  stack,
  strings,
};
