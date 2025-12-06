# 🚀 TraceVision - Client Setup Guide

Welcome! This guide will help you set up and run the TraceVision application using Docker. Everything is pre-configured—just follow these simple steps.

---

## ⚙️ Prerequisites

### Step 1: Install Docker Desktop

1. **Download Docker Desktop** from: https://www.docker.com/get-started
2. **Choose your OS:** Windows, Mac, or Linux
3. **Install** and run the installer
4. **Start Docker Desktop** (you'll see the Docker icon in your taskbar/menu bar)

### Step 2: Verify Installation

Open your terminal/command prompt and run:

```bash
docker --version
docker-compose --version
```

Both commands should show version numbers (e.g., `Docker version 24.0.0`).

---

## 📋 Configuration

### Step 1: Create Environment File

You need to create a `.env` file with your configuration. Here's how:

1. **Find the file** ``.env.example`` in the project folder
2. **Create a new file** named `.env` (same location as `.env.example`)
3. **Copy the contents** from `.env.example` to `.env`
4. **Fill in your values:**

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get these values:**
- Log in to your Supabase account
- Go to Project Settings → API
- Copy the Project URL and Anon Key

---

## 🎯 Running the Application

### Option 1: Production Build (Recommended for Testing)

This runs the optimized production build:

```bash
docker-compose up
```

**What happens:**
- Docker builds your application
- Nginx serves it
- Opens on: `http://localhost:3000`
- This is the fastest, most stable version

**Stop it:** Press `Ctrl+C` in the terminal

---

### Option 2: Development Build (With Live Reload)

This is for development with hot reloading:

```bash
docker-compose -f docker-compose.dev.yml up
```

**What happens:**
- Starts a development server
- Code changes reload automatically
- Opens on: `http://localhost:5173`
- Use this if you want to modify code

**Stop it:** Press `Ctrl+C` in the terminal

---

### Option 3: Background Mode

Run without taking over your terminal:

```bash
docker-compose up -d
```

**Stop it:**
```bash
docker-compose down
```

---

## 🔄 Common Tasks

### Rebuild After Updates

```bash
docker-compose up --build
```

### View Application Logs

```bash
docker-compose logs -f
```

### Stop Everything

```bash
docker-compose down
```

### Stop and Remove Everything (including volumes)

```bash
docker-compose down -v
```

### Check Running Containers

```bash
docker ps
```

---

## 🆘 Troubleshooting

### Problem: "Docker daemon is not running"

**Solution:**
1. Open Docker Desktop application
2. Wait for Docker icon to appear in your taskbar
3. Verify it's running by checking Docker icon in system tray
4. Try your command again

---

### Problem: "Port 3000 already in use"

**Solution:** Use a different port. Edit `docker-compose.yml`:

```yaml
services:
  tracevision:
    # ... other config ...
    ports:
      - "3001:80"  # Changed from 3000 to 3001
```

Then run: `docker-compose up`

The app will be at: `http://localhost:3001`

---

### Problem: "Build fails with error"

**Solution steps:**
1. Check that `.env` file exists and is filled correctly
2. Make sure your Supabase credentials are valid
3. Try rebuilding: `docker-compose up --build --force-recreate`
4. Check logs: `docker-compose logs`

---

### Problem: "Container keeps restarting"

**Solution:**
1. Check logs: `docker-compose logs tracevision`
2. Look for error messages
3. Verify `.env` file is correct
4. Make sure Supabase URL and key are valid

---

### Problem: "Out of disk space"

**Solution:**
```bash
# Remove old images
docker system prune -a

# Remove all stopped containers
docker-compose down -v
```

---

### Problem: "Application is slow or not responding"

**Solution:**
1. Check Docker resources: Docker Desktop → Settings → Resources
2. Increase memory/CPU if needed
3. Restart Docker Desktop

---

## 📁 Project Structure

```
project-folder/
├── Dockerfile                 # Production build config
├── Dockerfile.dev           # Development build config
├── docker-compose.yml       # Production setup
├── docker-compose.dev.yml   # Development setup
├── .env.example             # Example configuration
├── .env                     # Your actual configuration (CREATE THIS)
├── nginx.conf               # Web server config
├── package.json             # Node.js dependencies
├── vite.config.ts           # Build configuration
├── src/                     # React source code
└── backend/                 # Python backend (optional)
```

---

## 🔐 Security Tips

1. **Never share `.env` file** - It contains your API keys
2. **Use `.env.example`** - This is safe to share (no real values)
3. **Regenerate keys** - If you accidentally share `.env`
4. **Keep Docker updated** - Regularly update Docker Desktop

---

## 📊 What Docker Does

1. **Downloads base images** (Node.js, Nginx)
2. **Installs dependencies** (npm packages, Python packages)
3. **Builds your app** (compiles React code)
4. **Packages everything** in a container
5. **Serves your app** (on port 3000 or 5173)

All of this happens **automatically** with one command!

---

## ⚡ Performance Tips

1. **First run is slower** - Docker downloads base images (one-time only)
2. **Subsequent runs are fast** - Images are cached locally
3. **Use production build** for best performance (`docker-compose up`)
4. **Use development build** only when actively coding
5. **Close other applications** if you need more system resources

---

## 📞 Support

If you encounter issues:

1. **Check logs:** `docker-compose logs -f`
2. **Verify `.env` file** - Make sure all values are filled
3. **Restart Docker** - Close and reopen Docker Desktop
4. **Rebuild container:** `docker-compose up --build --force-recreate`
5. **Contact support** - Include output from `docker-compose logs`

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] Docker Desktop is installed and running
- [ ] `.env` file exists with correct values
- [ ] `docker-compose.yml` is unchanged
- [ ] Supabase credentials are valid
- [ ] Port 3000 (or your configured port) is available
- [ ] You have internet connection (for first-time image download)

---

## 🎉 You're Ready!

Once everything is set up, it's as simple as:

```bash
docker-compose up
```

Then open: `http://localhost:3000`

That's it! The application should be running.

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [Troubleshooting Docker Issues](https://docs.docker.com/config/containers/logging/)

---

## 💡 Pro Tips

| Tip | Command |
|-----|---------|
| **Run in background** | `docker-compose up -d` |
| **View logs live** | `docker-compose logs -f` |
| **Stop everything** | `docker-compose down` |
| **Rebuild after updates** | `docker-compose up --build` |
| **Check running containers** | `docker ps` |
| **View image sizes** | `docker images` |

---

**Last Updated:** December 2024  
**Version:** 1.0
