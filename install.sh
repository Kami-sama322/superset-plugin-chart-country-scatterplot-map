#!/usr/bin/env bash
# =============================================================================
#  Install Country Scatterplot Map chart plugin into Apache Superset 6.1.0
# =============================================================================
#
#  Usage:
#     ./install.sh <path-to-superset-root>
#
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
info()  { echo -e "${CYAN}ℹ️  $1${NC}"; }
ok()    { echo -e "${GREEN}✅ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

if [ "$#" -ne 1 ]; then
  error "Provide path to Superset repository root:"
  echo "   $0 ./superset"
  exit 1
fi
SUPERSET_DIR="$(cd "$1" && pwd)"
FRONTEND_DIR="$SUPERSET_DIR/superset-frontend"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_SRC_DIR="$SCRIPT_DIR/src"

PKG_DIR="$FRONTEND_DIR/plugins/plugin-chart-country-scatterplot-map"
EXTRA_FILE="$FRONTEND_DIR/src/setup/setupPluginsExtra.ts"

echo ""
echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN}  Country Scatterplot Map Chart Plugin → Apache Superset${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo ""

if [ ! -d "$FRONTEND_DIR" ]; then
  error "superset-frontend not found: $FRONTEND_DIR"
  exit 1
fi
if [ ! -d "$PLUGIN_SRC_DIR" ]; then
  error "Plugin sources not found: $PLUGIN_SRC_DIR"
  exit 1
fi

info "Step 0/2: copy package to $PKG_DIR"
mkdir -p "$PKG_DIR/src"
cp -r "$PLUGIN_SRC_DIR/." "$PKG_DIR/src/"
cp "$SCRIPT_DIR/package.json" "$PKG_DIR/package.json"
cp "$SCRIPT_DIR/tsconfig.json" "$PKG_DIR/tsconfig.json"
ok "Package copied (src/, package.json, tsconfig.json)"

if [ ! -f "$EXTRA_FILE" ]; then
  error "Extension file not found: $EXTRA_FILE"
  exit 1
fi

if grep -q "@superset-ui/plugin-chart-country-scatterplot-map" "$EXTRA_FILE"; then
  warn "Plugin import already present in $EXTRA_FILE"
else
  info "Step 1/2: register plugin in setupPluginsExtra.ts"
  sed -i "/^\/\/ For individual deployments to add custom overrides$/i import CountryScatterplotMapChartPlugin from '@superset-ui/plugin-chart-country-scatterplot-map';" "$EXTRA_FILE"
  ok "Import added"
fi

if grep -q "chart_country_scatterplot_map" "$EXTRA_FILE"; then
  warn "Plugin registration already present in $EXTRA_FILE"
else
  if grep -q "export default function setupPluginsExtra() {}" "$EXTRA_FILE"; then
    sed -i "s/export default function setupPluginsExtra() {}/export default function setupPluginsExtra() {\n  new CountryScatterplotMapChartPlugin().configure({ key: 'chart_country_scatterplot_map' }).register();\n}/" "$EXTRA_FILE"
  elif grep -q "export default function setupPluginsExtra() {" "$EXTRA_FILE"; then
    sed -i "/export default function setupPluginsExtra() {/a\\  new CountryScatterplotMapChartPlugin().configure({ key: 'chart_country_scatterplot_map' }).register();" "$EXTRA_FILE"
  else
    error "Could not find setupPluginsExtra() to patch — register manually."
    exit 1
  fi
  ok "Registration (configure + register) added"
fi

PKG_JSON="$FRONTEND_DIR/package.json"
PKG_NAME="@superset-ui/plugin-chart-country-scatterplot-map"
if [ -f "$PKG_JSON" ] && ! grep -q "$PKG_NAME" "$PKG_JSON"; then
  info "Step 2/2: add file: dependency to package.json"
  sed -i 's|"@superset-ui/plugin-chart-word-cloud": "file:./plugins/plugin-chart-word-cloud",|"@superset-ui/plugin-chart-word-cloud": "file:./plugins/plugin-chart-word-cloud",\n    "@superset-ui/plugin-chart-country-scatterplot-map": "file:./plugins/plugin-chart-country-scatterplot-map",|' "$PKG_JSON"
  if grep -q "$PKG_NAME" "$PKG_JSON"; then
    ok "package.json dependency added"
  else
    warn "Could not patch package.json — add the file: dependency manually"
  fi
else
  warn "package.json already lists $PKG_NAME"
fi

echo ""
echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN}Plugin installed.${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "  ${CYAN}1.${NC} cd superset-frontend && npm install"
echo -e "  ${CYAN}2.${NC} npm run dev-server"
echo -e "  ${CYAN}3.${NC} Charts → + Chart → Country Scatterplot Map"
echo -e "${GREEN}==============================================================${NC}"
