import {
  deckStyleToRasterUrl,
  getMapboxStyleWarnings,
  mapboxStyleToTileUrl,
  resolveDeckMapStyle,
} from './mapConfig';

test('mapboxStyleToTileUrl converts studio style to raster tiles', () => {
  const url = mapboxStyleToTileUrl(
    'mapbox://styles/idrozdoff/cm973sd8l00f001r0doua9wqx',
    'pk.test',
  );
  expect(url).toBe(
    'tile://https://api.mapbox.com/styles/v1/idrozdoff/cm973sd8l00f001r0doua9wqx/tiles/256/{z}/{x}/{y}?access_token=pk.test',
  );
});

test('resolveDeckMapStyle keeps OSM tile urls', () => {
  const osm = 'tile://https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  expect(resolveDeckMapStyle(osm, 'pk.test')).toBe(osm);
});

test('resolveDeckMapStyle falls back to OSM when Mapbox token is missing', () => {
  const osm = 'tile://https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  expect(
    resolveDeckMapStyle(
      'mapbox://styles/idrozdoff/cm973sd8l00f001r0doua9wqx',
      '',
    ),
  ).toBe(osm);
});

test('deckStyleToRasterUrl strips tile:// prefix', () => {
  expect(
    deckStyleToRasterUrl(
      'tile://https://api.mapbox.com/styles/v1/a/b/tiles/256/{z}/{x}/{y}',
    ),
  ).toBe('https://api.mapbox.com/styles/v1/a/b/tiles/256/{z}/{x}/{y}');
});

test('getMapboxStyleWarnings flags missing token and failed raster tiles', () => {
  expect(
    getMapboxStyleWarnings(
      'mapbox://styles/mapbox/streets-v9',
      'tile://https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      '',
    ),
  ).toEqual({ keyMissing: true, tilesFailed: true });
  expect(
    getMapboxStyleWarnings(
      'mapbox://styles/mapbox/streets-v9',
      'tile://https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}',
      'pk.test',
    ),
  ).toEqual({ keyMissing: false, tilesFailed: false });
  expect(
    getMapboxStyleWarnings(
      'tile://https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      'tile://https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      '',
    ),
  ).toEqual({ keyMissing: false, tilesFailed: false });
});
