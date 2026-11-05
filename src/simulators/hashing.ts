import { counted, bars, bucketsPanel, cells, choiceField, integer, logPanel, numberField, numbers, operations, opsField, row, tablePanel, textField, Trace, when, words, type Panel, type SimulatorDef, type Tone } from './kit.ts';

const mod = (value: number, size: number) => ((value % size) + size) % size;
const round = (value: number, digits = 2) => Math.round(value * 10 ** digits) / 10 ** digits;

/** Turns a key into a number. Words add up their character codes, so "cat" and "act" collide on purpose. */
const keyNumber = (key: string) => (/^-?\d+$/.test(key) ? Number(key) : [...key].reduce((total, char) => total + char.charCodeAt(0), 0));

// ---------- Chaining ----------

const chaining: SimulatorDef = {
  fields: [
    numberField('size', 'Buckets', 7, 1, 13),
    opsField('ops', 'Operations', 'insert 10, insert 17, insert 3, insert 24, search 17, delete 3, search 3', [{ label: 'Insert', op: 'insert', takesValue: true }, { label: 'Search', op: 'search', takesValue: true }, { label: 'Delete', op: 'delete', takesValue: true }]),
  ],
  examples: [
    { title: 'Collisions', about: '10, 17, and 24 all land in bucket 3.', values: { size: '7', ops: 'insert 10, insert 17, insert 24, search 24' } },
    { title: 'Everything in one bucket', about: 'The worst case: the table turns into one long list.', values: { size: '5', ops: 'insert 5, insert 10, insert 15, insert 20, search 20' } },
    { title: 'Text keys', about: 'cat and act have the same letters, so they collide.', values: { size: '7', ops: 'insert cat, insert act, insert dog, search act' } },
  ],
  run(input) {
    const size = integer(input.size, 'Buckets', 1, 13);
    const list = operations(input.ops, { insert: 1, search: 1, delete: 1 });
    const table: string[][] = Array.from({ length: size }, () => []);
    const log: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    let compares = 0;
    const scene = (bucket?: number, item?: number, tone: Tone = 'active'): Panel[] => [
      bucketsPanel('Buckets', table.map((items, b) => ({ label: String(b), tone: b === bucket ? 'active' as Tone : undefined, items: items.map((value, i) => ({ value, tone: b === bucket && i === item ? tone : undefined })) })), { chained: true }),
      logPanel('Results', log),
    ];
    const metrics = () => {
      const count = table.reduce((total, items) => total + items.length, 0);
      return [{ label: 'Keys', value: count }, { label: 'Load factor', value: round(count / size) }, { label: 'Longest chain', value: Math.max(...table.map(items => items.length)) }, { label: 'Comparisons', value: compares }];
    };
    trace.add('Start', 'Each bucket holds a list. Keys that land in the same bucket share its list.', scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value } of list) {
      const key = value!;
      const bucket = mod(keyNumber(key), size);
      trace.group = `${op} ${key}`;
      trace.add(`Hash ${key}`, `${keyNumber(key)} mod ${size} = ${bucket}, so this key belongs in bucket ${bucket}.`, scene(bucket), { tone: 'active', metrics: metrics() });
      let at = -1;
      for (let i = 0; i < table[bucket].length; i++) {
        compares++;
        const same = table[bucket][i] === key;
        trace.add(`Compare with ${table[bucket][i]}`, same ? 'This is the key.' : 'This isn\'t the key, so follow the chain.', scene(bucket, i, same ? 'done' : 'active'), { tone: same ? 'done' : 'active', metrics: metrics() });
        if (same) {
          at = i;
          break;
        }
      }
      if (op === 'insert') {
        if (at >= 0) log.push({ text: `${key} is already in the table` });
        else {
          table[bucket].push(key);
          trace.add(`Add ${key}`, table[bucket].length > 1 ? `A collision: bucket ${bucket} already had a key, so the chain grows to ${table[bucket].length}.` : `Bucket ${bucket} was empty.`, scene(bucket, table[bucket].length - 1, 'new'), { tone: 'new', metrics: metrics() });
        }
      } else if (op === 'search') {
        log.push({ text: at >= 0 ? `search ${key}: found in bucket ${bucket}` : `search ${key}: not found`, tone: at >= 0 ? 'done' : 'danger' });
        if (at < 0) trace.add(`${key} isn't here`, `The whole chain in bucket ${bucket} has been checked.`, scene(bucket), { tone: 'danger', metrics: metrics() });
      } else if (at < 0) {
        log.push({ text: `delete ${key}: not found`, tone: 'danger' });
        trace.add(`${key} isn't here`, 'There is nothing to delete.', scene(bucket), { tone: 'danger', metrics: metrics() });
      } else {
        table[bucket].splice(at, 1);
        log.push({ text: `deleted ${key}` });
        trace.add(`Delete ${key}`, 'Removing it from a list leaves no gap behind, so later searches keep working.', scene(bucket), { tone: 'accent', metrics: metrics() });
      }
    }
    trace.group = undefined;
    trace.finish('Finished', 'On average a chain has load-factor many keys, so operations take O(1 + load factor) if the hash spreads keys well.', scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { table, log: log.map(line => line.text) } };
  },
};

