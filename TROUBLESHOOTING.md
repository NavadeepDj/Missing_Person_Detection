# 🔧 TraceVision - Troubleshooting Guide

This guide covers common issues and solutions. Check your specific problem below.

---

## 🚨 Error: "Docker daemon is not running"

**Where you see it:** Terminal shows this error when running `docker-compose` commands

**Causes:**
- Docker Desktop is not installed
- Docker Desktop is not running
- Docker service is stopped

**Solution:**

### Windows:
1. Open Start Menu
2. Search for "Docker Desktop"
3. Click to launch Docker Desktop
4. Wait for the Docker icon to appear in your taskbar (might take 1-2 minutes)
5. Try your command again

### Mac:
1. Open Applications folder
2. Double-click "Docker.app"
3. Wait for Docker icon to appear in menu bar
4. Try your command again

### Linux:
```bash
# Start Docker service
sudo systemctl start docker

# Verify it's running
docker --version
```

---

## ❌ Error: "Port 3000 already in use" or "Bind for 0.0.0.0:3000 failed"

**Where you see it:** When running `docker-compose up`

**Causes:**
- Another application is using port 3000
- Previous Docker container still running
- Port was reserved but not released properly

**Solution 1: Change the Port (Easiest)**

Edit `docker-compose.yml` and change the port:

```yaml
services:
  tracevision:
    ports:
      - "3001:80"  # Changed from 3000 to 3001
```

Then run:
```bash
docker-compose up
```

Access app at: `http://localhost:3001`

**Solution 2: Find and Stop What's Using Port 3000**

### Windows (PowerShell):
```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
taskkill /PID <process-id> /F
```

### Mac/Linux:
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <process-id>
```

**Solution 3: Remove All Docker Containers**

```bash
docker-compose down -v
```

Then try again:
```bash
docker-compose up
```

---

## 🔴 Error: "Build fails" or "Build exited with error"

**Where you see it:** When running `docker-compose up` for the first time

**Causes:**
- `.env` file is missing
- `.env` file has wrong values
- Corrupted Docker cache
- Out of disk space
- Network issues downloading images

**Solution 1: Check .env File (Most Common)**

1. Make sure `.env` file exists in project root
2. It should look like this:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Make sure both values are filled (not empty)
4. No quotes needed around values

If `.env` is missing:
1. Copy `.env.example` file
2. Rename the copy to `.env`
3. Fill in your Supabase credentials

**Solution 2: Force Rebuild**

```bash
docker-compose up --build --force-recreate
```

**Solution 3: Clear Docker Cache**

```bash
# Remove old images and cached layers
docker system prune -a

# Then rebuild
docker-compose up --build
```

**Solution 4: Check Logs for Details**

```bash
docker-compose logs
```

Look for error messages that explain what went wrong.

---

## 🔄 Error: "Container keeps restarting"

**Where you see it:** Container starts, crashes, starts again (repeating)

**Causes:**
- Supabase credentials are wrong
- Application crashed during startup
- Port configuration issue
- Memory/resource issues

**Solution 1: Check Logs**

```bash
docker-compose logs tracevision
```

Look for error messages. Common ones:

- `Connection refused` → Supabase URL is wrong
- `Invalid key` → Supabase key is wrong
- `Address already in use` → Port conflict

**Solution 2: Verify .env File**

1. Check that `.env` file exists
2. Verify Supabase URL format: `https://something.supabase.co`
3. Verify Anon key is long (100+ characters)
4. Copy values carefully (no extra spaces)

**Solution 3: Restart Docker Desktop**

Sometimes Docker gets stuck:

1. Stop container: `docker-compose down`
2. Close Docker Desktop completely
3. Wait 30 seconds
4. Reopen Docker Desktop
5. Try again: `docker-compose up`

**Solution 4: Increase Docker Resources**

If you see memory/CPU errors:

1. Open Docker Desktop → Settings
2. Go to Resources tab
3. Increase Memory (to at least 4GB)
4. Increase CPU cores (to at least 2)
5. Click Apply & Restart
6. Try again

---

## ⚠️ Error: "Application not responding" or "Blank page"

**Where you see it:** Browser shows blank page or loading forever at `http://localhost:3000`

**Causes:**
- Application hasn't finished loading
- Browser cache issue
- Network connectivity issue
- Wrong port being accessed

**Solution 1: Wait for Build to Complete**

First run takes 2-5 minutes:

```bash
# Run with logs to see progress
docker-compose logs -f
```

Wait for message like: `successfully started nginx` or similar

**Solution 2: Refresh Browser**

Sometimes the page loads but doesn't render:

1. Hard refresh in browser:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. Or clear cache:
   - Chrome: DevTools → Settings → Clear Browsing Data
   - Firefox: Settings → Clear Recent History

**Solution 3: Check Correct Port**

1. Verify which port is configured in `docker-compose.yml`
2. If you changed it, use the new port
3. Default is: `http://localhost:3000`

**Solution 4: Check Container is Running**

```bash
docker ps
```

Should show `tracevision-app` in the list as `Up`.

