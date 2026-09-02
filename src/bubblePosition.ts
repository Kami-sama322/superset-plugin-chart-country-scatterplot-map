import { normalizeIso } from './columnUtils';

const LON_KEYS = ['longitude', 'lon', 'lng'];
const LAT_KEYS = ['latitude', 'lat'];
const LON_KEY_RE = /(^|_)(lon|lng|longitude)$/i;
const LAT_KEY_RE = /(^|_)(lat|latitude)$/i;

function toFiniteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function readKeyed(
  record: Record<string, unknown> | undefined,
  keys: string[],
): number | undefined {
  if (!record) {
    return undefined;
  }
  for (const key of keys) {
    if (key && key in record) {
      const parsed = toFiniteNumber(record[key]);
      if (parsed !== undefined) {
        return parsed;
      }
    }
  }
  const lowerKeys = keys.map(key => key.toLowerCase());
  const match = Object.keys(record).find(key =>
    lowerKeys.includes(key.toLowerCase()),
  );
  return match ? toFiniteNumber(record[match]) : undefined;
}

function readByPattern(
  record: Record<string, unknown> | undefined,
  pattern: RegExp,
): number | undefined {
  if (!record) {
    return undefined;
  }
  const match = Object.keys(record).find(key => pattern.test(key));
  return match ? toFiniteNumber(record[match]) : undefined;
}

export function hasCoordinates(
  longitude: number | undefined,
  latitude: number | undefined,
): boolean {
  return (
    longitude !== undefined &&
    latitude !== undefined &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude)
  );
}

export function coordsOf(item: {
  longitude?: number;
  latitude?: number;
  extra?: Record<string, unknown>;
}): { longitude?: number; latitude?: number } {
  const fromItemLon = item.longitude;
  const fromItemLat = item.latitude;
  if (hasCoordinates(fromItemLon, fromItemLat)) {
    return { longitude: fromItemLon, latitude: fromItemLat };
  }
  const extra = item.extra;
  return {
    longitude:
      readKeyed(extra, LON_KEYS) ?? readByPattern(extra, LON_KEY_RE),
    latitude:
      readKeyed(extra, LAT_KEYS) ?? readByPattern(extra, LAT_KEY_RE),
  };
}

export function datasetHasCoordinates(
  items: {
    longitude?: number;
    latitude?: number;
    extra?: Record<string, unknown>;
  }[],
): boolean {
  return items.some(item => {
    const coords = coordsOf(item);
    return hasCoordinates(coords.longitude, coords.latitude);
  });
}

export function uniqueByIso<T extends { country_id: string; metric: number }>(
  items: T[],
): T[] {
  const map = new Map<string, T>();
  items.forEach(item => {
    const iso = normalizeIso(item.country_id);
    if (!iso) {
      return;
    }
    const prev = map.get(iso);
    if (!prev) {
      map.set(iso, {
        ...item,
        country_id: iso,
        longitude: undefined,
        latitude: undefined,
      } as T);
      return;
    }
    map.set(iso, {
      ...prev,
      metric: prev.metric + item.metric,
    });
  });
  return [...map.values()];
}

export function selectBubbleItems<
  T extends {
    country_id: string;
    metric: number;
    longitude?: number;
    latitude?: number;
    extra?: Record<string, unknown>;
  },
>(items: T[], useLatLon: boolean): T[] {
  if (useLatLon) {
    return items.filter(item => {
      const coords = coordsOf(item);
      return hasCoordinates(coords.longitude, coords.latitude);
    });
  }
  return uniqueByIso(items);
}

export function resolveBubblePosition(
  item: {
    country_id: string;
    longitude?: number;
    latitude?: number;
    extra?: Record<string, unknown>;
  },
  isoToCenter: Record<string, [number, number]>,
  useLatLon: boolean,
): [number, number] | null {
  const coords = coordsOf(item);
  if (useLatLon) {
    if (!hasCoordinates(coords.longitude, coords.latitude)) {
      return null;
    }
    return [coords.longitude as number, coords.latitude as number];
  }
  return isoToCenter[normalizeIso(item.country_id)] || null;
}