// ---------- Hash Functions ----------

const hashWith: Record<string, (key: number, size: number) => { value: number; steps: string[] }> = {
  division: (key, size) => ({ value: mod(key, size), steps: [`${key} mod ${size} = ${mod(key, size)}`] }),
  multiplication: (key, size) => {
    const A = 0.618034;
    const product = key * A;
    const fraction = product - Math.floor(product);
    const value = Math.floor(size * fraction);
    return { value, steps: [`${key} × 0.618034 = ${round(product, 4)}`, `Keep the fraction: ${round(fraction, 4)}`, `${size} × ${round(fraction, 4)}, rounded down, is ${value}`] };
  },
  folding: (key, size) => {
    const digits = String(Math.abs(key));
    const parts = digits.match(/.{1,2}/g) ?? [];
    const total = parts.reduce((sum, part) => sum + Number(part), 0);
    return { value: mod(total, size), steps: [`Split into pairs: ${parts.join(', ')}`, `Add them: ${total}`, `${total} mod ${size} = ${mod(total, size)}`] };
  },
  midsquare: (key, size) => {
    const square = key * key;
    const digits = String(square).padStart(4, '0');
    const start = Math.floor((digits.length - 2) / 2);
    const middle = Number(digits.slice(start, start + 2));
    return { value: mod(middle, size), steps: [`${key}² = ${square}`, `Take the middle two digits: ${digits.slice(start, start + 2)}`, `${middle} mod ${size} = ${mod(middle, size)}`] };
  },
};

const hashFunctions: SimulatorDef = {
  fields: [
    choiceField('method', 'Method', [['division', 'Division'], ['multiplication', 'Multiplication'], ['folding', 'Folding'], ['midsquare', 'Mid-square']]),
    textField('keys', 'Keys', '12, 25, 37, 48, 56, 63, 71, 84', { wide: true }),
    numberField('size', 'Table size', 10, 2, 16),
  ],
  examples: [
    { title: 'A bad table size', about: 'Multiples of 10 all land in slot 0 of a table of size 10.', values: { method: 'division', keys: '10, 20, 30, 40, 50, 60', size: '10' } },
    { title: 'A prime size helps', about: 'The same keys spread out when the size is 7.', values: { method: 'division', keys: '10, 20, 30, 40, 50, 60', size: '7' } },
    { title: 'Multiplication', about: 'Handles the same keys well, even with size 10.', values: { method: 'multiplication', keys: '10, 20, 30, 40, 50, 60', size: '10' } },
    { title: 'Folding', about: 'Long keys are split into pieces and added.', values: { method: 'folding', keys: '123456, 987654, 111222, 345678', size: '10' } },
  ],
  run(input) {
    const keys = numbers(input.keys, { label: 'keys', min: 0, max: 99999999, maxCount: 16 });
    const size = integer(input.size, 'Table size', 2, 16);
    const hash = hashWith[input.method];
    const counts = new Array<number>(size).fill(0);
    const trace = new Trace();
    const labels = Array.from({ length: size }, (_, i) => String(i));
    const rows: (string | number)[][] = [];
    const scene = (slot?: number, steps: string[] = []): Panel[] => [
      bars('How many keys land in each slot', counts, i => (i === slot ? 'new' : counts[i] > 1 ? 'danger' : 'value'), labels),
      tablePanel('Keys so far', rows, { colHead: ['Key', 'Slot'], zone: 'side' }),
      ...(steps.length ? [logPanel('How it was worked out', steps)] : []),
    ];
    let collisions = 0;
    for (const key of keys) {
      const { value, steps } = hash(key, size);
      if (counts[value]) collisions++;
      counts[value]++;
      rows.push([key, value]);
      trace.add(`${key} → slot ${value}`, `${steps.join('. ')}.${counts[value] > 1 ? ` Slot ${value} already had a key, so this is a collision.` : ''}`, scene(value, steps), { tone: counts[value] > 1 ? 'danger' : 'new', metrics: [{ label: 'Collisions', value: collisions }] });
    }
    const used = counts.filter(Boolean).length;
    const summary = [{ label: 'Slots used', value: `${used} of ${size}` }, { label: 'Collisions', value: collisions, tone: (collisions ? 'danger' : 'done') as Tone }, { label: 'Busiest slot', value: Math.max(...counts) }];
    trace.finish('Finished', `${counted(keys.length, 'key')} went into ${used} of ${size} slots, with ${counted(collisions, 'collision')}. A good hash function spreads keys evenly, and always gives the same slot for the same key.`, scene());
    return { frames: trace.frames, summary, answer: { slots: rows.map(entry => entry[1]), collisions } };
  },
};

// ---------- Hash Tables ----------

