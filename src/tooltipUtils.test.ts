import {
  buildDefaultTemplate,
  buildTooltipHtml,
  buildTooltipRows,
} from './tooltipUtils';

test('empty template still lists tooltip_contents via default handlebars', () => {
  const html = buildTooltipHtml(
    undefined,
    {
      country_id: 'RU-TOM',
      metric: 10,
      region_name: 'Tomsk',
      extra: { city_kladr: '70000001000' },
    },
    value => String(value),
    ['city_kladr'],
    'sum',
  );
  expect(html).toContain('Tomsk');
  expect(html).toContain('city_kladr');
  expect(html).toContain('70000001000');
  expect(html).toContain('sum');
});

test('custom template is used instead of contents dump', () => {
  const html = buildTooltipHtml(
    '<b>{{region_name}}</b> {{city_kladr}}',
    {
      country_id: 'RU-TOM',
      metric: 10,
      region_name: 'Tomsk',
      extra: { city_kladr: '70000001000' },
    },
    value => String(value),
    ['city_kladr'],
    'sum',
  );
  expect(html).toContain('Tomsk');
  expect(html).toContain('70000001000');
  expect(html).not.toContain('sum:');
});

test('buildDefaultTemplate includes content fields', () => {
  expect(buildDefaultTemplate(['city_kladr'], 'sum')).toContain(
    '{{ city_kladr }}',
  );
});

test('empty handlebars output falls back to default html', () => {
  const html = buildTooltipHtml(
    '{{#each missing}}{{/each}}',
    {
      country_id: 'RU-TOM',
      metric: 10,
      region_name: 'Tomsk',
    },
    value => String(value),
    [],
    'sum',
  );
  expect(html).toContain('Tomsk');
  expect(html).toContain('10');
});

test('buildTooltipRows lists name, metric and extra fields', () => {
  const rows = buildTooltipRows(
    {
      country_id: 'RU-TOM',
      metric: 10,
      region_name: 'Tomsk',
      extra: { city_kladr: '70000001000' },
    },
    value => String(value),
    ['city_kladr'],
    'sum',
  );
  expect(rows).toEqual([
    { label: '', value: 'Tomsk' },
    { label: 'sum', value: '10' },
    { label: 'city_kladr', value: '70000001000' },
  ]);
});

test('stripped event-handler markup is not restored into tooltip html', () => {
  const html = buildTooltipHtml(
    '<img src=x onerror="alert(1)">{{region_name}}',
    {
      country_id: 'RU-TOM',
      metric: 1,
      region_name: 'Tomsk',
    },
    value => String(value),
    [],
    'sum',
  );
  expect(html).not.toContain('onerror');
  expect(html).not.toContain('alert(1)');
});
