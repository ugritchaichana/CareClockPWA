# CareClockPWA Deployment Guide

## Recommended: Deploy to Vercel

### Prerequisites
1. GitHub account
2. Vercel account (free)
3. Push your code to GitHub repository

### Step 1: Prepare Environment Variables
Copy your `.env.local` contents - you'll need:
```
MONGODB_URI=your_mongodb_atlas_connection_string
```

### Step 2: Deploy Options

#### Option A: Vercel Dashboard (Easiest)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Add Environment Variables:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB Atlas connection string
6. Click "Deploy"

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (run in project root)
vercel

# For production deployment
vercel --prod
```

### Step 3: Configure Custom Domain (Optional)
1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add your custom domain

### Alternative Deployment Options:

#### Netlify
1. Connect GitHub repository
2. Build command: `pnpm build`
3. Publish directory: `.next`
4. Add environment variables

#### Railway
1. Connect GitHub repository
2. Add environment variables
3. Automatic deployment

#### DigitalOcean App Platform
1. Create new app from GitHub
2. Configure build settings
3. Add environment variables
4. Deploy

### Build Verification
Before deploying, test locally:
```bash
pnpm build
pnpm start
```

### Important Notes:
- Make sure MongoDB Atlas allows connections from 0.0.0.0/0 for production
- Test all PWA features after deployment
- Verify service worker is working
- Check manifest.json is accessible
