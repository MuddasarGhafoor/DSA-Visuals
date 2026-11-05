import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Play } from 'lucide-react';
import { TopicsSidebar } from '@/components/site/topics-sidebar';
import { allTopics, catalog, groupStatus, guideHref, simulatorHref } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Topics' };

export default function TopicsPage() {
  return (
    <div className="topics-page">
      <TopicsSidebar />

      <div className="topics-main">
        <header className="topics-head">
          <h1>Topics</h1>
          <p>{allTopics.length} topics in {catalog.length} categories. Every topic has a guide and a simulator.</p>
        </header>

        {catalog.map(group => (
          <section className="topic-section" id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
            <div className="topic-section-head">
              <group.Icon size={15} />
              <div>
                <h2 id={`${group.id}-title`}>{group.title}</h2>
                <p>{group.summary}</p>
              </div>
              <span>{groupStatus(group)}</span>
            </div>
            <table className="topic-table">
              <thead>
                <tr><th scope="col">Topic</th><th scope="col">Guide</th><th scope="col">Simulator</th></tr>
              </thead>
              <tbody>
                {group.topics.map(topic => (
                  <tr key={topic.title}>
                    <td>{topic.title}</td>
                    <td><Link className="topic-link" href={guideHref(topic)} aria-label={`Read the ${topic.title} guide`}><BookOpen size={13} />Read</Link></td>
                    <td><Link className="topic-link" href={simulatorHref(topic)} aria-label={`Open the ${topic.title} simulator`}><Play size={13} />Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
}
