import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { FeatureCollection } from 'geojson';
import { createBasemapLayer, createCountryMaskLayer } from './basemapLayer';
import { cssColorToRgba } from './geoColorUtils';
import { deckStyleToRasterUrl } from './mapConfig';
import { featureToRegionItem } from './mapData';
import type { ColorScale } from './mapData';
import { normalizeIso } from './columnUtils';
import type { BubblePoint, RegionMapDataItem } from './types';

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
  showTooltip: (
    source: string,
    point: RegionMapDataItem,
    x: number,
    y: number,
  ) => void;
  hideTooltip: (source: string) => void;
};

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
  showTooltip,
  hideTooltip,
}: MapLayerOptions) {
  const rasterUrl = deckStyleToRasterUrl(deckMapStyle);
  const clipBasemap = !showWorldMap;
  const maskLayer =
    clipBasemap ? createCountryMaskLayer(geoJson) : null;
  const basemapLayer = rasterUrl
    ? createBasemapLayer(rasterUrl, clipBasemap)
    : null;

  const regionLayer = new GeoJsonLayer({
    id: 'country-scatterplot-regions',
    data: enrichedGeoJson,
    filled: true,
    stroked: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [26, 26, 26, 120],
    lineWidthMinPixels: 2,
    getLineColor: [255, 255, 255, 240],
    getFillColor: (feature: { properties?: Record<string, unknown> }) => {
      const iso = normalizeIso(feature.properties?.ISO);
      const row = dataByIso[iso];
      if (!row) {
        return [200, 200, 200, polygonAlpha];
      }
      const css = linearColorScale(row.metric) ?? '#cccccc';
      return cssColorToRgba(css, polygonAlpha);
    },
    updateTriggers: {
      getFillColor: [polygonAlpha, linearColorScheme],
    },
    getLineWidth: 2,
    onHover: ({ object, x, y }) => {
      if (!object) {
        hideTooltip('regions');
        return false;
      }
      showTooltip('regions', featureToRegionItem(object.properties), x, y);
      return true;
    },
  });

  const bubbleLayer = new ScatterplotLayer<BubblePoint>({
    id: 'country-scatterplot-bubbles',
    data: bubblePoints,
    pickable: true,
    radiusUnits: 'pixels',
    getPosition: d => d.position,
    getRadius: d => d.radius,
    radiusMinPixels: minRadius,
    radiusMaxPixels: maxRadius,
    getFillColor: d => d.fillColor,
    stroked: true,
    getLineColor: [255, 255, 255, 220],
    lineWidthMinPixels: 1,
    onHover: ({ object, x, y }) => {
      if (!object) {
        hideTooltip('bubbles');
        return false;
      }
      showTooltip('bubbles', object, x, y);
      return true;
    },
  });

  return [maskLayer, basemapLayer, regionLayer, bubbleLayer].filter(
    (layer): layer is NonNullable<typeof layer> => layer !== null,
  );
}
