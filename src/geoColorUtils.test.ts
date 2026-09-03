import type { Feature } from 'geojson';
import {
  getFeatureBoundsPoints,
  getFeatureCenter,
  getGeoJsonBoundsPoints,
  percentToAlpha,
  colorToCss,
  toRgbColor,
} from './geoColorUtils';

const polygon: Feature = {
  type: 'Feature',
  properties: { ISO: 'RU-TOM' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [80, 50],
        [90, 50],
        [90, 60],
        [80, 60],
        [80, 50],
      ],
    ],
  },
};

test('getFeatureCenter uses polygon bbox midpoint', () => {
  expect(getFeatureCenter(polygon)).toEqual([85, 55]);
});

test('getGeoJsonBoundsPoints returns collection corners', () => {
  const points = getGeoJsonBoundsPoints({
    type: 'FeatureCollection',
    features: [polygon],
  });
  expect(points).toEqual([
    [80, 50],
    [90, 60],
  ]);
});

test('getFeatureBoundsPoints returns feature corners', () => {
  expect(getFeatureBoundsPoints(polygon)).toEqual([
    [80, 50],
    [90, 60],
  ]);
});

test('percentToAlpha maps 0-100 to 0-255', () => {
  expect(percentToAlpha(0)).toBe(0);
  expect(percentToAlpha(100)).toBe(255);
  expect(percentToAlpha(50)).toBe(128);
  expect(percentToAlpha(-10)).toBe(0);
  expect(percentToAlpha(200)).toBe(255);
});

test('colorToCss accepts rgb objects and css strings', () => {
  expect(colorToCss({ r: 220, g: 20, b: 60 })).toBe('rgb(220, 20, 60)');
  expect(colorToCss('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
  expect(colorToCss(null)).toBe('rgb(220, 20, 60)');
});

test('toRgbColor parses css strings for the color picker', () => {
  expect(toRgbColor('rgb(220, 20, 60)')).toEqual({
    r: 220,
    g: 20,
    b: 60,
    a: 1,
  });
});
