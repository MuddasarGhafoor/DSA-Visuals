'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Home, RotateCcw } from 'lucide-react';
import { StatusPage } from '@/components/site/status-page';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <StatusPage
      label="Error"
      title="Something Went Wrong"
      actions={
        <>
          <button className="btn" onClick={reset}><RotateCcw size={14} />Try Again</button>
          <Link className="btn" href="/"><Home size={14} />Go Home</Link>
        </>
      }
    >
      This page stopped working because of a problem on our side. Your saved work is still in this browser.
    </StatusPage>
  );
}
