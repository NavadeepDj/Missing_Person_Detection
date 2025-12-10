# 🐳 Docker Guide - Run TraceVision with One Command

Docker is the **easiest way** to run this project locally without installing Node.js, npm, or any dependencies. Everything is packaged in a container!

---

## 🎯 Why Use Docker?

✅ **No Node.js needed** - Docker includes everything  
✅ **No dependency issues** - Everything is pre-configured  
✅ **Works everywhere** - Same on Windows, Mac, Linux  
✅ **One command** - `docker-compose up` and you're done  
✅ **Easy to share** - Just share the Docker files  

---

## 📋 Prerequisites

### Install Docker Desktop

1. **Download Docker Desktop:**
   - Windows/Mac: [docker.com/get-started](https://www.docker.com/get-started)
   - Linux: Follow [Docker installation guide](https://docs.docker.com/engine/install/)

2. **Install and Start:**
   - Run the installer
   - Start Docker Desktop
   - Make sure Docker is running (you'll see the Docker icon in system tray)

3. **Verify Installation:**
   ```bash
   docker --version
   docker-compose --version
   ```
   Both commands should show version numbers.

---

## 🚀 Quick Start (Production Build)

### Step 1: Prepare Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_key_here
```

### Step 2: Build and Run

```bash
docker-compose up
```

**That's it!** The app will be available at: `http://localhost:5173`

### Step 3: Stop the Container

Press `Ctrl+C` in the terminal, or run:
```bash
docker-compose down
```

---

## 🔧 Development Mode (With Hot Reload)

For development with live reloading:

```bash
docker-compose -f docker-compose.dev.yml up
```

The app will be available at: `http://localhost:5173`

**Note:** Changes to code will automatically reload!

---

## 📝 Common Docker Commands

### Build and Start
```bash
docker-compose up
```

### Build and Start (in background)
```bash
docker-compose up -d
```

### Stop Containers
```bash
docker-compose down
```

### Stop and Remove Everything
```bash
docker-compose down -v
```

### Rebuild After Changes
```bash
docker-compose up --build
```

### View Logs
```bash
docker-compose logs -f
```

### View Running Containers
```bash
docker ps
```

---

## 🐛 Troubleshooting

### Problem: "Docker daemon is not running"
**Solution:**
- Make sure Docker Desktop is started
- Check system tray for Docker icon
- Restart Docker Desktop

### Problem: "Port 5173 already in use"
**Solution:**
- Change port in `docker-compose.yml`:
  ```yaml
  ports:
    - "5174:80"  # Use port 5174 instead
  ```
- Or stop the application using port 5173

### Problem: "Build fails"
**Solution:**
1. Make sure `.env` file exists with correct values
2. Try rebuilding: `docker-compose up --build --force-recreate`
3. Check Docker has enough resources (Settings → Resources)

### Problem: "Container keeps restarting"
**Solution:**
- Check logs: `docker-compose logs`
- Verify environment variables are set correctly
- Make sure Supabase credentials are valid

### Problem: "Out of disk space"
**Solution:**
- Clean up unused images: `docker system prune -a`
- Remove old containers: `docker-compose down -v`

---

## 📦 What's Included

### Files Created:
- `Dockerfile` - Production build configuration
- `Dockerfile.dev` - Development build with hot reload
- `docker-compose.yml` - Production setup
- `docker-compose.dev.yml` - Development setup
- `nginx.conf` - Web server configuration
- `.dockerignore` - Files to exclude from Docker build

### What Docker Does:
1. **Builds** your React app (runs `npm install` and `npm run build`)
2. **Packages** everything in a container
3. **Serves** it with nginx (production-ready web server)
4. **Exposes** it on port 5173 (or 5173 for dev)

---

## 🔄 Updating the App

### After Code Changes:

**Production:**
```bash
docker-compose up --build
```

**Development:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

The `--build` flag rebuilds the container with your latest changes.

---

## 📤 Sharing with Docker

### Option 1: Share Docker Files
1. Share the entire project folder
2. Include `.env.example` (not `.env` with real values!)
3. They run: `docker-compose up`
4. Done!

### Option 2: Create Docker Image
1. Build image: `docker build -t tracevision:latest .`
2. Save image: `docker save tracevision:latest > tracevision.tar`
3. Share the `.tar` file
4. They load it: `docker load < tracevision.tar`
5. They run: `docker run -p 3000:80 tracevision:latest`

### Option 3: Push to Docker Hub
1. Create account on [hub.docker.com](https://hub.docker.com)
2. Build and tag: `docker build -t yourusername/tracevision:latest .`
3. Push: `docker push yourusername/tracevision:latest`
4. They pull: `docker pull yourusername/tracevision:latest`
5. They run: `docker run -p 3000:80 yourusername/tracevision:latest`

---

## 🆚 Docker vs Other Options

| Method | Pros | Cons |
|--------|------|------|
| **Docker** | ✅ No Node.js needed<br>✅ Works everywhere<br>✅ One command | ❌ Need Docker installed |
| **Deploy Online** | ✅ Just share URL<br>✅ No installation | ❌ Need hosting account<br>❌ Requires internet |
| **Local Setup** | ✅ Full control<br>✅ No Docker needed | ❌ Install Node.js<br>❌ Install dependencies<br>❌ More setup steps |

**Recommendation:** Use Docker for local demos, deploy online for sharing URLs.

---

## 💡 Tips

1. **First time is slow** - Docker downloads base images (one-time)
2. **Subsequent runs are fast** - Images are cached
3. **Use development mode** - For active coding with hot reload
4. **Use production mode** - For demos and testing final build
5. **Check logs** - If something doesn't work, check `docker-compose logs`

---

## 📚 Learn More

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## ✅ Quick Reference

```bash
# Production
docker-compose up

# Development
docker-compose -f docker-compose.dev.yml up

# Stop
docker-compose down

# Rebuild
docker-compose up --build

# View logs
docker-compose logs -f
```

**That's all you need to know!** 🐳

