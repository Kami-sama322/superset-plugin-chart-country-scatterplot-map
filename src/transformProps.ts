import {
  ChartProps,
  DataRecord,
  DataRecordValue,
  getColumnLabel,
  getMetricLabel,
} from '@superset-ui/core';
import { DEFAULT_MAP_STYLE, DEFAULT_VIEWPORT, getMapboxApiKey } from './mapConfig';
import { colorToCss } from './geoColorUtils';
import {
  firstColumn,
  normalizeIso,
  toPhysicalOrAdhoc,
  columnLookupKeys,
} from './columnUtils';
import {
  datasetHasCoordinates,
  selectBubbleItems,
  uniqueByIso,
} from './bubblePosition';
import {
  BubbleColorMode,
  CountryScatterplotMapQueryFormData,
  CountryScatterplotMapTransformedProps,
  DEFAULT_FORM_DATA,
  RegionMapDataItem,
} from './types';

const LON_ALIASES = ['longitude', 'lon', 'lng'];
const LAT_ALIASES = ['latitude', 'lat'];
const LON_KEY_RE = /(^|_)(lon|lng|longitude)$/i;
const LAT_KEY_RE = /(^|_)(lat|latitude)$/i;
const NOOP = () => undefined;

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function cellByLabel(row: DataRecord, label: string): unknown {
  if (!label) {
    return undefined;
  }
  if (label in row) {
    return row[label];
  }
  const lower = label.toLowerCase();
  const match = Object.keys(row).find(k => k.toLowerCase() === lower);
  return match ? row[match] : undefined;
}

function readCoord(
  row: DataRecord,
  labels: string[],
  aliases: string[],
  pattern: RegExp,
): number | undefined {
  const keys = [...labels, ...aliases];
  for (const key of keys) {
    const parsed = toNumber(cellByLabel(row, key));
    if (parsed !== undefined) {
      return parsed;
    }
  }
  const match = Object.keys(row).find(key => pattern.test(key));
  return match ? toNumber(row[match]) : undefined;
}

function pickFormColumn(
  fd: CountryScatterplotMapQueryFormData,
  raw: unknown,
  keys: Array<'longitude' | 'latitude' | 'lon_column' | 'lat_column'>,
) {
  for (const key of keys) {
    const fromFd = toPhysicalOrAdhoc(
      firstColumn(
        (fd as Record<string, unknown>)[key] as
          | CountryScatterplotMapQueryFormData['longitude'],
      ),
    );
    if (fromFd) {
      return fromFd;
    }
    const rawObj = raw as Record<string, unknown> | undefined;
    const fromRaw = toPhysicalOrAdhoc(
      firstColumn(
        rawObj?.[key] as CountryScatterplotMapQueryFormData['longitude'],
      ),
    );
    if (fromRaw) {
      return fromRaw;
    }
  }
  return undefined;
}

function pick<T>(
  fd: CountryScatterplotMapQueryFormData,
  camel: keyof CountryScatterplotMapQueryFormData,
  snake: keyof CountryScatterplotMapQueryFormData,
): T | undefined {
  const camelVal = fd[camel];
  if (camelVal !== undefined && camelVal !== null && camelVal !== '') {
    return camelVal as T;
  }
  const snakeVal = fd[snake];
  if (snakeVal !== undefined && snakeVal !== null && snakeVal !== '') {
    return snakeVal as T;
  }
  return undefined;
}

function toFilterValue(value: unknown): DataRecordValue | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  return String(value);
}

