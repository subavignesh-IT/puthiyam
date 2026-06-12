## Problem

In the current checkout, when a customer clicks any UPI app button (GPay/PhonePe/Paytm/BHIM) or the "Open Any UPI App" button, the app opens with the payment prefilled. As soon as the user returns to the browser tab (even if they just opened and closed the UPI app without paying), a popup appears with only a **"Yes, Payment Done ✓"** button. Clicking it marks the order as **paid** in the database with no actual verification. The customer can get a "paid" order without paying.

The PhonePe-backed "Pay with GPay (Secure)" button is fine — it polls `phonepe-status` and only confirms the order after the backend sees the payment.

## Goal

Only mark an order as **paid** when a backend payment-status check confirms success. Opening and closing a UPI app must never produce a paid order.

## Changes

1. **Remove the trust-based confirmation popup** in `src/components/QRCodePayment.tsx`:
   - Delete the visibility-change handler that shows the "Did you complete the payment?" dialog.
   - Delete the `showConfirmDialog` AlertDialog and the `handlePaymentConfirmed` shortcut that calls `onPaymentComplete()` without verification.
   - Remove `upiAppOpened`, `returnCheckRef`, and the unused `paymentRequested` collect-request shortcut that also marks paid without verification.

2. **Route every UPI path through the verified PhonePe initiate/status flow**:
   - Make the existing `handlePayWithGpay` the single entry point for online payment.
   - `UPIAppSelector`, the QR code, the "Copy UPI ID", and the "Enter your UPI / Request" inputs become informational only — they no longer trigger `onPaymentComplete`. Either:
     - Hide them when `paymentMethod === 'online'` and keep only the secure PhonePe button, OR
     - Keep them visible but show a clear note: "Manual UPI payments are not auto-confirmed. Use the Secure GPay button above so we can verify your payment."
   - Recommended: hide the manual blocks for online orders to avoid confusion.

3. **Promote the secure button** in `QRCodePayment.tsx`:
   - Make "Pay ₹X with GPay (Secure)" the primary, full-width action at the top.
   - While polling, keep the existing "Cancel Payment" affordance so the user can abort.
   - Order is created/marked paid only from inside the `pollStatus` success branch (already the case for this flow).

4. **Reassure the user in the UI**:
   - Add a short line under the secure button: "Order is placed only after we receive payment confirmation from PhonePe."
   - When the 10-minute timer expires with no confirmed payment, keep the existing auto-cancel (`onTimeout`) so unpaid orders never persist.

5. **No database/schema changes** required. `payment_status` continues to be set to `'paid'` in `CheckoutForm.handlePaymentSuccess`, but that function will now only run after backend-verified success.

## Out of scope

- COD flow is unchanged (still `payment_status: 'pending'` until delivery).
- No changes to the `phonepe-initiate` / `phonepe-status` edge functions.
- No changes to order ID generation, loyalty, or WhatsApp share.

## Technical notes

Files touched:
- `src/components/QRCodePayment.tsx` — remove unverified confirmation paths, restructure UI around the secure PhonePe button.
- `src/components/UPIAppSelector.tsx` — either no longer rendered for online payments, or its `onAppOpened` prop becomes a no-op (kept for the manual/info case).

No new dependencies, no migrations.
