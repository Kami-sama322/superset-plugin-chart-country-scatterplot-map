import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { FeatureCollection } from 'geojson';
import { createBasemapLayer, createCountryMaskLayer } from './basemapLayer';
import { cssColorToRgba } from './geoColorUtils';
import { deckStyleToRasterUrl } from './mapConfig';
import { featureToRegionItem } from './mapData';
import type { ColorScale } from './mapData';
import { normalizeIso } from './columnUtils';
import type { BubblePoint, RegionMapDataItem } from './types';

const DEFAULT_LINE: [number, number, number, number] = [255, 255, 255, 240];
const SELECTED_LINE: [number, number, number, number] = [20, 20, 20, 255];
const DIM_FILL_FACTOR = 0.35;

type MapLayerOptions = {
  enrichedGeoJson: FeatureCollection;
  geoJson: FeatureCollection;
  dataByIso: Record<string, RegionMapDataItem>;
  linearColorScale: ColorScale;
  linearColorScheme?: string;
  bubblePoints: BubblePoint[];
  minRadius: number;
  maxRadius: number;
  deckMapStyle: string;
  polygonAlpha: number;
  showWorldMap: boolean;
  selectedIsos: ReadonlySet<string>;
  emitCrossFilters?: boolean;
  onRegionSelect: (item: RegionMapDataItem) => void;
  showTooltip: (
    source: string,
    point: RegionMapDataItem,
    x: number,
    y: number,
  ) => void;
  hideTooltip: (source: string) => void;
};

function dimAlpha(alpha: number, selected: boolean, hasSelection: boolean) {
  if (!hasSelection || selected) {
    return alpha;
  }
  return Math.max(40, Math.round(alpha * DIM_FILL_FACTOR));
}

export function createMapLayers({
  enrichedGeoJson,
  geoJson,
  dataByIso,
  linearColorScale,
  linearColorScheme,
  bubblePoints,
  minRadius,
  maxRadius,
  deckMapStyle,
  polygonAlpha,
  showWorldMap,
  selectedIsos,
  emitCrossFilters,
  onRegionSelect,
  showTooltip,
  hideTooltip,
}: MapLayerOptions) {
  const rasterUrl = deckStyleToRasterUrl(deckMapStyle);
  const clipBasemap = !showWorldMap;
  const maskLayer = clipBasemap ? createCountryMaskLayer(geoJson) : null;
  const basemapLayer = rasterUrl
    ? createBasemapLayer(rasterUrl, clipBasemap)
    : null;
  const hasSelection = selectedIsos.size > 0;
  const selectionKey = [...selectedIsos].sort().join(',');
  const pickable = true;

  const isSelected = (iso: string) => Boolean(iso && selectedIsos.has(iso));

  const regionLayer = new GeoJsonLayer({
    id: 'country-scatterplot-regions',
    data: enrichedGeoJson,
    filled: true,
    stroked: true,
    pickable,
    autoHighlight: true,
    highlightColor: [26, 26, 26, 120],
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 2,
    getLineColor: (feature: { properties?: Record<string, unknown> }) => {
      const iso = normalizeIso(feature.properties?.ISO);
      return isSelected(iso) ? SELECTED_LINE : DEFAULT_LINE;
    },
    getFillColor: (feature: { properties?: Record<string, unknown> }) => {
      const iso = normalizeIso(feature.properties?.ISO);
      const row = dataByIso[iso];
      const selected = isSelected(iso);
      const alpha = dimAlpha(polygonAlpha, selected, hasSelection);
      if (!row) {
        return [200, 200, 200, alpha];
      }
      const css = linearColorScale(row.metric) ?? '#cccccc';
      return cssColorToRgba(css, alpha);
    },
    getLineWidth: (feature: { properties?: Record<string, unknown> }) => {
      const iso = normalizeIso(feature.properties?.ISO);
      return isSelected(iso) ? 4 : 1.5;
    },
    updateTriggers: {
      getFillColor: [polygonAlpha, linearColorScheme, selectionKey],
      getLineColor: [selectionKey],
      getLineWidth: [selectionKey],
    },
    onHover: ({ object, x, y }) => {
      if (!object) {
        hideTooltip('regions');
        return false;
      }
      showTooltip('regions', featureToRegionItem(object.properties), x, y);
      return true;
    },
    onClick: ({ object }) => {
      if (!emitCrossFilters || !object) {
        return false;
      }
      onRegionSelect(featureToRegionItem(object.properties));
      return true;
    },
  });

  const bubbleLayer = new ScatterplotLayer<BubblePoint>({
    id: 'country-scatterplot-bubbles',
    data: bubblePoints,
    pickable,
    radiusUnits: 'pixels',
    getPosition: d => d.position,
    getRadius: d => d.radius,
    radiusMinPixels: minRadius,
    radiusMaxPixels: maxRadius,
    getFillColor: d => {
      const iso = normalizeIso(d.country_id);
      const selected = isSelected(iso);
      const [r, g, b, a] = d.fillColor;
      return [r, g, b, dimAlpha(a, selected, hasSelection)];
    },
    stroked: true,
    lineWidthUnits: 'pixels',
    getLineColor: d => {
      const iso = normalizeIso(d.country_id);
      return isSelected(iso) ? SELECTED_LINE : [255, 255, 255, 220];
    },
    getLineWidth: d => {
      const iso = normalizeIso(d.country_id);
      return isSelected(iso) ? 3 : 1;
    },
    lineWidthMinPixels: 1,
    updateTriggers: {
      getFillColor: [selectionKey],
      getLineColor: [selectionKey],
      getLineWidth: [selectionKey],
    },
    onHover: ({ object, x, y }) => {
      if (!object) {
        hideTooltip('bubbles');
        return false;
      }
      showTooltip('bubbles', object, x, y);
      return true;
    },
    onClick: ({ object }) => {
      if (!emitCrossFilters || !object) {
        return false;
      }
      onRegionSelect(object);
      return true;
    },
  });

  return [maskLayer, basemapLayer, regionLayer, bubbleLayer].filter(
    (layer): layer is NonNullable<typeof layer> => layer !== null,
  );
}
