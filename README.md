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

The frontend expects an API backend through this environment variable:

```text
VITE_API_URL
```

Production API:

```text
https://mam-portfolio-api.mamduh2542.workers.dev
```

Local fallback, if `VITE_API_URL` is not set:

```text
/api
```

For Cloudflare Pages production, set:

```text
VITE_API_URL=https://mam-portfolio-api.mamduh2542.workers.dev
```

Important: Vite environment variables are baked into the frontend during build. After changing `VITE_API_URL`, redeploy the Pages project.

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

Required production environment variable:

```text
VITE_API_URL=https://mam-portfolio-api.mamduh2542.workers.dev
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
* `VITE_API_URL` is safe to expose because it is a public frontend API URL.
* JWT secrets, admin creation secrets, D1 IDs, and R2 credentials belong in the backend Worker configuration, not in this frontend repo.
* The admin area requires the backend Worker to be deployed and configured correctly.
