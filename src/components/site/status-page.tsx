import type { ReactNode } from 'react';

/** A centered message for moments like a missing page or a crash. */
export function StatusPage({ label, title, children, actions }: { label: string; title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <div className="status-page">
      <span className="status-label">{label}</span>
      <h1>{title}</h1>
      <p>{children}</p>
      <div className="status-actions">{actions}</div>
    </div>
  );
}
