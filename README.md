# Mam Portfolio

Small React + Vite frontend for a personal portfolio site backed by an API.

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.

## Environment

Create a `.env` file with:

```env
VITE_API_URL=http://localhost:4000
```

## Current Structure

- `src/components` contains shared layout and presentation components.
- `src/hooks` contains reusable hooks for API fetching and visit logging.
- `src/pages` contains route-level screens.
- `src/services` contains API helpers.

## Notes

- The frontend expects endpoints such as `/profile`, `/projects`, `/visit`, and `/messages`.
- If you run this in Docker with a separate backend container, do not use `localhost` for the API URL unless the API is inside the same container.