const hashTables: SimulatorDef = {
  fields: [
    choiceField('strategy', 'On a collision', [['chain', 'Chain in a list'], ['linear', 'Probe the next slot']]),
    numberField('size', 'Slots', 7, 2, 13),
    opsField('ops', 'Operations', 'put apple 3, put pear 5, put plum 2, get pear, put pear 9, remove apple, get apple', [{ label: 'Put', op: 'put', takesValue: true }, { label: 'Get', op: 'get', takesValue: true }, { label: 'Remove', op: 'remove', takesValue: true }]),
  ],
  examples: [
    { title: 'Key and value', about: 'Putting the same key again overwrites its value.', values: { strategy: 'chain', size: '7', ops: 'put apple 3, put apple 8, get apple' } },
    { title: 'Probing', about: 'A busy slot pushes the key to the next free one.', values: { strategy: 'linear', size: '5', ops: 'put cat 1, put act 2, put tac 3, get tac' } },
    { title: 'A missing key', about: 'Getting a key that isn\'t there returns nothing.', values: { strategy: 'chain', size: '7', ops: 'put a 1, get b' } },
  ],
  run(input) {
    const size = integer(input.size, 'Slots', 2, 13);
    const list = operations(input.ops, { put: 2, get: 1, remove: 1 });
    const chain = input.strategy === 'chain';
    type Entry = { key: string; value: string };
    const buckets: Entry[][] = Array.from({ length: size }, () => []);
    const slots: (Entry | 'gone' | null)[] = new Array(size).fill(null);
    const log: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    const scene = (at?: number, tone: Tone = 'active'): Panel[] => [
      chain
        ? bucketsPanel('Buckets', buckets.map((items, b) => ({ label: String(b), tone: b === at ? tone : undefined, items: items.map(entry => `${entry.key}: ${entry.value}`) })), { chained: true })
        : cells('Slots', row(slots.map(entry => (entry === 'gone' ? '×' : entry ? `${entry.key}: ${entry.value}` : '')), { tone: i => (i === at ? tone : slots[i] === 'gone' ? 'muted' : undefined) })),
      logPanel('Results', log),
    ];
    const metrics = () => {
      const count = chain ? buckets.reduce((total, items) => total + items.length, 0) : slots.filter(entry => entry && entry !== 'gone').length;
      return [{ label: 'Keys', value: count }, { label: 'Load factor', value: round(count / size) }];
    };
    trace.add('Start', 'A key is hashed to choose a slot, and its value is stored there too.', scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value: key, second } of list) {
      trace.group = `${op} ${key}${second ? ` ${second}` : ''}`;
      const home = mod(keyNumber(key!), size);
      trace.add(`Hash “${key}”`, `The hash of “${key}” is ${keyNumber(key!)}, and ${keyNumber(key!)} mod ${size} = ${home}.`, scene(home), { tone: 'active', metrics: metrics() });
      if (chain) {
        const items = buckets[home];
        const at = items.findIndex(entry => entry.key === key);
        if (op === 'put') {
          if (at >= 0) items[at].value = second!;
          else items.push({ key: key!, value: second! });
          trace.add(at >= 0 ? `Update “${key}”` : `Add “${key}”`, at >= 0 ? 'The key was already there, so only its value changes.' : items.length > 1 ? 'The bucket has other keys, so this one joins the chain.' : 'The bucket was empty.', scene(home, 'new'), { tone: 'new', metrics: metrics() });
        } else if (op === 'get') {
          log.push({ text: at >= 0 ? `get ${key} = ${items[at].value}` : `get ${key}: missing`, tone: at >= 0 ? 'done' : 'danger' });
          trace.add(at >= 0 ? `“${key}” = ${items[at].value}` : `“${key}” is missing`, at >= 0 ? 'The chain was searched by key, because different keys can share a bucket.' : 'The chain doesn\'t have this key.', scene(home, at >= 0 ? 'done' : 'danger'), { tone: at >= 0 ? 'done' : 'danger', metrics: metrics() });
        } else {
          if (at >= 0) items.splice(at, 1);
          log.push({ text: at >= 0 ? `removed ${key}` : `remove ${key}: missing`, tone: at >= 0 ? undefined : 'danger' });
          trace.add(at >= 0 ? `Remove “${key}”` : `“${key}” is missing`, at >= 0 ? 'The entry leaves the chain.' : 'There is nothing to remove.', scene(home, at >= 0 ? 'accent' : 'danger'), { tone: at >= 0 ? 'accent' : 'danger', metrics: metrics() });
        }
      } else {
        let free = -1;
        let at = -1;
        for (let step = 0; step < size; step++) {
          const slot = (home + step) % size;
          const entry = slots[slot];
          if (entry === null) {
            if (free < 0) free = slot;
            break;
          }
          if (entry === 'gone') {
            if (free < 0) free = slot;
          } else if (entry.key === key) {
            at = slot;
            break;
          }
          trace.add(`Slot ${slot} doesn't match`, entry === 'gone' ? 'This slot held a removed key, so keep looking past it.' : `It holds “${entry.key}”, so look at the next slot.`, scene(slot, 'active'), { tone: 'active', metrics: metrics() });
        }
        if (op === 'put') {
          if (at >= 0) {
            (slots[at] as Entry).value = second!;
            trace.add(`Update “${key}”`, 'The key was already there, so only its value changes.', scene(at, 'new'), { tone: 'new', metrics: metrics() });
          } else if (free < 0) {
            log.push({ text: `put ${key}: table is full`, tone: 'danger' });
            trace.add('The table is full', 'Every slot is taken, so a real table would have to grow here.', scene(), { tone: 'danger', metrics: metrics() });
          } else {
            slots[free] = { key: key!, value: second! };
            trace.add(`Add “${key}” at slot ${free}`, free === home ? 'Its home slot was free.' : `Its home slot was ${home}, and ${free} was the first free slot after it.`, scene(free, 'new'), { tone: 'new', metrics: metrics() });
          }
        } else if (op === 'get') {
          log.push({ text: at >= 0 ? `get ${key} = ${(slots[at] as Entry).value}` : `get ${key}: missing`, tone: at >= 0 ? 'done' : 'danger' });
          trace.add(at >= 0 ? `“${key}” = ${(slots[at] as Entry).value}` : `“${key}” is missing`, at >= 0 ? `Found at slot ${at}.` : 'Reaching a slot that was never used proves the key isn\'t here.', scene(at >= 0 ? at : undefined, 'done'), { tone: at >= 0 ? 'done' : 'danger', metrics: metrics() });
        } else {
          if (at >= 0) slots[at] = 'gone';
          log.push({ text: at >= 0 ? `removed ${key}` : `remove ${key}: missing`, tone: at >= 0 ? undefined : 'danger' });
          trace.add(at >= 0 ? `Remove “${key}”` : `“${key}” is missing`, at >= 0 ? 'A marker stays in the slot, so later searches know to keep going.' : 'There is nothing to remove.', scene(at >= 0 ? at : undefined, 'accent'), { tone: at >= 0 ? 'accent' : 'danger', metrics: metrics() });
        }
      }
    }
    trace.group = undefined;
    trace.finish('Finished', 'With a good hash and a low load factor, put, get, and remove all take O(1) on average.', scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: log.map(line => line.text) };
  },
};

