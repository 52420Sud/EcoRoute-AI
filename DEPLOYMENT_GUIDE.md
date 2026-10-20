# 🚀 EcoRoute AI: Vercel & Render Cloud Deployment Guide

This guide provides step-by-step instructions to deploy your final-year major project online with working public URLs for both the **Frontend (Vercel)** and **Backend (Render)**.

---

## Part 1: Push Code to GitHub (`52420Sud/EcoRoute-AI`)

### Step 1.1: Create Empty Repository on GitHub
1. Open your browser and go to: **[https://github.com/new](https://github.com/new)**
2. In the **Repository name** field, enter: `EcoRoute-AI`
3. Set visibility to **Public**.
4. ⚠️ **Do NOT check** "Add a README file" (we already have a complete README configured locally).
5. Click **"Create repository"**.

### Step 1.2: Push Your Code
You can push using either of the two easy methods below:

#### Method A: Double-Click the Helper Script (Recommended)
1. In your project folder `d:\waste mgt PRD REquriemtns`, double-click:
   👉 **`PUSH_TO_GITHUB.bat`**
2. Press any key.
3. Windows Git Credential Manager will open a browser login window.
4. Click **"Authorize GitHub"** to confirm your account `52420Sud`.
5. Your project will automatically upload to `https://github.com/52420Sud/EcoRoute-AI`!

#### Method B: Push via Terminal
Run the following in PowerShell / Command Prompt:
```powershell
git push -u origin main
```
*(If prompted for a password, generate a GitHub Personal Access Token with `repo` scope from [github.com/settings/tokens](https://github.com/settings/tokens) and paste it).*

---

## Part 2: Deploy Backend to Render (Free Tier)

Render hosts your Node.js Express backend and SQLite database for free.

1. Go to **[https://render.com/](https://render.com/)** and sign in with your GitHub account (`52420Sud`).
2. Click **"New +"** (top right) ➔ Select **"Web Service"**.
3. Under **"Connect a repository"**, select **`EcoRoute-AI`**.
4. Configure the service settings:
   * **Name:** `ecoroute-ai-backend`
   * **Region:** Oregon (US West) or Singapore / Frankfurt
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server/index.js`
   * **Instance Type:** `Free`
5. Under **Environment Variables**, click **"Add Environment Variable"**:
   * Key: `NODE_ENV` ➔ Value: `production`
6. Click **"Create Web Service"**.
7. Wait ~2 minutes for the deployment to finish. Once live, Render gives you a public HTTPS URL:
   👉 **`https://ecoroute-ai-backend.onrender.com`**
8. Test it by opening `https://ecoroute-ai-backend.onrender.com/api/health` in your browser. It should respond with:
   ```json
   {"status":"ok","server":"EcoRoute AI Backend"}
   ```

---

## Part 3: Deploy Frontend to Vercel (Free Tier)

Vercel provides lightning-fast global edge hosting for your React 19 / Vite frontend.

1. Go to **[https://vercel.com/](https://vercel.com/)** and sign in with your GitHub account (`52420Sud`).
2. Click **"Add New..."** ➔ **"Project"**.
3. Import your GitHub repository: **`52420Sud/EcoRoute-AI`**.
4. Vercel will automatically detect **Vite** and read our pre-configured `vercel.json`:
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Expand the **"Environment Variables"** section and add:
   * **Key:** `VITE_API_URL`
   * **Value:** Your Render backend API URL (e.g. `https://ecoroute-ai-backend.onrender.com/api`)
6. Click **"Deploy"**.
7. In ~60 seconds, your site is live with a public HTTPS link (e.g. `https://ecoroute-ai.vercel.app`)!

---

## Part 4: Testing & Verifying Features Online

Once deployed, open your live Vercel URL and test the end-to-end features:

1. **Smart Bin Monitoring:** Verify live dustbin fill levels, statuses (Normal, Nearly Full, Critical), and battery percentages load from the Render backend.
2. **Citizen Grievance Redressal (Objective 1):**
   * Go to "Report Issue".
   * Enter name, upload photo, and enter a 10-digit mobile number (`9353238540`).
   * Verify the direct automatic OTP populates in place and verifies.
   * Submit and copy the tracking ID (e.g. `REPORT-2026-001`).
   * Test "Track Report" to see the 5-stage stepper update live.
3. **AI Route Optimization (Objective 3):**
   * Go to Authority Dashboard ➔ "Route Optimization".
   * Adjust priority weights or critical threshold cutoff.
   * Verify the 2-Opt TSP heuristic computes the optimal collection path on the interactive Leaflet map.
4. **Field Driver Console:**
   * Go to "Driver Console".
   * Click "Mark as Collected" on a target stop.
   * Verify the dustbin resets to 0% and linked complaints are marked resolved.

---

## Part 5: How to Update Your Live App After Future Changes

Whenever you make future edits to your project, simply run:
```bash
git add .
git commit -m "Describe your update here"
git push
```
Both **Vercel** and **Render** will automatically detect the new commit on GitHub and redeploy your live website in seconds without any manual work!
