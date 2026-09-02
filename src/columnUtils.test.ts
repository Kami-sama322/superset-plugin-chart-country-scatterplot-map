import {
  extractTooltipColumns,
  firstColumn,
  normalizeIso,
  toPhysicalOrAdhoc,
  tooltipItemField,
  uniqueColumns,
  columnLookupKeys,
} from './columnUtils';

test('toPhysicalOrAdhoc keeps strings and column_name', () => {
  expect(toPhysicalOrAdhoc('city_kladr')).toBe('city_kladr');
  expect(toPhysicalOrAdhoc({ column_name: 'city_kladr' })).toBe('city_kladr');
});

test('extractTooltipColumns ignores metrics and dedupes', () => {
  expect(
    extractTooltipColumns([
      'city_kladr',
      { item_type: 'column', column_name: 'region_iso' },
      { item_type: 'metric', metric_name: 'count' },
      { column_name: 'city_kladr' },
    ]),
  ).toEqual(['city_kladr', 'region_iso']);
});

test('uniqueColumns and firstColumn normalize control values', () => {
  expect(firstColumn(['iso_code'])).toBe('iso_code');
  expect(firstColumn([[{ column_name: 'lon' }]])).toEqual({
    column_name: 'lon',
  });
  expect(uniqueColumns(['a', 'a', 'b'])).toEqual(['a', 'b']);
});

test('toPhysicalOrAdhoc reads value aliases', () => {
  expect(toPhysicalOrAdhoc({ value: 'lon' })).toBe('lon');
  expect(toPhysicalOrAdhoc(37.62)).toBeUndefined();
});

test('columnLookupKeys reads column_name and labels', () => {
  expect(
    columnLookupKeys({ column_name: 'city_lon', verbose_name: 'City lon' }),
  ).toEqual(['city_lon', 'City lon']);
});

test('normalizeIso uppercases ISO codes', () => {
  expect(normalizeIso(' ru-tom ')).toBe('RU-TOM');
});

test('tooltipItemField reads strings, column objects and custom SQL', () => {
  expect(tooltipItemField('city_kladr')).toEqual({
    label: 'city_kladr',
    field: 'city_kladr',
  });
  expect(
    tooltipItemField({
      expressionType: 'SQL',
      sqlExpression: "split_part(iso, '-', 2)",
      label: 'iso_suffix',
    }),
  ).toEqual({ label: 'iso_suffix', field: 'iso_suffix' });
});
