/* =====================================================================
   cart.js (page)  —  CART PAGE  (replaces pages/Cart.jsx)
   Lists the items in the cart, lets you change quantity / remove,
   and shows the price summary.
   ===================================================================== */
(function () {
  const emptyBox = document.getElementById('cart-empty');
  const content = document.getElementById('cart-content');
  const list = document.getElementById('cart-list');
  const summary = document.getElementById('cart-summary');
  const checkoutBtn = document.getElementById('checkout-btn');

  function render() {
    const items = Cart.getItems();
    emptyBox.hidden = items.length > 0;
    content.hidden = items.length === 0;
    if (items.length === 0) return;

    list.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-icon">🍕</div>
          <div>
            <h3>${UI.esc(item.pizzaName)}</h3>
            ${item.pizzaType === 'custom' ? '<span class="badge badge-brand">Custom Built</span>' : ''}
            <p class="cart-item-detail">
              <b>Crust:</b> ${UI.esc(item.base)} &bull; <b>Sauce:</b> ${UI.esc(item.sauce)}<br>
              <b>Cheese:</b> ${UI.esc(item.cheese)}
              ${item.vegetables && item.vegetables.length ? `<br><b>Veggies:</b> ${UI.esc(item.vegetables.join(', '))}` : ''}
            </p>
          </div>
        </div>
        <div class="cart-item-actions">
          <div class="qty">
            <button type="button" data-minus="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-plus="${item.id}">＋</button>
          </div>
          <div class="line-total">
            <small>${UI.peso(item.itemPrice)} each</small>
            <strong>${UI.money(item.itemPrice * item.quantity)}</strong>
          </div>
          <button type="button" class="icon-btn" title="Remove" data-remove="${item.id}">🗑️</button>
        </div>
      </div>`).join('');

    const t = Cart.totals();
    summary.innerHTML = `
      <div class="line"><span>Subtotal</span><b>${UI.money(t.subtotal)}</b></div>
      <div class="line"><span>Tax (5% GST)</span><b>${UI.money(t.tax)}</b></div>
      <div class="line"><span>Delivery Fee</span>${t.deliveryFee === 0 ? '<span class="free">FREE</span>' : `<b>${UI.money(t.deliveryFee)}</b>`}</div>
      ${t.subtotal < 500 ? `<div class="free-delivery-tip">Add ${UI.peso(500 - t.subtotal)} more to get free delivery!</div>` : ''}
      <div class="line grand"><span>Total</span><b>${UI.money(t.total)}</b></div>`;
  }

  /* one click listener for all the +, − and 🗑️ buttons */
  list.addEventListener('click', e => {
    const minus = e.target.closest('[data-minus]');
    const plus = e.target.closest('[data-plus]');
    const remove = e.target.closest('[data-remove]');
    const items = Cart.getItems();

    if (minus) {
      const item = items.find(i => i.id === minus.dataset.minus);
      Cart.setQuantity(item.id, item.quantity - 1);
    } else if (plus) {
      const item = items.find(i => i.id === plus.dataset.plus);
      Cart.setQuantity(item.id, item.quantity + 1);
    } else if (remove) {
      Cart.remove(remove.dataset.remove);
    }
    render();
  });

  checkoutBtn.addEventListener('click', () => {
    // Must be logged in to check out; login page sends them back here afterwards.
    if (!Auth.isLoggedIn()) {
      location.href = 'login.html?redirect=checkout.html';
    } else {
      location.href = 'checkout.html';
    }
  });

  render();
})();
