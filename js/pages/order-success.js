/* =====================================================================
   order-success.js  —  "ORDER PLACED" PAGE  (replaces pages/OrderSuccess.jsx)
   ===================================================================== */
(function () {
  if (!Auth.requireLogin()) return;

  const order = Store.getOrderById(UI.param('id'));
  const user = Auth.currentUser();

  // Only the owner (or an admin) may see an order
  if (!order || (order.userId !== user.id && !Auth.isAdmin())) {
    document.getElementById('success-box').innerHTML = `
      <div class="empty-box">
        <div class="big">🔍</div>
        <h3>Order not found</h3>
        <a class="btn btn-dark" href="dashboard.html" style="margin-top:16px">Go to My Orders</a>
      </div>`;
    return;
  }

  document.getElementById('order-number').textContent = order.orderNumber;
  document.getElementById('order-total').textContent = UI.money(order.pricing.total);
  document.getElementById('track-link').href = 'order-details.html?id=' + encodeURIComponent(order.id);
  document.getElementById('pay-ref').textContent = order.payment.paymentId;

  UI.confetti();
})();
