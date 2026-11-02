import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Navbar } from '@/components/site/navbar';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'DSA Visuals', template: '%s | DSA Visuals' },
  description: 'Step through data structures and algorithms one operation at a time: expression evaluation, binary search trees, AVL rotations, and more.',
};

// Runs before the first paint so a saved theme never flashes. Without a saved choice the CSS follows the system.
const applySavedTheme = `try{var t=localStorage.getItem('dsa-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applySavedTheme }} />
      </head>
      <body>
        <Navbar />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
