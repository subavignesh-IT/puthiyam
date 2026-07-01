# Plan: Multiple Fixes & Enhancements

## 1. Seller product form — remove fields
- Remove **Base Price** input entirely from Add/Edit product form in `SellerDashboard.tsx`
- Remove the single **Wholesale price** field (keep multi-tier wholesale intact)
- Save `base_price` as the lowest variant price automatically (DB column stays; derived from variants) so existing schema/orders keep working

## 2. UPI payment screen (`QRCodePayment.tsx`)
- Remove any remaining UPI app names / labels — keep only two buttons:
  - **Pay with UPI App** (opens device default UPI app via `upi://` intent)
  - **Show QR Code** (renders QR)
- For the "Pay to UPI ID" flow, wire a real **UPI Collect request** via the existing PhonePe edge function (`phonepe-initiate` already deployed). New button "Request payment to my UPI ID" calls a new `phonepe-collect` edge function that hits PhonePe's `/pg/v1/pay` with `PAY_PAGE` → `UPI_COLLECT` instrument (payer VPA sent to backend). Success → payer receives push notification in their UPI app. Frontend polls existing `phonepe-status` and only confirms order on `PAYMENT_SUCCESS`.

## 3. Home delivery button
- Update the delivery option label on `CheckoutForm.tsx` to show the **live courier / delivery charge** computed from cart items (sum of each product's `deliveryCharge`, waived per-product when `freeDeliveryQuantity` is reached). E.g. "Home Delivery — ₹80".

## 4. Global font size bump
- In `src/index.css`, increase root `html { font-size }` from default 16px → **17px** (≈6% bump across the app) so it scales all `rem`-based sizes uniformly without touching individual components.

## 5. Default customer name
- In checkout + signup, when the name field is empty, save/display **"Customer"** as the default (not "online payment", since that's confusing as a person name).
- Applied in `CheckoutForm.tsx` order insert and `Signup.tsx` profile creation.

## 6. Account actions
- Delete auth user **kathaiahkarthik@gmail.com** via existing `delete-user` edge function (removes profile, roles, loyalty, auth record) so they can freshly sign up as a normal customer.
- Add **seller role** for the current logged-in user (the "me" who's asking). Will use `supabase--insert` to insert a `user_roles` row with `role = 'seller'` for your `auth.uid()`. Please confirm which email is "me" in the next turn — I'll ask before running.

## 7. index.html
- Add `<meta name="google-site-verification" content="Nh5hwutvKtEB84fZqN0PTUvyl2Yfp1-BcMarfMmmXF0" />` inside `<head>` (line 9 area) for Google Search Console verification.

## 8. Extra animations across frontend
- Add new keyframes in `tailwind.config.ts` + `index.css`: `float-slow`, `shimmer-bg`, `pop-in`, `slide-up-fade`, `gradient-shift`, `bounce-soft`
- Apply subtly across:
  - `ProductCard` — `pop-in` on mount + softer hover-lift
  - `Header` — logo `float-slow`
  - Buttons (primary) — subtle `shimmer-bg` on hover
  - Cart items — `slide-up-fade` on add
  - Trending / hero — animated `gradient-shift` background
  - Dialogs / popups — enhanced `scale-in` with easing curve

## Files to change
- `src/pages/SellerDashboard.tsx` (remove base price + wholesale single field)
- `src/components/QRCodePayment.tsx` (button-only UPI + collect flow)
- `supabase/functions/phonepe-collect/index.ts` (NEW — UPI collect API)
- `src/components/CheckoutForm.tsx` (delivery label + default name)
- `src/pages/Signup.tsx` (default name = "Customer")
- `src/index.css` (root font-size + new keyframes)
- `tailwind.config.ts` (register new animations)
- `src/components/ProductCard.tsx`, `Header.tsx`, `CartItem.tsx` (apply animations)
- `index.html` (Google verification meta)

## Data operations (after approval)
- Call `delete-user` edge fn for `kathaiahkarthik@gmail.com`
- Insert `seller` role for current user (need to confirm your email)

## Follow-up question
Before I run the seller-role insert, **please tell me which email is "me" (the account that should get seller role)** — is it the same account currently logged into the preview, or a different one?
