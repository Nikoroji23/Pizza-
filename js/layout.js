/* =====================================================================
   layout.js  —  SHARED UI (navbar, footer, helpers)
   ---------------------------------------------------------------------
   Replaces: Navbar.jsx, Footer.jsx, OrderStatusBadge.jsx,
             OrderTracker.jsx and the confetti library.
   Every page has <div id="navbar"></div> and <div id="footer"></div>.
   This file fills them in so we don't copy-paste the same HTML 15 times.
   ===================================================================== */

/* ---------------------------------------------------------------------
   UI helpers (small reusable functions)
   --------------------------------------------------------------------- */
const UI = {

  /** Escape text before putting it inside innerHTML (prevents HTML injection) */
  esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  },

  /** ₱499 */
  peso(n) { return '₱' + Number(n || 0); },

  /** ₱499.00 */
  money(n) { return '₱' + Number(n || 0).toFixed(2); },

  time(iso, opts = { hour: '2-digit', minute: '2-digit' }) {
    return new Date(iso).toLocaleTimeString([], opts);
  },

  /** Get ?id=123 style values from the URL */
  param(name) { return new URLSearchParams(location.search).get(name); },

  /** Small pop-up message in the corner. type: 'success' | 'error' | 'info' */
  toast(message, type = 'info') {
    let box = document.getElementById('toast-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast-box';
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.classList.add('toast-hide'), 3200);
    setTimeout(() => el.remove(), 3600);
  },

  /** Coloured pill showing an order's status */
  statusBadge(status) {
    const map = {
      'Order Received':   { cls: 'amber',  icon: '🕒' },
      'In Kitchen':       { cls: 'blue',   icon: '👨‍🍳' },
      'Sent to Delivery': { cls: 'purple', icon: '🛵' },
      'Delivered':        { cls: 'green',  icon: '✅' },
      'Cancelled':        { cls: 'red',    icon: '✖️' }
    };
    const s = map[status] || { cls: 'slate', icon: '🕒' };
    return `<span class="status-badge status-${s.cls}"><span class="status-dot"></span>${s.icon} ${UI.esc(status || 'Pending')}</span>`;
  },

  /** The 4-step progress bar (Received → Kitchen → Delivery → Delivered) */
  orderTracker(order) {
    const steps = [
      { id: 'Order Received',   icon: '🕒', desc: 'Order confirmed & sent to kitchen queue' },
      { id: 'In Kitchen',       icon: '👨‍🍳', desc: 'Dough hand-tossed, topped & oven baked' },
      { id: 'Sent to Delivery', icon: '🛵', desc: 'Hot & steaming out with courier partner' },
      { id: 'Delivered',        icon: '✅', desc: 'Arrived hot at your door. Enjoy!' }
    ];

    if (order.status === 'Cancelled') {
      return `<div class="alert alert-error">This order was cancelled.</div>`;
    }

    const currentIndex = Math.max(0, steps.findIndex(s => s.id === order.status));
    const progress = (currentIndex / (steps.length - 1)) * 100;

    const stepsHtml = steps.map((step, idx) => {
      const state = idx < currentIndex ? 'done' : idx === currentIndex ? 'current' : 'todo';
      const history = (order.statusHistory || []).find(h => h.status === step.id);
      const time = history ? `<span class="tracker-time">${UI.time(history.timestamp)}</span>` : '';
      return `
        <div class="tracker-step ${state}">
          <div class="tracker-icon">${step.icon}</div>
          <p class="tracker-label">${step.id}</p>
          ${time}
        </div>`;
    }).join('');

    return `
      <div class="tracker">
        <div class="tracker-line"></div>
        <div class="tracker-progress" style="width:${progress}%"></div>
        ${stepsHtml}
      </div>`;
  },

  /** Little celebration when an order is placed (replaces canvas-confetti) */
  confetti() {
    const colors = ['#e11d48', '#f97316', '#10b981', '#fbbf24'];
    for (let i = 0; i < 90; i++) {
      const piece = document.createElement('i');
      piece.className = 'confetti';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = 1.6 + Math.random() * 1.8 + 's';
      piece.style.animationDelay = Math.random() * 0.4 + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }
  }
};

/* ---------------------------------------------------------------------
   NAVBAR
   --------------------------------------------------------------------- */
