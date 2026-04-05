# PureGym Dashboard

**Live site:** [puregym-dashboard.vercel.app](https://puregym-dashboard.vercel.app/)

A personal, unofficial PureGym dashboard built with Next.js. Live gym occupancy, visit history, membership details — all in a clean UI.

**Your credentials never leave your machine.** Email and PIN are stored in `localStorage` and sent only to the Next.js API route, which proxies them directly to PureGym's API. Nothing is persisted server-side.

---

## Features

- **Live occupancy** — real-time people in gym + classes, with max capacity
- **Visit stats** — all-time visits & gym time, this week at a glance
- **Full visit history** — every session with date, gym, and duration
- **Member & membership info** — plan, payment day, freeze status
- **Home gym details** — address, open/closed status, phone
- **Credential gate** — enter email + PIN once; stored locally in `localStorage`; sign out anytime

---

## How it works

```
Browser (localStorage: email + PIN)
       ↓  POST /api/data on every fetch
Next.js API Route  ←  stateless, no storage
       ↓  authenticates + proxies
PureGym API (capi.puregym.com)
```

The API route authenticates with PureGym on every request using the credentials passed from the browser, fetches all data in parallel, and returns it. It holds nothing in memory between requests.

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter your PureGym email and PIN, and you're in.

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aligajani/puregym-dashboard)

Since there are no environment variables or server-side state, it deploys out of the box. Each visitor uses their own credentials stored in their own browser.

---

## Stack

- **Next.js 16** — App Router, API routes as serverless proxy
- **TypeScript** — fully typed API responses
- **Tailwind CSS v4** — utility base, mostly inline styles for the dark theme
