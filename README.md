# RETROCYCLES Leaderboard

## Project Structure

```
retrocycles-leaderboard/
├── app/                     # Next.js App Router routes
│   ├── page.tsx             # Hub page (/)
│   ├── leaderboard/page.tsx
│   ├── profile/page.tsx
│   ├── ranks/page.tsx
│   ├── mazing/page.tsx
│   ├── tutorials/page.tsx
│   ├── about/page.tsx
│   └── support/page.tsx
├── src/
│   ├── lib/rclApi.ts        # Typed RCL API adapter (/api/v1)
│   ├── leaderboard/          # Leaderboard React client component
│   ├── profile/              # Profile React client component
│   ├── ranks/                # Ranks React component
│   ├── mazing/               # Mazing React client component
│   ├── tutorials/            # Tutorials React client component
│   └── ui/                   # Shared UI (nav, beatstore mount)
├── styles.css               # Main site stylesheet (imported in app/globals.css)
├── beatstore-menu-widget.css
├── beatstore-menu-widget.js
├── vercel.json              # Next.js deployment config
└── Makefile                 # install/dev/build/start/check/clean/fresh helpers
```

