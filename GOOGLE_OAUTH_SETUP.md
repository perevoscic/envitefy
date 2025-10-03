# Google OAuth Sign In/Up Implementation

## Summary

Google OAuth authentication has been successfully integrated into your Snap My Date application. Users can now sign in or sign up using their Google account in addition to the existing email/password authentication.

## Changes Made

### 1. Database Schema Updates

- Modified `users` table to make `password_hash` nullable
- OAuth users (Google sign-in) will have `password_hash = NULL`
- Existing email/password users are unaffected

### 2. Backend Changes

#### `src/lib/auth.ts`

- Added `GoogleProvider` to NextAuth configuration
- Implemented `signIn` callback to handle Google OAuth flow
- Auto-creates user accounts on first Google sign-in
- Extracts first name and last name from Google profile

#### `src/lib/db.ts`

- Added `createOrUpdateOAuthUser()` function to handle OAuth user creation
- Updated `verifyPassword()` to handle nullable password hashes
- Updated type definitions for nullable `password_hash`

### 3. Frontend Changes

#### `src/components/auth/LoginForm.tsx`

- Added "Continue with Google" button with official Google branding
- Added divider with "or" text between Google and email/password options
- Redirects to home page after successful Google sign-in

#### `src/components/auth/SignupForm.tsx`

- Added "Continue with Google" button
- Added divider with "or" text
- Redirects to subscription page after successful Google sign-up

### 4. Documentation

- Updated `AGENTS.md` with Google OAuth documentation
- Added changelog entry for October 3, 2025

## Environment Variables Required

Make sure the following environment variables are set in your `.env` file:

```bash
# Google OAuth (used for both authentication and calendar access)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth (already existing)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

## How It Works

### First-Time Google Sign In

1. User clicks "Continue with Google" button
2. Redirected to Google OAuth consent screen
3. After approval, Google returns user info (email, name)
4. A new user account is created with:
   - `email` from Google
   - `first_name` and `last_name` from Google profile
   - `password_hash = NULL`
   - `subscription_plan = "free"`
   - `credits = 3`
5. User is signed in and redirected

### Existing User with Same Email

- If a user already exists with the same email (created via email/password), they can still sign in with Google
- The system recognizes them by email and signs them in
- Their account remains unchanged (password is preserved if they had one)

### Security Considerations

- OAuth users cannot use password reset (they don't have passwords)
- OAuth users can only authenticate via Google
- Users who signed up with email/password can still use both methods if they share the same email

## Testing

### Local Testing

1. Start your development server: `npm run dev`
2. Open the login modal
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After approving, you'll be signed in and redirected back

### What to Test

- [ ] Sign up with Google (new user)
- [ ] Sign in with Google (existing user)
- [ ] Sign up with email/password (existing functionality)
- [ ] Sign in with email/password (existing functionality)
- [ ] Verify user profile shows correct name from Google
- [ ] Verify new users get 3 free credits
- [ ] Verify users are redirected to correct pages after auth

## Google Cloud Console Setup

If you haven't already configured your Google OAuth app, follow these steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

## UI Design

The Google sign-in button follows Google's official branding guidelines:

- White background with Google's multi-color logo
- "Continue with Google" text (more inclusive than "Sign in")
- Clean separation with "or" divider
- Maintains consistent spacing with existing form elements
- Disabled state shows reduced opacity

## Future Enhancements

Possible improvements for the future:

- [ ] Add Microsoft OAuth sign-in
- [ ] Add Apple Sign In
- [ ] Allow users to link multiple OAuth providers
- [ ] Show linked providers in user settings
- [ ] Allow OAuth users to set a password (for backup auth method)

## Troubleshooting

### "Failed to sign in with Google" error

- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Verify the redirect URI is configured in Google Cloud Console
- Check browser console for detailed error messages

### User not created in database

- Check database connection
- Verify `DATABASE_URL` is set correctly
- Check server logs for database errors

### Redirect loop

- Clear cookies and try again
- Verify `NEXTAUTH_URL` matches your actual URL
- Check that `NEXTAUTH_SECRET` is set

## Notes

- The database migration has been applied (password_hash is now nullable)
- No existing user data has been affected
- All existing authentication flows continue to work as before
- Google OAuth credentials can be reused from your existing calendar integration
