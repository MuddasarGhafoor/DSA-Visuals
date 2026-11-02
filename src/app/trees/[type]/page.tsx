import type { Metadata } from 'next';
import { TreeWorkspace } from '@/components/workspace/tree-workspace';
import type { TreeMode } from '@/lib/trees';

export const dynamicParams = false;
export const generateStaticParams = () => [{ type: 'bst' }, { type: 'avl' }];

const TITLES: Record<TreeMode, string> = { bst: 'Binary Search Tree', avl: 'AVL Tree' };

type Props = { params: Promise<{ type: TreeMode }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: TITLES[(await params).type] };
}

export default async function TreePage({ params }: Props) {
  const { type } = await params;
  return <TreeWorkspace key={type} mode={type} />;
}
