# Folio portfolio generator

A role-based portfolio builder with a React, Tailwind CSS, and Vite frontend; a Flask REST API; and a SQLite database.

## Requirements

- Python 3.10+
- Node.js 18+

## Run locally

1. Start the Flask API:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python app.py
   ```

2. In another terminal, start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

The SQLite database is created automatically as `backend/instance/portfolios.db`. Set `DATABASE_URL` to use another SQLAlchemy-supported database. The API provides `GET /api/roles`, `POST /api/portfolios` to generate, `POST /api/portfolios/save` to move a generated portfolio into the library, `GET /api/portfolios/usage`, and authenticated portfolio list, read, and delete endpoints.

The builder has five visually distinct job-role designs: terminal-inspired software developer, editorial UI/UX designer, analytics dashboard, campaign-style marketing manager, and a product roadmap layout. Add an optional phone number for a clickable phone link in the portfolio contact section. To include a project, provide both its title and description; incomplete project entries are flagged rather than silently omitted. Fill in your details and choose **Preview portfolio** to inspect a preview without using a generation. Choose **Generate portfolio** to create a portfolio and use one generation; it appears in the preview but is not saved to the library unless you choose **Move to my library**.

After reviewing the preview, choose **Download HTML + CSS + JS** to download a ZIP containing `index.html`, `style.css`, and `script.js`. Extract the ZIP and open `index.html` in a browser to view the standalone portfolio.

New users provide their first and last name when creating an account; returning users only need their email and password to sign in. Use the profile button in the navigation to edit the name shown alongside the first-initial avatar. Passwords are stored as hashes, sessions use HTTP-only cookies, and each signed-in user's **My library** page lists only that user's saved portfolios. Each account can generate up to five portfolios; the builder shows the generation count, and the server enforces the limit. Generation usage is retained separately from the library, so deleting one or all saved portfolios does not restore used generations. In the library, use **Delete** on a portfolio to remove it individually or **Delete all** to clear the library; both actions ask for confirmation. For deployment, set `APP_ENV=production`, provide a strong random `SECRET_KEY`, and set `COOKIE_SECURE=true` when serving over HTTPS. The default development secret is for local use only.

## Deploy to Vercel

This repository is configured as **one Vercel project** rooted at the repository root. Vercel runs the Flask application as a Python Function and serves the Vite build from the root `public/` directory. The frontend calls `/api/...` on the same origin, so no frontend API URL or cross-origin service binding is needed.

1. Import this repository into Vercel and set **Root Directory** to the repository root (`.`), not `frontend` or `backend`.
2. Leave the build and output settings to `vercel.json`: it installs the frontend lockfile, builds Vite into `public/`, and declares that directory as the static output.
3. Add a persistent PostgreSQL database and configure these Vercel environment variables for **Production**, **Preview**, and **Development** as appropriate:
   - `APP_ENV=production`
   - `SECRET_KEY`: a long, unique random value; generate it outside the frontend and do not commit it.
   - `COOKIE_SECURE=true`
   - `DATABASE_URL`: the database connection string in `postgresql://` or `postgresql+psycopg://` form.
4. Redeploy after setting the variables.

Vercel's function filesystem is not a persistent database, so production startup rejects a missing or SQLite `DATABASE_URL`. The existing local SQLite database is for development and is not automatically copied into the hosted PostgreSQL database. If you need its records in production, migrate them separately before switching users to the deployed app.

The root `app.py` exposes the existing Flask app to Vercel without moving the backend source. `requirements.txt` makes the backend dependencies available to the Python runtime; `frontend/vite.config.js` keeps the local `/api` development proxy and writes production assets to `public/`. There is no separate backend service or public backend URL in this architecture.
