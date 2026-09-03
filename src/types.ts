import {
  DataRecordValue,
  FilterState,
  QueryFormColumn,
  QueryFormData,
  QueryFormMetric,
  SetControlValue,
  SetDataMaskHook,
} from '@superset-ui/core';

export type BubbleColorMode = 'fixed' | 'linear';

export interface MapViewport {
  longitude?: number;
  latitude?: number;
  zoom?: number;
  bearing?: number;
  pitch?: number;
  width?: number;
  height?: number;
}

export interface CountryScatterplotMapQueryFormData extends QueryFormData {
  select_country?: string;
  selectCountry?: string;
  entity?: QueryFormColumn;
  metric?: QueryFormMetric;
  longitude?: QueryFormColumn;
  latitude?: QueryFormColumn;
  lon_column?: QueryFormColumn;
  lat_column?: QueryFormColumn;
  linear_color_scheme?: string;
  linearColorScheme?: string;
  number_format?: string;
  numberFormat?: string;
  min_radius?: number;
  minRadius?: number;
  max_radius?: number;
  maxRadius?: number;
  multiplier?: number;
  bubble_color_mode?: BubbleColorMode;
  bubbleColorMode?: BubbleColorMode;
  bubble_color?: string | { r: number; g: number; b: number; a?: number };
  bubbleColor?: string | { r: number; g: number; b: number; a?: number };
  bubble_linear_color_scheme?: string;
  bubbleLinearColorScheme?: string;
  tooltip_contents?: unknown[];
  tooltipContents?: unknown[];
  tooltip_template?: string;
  tooltipTemplate?: string;
  mapbox_style?: string;
  mapboxStyle?: string;
  autozoom?: boolean;
  viewport?: MapViewport;
  polygon_opacity?: number;
  polygonOpacity?: number;
  show_world_map?: boolean;
  showWorldMap?: boolean;
}

export interface RegionMapDataItem {
  country_id: string;
  filterValue?: DataRecordValue;
  metric: number;
  longitude?: number;
  latitude?: number;
  region_name?: string;
  extra?: Record<string, unknown>;
}

export interface BubblePoint extends RegionMapDataItem {
  position: [number, number];
  radius: number;
  fillColor: [number, number, number, number];
}

export interface CountryScatterplotMapTransformedProps {
  width: number;
  height: number;
  country: string | null;
  data: RegionMapDataItem[];
  linearColorScheme?: string;
  numberFormat?: string;
  minRadius: number;
  maxRadius: number;
  multiplier: number;
  bubbleColorMode: BubbleColorMode;
  bubbleColor: string;
  bubbleLinearColorScheme?: string;
  tooltipTemplate?: string;
  tooltipContents?: unknown[];
  metricLabel: string;
  mapboxStyle: string;
  mapboxApiKey: string;
  autozoom: boolean;
  viewport?: MapViewport;
  polygonOpacity: number;
  showWorldMap: boolean;
  useLatLonBubbles: boolean;
  bubbleData: RegionMapDataItem[];
  setControlValue?: SetControlValue;
  entityColumn: string;
  filterState: FilterState;
  /** Values from formData.extra_form_data filters on the entity column */
  appliedFilterValues: DataRecordValue[];
  /** True when any external extra_form_data.filters are present */
  hasExternalFilters: boolean;
  setDataMask: SetDataMaskHook;
  emitCrossFilters?: boolean;
}

export const DEFAULT_FORM_DATA: Partial<CountryScatterplotMapQueryFormData> = {
  min_radius: 4,
  max_radius: 40,
  multiplier: 1,
  bubble_color_mode: 'fixed',
  bubble_color: { r: 220, g: 20, b: 60, a: 1 },
  number_format: 'SMART_NUMBER',
  autozoom: true,
  mapbox_style: 'tile://https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  polygon_opacity: 50,
  show_world_map: true,
};
