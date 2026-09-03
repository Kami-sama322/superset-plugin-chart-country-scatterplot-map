import {
  DataRecordValue,
  ensureIsArray,
  FilterState,
  SetDataMaskHook,
} from '@superset-ui/core';
import { normalizeIso } from './columnUtils';
import type { RegionMapDataItem } from './types';

export type CrossFilterDataMask = Parameters<SetDataMaskHook>[0];

export type AppliedFilterClause = {
  col?: string | { label?: string; sqlExpression?: string; column_name?: string };
  op?: string;
  val?: unknown;
};

export type AppliedExtraFormData = {
  filters?: AppliedFilterClause[];
};

function asFilterScalar(value: DataRecordValue): string | number | boolean {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  return String(value);
}

function clauseColumnName(col: AppliedFilterClause['col']): string {
  if (!col) {
    return '';
  }
  if (typeof col === 'string') {
    return col;
  }
  return col.column_name || col.label || col.sqlExpression || '';
}

function columnsMatch(clauseCol: string, entityKeys: string[]): boolean {
  const needle = clauseCol.trim().toLowerCase();
  if (!needle) {
    return false;
  }
  return entityKeys.some(key => key.trim().toLowerCase() === needle);
}

export function resolveFilterValue(item: RegionMapDataItem): DataRecordValue {
  if (item.filterValue !== undefined && item.filterValue !== null) {
    return item.filterValue;
  }
  return item.country_id;
}

/**
 * Values from dashboard filters on the entity column
 * (formData.extra_form_data). Used when we can match explicitly;
 * any-column filters rely on post-query data rows instead.
 */
export function extractAppliedEntityValues(
  extraFormData: AppliedExtraFormData | null | undefined,
  entityColumnKeys: string[],
): DataRecordValue[] {
  if (!extraFormData?.filters?.length || !entityColumnKeys.length) {
    return [];
  }
  const values: DataRecordValue[] = [];
  const seen = new Set<string>();
  extraFormData.filters.forEach(clause => {
    const col = clauseColumnName(clause.col);
    if (!columnsMatch(col, entityColumnKeys)) {
      return;
    }
    const op = String(clause.op || '').toUpperCase();
    if (op === 'IS NULL') {
      return;
    }
    ensureIsArray(clause.val).forEach(raw => {
      if (raw === null || raw === undefined || raw === '') {
        return;
      }
      const value = raw as DataRecordValue;
      const key = String(value);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      values.push(value);
    });
  });
  return values;
}

export function hasAppliedFilters(
  extraFormData: AppliedExtraFormData | null | undefined,
): boolean {
  return Boolean(extraFormData?.filters?.length);
}

function flattenFilterValues(
  filterState: FilterState | undefined,
): DataRecordValue[] {
  const values = ensureIsArray(filterState?.value) as DataRecordValue[];
  if (!values.length) {
    return [];
  }
  // Table cross-filter stores value as nested arrays: [[v]]; flatten one level.
  if (Array.isArray(values[0])) {
    return (values as DataRecordValue[][]).flatMap(group =>
      ensureIsArray(group),
    );
  }
  return values;
}

function matchIsosFromValues(
  values: DataRecordValue[],
  dataByIso: Record<string, RegionMapDataItem>,
): string[] {
  const matched: string[] = [];
  const seen = new Set<string>();
  values.forEach(raw => {
    if (raw === null || raw === undefined || raw === '') {
      return;
    }
    const match = Object.values(dataByIso).find(
      item => String(resolveFilterValue(item)) === String(raw),
    );
    const iso = match
      ? normalizeIso(match.country_id)
      : normalizeIso(raw);
    if (!iso || seen.has(iso)) {
      return;
    }
    seen.add(iso);
    matched.push(iso);
  });
  return matched;
}

export function selectedIsoFromFilterState(
  filterState: FilterState | undefined,
  dataByIso: Record<string, RegionMapDataItem>,
): string | null {
  const matched = matchIsosFromValues(
    flattenFilterValues(filterState),
    dataByIso,
  );
  return matched[0] || null;
}

/**
 * Resolve which map regions to outline + zoom to.
 *
 * 1. Own filterState (click on map) → those entity values.
 * 2. Applied filters on the entity column → matching regions.
 * 3. Any other external filter on the same dataset (macroregion, category,
 *    …) → every region still present in query results after the filter.
 */
export function resolveSelectedIsos({
  filterState,
  dataByIso,
  appliedEntityValues,
  hasExternalFilters,
}: {
  filterState: FilterState | undefined;
  dataByIso: Record<string, RegionMapDataItem>;
  appliedEntityValues?: DataRecordValue[];
  hasExternalFilters?: boolean;
}): string[] {
  const fromOwn = matchIsosFromValues(
    flattenFilterValues(filterState),
    dataByIso,
  );
  if (fromOwn.length) {
    return fromOwn;
  }

  if (appliedEntityValues?.length) {
    const fromEntity = matchIsosFromValues(appliedEntityValues, dataByIso);
    if (fromEntity.length) {
      return fromEntity;
    }
  }

  if (hasExternalFilters) {
    return Object.keys(dataByIso);
  }

  return [];
}

/** @deprecated use resolveSelectedIsos */
export function resolveSelectedIso(args: {
  filterState: FilterState | undefined;
  dataByIso: Record<string, RegionMapDataItem>;
  appliedValues?: DataRecordValue[];
  hasExternalFilters?: boolean;
}): string | null {
  return (
    resolveSelectedIsos({
      filterState: args.filterState,
      dataByIso: args.dataByIso,
      appliedEntityValues: args.appliedValues,
      hasExternalFilters: args.hasExternalFilters,
    })[0] || null
  );
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
