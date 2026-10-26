/* =====================================================================
   cart.js  —  SHOPPING CART
   ---------------------------------------------------------------------
   Replaces: CartContext.jsx
   The cart is an array saved in localStorage under "acp_cart".
   Each item looks like:
     { id, pizzaType, pizzaName, itemPrice, base, sauce, cheese,
       vegetables: [], quantity, image? }
   ===================================================================== */

const Cart = (() => {

  const getItems = () => Store.read(Store.KEYS.cart, []);
  const save = items => Store.write(Store.KEYS.cart, items);

  /** A text "fingerprint" used to decide if two custom pizzas are identical */
  function fingerprint(item) {
    if (item.pizzaType === 'custom') {
      // slice() makes a copy so sorting doesn't change the original array
      return ['custom', item.base, item.sauce, item.cheese, (item.vegetables || []).slice().sort().join(',')].join('|');
    }
    return item.pizzaType + '|' + item.pizzaName;
  }

  /** Add a pizza. If the same pizza is already in the cart, just raise its quantity. */
  function add(newItem) {
    const items = getItems();
    const existing = items.find(i => fingerprint(i) === fingerprint(newItem));
    if (existing) {
      existing.quantity += newItem.quantity || 1;
    } else {
      items.push({ ...newItem, id: Store.uid('item'), quantity: newItem.quantity || 1 });
    }
    save(items);
  }

  function remove(id) {
    save(getItems().filter(i => i.id !== id));
  }

  function setQuantity(id, quantity) {
    if (quantity <= 0) return remove(id);
    const items = getItems();
    const item = items.find(i => i.id === id);
    if (item) item.quantity = quantity;
    save(items);
  }

  const clear = () => save([]);

  /** Total number of pizzas (shown on the navbar badge) */
  const count = () => getItems().reduce((sum, i) => sum + i.quantity, 0);

  /** Subtotal, tax, delivery fee and grand total — same rules as the old backend */
  function totals() {
    const subtotal = getItems().reduce((sum, i) => sum + (Number(i.itemPrice) || 0) * i.quantity, 0);
    const tax = Math.round(subtotal * 0.05);                       // 5% GST
    const deliveryFee = subtotal >= 500 || subtotal === 0 ? 0 : 40; // free delivery from ₱500
    const total = subtotal > 0 ? subtotal + tax + deliveryFee : 0;
    return { subtotal, tax, deliveryFee, total };
  }

  return { getItems, add, remove, setQuantity, clear, count, totals };
})();
