# Plan: Fix OTP & Password Reset (caused by HashRouter)

## Root cause

Auth logs confirm the backend **is** sending both the OTP email and the password-reset email successfully (`Hook ran successfully`, `status 200`). The problem is on the frontend.

Earlier we switched `src/App.tsx` from `BrowserRouter` to `HashRouter` to "fix" refresh 404s. But Lovable hosting already handles SPA refresh natively — so HashRouter was unnecessary, and it actively breaks Supabase auth:

- Supabase puts auth tokens in the URL **hash fragment** (`#access_token=...&type=recovery&...`)
- `HashRouter` *also* uses the hash for routing — it consumes/overwrites it
- Result:
  - **Password reset link** opens `/#/reset-password` and the recovery token gets lost → page shows "Invalid or expired" or never enters recovery mode → user can't set a new password
  - **OTP magic link** in the email click-redirects with `#access_token=...` → HashRouter eats it, session never gets set, user appears to receive nothing usable

This also explains why some OTP emails seem to "never arrive" — the magic link does arrive, but clicking it lands on a broken URL, so it looks like nothing happened.

## Fix

### 1. `src/App.tsx`
Revert `HashRouter` → `BrowserRouter`. Lovable hosting's SPA fallback handles refresh on `/login`, `/cart`, etc. automatically.

### 2. `src/components/OTPVerification.tsx`
When calling `supabase.auth.signInWithOtp`, pass `emailRedirectTo: ${window.location.origin}` so the magic link (the email's backup click target) also returns to the app cleanly.

### 3. `src/pages/ResetPassword.tsx`
Make recovery detection more robust:
- Detect recovery from either the URL hash *or* the `?code=` query (PKCE) *or* the `PASSWORD_RECOVERY` auth event
- If a `?code=` is present, call `supabase.auth.exchangeCodeForSession(code)` once to establish a recovery session
- Only show "Invalid or expired" if none of the above are present after a brief delay

### 4. `src/pages/Login.tsx`
Forgot-password call already uses `redirectTo: ${window.location.origin}/reset-password` — keep as-is (BrowserRouter restored, so this URL works again).

## What stays the same
- Email OTP via Supabase (free, no SMS).
- 6-digit code entry + Resend-anytime + Invalid popup.
- All other routes and features untouched.

## Verification after build
1. Refresh `/login`, `/cart`, `/orders` → should load (Lovable SPA fallback).
2. Login → OTP screen → check email → enter 6-digit code → logged in.
3. Forgot Password → enter email → check inbox → click link → land on `/reset-password` → set new password → success.
