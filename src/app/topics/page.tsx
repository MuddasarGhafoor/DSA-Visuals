import type { Metadata } from 'next';
import { TopicRow } from '@/components/site/topic-row';
import { TopicsSidebar } from '@/components/site/topics-sidebar';
import { allTopics, catalog, groupStatus, LEVELS, liveTopics } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Topics' };

export default function TopicsPage() {
  return (
    <div className="topics-page">
      <TopicsSidebar />

      <div className="topics-main">
        <header className="topics-head">
          <h1>Topics</h1>
          <p>{allTopics.length} topics in {catalog.length} categories, in a suggested learning order. {liveTopics.length} are ready now, and the rest are on the way.</p>
          <dl className="topics-levels">
            {LEVELS.map(({ level, hint }) => (
              <div key={level}><dt>{level}</dt><dd>{hint}</dd></div>
            ))}
          </dl>
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
            <div className="level-grid">
              {LEVELS.map(({ level }) => {
                const topics = group.topics.filter(topic => topic.level === level);
                return (
                  <div className={topics.length ? '' : 'is-empty'} key={level}>
                    {topics.length > 0 && <h3>{level}</h3>}
                    <ul>
                      {topics.map(topic => <li key={topic.title}><TopicRow topic={topic} /></li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