// ---------- Probing ----------

const probeSequence = (method: string, key: number, size: number, i: number) => {
  const home = mod(key, size);
  if (method === 'linear') return (home + i) % size;
  if (method === 'quadratic') return (home + i * i) % size;
  const second = 5 - mod(key, 5);
  return (home + i * second) % size;
};

const probing: SimulatorDef = {
  fields: [
    choiceField('method', 'Method', [['linear', 'Linear: h + i'], ['quadratic', 'Quadratic: h + i²'], ['double', 'Double: h + i × h₂']]),
    numberField('size', 'Table size', 7, 2, 17),
    textField('keys', 'Keys to insert', '10, 17, 3, 24, 5'),
  ],
  examples: [
    { title: 'Linear clustering', about: 'Colliding keys pile up in one long run.', values: { method: 'linear', size: '7', keys: '10, 17, 3, 24, 5' } },
    { title: 'Quadratic jumps', about: 'Bigger jumps break up the run.', values: { method: 'quadratic', size: '7', keys: '10, 17, 3, 24, 5' } },
    { title: 'Double hashing', about: 'Each key gets its own step size, from h₂ = 5 - key mod 5.', values: { method: 'double', size: '7', keys: '10, 17, 3, 24, 5' } },
    { title: 'Quadratic can miss', about: 'Free slots exist, but the jumps never reach them.', values: { method: 'quadratic', size: '8', keys: '0, 8, 16, 24, 32, 40' } },
  ],
  run(input) {
    const size = integer(input.size, 'Table size', 2, 17);
    const keys = numbers(input.keys, { label: 'keys', min: 0, max: 9999, maxCount: 14 });
    const method = input.method;
    const slots: (number | null)[] = new Array(size).fill(null);
    const trace = new Trace();
    const placements: (string | number)[][] = [];
    let totalProbes = 0;
    const scene = (at?: number, tone: Tone = 'active', path: number[] = []): Panel[] => [
      cells('Slots', row(slots.map(value => value ?? ''), { tone: i => (i === at ? tone : path.includes(i) ? 'muted' : undefined) })),
      tablePanel('Keys placed', placements, { colHead: ['Key', 'Slot', 'Probes'], zone: 'side' }),
    ];
    const formula = (key: number, i: number) => {
      const home = mod(key, size);
      if (method === 'linear') return `(${home} + ${i}) mod ${size}`;
      if (method === 'quadratic') return `(${home} + ${i}²) mod ${size}`;
      return `(${home} + ${i} × ${5 - mod(key, 5)}) mod ${size}`;
    };
    const metrics = () => [{ label: 'Total probes', value: totalProbes }, { label: 'Load factor', value: round(slots.filter(value => value !== null).length / size) }];
    for (const key of keys) {
      trace.group = `Insert ${key}`;
      const path: number[] = [];
      let placed = -1;
      // All three sequences repeat after `size` probes, so going further can't reach a new slot.
      for (let i = 0; i < size && placed < 0; i++) {
        const slot = probeSequence(method, key, size, i);
        totalProbes++;
        const free = slots[slot] === null;
        trace.add(`Try slot ${slot}`, `Probe ${i}: ${formula(key, i)} = ${slot}. ${free ? 'It is free.' : `It holds ${slots[slot]}, so this is a collision.`}`, scene(slot, free ? 'new' : 'danger', path), { tone: free ? 'new' : 'danger', metrics: metrics() });
        path.push(slot);
        if (free) placed = slot;
      }
      if (placed < 0) {
        placements.push([key, 'None', path.length]);
        trace.add(`Can't place ${key}`, 'This probe sequence only visits some of the slots, and all of those are taken. Free slots may still exist elsewhere.', scene(undefined, 'danger', path), { tone: 'danger', metrics: metrics() });
      } else {
        slots[placed] = key;
        placements.push([key, placed, path.length]);
        trace.add(`${key} goes in slot ${placed}`, path.length === 1 ? 'It went straight into its home slot.' : `It took ${counted(path.length, 'probe')} to find room.`, scene(placed, 'done', path), { tone: 'done', metrics: metrics() });
      }
    }
    trace.group = undefined;
    trace.finish('Finished', `Placing ${counted(keys.length, 'key')} took ${counted(totalProbes, 'probe')} in total. Fewer probes mean a better spread.`, scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { slots, totalProbes } };
  },
};

