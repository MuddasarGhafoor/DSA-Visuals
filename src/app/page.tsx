import Link from 'next/link';
import { BookOpen, LayoutGrid } from 'lucide-react';
import { LiveDemo, type DemoScene } from '@/components/visual/live-demo';
import { allTopics, catalog, simulatorHref, topicByTitle } from '@/lib/catalog';

const heroScenes: DemoScene[] = [
  { kind: 'expression', label: 'Expression Evaluation', href: '/expressions', input: '(2 + 4) * 3' },
  { kind: 'simulator', label: 'Bubble Sort', href: '/simulate/bubble-sort', slug: 'bubble-sort', values: { values: '4, 1, 3, 2' } },
  { kind: 'simulator', label: 'Dijkstra', href: '/simulate/dijkstra', slug: 'dijkstra' },
  { kind: 'tree', label: 'AVL Rotation', href: '/trees/avl', mode: 'avl', values: '30, 10, 20' },
  { kind: 'simulator', label: '0/1 Knapsack', href: '/simulate/0-1-knapsack', slug: '0-1-knapsack', values: { items: 'A(1,1), B(3,4), C(4,5)', capacity: '5' } },
  { kind: 'simulator', label: 'Tower of Hanoi', href: '/simulate/tower-of-hanoi', slug: 'tower-of-hanoi', values: { disks: '3' } },
];

const howItWorks = [
  { title: 'Pick a Topic', detail: 'Choose from the topics most DSA courses teach, and read a guide that explains each one with worked examples and code.' },
  { title: 'Run It on Your Input', detail: 'Open its simulator, type your own values or pick an example, and choose the method you are learning.' },
  { title: 'Step Through at Your Pace', detail: 'Play, pause, or jump to any step, while each one says what happened and why.' },
];

/** Each topic's simulator shows what suits it. A sample of the kinds of view, with a topic that uses each one. */
const views: { view: string; topic: string }[] = [
  { view: 'Bars', topic: 'Bubble Sort' },
  { view: 'Boxes and pointers', topic: 'Binary Search' },
  { view: 'Linked nodes', topic: 'Linked Lists' },
  { view: 'Buckets', topic: 'Radix Sort' },
  { view: 'A graph', topic: 'Dijkstra' },
  { view: 'A tree', topic: 'Heaps' },
  { view: 'A table that fills', topic: 'Edit Distance' },
  { view: 'A board', topic: 'N-Queens' },
  { view: 'Pegs and disks', topic: 'Tower of Hanoi' },
  { view: 'A timeline', topic: 'Activity Selection' },
  { view: 'A growth chart', topic: 'Big-O Growth Comparison' },
  { view: 'A call stack', topic: 'Recursion and the Call Stack' },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>See How Algorithms <span>Actually Work</span></h1>
          <p>Pick a topic, read how it works, then run it on your own input and watch every step, as values swap, distances shrink, tables fill, and trees rotate.</p>
          <div className="hero-actions">
            <Link className="btn" href="/topics"><LayoutGrid size={14} />Browse Topics</Link>
            <Link className="btn" href="/guide"><BookOpen size={14} />Read the Guide</Link>
          </div>
          <dl className="hero-stats">
            <div><dt>Topics</dt><dd>{allTopics.length}</dd></div>
            <div><dt>Categories</dt><dd>{catalog.length}</dd></div>
            <div><dt>Simulators</dt><dd>{allTopics.length}</dd></div>
          </dl>
        </div>
        <LiveDemo scenes={heroScenes} height={270} frameMs={720} className="hero-demo" />
      </section>

      <section className="home-section how" aria-labelledby="how-title">
        <h2 id="how-title">How It Works</h2>
        <ol>
          {howItWorks.map((step, i) => (
            <li key={step.title}>
              <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section" aria-labelledby="categories-title">
        <h2 id="categories-title">Every Topic Has a Guide and a Simulator</h2>
        <ul className="category-grid">
          {catalog.map(group => (
            <li key={group.id}>
              <Link className="category-card" href={`/topics#${group.id}`}>
                <span className="category-card-head"><group.Icon size={15} />{group.title}</span>
                <small>{group.topics.length} topics</small>
                <span className="category-card-text">{group.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="views-title">
        <h2 id="views-title">Each Simulator Shows What Suits Its Topic</h2>
        <ul className="view-grid">
          {views.map(({ view, topic }) => {
            const found = topicByTitle(topic)!;
            return (
              <li key={view}>
                <Link className="view-link" href={simulatorHref(found)}>
                  <strong>{view}</strong>
                  <span>{found.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
