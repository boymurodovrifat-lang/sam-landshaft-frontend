# Sam-Landshaft Frontend

React + Vite + TypeScript + Tailwind + Leaflet frontend for Sam-Landshaft geoportali.

## Features

- Interactive Leaflet map of Samarkand region
- Category and year selector
- COG layer overlay (via `georaster-layer-for-leaflet`)
- Admin panel (upload, categories, files)
- Download GeoTIFF / JPG

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Environment

- `VITE_API_URL` — backend base URL, defaults to `http://localhost:3000/api`

## Routes

- `/` — Public map portal
- `/admin/login` — Admin login
- `/admin` — Admin dashboard
- `/admin/categories` — Manage categories
- `/admin/files` — GeoTIFF files list
- `/admin/upload` — Upload new GeoTIFF
