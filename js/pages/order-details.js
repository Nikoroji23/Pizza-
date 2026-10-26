/* =====================================================================
   order-details.js  —  SINGLE ORDER PAGE  (replaces pages/OrderDetails.jsx)
   Shows the tracker, items, delivery address and payment info.
   It re-draws itself whenever the order changes — so if an admin moves
   the order to "In Kitchen" in another tab, this page updates live.
   ===================================================================== */
(function () {
  if (!Auth.requireLogin()) return;

  const root = document.getElementById('details-root');
  const user = Auth.currentUser();
  const orderId = UI.param('id');

  function render() {
    const order = Store.getOrderById(orderId);

    if (!order || (order.userId !== user.id && !Auth.isAdmin())) {
      root.innerHTML = `
        <div class="empty-box card">
          <div class="big">🔍</div>
          <h3>Order not found</h3>
          <a class="btn btn-dark" href="dashboard.html" style="margin-top:16px">Back to My Orders</a>
        </div>`;
      return;
    }

    const a = order.deliveryAddress;
    const p = order.pricing;

    root.innerHTML = `
      <div class="page-head">
        <div>
          <p class="eyebrow">Order Details</p>
          <h1 class="page-title">${UI.esc(order.orderNumber)}</h1>
          <p class="page-sub">Placed on ${new Date(order.createdAt).toLocaleString()}</p>
        </div>
        ${UI.statusBadge(order.status)}
      </div>

      <div class="card">
        <h3>Live Order Tracker</h3>
        ${UI.orderTracker(order)}
        ${order.status !== 'Delivered' && order.status !== 'Cancelled'
          ? `<p class="center muted small" style="margin-top:16px">Estimated delivery: <b>${UI.time(order.estimatedDeliveryTime)}</b></p>` : ''}
      </div>

      <div class="two-col wide-left">
        <div class="stack">
          <div class="card">
            <h3>Items Ordered</h3>
            ${order.items.map(item => `
              <div class="recipe">
                <div class="head"><span>${item.quantity} × ${UI.esc(item.pizzaName)}</span><span>${UI.money(item.itemPrice * item.quantity)}</span></div>
                <p>${UI.esc(item.base)} • ${UI.esc(item.sauce)} • ${UI.esc(item.cheese)}${item.vegetables.length ? ' • ' + UI.esc(item.vegetables.join(', ')) : ''}</p>
              </div>`).join('')}
          </div>

          <div class="card">
            <h3>Status History</h3>
            ${order.statusHistory.slice().reverse().map(h => `
              <div class="queue-item">
                <div><p><b>${UI.esc(h.status)}</b></p><p>${UI.esc(h.note || '')}</p></div>
                <div class="right"><p>${new Date(h.timestamp).toLocaleString()}</p></div>
              </div>`).join('')}
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <h3>Delivery Address</h3>
            <p style="font-size:14px;line-height:1.7">
              <b>${UI.esc(order.customer ? order.customer.name : user.name)}</b><br>
              ${UI.esc(a.street)}<br>${UI.esc(a.city)}, ${UI.esc(a.state)} ${UI.esc(a.zipCode)}<br>
              📞 ${UI.esc(a.phone)}
            </p>
          </div>

          <div class="card">
            <h3>Payment</h3>
            <div class="kv"><span>Method</span><strong>${UI.esc(order.payment.method.replace('_', ' '))}</strong></div>
            <div class="kv"><span>Status</span><strong class="ok">${UI.esc(order.payment.status)}</strong></div>
            <div class="kv"><span>Payment ID</span><span class="mono">${UI.esc(order.payment.paymentId)}</span></div>
            <div class="summary-lines" style="margin-top:16px">
              <div class="line"><span>Subtotal</span><b>${UI.money(p.subtotal)}</b></div>
              <div class="line"><span>Tax</span><b>${UI.money(p.tax)}</b></div>
              <div class="line"><span>Delivery</span><b>${p.deliveryFee === 0 ? 'FREE' : UI.money(p.deliveryFee)}</b></div>
              <div class="line grand"><span>Total</span><b>${UI.money(p.total)}</b></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // Live updates: re-draw whenever stored data changes (this tab or another)
  Store.onChange(render);
  render();
})();
