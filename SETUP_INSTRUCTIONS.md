# 📋 Setup Instructions - Step by Step

This is a detailed, step-by-step guide for setting up the TraceVision project.

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Node.js** installed (version 18 or higher)
  - Check: Open terminal/command prompt and type `node --version`
  - If not installed: [Download Node.js](https://nodejs.org/)
  
- [ ] **Git** installed
  - Check: Type `git --version` in terminal
  - If not installed: [Download Git](https://git-scm.com/)

- [ ] **Supabase credentials**
  - You need: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  - Get them from: Supabase Dashboard → Settings → API

---

## Step 1: Get the Code

### Option A: Clone from GitHub (Recommended)
```bash
git clone <your-repository-url>
cd narayana-project
```

### Option B: Download ZIP
1. Go to your GitHub repository
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Open terminal in the extracted folder

---

## Step 2: Install Dependencies

Open terminal/command prompt in the project folder and run:

```bash
npm install
```

**What this does:** Downloads and installs all required packages (React, TensorFlow, etc.)

**How long:** Usually 2-5 minutes, depending on your internet speed

**If you see errors:**
- Make sure you're in the correct folder
- Try: `npm cache clean --force` then `npm install` again

---

## Step 3: Set Up Environment Variables

### Create `.env` file

1. In the project root folder, create a new file named `.env`
   - **Windows:** Right-click → New → Text Document → Rename to `.env`
   - **Mac/Linux:** Use terminal: `touch .env`

2. Open `.env` in a text editor and add:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_key_here
```

3. Replace the placeholder values with your actual Supabase credentials

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

**Important:** 
- Don't use quotes around the values
- Don't add spaces around the `=` sign
- Make sure the file is named exactly `.env` (not `.env.txt`)

---

## Step 4: Run the Development Server

In the terminal, run:

```bash
npm run dev
```

**What you'll see:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open your browser** and go to: `http://localhost:5173`

You should see the TraceVision landing page!

---

## Step 5: Test the Application

1. **Click "Login"** or go to `/login`
2. **Try logging in** with test credentials:
   - Email: `admin@tracevision.com`
   - Password: `admin123`
3. **Explore the dashboard** and features

---

## Building for Production

When you're ready to deploy:

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

To preview the production build:

```bash
npm run preview
```

---

## Troubleshooting

### Problem: "Missing Supabase environment variables"
**Solution:**
1. Check that `.env` file exists in the root folder
2. Verify the file has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Make sure there are no typos
4. Restart the dev server after creating/editing `.env`

### Problem: "Port 5173 already in use"
**Solution:**
1. Close other applications using port 5173
2. Or change the port in `vite.config.ts`:
   ```typescript
   server: {
     port: 3000, // Change to any available port
   }
   ```

### Problem: "Module not found" errors
**Solution:**
1. Delete `node_modules` folder
2. Delete `package-lock.json` file
3. Run `npm install` again

### Problem: Dependencies won't install
**Solution:**
1. Update npm: `npm install -g npm@latest`
2. Clear npm cache: `npm cache clean --force`
3. Try again: `npm install`

### Problem: App shows blank page
**Solution:**
1. Check browser console for errors (F12)
2. Verify environment variables are set correctly
3. Check that Supabase credentials are valid
4. Make sure you're accessing `http://localhost:5173` (not file://)

---

## Next Steps

Once everything is working:

1. **For Local Development:** Keep `npm run dev` running and start coding!

2. **For Deployment:** 
   - See `DEPLOYMENT_GUIDE.md` for deploying to Vercel/Netlify
   - Or see `QUICK_START.md` for the easiest deployment method

3. **For Presentation:**
   - See `QUICK_START.md` for demo tips and login credentials

---

## Quick Reference

| Command | What it does |
|---------|--------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code for errors |

---

## Need More Help?

- Check `README.md` for general information
- Check `DEPLOYMENT_GUIDE.md` for deployment help
- Check `QUICK_START.md` for non-technical users
- Contact the development team

---

**Happy coding! 🚀**

