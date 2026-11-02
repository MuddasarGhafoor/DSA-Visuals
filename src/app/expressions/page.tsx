import type { Metadata } from 'next';
import { ExpressionWorkspace } from '@/components/workspace/expression-workspace';

export const metadata: Metadata = { title: 'Expression Evaluator' };

export default function ExpressionsPage() {
  return <ExpressionWorkspace />;
}
