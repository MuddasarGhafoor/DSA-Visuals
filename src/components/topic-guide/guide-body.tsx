import Link from 'next/link';
import { guideHref, topicByTitle } from '@/lib/catalog';
import { highlightCode, parseInline, type Block, type InlineNode } from '@/lib/guide-markdown';

function InlinePiece({ node }: { node: InlineNode }) {
  switch (node.kind) {
    case 'text':
      return <>{node.text}</>;
    case 'code':
      return <code>{node.text}</code>;
    case 'strong':
      return <strong>{node.children.map((child, i) => <InlinePiece key={i} node={child} />)}</strong>;
    case 'topic': {
      const topic = topicByTitle(node.title);
      return topic ? <Link href={guideHref(topic)}>{node.text}</Link> : <>{node.text}</>;
    }
  }
}

export function InlineText({ text }: { text: string }) {
  return <>{parseInline(text).map((node, i) => <InlinePiece key={i} node={node} />)}</>;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <figure className="article-code">
      {language !== 'text' && <figcaption>{language === 'python' ? 'Python' : language}</figcaption>}
      <pre tabIndex={0}><code>{highlightCode(code, language).map((piece, i) => (piece.kind === 'plain' ? piece.text : <span key={i} className={`code-${piece.kind}`}>{piece.text}</span>))}</code></pre>
    </figure>
  );
}

function GuideBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case 'heading':
      return block.level === 2 ? <h2 id={block.id}>{block.text}</h2> : <h3 id={block.id}>{block.text}</h3>;
    case 'p':
      return <p><InlineText text={block.text} /></p>;
    case 'ul':
      return <ul>{block.items.map((item, i) => <li key={i}><InlineText text={item} /></li>)}</ul>;
    case 'ol':
      return <ol>{block.items.map((item, i) => <li key={i}><InlineText text={item} /></li>)}</ol>;
    case 'note':
      return <p className="article-note"><InlineText text={block.text} /></p>;
    case 'code':
      return <CodeBlock code={block.code} language={block.language} />;
    case 'table':
      return (
        <div className="table-wrap article-table" tabIndex={0}>
          <table>
            <thead><tr>{block.head.map((cell, i) => <th key={i} scope="col"><InlineText text={cell} /></th>)}</tr></thead>
            <tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}><InlineText text={cell} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
  }
}

export function GuideBody({ blocks }: { blocks: Block[] }) {
  return <div className="article-body">{blocks.map((block, i) => <GuideBlock key={i} block={block} />)}</div>;
}
