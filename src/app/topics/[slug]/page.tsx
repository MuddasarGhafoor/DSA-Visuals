import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuideBody, InlineText } from '@/components/topic-guide/guide-body';
import { TopicGuideSidebar } from '@/components/topic-guide/topic-guide-sidebar';
import { topicGuide } from '@/content/topic-guides';
import { allTopics, simulatorHref, topicAt, topicSlug } from '@/lib/catalog';
import { plainText } from '@/lib/guide-markdown';

export const dynamicParams = false;
export const generateStaticParams = () => allTopics.map(topic => ({ slug: topicSlug(topic) }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = topicAt(`/topics/${(await params).slug}`);
  return found ? { title: found.topic.title, description: plainText(topicGuide(found.topic).summary) } : {};
}

export default async function TopicGuidePage({ params }: Props) {
  const found = topicAt(`/topics/${(await params).slug}`);
  if (!found) notFound();
  const { topic, group } = found;
  const guide = topicGuide(topic);

  return (
    <div className="article-page">
      <TopicGuideSidebar title={topic.title} category={group.title} categoryId={group.id} simulator={simulatorHref(topic)} outline={guide.outline} />
      <article className="article">
        <h1>{topic.title}</h1>
        <p className="article-summary"><InlineText text={guide.summary} /></p>
        <GuideBody blocks={guide.blocks} />
      </article>
    </div>
  );
}
