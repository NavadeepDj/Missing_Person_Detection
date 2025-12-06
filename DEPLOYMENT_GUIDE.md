# 🚀 Deployment Guide - TraceVision

This guide will help you deploy the TraceVision project so it can be accessed by anyone via a web URL.

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy this project. It's free and takes about 5 minutes.

### Step-by-Step Instructions:

#### 1. Prepare Your Code
- Make sure your code is pushed to GitHub
- Ensure you have your Supabase credentials ready

#### 2. Sign Up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)

#### 3. Import Your Project
1. After signing in, click **"Add New Project"**
2. You'll see a list of your GitHub repositories
3. Find and select your `narayana-project` repository
4. Click **"Import"**

#### 4. Configure Project Settings
Vercel will auto-detect it's a Vite project. You don't need to change anything, but verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `dist` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

#### 5. Add Environment Variables
**This is the most important step!**

1. Before clicking "Deploy", click on **"Environment Variables"**
2. Add the following variables:

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: (paste your Supabase project URL)
   - Environment: Production, Preview, Development (check all)

   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (paste your Supabase anon key)
   - Environment: Production, Preview, Development (check all)

3. Click **"Add"** for each variable

#### 6. Deploy!
1. Click **"Deploy"** button
2. Wait 2-3 minutes for the build to complete
3. Once done, you'll see a success message with a URL like: `https://your-project.vercel.app`

#### 7. Share the URL
- Copy the URL and share it with anyone
- The app is now live and accessible worldwide!

### Updating Your Deployment

Every time you push code to GitHub, Vercel will automatically:
- Detect the changes
- Build the new version
- Deploy it automatically

---

## Option 2: Deploy to Netlify

Netlify is another great option, similar to Vercel.

### Step-by-Step Instructions:

#### 1. Sign Up for Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "Sign up" and choose "Sign up with GitHub"

#### 2. Import Your Project
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your repository
4. Click **"Connect"**

#### 3. Configure Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- Click **"Show advanced"** to add environment variables

#### 4. Add Environment Variables
Click **"New variable"** and add:
- `VITE_SUPABASE_URL` = (your Supabase URL)
- `VITE_SUPABASE_ANON_KEY` = (your Supabase key)

#### 5. Deploy
1. Click **"Deploy site"**
2. Wait for build to complete
3. Get your live URL!

---

## Option 3: Deploy to GitHub Pages

### Step-by-Step Instructions:

#### 1. Install GitHub Pages Plugin
```bash
npm install --save-dev gh-pages
```

#### 2. Update package.json
Add this script:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

#### 3. Update vite.config.ts
Add base path:
```typescript
export default defineConfig({
  base: '/your-repo-name/', // Replace with your actual repo name
  // ... rest of config
})
```

#### 4. Deploy
```bash
npm run deploy
```

#### 5. Enable GitHub Pages
1. Go to your repo on GitHub
2. Settings → Pages
3. Source: Deploy from branch `gh-pages`
4. Save

---

## Environment Variables Reference

### Where to Get Supabase Credentials:

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project
4. Go to **Settings** (gear icon) → **API**
5. You'll find:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public** key → Use for `VITE_SUPABASE_ANON_KEY`

### Important Notes:
- Never commit your `.env` file to GitHub
- Always use environment variables in deployment platforms
- The `.env.example` file is safe to commit (it has no real values)

---

## Troubleshooting Deployment

### Build Fails: "Missing environment variables"
**Solution**: Make sure you added both environment variables in your deployment platform

### Build Fails: "Module not found"
**Solution**: 
1. Make sure `package.json` has all dependencies
2. Try deleting `node_modules` and `package-lock.json` locally
3. Run `npm install` again
4. Commit and push

### App Works Locally But Not Deployed
**Solution**: 
1. Check environment variables are set correctly
2. Make sure variable names start with `VITE_` (required for Vite)
3. Check build logs in deployment platform

### Images/Assets Not Loading
**Solution**: 
1. Make sure all assets are in the `public/` folder
2. Use relative paths, not absolute paths
3. Check `vite.config.ts` base path is correct

---

## Quick Checklist Before Deploying

- [ ] Code is pushed to GitHub
- [ ] Environment variables are ready
- [ ] `.env` file is NOT committed (should be in `.gitignore`)
- [ ] All dependencies are in `package.json`
- [ ] Project builds successfully locally (`npm run build`)
- [ ] No console errors in development mode

---

## Post-Deployment

After deployment:
1. Test the live URL
2. Try logging in with test credentials
3. Test key features (upload photo, view cases, etc.)
4. Share the URL with your team/presenter

---

**Need Help?** Check the main README.md for more details.

