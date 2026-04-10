# 🚀 Kind Date — Complete Deployment Guide
## An initiative by 2026 Kindness Community Foundation | KCF LLC

---

## ═══ STEP 1 — SUPABASE SETUP ═══

### 1a. Create the Project
1. Go to → https://supabase.com/dashboard
2. Click **"New Project"**
3. Set:
   - **Name:** `kind-dating`
   - **Database Password:** (save this securely)
   - **Region:** `West US (Oregon)` — closest to Newport Beach
4. Click **"Create new project"** — wait ~2 minutes

### 1b. Run the Database Schema
1. In your Supabase dashboard → click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Open the file: `supabase-setup.sql` from your project folder
4. Copy ALL contents → paste into the SQL editor
5. Click **"Run"** (or Ctrl+Enter)
6. You should see: ✅ "Success. No rows returned."

### 1c. Enable Authentication
1. Go to **Authentication → Providers**
2. Enable **Email** (already on by default)
3. Enable **Google OAuth:**
   - Go to https://console.cloud.google.com → Create OAuth credentials
   - Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Paste Client ID + Secret into Supabase

### 1d. Grab Your Keys
Go to **Settings → API** and copy:
- `Project URL` → this is your `VITE_SUPABASE_URL`
- `anon public` key → this is your `VITE_SUPABASE_ANON_KEY`
- `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 1e. Configure Storage (for photos)
1. Go to **Storage → Create bucket**
2. Name: `avatars` | Public: ✅ Yes
3. Name: `photos` | Public: ✅ Yes

---

## ═══ STEP 2 — NETLIFY DEPLOYMENT ═══

### Option A — Drag & Drop (easiest, no terminal needed)
1. Go to → https://app.netlify.com
2. Sign in / create account
3. Click **"Add new site" → "Deploy manually"**
4. Drag your entire **"Kind Date Project"** folder onto the upload zone
5. Wait ~30 seconds → your site is live! 🎉
6. Note your Netlify URL (e.g. `https://kind-date-xyz.netlify.app`)
7. **Rename it:** Site settings → Change site name → `kinddate`

### Option B — GitHub + Auto-Deploy (recommended for updates)
```bash
# In terminal, navigate to project folder
cd "/Users/alok/Downloads/Kind Date Project "

# Initialize git
git init
git add .
git commit -m "Initial Kind Date deployment"

# Push to GitHub (create repo at github.com first)
git remote add origin https://github.com/YOUR_USERNAME/kind-date.git
git push -u origin main
```
Then in Netlify: **"Import from Git"** → connect your repo → auto-deploys on every push.

### 2b. Set Environment Variables in Netlify
1. Go to: **Site Settings → Environment Variables → Add variable**
2. Add each one from `.env.example`:

| Key | Where to get it |
|-----|----------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys |
| `VITE_AGORA_APP_ID` | Agora Console → Project |
| `VITE_APP_URL` | Your Netlify URL |

3. Click **"Save"** → **"Trigger deploy"** to rebuild

### 2c. Set Custom Domain (optional)
1. Site Settings → **Domain Management → Add custom domain**
2. Enter `kinddate.com` (or your domain)
3. Follow DNS instructions from Netlify
4. Free SSL certificate is automatic ✅

---

## ═══ STEP 3 — HERCULES (blank redirect) ═══

### Remove everything & redirect to Netlify
1. Go to → https://app.onhercules.app (or your Hercules dashboard)
2. Open your **kinddate** site project
3. Delete all existing files/content
4. Upload **`hercules-blank.html`** as your site's index file
   - This file auto-redirects visitors to your Netlify URL
5. Before uploading, **edit line 7** of `hercules-blank.html`:
   ```html
   <!-- Change this URL to your actual Netlify URL -->
   <meta http-equiv="refresh" content="0; url=https://kinddate.netlify.app">
   ```
   Replace `kinddate.netlify.app` with your actual Netlify/custom domain URL.

---

## ═══ STEP 4 — CONFIGURE APIs ═══

### 💳 Stripe (Payments)
1. Create account → https://stripe.com
2. Go to **Developers → API Keys**
3. Copy **Publishable key** + **Secret key**
4. Create products:
   - **Plus Plan:** $9/month recurring → copy `price_id`
   - **Premium Plan:** $19/month recurring → copy `price_id`
5. Set up webhook: Stripe → Webhooks → Add endpoint
   - URL: `https://kinddate.netlify.app/.netlify/functions/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`

### 🪪 Persona (ID Verification)
1. Create account → https://withpersona.com
2. Dashboard → **Create Inquiry Template**
3. Select: Government ID + Selfie
4. Copy your **API Key** + **Template ID**
5. Add to Netlify env vars:
   - `PERSONA_API_KEY`
   - `PERSONA_TEMPLATE_ID`

### 📱 Twilio (SMS OTP)
1. Create account → https://twilio.com
2. Get a phone number (~$1/month)
3. Copy: **Account SID** + **Auth Token** + **Phone Number**
4. Add to Netlify env vars:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

### 🤖 OpenAI (AI Assistant)
1. Go to → https://platform.openai.com/api-keys
2. Create new API key
3. Add to Netlify: `VITE_OPENAI_API_KEY`
4. Recommended model: `gpt-4o` (fastest + smartest)

### 🎥 Agora (Video Calls — Premium feature)
1. Create account → https://console.agora.io
2. Create new project
3. Copy **App ID** + **App Certificate**
4. Add to Netlify: `VITE_AGORA_APP_ID`

---

## ═══ STEP 5 — POST-DEPLOY CHECKLIST ═══

### ✅ Verify everything works
- [ ] Landing page loads at your domain
- [ ] "Get Started" button → opens app.html
- [ ] Sign up form works (Supabase auth)
- [ ] Profile photos upload (Supabase storage)
- [ ] Stripe checkout loads (test mode first)
- [ ] Admin panel accessible at `/admin`
- [ ] Hercules URL redirects to Netlify

### 🔒 Security checklist
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NEVER in client-side code
- [ ] RLS is enabled on all Supabase tables (done in SQL schema ✅)
- [ ] Stripe is in **test mode** until you're ready to go live
- [ ] `.env` file is in `.gitignore` (never commit API keys)

### 📊 Analytics (optional but recommended)
- Add **Plausible.io** or **PostHog** for privacy-first analytics
- Add to your site: `<script defer data-domain="kinddate.com" src="https://plausible.io/js/script.js"></script>`

---

## ═══ URLS QUICK REFERENCE ═══

| Service | URL |
|---------|-----|
| Supabase Dashboard | https://supabase.com/dashboard |
| Netlify Dashboard | https://app.netlify.com |
| Stripe Dashboard | https://dashboard.stripe.com |
| Persona Dashboard | https://app.withpersona.com |
| Twilio Console | https://console.twilio.com |
| OpenAI Platform | https://platform.openai.com |
| Agora Console | https://console.agora.io |

---

## ═══ FILE REFERENCE ═══

| File | Purpose |
|------|---------|
| `index.html` | Marketing landing page |
| `app.html` | Full dating app (auth + all screens) |
| `admin.html` | Admin dashboard |
| `supabase-setup.sql` | Complete DB schema — run in Supabase SQL Editor |
| `netlify.toml` | Netlify build + redirect + security headers config |
| `_redirects` | URL routing |
| `.env.example` | Template for all environment variables |
| `hercules-blank.html` | Upload this to Hercules to replace old site |
| `.claude/launch.json` | Local dev server config |

---

*Real People. Smart Matches. Real Dates.*
*© 2026 Kind Date · KCF LLC, A California, USA company serving the world.*
*Made with ♥ for our community*
