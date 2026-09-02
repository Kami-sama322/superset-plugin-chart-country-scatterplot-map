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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { styled } from '@apache-superset/core/theme';
import { getNumberFormatter } from '@superset-ui/core';
import { DeckGLContainerStyledWrapper } from '../../legacy-preset-chart-deckgl/src/DeckGLContainer';
import type { Viewport } from '../../legacy-preset-chart-deckgl/src/utils/fitViewport';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { CountryScatterplotMapTransformedProps } from './types';
import {
  getMapboxStyleWarnings,
  resolveDeckMapStyle,
} from './mapConfig';
import { percentToAlpha } from './geoColorUtils';
import {
  buildBubblePoints,
  createColorScale,
  enrichGeoJson,
  indexByIso,
  metricDomain,
} from './mapData';
import { createMapLayers } from './mapLayers';
import { fitMapViewport } from './mapViewport';
import { MapStatus, MapboxStyleWarning } from './MapStatus';
import { useCountryGeoJson } from './useCountryGeoJson';
import { useChartTooltip } from './useChartTooltip';

type Props = CountryScatterplotMapTransformedProps & {
  className?: string;
};

function CountryScatterplotMapInner({
  width,
  height,
  country,
  data,
  linearColorScheme,
  numberFormat,
  minRadius,
  maxRadius,
  multiplier,
  bubbleColorMode,
  bubbleColor,
  bubbleLinearColorScheme,
  tooltipTemplate,
  tooltipContents,
  metricLabel,
  mapboxStyle,
  mapboxApiKey,
  autozoom,
  viewport: viewportProp,
  polygonOpacity,
  showWorldMap,
  useLatLonBubbles,
  bubbleData,
  setControlValue,
  className,
}: Props) {
  const { geoJson, loadError } = useCountryGeoJson(country);
  const format = useMemo(
    () => getNumberFormatter(numberFormat || 'SMART_NUMBER'),
    [numberFormat],
  );
  const { containerRef, showTooltip, hideTooltip } = useChartTooltip(
    format,
    tooltipTemplate,
    tooltipContents,
    metricLabel,
  );
  const deckMapStyle = useMemo(
    () => resolveDeckMapStyle(mapboxStyle, mapboxApiKey),
    [mapboxStyle, mapboxApiKey],
  );
  const { keyMissing, tilesFailed } = getMapboxStyleWarnings(
    mapboxStyle,
    deckMapStyle,
    mapboxApiKey,
  );
  const polygonAlpha = percentToAlpha(polygonOpacity);
  const metricExtent = useMemo(() => metricDomain(data), [data]);
  const bubbleMetricExtent = useMemo(
    () => metricDomain(bubbleData, metricExtent),
    [bubbleData, metricExtent],
  );

  const linearColorScale = useMemo(
    () => createColorScale(linearColorScheme, metricExtent),
    [linearColorScheme, metricExtent],
  );
  const bubbleColorScale = useMemo(
    () =>
      createColorScale(
        bubbleLinearColorScheme || linearColorScheme,
        bubbleMetricExtent,
        linearColorScale,
      ),
    [
      bubbleLinearColorScheme,
      linearColorScheme,
      linearColorScale,
      bubbleMetricExtent,
    ],
  );

  const dataByIso = useMemo(() => indexByIso(data), [data]);
  const enrichedGeoJson = useMemo(
    () => (geoJson ? enrichGeoJson(geoJson, dataByIso) : null),
    [geoJson, dataByIso],
  );
  const bubblePoints = useMemo(
    () =>
      geoJson
        ? buildBubblePoints(geoJson, bubbleData, {
            useLatLonBubbles,
            minMetric: bubbleMetricExtent[0],
            maxMetric: bubbleMetricExtent[1],
            minRadius,
            maxRadius,
            multiplier,
            bubbleColorMode,
            bubbleColor,
            colorScale: bubbleColorScale,
          })
        : [],
    [
      geoJson,
      bubbleData,
      bubbleMetricExtent,
      minRadius,
      maxRadius,
      multiplier,
      bubbleColorMode,
      bubbleColor,
      bubbleColorScale,
      useLatLonBubbles,
    ],
  );

  const getAdjustedViewport = useCallback(
    () =>
      fitMapViewport(
        viewportProp,
        width,
        height,
        autozoom,
        geoJson,
        bubblePoints,
      ),
    [autozoom, bubblePoints, geoJson, height, viewportProp, width],
  );
  const [viewport, setViewport] = useState<Viewport>(getAdjustedViewport);

  useEffect(() => {
    setViewport(getAdjustedViewport());
  }, [getAdjustedViewport]);

  const layers = useMemo(
    () =>
      enrichedGeoJson && geoJson
        ? createMapLayers({
            enrichedGeoJson,
            geoJson,
            dataByIso,
            linearColorScale,
            linearColorScheme,
            bubblePoints,
            minRadius,
            maxRadius,
            deckMapStyle,
            polygonAlpha,
            showWorldMap,
            showTooltip,
            hideTooltip,
          })
        : [],
    [
      enrichedGeoJson,
      geoJson,
      dataByIso,
      linearColorScale,
      linearColorScheme,
      bubblePoints,
      minRadius,
      maxRadius,
      deckMapStyle,
      polygonAlpha,
      showWorldMap,
      showTooltip,
      hideTooltip,
    ],
  );

  if (!country) {
    return (
      <MapStatus kind="warning">Select a country in chart controls.</MapStatus>
    );
  }

  if (loadError) {
    return <MapStatus kind="danger">{loadError}</MapStatus>;
  }

  if (!geoJson) {
    return <MapStatus kind="info">Loading map…</MapStatus>;
  }

  const mapHeight = keyMissing || tilesFailed ? height - 40 : height;

  return (
    <div
      className={className}
      key={`${deckMapStyle}-${showWorldMap}`}
      style={{ width, height, position: 'relative' }}
    >
      <MapboxStyleWarning keyMissing={keyMissing} tilesFailed={tilesFailed} />
      <DeckGLContainerStyledWrapper
        ref={containerRef}
        width={width}
        height={mapHeight}
        viewport={viewport}
        mapStyle={deckMapStyle}
        mapboxApiAccessToken={mapboxApiKey}
        layers={[...layers]}
        setControlValue={setControlValue}
        onViewportChange={setViewport}
      />
    </div>
  );
}

const CountryScatterplotMap = styled(CountryScatterplotMapInner)`
  width: 100%;
  height: 100%;
`;

export default CountryScatterplotMap;
