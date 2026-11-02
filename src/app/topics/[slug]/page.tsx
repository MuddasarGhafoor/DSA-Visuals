import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TopicRow } from '@/components/site/topic-row';
import { topicNotes } from '@/content/topic-notes';
import { allTopics, catalog, LEVELS, liveTopics, topicAt, topicHref, type Topic } from '@/lib/catalog';

export const dynamicParams = false;
export const generateStaticParams = () => allTopics.filter(topic => !topic.href).map(topic => ({ slug: topicHref(topic).split('/').pop()! }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: topicAt(`/topics/${(await params).slug}`)?.topic.title };
}

export default async function ComingSoonPage({ params }: Props) {
  const found = topicAt(`/topics/${(await params).slug}`);
  if (!found) notFound();
  const { topic, group } = found;

  // The closest topics first: the same level, then the rest of the category.
  const others = group.topics.filter(item => item !== topic && !item.href);
  const nearby: Topic[] = [...others.filter(item => item.level === topic.level), ...others.filter(item => item.level !== topic.level)].slice(0, 5);

  return (
    <div className="soon-page">
      <Link className="soon-back" href={`/topics#${group.id}`}><ArrowLeft size={13} />{group.title}</Link>
      <span className="soon-badge">Coming Soon</span>
      <h1>{topic.title}</h1>
      <p className="soon-note">{topicNotes[topic.title]}</p>
      <dl className="soon-facts">
        <div><dt>Category</dt><dd>{group.title}</dd></div>
        <div><dt>Level</dt><dd>{topic.level}</dd></div>
        <div><dt>What That Means</dt><dd>{LEVELS.find(item => item.level === topic.level)?.hint}</dd></div>
      </dl>
      <div className="soon-lists">
        <section aria-labelledby="ready-title">
          <h2 id="ready-title">Ready Now</h2>
          <ul>{liveTopics.map(item => <li key={item.title}><TopicRow topic={item} /></li>)}</ul>
        </section>
        {nearby.length > 0 && (
          <section aria-labelledby="nearby-title">
            <h2 id="nearby-title">Also in {group.title}</h2>
            <ul>{nearby.map(item => <li key={item.title}><TopicRow topic={item} /></li>)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}
