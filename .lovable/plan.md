# Plan: Admin per-seller views & per-seller loyalty config

## 1. Database — new table `seller_loyalty_settings`

Columns (domain): `seller_id` (uuid, unique), `enabled` (bool, default true), `stamps_required` (int, default 10), `reward_amount` (numeric, default 50), `min_order_value` (numeric, default 0).

RLS:
- Anyone can read (so customers see their seller's rules).
- Seller can insert/update their own row (`auth.uid() = seller_id`).
- Admin can manage all rows.

Trigger: `updated_at` auto-update.

## 2. Admin Dashboard — Orders tab refactor

In `SellerDashboard.tsx`, when `isAdmin`:
- Wrap the existing orders content in an inner `Tabs` with one sub-tab per seller (built from `user_roles` where role=`seller`, joined with `profiles` for display name).
- Each sub-tab renders the existing orders list filtered to that seller's products only (reuse the same per-seller item-filtering logic already used for seller view: keep only items whose product belongs to that seller, recompute subtotal/total).
- Remove the current admin "all orders mixed together" view.

## 3. Admin Dashboard — new `Sellers` tab

New top-level admin tab listing every seller:
- Name, phone, email, joined date, product count, total revenue, order count.
- Quick actions: view their products (jumps to filtered seller-products tab), block/unblock (reuse existing logic).
- Move cross-seller informational widgets here so individual seller dashboards stay scoped to themselves.

## 4. Seller Dashboard — Loyalty settings

Add a "Loyalty Settings" card at the top of the existing Loyalty tab for non-admin sellers (admins also see it inside each seller sub-tab if applicable). Editable fields:
- Enabled toggle
- Stamps required (number input, 1–50)
- Reward amount ₹ (number input)
- Min order value ₹ per stamp (number input)

Save button upserts into `seller_loyalty_settings`. Validate with zod (positive numbers, ints for stamps).

## 5. Apply seller loyalty rules

Where loyalty stamps are computed/displayed (StampCard, loyalty claim flow), look up the relevant seller's settings and:
- Skip stamping entirely if `enabled=false`.
- Use `stamps_required` instead of hard-coded 10.
- Only count orders where seller's portion ≥ `min_order_value`.
- Show `reward_amount` in the reward UI.

If an order spans multiple sellers, evaluate per seller independently.

## Technical notes

- New file: `supabase/migrations/<ts>_seller_loyalty_settings.sql`.
- Edits: `src/pages/SellerDashboard.tsx` (orders tab restructure, new Sellers tab, loyalty settings form), `src/components/StampCard.tsx` and any loyalty-claim code path that hard-codes `10`.
- Reuse existing `SalesReportDashboard` with `sellerId` prop inside each admin sub-tab if useful, otherwise just render orders list per seller.
- No changes to checkout flow beyond reading the new settings when computing stamps.

## Out of scope

- Changing how customer-side loyalty progress UI is themed.
- Migrating historical loyalty claims to new per-seller numbers (existing claims keep their original `stamps_completed`).
