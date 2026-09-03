# Country Scatterplot Map Chart Plugin — Apache Superset chart

> **A custom Apache Superset plugin** that combines **Country Map** choropleth
> region coloring with **Scatter Plot** bubbles at latitude/longitude centers.

---

## Features

- Dashboard chart (not a Native Filter)
- Dashboard cross-filters: click a region (or bubble) to filter other charts by **Entity**; click again to clear. Selected region gets a bold outline and the map zooms to it. Incoming filters from other charts on any same-dataset column (region, macroregion, …) outline and zoom to all remaining regions after the filter
- Regions colored by metric via **Linear Color Scheme** (like Country Map)
- Bubbles at region centers: **auto** from map GeoJSON by ISO code (like World Map), or optional **Longitude / Latitude** columns for custom position
- Bubble size from **Metric** with **Minimum Radius**, **Maximum Radius**, **Multiplier**
- Bubble color: fixed palette (white, crimson, blue, gold, …) or linear gradient (same as regions)
- **Customize tooltips template** (Handlebars, like Deck.gl Scatter)
- Reuses `@superset-ui/legacy-plugin-chart-country-map` GeoJSON maps

---

![Example](./images/chart_example.gif)

## Requirements

| Component | Version |
|-----------|---------|
| Apache Superset | 6.1.0 |
| Python | 3.10+ |
| Node.js | 20+ (image build: 22) |
| npm | 10+ |
| React (peer) | ^17.0.2 |
| npm package | `@superset-ui/plugin-chart-country-scatterplot-map` |
| Plugin key | `chart_country_scatterplot_map` |

---

## Installation

### Step 1. Clone the Superset repository (target version)

