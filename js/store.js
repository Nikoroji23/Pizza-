/* =====================================================================
   store.js  —  THE "DATABASE" (localStorage)
   ---------------------------------------------------------------------
   Replaces: MongoDB + Mongoose models + Express controllers.
   Data is saved in the browser's localStorage as JSON, so it survives
   page reloads. It is only on THIS browser — that's the trade-off of
   having no backend.

   Replaces these backend pieces:
     inventoryController.js  -> Store.inventory*  functions
     pizzaController.js      -> Store.getPizzas / getCustomOptions
     orderController.js      -> Store.placeOrder / updateOrderStatus ...
     paymentController.js    -> handled by the mock modal in checkout.js
     cronService.js          -> Store.runThresholdAudit
     socketService.js        -> Store.onChange (live updates between tabs)
   ===================================================================== */

const Store = (() => {
  const KEYS = {
    users: 'acp_users',
    inventory: 'acp_inventory',
    pizzas: 'acp_pizzas',
    orders: 'acp_orders',
    session: 'acp_session',
    cart: 'acp_cart'
  };

  /* ---------- low level helpers ---------- */

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    // The browser's own "storage" event only fires in OTHER tabs.
    // We fire a custom event so the current tab can react too.
    window.dispatchEvent(new CustomEvent('acp:change', { detail: { key } }));
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- first-run seeding ---------- */

  function init() {
    if (!localStorage.getItem(KEYS.users)) {
      write(KEYS.users, SEED_USERS);
    }
    if (!localStorage.getItem(KEYS.inventory)) {
      write(KEYS.inventory, SEED_INVENTORY.map(item => ({ ...item, id: uid('inv'), isAvailable: true })));
    }
    if (!localStorage.getItem(KEYS.pizzas)) {
      write(KEYS.pizzas, SEED_PIZZAS.map(p => ({ ...p, id: uid('pizza'), isAvailable: true })));
    }
    if (!localStorage.getItem(KEYS.orders)) {
      write(KEYS.orders, []);
    }
  }

  /** Wipes everything and re-seeds (used by the "Reset demo data" link in the footer). */
  function resetAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    init();
  }

  /* ---------- live updates (replaces Socket.io) ---------- */

  /** Run `callback` whenever data changes in this tab OR in another tab. */
  function onChange(callback) {
    window.addEventListener('acp:change', callback);
    window.addEventListener('storage', callback); // fires when ANOTHER tab writes
  }

  /* ---------- users (used by auth.js) ---------- */

  const getUsers = () => read(KEYS.users, []);
  const saveUsers = users => write(KEYS.users, users);

  /* ---------- pizzas & inventory ---------- */

  const getPizzas = () => read(KEYS.pizzas, []).filter(p => p.isAvailable);

  const getInventory = () => read(KEYS.inventory, []);

  /** Same shape the old /pizzas/custom-options endpoint returned */
  function getCustomOptions() {
    const items = getInventory();
    return {
      bases: items.filter(i => i.category === 'base'),
      sauces: items.filter(i => i.category === 'sauce'),
      cheeses: items.filter(i => i.category === 'cheese'),
      vegetables: items.filter(i => i.category === 'vegetable')
    };
  }

  const isLowStock = item => item.stockQuantity <= item.threshold;

  /** Admin: add units to an item (+10 / +25 buttons) */
  function restockItem(id, quantity) {
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) throw new Error('Please provide a valid positive quantity to add.');
    const items = getInventory();
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Inventory item not found');
    item.stockQuantity += qty;
    write(KEYS.inventory, items);
    return item;
  }

  /** Admin: edit stock / threshold / price from the modal */
  function updateInventoryItem(id, changes) {
    const items = getInventory();
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Inventory item not found');
    if (changes.stockQuantity !== undefined) item.stockQuantity = Number(changes.stockQuantity);
    if (changes.threshold !== undefined) item.threshold = Number(changes.threshold);
    if (changes.price !== undefined) item.price = Number(changes.price);
    write(KEYS.inventory, items);
    return item;
  }

  /**
   * Replaces the cron job + email alert.
   * There is no server to send email, so we simply report which
   * items are at or below their safety threshold.
   */
  function runThresholdAudit() {
    const low = getInventory().filter(isLowStock);
    return {
      count: low.length,
      items: low,
      message: low.length
        ? `Audit completed: ${low.length} item(s) are at or below their safety threshold. (Email alerts need a backend, so this demo only reports it here.)`
        : 'Audit completed: all inventory items have healthy stock levels.'
    };
  }

  /* ---------- orders ---------- */

  const getOrders = () => read(KEYS.orders, []);

  const getOrderById = id => getOrders().find(o => o.id === id) || null;

  const getOrdersForUser = userId =>
    getOrders().filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  /**
   * Checks every ingredient in the cart is in stock.
   * Returns null if OK, or an error message string.
   * (Same logic as validateAndDeductStock in orderController.js)
   */
  function checkStock(items) {
    const needed = totalIngredientsNeeded(items);
    const inventory = getInventory();
    for (const [name, qty] of Object.entries(needed)) {
      const inv = inventory.find(i => i.name === name);
      if (!inv) return `Ingredient '${name}' is no longer available in our inventory catalog.`;
      if (inv.stockQuantity < qty) {
        return `Insufficient stock for '${name}'. Required: ${qty}, Available: ${inv.stockQuantity}. Please adjust your pizza order.`;
      }
    }
    return null;
  }

  /** Adds up how many of each ingredient the whole cart needs */
  function totalIngredientsNeeded(items) {
    const needed = {};
    const add = (name, qty) => { if (name) needed[name] = (needed[name] || 0) + qty; };
    items.forEach(item => {
      const qty = Number(item.quantity) || 1;
      add(item.base, qty);
      add(item.sauce, qty);
      add(item.cheese, qty);
      (item.vegetables || []).forEach(v => add(v, qty));
    });
    return needed;
  }

  /**
   * Creates the order, takes the ingredients out of stock, and saves everything.
   * Called AFTER the (mock) payment succeeds.
   * Returns the new order, or throws an Error with a readable message.
   */
  function placeOrder({ user, items, deliveryAddress, pricing }) {
    const stockError = checkStock(items);
    if (stockError) throw new Error(stockError);

    // 1. deduct stock
    const needed = totalIngredientsNeeded(items);
    const inventory = getInventory();
    Object.entries(needed).forEach(([name, qty]) => {
      const inv = inventory.find(i => i.name === name);
      inv.stockQuantity -= qty;
    });
    write(KEYS.inventory, inventory);

    // 2. build the order
    const now = new Date().toISOString();
    const order = {
      id: uid('ord'),
      orderNumber: 'ACP-' + Math.floor(100000 + Math.random() * 900000),
      userId: user.id,
      customer: { name: user.name, email: user.email },   // snapshot, so admin can see who ordered
      items: items.map(i => ({
        pizzaType: i.pizzaType || 'custom',
        pizzaName: i.pizzaName || 'Custom Artisan Pizza',
        base: i.base, sauce: i.sauce, cheese: i.cheese,
        vegetables: i.vegetables || [],
        quantity: Number(i.quantity) || 1,
        itemPrice: Number(i.itemPrice) || 0
      })),
      deliveryAddress,
      pricing,
      payment: {
        method: 'mock_razorpay',
        status: 'completed',
        paymentId: 'pay_' + Math.random().toString(36).slice(2, 16)
      },
      status: 'Order Received',
      statusHistory: [{ status: 'Order Received', timestamp: now, note: 'Payment confirmed. Order sent to the kitchen queue.' }],
      estimatedDeliveryTime: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
      createdAt: now
    };

    const orders = getOrders();
    orders.push(order);
    write(KEYS.orders, orders);
    return order;
  }

  /** Admin: move an order through the pipeline. "Delivered" is final. */
  function updateOrderStatus(orderId, status, note) {
    if (!ORDER_STATUSES.includes(status)) throw new Error('Invalid status.');
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'Delivered') {
      throw new Error('This order has already been delivered and is locked from further changes.');
    }
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Order status updated to ${status} by staff.`
    });
    write(KEYS.orders, orders);
    return order;
  }

  return {
    KEYS, read, write, uid, init, resetAll, onChange,
    getUsers, saveUsers,
    getPizzas, getInventory, getCustomOptions, isLowStock,
    restockItem, updateInventoryItem, runThresholdAudit,
    getOrders, getOrderById, getOrdersForUser,
    checkStock, placeOrder, updateOrderStatus
  };
})();

// Make sure the "database" exists before any page script runs
Store.init();
