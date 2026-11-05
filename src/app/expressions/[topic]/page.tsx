import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ComponentType } from 'react';
import { BalancedBracketsWorkspace, ExpressionTreeWorkspace } from '@/components/workspace/expression-tools';

const TOOLS: Record<string, { title: string; Workspace: ComponentType }> = {
  'expression-tree': { title: 'Expression Tree', Workspace: ExpressionTreeWorkspace },
  'balanced-parentheses': { title: 'Balanced Parentheses', Workspace: BalancedBracketsWorkspace },
};

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(TOOLS).map(topic => ({ topic }));

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: TOOLS[(await params).topic]?.title };
}

export default async function ExpressionToolPage({ params }: Props) {
  const tool = TOOLS[(await params).topic];
  if (!tool) notFound();
  return <tool.Workspace />;
}
