/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { t } from '@apache-superset/core/translation';
import { validateNonEmpty } from '@superset-ui/core';
import {
  ControlPanelConfig,
  D3_FORMAT_DOCS,
  D3_FORMAT_OPTIONS,
  getStandardizedControls,
  sharedControls,
} from '@superset-ui/chart-controls';
import { countryOptions } from './countryOptions';
import { tooltipContentsControl, tooltipTemplateControl } from './tooltipControl';
import BubbleColorControl from './controls/BubbleColorControl';
import { DEFAULT_BUBBLE_COLOR } from './geoColorUtils';
import {
  autozoomControl,
  mapboxStyleControl,
  showWorldMapControl,
  viewportControl,
} from './mapControls';

const columnsConfig = sharedControls.entity;

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'select_country',
            config: {
              type: 'SelectControl',
              label: t('Country'),
              default: 'russia',
              choices: countryOptions,
              description: t('Which country to plot the map for?'),
              validators: [validateNonEmpty],
            },
          },
        ],
        ['entity'],
        ['metric'],
        [
          {
            name: 'longitude',
            config: {
              ...columnsConfig,
              label: t('Longitude'),
              clearable: true,
              default: null,
              description: t(
                'Optional. When both Longitude and Latitude are set, bubbles are drawn only at those coordinates. ISO centroid bubbles are not shown.',
              ),
              validators: [],
            },
          },
        ],
        [
          {
            name: 'latitude',
            config: {
              ...columnsConfig,
              label: t('Latitude'),
              clearable: true,
              default: null,
              description: t(
                'Optional. When both Longitude and Latitude are set, bubbles are drawn only at those coordinates. ISO centroid bubbles are not shown.',
              ),
              validators: [],
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
        [tooltipContentsControl],
        [tooltipTemplateControl],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [showWorldMapControl],
        [mapboxStyleControl],
        [autozoomControl, viewportControl],
        [
          {
            name: 'number_format',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: t('Number format'),
              renderTrigger: true,
              default: 'SMART_NUMBER',
              choices: D3_FORMAT_OPTIONS,
              description: D3_FORMAT_DOCS,
            },
          },
        ],
        ['linear_color_scheme'],
        [
          {
            name: 'polygon_opacity',
            config: {
              type: 'SliderControl',
              label: t('Polygon opacity'),
              default: 50,
              step: 1,
              min: 0,
              max: 100,
              renderTrigger: true,
              description: t(
                'Fill opacity of region polygons, 0–100. Lower values show the basemap through the regions.',
              ),
            },
          },
        ],
      ],
    },
    {
      label: t('Bubbles'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'min_radius',
            config: {
              type: 'TextControl',
              label: t('Minimum Radius'),
              isFloat: true,
              validators: [validateNonEmpty],
              renderTrigger: true,
              default: 4,
              description: t(
                'Minimum bubble radius in pixels (scaled by metric value).',
              ),
            },
          },
          {
            name: 'max_radius',
            config: {
              type: 'TextControl',
              label: t('Maximum Radius'),
              isFloat: true,
              validators: [validateNonEmpty],
              renderTrigger: true,
              default: 40,
              description: t(
                'Maximum bubble radius in pixels (scaled by metric value).',
              ),
            },
          },
        ],
        [
          {
            name: 'multiplier',
            config: {
              type: 'TextControl',
              label: t('Multiplier'),
              isFloat: true,
              renderTrigger: true,
              default: 1,
              description: t('Factor to multiply the metric by for bubble size'),
            },
          },
        ],
        [
          {
            name: 'bubble_color_mode',
            config: {
              type: 'SelectControl',
              label: t('Bubble color mode'),
              clearable: false,
              renderTrigger: true,
              default: 'fixed',
              choices: [
                ['fixed', t('Fixed color')],
                ['linear', t('Linear color scheme (same as regions)')],
              ],
              description: t(
                'Fixed color from the palette, or a linear color scheme by metric.',
              ),
            },
          },
        ],
        [
          {
            name: 'bubble_color',
            config: {
              type: BubbleColorControl,
              label: t('Bubble Color'),
              default: DEFAULT_BUBBLE_COLOR,
              renderTrigger: true,
              description: t('Fixed fill color for bubbles'),
              visibility: ({ controls }) =>
                controls?.bubble_color_mode?.value !== 'linear',
            },
          },
        ],
        [
          {
            name: 'bubble_linear_color_scheme',
            config: {
              ...sharedControls.linear_color_scheme,
              label: t('Bubble color scheme'),
              visibility: ({ controls }) =>
                controls?.bubble_color_mode?.value === 'linear',
            },
          },
        ],
      ],
    },
  ],
  controlOverrides: {
    entity: {
      label: t('ISO 3166-2 Codes'),
      description: t(
        'Column containing ISO 3166-2 codes of region/province/department in your table.',
      ),
    },
    metric: {
      label: t('Metric'),
      description: t(
        'Metric for region fill gradient and bubble size.',
      ),
    },
  },
  formDataOverrides: formData => ({
    ...formData,
    entity: getStandardizedControls().shiftColumn(),
    metric: getStandardizedControls().shiftMetric(),
  }),
};

export default config;
