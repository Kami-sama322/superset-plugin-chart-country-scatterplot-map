import {
  buildRegionCrossFilterDataMask,
  resolveFilterValue,
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
