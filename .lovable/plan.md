## POS UX Overhaul + Infinite Stock Toggle

### 1. POS Flow Redesign (Vyapar-style, faster)

Rewrite `src/components/POSTab.tsx` into a clean 2-step wizard with proper grid alignment:

**Step 1 — Build Cart (default view)**

- Left pane (60%): Product search bar (sticky top) + responsive product grid (2-4 cols). Tap card → instantly adds to cart with default variant.
- Right pane (40%): Live cart with qty +/- controls, per-line total, running subtotal, wholesale auto-applied.
- Bottom action bar (sticky): "Proceed to Customer →" button (disabled until cart has items).

**Step 2 — Customer + Payment**

- Compact form: saved-customer dropdown + [+] add new, courier toggle, payment method (Cash / UPI QR), amount tendered for cash.
- "← Back to Cart" and "Generate Bill" buttons.
- On confirm → JPG bill preview with Share / Download / New Sale.

**Alignment fixes**

- Consistent 12px gap grid, `items-stretch`, equal-height cards, right-aligned prices, tabular-nums for money, larger tap targets (min 44px).
- Keyboard shortcut: `/` focuses search, `Enter` on search adds top result.

### 2. Infinite Stock Toggle

- Add `unlimited_stock BOOLEAN DEFAULT false` to `products` table (migration).
- In `SellerDashboard` product form: toggle "Unlimited stock (never runs out)". When ON → hide stock qty inputs on variants, hide "Limited stock" badge on cards, skip low-stock alerts.
- Update `ProductCard`, POS product grid, and low-stock warnings to respect the flag.

## 3. Transfer toggles

Transfer all members role toggle button to admin dashboard with all sellers details and customer details of roles tab is newly created and seller have only a customer details .

Seller delete a customer in customer tab is retail force a customer to re login 

Improve working of seller signin if customer is already on seller signin is get a details from seller of shop name ,product sells , customer care number.

&nbsp;

### Technical details

- Files touched: `src/components/POSTab.tsx` (rewrite), `src/pages/SellerDashboard.tsx` (toggle in add/edit form + hide stock UI when infinite), `src/components/ProductCard.tsx` (skip badges), `src/types/product.ts` (add `unlimitedStock`).
- Migration: `ALTER TABLE products ADD COLUMN unlimited_stock BOOLEAN NOT NULL DEFAULT false;`
- No changes to online checkout, auth, or bill image logic.