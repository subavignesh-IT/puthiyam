
## Phase 1: Theme Switcher (20+ branded themes)
- Add theme switcher button to header with 20+ themes (Minimal, Luxury, Ocean, Forest, etc.)
- Store theme preference per user in localStorage (or profiles table)
- Apply themes via CSS variables, only for the current user

## Phase 2: Loyalty Coupon on Bills & Orders
- Show "Coupon Claimed" info on seller order tab
- Add "Used" button on loyalty tab to mark coupon as used
- Show "Offer Claimed" indicator on bills and order pages

## Phase 3: User Management (Block & Delete)
- Add block/delete buttons for users in seller dashboard Customers tab
- Add `is_blocked` column to profiles table
- Blocked users see popup on login and cannot proceed
- Deleted users must re-signup

## Phase 4: Multi-Seller System
- Add seller role toggle in admin dashboard
- Create separate seller login page
- Sellers can add products to the same database
- Owner (subavignesh33@gmail.com) can manage all sellers' products/prices
- Regular sellers can only manage their own products

## Phase 5: Profile Edit
- Add profile edit button on login/account page for all users
- Edit name, phone, email, password

**Note**: Phase 5 (profile edit) already exists via ProfileEditDialog. Will verify and enhance if needed.