If not running:
```bash
docker-compose up
```

---

## 💾 Error: "Out of disk space"

**Where you see it:** Build fails with "no space left on device"

**Causes:**
- Docker images and containers taking up space
- Multiple large Docker images
- Previous builds not cleaned up

**Solution 1: Clean Docker System**

```bash
# Remove stopped containers, dangling images, unused networks
docker system prune

# Remove all unused images (including tagged ones)
docker system prune -a

# Remove all volumes
docker system prune -a -v
```

**Solution 2: Free Up Space**

```bash
# Check Docker disk usage
docker system df

# Stop all containers
docker stop $(docker ps -aq)

# Remove all stopped containers
docker container prune -f

# Remove all dangling images
docker image prune -f
```

**Solution 3: Check Actual Disk Space**

### Windows (PowerShell):
```powershell
Get-Volume | Where-Object {$_.DriveLetter -eq 'C'}
```

### Mac/Linux:
```bash
df -h /
```

If disk is full:
1. Delete unnecessary files from your system
2. Move files to external storage
3. Uninstall unused programs
4. Empty Recycle Bin

---

## 🌐 Error: "Cannot connect to Supabase"

**Where you see it:** Application loads but shows connection error or login fails

**Causes:**
- Invalid Supabase URL
- Invalid Supabase key
- Supabase project is deleted or paused
- Network connectivity issue
- Firewall blocking connection

**Solution 1: Verify Supabase Credentials**

1. Go to https://supabase.com
2. Log in to your account
3. Select your project
4. Click Settings → API
5. Copy the exact values:
   - Project URL
   - Anon public key
6. Update `.env` file with these exact values

**Solution 2: Test Supabase Connection**

Open browser console (F12) and check for error messages about Supabase connection.

**Solution 3: Check Supabase Project Status**

1. Go to Supabase dashboard
2. Make sure your project is not:
   - Paused
   - Deleted
   - Over quota
   - In maintenance

**Solution 4: Rebuild Container**

After updating `.env`:

```bash
docker-compose down
docker-compose up --build
```

---

## 📊 Error: "Slow performance" or "High CPU/Memory usage"

**Where you see it:** Application is slow or your computer is running hot

**Causes:**
- Not enough resources allocated to Docker
- Background processes consuming resources
- Large file processing
- Memory leak

**Solution 1: Increase Docker Resources**

1. Open Docker Desktop → Settings
2. Go to Resources tab
3. Increase:
   - Memory: 4GB minimum (recommend 8GB)
   - CPU: 2 cores minimum (recommend 4)
4. Click Apply & Restart
5. Restart application

**Solution 2: Close Other Applications**

Free up system resources by closing:
- Browser tabs (especially Chrome)
- Other Docker containers
- Unnecessary applications

**Solution 3: Use Production Build (Not Dev)**

Development build is slower. Use:

```bash
docker-compose up
```

Not:
```bash
docker-compose -f docker-compose.dev.yml up
```

**Solution 4: Check Docker Logs**

```bash
docker-compose logs --tail 50
```

Look for memory warnings or errors.

---

## 🔌 Error: "Network connectivity issues"

**Where you see it:** Application won't load features requiring internet

**Causes:**
- No internet connection
- Firewall blocking Docker
- DNS issues
- Proxy issues

**Solution 1: Check Internet Connection**

```bash
ping 8.8.8.8
```

If no response, check your internet connection.

**Solution 2: Restart Docker Network**

```bash
docker network prune
docker-compose down
docker-compose up
```

**Solution 3: Disable Firewall Temporarily**

If firewall is blocking Docker:

### Windows:
1. Settings → Privacy & Security → Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Docker Desktop and enable it

### Mac:
1. System Preferences → Security & Privacy → Firewall
2. Click Firewall Options
3. Add Docker to allowed apps

---

## 🆘 Common Issues Checklist

| Issue | Check | Fix |
|-------|-------|-----|
| Container won't start | Check `.env` file exists | Copy `.env.example` → `.env` |
| Port already in use | Check `docker ps` | Change port in `docker-compose.yml` |
| Blank page | Wait 2-5 minutes | Hard refresh: `Ctrl+Shift+R` |
| App crashes repeatedly | Check logs: `docker-compose logs` | Verify Supabase credentials |
| Slow performance | Check Docker resources | Increase Memory/CPU in Settings |
| Connection refused | Check internet | Verify network connectivity |

---

## 📝 Getting Help

If you're still stuck, provide this information:

```bash
# System info
docker --version
docker-compose --version

# Docker logs
docker-compose logs

# Running containers
docker ps -a

# Docker disk usage
docker system df
```

Attach this information to your support request.

---

## 💡 Pro Tips

1. **Keep Docker updated** - Newer versions fix bugs and improve performance
2. **Use production build for testing** - It's more stable than development
3. **Check logs first** - 90% of issues are visible in logs
4. **Restart is powerful** - Try restarting Docker Desktop before deep troubleshooting
5. **Clear cache if stuck** - `docker system prune -a` often solves mysterious issues

---

**Last Updated:** December 2024  
**Version:** 1.0
