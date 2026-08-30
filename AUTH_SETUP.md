# Authentication Setup Guide

## Current Status: ✅ Fully Online (Supabase)

Your Wysa app uses **Supabase** for everything - no localStorage. All data is online and shared across devices.

## What's Working

- ✅ Supabase connection configured
- ✅ Database tables created
- ✅ Email/Password authentication ready
- ✅ Magic link authentication ready
- ✅ Auth callback handler configured

## To Enable Google Sign-In

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://bcsylldvbwgmzevrjnfa.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local testing)
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/bcsylldvbwgmzevrjnfa)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and enable it
4. Paste your:
   - Client ID
   - Client Secret
5. Save the configuration

### Step 3: Update .env.local (Optional)

The Google credentials in `.env.local` are optional since Supabase manages them:

```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Testing Authentication

### Test Page
Visit: http://localhost:3000/test-auth

This page shows:
- Supabase connection status
- Current session info
- Current user (if logged in)

### Test Email/Password Login

1. Go to http://localhost:3000/signup
2. Create an account with email and password
3. Check your email for confirmation link
4. Click the confirmation link
5. Go to http://localhost:3000/login
6. Log in with your credentials

### Test Magic Link

1. Go to http://localhost:3000/login
2. Click "Log in with an email link instead"
3. Enter your email
4. Check your email for the magic link
5. Click the link to log in

## Database Check

Make sure your Supabase database has these tables:
- `profiles` - User profiles
- `tasks` - All tasks
- `wysa_profiles` - Wysa companion profiles
- `ratings` - Task ratings
- `wysa_applications` - Applications to become a Wysa

## Email Settings

Make sure email sending is configured in Supabase:
1. Go to **Authentication** > **Email Templates**
2. Verify templates are enabled:
   - Confirm signup
   - Magic Link
   - Change Email
   - Reset Password

## Troubleshooting

### Can't log in with email/password?
- Check if email confirmation is required (Supabase > Authentication > Settings)
- Look at browser console for errors
- Visit /test-auth to see detailed error messages

### Google Sign-In not working?
- Verify Google OAuth is enabled in Supabase dashboard
- Check redirect URIs match exactly
- Clear browser cache and cookies
- Try incognito mode

### No confirmation email received?
- Check spam folder
- Verify email settings in Supabase
- Check Supabase logs for email delivery errors

## Production Deployment

Before deploying:

1. Update `NEXT_PUBLIC_SITE_URL` in `.env.local` to your production URL
2. Add production URL to Google OAuth authorized redirect URIs
3. Update Supabase redirect URLs in Authentication settings
4. Set up proper email templates
5. Enable email rate limiting
