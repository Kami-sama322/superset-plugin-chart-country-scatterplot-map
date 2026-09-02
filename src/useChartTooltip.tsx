import { useCallback, useRef } from 'react';
import type { DeckGLContainerHandle } from '../../legacy-preset-chart-deckgl/src/DeckGLContainer';
import ChartTooltip from './ChartTooltip';
import { buildTooltipHtml, buildTooltipRows } from './tooltipUtils';
import type { RegionMapDataItem } from './types';

export function useChartTooltip(
  format: (value: number) => string,
  tooltipTemplate: string | undefined,
  tooltipContents: unknown[] | undefined,
  metricLabel: string,
) {
  const containerRef = useRef<DeckGLContainerHandle>(null);
  const hoverSourceRef = useRef<string | null>(null);

  const showTooltip = useCallback(
    (source: string, point: RegionMapDataItem, x: number, y: number) => {
      hoverSourceRef.current = source;
      const html = buildTooltipHtml(
        tooltipTemplate,
        point,
        format,
        tooltipContents,
        metricLabel,
      );
      const rows = buildTooltipRows(
        point,
        format,
        tooltipContents,
        metricLabel,
      );
      containerRef.current?.setTooltip({
        content: <ChartTooltip html={html} rows={rows} />,
        x,
        y,
      });
    },
    [format, metricLabel, tooltipContents, tooltipTemplate],
  );

  const hideTooltip = useCallback((source: string) => {
    if (hoverSourceRef.current && hoverSourceRef.current !== source) {
      return;
    }
    hoverSourceRef.current = null;
    containerRef.current?.setTooltip(null);
  }, []);

  return { containerRef, showTooltip, hideTooltip };
}
