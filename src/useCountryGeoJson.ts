import { useEffect, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { countries } from '@superset-ui/legacy-plugin-chart-country-map';

const geoJsonCache: Record<string, FeatureCollection> = {};

export function useCountryGeoJson(country: string | null): {
  geoJson: FeatureCollection | null;
  loadError: string | null;
} {
  const [geoJson, setGeoJson] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!country) {
      setGeoJson(null);
      return;
    }

    const cached = geoJsonCache[country];
    if (cached) {
      setGeoJson(cached);
      setLoadError(null);
      return;
    }

    const url = (countries as Record<string, string>)[country];
    if (!url) {
      setLoadError(`No map data available for ${country}`);
      setGeoJson(null);
      return;
    }

    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((json: FeatureCollection) => {
        if (controller.signal.aborted) {
          return;
        }
        geoJsonCache[country] = json;
        setGeoJson(json);
        setLoadError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setLoadError(`Could not load map data for ${country}`);
        setGeoJson(null);
      });

    return () => {
      controller.abort();
    };
  }, [country]);

  return { geoJson, loadError };
}
