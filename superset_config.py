import os

from superset.config import TALISMAN_CONFIG as DEFAULT_TALISMAN_CONFIG

DEBUG = True
LOG_LEVEL = "DEBUG"

TEMPLATES_AUTO_RELOAD = True

ALLOWED_EXTENSIONS = {"csv", "tsv", "txt", "json"}
ALLOW_DATA_UPLOAD = True

ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": {"*": {"origins": "*"}},
}

PREVENT_UNSAFE_DB_CONNECTIONS = False

WTF_CSRF_ENABLED = False

FEATURE_FLAGS = {
    "ENABLE_TEMPLATE_PROCESSING": True,
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERING": True,
    "ENABLE_ADVANCED_DATA_TYPES": True,
    "ENABLE_EXPLORE_JSON_CSV": True,
    "ALLOW_DATA_UPLOAD": True,
}

SUPERSET_WEBSERVER_TIMEOUT = 300

# Country Scatterplot Map loads raster basemap tiles (OSM, Carto, Mapbox API).
# With DEBUG=True Superset applies TALISMAN_DEV_CONFIG — keep both in sync.
TALISMAN_ENABLED = True
TALISMAN_CONFIG = DEFAULT_TALISMAN_CONFIG.copy()

# Optional. Needed only for mapbox:// styles in Map Style control.
# OSM / tile:// basemaps work without a token.
MAPBOX_API_KEY="YOUR MAPBOX API KEY HERE"
MAP_TILE_ORIGINS = [
    "https://*.tile.openstreetmap.org",
    "https://*.openstreetmap.org",
    "https://*.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://*.basemaps.cartocdn.com"
]


def _extend_csp(directive: str, origins: list[str]) -> None:
    bucket = TALISMAN_CONFIG["content_security_policy"].setdefault(directive, [])
    for origin in origins:
        if origin not in bucket:
            bucket.append(origin)


_extend_csp("img-src", MAP_TILE_ORIGINS)
_extend_csp("connect-src", MAP_TILE_ORIGINS)

TALISMAN_DEV_CONFIG = {
    **TALISMAN_CONFIG,
    "content_security_policy": {
        **TALISMAN_CONFIG["content_security_policy"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    },
}

