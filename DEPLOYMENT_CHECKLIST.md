# Netlify Deployment Checklist

## Pre-Deployment Checklist

### ✅ Project Configuration
- [x] `netlify.toml` file configured
- [x] Build command: `npm run build:no-lint`
- [x] Publish directory: `dist`
- [x] Node version: 18
- [x] SPA redirects configured
- [x] Security headers configured
- [x] Cache headers optimized

### ✅ Build Scripts
- [x] `build:no-lint` script available
- [x] TypeScript compilation configured
- [x] Vite build process ready

### ✅ Environment Variables
- [ ] Set up environment variables in Netlify dashboard:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `OPENROUTER_API_KEY`
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `TELEGRAM_ADMIN_CHAT_ID`
  - [ ] `SENDGRID_API_KEY`
  - [ ] `SITE_URL`
  - [ ] `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`
  - [ ] `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`

## Deployment Steps

### 1. Prepare Your Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 2. Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub/GitLab/Bitbucket repository
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build:no-lint`
   - Publish directory: `dist`
6. Click "Deploy site"

#### Option B: Deploy via Netlify CLI
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

### 3. Configure Environment Variables
1. Go to your site dashboard in Netlify
2. Navigate to Site settings > Environment variables
3. Add all required environment variables from `env.example`
4. Ensure all `VITE_` prefixed variables are set for client-side access

### 4. Configure Domain (Optional)
1. Go to Site settings > Domain management
2. Add your custom domain (e.g., tevasul.group)
3. Configure DNS settings as instructed by Netlify

### 5. Test Deployment
- [ ] Test homepage loads correctly
- [ ] Test authentication flow
- [ ] Test file upload functionality
- [ ] Test Telegram integration
- [ ] Test email verification
- [ ] Test admin dashboard
- [ ] Test responsive design on mobile

## Post-Deployment Verification

### ✅ Functionality Tests
- [ ] User registration and login
- [ ] Email verification
- [ ] File upload and management
- [ ] Telegram bot integration
- [ ] Admin dashboard access
- [ ] Health insurance forms
- [ ] Voluntary return forms
- [ ] Theme switching
- [ ] Language switching

### ✅ Performance Tests
- [ ] Page load times
- [ ] Image optimization
- [ ] Caching effectiveness
- [ ] Mobile performance

### ✅ Security Tests
- [ ] HTTPS enforcement
- [ ] Security headers
- [ ] CORS configuration
- [ ] Authentication flow

## Troubleshooting

### Common Issues
1. **Build fails**: Check Node version and build logs
2. **Environment variables not working**: Ensure `VITE_` prefix for client-side variables
3. **Routing issues**: Verify `_redirects` file and `netlify.toml` redirects
4. **CORS errors**: Check Supabase configuration
5. **Authentication issues**: Verify OAuth redirect URLs

### Useful Commands
```bash
# Test build locally
npm run build:no-lint

# Preview build
npm run preview

# Check Netlify status
netlify status

# View deployment logs
netlify logs
```

## Monitoring
- Set up Netlify analytics
- Configure error tracking
- Monitor performance metrics
- Set up uptime monitoring

## Backup Plan
- Keep local development environment ready
- Document rollback procedures
- Maintain staging environment if needed
