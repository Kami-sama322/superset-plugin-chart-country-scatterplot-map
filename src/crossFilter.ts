import {
  DataRecordValue,
  ensureIsArray,
  FilterState,
  SetDataMaskHook,
} from '@superset-ui/core';
import { normalizeIso } from './columnUtils';
import type { RegionMapDataItem } from './types';

export type CrossFilterDataMask = Parameters<SetDataMaskHook>[0];

function asFilterScalar(value: DataRecordValue): string | number | boolean {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  return String(value);
}

export function resolveFilterValue(item: RegionMapDataItem): DataRecordValue {
  if (item.filterValue !== undefined && item.filterValue !== null) {
    return item.filterValue;
  }
  return item.country_id;
}

export function selectedIsoFromFilterState(
  filterState: FilterState | undefined,
  dataByIso: Record<string, RegionMapDataItem>,
): string | null {
  const values = ensureIsArray(filterState?.value) as DataRecordValue[];
  if (!values.length) {
    return null;
  }
  const selected = values[0];
  const match = Object.values(dataByIso).find(
    item => String(resolveFilterValue(item)) === String(selected),
  );
  if (match) {
    return normalizeIso(match.country_id);
  }
  const normalized = normalizeIso(selected);
  return normalized || null;
}

export function buildRegionCrossFilterDataMask({
  entityColumn,
  filterValue,
  filterState,
}: {
  entityColumn: string;
  filterValue: DataRecordValue;
  filterState?: FilterState;
}): CrossFilterDataMask {
  const current = ensureIsArray(filterState?.value) as DataRecordValue[];
  const isSelected = current.some(v => String(v) === String(filterValue));
  const nextValues = isSelected ? [] : [filterValue];
  const filterVals = nextValues.map(asFilterScalar);

  return {
    extraFormData: {
      filters:
        filterVals.length === 0
          ? []
          : [
              {
                col: entityColumn,
                op: 'IN',
                val: filterVals,
              },
            ],
    },
    filterState: {
      value: nextValues.length ? nextValues : null,
      selectedValues: nextValues.length
        ? nextValues.map(v => String(v))
        : null,
      label: nextValues.length ? nextValues.map(String).join(', ') : undefined,
    },
  };
}
