import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { docBySlug, guideDocs } from '@/content/guide';

export const dynamicParams = false;
export const generateStaticParams = () => guideDocs.map(doc => ({ slug: doc.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: docBySlug((await params).slug)?.title };
}

export default async function GuideDocPage({ params }: Props) {
  const { slug } = await params;
  const doc = docBySlug(slug);
  if (!doc) notFound();

  const index = guideDocs.indexOf(doc);
  const previous = guideDocs[index - 1];
  const next = guideDocs[index + 1];

  return (
    <article className="doc">
      <div className="crumbs"><span>{doc.section}</span></div>
      <h1>{doc.title}</h1>
      <p className="doc-lead">{doc.lead}</p>
      <div className="doc-body">{doc.body}</div>
      {doc.tryIt && <Link className="btn btn-primary doc-try" href={doc.tryIt.href}>{doc.tryIt.label}<ArrowRight size={13} /></Link>}

      <nav className="doc-pager" aria-label="Previous and next page">
        {previous ? <Link href={`/guide/${previous.slug}`}><ArrowLeft size={13} />{previous.title}</Link> : <span />}
        {next && <Link href={`/guide/${next.slug}`}>{next.title}<ArrowRight size={13} /></Link>}
      </nav>
    </article>
  );
}
