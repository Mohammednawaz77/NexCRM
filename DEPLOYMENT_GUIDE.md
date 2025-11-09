# NexCRM - Deployment Guide

## Overview
This guide explains how to deploy the NexCRM frontend and backend separately:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Express + PostgreSQL)

---

## Part 1: Backend Deployment (Render)

### Files Needed for Backend
```
server/
├── index.ts
├── routes.ts
├── storage.ts
├── auth.ts
├── db.ts
├── vite.ts
shared/
├── schema.ts
package.json
tsconfig.json
drizzle.config.ts
```

### Step-by-Step Backend Deployment

#### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with your GitHub account

#### 2. Create PostgreSQL Database
- Click "New +" → "PostgreSQL"
- Name: `nexcrm-database`
- Region: Choose closest to your users
- Plan: Free tier is fine for testing
- Click "Create Database"
- **Save the connection details** (you'll need `DATABASE_URL`)

#### 3. Create Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Configure:
  - **Name**: `nexcrm-backend`
  - **Runtime**: Node
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `node dist/index.js`
  - **Plan**: Free tier

#### 4. Environment Variables
Add these in Render dashboard → Environment:
```
NODE_ENV=production
DATABASE_URL=<your-postgres-connection-string>
SESSION_SECRET=<generate-a-random-secret>
FRONTEND_URL=<your-vercel-url>
```

To generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 5. Update Backend Code for Production

**server/index.ts** - Add CORS configuration:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

**Install cors package**:
```bash
npm install cors
npm install --save-dev @types/cors
```

#### 6. Deploy
- Click "Create Web Service"
- Render will automatically deploy when you push to GitHub
- Your backend URL: `https://nexcrm-backend.onrender.com`

---

## Part 2: Frontend Deployment (Vercel)

### Files Needed for Frontend
```
client/
├── src/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
vite.config.ts
package.json
tsconfig.json
tailwind.config.ts
postcss.config.js
```

### Step-by-Step Frontend Deployment

#### 1. Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with your GitHub account

#### 2. Prepare Frontend Code

**Update vite.config.ts** for production:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

**Update API base URL** in `client/src/lib/queryClient.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetcherFunction(input: string, init?: RequestInit) {
  const url = input.startsWith('/api') 
    ? `${API_BASE_URL}${input}` 
    : input;
  
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
  });
  // ... rest of the code
}
```

#### 3. Create Environment Variable File
Create `.env.production` in root:
```
VITE_API_URL=https://nexcrm-backend.onrender.com
```

#### 4. Deploy to Vercel
**Option A: Using Vercel Dashboard**
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Configure:
  - **Framework Preset**: Vite
  - **Root Directory**: `./` (keep as root)
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
  - **Install Command**: `npm install`

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
cd your-project
vercel
```

#### 5. Environment Variables in Vercel
In Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://nexcrm-backend.onrender.com
```

#### 6. Deploy
- Click "Deploy"
- Your frontend URL: `https://your-project.vercel.app`

---

## Part 3: Update Backend with Frontend URL

After deploying frontend:
1. Go to Render dashboard
2. Navigate to your backend service
3. Update environment variable:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```
4. Save changes (Render will auto-redeploy)

---

## Part 4: Database Setup

### Initial Database Migration
After backend is deployed:

1. Access Render Shell:
   - Go to Render dashboard → Your service
   - Click "Shell" tab
   - Run:
   ```bash
   npm run db:push
   ```

### Create Initial Admin User
Connect to your PostgreSQL database and run:
```sql
-- Generate password hash for 'password'
-- You can use: node -e "const crypto = require('crypto'); const salt = crypto.randomBytes(16).toString('hex'); const hash = crypto.scryptSync('password', salt, 64).toString('hex'); console.log(salt + ':' + hash);"

INSERT INTO users (username, email, full_name, role, password_salt, password_hash, created_at, updated_at)
VALUES (
  'admin',
  'admin@nexcrm.com',
  'Admin User',
  'admin',
  '<your-salt>',
  '<your-hash>',
  NOW(),
  NOW()
);
```

---

## Part 5: Testing Deployment

### 1. Test Backend
Visit: `https://nexcrm-backend.onrender.com/api/health`
Should return: `{"status": "ok"}`

### 2. Test Frontend
Visit: `https://your-project.vercel.app`
- Should load login page
- Try logging in with your admin credentials
- Verify WebSocket connection works
- Test creating a lead

### 3. Check CORS
Open browser console on frontend:
- Should see no CORS errors
- API requests should succeed

---

## Part 6: Domain Setup (Optional)

### Frontend Custom Domain
1. In Vercel: Settings → Domains
2. Add your domain (e.g., `app.nexcrm.com`)
3. Update DNS records as instructed

### Backend Custom Domain
1. In Render: Settings → Custom Domain
2. Add your domain (e.g., `api.nexcrm.com`)
3. Update DNS records as instructed

---

## Troubleshooting

### Backend Not Starting
- Check Render logs: Dashboard → Logs
- Verify DATABASE_URL is correct
- Ensure all dependencies are in package.json

### Frontend Can't Connect to Backend
- Verify VITE_API_URL is correct
- Check CORS configuration in backend
- Ensure credentials: 'include' in fetch calls

### Database Connection Issues
- Verify DATABASE_URL format
- Check IP allowlist in database settings
- Ensure SSL is enabled for production

### WebSocket Not Working
- Update WebSocket URL in frontend
- Ensure backend supports WSS for production
- Check Render service allows WebSocket connections

---

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
DATABASE_URL=<postgres-connection-string>
SESSION_SECRET=<random-secret>
FRONTEND_URL=<vercel-url>
```

### Frontend (Vercel)
```
VITE_API_URL=<render-backend-url>
```

---

## Maintenance

### Updating the App
1. Push changes to GitHub
2. Vercel and Render will auto-deploy
3. Database migrations: Run in Render Shell

### Monitoring
- **Vercel**: Dashboard shows deployments, analytics
- **Render**: Dashboard shows logs, metrics, health

### Backups
- Render PostgreSQL includes automatic backups
- Download backups from Render dashboard

---

## Cost Estimate

### Free Tier
- Vercel: Free for personal projects
- Render: Free tier available (sleeps after inactivity)
- PostgreSQL: Free tier (90 days retention)

### Paid Plans
- Vercel Pro: $20/month (better performance)
- Render Starter: $7/month (always on)
- PostgreSQL Starter: $7/month (more storage)

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Set up environment variables
4. ✅ Run database migrations
5. ✅ Create admin user
6. ✅ Test complete flow
7. 🎉 Share your NexCRM app!

---

## Support

Need help? Check:
- Vercel docs: https://vercel.com/docs
- Render docs: https://render.com/docs
- GitHub issues for this project

---

**Built with ❤️ using NexCRM**
