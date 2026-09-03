import d3 from 'd3';
import geojsonExtent from '@mapbox/geojson-extent';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

function walkPositions(
  coords: unknown,
  visit: (lon: number, lat: number) => void,
): void {
  if (!Array.isArray(coords) || coords.length === 0) {
    return;
  }
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    visit(coords[0], coords[1]);
    return;
  }
  coords.forEach(item => walkPositions(item, visit));
}

function extentFromGeometry(geometry: Geometry | null | undefined): number[] | null {
  if (!geometry) {
    return null;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (lon: number, lat: number) => {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return;
    }
    minX = Math.min(minX, lon);
    minY = Math.min(minY, lat);
    maxX = Math.max(maxX, lon);
    maxY = Math.max(maxY, lat);
  };

  if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach(child => {
      const childExtent = extentFromGeometry(child);
      if (!childExtent) {
        return;
      }
      visit(childExtent[0], childExtent[1]);
      visit(childExtent[2], childExtent[3]);
    });
  } else if ('coordinates' in geometry) {
    walkPositions(geometry.coordinates, visit);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null;
  }
  return [minX, minY, maxX, maxY];
}

function extentFromLib(geojson: unknown): number[] | null {
  const fn =
    typeof geojsonExtent === 'function'
      ? geojsonExtent
      : (geojsonExtent as { default?: (g: unknown) => number[] }).default;
  if (typeof fn !== 'function') {
    return null;
  }
  try {
    const bounds = fn(geojson);
    if (!bounds || bounds.length < 4 || bounds.some(v => !Number.isFinite(v))) {
      return null;
    }
    return bounds;
  } catch {
    return null;
  }
}

function extentOf(geojson: unknown): number[] | null {
  const fromLib = extentFromLib(geojson);
  if (fromLib) {
    return fromLib;
  }
  if (!geojson || typeof geojson !== 'object') {
    return null;
  }
  const value = geojson as Feature | FeatureCollection;
  if (value.type === 'FeatureCollection') {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    value.features.forEach(feature => {
      const bounds = extentFromGeometry(feature.geometry);
      if (!bounds) {
        return;
      }
      minX = Math.min(minX, bounds[0]);
      minY = Math.min(minY, bounds[1]);
      maxX = Math.max(maxX, bounds[2]);
      maxY = Math.max(maxY, bounds[3]);
    });
    if (!Number.isFinite(minX)) {
      return null;
    }
    return [minX, minY, maxX, maxY];
  }
  if (value.type === 'Feature') {
    return extentFromGeometry(value.geometry);
  }
  return extentFromGeometry(geojson as Geometry);
}

export function cssColorToRgba(
  color: string,
  alpha = 210,
): [number, number, number, number] {
  const parsed = d3.rgb(color);
  return [parsed.r, parsed.g, parsed.b, alpha];
}

export type RgbColorValue = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

export const DEFAULT_BUBBLE_COLOR: RgbColorValue = {
  r: 220,
  g: 20,
  b: 60,
  a: 1,
};

export function toRgbColor(color: unknown): RgbColorValue | null {
  if (color && typeof color === 'object') {
    const { r, g, b, a } = color as RgbColorValue;
    if ([r, g, b].every(value => Number.isFinite(value))) {
      return { r, g, b, a: a ?? 1 };
    }
  }
  if (typeof color === 'string' && color.trim()) {
    const parsed = d3.rgb(color);
    if (
      Number.isFinite(parsed.r) &&
      Number.isFinite(parsed.g) &&
      Number.isFinite(parsed.b)
    ) {
      return { r: parsed.r, g: parsed.g, b: parsed.b, a: 1 };
    }
  }
  return null;
}

export function colorToCss(
  color: unknown,
  fallback = 'rgb(220, 20, 60)',
): string {
  const rgb = toRgbColor(color) ?? toRgbColor(fallback);
  if (!rgb) {
    return fallback;
  }
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function percentToAlpha(percent: unknown, fallback = 50): number {
  const parsed = Number(percent);
  const value = Number.isFinite(parsed) ? parsed : fallback;
  return Math.round((Math.max(0, Math.min(100, value)) / 100) * 255);
}

export function getRegionName(feature: Feature): string {
  const props = feature.properties || {};
  if (props.ID_2) {
    return String(props.NAME_2 || props.ISO || '');
  }
  return String(props.NAME_1 || props.NAME_2 || props.ISO || '');
}

export function getFeatureCenter(feature: Feature): [number, number] | null {
  const bounds = extentOf(feature);
  if (!bounds) {
    return null;
  }
  return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
}

export function getGeoJsonBoundsPoints(
  collection: FeatureCollection,
): [number, number][] {
  const bounds = extentOf(collection);
  if (!bounds) {
    return [];
  }
  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ];
}

export function getFeatureBoundsPoints(
  feature: Feature,
): [number, number][] {
  const bounds = extentOf(feature);
  if (!bounds) {
    return [];
  }
  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ];
}

export type RegionFeature = Feature<Geometry, Record<string, unknown>>;
