'use client';

import type { ReactNode } from 'react';
import { TreeCanvas } from '@/components/visual/tree-canvas';
import type { Cell, CellRow, Legend, Panel, Tone } from '@/simulators/kit';
import { ChartView, GraphView } from './diagrams';

const toneClass = (tone?: Tone) => (tone ? `tone-${tone}` : 'tone-plain');

function RowView({ row, small }: { row: CellRow; small?: boolean }) {
  const first = row.firstIndex ?? 0;
  const indexes = !row.hideIndex;
  const hasPointers = Boolean(row.pointers && Object.keys(row.pointers).length);
  return (
    <div className={`sim-row ${small ? 'is-small' : ''}`}>
      {row.label && <span className="sim-row-label">{row.label}</span>}
      <div className="sim-cells">
        {Array.from({ length: row.offset ?? 0 }, (_, i) => <span className="sim-cell-wrap is-gap" key={`gap-${i}`} aria-hidden="true"><span className="sim-cell" /></span>)}
        {row.cells.map((cell, i) => (
          <span className="sim-cell-wrap" key={i}>
            {hasPointers && <span className="sim-pointer">{row.pointers?.[i] ?? ''}</span>}
            <span className={`sim-cell ${toneClass(cell.tone)}`}>{cell.value}</span>
            {cell.sub !== undefined && <span className="sim-cell-sub">{cell.sub}</span>}
            {indexes && <span className="sim-index">{first + i}</span>}
          </span>
        ))}
        {!row.cells.length && <span className="sim-empty">Empty</span>}
      </div>
    </div>
  );
}

function Chip({ cell }: { cell: Cell }) {
  return <span className={`sim-chip ${toneClass(cell.tone)}`}>{cell.value}{cell.sub && <small>{cell.sub}</small>}</span>;
}

