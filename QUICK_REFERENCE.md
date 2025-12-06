# ⚡ Quick Reference - TraceVision Docker Commands

Print this page or keep it handy while using Docker!

---

## 🚀 Basic Commands

### Start Application (Production)
```bash
docker-compose up
```
- App opens at: `http://localhost:3000`
- Fast and optimized
- **Use this for testing and demos**

### Start Application (Development)
```bash
docker-compose -f docker-compose.dev.yml up
```
- App opens at: `http://localhost:5173`
- Code changes reload automatically
- **Use this only while coding**

### Stop Application
```bash
docker-compose down
```
- Stops and removes containers
- Keeps images for fast restart

### Stop & Clean Everything
```bash
docker-compose down -v
```
- Removes containers, networks, and volumes
- **Use if things get broken**

---

## 🔧 Useful Commands

### Run in Background
```bash
docker-compose up -d
```
- Runs without taking over terminal
- Stop with: `docker-compose down`

### View Live Logs
```bash
docker-compose logs -f
```
- Shows what's happening in real-time
- Press `Ctrl+C` to stop watching

### View Specific Number of Logs
```bash
docker-compose logs --tail 50
```
- Shows last 50 lines
- Change number as needed

### Rebuild After Changes
```bash
docker-compose up --build
```
- Rebuilds Docker image
- Takes longer (2-5 minutes first time)

### Force Rebuild Everything
```bash
docker-compose up --build --force-recreate
```
- Completely clean rebuild
- **Use if things are broken**

### Check Running Containers
```bash
docker ps
```
- Shows what's currently running
- Your app should show as "Up"

### Remove Old Images
```bash
docker system prune -a
```
- Frees up disk space
- Removes unused Docker images
- **Safe to run anytime**

---

## ⚙️ Configuration

### Setup Before First Run

1. **Install Docker Desktop:**
   - https://www.docker.com/get-started

2. **Create `.env` file:**
   - Copy: `.env.example`
   - Rename to: `.env`
   - Fill in your Supabase credentials

3. **Run:**
   ```bash
   docker-compose up
   ```

---

## 🆘 Quick Fixes

### Port Already in Use
Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Change 3000 to 3001
```

### App Won't Start
```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose up --build --force-recreate
```

### Out of Disk Space
```bash
docker system prune -a -v
```

### Strange Behavior
```bash
# The magic fix
docker-compose down -v
docker-compose up --build --force-recreate
```

---

## 📋 Troubleshooting Flowchart

```
Something broken?
  ↓
Check logs: docker-compose logs
  ↓
Is .env file correct?
  ├─ No → Fix it and rebuild
  └─ Yes → Continue
  ↓
Can you see error messages?
  ├─ Port error → Change port in docker-compose.yml
  ├─ Connection error → Check Supabase credentials
  ├─ Build error → Try: docker-compose up --build --force-recreate
  └─ Other → See TROUBLESHOOTING.md
```

---

## 🎯 Common Scenarios

### "I want to test the app"
```bash
docker-compose up
```
Wait 2-5 minutes, then open `http://localhost:3000`

### "I want to make code changes"
```bash
docker-compose -f docker-compose.dev.yml up
```
Changes auto-reload at `http://localhost:5173`

### "I'm done for the day"
```bash
docker-compose down
```

### "Something is broken, start fresh"
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build --force-recreate
```

### "I want to see what's happening"
```bash
docker-compose logs -f
```
Press `Ctrl+C` to stop watching

### "My changes aren't showing up"
```bash
docker-compose down
docker-compose up --build
```

### "Port 3000 is taken"
Change port in `docker-compose.yml` from 3000 to 3001 (or any free port)

---

## ✅ Verification

### Is Docker Installed?
```bash
docker --version
```
Should show: `Docker version 24.0.0` or similar

### Is Docker Running?
```bash
docker ps
```
Should show list of containers (even if empty)

### Is App Running?
1. Open: `http://localhost:3000`
2. Should see the application
3. Not a blank page

### How to Check App Logs
```bash
docker-compose logs tracevision
```

---

## 🔐 Security Reminders

1. **Never share `.env` file**
2. Use `.env.example` for documentation
3. Add `.env` to `.gitignore` (already done)
4. Regenerate API keys if you accidentally commit `.env`

---

## 📞 Need Help?

1. Check `TROUBLESHOOTING.md` - Detailed solutions for 90% of issues
2. Run: `docker-compose logs` - See what's actually happening
3. Check `.env` file - Most issues are here
4. Restart Docker Desktop - The classic "turn it off and on again"
5. Contact support - Include output from `docker-compose logs`

---

## 🎓 Learning Resources

- [Docker Official Docs](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [Docker Troubleshooting](https://docs.docker.com/config/containers/logging/)

---

**Remember:** Docker makes everything simple. When in doubt, restart! 🐳

**Print Date:** December 2024
