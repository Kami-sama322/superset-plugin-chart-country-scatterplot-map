import type { FeatureCollection } from 'geojson';
import fitViewport, {
  Viewport,
} from '../../legacy-preset-chart-deckgl/src/utils/fitViewport';
import {
  getFeatureBoundsPoints,
  getGeoJsonBoundsPoints,
} from './geoColorUtils';
import { findFeatureByIso } from './mapData';
import { normalizeIso } from './columnUtils';
import type { BubblePoint, MapViewport } from './types';

function boundsForIsos(
  geoJson: FeatureCollection,
  isos: string[],
): [number, number][] {
  const points: [number, number][] = [];
  isos.forEach(iso => {
    const feature = findFeatureByIso(geoJson, iso);
    if (!feature) {
      return;
    }
    points.push(...getFeatureBoundsPoints(feature));
  });
  return points;
}

export function fitMapViewport(
  viewportProp: MapViewport | Viewport | undefined,
  width: number,
  height: number,
  autozoom: boolean,
  geoJson: FeatureCollection | null,
  bubblePoints: BubblePoint[],
  selectedIsos?: string[] | null,
  dataIsos?: string[],
): Viewport {
  const baseViewport = {
    ...(viewportProp || {}),
    width,
    height,
  } as Viewport;

  const selection = (selectedIsos || []).map(normalizeIso).filter(Boolean);
  if (selection.length && geoJson) {
    const regionPoints = boundsForIsos(geoJson, selection);
    if (regionPoints.length) {
      return fitViewport(baseViewport, {
        width,
        height,
        points: regionPoints,
        padding: 48,
      });
    }
  }

  if (!autozoom || !geoJson) {
    return baseViewport;
  }

  const dataIsoList = (dataIsos || []).map(normalizeIso).filter(Boolean);
  const dataRegionPoints =
    dataIsoList.length > 0 ? boundsForIsos(geoJson, dataIsoList) : [];
  const preferDataRegions =
    dataRegionPoints.length > 0 &&
    dataIsoList.length < geoJson.features.length;

  const points = preferDataRegions
    ? [...dataRegionPoints, ...bubblePoints.map(point => point.position)]
    : [
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
    padding: preferDataRegions ? 48 : 40,
  });
}