function PanelBody({ panel }: { panel: Panel }): ReactNode {
  switch (panel.kind) {
    case 'cells':
      return <div className="sim-scroll-x"><div className="sim-rows">{panel.rows.map((row, i) => <RowView key={i} row={row} small={panel.small} />)}</div></div>;
    case 'bars': {
      const low = Math.min(0, ...panel.bars.map(bar => bar.value));
      const high = Math.max(1, ...panel.bars.map(bar => bar.value));
      return (
        <div className="sim-bars">
          {panel.bars.map((bar, i) => (
            <div className="sim-bar-wrap" key={i}>
              <span className="sim-bar-value">{bar.value}</span>
              <span className={`sim-bar ${toneClass(bar.tone)}`} style={{ height: `${6 + (94 * (bar.value - low)) / (high - low)}%` }} />
              {bar.label !== undefined && <span className="sim-bar-label">{bar.label}</span>}
            </div>
          ))}
        </div>
      );
    }
    case 'table':
      return (
        <div className="sim-scroll-x">
          <table className="sim-table">
            {panel.colHead && <thead><tr>{panel.rowHead && <th scope="col">{panel.corner ?? ''}</th>}{panel.colHead.map((head, i) => <th scope="col" key={i}>{head}</th>)}</tr></thead>}
            <tbody>
              {panel.rows.map((items, r) => (
                <tr key={r}>
                  {panel.rowHead && <th scope="row">{panel.rowHead[r]}</th>}
                  {items.map((cell, c) => <td key={c} className={toneClass(cell.tone)}>{cell.value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'links':
      return (
        <div className="sim-links">
          {panel.nodes.map((node, i) => (
            <span className="sim-link-item" key={node.id}>
              <span className="sim-link-node">
                <span className="sim-link-tags">{node.tags?.join(', ') ?? ''}</span>
                <span className={`sim-cell ${toneClass(node.tone)}`}>{node.value}</span>
              </span>
              {i < panel.nodes.length - 1 && <span className="sim-link-arrow" aria-hidden="true">{panel.double ? '⇄' : '→'}</span>}
            </span>
          ))}
          {panel.nodes.length > 0 && <span className="sim-link-end">{panel.circular ? '↩ back to the first node' : panel.double ? '→ null' : '→ null'}</span>}
          {!panel.nodes.length && <span className="sim-empty">The list is empty</span>}
        </div>
      );
    case 'stack':
      return (
        <div className="sim-stack">
          {[...panel.items].reverse().map((item, i) => (
            <div className={`sim-stack-item ${toneClass(item.tone)}`} key={panel.items.length - i}>
              <span>{item.value}</span>
              {i === 0 && <small>top</small>}
            </div>
          ))}
          {!panel.items.length && <div className="sim-empty">{panel.empty ?? 'Empty'}</div>}
        </div>
      );
    case 'buckets':
      return (
        <div className="sim-buckets">
          {panel.buckets.map((bucket, i) => (
            <div className={`sim-bucket ${bucket.tone ? 'has-tone' : ''}`} key={i}>
              <span className={`sim-bucket-label ${toneClass(bucket.tone)}`}>{bucket.label}</span>
              <span className="sim-bucket-items">
                {bucket.items.map((item, j) => (
                  <span className="sim-bucket-item" key={j}>
                    {panel.chained && j > 0 && <span className="sim-link-arrow" aria-hidden="true">→</span>}
                    <Chip cell={item} />
                  </span>
                ))}
                {!bucket.items.length && <span className="sim-empty">Empty</span>}
              </span>
            </div>
          ))}
        </div>
      );
    case 'graph':
      return <GraphView panel={panel} />;
    case 'tree':
      return <div className="sim-tree"><TreeCanvas root={panel.root} label={panel.label} duration={260} empty={<p>{panel.empty ?? 'The tree is empty.'}</p>} /></div>;
    case 'pegs':
      return (
        <div className="sim-pegs">
          {panel.pegs.map(peg => (
            <div className="sim-peg" key={peg.label}>
              <div className="sim-peg-stack">
                <span className="sim-peg-pole" />
                {[...peg.disks].reverse().map(disk => (
                  <span key={disk} className={`sim-disk ${toneClass(peg.tone && disk === peg.disks.at(-1) ? peg.tone : undefined)}`} style={{ width: `${24 + (76 * disk) / panel.largest}%` }}>{disk}</span>
                ))}
              </div>
              <span className="sim-peg-base" />
              <span className="sim-peg-label">{peg.label}</span>
            </div>
          ))}
        </div>
      );
    case 'chart':
      return <ChartView panel={panel} />;
    case 'timeline': {
      const span = Math.max(1, panel.to - panel.from);
      const place = (value: number) => `${((value - panel.from) / span) * 100}%`;
      return (
        <div className="sim-timeline">
          {panel.rows.map((item, i) => (
            <div className="sim-time-row" key={i}>
              <span className="sim-time-label">{item.label}</span>
              <span className="sim-time-track">
                <span className={`sim-time-bar ${toneClass(item.tone)}`} style={{ left: place(item.start), width: `${((item.end - item.start) / span) * 100}%` }}>{item.sub}</span>
              </span>
            </div>
          ))}
          <div className="sim-time-row">
            <span className="sim-time-label" />
            <span className="sim-time-axis"><span>{panel.from}</span><span>{panel.to}</span></span>
          </div>
        </div>
      );
    }
    case 'log':
      return (
        <ol className="sim-log">
          {panel.lines.map((line, i) => <li key={i} className={line.tone ? `is-toned ${toneClass(line.tone)}` : ''}>{line.text}</li>)}
          {!panel.lines.length && <li className="sim-empty">{panel.empty ?? 'Nothing yet'}</li>}
        </ol>
      );
    case 'facts':
      return (
        <dl className="sim-facts">
          {panel.items.map(item => (
            <div key={item.label}><dt>{item.label}</dt><dd className={item.tone ? `is-toned ${toneClass(item.tone)}` : ''}>{item.value}</dd></div>
          ))}
        </dl>
      );
    case 'note':
      return <p className="sim-note">{panel.text}</p>;
  }
}

function LegendView({ legend }: { legend: Legend }) {
  return (
    <ul className="sim-legend">
      {legend.map(item => <li key={item.label}><i className={`swatch tone-${item.tone}`} />{item.label}</li>)}
    </ul>
  );
}

export function PanelView({ panel }: { panel: Panel }) {
  const fills = panel.kind === 'tree' || panel.kind === 'graph' || panel.kind === 'chart' || panel.kind === 'bars' || panel.kind === 'pegs';
  return (
    <section className={`sim-panel ${fills ? 'is-fill' : ''}`} aria-label={panel.title}>
      {panel.title && <h3 className="kicker">{panel.title}</h3>}
      <PanelBody panel={panel} />
      {panel.legend && <LegendView legend={panel.legend} />}
    </section>
  );
}
