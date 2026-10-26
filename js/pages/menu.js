/* =====================================================================
   menu.js  —  SPECIALTY MENU PAGE  (replaces pages/Menu.jsx)
   Shows the ready-made pizzas, lets you filter by category and add to cart.
   ===================================================================== */
(function () {
  const grid = document.getElementById('pizza-grid');
  const tabs = document.getElementById('category-tabs');
  let category = 'all';

  /** Build the HTML for every pizza card and put it on the page */
  function render() {
    const pizzas = Store.getPizzas().filter(p => category === 'all' || p.category === category);

    if (pizzas.length === 0) {
      grid.innerHTML = '<p class="muted">No pizzas in this category yet.</p>';
      return;
    }

    grid.innerHTML = pizzas.map(p => `
      <article class="pizza-card">
        <div class="pizza-card-img">
          <img src="${UI.esc(p.image)}" alt="${UI.esc(p.name)}" loading="lazy">
          ${p.badge ? `<span class="pizza-badge">${UI.esc(p.badge)}</span>` : ''}
        </div>
        <div class="pizza-card-body">
          <div>
            <h3>${UI.esc(p.name)}</h3>
            <p>${UI.esc(p.description)}</p>
          </div>
          <div>
            <div class="tags">
              <span class="tag tag-amber">Crust: ${UI.esc(p.defaultBase)}</span>
              <span class="tag tag-rose">Sauce: ${UI.esc(p.defaultSauce)}</span>
              <span class="tag tag-orange">Cheese: ${UI.esc(p.defaultCheese)}</span>
            </div>
            <div class="price-row">
              <div><small>Price</small><strong>${UI.peso(p.price)}</strong></div>
              <button class="btn btn-solid btn-sm" data-add="${p.id}">＋ Add to Cart</button>
            </div>
          </div>
        </div>
      </article>`).join('');
  }

  /* --- click on a category tab --- */
  tabs.addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    category = tab.dataset.category;
    tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
    render();
  });

  /* --- click on an "Add to Cart" button (event delegation: one listener for all cards) --- */
  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;

    const pizza = Store.getPizzas().find(p => p.id === btn.dataset.add);
    Cart.add({
      pizzaType: 'specialty',
      pizzaName: pizza.name,
      itemPrice: pizza.price,
      base: pizza.defaultBase,
      sauce: pizza.defaultSauce,
      cheese: pizza.defaultCheese,
      vegetables: pizza.defaultVegetables,
      quantity: 1,
      image: pizza.image
    });

    // quick visual feedback on the button
    btn.textContent = '✔ Added!';
    btn.classList.replace('btn-solid', 'btn-success');
    setTimeout(() => {
      btn.textContent = '＋ Add to Cart';
      btn.classList.replace('btn-success', 'btn-solid');
    }, 1500);
  });

  render();
})();
