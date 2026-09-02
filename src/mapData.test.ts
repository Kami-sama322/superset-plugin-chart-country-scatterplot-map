import type { Feature, FeatureCollection } from 'geojson';
import {
  buildBubblePoints,
  enrichGeoJson,
  featureToRegionItem,
  indexByIso,
  isoCenters,
  metricDomain,
} from './mapData';

const polygon: Feature = {
  type: 'Feature',
  properties: { ISO: 'RU-TOM', NAME_1: 'Tomsk' },
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

const geoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [polygon],
};

test('indexByIso keys rows by normalized ISO', () => {
  const indexed = indexByIso([
    { country_id: 'ru-tom', metric: 4 },
    { country_id: 'RU-MOW', metric: 1 },
  ]);
  expect(indexed['RU-TOM']?.metric).toBe(4);
  expect(indexed['RU-MOW']?.metric).toBe(1);
});

test('metricDomain falls back when the list is empty', () => {
  expect(metricDomain([])).toEqual([0, 1]);
  expect(metricDomain([], [2, 9])).toEqual([2, 9]);
  expect(metricDomain([{ metric: 3 }, { metric: 8 }])).toEqual([3, 8]);
});

test('isoCenters uses polygon bbox midpoints', () => {
  expect(isoCenters(geoJson)).toEqual({ 'RU-TOM': [85, 55] });
});

test('enrichGeoJson copies metric and region name onto features', () => {
  const enriched = enrichGeoJson(geoJson, {
    'RU-TOM': {
      country_id: 'RU-TOM',
      metric: 12,
      extra: { city: 'Tomsk' },
    },
  });
  expect(enriched.features[0].properties).toMatchObject({
    country_id: 'RU-TOM',
    metric: 12,
    region_name: 'Tomsk',
    extra: { city: 'Tomsk' },
  });
});

test('featureToRegionItem reads ISO fallbacks', () => {
  expect(
    featureToRegionItem({
      ISO: 'RU-TOM',
      metric: 5,
      region_name: 'Tomsk',
      extra: { a: 1 },
    }),
  ).toEqual({
    country_id: 'RU-TOM',
    metric: 5,
    region_name: 'Tomsk',
    extra: { a: 1 },
  });
});

test('buildBubblePoints places ISO bubbles on region centers', () => {
  const points = buildBubblePoints(
    geoJson,
    [{ country_id: 'RU-TOM', metric: 10, region_name: 'Tomsk' }],
    {
      useLatLonBubbles: false,
      minMetric: 0,
      maxMetric: 10,
      minRadius: 4,
      maxRadius: 40,
      multiplier: 1,
      bubbleColorMode: 'fixed',
      bubbleColor: 'rgb(220, 20, 60)',
      colorScale: () => '#000',
    },
  );
  expect(points).toHaveLength(1);
  expect(points[0].position).toEqual([85, 55]);
  expect(points[0].radius).toBe(40);
  expect(points[0].region_name).toBe('Tomsk');
});

test('buildBubblePoints in lat/lon mode skips ISO-only rows', () => {
  const points = buildBubblePoints(
    geoJson,
    [
      { country_id: 'RU-TOM', metric: 1, longitude: 84.9, latitude: 56.5 },
      { country_id: 'RU-MOW', metric: 2 },
    ],
    {
      useLatLonBubbles: true,
      minMetric: 0,
      maxMetric: 2,
      minRadius: 4,
      maxRadius: 40,
      multiplier: 1,
      bubbleColorMode: 'fixed',
      bubbleColor: 'rgb(1, 2, 3)',
      colorScale: () => '#fff',
    },
  );
  expect(points).toHaveLength(1);
  expect(points[0].position).toEqual([84.9, 56.5]);
});
