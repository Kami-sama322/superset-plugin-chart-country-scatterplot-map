import { countries } from '@superset-ui/legacy-plugin-chart-country-map';

export const countryOptions = Object.keys(countries).map(x => {
  if (x === 'uk' || x === 'usa') {
    return [x, x.toUpperCase()];
  }
  if (x === 'italy_regions') {
    return [x, 'Italy (regions)'];
  }
  if (x === 'france_regions') {
    return [x, 'France (regions)'];
  }
  if (x === 'france_overseas') {
    return [x, 'France (with overseas)'];
  }
  if (x === 'turkey_regions') {
    return [x, 'Turkey (regions)'];
  }
  return [
    x,
    x
      .split('_')
      .map(e => e[0].toUpperCase() + e.slice(1))
      .join(' '),
  ];
});
