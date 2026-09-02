import { t } from '@apache-superset/core/translation';
import { validateMapboxStylesUrl } from '@superset-ui/core';
import { DEFAULT_VIEWPORT, getDeckGLTiles } from './mapConfig';

export const showWorldMapControl = {
  name: 'show_world_map',
  config: {
    type: 'CheckboxControl',
    label: t('Show world map'),
    default: true,
    renderTrigger: true,
    description: t(
      'When checked, the world basemap is shown. When unchecked, the basemap is clipped to the selected country.',
    ),
  },
};

export const autozoomControl = {
  name: 'autozoom',
  config: {
    type: 'CheckboxControl',
    label: t('Auto Zoom'),
    default: true,
    renderTrigger: true,
    description: t(
      'When checked, the map will zoom to your data after each query',
    ),
  },
};

export const viewportControl = {
  name: 'viewport',
  config: {
    type: 'ViewportControl',
    label: t('Viewport'),
    renderTrigger: true,
    description: t('Parameters related to the view and perspective on the map'),
    default: DEFAULT_VIEWPORT,
    dontRefreshOnChange: true,
  },
};

export const mapboxStyleControl = {
  name: 'mapbox_style',
  config: {
    type: 'SelectControl',
    label: t('Map Style'),
    clearable: false,
    renderTrigger: true,
    freeForm: true,
    validators: [validateMapboxStylesUrl],
    choices: getDeckGLTiles(),
    default: getDeckGLTiles()[0][0],
    description: t(
      'OSM tiles, tile:// URL, or Mapbox style (mapbox://styles/user/styleId). Mapbox styles are loaded as raster tiles. The style must be public, or MAPBOX_API_KEY must belong to the style owner.',
    ),
    shouldMapStateToProps: () => true,
    mapStateToProps: () => ({
      choices: getDeckGLTiles(),
    }),
  },
};
