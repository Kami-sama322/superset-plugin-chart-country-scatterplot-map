import {
  buildRegionCrossFilterDataMask,
  extractAppliedEntityValues,
  resolveFilterValue,
  resolveSelectedIsos,
  selectedIsoFromFilterState,
} from './crossFilter';
import type { RegionMapDataItem } from './types';

test('resolveFilterValue prefers raw filterValue', () => {
  expect(
    resolveFilterValue({
      country_id: 'RU-TOM',
      filterValue: 'ru-tom',
      metric: 1,
    }),
  ).toBe('ru-tom');
  expect(
    resolveFilterValue({
      country_id: 'RU-TOM',
      metric: 1,
    }),
  ).toBe('RU-TOM');
});

test('selectedIsoFromFilterState matches by filterValue then ISO', () => {
  const dataByIso: Record<string, RegionMapDataItem> = {
    'RU-TOM': {
      country_id: 'RU-TOM',
      filterValue: 'tomsk',
      metric: 10,
    },
  };
  expect(
    selectedIsoFromFilterState({ value: ['tomsk'] }, dataByIso),
  ).toBe('RU-TOM');
  expect(
    selectedIsoFromFilterState({ value: ['RU-TOM'] }, dataByIso),
  ).toBe('RU-TOM');
  expect(selectedIsoFromFilterState({ value: null }, dataByIso)).toBeNull();
});

test('selectedIsoFromFilterState flattens nested table value arrays', () => {
  const dataByIso: Record<string, RegionMapDataItem> = {
    'RU-TOM': {
      country_id: 'RU-TOM',
      filterValue: 'tomsk',
      metric: 10,
    },
  };
  expect(
    selectedIsoFromFilterState({ value: [['tomsk']] }, dataByIso),
  ).toBe('RU-TOM');
});

test('extractAppliedEntityValues reads matching extra_form_data filters', () => {
  expect(
    extractAppliedEntityValues(
      {
        filters: [
          { col: 'region_code', op: 'IN', val: ['tomsk'] },
          { col: 'year', op: 'IN', val: [2024] },
        ],
      },
      ['region_code', 'Region Code'],
    ),
  ).toEqual(['tomsk']);
  expect(
    extractAppliedEntityValues(
      { filters: [{ col: 'year', op: 'IN', val: [2024] }] },
      ['region_code'],
    ),
  ).toEqual([]);
});

test('resolveSelectedIsos prefers own filterState then entity filters', () => {
  const dataByIso: Record<string, RegionMapDataItem> = {
    'RU-TOM': {
      country_id: 'RU-TOM',
      filterValue: 'tomsk',
      metric: 10,
    },
    'RU-MOW': {
      country_id: 'RU-MOW',
      filterValue: 'moscow',
      metric: 20,
    },
  };

  expect(
    resolveSelectedIsos({
      filterState: { value: ['moscow'] },
      dataByIso,
      appliedEntityValues: ['tomsk'],
    }),
  ).toEqual(['RU-MOW']);

  expect(
    resolveSelectedIsos({
      filterState: {},
      dataByIso,
      appliedEntityValues: ['tomsk'],
    }),
  ).toEqual(['RU-TOM']);
});

test('resolveSelectedIsos highlights all remaining regions for any-column filter', () => {
  // e.g. table clicked macroregion → query returns only regions in that macro
  const dataByIso: Record<string, RegionMapDataItem> = {
    'RU-TOM': {
      country_id: 'RU-TOM',
      filterValue: 'tomsk',
      metric: 10,
    },
    'RU-NVS': {
      country_id: 'RU-NVS',
      filterValue: 'novosibirsk',
      metric: 15,
    },
  };
  expect(
    resolveSelectedIsos({
      filterState: {},
      dataByIso,
      appliedEntityValues: [],
      hasExternalFilters: true,
    }).sort(),
  ).toEqual(['RU-NVS', 'RU-TOM']);
});

test('resolveSelectedIsos does not highlight without external filters', () => {
  const dataByIso: Record<string, RegionMapDataItem> = {
    'RU-TOM': {
      country_id: 'RU-TOM',
      filterValue: 'tomsk',
      metric: 10,
    },
  };
  expect(
    resolveSelectedIsos({
      filterState: {},
      dataByIso,
      appliedEntityValues: [],
      hasExternalFilters: false,
    }),
  ).toEqual([]);
});

test('buildRegionCrossFilterDataMask toggles selection', () => {
  const selected = buildRegionCrossFilterDataMask({
    entityColumn: 'region_code',
    filterValue: 'tomsk',
    filterState: {},
  });
  expect(selected).toEqual({
    extraFormData: {
      filters: [
        {
          col: 'region_code',
          op: 'IN',
          val: ['tomsk'],
        },
      ],
    },
    filterState: {
      value: ['tomsk'],
      selectedValues: ['tomsk'],
      label: 'tomsk',
    },
  });

  const cleared = buildRegionCrossFilterDataMask({
    entityColumn: 'region_code',
    filterValue: 'tomsk',
    filterState: { value: ['tomsk'] },
  });
  expect(cleared.extraFormData).toEqual({ filters: [] });
  expect(cleared.filterState?.value).toBeNull();
});
