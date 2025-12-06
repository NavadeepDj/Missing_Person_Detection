# TraceVision - Missing Persons Detection System

A comprehensive web application for detecting and managing missing persons using AI-powered face recognition technology.

## 🚀 Quick Start (For Non-Technical Users)

### Option 1: Use Docker (Easiest for Local - Recommended!)
**No Node.js needed!** Docker packages everything.

1. Install [Docker Desktop](https://www.docker.com/get-started)
2. Create `.env` file with Supabase credentials
3. Run: `docker-compose up`
4. Open: `http://localhost:3000`

**See `DOCKER_GUIDE.md` for detailed instructions.**

### Option 2: View Live Demo
If the project is already deployed, simply share the live URL. No setup needed!

### Option 3: Deploy to Vercel (Best for Sharing URL)

1. **Create a Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Your Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Vite project

3. **Add Environment Variables**
   - In the project settings, go to "Environment Variables"
   - Add these two variables:
     - `VITE_SUPABASE_URL` = (your Supabase URL)
     - `VITE_SUPABASE_ANON_KEY` = (your Supabase anon key)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a live URL to share!

### Option 4: Local Setup (Traditional Method)

If you prefer traditional setup without Docker, follow the detailed setup below.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd narayana-project
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages. This may take a few minutes.

### Step 3: Set Up Environment Variables

1. Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

2. Open `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**How to get Supabase credentials:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the "Project URL" and "anon public" key

### Step 4: Run the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Step 5: Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Step 6: Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
narayana-project/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API and business logic
│   ├── contexts/       # React contexts (Auth, etc.)
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── package.json        # Dependencies and scripts
└── vite.config.ts     # Vite configuration
```

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy!

## 👥 User Roles & Login Credentials

The application supports multiple user roles:

### Admin
- Email: `admin@tracevision.com`
- Password: `admin123`
- Access: Full system access, user management, system settings

### Case Manager
- Email: `sarah.johnson@police.gov`
- Password: `police123`
- Access: Case management, alerts, analytics

### Investigator
- Email: `mike.chen@police.gov`
- Password: `officer123`
- Access: Assigned alerts, map view, field operations

### Citizen
- Email: `citizen@tracevision.com`
- Password: `citizen123`
- Access: Public missing persons database, photo upload

## 🎯 Key Features

- **AI-Powered Face Recognition**: Uses MobileFaceNet for accurate face matching
- **Real-time Alerts**: Instant notifications when matches are detected
- **Case Management**: Comprehensive case tracking and management
- **Map Visualization**: GPS-based location tracking and mapping
- **Role-Based Access**: Secure access control for different user types
- **Analytics Dashboard**: Real-time statistics and performance metrics

## 🛠️ Technologies Used

- **Frontend**: React 19, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Radix UI
- **AI/ML**: TensorFlow.js, MobileFaceNet, ArcFace
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet, React Leaflet
- **Routing**: React Router v7

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Make sure you have created a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Issue: "Port already in use"
**Solution**: Change the port in `vite.config.ts` or kill the process using port 5173

### Issue: Dependencies won't install
**Solution**: 
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

### Issue: Build fails
**Solution**: 
- Make sure all environment variables are set
- Check that Node.js version is 18+
- Clear cache: `npm cache clean --force`

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the project documentation
3. Contact the development team

## 📄 License

[Your License Here]

---

## 🎓 For Presenters

### Quick Demo Flow

1. **Login as Admin** → Show dashboard with statistics
2. **Case Management** → Create a new case, upload photo
3. **Alert Dashboard** → Show real-time alerts
4. **Map View** → Demonstrate GPS tracking
5. **User Management** → Show admin features
6. **Public Portal** → Login as citizen, upload photo for matching

### Key Points to Highlight

- Real-time AI face recognition
- GPS location tracking
- Role-based access control
- Comprehensive case management
- Mobile-responsive design

---

**Made with ❤️ for missing persons detection**
