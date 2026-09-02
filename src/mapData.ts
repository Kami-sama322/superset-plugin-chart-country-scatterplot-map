import { extent as d3Extent } from 'd3-array';
import type { FeatureCollection } from 'geojson';
import { getSequentialSchemeRegistry } from '@superset-ui/core';
import { normalizeIso } from './columnUtils';
import {
  cssColorToRgba,
  getFeatureCenter,
  getRegionName,
} from './geoColorUtils';
import {
  resolveBubblePosition,
  uniqueByIso,
} from './bubblePosition';
import { scaleRadius } from './tooltipUtils';
import type {
  BubbleColorMode,
  BubblePoint,
  RegionMapDataItem,
} from './types';

export type ColorScale = (value: number) => string | undefined;

export type BubblePointOptions = {
  useLatLonBubbles: boolean;
  minMetric: number;
  maxMetric: number;
  minRadius: number;
  maxRadius: number;
  multiplier: number;
  bubbleColorMode: BubbleColorMode;
  bubbleColor: string;
  colorScale: ColorScale;
};

export function metricDomain(
  items: { metric: number }[],
  fallback: [number, number] = [0, 1],
): [number, number] {
  const extent = d3Extent(items, d => d.metric) as
    | [number, number]
    | [undefined, undefined];
  return [extent[0] ?? fallback[0], extent[1] ?? fallback[1]];
}

export function createColorScale(
  schemeKey: string | undefined,
  domain: [number, number],
  fallback: ColorScale = () => '#cccccc',
): ColorScale {
  const colorSchemeObj = schemeKey
    ? getSequentialSchemeRegistry().get(schemeKey)
    : undefined;
  return colorSchemeObj
    ? colorSchemeObj.createLinearScale(domain)
    : fallback;
}

export function indexByIso(
  data: RegionMapDataItem[],
): Record<string, RegionMapDataItem> {
  const map: Record<string, RegionMapDataItem> = {};
  data.forEach(item => {
    const iso = normalizeIso(item.country_id);
    if (iso) {
      map[iso] = item;
    }
  });
  return map;
}

export function isoCenters(
  geoJson: FeatureCollection,
): Record<string, [number, number]> {
  const centers: Record<string, [number, number]> = {};
  geoJson.features.forEach(feature => {
    const iso = normalizeIso(feature.properties?.ISO);
    const center = getFeatureCenter(feature);
    if (iso && center) {
      centers[iso] = center;
    }
  });
  return centers;
}

export function enrichGeoJson(
  geoJson: FeatureCollection,
  dataByIso: Record<string, RegionMapDataItem>,
): FeatureCollection {
  return {
    ...geoJson,
    features: geoJson.features.map(feature => {
      const iso = normalizeIso(feature.properties?.ISO);
      const row = dataByIso[iso];
      return {
        ...feature,
        properties: {
          ...feature.properties,
          country_id: iso,
          metric: row?.metric,
          region_name: getRegionName(feature),
          extra: row?.extra,
        },
      };
    }),
  };
}

export function featureToRegionItem(
  properties: Record<string, unknown> | undefined,
): RegionMapDataItem {
  const propsObj = properties || {};
  return {
    country_id: String(propsObj.country_id || propsObj.ISO || ''),
    metric: Number(propsObj.metric ?? 0),
    region_name: String(propsObj.region_name || propsObj.country_id || ''),
    extra: (propsObj.extra as Record<string, unknown>) || {},
  };
}

export function buildBubblePoints(
  geoJson: FeatureCollection,
  bubbleData: RegionMapDataItem[],
  options: BubblePointOptions,
): BubblePoint[] {
  const centers = isoCenters(geoJson);
  const exclusiveLatLon = options.useLatLonBubbles;
  const rows = bubbleData ?? [];
  const bubbleSource = exclusiveLatLon ? rows : uniqueByIso(rows);

  return bubbleSource
    .map(item => {
      const position = resolveBubblePosition(
        item,
        centers,
        exclusiveLatLon,
      );
      if (!position) {
        return null;
      }
      const radius = scaleRadius(
        item.metric,
        options.minMetric,
        options.maxMetric,
        options.minRadius,
        options.maxRadius,
        options.multiplier,
      );
      const colorCss =
        options.bubbleColorMode === 'linear'
          ? options.colorScale(item.metric) ?? options.bubbleColor
          : options.bubbleColor;
      return {
        ...item,
        position,
        radius,
        fillColor: cssColorToRgba(colorCss, 200),
        region_name: item.region_name || item.country_id,
      };
    })
    .filter((item): item is BubblePoint => item !== null);
}
