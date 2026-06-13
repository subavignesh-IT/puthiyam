# Plan: Switch OTP to Free Supabase Email OTP

Replace the paid/limited Twilio SMS OTP with Supabase's built-in **Email OTP**. This is completely free, unlimited, works for every user worldwide, and requires zero secrets or external service.

## How it will work

1. After the user enters email + password and clicks **Continue** on the Login page, we still verify their password.
2. Instead of calling the `send-otp` edge function (Twilio), we call Supabase's built-in `supabase.auth.signInWithOtp({ email })` which emails a 6-digit code to the same email they just logged in with.
3. The OTP screen now asks for a **6-digit code** from email (not 4-digit SMS).
4. On submit we call `supabase.auth.verifyOtp({ email, token, type: 'email' })`. If correct → logged in. If wrong → the existing "Invalid OTP" popup appears with a Resend button.
5. **Resend** simply calls `signInWithOtp` again — works any time, for all users.

## Changes

### Frontend
- **`src/pages/Login.tsx`**
  - Remove the phone number field and validation.
  - Pass `email` (instead of `phone`) into `<OTPVerification />`.
- **`src/pages/Signup.tsx`** (if it uses the same flow)
  - Same swap: send email OTP after signup instead of SMS.
- **`src/components/OTPVerification.tsx`**
  - Change prop `phone` → `email`.
  - Change OTP length 4 → 6 digits (update input + validation).
  - Replace the `send-otp` edge function call with `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })`.
  - Replace local OTP verification with `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
  - Update the helper text to "We sent a 6-digit code to your email".
  - Keep the existing "Invalid OTP" AlertDialog and Resend-anytime behavior.

### Backend
- **`supabase/functions/send-otp/index.ts`** — no longer used by the app. Leave it in place (harmless) or delete later. No new edge function needed.
- No new secrets required. Twilio connector can stay connected or be removed; it's no longer called.

### Email template (optional, not in this plan)
Supabase's default email template will deliver the OTP immediately and works out of the box. We can brand it later via Lovable's auth email templates if you want — just say the word.

## What stays the same
- Login flow UX (password → OTP screen → home).
- Invalid OTP popup + always-available Resend.
- Routing, cart, profile, all other features untouched.

## Tradeoffs vs SMS
- ✅ Free forever, unlimited, works for every user.
- ✅ No phone field needed on login.
- ⚠️ OTP arrives in the user's inbox (not SMS). They'll need email access on their device.
