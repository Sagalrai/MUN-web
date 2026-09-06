# QRMUN Deployment

Deploy the frontend and backend as separate services.

## Backend

Use Node.js 20 or newer.

Build/start commands:

```text
Build: npm install
Start: npm start
```

Required backend environment variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://your-frontend-domain.example
JWT_SECRET=use-a-long-random-secret
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=use-a-one-time-seed-password
```

Set `FRONTEND_URL` to the exact deployed frontend origin. Multiple origins can be comma-separated.

Run `npm run seed` once after configuring MongoDB to clear delegate/volunteer records and create or update the admin account. This command is destructive for people records and should not be part of an automatic deploy command.

Health check:

```text
GET /api/health
```

The backend binds to `0.0.0.0` and respects the platform-provided `PORT`.

## Frontend

Set the API URL before building:

```env
VITE_API_URL=https://your-backend-domain.example/api
```

Build/start commands:

```text
Build: npm install && npm run build
Preview: npm run preview
```

Deploy the generated `frontend/dist` directory to a static host. `vercel.json` and `public/_redirects` are included so BrowserRouter deep links resolve to `index.html`.

## Security

- Never commit `.env` files.
- Use a unique production `JWT_SECRET`.
- Use a strong production admin password and rotate the development password.
- Restrict the MongoDB Atlas network access list to trusted deployment services where possible.
- Do not run `npm run seed` against production data unless clearing people records is intentional.
