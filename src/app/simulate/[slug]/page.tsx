import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SimulatorPage } from '@/components/simulator/simulator-page';
import { allTopics, topicSlug } from '@/lib/catalog';

const shared = allTopics.filter(topic => !topic.simulator);
const titleOf = (slug: string) => shared.find(topic => topicSlug(topic) === slug)?.title;

export const dynamicParams = false;
export const generateStaticParams = () => shared.map(topic => ({ slug: topicSlug(topic) }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const title = titleOf((await params).slug);
  return title ? { title: `${title} Simulator` } : {};
}

export default async function SimulatePage({ params }: Props) {
  const { slug } = await params;
  const title = titleOf(slug);
  if (!title) notFound();
  return <SimulatorPage slug={slug} title={title} />;
}
