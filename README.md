# Aviora Travista — website

A single-page, frontend-only site for Aviora Travista Holidays. Built with Vite, GSAP (with ScrollTrigger and MotionPath) and Lenis for smooth scrolling. The only server-side piece is the **Enquire Now** form, which posts to [Web3Forms](https://web3forms.com) and is emailed to the business.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the build locally
```

## Connect the enquiry form

1. Go to https://web3forms.com, enter `avioratravista@gmail.com` and copy the access key it emails you.
2. Copy `.env.example` to `.env` and paste the key into `VITE_WEB3FORMS_KEY=`.
3. On your host (Netlify, Vercel or Cloudflare Pages), add the same `VITE_WEB3FORMS_KEY` environment variable before building.

Until a key is set, the form validates input and then asks visitors to call or WhatsApp instead. Each enquiry arrives with the subject `New enquiry — <trip type> — <name>`. A hidden honeypot field filters out simple spam bots.

## Deploy

**GitHub Pages (current):** every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to https://vikasrangaswamy.github.io/aviora-travista/. To switch on the enquiry form there, add a repository secret named `WEB3FORMS_KEY` (Settings → Secrets and variables → Actions), then re-run the workflow.

**Any other static host** (Netlify, Vercel, Cloudflare Pages or a custom domain) works too. Use build command `npm run build` and publish directory `dist`, and leave `BASE_PATH` unset so the site is served from the root. If the address changes, update the `og:image` URL in `index.html`.

## Where things live

| Path | What it is |
|---|---|
| `index.html` | All page markup and copy (sections in page order) |
| `src/styles.css` | Design tokens and every style (dark theme, x.ai-inspired) |
| `src/main.js` | Hero video reel, scroll animations, tabs, packages, FAQ, modal |
| `src/data.js` | Editable content: reel clips, tour categories and venues, packages, client logos |
| `src/enquiry.js` | Enquiry form submission (Web3Forms) |
| `src/livemap.js`, `src/route.js` | Track My Tour map (MapLibre) and the real Bengaluru → Abbey Falls road route |
| `public/map` | Self-hosted map data: OpenStreetMap extract of southern Karnataka (`karnataka.pmtiles`), label fonts and map icons |
| `public/media/video` | Hero reel clips: 1920px desktop `*.mp4`, 720×1280 portrait `*-sm.mp4` for phones, and posters |
| `public/media/img` | Photos in WebP: full size, plus `-sm` thumbnails |
| `public/media/brand` | Logo, emblem and favicons |
| `public/media/clients` | Client logos |

### Changing content
- **Reel clips:** add `name.mp4` (1920px landscape), `name-sm.mp4` (720×1280 portrait for phones), plus `name.jpg` and `name-sm.jpg` posters to `public/media/video`, then add `{ key: 'name', place: '…', short: '…' }` to `reel` in `src/data.js`.
- **Venues and packages:** edit the arrays in `src/data.js`.
- **Phone numbers, email and address:** search `index.html` for `9686854872` and `avioratravista`.

## Track My Tour map

The live route map uses [MapLibre](https://maplibre.org) with a self-hosted [Protomaps](https://protomaps.com) extract of OpenStreetMap, so there is no map API key or tile bill. The map file is 8 MB, but browsers fetch only the parts in view (about 200–500 KB). The static host must support HTTP range requests (Netlify, Vercel and Cloudflare Pages all do). The map code loads only after the page has finished loading. If WebGL is unavailable, the original sketch map stays in place.

To regenerate the map file (for example, for a different region), install `pmtiles` (`brew install pmtiles`), then run:

```bash
pmtiles extract https://build.protomaps.com/<YYYYMMDD>.pmtiles public/map/karnataka.pmtiles --bbox=75.0,11.5,78.3,13.7 --maxzoom=11
```

The route in `src/route.js` came from the OSRM routing service and has been simplified. The OpenStreetMap credit in the map's corner is required by its licence, so keep it.

## Media credits

Photos are from Unsplash and video clips are from Pexels. Both licences allow free commercial use without attribution. Replace them with the client's own trip photos whenever possible. Original source IDs are listed in `media-sources.json`.

## Accessibility and performance
- Respects `prefers-reduced-motion`: there is no intro, the reel starts paused and scroll effects are turned off.
- The hero reel pauses when it is scrolled off-screen. Phones get portrait-cropped 720×1280 clips (1–2.4 MB each); desktop clips are 1920px (2.4–5.8 MB).
- Both the modal and the inline form are keyboard-accessible. Escape closes the modal and focus stays inside it while open.