export default function transformProps(
  chartProps: ChartProps,
): CountryScatterplotMapTransformedProps {
  const {
    width,
    height,
    formData,
    queriesData,
    hooks,
    rawFormData,
    filterState,
    emitCrossFilters,
  } = chartProps;
  const fd = {
    ...DEFAULT_FORM_DATA,
    ...(rawFormData as CountryScatterplotMapQueryFormData),
    ...(formData as CountryScatterplotMapQueryFormData),
  };

  const entityCol = toPhysicalOrAdhoc(firstColumn(fd.entity));
  const lonCol = pickFormColumn(fd, rawFormData, [
    'lon_column',
    'longitude',
  ]);
  const latCol = pickFormColumn(fd, rawFormData, [
    'lat_column',
    'latitude',
  ]);
  const metricLabel = fd.metric ? getMetricLabel(fd.metric) : 'metric';
  const entityLabel = entityCol ? getColumnLabel(entityCol) : 'country_id';
  const lonLabel = lonCol ? getColumnLabel(lonCol) : '';
  const latLabel = latCol ? getColumnLabel(latCol) : '';
  const lonLookups = columnLookupKeys(lonCol);
  const latLookups = columnLookupKeys(latCol);

  const rows: DataRecord[] = queriesData?.[0]?.data || [];
  const reserved = new Set(
    [entityLabel, lonLabel, latLabel, metricLabel, 'country_id', 'metric'].filter(
      Boolean,
    ),
  );

  const data: RegionMapDataItem[] = [];
  rows.forEach(row => {
    const entityRaw = cellByLabel(row, entityLabel) ?? row.country_id;
    const countryId = normalizeIso(entityRaw);
    const filterValue = toFilterValue(entityRaw);
    const metric = toNumber(cellByLabel(row, metricLabel) ?? row.metric);
    const longitude = readCoord(row, lonLookups, LON_ALIASES, LON_KEY_RE);
    const latitude = readCoord(row, latLookups, LAT_ALIASES, LAT_KEY_RE);

    if (!countryId || metric === undefined) {
      return;
    }

    const extra: Record<string, unknown> = {};
    Object.keys(row).forEach(key => {
      if (!reserved.has(key)) {
        extra[key] = row[key];
      }
    });

    data.push({
      country_id: countryId,
      filterValue: filterValue ?? countryId,
      metric,
      longitude,
      latitude,
      extra,
    });
  });

  const useLatLonBubbles =
    Boolean(lonLabel && latLabel) || datasetHasCoordinates(data);
  const regionData = uniqueByIso(data);
  const bubbleData = selectBubbleItems(data, useLatLonBubbles);

  const countryRaw = pick<string>(fd, 'selectCountry', 'select_country');
  const country = countryRaw ? String(countryRaw).toLowerCase() : null;
  const minRadius = Number(
    pick(fd, 'minRadius', 'min_radius') ?? DEFAULT_FORM_DATA.min_radius,
  );
  const maxRadius = Number(
    pick(fd, 'maxRadius', 'max_radius') ?? DEFAULT_FORM_DATA.max_radius,
  );

  return {
    width,
    height,
    country,
    data: regionData,
    bubbleData,
    linearColorScheme: pick(fd, 'linearColorScheme', 'linear_color_scheme'),
    numberFormat:
      pick(fd, 'numberFormat', 'number_format') ??
      DEFAULT_FORM_DATA.number_format,
    minRadius,
    maxRadius,
    multiplier: Number(fd.multiplier ?? DEFAULT_FORM_DATA.multiplier),
    bubbleColorMode:
      pick<BubbleColorMode>(fd, 'bubbleColorMode', 'bubble_color_mode') ??
      'fixed',
    bubbleColor: colorToCss(
      pick(fd, 'bubbleColor', 'bubble_color') ?? DEFAULT_FORM_DATA.bubble_color,
    ),
    bubbleLinearColorScheme:
      pick<string>(fd, 'bubbleLinearColorScheme', 'bubble_linear_color_scheme') ||
      pick<string>(fd, 'linearColorScheme', 'linear_color_scheme'),
    tooltipTemplate:
      (typeof fd.tooltipTemplate === 'string' && fd.tooltipTemplate) ||
      (typeof fd.tooltip_template === 'string' && fd.tooltip_template) ||
      '',
    tooltipContents:
      pick<unknown[]>(fd, 'tooltipContents', 'tooltip_contents') ?? [],
    metricLabel,
    mapboxStyle:
      pick<string>(fd, 'mapboxStyle', 'mapbox_style') ?? DEFAULT_MAP_STYLE,
    mapboxApiKey: getMapboxApiKey(),
    autozoom: fd.autozoom !== false,
    viewport: {
      ...DEFAULT_VIEWPORT,
      ...(fd.viewport || {}),
      width,
      height,
    },
    polygonOpacity: Number(
      pick(fd, 'polygonOpacity', 'polygon_opacity') ??
        DEFAULT_FORM_DATA.polygon_opacity,
    ),
    showWorldMap: pick(fd, 'showWorldMap', 'show_world_map') !== false,
    useLatLonBubbles,
    setControlValue: hooks?.setControlValue,
    entityColumn: entityLabel,
    filterState: filterState || {},
    setDataMask: hooks?.setDataMask || NOOP,
    emitCrossFilters,
  };
}
