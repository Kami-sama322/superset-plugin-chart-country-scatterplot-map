import {
  addFieldsToTemplate,
  contentFieldNames,
  parseTemplateFields,
  removeFieldsFromTemplate,
  syncContentsFromTemplate,
  syncTemplateFromContents,
} from './tooltipSync';

test('contentFieldNames reads strings and custom SQL labels', () => {
  expect(
    contentFieldNames([
      'city_kladr',
      {
        expressionType: 'SQL',
        sqlExpression: '1',
        label: 'iso_suffix',
      },
    ]),
  ).toEqual(['city_kladr', 'iso_suffix']);
});

test('parseTemplateFields skips builtins and helpers', () => {
  expect(
    parseTemplateFields(
      '{{region_name}} {{metric_formatted}} {{ city_kladr }} {{ limit extra 10 }}',
    ),
  ).toEqual(['city_kladr', 'extra']);
});

test('removeFieldsFromTemplate drops handlebars variables', () => {
  expect(
    removeFieldsFromTemplate('{{ a }} {{ b }} keep', ['a']),
  ).toBe('{{ b }} keep');
});

test('syncTemplateFromContents adds and removes fields', () => {
  expect(syncTemplateFromContents('{{ a }}', ['a'], ['a', 'b'])).toBe(
    '{{ a }} {{ b }}',
  );
  expect(syncTemplateFromContents('{{ a }} {{ b }}', ['a', 'b'], ['a'])).toBe(
    '{{ a }}',
  );
});

test('syncContentsFromTemplate removes fields missing in template', () => {
  expect(
    syncContentsFromTemplate(['a', 'b'], '{{ a }} {{region_name}}', ['a', 'b']),
  ).toEqual(['a']);
});

test('syncTemplateFromContents seeds a template when empty', () => {
  const seeded = syncTemplateFromContents('', [], ['city_kladr']);
  expect(seeded).toContain('{{region_name}}');
  expect(seeded).toContain('{{ city_kladr }}');
});
