import Handlebars from 'handlebars';
import { sanitizeHtml } from '@superset-ui/core';
import { tooltipItemField } from './columnUtils';
import { contentFieldNames } from './tooltipSync';
import { RegionMapDataItem } from './types';

let helpersRegistered = false;

function registerHandlebarsHelpers() {
  if (helpersRegistered) {
    return;
  }
  helpersRegistered = true;
  Handlebars.registerHelper('limit', (value: unknown, limit: number) => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (Array.isArray(value)) {
      const limited = value.slice(0, limit);
      return limited.join(', ') + (value.length > limit ? '...' : '');
    }
    if (typeof value === 'string') {
      const items = value.split(',').map(item => item.trim());
      if (items.length <= limit) {
        return value;
      }
      return `${items.slice(0, limit).join(', ')}...`;
    }
    return value;
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lookupValue(point: RegionMapDataItem, field: string): unknown {
  if (field in (point.extra || {})) {
    return point.extra?.[field];
  }
  const extra = point.extra || {};
  const match = Object.keys(extra).find(
    key => key.toLowerCase() === field.toLowerCase(),
  );
  if (match) {
    return extra[match];
  }
  const record = point as unknown as Record<string, unknown>;
  if (field in record) {
    return record[field];
  }
  return undefined;
}

export function buildDefaultTemplate(
  tooltipContents: unknown[] | undefined,
  metricLabel: string,
): string {
  const lines = [
    '<div><strong>{{region_name}}</strong></div>',
    `<div>${escapeHtml(metricLabel)}: {{metric_formatted}}</div>`,
  ];
  contentFieldNames(tooltipContents).forEach(field => {
    if (field === 'metric' || field === metricLabel) {
      return;
    }
    lines.push(`<div>${escapeHtml(field)}: {{ ${field} }}</div>`);
  });
  return lines.join('');
}

function tooltipData(
  point: RegionMapDataItem,
  formatMetric: (value: number) => string,
  tooltipContents?: unknown[],
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    ...(point.extra || {}),
    country_id: point.country_id,
    metric: point.metric,
    metric_formatted: formatMetric(point.metric),
    longitude: point.longitude,
    latitude: point.latitude,
    region_name: point.region_name,
  };
  (tooltipContents || []).forEach(item => {
    const field = tooltipItemField(item);
    if (!field || field.field in data) {
      return;
    }
    data[field.field] = lookupValue(point, field.field);
  });
  return data;
}

export type TooltipRow = {
  label: string;
  value: string;
};

export function buildTooltipRows(
  point: RegionMapDataItem,
  formatMetric: (value: number) => string,
  tooltipContents?: unknown[],
  metricLabel = 'metric',
): TooltipRow[] {
  const rows: TooltipRow[] = [
    {
      label: '',
      value: String(point.region_name || point.country_id || ''),
    },
    {
      label: metricLabel,
      value: formatMetric(point.metric),
    },
  ];
  contentFieldNames(tooltipContents).forEach(field => {
    if (field === 'metric' || field === metricLabel) {
      return;
    }
    const value = lookupValue(point, field);
    if (value === null || value === undefined || value === '') {
      return;
    }
    rows.push({ label: field, value: String(value) });
  });
  return rows.filter(row => row.value);
}

function maybeSanitize(html: string): string {
  if (typeof document === 'undefined') {
    return html;
  }
  try {
    const appContainer = document.getElementById('app');
    const { common } = JSON.parse(
      appContainer?.getAttribute('data-bootstrap') || '{}',
    );
    const htmlSanitization = common?.conf?.HTML_SANITIZATION ?? true;
    if (!htmlSanitization) {
      return html;
    }
    const sanitized = sanitizeHtml(html);
    return sanitized.trim() ? sanitized : '';
  } catch {
    return '';
  }
}

export function buildTooltipHtml(
  template: string | undefined,
  point: RegionMapDataItem,
  formatMetric: (value: number) => string,
  tooltipContents?: unknown[],
  metricLabel = 'metric',
): string {
  registerHandlebarsHelpers();
  const effective = template?.trim()
    ? template
    : buildDefaultTemplate(tooltipContents, metricLabel);
  const data = tooltipData(point, formatMetric, tooltipContents);

  try {
    const rendered = String(Handlebars.compile(effective)(data) ?? '');
    if (rendered.trim()) {
      return maybeSanitize(rendered);
    }
  } catch {
    // fall through to default template
  }
  try {
    return maybeSanitize(
      String(
        Handlebars.compile(
          buildDefaultTemplate(tooltipContents, metricLabel),
        )(data) ?? '',
      ),
    );
  } catch {
    return '';
  }
}

export function scaleRadius(
  metric: number,
  minMetric: number,
  maxMetric: number,
  minRadius: number,
  maxRadius: number,
  multiplier: number,
): number {
  const scaledMetric = metric * multiplier;
  if (maxMetric <= minMetric) {
    return (minRadius + maxRadius) / 2;
  }
  const t = (scaledMetric - minMetric) / (maxMetric - minMetric);
  const clamped = Math.max(0, Math.min(1, t));
  return minRadius + clamped * (maxRadius - minRadius);
}