// ---------- Open Addressing ----------

const openAddressing: SimulatorDef = {
  fields: [
    numberField('size', 'Slots', 7, 2, 13),
    opsField('ops', 'Operations', 'insert 10, insert 17, insert 24, delete 17, search 24, insert 31', [{ label: 'Insert', op: 'insert', takesValue: true }, { label: 'Search', op: 'search', takesValue: true }, { label: 'Delete', op: 'delete', takesValue: true }]),
  ],
  examples: [
    { title: 'Why a marker is needed', about: 'Deleting 17 must not stop the search for 24.', values: { size: '7', ops: 'insert 10, insert 17, insert 24, delete 17, search 24' } },
    { title: 'Reusing a marker', about: 'A new key can go in a marked slot.', values: { size: '7', ops: 'insert 10, insert 17, delete 10, insert 24' } },
    { title: 'A full table', about: 'Open addressing can run out of room.', values: { size: '3', ops: 'insert 1, insert 2, insert 3, insert 4' } },
  ],
  run(input) {
    const size = integer(input.size, 'Slots', 2, 13);
    const list = operations(input.ops, { insert: 1, search: 1, delete: 1 });
    const slots: (string | null)[] = new Array(size).fill(null);
    const GONE = '×';
    const log: { text: string; tone?: Tone }[] = [];
    const trace = new Trace();
    let probes = 0;
    const scene = (at?: number, tone: Tone = 'active'): Panel[] => [
      cells('Slots (× marks a deleted key)', row(slots.map(value => value ?? ''), { tone: i => (i === at ? tone : slots[i] === GONE ? 'muted' : undefined) })),
      logPanel('Results', log),
    ];
    const metrics = () => [{ label: 'Keys', value: slots.filter(value => value && value !== GONE).length }, { label: 'Markers', value: slots.filter(value => value === GONE).length }, { label: 'Probes', value: probes }];
    trace.add('Start', 'All keys live inside the table itself. When a slot is busy, the key tries the next one.', scene(), { tone: 'muted', metrics: metrics() });
    for (const { op, value } of list) {
      const key = value!;
      const number = keyNumber(key);
      const home = mod(number, size);
      trace.group = `${op} ${key}`;
      let found = -1;
      let free = -1;
      for (let i = 0; i < size; i++) {
        const slot = (home + i) % size;
        probes++;
        const entry = slots[slot];
        if (entry === null) {
          if (free < 0) free = slot;
          trace.add(`Slot ${slot} is empty`, op === 'insert' ? 'An empty slot means the key isn\'t further along, so the search can stop.' : 'An empty slot means the key was never placed beyond here, so the search stops.', scene(slot, 'active'), { tone: 'active', metrics: metrics() });
          break;
        }
        if (entry === GONE) {
          if (free < 0) free = slot;
          trace.add(`Slot ${slot} has a marker`, 'A deleted key used to be here, so keep going. Later keys may have been pushed past it.', scene(slot, 'active'), { tone: 'muted', metrics: metrics() });
        } else if (entry === key) {
          found = slot;
          trace.add(`Slot ${slot} holds ${key}`, 'The key is here.', scene(slot, 'done'), { tone: 'done', metrics: metrics() });
          break;
        } else {
          trace.add(`Slot ${slot} holds ${entry}`, `It isn't ${key}, so try slot ${(slot + 1) % size}.`, scene(slot, 'active'), { tone: 'active', metrics: metrics() });
        }
      }
      if (op === 'insert') {
        if (found >= 0) log.push({ text: `${key} is already here` });
        else if (free < 0) {
          log.push({ text: `insert ${key}: table is full`, tone: 'danger' });
          trace.add('The table is full', 'Every slot was tried, and the key has nowhere to go. A real table would grow before this point.', scene(), { tone: 'danger', metrics: metrics() });
        } else {
          const reused = slots[free] === GONE;
          slots[free] = key;
          trace.add(`Put ${key} in slot ${free}`, reused ? 'The first marker found on the way gets reused.' : 'This is the first free slot.', scene(free, 'new'), { tone: 'new', metrics: metrics() });
        }
      } else if (op === 'search') {
        log.push({ text: found >= 0 ? `search ${key}: slot ${found}` : `search ${key}: not found`, tone: found >= 0 ? 'done' : 'danger' });
      } else if (found < 0) {
        log.push({ text: `delete ${key}: not found`, tone: 'danger' });
      } else {
        slots[found] = GONE;
        log.push({ text: `deleted ${key}` });
        trace.add(`Mark slot ${found}`, 'The slot gets a marker rather than becoming empty. An empty slot would stop later searches too soon.', scene(found, 'danger'), { tone: 'accent', metrics: metrics() });
      }
    }
    trace.group = undefined;
    trace.finish('Finished', 'Open addressing keeps everything in one array, which is friendly to the cache, but it needs markers for deleted keys and a low load factor.', scene(), { metrics: metrics() });
    return { frames: trace.frames, answer: { slots, log: log.map(line => line.text) } };
  },
};

