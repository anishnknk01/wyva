# Google OAuth Setup for Wysa

## What You Have vs What You Need

### ❌ What You Have:
- **Google API Key**: `AIzaSyBi9-PwTEJcgZOtrxY_CFVuzeYX482d7Rc`
- This is for **Google Maps/Places API** - used for location services
- **Cannot be used for authentication**

### ✅ What You Need for Sign-In:
- **OAuth 2.0 Client ID** (looks like: `123456789-abc123xyz.apps.googleusercontent.com`)
- **OAuth 2.0 Client Secret** (looks like: `GOCSPX-abc123xyz`)
- These are for **authentication** - allowing users to sign in with Google

---

## Option 1: Get Google OAuth Credentials (5 minutes)

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your existing project (or create new one)

### Step 2: Enable Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External**
   - Fill in:
     - App name: `Wysa`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue** through all steps

4. Back at Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Wysa Web Client`
   
5. Add **Authorized redirect URIs**:
   ```
   https://bcsylldvbwgmzevrjnfa.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

6. Click **CREATE**

7. **Copy** the:
   - Client ID
   - Client Secret

### Step 4: Configure Supabase
1. Go to: https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa/auth/providers
2. Find **Google** provider
3. Toggle it **ON**
4. Paste:
   - **Client ID** (from step 3)
   - **Client Secret** (from step 3)
5. Click **Save**

### Step 5: Update Your App (Optional)
Update `.env.local`:
```bash
GOOGLE_CLIENT_ID=your-oauth-client-id-here
GOOGLE_CLIENT_SECRET=your-oauth-client-secret-here
```

Then restart your dev server:
```bash
npm run dev
```

---

## Option 2: Use Email/Password Only (Works Now!)

You can skip Google Sign-In and just use:

### ✅ Email & Password Login
1. Users sign up at `/signup`
2. Get confirmation email
3. Click link to verify
4. Log in at `/login`

### ✅ Magic Link Login
1. Users enter email at `/login`
2. Click "Log in with an email link instead"
3. Get magic link in email
4. Click to instantly log in

**Both methods work right now without any additional setup!**

---

## Quick Test (Right Now)

### Test Authentication Without Google:

1. **Visit**: http://localhost:3000/signup
2. **Create account** with:
   - Name: Test User
   - Email: your-email@example.com
   - Password: test123
3. **Check email** for confirmation link
4. **Click** the confirmation link
5. **Visit**: http://localhost:3000/login
6. **Log in** with your credentials
7. **Success!** You'll be redirected to `/tasks`

### Check Auth Status:
Visit: http://localhost:3000/test-auth

---

## Troubleshooting

### "Email not confirmed"
- Check your spam folder
- In Supabase Dashboard > Authentication > Settings
- Toggle "Enable email confirmations" to test without

### "Invalid credentials"
- Make sure you confirmed your email first
- Password must be at least 6 characters
- Check /test-auth for detailed error

### Google Sign-In button does nothing
- This is expected without OAuth setup
- It will show an error toast
- Use email/password instead

---

## Production Checklist

Before going live:

- [ ] Set up Google OAuth (if you want Google Sign-In)
- [ ] Update `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Add production URL to Google OAuth authorized redirects
- [ ] Configure custom email templates in Supabase
- [ ] Set up proper email sending (not Supabase defaults)
- [ ] Enable rate limiting in Supabase Auth
- [ ] Review and update OAuth consent screen
