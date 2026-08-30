# Safari "Can't Open Page" After Google Login - Fix Guide

## Problem
After Google login, Safari shows "Safari can't open the page" instead of redirecting back to your app.

## Root Cause
Google is trying to redirect to a URL that:
1. Doesn't match what's configured in Google Console
2. Is not reachable by Safari
3. Has incorrect URL scheme or format

## Step-by-Step Fix

### 1. Check Current Redirect URL

Visit this debug page to see the exact URLs being generated:
- **Local:** http://localhost:3000/debug-auth
- **Production:** https://your-app.vercel.app/debug-auth

### 2. Fix Google Console Configuration

Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials):

1. **Find your OAuth 2.0 Client ID**
2. **Click to edit it**
3. **In "Authorized redirect URIs", add EXACTLY these URLs:**

   For **localhost development:**
   ```
   http://localhost:3000/auth/callback
   ```

   For **Vercel production** (replace with your actual domain):
   ```
   https://wyva-five.vercel.app/auth/callback
   https://your-custom-domain.com/auth/callback
   ```

4. **Remove any incorrect URLs** (common mistakes):
   - ❌ `http://localhost:3000/auth/callback/` (trailing slash)
   - ❌ `https://localhost:3000/auth/callback` (https on localhost)
   - ❌ URLs with extra path segments
   - ❌ URLs with different ports

5. **Click SAVE**

### 3. Verify Supabase Configuration

Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/auth/providers):

1. **Find Google provider**
2. **Ensure it's ENABLED (toggle ON)**
3. **Verify credentials match Google Console:**
   - Client ID should end with `.apps.googleusercontent.com`
   - Client Secret should start with `GOCSPX-`
4. **Click SAVE**

### 4. Check Site URL in Supabase

Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/auth/settings):

1. **Site URL should be:**
   - Local: `http://localhost:3000`
   - Production: `https://your-app.vercel.app`
2. **Additional Redirect URLs should include:**
   - `http://localhost:3000/**`
   - `https://your-app.vercel.app/**`

### 5. Test the Fix

#### Local Testing:
```bash
npm run dev
```
1. Go to http://localhost:3000/login
2. Click "Continue with Google"
3. Complete Google sign-in
4. Should redirect to http://localhost:3000/auth/callback
5. Then redirect to http://localhost:3000/tasks

#### Production Testing:
1. Go to https://your-app.vercel.app/login
2. Click "Continue with Google"
3. Complete Google sign-in
4. Should redirect to https://your-app.vercel.app/auth/callback
5. Then redirect to https://your-app.vercel.app/tasks

## Common Issues & Solutions

| Safari Error | Likely Cause | Fix |
|--------------|-------------|-----|
| "Can't open page" | Redirect URI mismatch | Check Google Console URIs |
| "Invalid request" | Wrong client ID | Verify Supabase Google config |
| "Unauthorized" | OAuth consent incomplete | Configure consent screen |
| Infinite redirect | Site URL wrong | Check Supabase site URL |

## Debug Steps

### 1. Check Browser Console
- Open Safari Developer Tools (Develop menu → Show Web Inspector)
- Look for error messages in Console tab
- Check Network tab for failed requests

### 2. Check Redirect URL in Action
1. Right-click "Continue with Google" button
2. Select "Inspect Element"
3. Look at the `onClick` handler
4. Check console logs when clicking

### 3. Verify Google OAuth Flow
When you click "Continue with Google", the URL should:
1. Start with `https://accounts.google.com/oauth/authorize`
2. Include `redirect_uri` parameter
3. The `redirect_uri` should match exactly what's in Google Console

### 4. Manual URL Test
Try visiting your callback URL directly:
- http://localhost:3000/auth/callback (should redirect to login with error)
- https://your-app.vercel.app/auth/callback (should redirect to login with error)

## Quick Fix Commands

### Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Clear Browser Cache
- Safari → Develop → Empty Caches
- Or use Private Browsing for clean test

### Check Environment Variables
```bash
# In your project directory
cat .env.local | grep SUPABASE
```

## Still Having Issues?

### 1. Check Exact URLs Being Generated
Visit `/debug-auth` page to see:
- Current origin
- Generated callback URL
- Environment configuration

### 2. Test with Different Browser
Try the same flow in Chrome or Firefox to see if it's Safari-specific.

### 3. Check Network Activity
Use Safari's Network tab to see:
- Where the redirect is trying to go
- What response code is returned
- Any error responses

## Expected Working Flow

1. **User clicks "Continue with Google"**
2. **Browser redirects to Google OAuth:**
   `https://accounts.google.com/oauth/authorize?client_id=...&redirect_uri=http://localhost:3000/auth/callback`
3. **User signs in with Google**
4. **Google redirects back to your app:**
   `http://localhost:3000/auth/callback?code=...`
5. **Your app exchanges code for session**
6. **User redirected to main app:**
   `http://localhost:3000/tasks`

If any step fails, Safari will show "Can't open page" error.

---

**After making changes, always test in a fresh browser session or private browsing mode to avoid cached redirects.**