// ---------- Rehashing ----------

const rehashing: SimulatorDef = {
  fields: [
    textField('keys', 'Keys to insert', '3, 11, 20, 25, 37, 42, 50, 68, 74', { wide: true }),
    numberField('size', 'Start size', 4, 1, 16),
    choiceField('threshold', 'Grow when load passes', [['0.75', '0.75'], ['0.5', '0.5'], ['1', '1']]),
    choiceField('growth', 'Grow by', [['2', 'Doubling'], ['3', 'Tripling']]),
  ],
  examples: [
    { title: 'Doubling at 0.75', about: 'Watch the keys scatter into new buckets.', values: { keys: '3, 11, 20, 25, 37, 42, 50, 68, 74', size: '4', threshold: '0.75', growth: '2' } },
    { title: 'A strict threshold', about: 'Growing earlier leaves shorter chains, and uses more memory.', values: { keys: '3, 11, 20, 25, 37, 42, 50, 68, 74', size: '2', threshold: '0.5', growth: '2' } },
  ],
  run(input) {
    const keys = numbers(input.keys, { label: 'keys', min: 0, max: 9999, maxCount: 16 });
    let size = integer(input.size, 'Start size', 1, 16);
    const threshold = Number(input.threshold);
    const factor = Number(input.growth);
    let table: number[][] = Array.from({ length: size }, () => []);
    const trace = new Trace();
    let count = 0;
    let moved = 0;
    let rehashes = 0;
    const view = (title: string, source: number[][], mark?: number): Panel => bucketsPanel(title, source.map((items, b) => ({ label: String(b), items: items.map(value => ({ value: String(value), tone: value === mark ? 'new' as Tone : undefined })) })), { chained: true });
    const metrics = () => [{ label: 'Keys', value: count }, { label: 'Slots', value: size }, { label: 'Load factor', value: round(count / size) }, { label: 'Rehashes', value: rehashes }, { label: 'Keys moved', value: moved }];
    for (const key of keys) {
      trace.group = `Insert ${key}`;
      table[mod(key, size)].push(key);
      count++;
      trace.add(`Insert ${key}`, `${key} mod ${size} = ${mod(key, size)}. The load factor is now ${count} ÷ ${size} = ${round(count / size)}.`, [view('Table', table, key)], { tone: 'new', metrics: metrics() });
      if (count / size > threshold) {
        const old = table;
        const oldSize = size;
        size *= factor;
        table = Array.from({ length: size }, () => []);
        rehashes++;
        trace.add(`Grow to ${size} slots`, `${round(count / oldSize)} passed the limit of ${threshold}. Every key must be hashed again, since its slot depends on the table size.`, [view('Old table', old), view('New table', table)], { tone: 'danger', metrics: metrics() });
        for (const items of old) {
          for (const value of items) {
            table[mod(value, size)].push(value);
            moved++;
            trace.add(`Move ${value}`, `${value} mod ${size} = ${mod(value, size)}. It was in slot ${mod(value, oldSize)}, in the old table.`, [view('Old table', old), view('New table', table, value)], { tone: 'accent', metrics: metrics() });
          }
        }
      }
    }
    trace.group = undefined;
    trace.finish('Finished', `Inserting ${counted(count, 'key')} caused ${counted(rehashes, 'rehash', 'rehashes')}, which moved ${counted(moved, 'key')}. Each rehash is expensive, but rare enough that inserting still averages O(1).`, [view('Table', table)], { metrics: metrics() });
    return { frames: trace.frames, answer: { size, rehashes, moved, table } };
  },
};

