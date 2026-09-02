import { GeoBoundingBox, TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, GeoJsonLayer } from '@deck.gl/layers';
import { MaskExtension } from '@deck.gl/extensions';
import type { FeatureCollection } from 'geojson';

export const COUNTRY_MASK_ID = 'country-basemap-mask';

export function createCountryMaskLayer(geoJson: FeatureCollection) {
  return new GeoJsonLayer({
    id: COUNTRY_MASK_ID,
    data: geoJson,
    operation: 'mask',
    filled: true,
    stroked: false,
  });
}

export function createBasemapLayer(url: string, clipToCountry: boolean) {
  const mask = clipToCountry
    ? {
        extensions: [new MaskExtension()],
        maskId: COUNTRY_MASK_ID,
      }
    : {};

  return new TileLayer({
    data: url,
    id: 'tile-layer',
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    ...mask,
    renderSubLayers: (props: {
      tile: { bbox: GeoBoundingBox };
      data: unknown;
    }) => {
      const { west, north, east, south } = props.tile.bbox;
      return [
        new BitmapLayer(props, {
          data: undefined,
          image: props.data,
          bounds: [west, south, east, north],
          ...mask,
        }),
      ];
    },
  });
}
