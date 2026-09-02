import {
  getColumnLabel,
  isAdhocColumn,
  QueryFormColumn,
} from '@superset-ui/core';

export function firstColumn(
  value: QueryFormColumn | QueryFormColumn[] | undefined,
): QueryFormColumn | undefined {
  let col: unknown = value;
  while (Array.isArray(col)) {
    col = col[0];
  }
  if (col === null || col === undefined || col === '') {
    return undefined;
  }
  return col as QueryFormColumn;
}

export function toPhysicalOrAdhoc(
  value: unknown,
): QueryFormColumn | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (isAdhocColumn(value)) {
    return value;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.column_name === 'string' && obj.column_name) {
      return obj.column_name;
    }
    if (typeof obj.sqlExpression === 'string' && obj.sqlExpression) {
      return {
        expressionType: 'SQL',
        sqlExpression: obj.sqlExpression,
        label:
          typeof obj.label === 'string' && obj.label
            ? obj.label
            : obj.sqlExpression,
      };
    }
    if (typeof obj.name === 'string' && obj.name) {
      return obj.name;
    }
    if (typeof obj.value === 'string' && obj.value) {
      return obj.value;
    }
  }
  return undefined;
}

export function columnLookupKeys(value: unknown): string[] {
  const col = firstColumn(value as QueryFormColumn);
  if (!col) {
    return [];
  }
  if (typeof col === 'string') {
    return col ? [col] : [];
  }
  const obj = col as Record<string, unknown>;
  const keys = [
    obj.column_name,
    obj.label,
    obj.verbose_name,
    obj.name,
    obj.value,
    getColumnLabel(col),
  ];
  return [
    ...new Set(
      keys.filter((key): key is string => typeof key === 'string' && Boolean(key)),
    ),
  ];
}

export function uniqueColumns(cols: QueryFormColumn[]): QueryFormColumn[] {
  const seen = new Set<string>();
  const result: QueryFormColumn[] = [];
  cols.forEach(col => {
    const key = getColumnLabel(col);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(col);
  });
  return result;
}

export function extractTooltipColumns(
  tooltipContents?: unknown[],
): QueryFormColumn[] {
  if (!Array.isArray(tooltipContents) || !tooltipContents.length) {
    return [];
  }
  const result: QueryFormColumn[] = [];
  tooltipContents.forEach(item => {
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      if (obj.item_type === 'metric') {
        return;
      }
    }
    const col = toPhysicalOrAdhoc(item);
    if (col) {
      result.push(col);
    }
  });
  return uniqueColumns(result);
}

export function tooltipItemField(item: unknown): {
  label: string;
  field: string;
} | null {
  if (item === null || item === undefined || item === '') {
    return null;
  }
  if (typeof item === 'string') {
    return { label: item, field: item };
  }
  if (typeof item !== 'object') {
    return null;
  }
  const obj = item as Record<string, unknown>;
  if (obj.item_type === 'metric') {
    const field = String(obj.metric_name || obj.label || '');
    return field ? { label: String(obj.verbose_name || field), field } : null;
  }
  const col = toPhysicalOrAdhoc(item);
  if (!col) {
    return null;
  }
  const field = getColumnLabel(col);
  if (!field) {
    return null;
  }
  const label =
    (typeof obj.verbose_name === 'string' && obj.verbose_name) ||
    (typeof obj.label === 'string' && obj.label) ||
    field;
  return { label, field };
}

export function normalizeIso(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toUpperCase();
}