// ---------- Sets and Maps ----------

const setsAndMaps: SimulatorDef = {
  fields: [
    choiceField('op', 'Operation', [['union', 'Set: union'], ['intersection', 'Set: intersection'], ['difference', 'Set: difference'], ['symmetric', 'Set: symmetric difference'], ['count', 'Map: count words'], ['dedupe', 'Set: remove duplicates']]),
    textField('a', 'First list', '1, 2, 3, 4, 2'),
    when(textField('b', 'Second list', '3, 4, 5, 6'), values => !['count', 'dedupe'].includes(values.op)),
  ],
  examples: [
    { title: 'Common values', about: 'Intersection keeps what both lists have.', values: { op: 'intersection', a: '1, 2, 3, 4', b: '3, 4, 5, 6' } },
    { title: 'Count words', about: 'A map stores a count for each word.', values: { op: 'count', a: 'to be or not to be' } },
    { title: 'Remove duplicates', about: 'A set quietly ignores values it already has.', values: { op: 'dedupe', a: '4, 1, 4, 2, 1, 4' } },
  ],
  run(input) {
    const op = input.op;
    const split = (text: string, label: string) => {
      const parts = text.split(/[\s,]+/).filter(Boolean);
      if (!parts.length) throw new Error(`Enter at least one value for the ${label}.`);
      if (parts.length > 16) throw new Error(`Use at most 16 values for the ${label}, so every step stays readable.`);
      return parts;
    };
    const first = split(input.a, 'first list');
    const trace = new Trace();
    if (op === 'count') {
      const counts = new Map<string, number>();
      const scene = (word?: string): Panel[] => [cells('Input', row(first, { hideIndex: true })), tablePanel('The map', [...counts.entries()].map(([word2, count]) => [word2, count]), { colHead: ['Key', 'Count'], tone: r => ([...counts.keys()][r] === word ? 'new' : undefined) })];
      for (const word of first) {
        counts.set(word, (counts.get(word) ?? 0) + 1);
        trace.add(`${word}: ${counts.get(word)}`, counts.get(word) === 1 ? `“${word}” is a new key, so its count starts at 1.` : `“${word}” is already a key, so its count goes up.`, scene(word), { tone: 'new' });
      }
      trace.finish('Finished', `${first.length} values, and ${counts.size} different keys. Each lookup took one step on average.`, scene());
      return { frames: trace.frames, answer: Object.fromEntries(counts), summary: [{ label: 'Distinct keys', value: counts.size, tone: 'done' }] };
    }
    if (op === 'dedupe') {
      const seen: string[] = [];
      const scene = (at?: number): Panel[] => [cells('Input', row(first, { hideIndex: true, tone: i => (i === at ? 'active' : undefined) })), cells('The set', row(seen, { hideIndex: true, tone: i => (i === seen.length - 1 ? 'new' : undefined) }))];
      first.forEach((value, i) => {
        const had = seen.includes(value);
        if (!had) seen.push(value);
        trace.add(`${value}: ${had ? 'seen before' : 'new'}`, had ? 'The set already has this, so nothing changes.' : 'The set doesn\'t have this, so it joins.', scene(i), { tone: had ? 'muted' : 'new' });
      });
      trace.finish('Finished', `${first.length} values became ${seen.length} distinct values.`, scene());
      return { frames: trace.frames, answer: seen, summary: [{ label: 'Distinct', value: seen.length, tone: 'done' }] };
    }
    const second = split(input.b, 'second list');
    const a = [...new Set(first)];
    const b = [...new Set(second)];
    const result: string[] = [];
    const scene = (active?: string): Panel[] => [
      cells('Sets', [row(a, { label: 'A', hideIndex: true, tone: i => (a[i] === active ? 'active' : undefined) }), row(b, { label: 'B', hideIndex: true, tone: i => (b[i] === active ? 'active' : undefined) })]),
      cells('Result', row(result, { hideIndex: true, tone: () => 'done' })),
    ];
    const check = (value: string, keep: boolean, why: string) => {
      if (keep && !result.includes(value)) result.push(value);
      trace.add(`${value}: ${keep ? 'keep' : 'skip'}`, why, scene(value), { tone: keep ? 'new' : 'muted' });
    };
    if (op === 'union') {
      for (const value of a) check(value, true, 'Everything in A goes in.');
      for (const value of b) check(value, true, result.includes(value) ? 'It is already in the result.' : 'It is in B and not yet in the result.');
    } else if (op === 'intersection') {
      for (const value of a) check(value, b.includes(value), b.includes(value) ? 'It is in both sets.' : 'It is only in A.');
    } else if (op === 'difference') {
      for (const value of a) check(value, !b.includes(value), b.includes(value) ? 'It is also in B, so it is left out.' : 'It is in A and not in B.');
    } else {
      for (const value of a) check(value, !b.includes(value), b.includes(value) ? 'It is in both, so it is left out.' : 'It is only in A.');
      for (const value of b) check(value, !a.includes(value), a.includes(value) ? 'It is in both, so it is left out.' : 'It is only in B.');
    }
    trace.finish('Finished', `The result has ${result.length} value${result.length === 1 ? '' : 's'}. Each membership check took one step on average, so the whole operation took O(|A| + |B|).`, scene());
    return { frames: trace.frames, answer: result, summary: [{ label: 'Size', value: result.length, tone: 'done' }] };
  },
};

