import type { FeatureCollection } from 'geojson';
import fitViewport, {
  Viewport,
} from '../../legacy-preset-chart-deckgl/src/utils/fitViewport';
import { getGeoJsonBoundsPoints } from './geoColorUtils';
import type { BubblePoint, MapViewport } from './types';

export function fitMapViewport(
  viewportProp: MapViewport | Viewport | undefined,
  width: number,
  height: number,
  autozoom: boolean,
  geoJson: FeatureCollection | null,
  bubblePoints: BubblePoint[],
): Viewport {
  const baseViewport = {
    ...(viewportProp || {}),
    width,
    height,
  } as Viewport;
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
