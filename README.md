# Mam Portfolio

Personal portfolio and project dashboard for Mamduh.

This project is more than a static portfolio. It is intended to become a small personal mission-control system for tracking finished work, active projects, experiments, games, and future focus areas.

The frontend is built with React and Vite, deployed on Cloudflare Pages, and connected to a Cloudflare Worker backend.

## Live Site

```text
https://mam-portfolio.pages.dev
```

## Tech Stack

* React
* Vite
* React Router
* Axios
* Cloudflare Pages
* Cloudflare Workers API
* Cloudflare D1
* Cloudflare R2

## Main Features

* Public portfolio homepage
* Profile page
* Projects page
* Games/projects filtering support
* Contact page
* Admin login
* Admin dashboard
* Admin project management
* Admin profile management
* Message management
* Upload support through the backend

## Routes

```text
/                  Home
/profile           Public profile
/projects          Public projects
/games             Public games
/contact           Contact page
/login             Admin login
/admin             Admin dashboard
/admin/projects    Manage projects
/admin/profile     Manage profile
/admin/messages    Manage contact messages
/admin/uploads     Upload assets
```

## Backend

The frontend calls the API through the same-origin Pages Function proxy:

```text
/api
```

Production builds should not set `VITE_API_URL` to the backend Worker URL. If `VITE_API_URL` is unset, the app uses `/api`.

The Pages Function proxy needs these Cloudflare Pages environment variables:

```text
API_ORIGIN=<backend Worker origin>
API_PROXY_SECRET=<long random secret>
```

`API_PROXY_SECRET` is server-side only. Do not prefix it with `VITE_`.

Local development can still point directly at a local Worker if needed:

```text
VITE_API_URL=http://localhost:8787
```

Important: Vite environment variables are baked into the frontend during build. Keep production API routing on `/api` unless you intentionally want the browser bundle to contain a public API origin.

## Pages Function Proxy

The project includes:

```text
functions/api/[[path]].js
public/_routes.json
```

Requests such as `/api/projects?type=game` are proxied server-side to `${API_ORIGIN}/projects?type=game`. Browser Network requests still show `/api/...`; the proxy hides the backend Worker origin and adds the internal proxy secret before forwarding.

## Local Development

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.example .env.local
```

Or manually create `.env.local`:

```text
VITE_API_URL=http://localhost:8787
```

Run the development server:

```bash
npm run dev
```

Default local frontend URL:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Cloudflare Pages Deployment

Build command:

```bash
npm run build
```

Build output directory:

```text
dist
```

Required production environment variables:

```text
API_ORIGIN=<backend Worker origin>
API_PROXY_SECRET=<same value as backend PROXY_SHARED_SECRET>
```

## SPA Routing

This project uses React Router. Cloudflare Pages must serve `index.html` for frontend routes such as `/projects`, `/login`, and `/admin`.

The project includes:

```text
public/_redirects
```

With:

```text
/* /index.html 200
```

## Notes

* Do not commit real secrets.
* Do not expose `API_PROXY_SECRET` through Vite or any `VITE_` variable.
* JWT secrets, admin creation secrets, D1 IDs, and R2 credentials belong in the backend Worker configuration, not in this frontend repo.
* The admin area requires the backend Worker to be deployed and configured correctly.