const Layout = (() => {

  const currentPage = () => location.pathname.split('/').pop() || 'index.html';

  function navLink(href, label, extraClass = '') {
    const active = currentPage() === href ? ' active' : '';
    return `<a class="nav-link${active} ${extraClass}" href="${href}">${label}</a>`;
  }

  function renderNavbar() {
    const user = Auth.currentUser();
    const admin = Auth.isAdmin();
    const page = currentPage();

    // --- links in the middle ---
    let links = navLink('menu.html', 'Specialty Menu') + navLink('builder.html', 'Custom Pizza Builder');
    if (user && !admin) links += navLink('dashboard.html', 'My Orders');
    if (admin) {
      const inAdmin = page.startsWith('admin-');
      links += `<a class="nav-link nav-admin${inAdmin ? ' active' : ''}" href="admin-dashboard.html">🛡️ Admin Panel</a>`;
    }

    // --- right side: user menu or login/register buttons ---
    let account;
    if (user) {
      const menuLinks = admin
        ? `<a href="admin-dashboard.html">🛡️ Admin Dashboard</a>
           <a href="admin-inventory.html">📦 Inventory &amp; Stock</a>
           <a href="admin-orders.html">🧾 Order Dispatch</a>`
        : `<a href="dashboard.html">👤 My Orders &amp; Profile</a>`;
      account = `
        <div class="user-menu">
          <button class="user-btn" id="user-btn" type="button">
            <span class="avatar">${UI.esc(user.name[0].toUpperCase())}</span>
            <span class="user-name">${UI.esc(user.name)}</span>
          </button>
          <div class="dropdown" id="user-dropdown">
            <div class="dropdown-head">
              <small>Signed in as</small>
              <strong>${UI.esc(user.email)}</strong>
              <span class="role-tag">${UI.esc(user.role)}</span>
            </div>
            ${menuLinks}
            <button type="button" id="logout-btn" class="danger">⎋ Sign Out</button>
          </div>
        </div>`;
    } else {
      account = `
        <a class="btn btn-ghost btn-sm" href="login.html">Log In</a>
        <a class="btn btn-primary btn-sm" href="register.html">Register</a>`;
    }

    document.getElementById('navbar').innerHTML = `
      <header class="navbar">
        <div class="container nav-inner">
          <a class="logo" href="index.html">
            <span class="logo-icon">🍕</span>
            <span>
              <span class="logo-title">Anti-Crust</span>
              <span class="logo-sub">Pizza Company</span>
            </span>
          </a>

          <nav class="nav-links">${links}</nav>

          <div class="nav-actions">
            <div class="live-pill" title="Orders and stock update live — even between browser tabs">
              <span class="live-dot"></span> Live Tracker
            </div>
            <a class="cart-btn" href="cart.html" aria-label="Shopping Cart">
              🛍️<span class="cart-badge" id="cart-badge" hidden>0</span>
            </a>
            ${account}
            <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Menu">☰</button>
          </div>
        </div>
        <div class="mobile-menu" id="mobile-menu">${links}</div>
      </header>`;

    updateCartBadge();
    bindNavbarEvents();
  }

  function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const n = Cart.count();
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  function bindNavbarEvents() {
    const toggle = document.getElementById('menu-toggle');
    const mobile = document.getElementById('mobile-menu');
    toggle.addEventListener('click', () => mobile.classList.toggle('open'));

    const userBtn = document.getElementById('user-btn');
    const dropdown = document.getElementById('user-dropdown');
    if (userBtn) {
      userBtn.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));
      document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.logout();
        location.href = 'index.html';
      });
    }
  }

  /* ---------------- FOOTER ---------------- */
  function renderFooter() {
    document.getElementById('footer').innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="footer-brand"><span class="logo-icon">🍕</span> Anti-Crust</div>
              <p class="footer-text">We rejected boring dough to engineer the crispiest, cheesiest, most customizable pizzas on the planet.</p>
              <p class="footer-live"><span class="live-dot"></span> Kitchen live: Accepting Orders</p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><a href="menu.html">Specialty Pizzas</a></li>
                <li><a href="builder.html">Custom Pizza Builder</a></li>
                <li><a href="dashboard.html">Live Order Tracker</a></li>
              </ul>
            </div>
            <div>
              <h4>Staff &amp; Portal</h4>
              <p class="footer-text small">Authorized kitchen operators and inventory managers access here.</p>
              <a class="btn btn-dark-outline btn-sm" href="admin-login.html">🛡️ Kitchen Admin Login</a>
            </div>
          </div>
          <div class="footer-bottom">
            <p>© ${new Date().getFullYear()} Anti-Crust Pizza Company. All rights reserved.</p>
            <button type="button" class="link-btn" id="reset-demo">Reset demo data</button>
          </div>
        </div>
      </footer>`;

    document.getElementById('reset-demo').addEventListener('click', () => {
      if (confirm('Reset all demo data (accounts, orders, stock, cart) back to the starting state?')) {
        Store.resetAll();
        location.href = 'index.html';
      }
    });
  }

  function init() {
    renderNavbar();
    renderFooter();
    // Keep the cart badge fresh when the cart changes (this tab or another tab)
    Store.onChange(updateCartBadge);
  }

  return { init, renderNavbar };
})();

// Every page loads this file, so build navbar + footer as soon as the page is ready.
document.addEventListener('DOMContentLoaded', Layout.init);
