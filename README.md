# Anti-Crust Pizza — plain HTML, CSS & JavaScript

No React, no Node, no database, no build step.
**Just double-click `index.html`** (any modern browser) and it works.

## Demo accounts

| Role     | Email                 | Password     |
|----------|-----------------------|--------------|
| Customer | user@anticrust.com    | User@12345   |
| Admin    | admin@anticrust.com   | Admin@12345  |

You can also register a new customer account. Footer link **"Reset demo data"** restores everything.

---

## Folder structure

```
anticrust-pizza/
├── index.html              Home
├── menu.html               Specialty menu
├── builder.html            Custom pizza builder
├── cart.html               Cart
├── checkout.html           Address + mock payment pop-up
├── order-success.html      "Order placed" page
├── order-details.html      One order with live tracker
├── dashboard.html          Customer: my orders + profile
├── login.html / register.html / forgot-password.html
├── admin-login.html
├── admin-dashboard.html / admin-inventory.html / admin-orders.html
│
├── css/
│   └── style.css           ALL styling (replaces Tailwind)
│
└── js/
    ├── data.js             Seed data: users, ingredients, pizzas
    ├── store.js            The "database" (localStorage) + order/stock logic
    ├── auth.js             Login, register, session, page guards
    ├── cart.js             Cart logic
    ├── layout.js           Navbar, footer, toasts, badges, order tracker
    ├── pizza-preview.js    The live pizza drawing
    └── pages/              ONE script per page
        ├── menu.js  builder.js  cart.js  checkout.js
        ├── order-success.js  order-details.js  dashboard.js
        ├── login.js  register.js  forgot-password.js  admin-login.js
        └── admin-dashboard.js  admin-inventory.js  admin-orders.js
```

Every HTML page loads the shared scripts first, then its own page script:

```html
<script src="js/data.js"></script>    <!-- 1. seed data            -->
<script src="js/store.js"></script>   <!-- 2. database             -->
<script src="js/auth.js"></script>    <!-- 3. login logic          -->
<script src="js/cart.js"></script>    <!-- 4. cart logic           -->
<script src="js/layout.js"></script>  <!-- 5. navbar + footer      -->
<script src="js/pages/menu.js"></script> <!-- 6. this page only    -->
```
**The order matters** — each file uses the ones above it.

---

## Suggested reading order (to understand it)

1. `index.html` + `css/style.css` (skim the table of contents at the top)
2. `js/data.js` — what the data looks like
3. `js/store.js` — how data is saved and how an order is placed
4. `js/auth.js` — how login works without a server
5. `js/cart.js`, then `js/layout.js`
6. Pages in customer order: `menu` → `builder` → `cart` → `checkout` → `dashboard`
7. Admin pages last

---

## What replaced what

| Original (React + Node)                    | Now                                              |
|--------------------------------------------|--------------------------------------------------|
| MongoDB + Mongoose models                  | `localStorage` via `js/store.js`                 |
| Express routes / controllers               | Functions in `store.js` and `auth.js`            |
| JWT + bcrypt login                         | A saved user id in localStorage (`auth.js`)      |
| `ProtectedRoute` component                 | `Auth.requireLogin()` / `Auth.requireAdmin()`    |
| React Context (Auth, Cart, Socket)         | `Auth`, `Cart` objects + `Store.onChange()`      |
| Socket.io live updates                     | Browser `storage` event: updates **across tabs** |
| Razorpay mock modal                        | Same pop-up, in `checkout.html` + `checkout.js`  |
| Cron job + email alert for low stock       | "Run Stock Audit" button (reports on screen)     |
| Tailwind CSS classes                       | Hand-written `css/style.css`                     |
| Lucide icons, canvas-confetti              | Emoji + a tiny confetti function in `layout.js`  |
| React Router                               | Normal links between `.html` files               |

## Features that still work

- Register, log in, log out, forgot password, edit profile and default address
- Specialty menu with category filter; custom builder with live price and drawing
- Real ingredient stock: sold-out items are disabled, low stock is flagged
- Cart (merge duplicates, quantity, remove), 5% tax, free delivery from ₱500
- Checkout with card / UPI / net-banking simulation (Luhn check, expiry check)
- Order saved, stock deducted, status history, live tracker
- Admin: dashboard metrics, restock (+10/+25), edit stock/threshold/price, stock audit,
  order dispatch with status changes ("Delivered" locks the order)

## Try the live-update feature

1. Log in as the customer, place an order, and keep `order-details.html` open.
2. Open a **second tab**, log in at `admin-login.html`, go to *Order Dispatch*.
3. Change the order status — the customer's tracker moves instantly.

(It only works between tabs of the **same browser**, because the data lives in that browser.)

## Differences you should know about

- **Not secure.** Passwords are stored as plain text in localStorage and anyone can edit
  it in DevTools. Fine for learning/demo; a real site needs a server.
- **Data is per browser.** Orders made on one computer do not appear on another.
- **Email verification removed** (needs an email server). Accounts are active immediately.
- **Password reset** happens on one page instead of through an emailed link.
- **Order is created after payment succeeds** (the original created it first, then paid).
  This way, cancelling the payment pop-up never leaves a stuck order or lost stock.
- Revenue on the admin dashboard now ignores cancelled orders.
- Pizza photos come from Unsplash, so they need an internet connection.
