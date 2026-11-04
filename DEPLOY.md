# Deploying ExploreSouth

Backend (Django + PostgreSQL) on **Render**, frontend (React) on **Vercel**, photos on **Cloudinary**.
Do the steps in this order, because each one gives you an address the next one needs.

## 0. Before the first push (once, on your computer)

Create the database migration files and commit them, so Render builds exactly what you tested:

```bash
cd backend
python manage.py makemigrations users destinations attractions reviews favorites itineraries expenses bookings contact
python manage.py migrate
```

Then, from the main folder (the one holding `frontend`, `backend` and `render.yaml`):

```bash
git add .
git status        # there must be no .env, node_modules or venv in this list
git commit -m "Ready for deployment"
git push
```

## 1. Cloudinary (photo storage)

Render wipes uploaded files on every deploy, so photos go to Cloudinary instead.

1. Sign up free at cloudinary.com.
2. On the dashboard, copy the **API environment variable**. It looks like
   `cloudinary://123456789:abcDEF@your-cloud-name`. This is your `CLOUDINARY_URL`.

## 2. Render (backend)

1. render.com > **New** > **Blueprint** > pick your GitHub repo. Render reads `render.yaml` and creates the
   API and the database.
2. When asked, fill in the variables marked "sync: false":
   - `CLOUDINARY_URL`: from step 1
   - `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (Gmail app password), `CONTACT_RECEIVER_EMAIL`
   - `CORS_ALLOWED_ORIGINS` and `SITE_URL`: leave empty for now, you fill them in at step 4
3. Wait for the build. Your API address is shown at the top, like `https://exploresouth-api.onrender.com`.
   Open `https://exploresouth-api.onrender.com/api/states/` to check that it answers.

## 3. Vercel (frontend)

1. vercel.com > **Add New** > **Project** > import the same GitHub repo.
2. **Root Directory:** `frontend`. Framework preset: Vite (detected automatically).
3. **Environment Variables:** add `VITE_API_URL` = `https://exploresouth-api.onrender.com/api`
   (your Render address plus `/api`, no trailing slash).
4. Deploy. You get an address like `https://exploresouth.vercel.app`.

## 4. Connect the two

Back in Render > your service > **Environment**:

- `CORS_ALLOWED_ORIGINS` = `https://exploresouth.vercel.app` (your Vercel address, no trailing slash)
- `SITE_URL` = the same Vercel address
- Optional: `CORS_ALLOWED_ORIGIN_REGEX` = `^https://exploresouth.*\.vercel\.app$` to also allow Vercel preview links.

Save. Render redeploys automatically.

## 5. Create your admin account and sample data

Free Render services have no shell, so run these on your own computer, pointed at the Render database.
In the Render dashboard open the database and copy its **External Database URL**.

PowerShell (Windows):

```powershell
cd backend
$env:DATABASE_URL="PASTE_EXTERNAL_DATABASE_URL_HERE"
python manage.py createsuperuser
python manage.py seed_data
python manage.py set_role YOUR_USERNAME admin
```

`set_role` makes that account an admin, so the React admin area (`/admin`) lets you in.

Then log in on your Vercel site and open `/admin`. Upload banners and state photos from **Admin > Banners**.

## Things to know

- **Free Render services sleep** after about 15 minutes without visitors. The first request afterwards takes
  up to a minute. Upgrade the plan, or ping the site, if that bothers you.
- **The free Render database is temporary.** Render deletes it after a limited time (check their current
  terms). For something long-lived use a paid plan, or a free database from Neon or Supabase: create it there,
  copy its connection string and set it as `DATABASE_URL` on Render (remove the database from `render.yaml`).
- **Never commit `.env`.** All secrets live in the Render and Vercel dashboards.
- Without `CLOUDINARY_URL` the site still works, but photos uploaded in the admin disappear on the next deploy.
