/* =====================================================================
   admin-dashboard.js  —  ADMIN OVERVIEW  (replaces admin/AdminDashboard.jsx)
   Metric cards, newest orders, and low-stock list. Updates live.
   ===================================================================== */
(function () {
  if (!Auth.requireAdmin()) return;

  const el = id => document.getElementById(id);

  function render() {
    const orders = Store.getOrders().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const inventory = Store.getInventory();
    const lowStock = inventory.filter(Store.isLowStock);

    // revenue ignores cancelled orders
    const revenue = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.pricing.total, 0);
    const inKitchen = orders.filter(o => o.status === 'Order Received' || o.status === 'In Kitchen').length;

    el('m-orders').textContent = orders.length;
    el('m-kitchen').textContent = inKitchen;
    el('m-low').textContent = lowStock.length;
    el('m-revenue').textContent = UI.money(revenue);
    el('m-low').classList.toggle('text-red', lowStock.length > 0);

    /* recent orders */
    el('recent-orders').innerHTML = orders.length === 0
      ? '<p class="muted small center" style="padding:24px 0">No orders yet.</p>'
      : orders.slice(0, 5).map(o => `
          <div class="queue-item">
            <div>
              <p><b>${UI.esc(o.orderNumber)}</b></p>
              <p>${UI.esc(o.customer ? o.customer.name : 'Customer')} • ${o.items.length} item(s)</p>
            </div>
            <div class="right">
              ${UI.statusBadge(o.status)}
              <p style="margin-top:4px"><b>${UI.money(o.pricing.total)}</b></p>
            </div>
          </div>`).join('');

    /* low stock */
    el('low-list').innerHTML = lowStock.length === 0
      ? '<p class="muted small center" style="padding:24px 0">✅ All ingredients are well stocked.</p>'
      : lowStock.map(i => `
          <div class="low-item">
            <div><p>${UI.esc(i.name)}</p><small>Alert at ${i.threshold} ${UI.esc(i.unit)}</small></div>
            <b>${i.stockQuantity} left</b>
          </div>`).join('');
  }

  Store.onChange(render);
  render();
})();
