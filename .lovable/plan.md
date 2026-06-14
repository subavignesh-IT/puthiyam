## Plan: Remove OTP from Login, Keep HashRouter

HashRouter is already active in `src/App.tsx` — no change needed there.

### Changes

1. **`src/pages/Login.tsx`**
   - Remove `showOTP` state, `OTPVerification` import, and the OTP branch render.
   - Remove the `phone` field from `formData` and the phone Input block + validation.
   - After successful `signIn`, show a "Welcome Back" toast and `navigate('/')` directly.
   - Remove the helper text about receiving an OTP.

2. **`src/components/OTPVerification.tsx`** — leave the file in place (unused) so we don't break any other imports. Will delete only if nothing else references it (will verify during build).

3. **Memory update** — remove the `[Auth OTP]` entry from `mem://index.md` since SMS OTP is no longer part of login.

### Out of scope
- `send-otp` edge function and Twilio config remain untouched (no longer invoked from login).
- Signup flow is not modified unless you want OTP removed there too.

Want me to also strip OTP from Signup, or only from Login?