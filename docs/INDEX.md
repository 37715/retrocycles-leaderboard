# Documentation Index

## Frontend
- `leaderboard`: `app/leaderboard/page.tsx`, `src/leaderboard/LeaderboardApp.tsx`, `src/lib/rclApi.ts`
- `profile`: `app/profile/page.tsx`, `src/profile/ProfileApp.tsx`, `src/lib/rclApi.ts`
- `mazing`: `app/mazing/page.tsx`, `src/mazing/MazingPage.tsx`
- `ranks`: `app/ranks/page.tsx`, `src/ranks/RanksApp.tsx`
- `tutorials`: `app/tutorials/page.tsx`, `src/tutorials/TutorialsPage.tsx`
- `hub`: `app/page.tsx`, `src/hub/HubPage.tsx`

## Current Workstreams
- `nextjs-ts-cutover`: full App Router migration with TypeScript and strict `/api/v1` integration.

## Notes
- Runtime stack: `Next.js + TypeScript` with App Router.
- Build/dev tooling: `Makefile`, `package.json` scripts (`dev`, `build`, `start`, `check`).
- API handoff doc: `RCL_API.md` (standardized client contract for RCL backend routes).
- Runtime API source: strict `https://retrocyclesleague.com/api/v1` default via `src/lib/rclApi.ts` (override with `NEXT_PUBLIC_RCL_API_BASE`).
- Navigation menu runtime source: local React components in `src/ui/BeatstoreMenu.tsx` + `src/ui/StaggeredMenu.tsx` (no `/beatstore-menu-widget.js` script mount path).
- Current API behavior check: leaderboard route is live (`/leaderboard`); match-history route used by frontend (`/matches`) currently responds `404`.
