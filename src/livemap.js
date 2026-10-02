// Real map for "Track My Tour": MapLibre + a self-hosted Protomaps (OpenStreetMap)
// extract of southern Karnataka, so no API key or tile service is needed.
// Loaded on demand from main.js; exposes the same view API as the SVG fallback.
import * as maplibregl from 'maplibre-gl';
// bundle MapLibre's worker with Vite (its default URL lookup breaks once bundled)
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { routeLegs, routeStops } from './route.js';

const BUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 18v3M16 18v3"/></svg>';
// which side each stop's label sits on, so close stops (Madikeri / Abbey Falls) don't collide
const LABEL_SIDE = ['top', 'left', 'top', 'bottom', 'left'];

// Web Mercator, so distances match MapLibre's line-progress along the route
const merc = ([lng, lat]) => [lng / 360 + 0.5, 0.5 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / (2 * Math.PI)];

function flavor() {
  const f = namedFlavor('dark');
  return {
    ...f,
    background: '#0B0D10', earth: '#111317',
    water: '#0F2A44',
    park_a: '#11261B', park_b: '#132A1E', wood_a: '#10251A', wood_b: '#12291D', scrub_a: '#141F17', scrub_b: '#152118',
    landcover: { ...f.landcover, forest: '#0F2419', grassland: '#132019', farmland: '#131B16', scrub: '#141D16', urban_area: '#1A1B1F', barren: '#18191A' },
    highway: '#5A5F66', highway_casing_early: '#0B0D10', highway_casing_late: '#0B0D10',
    major: '#3C4046', minor_a: '#26292E', minor_b: '#26292E',
    railway: '#2E3238', boundaries: '#3A3F46',
    city_label: '#A6ACB4', city_label_halo: '#0B0D10', subplace_label: '#6E747C', subplace_label_halo: '#0B0D10',
    state_label: '#4E545C', state_label_halo: '#0B0D10', roads_label_major: '#6E747C', roads_label_major_halo: '#0B0D10',
  };
}

export async function createMapView(container, { padding }) {
  maplibregl.setWorkerUrl(workerUrl);
  const proto = new Protocol();
  maplibregl.addProtocol('pmtiles', proto.tile);

  const base = layers('protomaps', flavor(), { lang: 'en' });
  // our own stop markers carry these names, so drop the duplicate basemap labels
  const ours = ['Bengaluru', 'Bangalore', 'Mysuru', 'Mysore', 'Kushalnagar', 'Kushalnagara', 'Kushalanagara', 'Madikeri', 'Mercara'];
  const loc = base.find((l) => l.id === 'places_locality');
  if (loc) loc.filter = ['all', ['==', ['get', 'kind'], 'locality'], ['!', ['in', ['coalesce', ['get', 'name:en'], ['get', 'name']], ['literal', ours]]]];

  // whole route + where each leg starts/ends as a fraction of its length
  const coords = routeLegs.flatMap((l, i) => (i ? l.slice(1) : l));
  const m = coords.map(merc);
  const cum = [0];
  for (let i = 1; i < m.length; i++) cum.push(cum[i - 1] + Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]));
  const total = cum[cum.length - 1];
  let idx = 0;
  const legFrac = routeLegs.map((l) => { const a = cum[idx] / total; idx += l.length - 1; return [a, cum[idx] / total]; });
  const pointAt = (f) => {
    const d = f * total;
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
    const k = (d - cum[lo]) / (cum[hi] - cum[lo] || 1);
    return [coords[lo][0] + (coords[hi][0] - coords[lo][0]) * k, coords[lo][1] + (coords[hi][1] - coords[lo][1]) * k];
  };
  const boundsOf = (pts) => pts.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]));
  const all = boundsOf(coords);
  // absolute URL of the site root (works under a sub-path such as /aviora-travista/)
  const root = new URL(import.meta.env.BASE_URL, window.location.href).href;

  const map = new maplibregl.Map({
    container,
    style: {
      version: 8,
      glyphs: `${root}map/fonts/{fontstack}/{range}.pbf`,
      sprite: `${root}map/sprites/dark`,
      sources: { protomaps: { type: 'vector', url: `pmtiles://${root}map/karnataka.pmtiles`, attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a> · <a href="https://protomaps.com" target="_blank" rel="noopener">Protomaps</a>' } },
      layers: base,
    },
    bounds: all, fitBoundsOptions: { padding: padding() },
    maxBounds: [[74.4, 11.0], [78.9, 14.2]], minZoom: 6, maxZoom: 13,
    attributionControl: { compact: true }, cooperativeGestures: true,
    dragRotate: false, pitchWithRotate: false, touchPitch: false, fadeDuration: 0,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  await new Promise((res, rej) => { map.once('load', res); map.once('error', (e) => rej(e.error || e)); });

  map.addSource('route', { type: 'geojson', lineMetrics: true, data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } } });
  map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#000', 'line-opacity': 0.55, 'line-width': 10 } });
  map.addLayer({ id: 'route-ahead', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#8A9099', 'line-opacity': 0.7, 'line-width': 2.5, 'line-dasharray': [0.6, 2.2] } });
  map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': 14, 'line-blur': 8, 'line-opacity': 0.35, 'line-gradient': '#fff' } });
  map.addLayer({ id: 'route-done', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': 4.5, 'line-gradient': '#fff' } });

  const stopEls = routeStops.map((s, i) => {
    const el = document.createElement('div');
    el.className = `gl-stop side-${LABEL_SIDE[i]}`;
    el.innerHTML = `<i></i><span>${s.name}</span>`;
    new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(s.lngLat).addTo(map);
    return el;
  });
  const coachEl = document.createElement('div');
  coachEl.className = 'gl-coach';
  coachEl.innerHTML = `<span class="gl-coach-pulse"></span><span class="gl-coach-dot">${BUS}</span>`;
  const coach = new maplibregl.Marker({ element: coachEl, anchor: 'center' }).setLngLat(coords[0]).addTo(map);

  // the visitor takes over the camera for a while after panning/zooming
  let userAt = 0;
  const USER = ['wheel', 'mousedown', 'pointerdown', 'touchstart', 'keydown', 'dblclick'];
  map.on('movestart', (e) => { if (USER.includes(e.originalEvent?.type)) userAt = Date.now(); });
  const userBusy = () => Date.now() - userAt < 12000;
  const fit = (b, opts = {}) => { if (!userBusy()) map.fitBounds(b, { padding: padding(), maxZoom: 11, duration: 1800, essential: true, ...opts }); };
  window.addEventListener('resize', () => { if (!userBusy()) map.fitBounds(all, { padding: padding(), duration: 0 }); });

  const done = (f) => ['step', ['line-progress'], '#ffffff', Math.min(Math.max(f, 0.00001), 1), 'rgba(255,255,255,0)'];
  return {
    map,
    reset() { this.progress(0, 0); },
    progress(i, t) {
      const [a, b] = legFrac[i];
      const f = a + (b - a) * t;
      map.setPaintProperty('route-done', 'line-gradient', done(f));
      map.setPaintProperty('route-glow', 'line-gradient', done(f));
      coach.setLngLat(pointAt(f));
    },
    arrive(i) {
      stopEls.forEach((el, j) => { el.classList.toggle('is-on', j <= i); el.classList.toggle('is-current', j === i); });
    },
    focus(i) { fit(boundsOf(routeLegs[i])); },
    overview(instant) { fit(all, { duration: instant ? 0 : 1800, maxZoom: 13 }); },
  };
}
