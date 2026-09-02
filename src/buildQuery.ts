import {
  buildQueryContext,
  getMetricLabel,
  QueryFormColumn,
  QueryObject,
} from '@superset-ui/core';
import { CountryScatterplotMapQueryFormData } from './types';
import {
  extractTooltipColumns,
  firstColumn,
  toPhysicalOrAdhoc,
  uniqueColumns,
} from './columnUtils';

export default function buildQuery(
  formData: CountryScatterplotMapQueryFormData,
) {
  const entity = toPhysicalOrAdhoc(firstColumn(formData.entity));
  const longitude =
    toPhysicalOrAdhoc(firstColumn(formData.longitude)) ||
    toPhysicalOrAdhoc(
      firstColumn(
        (formData as Record<string, unknown>).lon_column as
          | CountryScatterplotMapQueryFormData['longitude'],
      ),
    );
  const latitude =
    toPhysicalOrAdhoc(firstColumn(formData.latitude)) ||
    toPhysicalOrAdhoc(
      firstColumn(
        (formData as Record<string, unknown>).lat_column as
          | CountryScatterplotMapQueryFormData['longitude'],
      ),
    );
  const metric = formData.metric;

  if (!entity) {
    throw new Error('ISO 3166-2 Codes column is required');
  }
  if (!metric) {
    throw new Error('Metric is required');
  }

  return buildQueryContext(formData, {
    queryFields: {
      entity: 'columns',
      longitude: 'columns',
      latitude: 'columns',
    },
    buildQuery: (baseQueryObject: QueryObject) => {
      const dimensionCols: QueryFormColumn[] = [entity];
      if (longitude) {
        dimensionCols.push(longitude);
      }
      if (latitude) {
        dimensionCols.push(latitude);
      }

      const columns = uniqueColumns(
        [...dimensionCols, ...extractTooltipColumns(formData.tooltip_contents)]
          .map(col => toPhysicalOrAdhoc(col))
          .filter((col): col is QueryFormColumn => col !== undefined),
      );

      const query: QueryObject = {
        ...baseQueryObject,
        columns,
        metrics: [metric],
        orderby: [[getMetricLabel(metric), false]],
        is_timeseries: false,
      };
      delete (query as Record<string, unknown>).groupby;

      return [query];
    },
  });
}
