import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { docBySlug, guideDocs, guideLink } from '@/content/guide';

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
  const related = (doc.related ?? []).flatMap(s => guideLink(s) ?? []);

  return (
    <article className="doc">
      <div className="crumbs">
        <span>{doc.section}</span>
        {doc.module && <><span>/</span><span>{doc.module}</span></>}
      </div>
      <h1>{doc.title}</h1>
      <p className="doc-lead">{doc.lead}</p>
      <div className="doc-body">
        {doc.body}
        {doc.parts?.map(part => (
          <section className="doc-part" key={part.slug}>
            <h2 id={part.slug}>{part.title}</h2>
            <p className="doc-part-lead">{part.lead}</p>
            {part.body}
            {part.tryIt && <Link className="btn btn-primary doc-try" href={part.tryIt.href}>{part.tryIt.label}<ArrowRight size={13} /></Link>}
          </section>
        ))}
      </div>
      {doc.tryIt && <Link className="btn btn-primary doc-try" href={doc.tryIt.href}>{doc.tryIt.label}<ArrowRight size={13} /></Link>}

      {related.length > 0 && (
        <div className="doc-links">
          <span>Linked Topics</span>
          {related.map(item => <Link key={item.href} href={item.href}>{item.title}</Link>)}
        </div>
      )}
      <nav className="doc-pager" aria-label="Previous and next page">
        {previous ? <Link href={`/guide/${previous.slug}`}><ArrowLeft size={13} />{previous.title}</Link> : <span />}
        {next && <Link href={`/guide/${next.slug}`}>{next.title}<ArrowRight size={13} /></Link>}
      </nav>
    </article>
  );
}
