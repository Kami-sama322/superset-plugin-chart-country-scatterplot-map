import type { CSSProperties } from 'react';
import type { TooltipRow } from './tooltipUtils';

const BOX_STYLE: CSSProperties = {
  background: 'rgba(20, 20, 20, 0.92)',
  color: '#fff',
  padding: '8px 10px',
  borderRadius: 4,
  maxWidth: 320,
  fontSize: 12,
  lineHeight: 1.45,
  pointerEvents: 'none',
  overflow: 'visible',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
};

const INNER_STYLE: CSSProperties = {
  overflow: 'visible',
  whiteSpace: 'normal',
};

type Props = {
  html: string;
  rows: TooltipRow[];
};

export default function ChartTooltip({ html, rows }: Props) {
  const hasHtml = Boolean(html.trim());
  return (
    <div
      className="deckgl-tooltip"
      data-tooltip-type="custom"
      role="tooltip"
      style={BOX_STYLE}
    >
      {hasHtml ? (
        <div
          style={INNER_STYLE}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        rows.map((row, index) => (
          <div key={`${row.label}-${row.value}-${index}`}>
            {row.label ? `${row.label}: ` : null}
            <strong>{row.value}</strong>
          </div>
        ))
      )}
    </div>
  );
}
