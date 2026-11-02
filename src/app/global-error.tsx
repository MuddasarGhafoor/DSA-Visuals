'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { StatusPage } from '@/components/site/status-page';
import './globals.css';

/** Replaces the root layout when the layout itself crashes, so it can't rely on the navbar. */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <html lang="en">
      <body>
        <StatusPage
          label="Error"
          title="Something Went Wrong"
          actions={<button className="btn" onClick={reset}><RotateCcw size={14} />Try Again</button>}
        >
          The site stopped working because of a problem on our side. Your saved work is still in this browser.
        </StatusPage>
      </body>
    </html>
  );
}
