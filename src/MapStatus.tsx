import type { CSSProperties, ReactNode } from 'react';
import { t } from '@apache-superset/core/translation';

type Kind = 'warning' | 'danger' | 'info';

type MapStatusProps = {
  kind: Kind;
  children: ReactNode;
  style?: CSSProperties;
  role?: 'alert' | 'status';
};

export function MapStatus({ kind, children, style, role }: MapStatusProps) {
  const liveRole = role ?? (kind === 'danger' ? 'alert' : 'status');
  return (
    <div className={`alert alert-${kind}`} role={liveRole} style={style}>
      {children}
    </div>
  );
}

type MapboxStyleWarningProps = {
  keyMissing: boolean;
  tilesFailed: boolean;
};

export function MapboxStyleWarning({
  keyMissing,
  tilesFailed,
}: MapboxStyleWarningProps) {
  if (!keyMissing && !tilesFailed) {
    return null;
  }
  const message = keyMissing
    ? t(
        'MAPBOX_API_KEY is missing. Mapbox styles cannot load until it is set in Superset config.',
      )
    : t(
        'Mapbox style could not be loaded as raster tiles. Use a public style, or a token that belongs to the style owner.',
      );
  return (
    <MapStatus kind="warning" role="alert" style={{ margin: 0 }}>
      {message}
    </MapStatus>
  );
}
