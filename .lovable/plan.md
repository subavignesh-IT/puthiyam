# Per-product Delivery, Wholesale Tiers & UPI Cleanup

## 1. Database changes (one migration)

Add to `public.products`:
- `delivery_charge numeric default 0` — delivery charge per product (per line item, not per unit).
- `free_delivery_quantity integer default 0` — when cart quantity of that product is ≥ this number, its delivery charge is waived (0 = always charge).

New table `public.product_wholesale_tiers`:
- `id`, `product_id` (FK products, on delete cascade), `min_quantity` (int), `price` (numeric), `created_at`.
- Unique (product_id, min_quantity).
- GRANT select to anon + authenticated (public read like products).
- GRANT insert/update/delete to authenticated; RLS policy: only the product's seller (existing role check pattern) can modify.

## 2. Admin / Seller "Add / Edit Product" form (`src/pages/SellerDashboard.tsx`)

Add to the product editor:
- "Delivery charge (₹)" number input.
- "Free delivery when quantity ≥" number input (0 = always charged).
- "Wholesale tiers" repeater: rows of `min_quantity` + `price`, with Add/Remove buttons. Saved to `product_wholesale_tiers` on submit (delete existing rows then insert).

## 3. Product type + fetching (`src/types/product.ts`, product loaders)

Extend `Product` and `CartItem`:
- `deliveryCharge?: number`
- `freeDeliveryQuantity?: number`
- `wholesaleTiers?: { minQuantity: number; price: number }[]`

Map these from DB everywhere products are loaded (Index, ProductDetail, Trending, etc.).

## 4. Cart pricing & shipping logic (`src/context/CartContext.tsx`)

- Add helper `getEffectivePrice(item)`:
  - Start from variant price (or base price).
  - If `wholesaleTiers` exist, pick the tier with the highest `minQuantity ≤ item.quantity`; use that price instead.
- `getTotal()` uses `getEffectivePrice`.
- Replace `getShippingCost()`:
  - Sum each item's `deliveryCharge ?? 0`, **skipping** items whose `quantity ≥ freeDeliveryQuantity` (when threshold > 0).
  - Keep the existing global rule as a fallback only if no product has its own delivery charge (so current behaviour isn't broken for old products).
- Expose `getItemEffectivePrice` and `getItemDeliveryCharge` for the cart UI to show "Wholesale price applied" and "Free delivery unlocked" badges.

## 5. Cart UI (`src/pages/Cart.tsx`, `src/components/CartItem.tsx`)

- Show per-line delivery charge under each item; strike it through and show "Free delivery (qty ≥ N)" when threshold met.
- Show "Wholesale price ₹X (≥N qty)" hint when a tier is active, and a "+M more for next tier" hint when close.
- Order summary lists Subtotal, Delivery (sum of per-item charges), Total.

## 6. Checkout / order persistence (`src/components/CheckoutForm.tsx`)

- Use cart's new total + delivery sum (already through `getTotal` + `getShippingCost`); no schema change to `orders` (it already stores totals).
- Bill image shows the same breakdown.

## 7. UPI button cleanup (`src/components/QRCodePayment.tsx`)

- Button label "Pay ₹X with GPay (Secure)" → **"Pay ₹X with UPI (Secure)"**.
- Button label "Pay ₹X with UPI App" → **"Pay ₹X with UPI"**.
- Remove the helper text listing app names ("GPay, PhonePe, Paytm, BHIM, etc.") and replace with "Opens your default UPI app".

## Out of scope

- No changes to payments backend, order schema, or UPI deep-link URL itself.
- Pre-booking / out-of-stock rules unchanged.
