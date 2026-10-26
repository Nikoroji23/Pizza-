/* =====================================================================
   builder.js  —  CUSTOM PIZZA BUILDER  (replaces pages/CustomPizzaBuilder.jsx)
   4 steps: Base -> Sauce -> Cheese -> Vegetables.
   The price and the pizza drawing update every time you click something.
   Stock numbers refresh live if an admin changes stock in another tab.
   ===================================================================== */
(function () {
  /* ---------- state (what the user has chosen so far) ---------- */
  let options = Store.getCustomOptions();   // { bases, sauces, cheeses, vegetables }
  let currentStep = 1;
  let quantity = 1;
  const selected = { base: null, sauce: null, cheese: null, vegetables: [] };  // vegetables = names

  /* ---------- page elements ---------- */
  const el = id => document.getElementById(id);
  const grids = { base: el('options-base'), sauce: el('options-sauce'), cheese: el('options-cheese'), vegetable: el('options-vegetable') };
  const optionKey = { base: 'bases', sauce: 'sauces', cheese: 'cheeses', vegetable: 'vegetables' };

  // Start with the first in-stock option pre-selected (just like the original)
  const firstInStock = list => list.find(i => i.stockQuantity > 0) || null;
  selected.base = firstInStock(options.bases);
  selected.sauce = firstInStock(options.sauces);
  selected.cheese = firstInStock(options.cheeses);

  /* ---------- price ---------- */
  function unitPrice() {
    const vegTotal = selected.vegetables.reduce((sum, name) => {
      const item = options.vegetables.find(v => v.name === name);
      return sum + (item ? item.price : 0);
    }, 0);
    return (selected.base?.price || 0) + (selected.sauce?.price || 0) + (selected.cheese?.price || 0) + vegTotal;
  }

  /* ---------- drawing the option cards ---------- */
  function stockTag(item) {
    if (item.stockQuantity <= 0) return '<span class="stock-tag out">Out of Stock</span>';
    const low = item.stockQuantity <= item.threshold ? ' low' : '';
    return `<span class="stock-tag${low}">Stock: ${item.stockQuantity} ${UI.esc(item.unit)}</span>`;
  }

  function optionCard(item, isSelected, isVeg) {
    const out = item.stockQuantity <= 0;
    const classes = ['option', isVeg ? 'veg' : '', isSelected ? 'selected' : '', out ? 'disabled' : ''].join(' ');

    if (isVeg) {
      return `
        <div class="${classes}" data-id="${item.id}">
          <div>
            <div class="row"><h4>${UI.esc(item.name)}</h4><span class="price">+${UI.peso(item.price)}</span></div>
            <div style="margin-top:6px">${stockTag(item)}</div>
          </div>
          <span class="checkbox">${isSelected ? '✔' : ''}</span>
        </div>`;
    }
    return `
      <div class="${classes}" data-id="${item.id}">
        <div>
          <div class="option-top"><h4>${UI.esc(item.name)}</h4><span class="price">${UI.peso(item.price)}</span></div>
          <p>${UI.esc(item.description)}</p>
        </div>
        <div class="option-foot">
          ${stockTag(item)}
          ${isSelected ? '<span class="check-circle">✔</span>' : ''}
        </div>
      </div>`;
  }

  function renderOptions() {
    ['base', 'sauce', 'cheese'].forEach(cat => {
      grids[cat].innerHTML = options[optionKey[cat]]
        .map(item => optionCard(item, selected[cat] && selected[cat].id === item.id, false)).join('');
    });
    grids.vegetable.innerHTML = options.vegetables
      .map(item => optionCard(item, selected.vegetables.includes(item.name), true)).join('');

    el('veg-count').textContent = `Multiple Select (${selected.vegetables.length} selected)`;
  }

  /* ---------- preview + totals ---------- */
  function renderPreview() {
    const total = unitPrice() * quantity;
    PizzaPreview.render(el('preview'), {
      base: selected.base, sauce: selected.sauce, cheese: selected.cheese,
      vegetables: selected.vegetables, totalPrice: total
    });
    el('total-price').textContent = UI.peso(total);
    el('qty-value').textContent = quantity;
  }

  function renderAll() { renderOptions(); renderPreview(); }

  /* ---------- steps ---------- */
  function goToStep(n) {
    currentStep = n;
    document.querySelectorAll('.step-panel').forEach(p => p.classList.toggle('active', Number(p.dataset.step) === n));
    document.querySelectorAll('.step-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.goto) === n));
  }

  document.querySelectorAll('[data-goto]').forEach(btn =>
    btn.addEventListener('click', () => goToStep(Number(btn.dataset.goto))));

  /* ---------- clicking an option card ---------- */
  Object.entries(grids).forEach(([category, grid]) => {
    grid.addEventListener('click', e => {
      const card = e.target.closest('.option');
      if (!card || card.classList.contains('disabled')) return;

      const item = options[optionKey[category]].find(i => i.id === card.dataset.id);
      if (category === 'vegetable') {
        // toggle on/off
        const i = selected.vegetables.indexOf(item.name);
        if (i > -1) selected.vegetables.splice(i, 1); else selected.vegetables.push(item.name);
      } else {
        selected[category] = item;
      }
      renderAll();
    });
  });

  /* ---------- quantity buttons ---------- */
  el('qty-minus').addEventListener('click', () => { quantity = Math.max(1, quantity - 1); renderPreview(); });
  el('qty-plus').addEventListener('click', () => { quantity++; renderPreview(); });

  /* ---------- add to cart ---------- */
  const addBtn = el('add-btn');
  const checkoutLink = el('go-cart');

  addBtn.addEventListener('click', () => {
    if (!selected.base || !selected.sauce || !selected.cheese) {
      UI.toast('Please choose a Base, Sauce and Cheese first.', 'error');
      return;
    }

    Cart.add({
      pizzaType: 'custom',
      pizzaName: el('pizza-name').value.trim() || 'Custom Artisan Pizza',
      itemPrice: unitPrice(),
      base: selected.base.name,
      sauce: selected.sauce.name,
      cheese: selected.cheese.name,
      vegetables: selected.vegetables.slice(),
      quantity
    });

    addBtn.textContent = '✔ Added to Order!';
    addBtn.classList.add('added');
    checkoutLink.hidden = false;
    setTimeout(() => {
      addBtn.textContent = '🛍️ Add Custom Pizza to Cart';
      addBtn.classList.remove('added');
    }, 2000);
  });

  /* ---------- live stock updates (replaces the socket 'inventory_stock_updated' event) ---------- */
  Store.onChange(() => {
    options = Store.getCustomOptions();
    // keep the user's picks, but refresh stock numbers (and drop picks that sold out)
    const refresh = (cur, list) => {
      const fresh = cur && list.find(i => i.id === cur.id);
      return fresh && fresh.stockQuantity > 0 ? fresh : null;
    };
    selected.base = refresh(selected.base, options.bases);
    selected.sauce = refresh(selected.sauce, options.sauces);
    selected.cheese = refresh(selected.cheese, options.cheeses);
    selected.vegetables = selected.vegetables.filter(name => {
      const v = options.vegetables.find(x => x.name === name);
      return v && v.stockQuantity > 0;
    });
    renderAll();
  });

  renderAll();
})();
