## Scope

Six changes, all scoped to the storefront/seller/admin flows. Branding, catalog, and payment logic stay as-is.

### 1. Require login for cart & checkout (browsing stays public)
- Add a `RequireAuth` wrapper around `/cart` in `src/App.tsx` that redirects unauthenticated users to `/login` with a `returnTo` param.
- Guard "Add to Cart" and "Buy Now" actions in `ProductCard.tsx` and `ProductDetail.tsx` — if not logged in, redirect to `/login`.
- After login, `Login.tsx` honors `returnTo` and navigates back.

### 2. Seller approval workflow
- New table `public.seller_requests` (user_id, full_name, email, phone, shop_name, status: pending/approved/rejected, created_at). RLS: user inserts/reads own row; admins read/update all. GRANTs for authenticated + service_role.
- `SellerSignup.tsx`: stop auto-granting the `seller` role. Instead insert a row into `seller_requests` (status=pending) and show "Awaiting admin approval".
- `SellerLogin.tsx`: if a signed-in user has no `seller` role, check `seller_requests`. If none, offer "Request seller access"; if pending, show waiting screen; if approved but role missing, grant on the fly.
- `AdminDashboard.tsx`: new "Seller Requests" tab listing pending requests with Approve / Reject. Approve inserts `('seller')` into `user_roles` and marks request approved.
- Notify admin: new edge function `notify-seller-request` triggered on insert — sends WhatsApp link (opens wa.me/919361284773 with prefilled text) via a shared queue row, plus an in-app admin badge count on the tab.

### 3. Remove password reset
- Remove the "Forgot Password?" UI and dialog from `Login.tsx` and `SellerLogin.tsx`.
- Delete `src/pages/ResetPassword.tsx` and its route in `App.tsx`.

### 4. Manual POS (offline cash sale) for sellers
New tab **"POS / Cash Sale"** inside `SellerDashboard.tsx`.

Flow:
1. Seller picks products (with variants + quantity) from their own catalog.
2. Enter customer name + optional phone.
3. Choose payment mode: **Cash** or **UPI (manual QR)**. For UPI, generate a QR pointing to the seller's UPI ID for the exact total (seller UPI stored in `profiles.upi_id` — new column).
4. On "Complete Sale", insert an `orders` row with:
   - `payment_method = 'offline_cash'` or `'offline_upi'`
   - `sale_channel = 'offline'` (new column, default `'online'`)
   - `status = 'delivered'` (POS sales are immediate)
   - Same seller/product/variant/loyalty logic as online orders.
5. Generate a bill PNG via existing `OrderBillImage.tsx` renderer; provide **Download** and **Share to WhatsApp** buttons (uses customer phone if entered).

### 5. Per-seller e-bill on confirmed online orders
- On successful online order confirmation (in `CheckoutForm.tsx` after order insert), group items by seller_id and, for each seller, render a bill image via `OrderBillImage.tsx` and:
  - Store the bill PNG in `order-bills` storage bucket (new public bucket) keyed by `orderId_sellerId.png`.
  - Add a `Bills` tab entry in `SellerDashboard.tsx` listing bills for that seller's orders (query orders where any order item's seller = current seller).
  - Auto-open WhatsApp share to the seller's `profiles.phone` with the bill link (best-effort; requires the seller to have a phone on file).

### 6. Data model additions

```text
seller_requests(id, user_id fk auth.users, full_name, email, phone, shop_name,
                status text check in (pending|approved|rejected), admin_note,
                created_at, updated_at)
profiles.upi_id text
orders.sale_channel text default 'online'   -- 'online' | 'offline'
orders.payment_method extended: 'offline_cash', 'offline_upi'
storage bucket: order-bills (public)
```

All new tables include GRANTs and RLS per project standards.

## Out of scope
- No changes to product catalog, theme system, MCP, or existing PhonePe flow.
- No changes to loyalty rules beyond ensuring POS sales count the same way.

## Technical notes (for engineers)
- Admin WhatsApp notification uses a client-side `window.open('https://wa.me/919361284773?text=...')` triggered when the admin next opens the dashboard, plus an edge function that can be extended later to push automatically.
- `RequireAuth` uses the existing `useAuth` hook; while `loading` is true it renders a spinner to avoid flicker.
- Bill PNG rendering already exists via html-to-image in `OrderBillImage`; reuse it server-agnostic on the client.
