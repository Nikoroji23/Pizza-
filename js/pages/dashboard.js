/* =====================================================================
   dashboard.js  —  CUSTOMER DASHBOARD  (replaces pages/UserDashboard.jsx)
   Tab 1: live orders + past orders      Tab 2: profile & default address
   ===================================================================== */
(function () {
  if (!Auth.requireLogin()) return;

  const el = id => document.getElementById(id);
  const user = Auth.currentUser();

  /* ---------- greeting ---------- */
  el('hello-name').textContent = user.name;
  el('hello-email').textContent = user.email;

  /* ---------- tabs ---------- */
  document.querySelectorAll('.utab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.utab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + tab.dataset.tab));
    });
  });

  /* ---------- orders ---------- */
  function renderOrders() {
    const orders = Store.getOrdersForUser(user.id);
    const active = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    const past = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

    el('order-count').textContent = orders.length;

    // --- live orders ---
    el('active-orders').innerHTML = active.length === 0
      ? `<div class="card empty-box">
           <div class="big">🍕</div>
           <h3>No active orders</h3>
           <p class="muted small">Hungry? Your next order will show up here with a live tracker.</p>
           <a class="btn btn-primary" href="menu.html" style="margin-top:16px">Order a Pizza</a>
         </div>`
      : active.map(o => `
          <div class="live-order">
            <div class="live-order-head">
              <div>
                <h3>${UI.esc(o.orderNumber)}</h3>${UI.statusBadge(o.status)}
                <p class="muted small" style="margin-top:4px">ETA <b>${UI.time(o.estimatedDeliveryTime)}</b> • Total <b>${UI.money(o.pricing.total)}</b></p>
              </div>
              <a class="btn btn-light btn-sm" href="order-details.html?id=${encodeURIComponent(o.id)}">View Details →</a>
            </div>
            ${UI.orderTracker(o)}
            <div class="brief-items">
              ${o.items.map(i => `
                <div class="brief-item">
                  <p><b>${i.quantity} × ${UI.esc(i.pizzaName)}</b></p>
                  <p>${UI.esc(i.base)} • ${UI.esc(i.sauce)}</p>
                </div>`).join('')}
            </div>
          </div>`).join('');

    // --- past orders ---
    el('past-section').hidden = past.length === 0;
    el('past-orders').innerHTML = past.map(o => `
      <div class="past-order">
        <div>
          <b>${UI.esc(o.orderNumber)}</b> ${UI.statusBadge(o.status)}
          <p class="muted small" style="margin-top:4px">${new Date(o.createdAt).toLocaleDateString()} • ${o.items.reduce((n, i) => n + i.quantity, 0)} pizza(s)</p>
        </div>
        <div class="row">
          <span class="big-amount">${UI.money(o.pricing.total)}</span>
          <a class="btn btn-outline btn-sm" href="order-details.html?id=${encodeURIComponent(o.id)}">Details</a>
        </div>
      </div>`).join('');
  }

  // live updates whenever an order changes
  Store.onChange(renderOrders);
  renderOrders();

  /* ---------- profile form ---------- */
  const a = user.address || {};
  el('p-name').value = user.name;
  el('p-email').value = user.email;
  el('p-street').value = a.street || '';
  el('p-city').value = a.city || '';
  el('p-state').value = a.state || '';
  el('p-zip').value = a.zipCode || '';
  el('p-phone').value = a.phone || '';

  el('profile-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = el('p-name').value.trim();
    if (!name) return UI.toast('Name cannot be empty.', 'error');

    Auth.updateProfile({
      name,
      address: {
        street: el('p-street').value.trim(),
        city: el('p-city').value.trim(),
        state: el('p-state').value.trim(),
        zipCode: el('p-zip').value.trim(),
        phone: el('p-phone').value.trim()
      }
    });
    el('hello-name').textContent = name;
    Layout.renderNavbar();           // refresh the name shown in the navbar
    UI.toast('Profile updated successfully.', 'success');
  });
})();
