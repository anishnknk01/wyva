# Google OAuth Configuration Fix

## Current Error Diagnosis

Your Google login might be failing due to one of these common issues:

### 1. **Redirect URI Mismatch** (Most Common)
**Problem:** Google Console redirect URIs don't match your app URLs

**Fix:** Add these exact URLs to Google Console:

#### For Development (localhost):
```
http://localhost:3000/auth/callback
```

#### For Production (Vercel):
```
https://your-app.vercel.app/auth/callback
https://wyva-five.vercel.app/auth/callback
```

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click your OAuth 2.0 Client ID: `[YOUR_CLIENT_ID]`
3. Under "Authorized redirect URIs", add the URLs above
4. Click **SAVE**

### 2. **Supabase Google Provider Not Enabled**
**Problem:** Google provider disabled in Supabase dashboard

**Fix:** Enable Google provider in Supabase:

1. Go to [Supabase Auth Providers](https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/auth/providers)
2. Find **Google** in the list
3. Toggle it **ON** (enabled)
4. Enter these credentials:
   - **Client ID**: `[YOUR_GOOGLE_CLIENT_ID]`
   - **Client Secret**: `[YOUR_GOOGLE_CLIENT_SECRET]`
5. Click **Save**

### 3. **Environment Variables Missing in Vercel**
**Problem:** Vercel deployment missing required environment variables

**Fix:** Add to Vercel Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]
```

### 4. **OAuth Consent Screen Issues**
**Problem:** OAuth consent screen not properly configured

**Fix:** Configure OAuth consent screen:

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. **App Information:**
   - App name: **Wysa**
   - User support email: Your email
   - Developer contact: Your email
3. **Authorized domains:**
   - Add: `supabase.co`
   - Add: `vercel.app` (if using Vercel)
4. **Test users** (for testing phase):
   - Add your Google email address
5. Click **Save and Continue**

## Quick Test Steps

### Test Locally:
1. Run: `npm run dev`
2. Go to: http://localhost:3000/login
3. Click "Continue with Google"
4. Should redirect to Google sign-in

### Test Production:
1. Go to your Vercel URL: https://wyva-five.vercel.app/login
2. Click "Continue with Google"
3. Should redirect to Google sign-in

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `redirect_uri_mismatch` | Wrong redirect URL | Fix redirect URIs in Google Console |
| `access_denied` | User cancelled | Normal - user chose not to continue |
| `unauthorized_client` | OAuth setup incomplete | Complete OAuth consent screen |
| `invalid_request` | Missing parameters | Check Supabase provider config |
| `Configuration error` | Supabase/Google mismatch | Verify credentials match |

## Debug Mode

To see detailed error messages, check:

1. **Browser Console** (F12 → Console) for client errors
2. **Vercel Logs** for server errors
3. **Supabase Auth Logs** in dashboard

## Working Configuration Checklist

- [ ] Google Console: Redirect URIs added
- [ ] Google Console: OAuth consent screen configured
- [ ] Supabase: Google provider enabled
- [ ] Supabase: Correct credentials entered
- [ ] Vercel: Environment variables added
- [ ] Local: `.env.local` file present

## Still Having Issues?

1. **Clear browser cache** and cookies
2. **Try incognito mode** to test fresh
3. **Check network tab** in dev tools for failed requests
4. **Verify your Google account** is added as test user

---

After fixing the configuration, restart your development server:
```bash
npm run dev
```

And redeploy to Vercel to apply environment variable changes.