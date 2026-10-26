/* =====================================================================
   data.js  —  SEED DATA
   ---------------------------------------------------------------------
   In the original project this lived in backend/src/seeds/seedData.js and
   was written into MongoDB by `npm run seed`.
   Now it is plain JavaScript objects. store.js copies them into
   localStorage the first time the site is opened.
   ===================================================================== */

const SEED_USERS = [
  {
    id: 'user_admin',
    name: 'Anti-Crust Admin Master',
    email: 'admin@anticrust.com',
    password: 'Admin@12345',   // demo only! A real site must never store plain passwords
    role: 'admin',
    address: { street: '100 Pizzaiolo HQ Blvd', city: 'San Francisco', state: 'CA', zipCode: '94103', phone: '+1-800-ANTI-PIZZA' }
  },
  {
    id: 'user_demo',
    name: 'Alex Rivera',
    email: 'user@anticrust.com',
    password: 'User@12345',
    role: 'user',
    address: { street: '42 Nebula Avenue, Suite 4B', city: 'San Francisco', state: 'CA', zipCode: '94107', phone: '+1-555-0199' }
  }
];

/* Ingredients. "category" decides which builder step the item appears in.
   stockQuantity goes down when orders are placed; threshold is the
   "low stock" warning level. */
const SEED_INVENTORY = [
  // ---- BASES ----
  { name: 'Classic Hand Tossed', category: 'base', stockQuantity: 45, threshold: 20, unit: 'bases', price: 120, description: 'Crispy on the outside, light and airy inside with golden crust.' },
  { name: 'Thin Crust', category: 'base', stockQuantity: 35, threshold: 20, unit: 'bases', price: 140, description: 'Ultra-thin, light cracker-style crisp crust for true crunch lovers.' },
  { name: 'Cheese Burst Crust', category: 'base', stockQuantity: 25, threshold: 15, unit: 'bases', price: 180, description: 'Loaded with luscious molten cheddar and mozzarella infused core.' },
  { name: '100% Whole Wheat Thin Crust', category: 'base', stockQuantity: 30, threshold: 15, unit: 'bases', price: 150, description: 'Fiber-rich artisan milled whole wheat crust without compromise.' },
  { name: 'Gluten-Free Garlic Herb Crust', category: 'base', stockQuantity: 18, threshold: 20, unit: 'bases', price: 190, description: 'Certified gluten-free dough blended with roasted garlic and oregano.' }, // starts LOW on purpose

  // ---- SAUCES ----
  { name: 'Classic Italian Marinara', category: 'sauce', stockQuantity: 60, threshold: 25, unit: 'portions', price: 40, description: 'San Marzano tomatoes slow-simmered with cold-pressed olive oil & basil.' },
  { name: 'Fiery Peri-Peri Sauce', category: 'sauce', stockQuantity: 40, threshold: 20, unit: 'portions', price: 50, description: 'African bird’s eye chili with smoked paprika and tangy citrus zest.' },
  { name: 'Creamy Garlic Alfredo', category: 'sauce', stockQuantity: 35, threshold: 15, unit: 'portions', price: 60, description: 'Velvety parmesan cream sauce with roasted garlic and cracked black pepper.' },
  { name: 'Tangy Smoky BBQ Sauce', category: 'sauce', stockQuantity: 30, threshold: 15, unit: 'portions', price: 50, description: 'Hickory-smoked barbecue reduction with dark molasses and apple cider vinegar.' },
  { name: 'Fresh Basil Pesto Sauce', category: 'sauce', stockQuantity: 12, threshold: 15, unit: 'portions', price: 70, description: 'Genovese basil, toasted pine nuts, pecorino cheese, and extra virgin olive oil.' }, // starts LOW on purpose

  // ---- CHEESES ----
  { name: '100% Real Mozzarella', category: 'cheese', stockQuantity: 80, threshold: 30, unit: 'portions', price: 70, description: 'High-stretch whole milk mozzarella for the legendary golden cheese pull.' },
  { name: 'Aged Cheddar Blend', category: 'cheese', stockQuantity: 50, threshold: 20, unit: 'portions', price: 80, description: 'Sharp aged white cheddar and Monterey Jack for intense savory richness.' },
  { name: 'Fresh Bocconcini Mozzarella', category: 'cheese', stockQuantity: 30, threshold: 15, unit: 'portions', price: 100, description: 'Hand-torn soft Italian buffalo milk mozzarella pearls.' },
  { name: 'Plant-Based Vegan Cheese', category: 'cheese', stockQuantity: 25, threshold: 15, unit: 'portions', price: 95, description: 'Coconut-oil and cashew based dairy-free melt with rich creamy profile.' },
  { name: 'Smoked Dutch Gouda', category: 'cheese', stockQuantity: 22, threshold: 15, unit: 'portions', price: 90, description: 'Naturally oak-smoked Gouda delivering a deep, nutty complexity.' },

  // ---- VEGETABLES ----
  { name: 'Bell Pepper Medley', category: 'vegetable', stockQuantity: 75, threshold: 25, unit: 'portions', price: 35, description: 'Tricolor red, yellow, and green bell peppers diced fresh daily.' },
  { name: 'Caramelized Red Onions', category: 'vegetable', stockQuantity: 80, threshold: 25, unit: 'portions', price: 30, description: 'Slow-roasted sweet red onions with balsamic glaze.' },
  { name: 'Spanish Black Olives', category: 'vegetable', stockQuantity: 60, threshold: 20, unit: 'portions', price: 45, description: 'Pitted Mediterranean black olives sliced to perfection.' },
  { name: 'Pickled Jalapeños', category: 'vegetable', stockQuantity: 55, threshold: 20, unit: 'portions', price: 40, description: 'Tangy and fiery pickled green jalapeño rings.' },
  { name: 'Button Mushrooms', category: 'vegetable', stockQuantity: 50, threshold: 20, unit: 'portions', price: 45, description: 'Fresh sliced white button mushrooms tossed with herbs.' },
  { name: 'Sweet Golden Corn', category: 'vegetable', stockQuantity: 65, threshold: 20, unit: 'portions', price: 30, description: 'Steamed sweet American corn kernels bursting with juicy flavor.' },
  { name: 'Fresh Baby Spinach', category: 'vegetable', stockQuantity: 40, threshold: 15, unit: 'portions', price: 35, description: 'Tender baby spinach leaves wilted slightly in the baking oven.' },
  { name: 'Sun-Ripened Cherry Tomatoes', category: 'vegetable', stockQuantity: 45, threshold: 20, unit: 'portions', price: 40, description: 'Juicy halved cherry tomatoes bursting with sweet acidity.' }
];

