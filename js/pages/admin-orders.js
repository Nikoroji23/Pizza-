/* =====================================================================
   admin-orders.js  —  ORDER DISPATCH  (replaces admin/AdminOrders.jsx)
   Kitchen staff see every order and move it along:
   Order Received -> In Kitchen -> Sent to Delivery -> Delivered.
   The customer's tracker updates instantly (even in another tab).
   ===================================================================== */
(function () {
  if (!Auth.requireAdmin()) return;

  const el = id => document.getElementById(id);
  let filter = 'All';
  let search = '';
  let knownCount = Store.getOrders().length;

  const sortedOrders = () =>
    Store.getOrders().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function renderTabs(orders) {
    const filters = ['All', ...ORDER_STATUSES];
    el('order-tabs').innerHTML = filters.map(f => {
      const count = f === 'All' ? orders.length : orders.filter(o => o.status === f).length;
      return `<button class="tab ${f === filter ? 'active' : ''}" data-filter="${f}">${f} (${count})</button>`;
    }).join('');
  }

  function orderCard(o) {
    const a = o.deliveryAddress;
    const locked = o.status === 'Delivered';
    const control = locked
      ? '<span class="locked-tag">✔ Delivered &amp; Locked</span>'
      : `<select class="status-select" data-status-for="${o.id}">
           ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
         </select>`;

    return `
      <div class="order-card">
        <div class="order-card-head">
          <div>
            <span class="num">${UI.esc(o.orderNumber)}</span>${UI.statusBadge(o.status)}
            <p class="muted small" style="margin-top:4px">${new Date(o.createdAt).toLocaleString()} • ${UI.esc(o.customer ? o.customer.name : 'Customer')}</p>
          </div>
          ${control}
        </div>

        <div class="order-body">
          <div>
            <span class="mini-label">Pizza recipes to prepare</span>
            ${o.items.map(i => `
              <div class="recipe">
                <div class="head"><span>${i.quantity} × ${UI.esc(i.pizzaName)}</span></div>
                <p>${UI.esc(i.base)} • ${UI.esc(i.sauce)} • ${UI.esc(i.cheese)}${i.vegetables.length ? ' • ' + UI.esc(i.vegetables.join(', ')) : ''}</p>
              </div>`).join('')}
          </div>
          <div>
            <span class="mini-label">Delivery</span>
            <div class="delivery-box">
              <span>📍 ${UI.esc(a.street)}, ${UI.esc(a.city)} ${UI.esc(a.zipCode)}</span>
              <span>📞 ${UI.esc(a.phone)}</span>
              <div class="total"><span>Total paid</span><b>${UI.money(o.pricing.total)}</b></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const all = sortedOrders();
    renderTabs(all);

    const q = search.trim().toLowerCase();
    const shown = all.filter(o => {
      const matchStatus = filter === 'All' || o.status === filter;
      const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || (o.deliveryAddress.phone || '').includes(q);
      return matchStatus && matchSearch;
    });

    el('orders-list').innerHTML = shown.length === 0
      ? `<div class="card empty-box"><div class="big">🧾</div><h3>No orders found</h3></div>`
      : shown.map(orderCard).join('');
  }

  /* filter tabs */
  el('order-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    filter = tab.dataset.filter;
    render();
  });

  /* search box (kept outside the re-rendered area so typing is never interrupted) */
  el('order-search').addEventListener('input', e => { search = e.target.value; render(); });

  /* status dropdown changed */
  el('orders-list').addEventListener('change', e => {
    const select = e.target.closest('[data-status-for]');
    if (!select) return;
    try {
      Store.updateOrderStatus(select.dataset.statusFor, select.value);
      UI.toast('Order status updated.', 'success');
    } catch (err) {
      UI.toast(err.message, 'error');
      render();  // put the dropdown back to the real status
    }
  });

  /* live: re-draw whenever data changes; toast if a brand-new order arrived */
  Store.onChange(() => {
    const count = Store.getOrders().length;
    if (count > knownCount) UI.toast('🔔 New order received!', 'info');
    knownCount = count;
    render();
  });

  render();
})();
