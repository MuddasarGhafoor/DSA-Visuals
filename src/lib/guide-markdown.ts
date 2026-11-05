import { toHeadingId } from './search.ts';

/**
 * Topic guides are small Markdown files. Only what the guides use is supported, and anything else
 * is an error, so a typo in a guide fails the tests instead of showing up on the page.
 *
 * The file starts with "> summary". Inside the text, [[Topic]] or [[Topic|words]] links to another guide.
 */
export type Block =
  | { kind: 'heading'; level: 2 | 3; id: string; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'note'; text: string }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'table'; head: string[]; rows: string[][] };

export type OutlineItem = { id: string; title: string; subs: { id: string; title: string }[] };
export type ParsedGuide = { summary: string; blocks: Block[]; outline: OutlineItem[] };

const splitRow = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));

export function parseGuide(source: string): ParsedGuide {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let at = 0;
  const skipBlank = () => {
    while (at < lines.length && !lines[at].trim()) at++;
  };

  skipBlank();
  if (!lines[at]?.startsWith('> ')) throw new Error('A guide must start with "> summary".');
  const summary = lines[at++].slice(2).trim();

  const blocks: Block[] = [];
  const outline: OutlineItem[] = [];
  const used = new Set<string>();

  const uniqueId = (base: string) => {
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };

  while (at < lines.length) {
    const line = lines[at];
    if (!line.trim()) {
      at++;
    } else if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      if (!language) throw new Error(`Line ${at + 1}: a code block must name its language.`);
      const code: string[] = [];
      at++;
      while (at < lines.length && !lines[at].startsWith('```')) code.push(lines[at++]);
      if (at >= lines.length) throw new Error(`A code block in "${language}" is never closed.`);
      at++;
      blocks.push({ kind: 'code', language, code: code.join('\n') });
    } else if (line.startsWith('### ')) {
      const text = unescape(line.slice(4).trim());
      const parent = outline.at(-1);
      if (!parent) throw new Error(`Line ${at + 1}: "${text}" comes before any ## heading.`);
      const id = uniqueId(`${parent.id}-${toHeadingId(text)}`);
      parent.subs.push({ id, title: text });
      blocks.push({ kind: 'heading', level: 3, id, text });
      at++;
    } else if (line.startsWith('## ')) {
      const text = unescape(line.slice(3).trim());
      const id = uniqueId(toHeadingId(text));
      outline.push({ id, title: text, subs: [] });
      blocks.push({ kind: 'heading', level: 2, id, text });
      at++;
    } else if (line.startsWith('#')) {
      throw new Error(`Line ${at + 1}: only ## and ### headings are allowed: ${line}`);
    } else if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (at < lines.length && lines[at].startsWith('|')) rows.push(splitRow(lines[at++]));
      if (rows.length < 3 || !rows[1].every(cell => /^:?-+:?$/.test(cell))) throw new Error(`Before line ${at + 1}: a table needs a head, a divider, and rows.`);
      const [head, , ...body] = rows;
      for (const row of body) if (row.length !== head.length) throw new Error(`Table row "${row.join(' | ')}" has ${row.length} cells, and the head has ${head.length}.`);
      blocks.push({ kind: 'table', head, rows: body });
    } else if (line.startsWith('- ')) {
      const items: string[] = [];
      while (at < lines.length && lines[at].startsWith('- ')) items.push(lines[at++].slice(2).trim());
      blocks.push({ kind: 'ul', items });
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (at < lines.length && /^\d+\. /.test(lines[at])) items.push(lines[at++].replace(/^\d+\. /, '').trim());
      blocks.push({ kind: 'ol', items });
    } else if (line.startsWith('> ')) {
      blocks.push({ kind: 'note', text: lines[at++].slice(2).trim() });
    } else {
      const words: string[] = [];
      while (at < lines.length && lines[at].trim() && !/^(```|#|\||- |\d+\. |> )/.test(lines[at])) words.push(lines[at++].trim());
      blocks.push({ kind: 'p', text: words.join(' ') });
    }
  }
  return { summary, blocks, outline };
}

export type InlineNode =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: InlineNode[] }
  | { kind: 'topic'; title: string; text: string };

const INLINE = /`([^`]+)`|\*\*((?:\\.|[^\\])+?)\*\*|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/** A backslash keeps a symbol literal: A\* shows as A*. */
const unescape = (text: string) => text.replace(/\\([*_])/g, '$1');

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) nodes.push({ kind: 'text', text: unescape(text.slice(last, match.index)) });
    if (match[1] !== undefined) nodes.push({ kind: 'code', text: match[1] });
    else if (match[2] !== undefined) nodes.push({ kind: 'strong', children: parseInline(match[2]) });
    else nodes.push({ kind: 'topic', title: match[3], text: unescape(match[4] ?? match[3]) });
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push({ kind: 'text', text: unescape(text.slice(last)) });
  return nodes;
}

const plainNode = (node: InlineNode): string => (node.kind === 'strong' ? node.children.map(plainNode).join('') : node.text);

/** The words a reader sees, for search. */
export const plainText = (text: string) => parseInline(text).map(plainNode).join('');

const blockText = (block: Block): string => {
  switch (block.kind) {
    case 'p':
    case 'note':
      return plainText(block.text);
    case 'ul':
    case 'ol':
      return block.items.map(plainText).join(' ');
    case 'table':
      return [block.head, ...block.rows].flat().map(plainText).join(' ');
    default:
      return '';
  }
};

/** Each heading with the words under it, for search. */
export function guideSections(guide: ParsedGuide): { id: string; title: string; text: string }[] {
  const sections: { id: string; title: string; text: string }[] = [];
  for (const block of guide.blocks) {
    if (block.kind === 'heading') sections.push({ id: block.id, title: block.text, text: '' });
    else if (sections.length) sections.at(-1)!.text = `${sections.at(-1)!.text} ${blockText(block)}`.trim();
  }
  return sections;
}

export type CodePiece = { kind: 'plain' | 'comment' | 'string' | 'keyword'; text: string };

const PYTHON = /(#.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(and|as|break|class|continue|def|elif|else|False|for|from|if|import|in|is|lambda|None|not|or|pass|return|True|while|yield)\b/gm;

/** A light touch of color for code samples: comments, strings, and keywords. */
export function highlightCode(code: string, language: string): CodePiece[] {
  if (language !== 'python') return [{ kind: 'plain', text: code }];
  const pieces: CodePiece[] = [];
  let last = 0;
  for (const match of code.matchAll(PYTHON)) {
    if (match.index > last) pieces.push({ kind: 'plain', text: code.slice(last, match.index) });
    pieces.push({ kind: match[1] ? 'comment' : match[2] ? 'string' : 'keyword', text: match[0] });
    last = match.index + match[0].length;
  }
  if (last < code.length) pieces.push({ kind: 'plain', text: code.slice(last) });
  return pieces;
}
