import type { FeatureCollection } from 'geojson';
import fitViewport, {
  Viewport,
} from '../../legacy-preset-chart-deckgl/src/utils/fitViewport';
import {
  getFeatureBoundsPoints,
  getGeoJsonBoundsPoints,
} from './geoColorUtils';
import { findFeatureByIso } from './mapData';
import type { BubblePoint, MapViewport } from './types';

export function fitMapViewport(
  viewportProp: MapViewport | Viewport | undefined,
  width: number,
  height: number,
  autozoom: boolean,
  geoJson: FeatureCollection | null,
  bubblePoints: BubblePoint[],
  selectedIso?: string | null,
): Viewport {
  const baseViewport = {
    ...(viewportProp || {}),
    width,
    height,
  } as Viewport;

  if (selectedIso && geoJson) {
    const feature = findFeatureByIso(geoJson, selectedIso);
    if (feature) {
      const regionPoints = getFeatureBoundsPoints(feature);
      if (regionPoints.length) {
        return fitViewport(baseViewport, {
          width,
          height,
          points: regionPoints,
          padding: 48,
        });
      }
    }
  }

  if (!autozoom || !geoJson) {
    return baseViewport;
  }
  const points = [
    ...getGeoJsonBoundsPoints(geoJson),
    ...bubblePoints.map(point => point.position),
  ];
  if (!points.length) {
    return baseViewport;
  }
  return fitViewport(baseViewport, {
    width,
    height,
    points,
    padding: 40,
  });
}
