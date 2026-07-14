## Scope

Major overhaul of the POS system (Vyapar-style), customer management, invoice sharing, and site-wide polish.

## 1. POS — Vyapar-style full-screen experience

Rewrite `src/components/POSTab.tsx` as a full-screen two-pane layout (opens in a modal/route overlay):

```text
┌─────────────────────────────┬──────────────────────┐
│  Product Search + Grid      │  Cart / Bill         │
│  [🔍 search box]            │  Customer: [+ add]   │
│  ┌────┬────┬────┬────┐      │  ────────────────    │
│  │img │img │img │img │      │  Item 1  qty ₹       │
│  │₹99 │₹120│... │... │      │  Item 2  qty ₹       │
│  └────┴────┴────┴────┘      │  ────────────────    │
│  (tap card → adds to cart)  │  Subtotal            │
│                             │  Courier ₹           │
│                             │  Total ₹             │
│                             │  [Cash] [UPI QR]     │
│                             │  [Save & Share JPG]  │
└─────────────────────────────┴──────────────────────┘
```

- **Product search** input filters product grid live (name/category).
- Tapping a product card auto-adds it with its **default variant** (first `is_default=true` or lowest-price variant); a small dropdown on the card allows switching variant before add.
- **Wholesale tiers** applied automatically: when a cart line's quantity crosses `product_wholesale_tiers.min_quantity`, unit price drops to that tier's price (shown as "Wholesale ₹X applied").
- **Courier / delivery** section (same fields as online checkout): delivery type (self-pickup/home delivery), address, courier charge input; free-delivery-quantity rule from product settings still applies.
- **UPI QR**: when payment mode = UPI, render the generated QR at large size + a "Send QR as image" button that downloads QR as PNG and opens WhatsApp with the customer's number pre-filled.

## 2. Customer management (POS)

- **[+] icon** next to customer field opens a small dialog: name, phone, optional address → saved locally on the POS order and to a lightweight `pos_customers` table (seller-scoped) for reuse/autocomplete.
- **Customers tab** in Seller Dashboard: list of POS customers with delete (X) button. Deleting a POS customer only removes the POS record — it does **not** touch `auth.users` or `profiles`.
- Clarification needed: the phrase "removes the user identity like login they resign newly" is being interpreted as POS-only customer records (not signed-up app users). Deleting a real signed-up customer from admin should stay in Admin Dashboard's existing user-management flow.

## 3. Invoice sharing — JPG for online + offline

- Replace the current text-based POS bill (`buildBillText` → `.txt` download and WhatsApp text) with a rendered **JPG invoice** using the existing `OrderBillImage` component + `html-to-image` (`toJpeg`).
- POS bill will include: seller name, order id, customer, items, wholesale note, courier details, subtotal/courier/total, payment mode, UPI QR (if UPI).
- Online checkout in `CheckoutForm.tsx`: switch the WhatsApp share from text/PNG to **JPG** for consistency; keep existing 9361284773 auto-share.
- Both flows: `Share as JPG` button uses Web Share API with `files: [File]` where supported, falling back to WhatsApp URL + downloaded JPG.

## 4. Courier details on offline orders

- POS order payload extended with `delivery_type`, `customer_address`, `shipping_cost` (already columns on `orders`).
- Bill component renders courier row when `delivery_type === 'shipping'`.

## 5. Seller signup notification (already partly wired)

- Verify `SellerSignup` still opens WhatsApp to 9361284773 with the request details on submit.
- Add a fallback: also insert a row into `seller_requests` (already exists) and show admin a red badge on the "Seller Requests" tab in `AdminDashboard`.
- Add a browser notification / toast on `AdminDashboard` mount when there are pending requests.

## 6. Site-wide typography & contrast

- Bump root font-size from 17px → **18px** in `src/index.css`.
- Introduce two utility tokens: `--text-on-surface` and `--text-on-muted` computed from theme; audit components currently using `text-muted-foreground` on `bg-muted` and swap where contrast is low.
- Enforce WCAG AA contrast in Midnight Dark (primary theme).

## 7. Grid alignment audit

- Product grid, admin product list, POS grid, cart items, orders list — normalize to a single responsive grid utility (`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch`) and ensure every card uses `flex flex-col h-full` so buttons align to the bottom.

## Technical notes

- New table `pos_customers` (seller_id, name, phone, address) with RLS scoped to `seller_id = auth.uid()` and appropriate GRANTs.
- `html-to-image` already usable; if missing, add via bun.
- Wholesale application logic centralized in a small helper `getEffectivePrice(product, qty)` reused by cart + POS.
- No changes to auth schema; "customer deletion" in POS ≠ deletion of `auth.users`.

## Files to touch

- `src/components/POSTab.tsx` (rewrite, full-screen)
- `src/components/OrderBillImage.tsx` (add courier + wholesale rows)
- `src/components/CheckoutForm.tsx` (JPG share)
- `src/pages/SellerDashboard.tsx` (new Customers tab, POS entry as full-screen)
- `src/pages/AdminDashboard.tsx` (pending seller requests badge/toast)
- `src/index.css` (font-size, contrast tokens, grid utilities)
- `src/components/ProductCard.tsx`, admin product grid, cart — alignment pass
- New migration for `pos_customers`

## One clarification before I build

"I will remove a customer from customer tab it removes the user identity like login they resign newly" — please confirm which of these you want:

- **(A)** Customers tab only manages POS walk-in customers (in-store). Deleting them just clears POS history; real signed-up app users are untouched. ← my current interpretation
- **(B)** Customers tab lists real signed-up app users, and deleting there wipes their auth account so they must sign up again. (Higher risk — needs admin-only + confirmation dialog.)
