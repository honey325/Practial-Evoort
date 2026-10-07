# Bookly frontend

React + Vite frontend for the Express API.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if needed.
2. Run `npm install`.
3. Run `npm run dev`.

Allow the frontend origin in the backend's `CORS_ORIGINS` setting. The default backend origin is `http://localhost:3000`; Vite runs at `http://localhost:5173`.

## Structure

- `src/app` - application routes and composition
- `src/features/auth` - authentication screens, API calls, and role routing
- `src/features/admin` - admin screens
- `src/features/business-owner` - business owner screens
- `src/features/staff` - staff screens
- `src/features/customer` - customer screens
- `src/shared/components` - reusable UI components
- `src/shared/services` - API client and shared integrations

The API sets an HTTP-only `accessToken` cookie. Requests include credentials. Public registration supports customers and business owners, matching the backend.

The `SUPER_ADMIN` workspace is available at `/admin` and includes overview, businesses, plans and subscriptions, categories, users, and reports.
