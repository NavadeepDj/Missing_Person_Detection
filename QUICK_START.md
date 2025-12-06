# ⚡ Quick Start Guide - For Non-Technical Users

This guide is for people who need to **present or demo** the TraceVision project but aren't familiar with coding.

## 🎯 Option 1: Use Docker (Easiest for Local Demo - Recommended!)

**Why Docker?** It packages everything needed - no need to install Node.js, npm, or any dependencies!

### Super Simple 2-Step Process:

#### Step 1: Install Docker
- Download Docker Desktop: [docker.com/get-started](https://www.docker.com/get-started)
- Install it (just like installing any software)
- Make sure Docker is running (you'll see a Docker icon in your system tray)

#### Step 2: Run the Project
1. Open terminal/command prompt in the project folder
2. Create a `.env` file with your Supabase credentials (see below)
3. Run this one command:
   ```bash
   docker-compose up
   ```
4. Wait 1-2 minutes for it to build
5. Open browser: `http://localhost:3000`
6. **Done!** 🎉

**To stop:** Press `Ctrl+C` in the terminal, or run `docker-compose down`

**That's it!** No Node.js, no npm install, no dependency issues - Docker handles everything!

---

## 🌐 Option 2: Deploy Online (Best for Sharing URL)

**Why?** This gives you a live URL that anyone can access - no installation needed!

### Super Simple 3-Step Process:

#### Step 1: Get a Vercel Account (Free)
- Go to [vercel.com](https://vercel.com)
- Click "Sign Up" → Choose "Continue with GitHub"
- It's completely free!

#### Step 2: Connect Your Project
1. After signing in, click **"Add New Project"**
2. Find your project in the list
3. Click **"Import"**

#### Step 3: Add Your Keys & Deploy
1. Before deploying, click **"Environment Variables"**
2. Add these two things (get them from the person who set up Supabase):
   - `VITE_SUPABASE_URL` = (the Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (the Supabase key)
3. Click **"Deploy"**
4. Wait 2 minutes
5. **Done!** You'll get a URL like: `https://your-project.vercel.app`

**That's it!** Share that URL with anyone - they can access the app instantly.

---

## 📱 Option 3: Run Locally (Traditional Method)

Only do this if you don't want to use Docker and prefer traditional setup.

### What You Need:
1. **Node.js** installed - [Download here](https://nodejs.org/) (choose the LTS version)
2. **Git** installed - [Download here](https://git-scm.com/)

### Simple Steps:

#### 1. Get the Code
```bash
git clone <repository-url>
cd narayana-project
```

#### 2. Install Everything
```bash
npm install
```
*(This takes 2-5 minutes - just wait for it to finish)*

#### 3. Create Environment File
Create a file named `.env` in the project folder with:
```
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

#### 4. Run the App
```bash
npm run dev
```

#### 5. Open in Browser
Go to: `http://localhost:5173`

---

## 🔑 Login Credentials for Demo

Use these to log in and show different features:

### Admin Account (Full Access)
- **Email**: `admin@tracevision.com`
- **Password**: `admin123`
- **Shows**: Everything - dashboard, user management, system settings

### Case Manager Account
- **Email**: `sarah.johnson@police.gov`
- **Password**: `police123`
- **Shows**: Case management, alerts, analytics

### Investigator Account
- **Email**: `mike.chen@police.gov`
- **Password**: `officer123`
- **Shows**: Assigned alerts, map view, field operations

### Citizen Account
- **Email**: `citizen@tracevision.com`
- **Password**: `citizen123`
- **Shows**: Public missing persons database, photo upload

---

## 🎤 Presentation Tips

### Demo Flow (5-10 minutes):

1. **Start with Landing Page** (30 seconds)
   - Show the public-facing page
   - Explain what the system does

2. **Login as Admin** (1 minute)
   - Show the dashboard with statistics
   - Highlight real-time metrics

3. **Case Management** (2 minutes)
   - Create a new case
   - Upload a photo
   - Show GPS location capture

4. **Alert Dashboard** (2 minutes)
   - Show how alerts are created
   - Demonstrate the workflow (pending → assigned → completed)

5. **Map View** (1 minute)
   - Show cases on the map
   - Click markers to see details
   - Show GPS coordinates

6. **Admin Features** (2 minutes)
   - User Management
   - System Settings
   - Camera Sources
   - AI Model Config

7. **Public Portal** (1 minute)
   - Login as citizen
   - Upload photo for matching
   - Show how alerts are generated

### Key Points to Mention:
- ✅ Real-time AI face recognition
- ✅ GPS location tracking
- ✅ Role-based access control
- ✅ Mobile-responsive design
- ✅ Secure and scalable

---

## ❓ Common Questions

**Q: Do I need to install anything?**  
A: Only if running locally. If deployed online, just share the URL!

**Q: What if I don't have Supabase credentials?**  
A: Contact the person who set up the project - they'll have these.

**Q: Can I change the login credentials?**  
A: Yes, but you'll need to modify the code. For demo purposes, use the provided test accounts.

**Q: What if something doesn't work?**  
A: Check the troubleshooting section in the main README.md file.

---

## 📞 Need Help?

1. Check the main **README.md** for detailed instructions
2. Check **DEPLOYMENT_GUIDE.md** for deployment help
3. Contact the development team

---

**Remember**: The easiest way is to deploy online (Vercel) - then you just share a URL! 🚀

