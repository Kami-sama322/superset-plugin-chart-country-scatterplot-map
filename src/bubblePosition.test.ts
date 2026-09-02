import {
  coordsOf,
  datasetHasCoordinates,
  resolveBubblePosition,
  selectBubbleItems,
  uniqueByIso,
} from './bubblePosition';

test('lat/lon mode uses coordinates and skips ISO centroids', () => {
  expect(
    resolveBubblePosition(
      { country_id: 'RU-TOM', longitude: 84.9, latitude: 56.5 },
      { 'RU-TOM': [85, 55] },
      true,
    ),
  ).toEqual([84.9, 56.5]);
  expect(
    resolveBubblePosition(
      { country_id: 'RU-TOM' },
      { 'RU-TOM': [85, 55] },
      true,
    ),
  ).toBeNull();
});

test('ISO mode uses region centroids when no coordinates in the dataset', () => {
  expect(
    resolveBubblePosition(
      { country_id: 'RU-TOM' },
      { 'RU-TOM': [85, 55] },
      false,
    ),
  ).toEqual([85, 55]);
});

test('coords in extra still count as lat/lon bubbles', () => {
  const item = {
    country_id: 'RU-TOM',
    extra: { lon: 84.9, lat: 56.5 },
  };
  expect(coordsOf(item)).toEqual({ longitude: 84.9, latitude: 56.5 });
  expect(datasetHasCoordinates([item])).toBe(true);
  expect(resolveBubblePosition(item, { 'RU-TOM': [85, 55] }, true)).toEqual([
    84.9, 56.5,
  ]);
});

test('lat/lon mode drops ISO-only rows in a mixed dataset', () => {
  const iso = { 'RU-TOM': [85, 55], 'RU-MOW': [37.6, 55.7] };
  const city = { country_id: 'RU-TOM', longitude: 84.9, latitude: 56.5, metric: 1 };
  const region = { country_id: 'RU-MOW', metric: 10 };
  expect(datasetHasCoordinates([city, region])).toBe(true);
  expect(resolveBubblePosition(city, iso, true)).toEqual([84.9, 56.5]);
  expect(resolveBubblePosition(region, iso, true)).toBeNull();
});

test('ISO bubbles collapse to one point per region', () => {
  const rows = [
    { country_id: 'RU-TOM', metric: 2, longitude: 84.9, latitude: 56.5 },
    { country_id: 'RU-TOM', metric: 3, longitude: 85.1, latitude: 56.6 },
    { country_id: 'RU-MOW', metric: 1 },
  ];
  expect(uniqueByIso(rows)).toEqual([
    { country_id: 'RU-TOM', metric: 5, longitude: undefined, latitude: undefined },
    { country_id: 'RU-MOW', metric: 1, longitude: undefined, latitude: undefined },
  ]);
  const picked = selectBubbleItems(rows, true);
  expect(picked).toHaveLength(2);
  expect(picked.every(item => item.longitude !== undefined)).toBe(true);
});

test('city_lon in extra is treated as a coordinate', () => {
  const item = {
    country_id: 'RU-TOM',
    extra: { city_lon: 84.9, city_lat: 56.5 },
  };
  expect(coordsOf(item)).toEqual({ longitude: 84.9, latitude: 56.5 });
});
