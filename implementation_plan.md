# Performance Improvement Plan

## Goal
Improve page load speed of the AWT Learning Platform and provide a better perceived performance using skeleton loaders. Add backend caching mechanisms to reduce DB load.

## User Review Required
None – plan approved by user.

## Proposed Changes
---
### Frontend (Next.js)
- **Image Optimization**: Replace `<img>` tags with `next/image` component; configure `next.config.ts` for remote image domains and enable AVIF/WebP.
- **Code Splitting / Dynamic Imports**: Use `next/dynamic` for heavy components (e.g., `AnalyticsCharts`, `QASection`).
- **Lazy Loading Data**: Switch data fetching to `SWR` (or React Query) with built‑in caching and revalidation.
- **Skeleton Loader Component**: Add a reusable `SkeletonLoader.tsx` component in `src/components` and use it in pages that fetch data (`courses`, `dashboard`, `course detail`).
- **Prefetching & Link Optimization**: Add `prefetch` on `<Link>` components for next routes.
- **CSS & Bundle Optimization**: Enable `next-purgecss` (or built‑in CSS minification), remove unused Tailwind/utility classes, and set `output: "standalone"` for smaller bundles.
- **Compression**: Ensure server sends gzip/brotli (`next.config.ts` `compress: true`).
- **Static Generation**: Where possible, convert pages to `getStaticProps`/`getStaticPaths` (e.g., public course listings) to serve pre‑rendered HTML.

---
### Backend (FastAPI)
- **Redis Cache Layer**: Add `redis` (or `aioredis`) dependency. Create a `cache.py` utility with `@lru_cache` for config and `async_get/set` helpers.
- **Cache DB Queries**: Wrap expensive queries (e.g., fetching courses, stats) with cache keys and TTL (e.g., 60 s).
- **Cache‑Control Headers**: Add middleware to set `Cache‑Control` for static endpoints (`/static/*`).
- **Response Compression**: Enable `GZipMiddleware` in FastAPI.
- **Rate‑Limiter Storage**: Ensure limiter uses Redis (already supported via `UPSTASH_REDIS_URL`).
- **CDN for Static Assets**: Serve frontend build assets via a CDN (e.g., Vercel/Cloudflare) – configure `next.config.ts` `assetPrefix`.

---
## Verification Plan
### Automated Tests
- Run `npm run build && npm start` and measure bundle size (`next build` output).
- Use `curl -I` on API endpoints to verify `Cache‑Control` and `Content‑Encoding` headers.
- Unit test cache wrapper by calling the same endpoint twice and confirming the DB query log runs only once.

### Manual Verification
- Open the site in Chrome DevTools → Network, check that images are served as WebP/AVIF and that skeleton loaders appear while data loads.
- Observe `Time to First Byte (TTFB)` improvement on API calls.
- Verify page load times drop (target < 1 s for main pages).

---
## Open Questions
> [!NOTE] No open questions – user approved the plan.

---
## Implementation Tasks
- [ ] Create `SkeletonLoader.tsx` component.
- [ ] Refactor `CourseCard` and other data‑heavy pages to use SWR with skeleton fallback.
- [ ] Add dynamic imports for heavy charts.
- [ ] Update `next.config.ts` for image optimization, compression, and asset prefix.
- [ ] Install `redis` and create `backend/app/cache.py`.
- [ ] Wrap course list endpoint with cache.
- [ ] Add `GZipMiddleware` to FastAPI app.
- [ ] Test and verify.