[![Version](./images/tag.png)](https://github.com/apache/superset/releases/tag/6.1.0)

```bash
git clone https://github.com/apache/superset.git -b 6.1.0;
```

### Step 2. Clone the plugin repository

```bash
git clone https://github.com/Kami-sama322/superset-plugin-chart-country-scatterplot-map.git;
```

### Step 3. Run the auto-installation script

```bash
chmod +x superset-plugin-chart-country-scatterplot-map/install.sh;
./superset-plugin-chart-country-scatterplot-map/install.sh ./superset;
```

> `./superset` — root of the Superset repo from Step 1. The script installs the plugin as a **standalone npm package** into `superset-frontend/plugins/plugin-chart-country-scatterplot-map/` and registers it in `setupPluginsExtra.ts` (`key: chart_country_scatterplot_map`).

#### What the script does:

| Action | File |
|--------|------|
| 0. Installs the plugin package | `superset-frontend/plugins/plugin-chart-country-scatterplot-map/` |
| 1. Registers the plugin | `superset-frontend/src/setup/setupPluginsExtra.ts` |

> The `@superset-ui/plugin-chart-*` path alias already covers this package — no extra `tsconfig.json` entry.

---

### Step 4b. Manual plugin registration (if install.sh fails)

#### 1. Copy the package into the plugins folder

```bash
mkdir -p superset-frontend/plugins/plugin-chart-country-scatterplot-map/src
cp -r superset-plugin-chart-country-scatterplot-map/src/. superset-frontend/plugins/plugin-chart-country-scatterplot-map/src/
cp superset-plugin-chart-country-scatterplot-map/package.json superset-frontend/plugins/plugin-chart-country-scatterplot-map/package.json
cp superset-plugin-chart-country-scatterplot-map/tsconfig.json superset-frontend/plugins/plugin-chart-country-scatterplot-map/tsconfig.json
```

#### 2. Register in `superset-frontend/src/setup/setupPluginsExtra.ts`

```typescript
import CountryScatterplotMapChartPlugin from '@superset-ui/plugin-chart-country-scatterplot-map';

export default function setupPluginsExtra() {
  new CountryScatterplotMapChartPlugin()
    .configure({ key: 'chart_country_scatterplot_map' })
    .register();
}
```

Then run `npm install` and `npm run dev-server`.

---

## Deploy Superset in DEV mode

### Step 5. Python environment

```bash
cd superset
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/development.txt
```

### Step 6. Configuration (Talisman / map tiles)

Copy or symlink `superset_config.py` from this repo into the Superset root, or set:

```bash
export SUPERSET_CONFIG_PATH=/path/to/superset-plugin-chart-country-scatterplot-map/superset_config.py
```

The chart loads **raster basemap tiles** (OpenStreetMap, Carto, Mapbox API).
Talisman CSP must allow them in `img-src` and `connect-src`.

With `DEBUG=True`, Superset uses **`TALISMAN_DEV_CONFIG`**, not `TALISMAN_CONFIG` —
the sample config extends Superset defaults and keeps both aligned.

Optional Mapbox styles (`mapbox://styles/...` in **Map Style**) in `superset_config.py`:

```bash
MAPBOX_API_KEY="YOUR MAPBOX API KEY HERE"
```

OSM / `tile://…` styles work without a token.

### Step 7–10. Database and admin

```bash
superset db upgrade
superset fab create-admin \
  --username admin --firstname Admin --lastname User \
  --email admin@example.com --password admin
superset init
```

### Step 11–13. Backend and frontend

```bash
# terminal 1 — backend
superset run -h 0.0.0.0 -p 8088 --with-threads --reload --debugger

# terminal 2 — frontend (after install.sh + npm install in superset-frontend)
cd superset-frontend
npm install
npm run dev-server
```

---

## Quick start with Docker

This repo ships a self-contained stack: `Dockerfile` builds Superset **6.1.0**
with the plugin baked in; `docker-compose.yml` runs it with `superset_config.py`
(CSP for map tiles) mounted read-only.

**Requirements:** Docker, Docker Compose v2, ~8 GB RAM for the frontend build. \
**Optional:** Mapbox raster styles in chart controls in `superset_config.py` set `MAPBOX_API_KEY="YOUR MAPBOX API KEY HERE"`

```bash
git clone https://github.com/Kami-sama322/superset-plugin-chart-country-scatterplot-map.git
cd superset-plugin-chart-country-scatterplot-map

docker compose build    # first run: clones Superset 6.1.0 + npm run build (15–40 min)
docker compose up -d    # init DB, admin admin/admin, load-examples on first start
```

Open **http://localhost:8088** → login **admin** / **admin**.

On first start the container runs `superset db upgrade`, creates the admin user,
and loads example datasets (1–3 minutes). Later starts skip init if the volume
exists.

**Reset environment** (fresh DB and examples):

```bash
docker compose down -v
docker compose up -d
```

**Verify the plugin:** Charts → + Chart → **Country Scatterplot Map**.

Default **Map Style** uses OpenStreetMap tiles — no Mapbox token required.
If polygons show but the basemap is blank, check browser devtools for CSP
blocks and compare with [`superset_config.py`](./superset_config.py).

---

## How to use the chart

1. **Charts → + Chart → Country Scatterplot Map**
2. Dataset with columns:
   - **ISO 3166-2 Codes** (e.g. `RU-MOW`, `RU-SPE`, `RU-SVE`)
   - **Metric** (numeric, drives region color and bubble size)
   - *(optional)* **Longitude** and **Latitude** — only if you need a custom bubble position; otherwise centers are computed from the region polygon
3. Select **Country** (e.g. Russia)
4. **Map Options**: Linear Color Scheme, Number format
5. **Bubbles**: Min/Max radius, Multiplier, bubble color mode
6. Optional: **Tooltip contents** + **Customize tooltips template** (Handlebars)
7. **Map Style**: OSM, `tile://…`, or `mapbox://styles/{user}/{styleId}`

`mapbox://` styles are loaded as Mapbox raster tiles. The style must be
**public**, or `MAPBOX_API_KEY` must belong to the style owner. A token
from another account returns 401 and only polygons are visible.

### Example dataset shape

| iso_code | metric |
|----------|--------|
| RU-MOW | 1200 |
| RU-SPE | 980 |
| RU-SVE | 450 |

With optional custom centers:

| iso_code | metric | lon | lat |
|----------|--------|-----|-----|
| RU-MOW | 1200 | 37.62 | 55.75 |

### Handlebars tooltip example

```handlebars
<strong>{{region_name}}</strong><br/>
{{metric_formatted}}<br/>
{{longitude}}, {{latitude}}
```

---

## Package layout

```
superset-plugin-chart-country-scatterplot-map/
├── README.md
├── README_RU.md
├── src/
│   ├── index.ts
│   ├── CountryScatterplotMap.tsx
│   ├── mapData.ts              # GeoJSON enrich, bubbles, color scales
│   ├── mapLayers.ts            # deck.gl layers
│   ├── useCountryGeoJson.ts    # GeoJSON fetch hook
│   ├── useChartTooltip.tsx
│   ├── MapStatus.tsx
│   ├── buildQuery.ts
│   ├── controlPanel.ts
│   ├── transformProps.ts
│   ├── types.ts
│   ├── mapConfig.ts
│   ├── tooltipUtils.ts
│   ├── controls/
│   └── images/thumbnail.png
├── package.json
├── install.sh
├── Dockerfile                  # Superset 6.1.0 + plugin production build
├── docker-compose.yml          # Local demo stack
└── superset_config.py          # Dev/Docker config (Talisman + MAPBOX_API_KEY)
```

---

## License

Apache License 2.0 (same as Superset)
