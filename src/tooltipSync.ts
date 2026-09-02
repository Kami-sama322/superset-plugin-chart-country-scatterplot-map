import { tooltipItemField } from './columnUtils';

export const TOOLTIP_BUILTIN_FIELDS = new Set([
  'country_id',
  'metric',
  'metric_formatted',
  'longitude',
  'latitude',
  'region_name',
]);

const HANDLEBARS_HELPERS = new Set([
  'limit',
  'if',
  'each',
  'else',
  'lookup',
  'unless',
  'with',
  'this',
  'dateFormat',
  'formatNumber',
  'stringify',
  'ifExists',
  'default',
  'truncate',
  'formatCoordinate',
  'first',
  'getField',
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function contentFieldNames(contents: unknown[] | undefined): string[] {
  const names: string[] = [];
  (contents || []).forEach(item => {
    const field = tooltipItemField(item);
    if (field && !names.includes(field.field)) {
      names.push(field.field);
    }
  });
  return names;
}

export function parseTemplateFields(template: string | undefined): string[] {
  if (!template) {
    return [];
  }
  const names: string[] = [];
  const block = /\{\{([^}]+)\}\}/g;
  let match = block.exec(template);
  while (match) {
    const tokens = match[1]
      .replace(/[#/]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(token => /^[A-Za-z_][\w]*$/.test(token));
    tokens.forEach(token => {
      if (
        HANDLEBARS_HELPERS.has(token) ||
        TOOLTIP_BUILTIN_FIELDS.has(token) ||
        names.includes(token)
      ) {
        return;
      }
      names.push(token);
    });
    match = block.exec(template);
  }
  return names;
}

export function removeFieldsFromTemplate(
  template: string,
  fields: string[],
): string {
  if (!fields.length) {
    return template;
  }
  let next = template;
  fields.forEach(field => {
    const name = escapeRegExp(field);
    next = next.replace(
      new RegExp(`\\{\\{\\s*limit\\s+${name}\\s+\\d+\\s*\\}\\}`, 'g'),
      '',
    );
    next = next.replace(new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g'), '');
  });
  return next.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function addFieldsToTemplate(
  template: string,
  fields: string[],
): string {
  if (!fields.length) {
    return template;
  }
  let next = template.trim();
  fields.forEach(field => {
    const already =
      next.includes(`{{ ${field} }}`) ||
      next.includes(`{{${field}}}`) ||
      next.includes(`{{ limit ${field}`);
    if (already) {
      return;
    }
    const snippet = `{{ ${field} }}`;
    next = next ? `${next} ${snippet}` : snippet;
  });
  return next;
}

export function syncTemplateFromContents(
  template: string,
  previousContents: unknown[] | undefined,
  nextContents: unknown[] | undefined,
): string {
  const prev = contentFieldNames(previousContents);
  const next = contentFieldNames(nextContents);
  if (!template.trim() && next.length && !prev.length) {
    return [
      '<div><strong>{{region_name}}</strong></div>',
      '<div>{{metric_formatted}}</div>',
      ...next.map(field => `{{ ${field} }}`),
    ].join(' ');
  }
  const removed = prev.filter(field => !next.includes(field));
  const added = next.filter(field => !prev.includes(field));
  return addFieldsToTemplate(
    removeFieldsFromTemplate(template, removed),
    added,
  );
}

export function syncContentsFromTemplate(
  contents: unknown[] | undefined,
  template: string,
  knownColumnNames: string[],
): unknown[] {
  const fields = new Set(parseTemplateFields(template));
  const known = new Set(knownColumnNames);
  const kept: unknown[] = [];
  const existing = new Set<string>();
  (contents || []).forEach(item => {
    const field = tooltipItemField(item);
    if (!field) {
      kept.push(item);
      return;
    }
    if (fields.has(field.field)) {
      kept.push(item);
      existing.add(field.field);
    }
  });
  fields.forEach(field => {
    if (!existing.has(field) && known.has(field)) {
      kept.push(field);
      existing.add(field);
    }
  });
  return kept;
}

export function contentsEqual(a: unknown[] | undefined, b: unknown[] | undefined): boolean {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}
