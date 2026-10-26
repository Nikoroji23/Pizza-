/* =====================================================================
   checkout.js  —  CHECKOUT + MOCK PAYMENT
   (replaces pages/Checkout.jsx, RazorpayMockModal.jsx, orderController
    createOrder, paymentController)

   Flow:
     1. Fill in delivery address  ->  "Pay" button
     2. Stock is checked
     3. Fake payment pop-up opens (card / UPI / netbanking tabs)
     4. On "Pay": order is saved, stock is deducted, cart is cleared
   No real money is involved — it is only a simulation.
   ===================================================================== */
(function () {
  if (!Auth.requireLogin()) return;              // not logged in -> sent to login.html

  const user = Auth.currentUser();
  const el = id => document.getElementById(id);

  const emptyBox = el('checkout-empty');
  const content = el('checkout-content');

  if (Cart.getItems().length === 0) { emptyBox.hidden = false; return; }
  content.hidden = false;

  /* ---------- prefill the address from the user's profile ---------- */
  const addr = user.address || {};
  el('street').value = addr.street || '';
  el('city').value = addr.city || '';
  el('state').value = addr.state || '';
  el('zip').value = addr.zipCode || '';
  el('phone').value = addr.phone || '';

  /* ---------- order summary on the right ---------- */
  const t = Cart.totals();
  el('mini-items').innerHTML = Cart.getItems().map(i => `
    <div class="mini-item">
      <div><strong>${UI.esc(i.pizzaName)}</strong><p>${i.quantity} × ${UI.peso(i.itemPrice)}</p></div>
      <strong>${UI.money(i.quantity * i.itemPrice)}</strong>
    </div>`).join('');
  el('sum-lines').innerHTML = `
    <div class="line"><span>Subtotal</span><b>${UI.money(t.subtotal)}</b></div>
    <div class="line"><span>Tax (5%)</span><b>${UI.money(t.tax)}</b></div>
    <div class="line"><span>Delivery</span>${t.deliveryFee === 0 ? '<span class="free">FREE</span>' : `<b>${UI.money(t.deliveryFee)}</b>`}</div>
    <div class="line grand"><span>Total</span><b>${UI.money(t.total)}</b></div>`;

  /* ---------- step 1: submit the address form ---------- */
  const errorBox = el('checkout-error');

  el('checkout-form').addEventListener('submit', e => {
    e.preventDefault();
    errorBox.hidden = true;

    // Check the ingredients are still in stock before taking payment
    const stockError = Store.checkStock(Cart.getItems());
    if (stockError) {
      errorBox.textContent = stockError;
      errorBox.hidden = false;
      return;
    }
    openPaymentModal();
  });

  /* ---------- payment modal ---------- */
  const modal = el('pay-modal');
  let method = 'card';

  function openPaymentModal() {
    el('pay-amount').textContent = UI.money(t.total);
    el('pay-order-ref').textContent = 'Pending Order';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closePaymentModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  el('pay-close').addEventListener('click', closePaymentModal);
  el('pay-cancel').addEventListener('click', closePaymentModal);

  /* payment method tabs */
  el('pay-methods').addEventListener('click', e => {
    const btn = e.target.closest('.pay-method');
    if (!btn) return;
    method = btn.dataset.method;
    document.querySelectorAll('.pay-method').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.pay-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === method));
  });

  /* --- card helpers --- */
  const cardInput = el('card-number');
  const expiryInput = el('card-expiry');
  const cvvInput = el('card-cvv');
  const nameInput = el('card-name');
  nameInput.value = user.name;

  /** Luhn algorithm: the maths real card numbers pass (4111 1111 1111 1111 is a famous test number) */
  function passesLuhn(num) {
    const digits = num.replace(/\D/g, '');
    if (digits.length < 13) return false;
    let sum = 0, double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = Number(digits[i]);
      if (double) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
      double = !double;
    }
    return sum % 10 === 0;
  }

  function cardBrand(num) {
    const n = num.replace(/\D/g, '');
    if (/^4/.test(n)) return 'VISA';
    if (/^5[1-5]/.test(n)) return 'MASTERCARD';
    if (/^3[47]/.test(n)) return 'AMEX';
    return '';
  }

  cardInput.addEventListener('input', () => {
    const digits = cardInput.value.replace(/\D/g, '').slice(0, 16);
    cardInput.value = digits.replace(/(.{4})/g, '$1 ').trim();   // 4111 1111 1111 1111
    el('card-brand').textContent = cardBrand(digits);
  });

  expiryInput.addEventListener('input', () => {
    let v = expiryInput.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    expiryInput.value = v;
  });

  cvvInput.addEventListener('input', () => { cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 4); });

  function expiryIsValid(value) {
    const m = value.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    const month = Number(m[1]), year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  }

  function showFieldError(inputEl, errId, message) {
    inputEl.classList.toggle('invalid', !!message);
    el(errId).textContent = message || '';
  }

  /** Returns true if the chosen payment method's fields are OK */
  function validatePayment() {
    if (method === 'card') {
      const e1 = !passesLuhn(cardInput.value) ? 'Enter a valid card number' : '';
      const e2 = !expiryIsValid(expiryInput.value) ? 'Enter a valid, future expiry (MM/YY)' : '';
      const e3 = cvvInput.value.length < 3 ? 'Enter the CVV' : '';
      const e4 = !nameInput.value.trim() ? 'Name is required' : '';
      showFieldError(cardInput, 'err-card', e1);
      showFieldError(expiryInput, 'err-expiry', e2);
      showFieldError(cvvInput, 'err-cvv', e3);
      showFieldError(nameInput, 'err-name', e4);
      return !(e1 || e2 || e3 || e4);
    }
    if (method === 'upi') {
      const upi = el('upi-id');
      const bad = !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi.value.trim());
      showFieldError(upi, 'err-upi', bad ? 'Enter a valid UPI ID (e.g. name@bank)' : '');
      return !bad;
    }
    return true; // net banking: just pick a bank
  }

  /* --- the "Pay" button --- */
  const payBtn = el('pay-confirm');
  const payLabel = 'Pay ' + UI.money(t.total);
  payBtn.textContent = payLabel;

  payBtn.addEventListener('click', () => {
    if (!validatePayment()) return;

    payBtn.disabled = true;
    payBtn.textContent = 'Processing…';

    // setTimeout pretends the bank takes a moment to answer
    setTimeout(() => {
      try {
        const order = Store.placeOrder({
          user,
          items: Cart.getItems(),
          deliveryAddress: {
            street: el('street').value.trim(),
            city: el('city').value.trim(),
            state: el('state').value.trim(),
            zipCode: el('zip').value.trim(),
            phone: el('phone').value.trim()
          },
          pricing: Cart.totals()
        });
        Cart.clear();
        location.href = 'order-success.html?id=' + encodeURIComponent(order.id);
      } catch (err) {
        // e.g. someone else bought the last ingredient while the modal was open
        closePaymentModal();
        errorBox.textContent = err.message;
        errorBox.hidden = false;
        payBtn.disabled = false;
        payBtn.textContent = payLabel;
      }
    }, 1200);
  });

})();