// ---------- String Hashing ----------

const stringHashing: SimulatorDef = {
  fields: [
    textField('text', 'Text', 'abracadabra'),
    numberField('base', 'Base', 31, 2, 300),
    numberField('modulus', 'Modulus', 1000003, 2, 1000003),
    numberField('from', 'Substring from', 0, 0, 30),
    numberField('to', 'to (not including)', 4, 1, 31),
  ],
  examples: [
    { title: 'Equal substrings', about: 'abra appears twice, and both give the same hash.', values: { text: 'abracadabra', from: '7', to: '11' } },
    { title: 'A small modulus', about: 'With modulus 7, different strings often collide.', values: { text: 'abcdefg', modulus: '7', from: '0', to: '3' } },
  ],
  run(input) {
    const text = words(input.text, { label: 'some text', maxLength: 24 });
    const base = integer(input.base, 'Base', 2, 300);
    const modulus = integer(input.modulus, 'Modulus', 2, 1000003);
    const from = integer(input.from, 'Substring start', 0, text.length - 1);
    const to = integer(input.to, 'Substring end', from + 1, text.length);
    const chars = [...text];
    const prefix = [0];
    const powers = [1];
    const trace = new Trace();
    const code = (char: string) => char.charCodeAt(0);
    const scene = (at?: number): Panel[] => [
      cells('Text', row(chars, { tone: i => (i === at ? 'active' : i >= from && i < to ? 'value' : undefined), sub: i => String(code(chars[i])) })),
      tablePanel('Prefix hashes', prefix.map((value, i) => [i, value, powers[i]]), { colHead: ['i', 'hash[i]', 'power[i]'], zone: 'side', tone: r => (at !== undefined && r === at + 1 ? 'new' : undefined) }),
    ];
    chars.forEach((char, i) => {
      prefix.push((prefix[i] * base + code(char)) % modulus);
      powers.push((powers[i] * base) % modulus);
      trace.add(`Prefix ${i + 1}: ${prefix[i + 1]}`, `(${prefix[i]} × ${base} + ${code(char)}) mod ${modulus} = ${prefix[i + 1]}. The new character is “${char}”.`, scene(i), { tone: 'new' });
    });
    const direct = chars.slice(from, to).reduce((total, char) => (total * base + code(char)) % modulus, 0);
    const value = mod(prefix[to] - (prefix[from] * powers[to - from]) % modulus, modulus);
    const piece = text.slice(from, to);
    trace.add(`hash(“${piece}”) = ${value}`, `Any substring's hash comes from two prefixes in one step: (hash[${to}] - hash[${from}] × power[${to - from}]) mod ${modulus} = ${value}.`, scene(), { tone: 'active' });
    const groups = new Map<number, string[]>();
    for (let i = 0; i + (to - from) <= chars.length; i++) {
      const hash = mod(prefix[i + to - from] - (prefix[i] * powers[to - from]) % modulus, modulus);
      const part = text.slice(i, i + to - from);
      groups.set(hash, [...(groups.get(hash) ?? []), part]);
    }
    const same = groups.get(value) ?? [];
    const realCollision = [...groups.values()].some(items => new Set(items).size > 1);
    trace.finish(`Hash: ${value}`, `Computing it the slow way gives ${direct} too. ${same.length > 1 ? `“${piece}” appears ${same.filter(item => item === piece).length} time(s) among the substrings of this length, and they share the same hash.` : 'No other substring of this length has that hash.'}${realCollision ? ' Different substrings do share a hash here, so a real program must compare the characters on a match.' : ''}`, scene(), { metrics: [{ label: 'Hash', value, tone: 'done' }, { label: 'Slow check', value: direct, tone: direct === value ? 'done' : 'danger' }] });
    return { frames: trace.frames, answer: { value, direct, prefix } };
  },
};

export const simulators: Record<string, SimulatorDef> = {
  chaining,
  'hash-functions': hashFunctions,
  'hash-tables': hashTables,
  'linear-quadratic-probing-and-double-hashing': probing,
  'open-addressing': openAddressing,
  rehashing,
  'sets-and-maps': setsAndMaps,
  'string-hashing': stringHashing,
};
