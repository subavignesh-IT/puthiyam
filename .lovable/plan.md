## Goal

You use personal GPay (kathaiahkarthik@okhdfcbank), not a PhonePe merchant account. The "Secure PhonePe" button and the "send UPI request" input rely on a PhonePe merchant integration that will always fail with `KEY_NOT_CONFIGURED` for a non-merchant UPI ID. Remove that dead path and keep only the payment methods that actually work with a personal UPI ID.

## What will change

`src/components/QRCodePayment.tsx`
- Remove the "Pay with UPI (Secure)" PhonePe button and its loading/polling UI.
- Remove the "Your UPI Address" input + "Request" button (backend collect).
- Remove all `phonepe-collect`, `phonepe-initiate`, `phonepe-status` calls and related state (`gpayLoading`, `gpayPolling`, `collectTxnId`, `pollStatus`, etc.).
- Keep, in this order:
  1. "Pay with UPI" button → opens default UPI app (GPay, PhonePe, Paytm, etc.) via `upi://` intent.
  2. QR code scan block.
  3. Copy UPI ID block.
- Keep the 10-minute timer and auto-cancel behavior unchanged.
- Add a small note: "After paying, tap 'I've Paid' to confirm your order." plus an "I've Paid" confirm button that calls `onPaymentComplete()` (manual confirmation, since there is no gateway to verify).

`supabase/functions/phonepe-collect/`, `phonepe-initiate/`, `phonepe-status/`
- Delete these three edge functions — they are unreachable after the UI change.

Secrets (`PHONEPE_*`)
- Leave for now; harmless. Can be cleaned up later via Project Settings.

## What stays the same

- Branding, layout, product catalog, cart, checkout form, WhatsApp bill sharing, COD flow, order records, 10-minute auto-cancel — all untouched.
- The UPI intent button still launches GPay directly on mobile.

## Trade-off you should know

Without a gateway, order confirmation depends on the customer tapping "I've Paid." You verify the payment landed in your GPay app before shipping. If you later want automatic verification, sign up for Razorpay (free, works with any personal UPI as the receiving account) and I can wire it back in.
