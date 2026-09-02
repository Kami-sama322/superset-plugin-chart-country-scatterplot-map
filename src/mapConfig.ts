export const DEFAULT_VIEWPORT = {
  longitude: 37.62,
  latitude: 55.75,
  zoom: 3,
  bearing: 0,
  pitch: 0,
};

export const DEFAULT_MAP_STYLE =
  'tile://https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const MAPBOX_STYLE_RE = /^mapbox:\/\/styles\/([^/]+)\/([^/?#]+)/;

export function isMapboxStyleUrl(style: string | undefined): boolean {
  return Boolean(style && MAPBOX_STYLE_RE.test(style.trim()));
}

export function mapboxStyleToTileUrl(
  style: string,
  accessToken: string,
): string | null {
  const match = style.trim().match(MAPBOX_STYLE_RE);
  if (!match || !accessToken) {
    return null;
  }
  const [, username, styleId] = match;
  const token = encodeURIComponent(accessToken);
  return (
    `tile://https://api.mapbox.com/styles/v1/${username}/${styleId}` +
    `/tiles/256/{z}/{x}/{y}?access_token=${token}`
  );
}

export function getMapboxStyleWarnings(
  mapboxStyle: string,
  deckMapStyle: string,
  mapboxApiKey: string,
): { keyMissing: boolean; tilesFailed: boolean } {
  const requested = isMapboxStyleUrl(mapboxStyle);
  return {
    keyMissing: requested && !mapboxApiKey,
    tilesFailed: requested && !deckMapStyle.includes('api.mapbox.com'),
  };
}

export function resolveDeckMapStyle(
  style: string | undefined,
  accessToken: string,
): string {
  const trimmed = (style || '').trim() || DEFAULT_MAP_STYLE;
  const tileUrl = mapboxStyleToTileUrl(trimmed, accessToken);
  if (tileUrl) {
    return tileUrl;
  }
  if (isMapboxStyleUrl(trimmed)) {
    return DEFAULT_MAP_STYLE;
  }
  return trimmed;
}

export function deckStyleToRasterUrl(mapStyle: string): string | null {
  const trimmed = (mapStyle || '').trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith('tile://')) {
    return trimmed.slice('tile://'.length);
  }
  if (
    trimmed.includes('openstreetmap') ||
    trimmed.includes('/osm') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  return null;
}

const DEFAULT_DECKGL_TILES = [
  ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', 'Streets (OSM)'],
  [
    'tile://https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    'Dark (OSM)',
  ],
  ['mapbox://styles/mapbox/streets-v9', 'Streets (Mapbox)'],
  ['mapbox://styles/mapbox/dark-v9', 'Dark (Mapbox)'],
  ['mapbox://styles/mapbox/light-v9', 'Light (Mapbox)'],
  ['mapbox://styles/mapbox/satellite-streets-v9', 'Satellite Streets (Mapbox)'],
];

export function getDeckGLTiles(): string[][] {
  if (typeof document === 'undefined') {
    return DEFAULT_DECKGL_TILES.map(([url, label]) => [
      url.startsWith('http') ? `tile://${url}` : url,
      label,
    ]);
  }
  const appContainer = document.getElementById('app');
  const { common } = JSON.parse(
    appContainer?.getAttribute('data-bootstrap') || '{}',
  );
  const tiles = common?.deckgl_tiles ?? DEFAULT_DECKGL_TILES;
  return tiles.map(([url, label]: [string, string]) => [
    url.startsWith('http') ? `tile://${url}` : url,
    label,
  ]);
}

export function getMapboxApiKey(mapboxApiKey?: string): string {
  if (mapboxApiKey) {
    return mapboxApiKey;
  }
  if (typeof document === 'undefined') {
    return '';
  }
  const appContainer = document.getElementById('app');
  const dataBootstrap = appContainer?.getAttribute('data-bootstrap');
  if (!dataBootstrap) {
    return '';
  }
  const bootstrapData = JSON.parse(dataBootstrap);
  return bootstrapData?.common?.conf?.MAPBOX_API_KEY || '';
}
