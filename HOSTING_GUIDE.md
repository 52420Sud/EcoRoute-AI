# Complete Guide: How to Host EcoRoute AI Website Anywhere

This guide explains how to host the **EcoRoute AI** website and backend so it is live on the internet and accessible from any smartphone, laptop, or IoT device anywhere in the world.

---

## 🌟 Architecture Summary

Our system has two components:
1. **Frontend**: React + TypeScript + Vite (compiled to `dist/`).
2. **Backend**: Node.js + Express + SQLite Database (serving APIs and ESP32 telemetry on port 5000).

Because we configured [`server/index.js`](file:///d:/waste%20mgt%20PRD%20REquriemtns/server/index.js) to serve the compiled `dist/` frontend directly, **you can host the entire system as a single service on any cloud platform!**

---

## 🚀 Option 1: 100% Free Cloud Hosting on Render.com (Recommended)

Render provides a completely free tier with automatic HTTPS/SSL and Git-based deployments.

### Step 1: Push your code to GitHub
If you haven't pushed your code to GitHub yet:
1. Create a repository on [GitHub.com](https://github.com/) (e.g. `ecoroute-ai`).
2. In your project directory:
   ```bash
   git init
   git add .
   git commit -m "Initial EcoRoute AI commit"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/ecoroute-ai.git
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com/) and sign up / log in with GitHub.
2. Click **New +** -> **Web Service**.
3. Connect your `ecoroute-ai` GitHub repository.
4. Configure the settings:
   - **Name**: `ecoroute-ai` (or any name you like)
   - **Environment**: `Node`
   - **Region**: `Singapore` or any nearest region
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run server
     ```
   - **Plan**: `Free`
5. Click **Create Web Service**.

Render will automatically build the React app and launch the Express server.
Once deployed (typically 2-3 minutes), you will receive a public HTTPS URL:
👉 **`https://ecoroute-ai.onrender.com`**

Both the website and the IoT APIs (`/api/dustbins`, `/api/sensors/telemetry`, etc.) will run live on that URL!

---

## ⚡ Option 2: Instant 30-Second Public Link (No Upload Needed)

If you need a live public URL **right now** for a college presentation, live teacher review, or phone testing:

### Using LocalTunnel (Free, no account needed):
1. In one terminal, start your project:
   ```bash
   npm start
   ```
2. In a second terminal, run:
   ```bash
   npx localtunnel --port 5000
   ```
3. You will immediately get a live URL:
   👉 **`https://smart-waste-mysore.loca.lt`**
   *(Anyone on earth can open this link on their phone!)*

### Using Ngrok:
1. Download [ngrok](https://ngrok.com/) and authenticate.
2. Run:
   ```bash
   ngrok http 5000
   ```
3. You get a public HTTPS address like `https://xxxx.ngrok-free.app`.

---

## 🚀 Free Alternative Platforms (No Credit Card / 100% Free)

You **DO NOT** need Railway or any paid service! Here are the best 100% free platforms for EcoRoute AI:

### 1. Render.com + Free "Never Sleep" Trick (Best Choice)
- **Cost**: **$0.00 Forever**
- **How to prevent the 15-minute sleep lag for free**:
  1. Deploy your app on [Render.com](https://render.com/) following Option 1 above. You will get a URL like `https://ecoroute-ai.onrender.com`.
  2. Create a free account on [Cron-job.org](https://cron-job.org/) or [UptimeRobot.com](https://uptimerobot.com/).
  3. Set a free scheduled cron job to visit `https://ecoroute-ai.onrender.com/api/dustbins` every **10 minutes**.
  4. ✨ **Result**: Render detects activity and **never goes to sleep!** You get 24/7 instant response and zero cold starts completely for **free** without paying a single dollar!

---

### 2. Koyeb (koyeb.com) - 100% Free
- **Cost**: **$0.00 Forever** (Free Eco tier included)
- **Features**:
  - Global edge hosting, automatic SSL.
  - Connects directly to your GitHub repository.
  - Very fast build times for Node.js + Express apps.
- **How to Deploy**:
  1. Go to [koyeb.com](https://www.koyeb.com/) and sign up with GitHub.
  2. Click **Create Service** -> **GitHub**.
  3. Select your repository.
  4. Koyeb detects Node.js automatically. Set port to `5000` and deploy.

---

### 3. Cloudflare Tunnel (cloudflared) - 100% Free & Unlimited
- If you have an old laptop or PC at home and want your project live 24/7 on the internet:
- **Cost**: **$0.00 Forever**
- Cloudflare Tunnel connects your local port `5000` directly to Cloudflare's global network with high-speed HTTPS, no router port-forwarding, and no data limits.

---

## 🌐 Connecting Mobile App & ESP32 to your Hosted Website

Once your website is hosted on the cloud (e.g. `https://ecoroute-ai.onrender.com`):

### 1. Flutter Mobile App:
Open the Flutter app, tap the **Network Settings** icon (top right), and enter:
```
https://ecoroute-ai.onrender.com/api
```
All bins, live maps, driver collections, and citizen reports will sync live over mobile 4G/5G data!

### 2. ESP32 Hardware:
In `esp32_firmware/esp32_dustbin.ino`, update the server address:
```cpp
const char* serverUrl = "https://ecoroute-ai.onrender.com/api/sensors/telemetry";
```
Your physical ultrasonic dustbin will transmit telemetry to the cloud from any Wi-Fi hotspot or mobile hotspot!
