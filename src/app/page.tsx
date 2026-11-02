import Link from 'next/link';
import { BookOpen, LayoutGrid } from 'lucide-react';
import { LiveDemo, type DemoScene } from '@/components/visual/live-demo';

const heroScenes: DemoScene[] = [
  { kind: 'expression', label: 'Expression Evaluation', href: '/expressions', input: '(2 + 4) * 3' },
  { kind: 'tree', label: 'BST Insertion', href: '/trees/bst', mode: 'bst', seed: '40, 20, 60', values: '30' },
  { kind: 'tree', label: 'AVL Rotation', href: '/trees/avl', mode: 'avl', values: '30, 10, 20' },
  { kind: 'tree', label: 'BST Deletion', href: '/trees/bst', mode: 'bst', seed: '50, 30, 70, 20, 40', operation: 'delete', values: '30' },
  { kind: 'traversal', label: 'Inorder Traversal', href: '/trees/bst', mode: 'bst', values: '40, 20, 60, 10, 30', order: 'in' },
];

const howItWorks = [
  { title: 'Enter Your Input', detail: 'Type your own values, or pick an example sorted by difficulty.' },
  { title: 'Watch Every Operation', detail: 'Values merge and nodes move, while each step says what happened and why.' },
  { title: 'Step Through at Your Pace', detail: 'Play, pause, or jump to any step, forward or backward.' },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>See How Algorithms <span>Actually Work</span></h1>
          <p>Enter your own input and step through every operation, as values merge, stacks move, and trees rotate.</p>
          <div className="hero-actions">
            <Link className="btn" href="/topics"><LayoutGrid size={14} />Browse Topics</Link>
            <Link className="btn" href="/guide"><BookOpen size={14} />Read the Guide</Link>
          </div>
        </div>
        <LiveDemo scenes={heroScenes} height={270} frameMs={720} className="hero-demo" />
      </section>

      <section className="how" aria-labelledby="how-title">
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
    </div>
  );
}