/* Specialty (ready-made) menu pizzas */
const SEED_PIZZAS = [
  {
    name: 'The Anti-Crust Supreme',
    description: 'Our flagship rebellion pizza: Cheese Burst crust, San Marzano marinara, 100% real mozzarella, bell peppers, olives, and cherry tomatoes.',
    price: 499, badge: 'Bestseller ⭐', category: 'specialty',
    defaultBase: 'Cheese Burst Crust', defaultSauce: 'Classic Italian Marinara', defaultCheese: '100% Real Mozzarella',
    defaultVegetables: ['Bell Pepper Medley', 'Spanish Black Olives', 'Sun-Ripened Cherry Tomatoes'],
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Fiery Peri-Peri Extravaganza',
    description: 'For heat seekers: Thin Crust with fiery peri-peri sauce, aged cheddar blend, pickled jalapeños, red onions, and sweet corn.',
    price: 479, badge: 'Spicy 🔥', category: 'specialty',
    defaultBase: 'Thin Crust', defaultSauce: 'Fiery Peri-Peri Sauce', defaultCheese: 'Aged Cheddar Blend',
    defaultVegetables: ['Pickled Jalapeños', 'Caramelized Red Onions', 'Sweet Golden Corn'],
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Truffle & Mushroom Overload',
    description: 'Gourmet luxury: Garlic Herb crust, creamy garlic Alfredo sauce, smoked gouda, button mushrooms, and tender baby spinach.',
    price: 549, badge: "Chef's Special 👨‍🍳", category: 'gourmet',
    defaultBase: 'Gluten-Free Garlic Herb Crust', defaultSauce: 'Creamy Garlic Alfredo', defaultCheese: 'Smoked Dutch Gouda',
    defaultVegetables: ['Button Mushrooms', 'Fresh Baby Spinach'],
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Smoky BBQ Smokehouse Dream',
    description: 'Bold & rich: Classic Hand Tossed crust, smoky BBQ reduction sauce, aged cheddar blend, caramelized red onions, and bell peppers.',
    price: 519, badge: 'Smoky Goodness 🍖', category: 'specialty',
    defaultBase: 'Classic Hand Tossed', defaultSauce: 'Tangy Smoky BBQ Sauce', defaultCheese: 'Aged Cheddar Blend',
    defaultVegetables: ['Caramelized Red Onions', 'Bell Pepper Medley'],
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Garden Fresh Verde Deluxe',
    description: 'Vibrant & wholesome: Whole wheat thin crust, fresh Genovese basil pesto sauce, bocconcini mozzarella, baby spinach, and cherry tomatoes.',
    price: 459, badge: 'Fresh & Green 🌿', category: 'veg',
    defaultBase: '100% Whole Wheat Thin Crust', defaultSauce: 'Fresh Basil Pesto Sauce', defaultCheese: 'Fresh Bocconcini Mozzarella',
    defaultVegetables: ['Fresh Baby Spinach', 'Sun-Ripened Cherry Tomatoes', 'Spanish Black Olives'],
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Four-Cheese Meltdown',
    description: 'Pure cheese ecstasy: Cheese burst crust with marinara, mozzarella, cheddar blend, bocconcini, and smoked gouda.',
    price: 529, badge: 'Ultra Cheesy 🧀', category: 'specialty',
    defaultBase: 'Cheese Burst Crust', defaultSauce: 'Classic Italian Marinara', defaultCheese: '100% Real Mozzarella',
    defaultVegetables: ['Sweet Golden Corn', 'Spanish Black Olives'],
    image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=600&auto=format&fit=crop&q=80'
  }
];

/* The 5 order statuses, in pipeline order */
const ORDER_STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered', 'Cancelled'];
