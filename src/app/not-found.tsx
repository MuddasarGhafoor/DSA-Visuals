import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Home, LayoutGrid } from 'lucide-react';
import { StatusPage } from '@/components/site/status-page';

export const metadata: Metadata = { title: 'Page Not Found' };

export default function NotFound() {
  return (
    <StatusPage
      label="404"
      title="Page Not Found"
      actions={
        <>
          <Link className="btn" href="/"><Home size={14} />Go Home</Link>
          <Link className="btn" href="/topics"><LayoutGrid size={14} />Browse Topics</Link>
          <Link className="btn" href="/guide"><BookOpen size={14} />Read the Guide</Link>
        </>
      }
    >
      This page doesn&apos;t exist, or its address has changed. Check the address, or pick up from one of these.
    </StatusPage>
  );
}
