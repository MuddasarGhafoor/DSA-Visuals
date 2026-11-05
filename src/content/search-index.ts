import { Fragment, type ReactNode } from 'react';
import { guideDocs, GuideHeading } from '@/content/guide';
import { topicGuide } from '@/content/topic-guides';
import { catalog, guideHref, simulatorHref } from '@/lib/catalog';
import { guideSections, plainText } from '@/lib/guide-markdown';
import { toHeadingId, type SearchEntry } from '@/lib/search';

type Element = { type: unknown; props: Record<string, unknown> };

const isElement = (node: unknown): node is Element => typeof node === 'object' && node !== null && 'props' in node;

// Props that hold settings rather than words a reader would see.
const NOT_TEXT = new Set(['href', 'className', 'tone', 'style', 'role', 'scenes']);

/** The readable words in a piece of JSX, including those passed to helpers like Table and Terms. */
function textOf(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(textOf).filter(Boolean).join(' ');
  if (isElement(node)) return Object.entries(node.props).filter(([name]) => !NOT_TEXT.has(name)).map(([, value]) => textOf(value)).filter(Boolean).join(' ');
  return '';
}

const flatten = (node: unknown): unknown[] => {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (isElement(node) && node.type === Fragment) return flatten(node.props.children);
  return [node];
};

// Pieces of a sentence are joined with spaces, so punctuation can end up with one before it.
const tidy = (text: string) => text.replace(/\s+/g, ' ').replace(/ ([.,;:!?)])/g, '$1').trim();

/** Splits a body at its headings, so a result can point at the exact section. */
function sectionsOf(body: ReactNode) {
  const intro: string[] = [];
  const sections: { title: string; words: string[] }[] = [];
  for (const node of flatten(body)) {
    if (isElement(node) && (node.type === GuideHeading || node.type === 'h3')) sections.push({ title: textOf(node), words: [] });
    else (sections.at(-1)?.words ?? intro).push(textOf(node));
  }
  return { intro: tidy(intro.join(' ')), sections: sections.map(section => ({ title: section.title, text: tidy(section.words.join(' ')) })) };
}

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const group of catalog) {
    entries.push({ title: group.title, context: 'Topics', href: `/topics#${group.id}`, text: group.summary, kind: 'Topic' });
    for (const topic of group.topics) {
      const guide = topicGuide(topic);
      entries.push({ title: topic.title, context: group.title, href: guideHref(topic), text: plainText(guide.summary), kind: 'Topic' });
      entries.push({ title: topic.title, context: 'Simulator', href: simulatorHref(topic), text: `Run ${topic.title} on your own input, one step at a time.`, kind: 'Tool' });
      for (const section of guideSections(guide)) {
        entries.push({ title: section.title, context: `${topic.title} Guide`, href: `${guideHref(topic)}#${section.id}`, text: section.text, kind: 'Guide' });
      }
    }
  }

  for (const doc of guideDocs) {
    const page = `/guide/${doc.slug}`;
    const { intro, sections } = sectionsOf(doc.body);
    entries.push({ title: doc.title, context: `Guide · ${doc.section}`, href: page, text: tidy(`${doc.lead} ${intro}`), kind: 'Guide' });
    for (const section of sections) {
      entries.push({ title: section.title, context: `Guide · ${doc.title}`, href: `${page}#${toHeadingId(section.title)}`, text: section.text, kind: 'Guide' });
    }
  }

  return entries;
}
