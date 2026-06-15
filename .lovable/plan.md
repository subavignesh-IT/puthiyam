# Plan

## 1. Remove UPI app selector buttons
- In `src/components/QRCodePayment.tsx`, remove the `UPIAppSelector` usage and its import. Replace it with a single "Pay with UPI App" button that opens the standard `upi://pay?...` URL — the device will prompt the user to choose / use their default UPI app (GPay, PhonePe, Paytm, BHIM, etc.).
- Delete `src/components/UPIAppSelector.tsx` (no longer used anywhere else — will verify with a quick grep before deletion; if referenced elsewhere, keep file but stop rendering it).

## 2. Bill download button on Cart for 5 minutes after order confirm
- After a successful order in `src/components/CheckoutForm.tsx`, store the last confirmed order info in `localStorage` under a key like `lastOrder` with `{ orderId, items, totals, customer, timestamp }`.
- In `src/pages/Cart.tsx`, read `lastOrder` on mount. If `Date.now() - timestamp < 5 * 60 * 1000`, render a "Download Bill" section above the cart content with:
  - Order ID label
  - A countdown showing remaining minutes/seconds
  - A "Download Bill Image" button that renders the existing `OrderBillImage` / `CheckoutBillImage` component off-screen, converts to PNG via `html2canvas` (already used in the bill flow), and triggers a download.
  - Auto-hides once the 5-minute window elapses (via a `setInterval` updating remaining time; clears the localStorage entry when expired).
- Works whether the cart is empty or full (shown at the top of the page).

## Technical notes
- No backend / schema changes.
- Files to edit: `src/components/QRCodePayment.tsx`, `src/components/CheckoutForm.tsx`, `src/pages/Cart.tsx`.
- File to delete (if unused elsewhere): `src/components/UPIAppSelector.tsx`.
- Reuse the existing bill image component already used for WhatsApp sharing — no new rendering logic.
- WhatsApp auto-share flow stays as-is.
