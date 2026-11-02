import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { topicHref, type Topic } from '@/lib/catalog';

export function TopicRow({ topic }: { topic: Topic }) {
  return topic.href ? (
    <Link className="topic is-live" href={topic.href}>{topic.title}<ArrowRight size={13} /></Link>
  ) : (
    <Link className="topic" href={topicHref(topic)}>{topic.title}<em>Soon</em></Link>
  );
}
