/**
 * Light barrel for mission helpers.
 *
 * This module must NEVER statically re-export the seed catalogue — the store
 * code-splits `catalog.ts` so the 40 missions load after first paint. Pages
 * get the catalogue via `useMissions()` from `../../store/app`.
 */
export * from './pure'
