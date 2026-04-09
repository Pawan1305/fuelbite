/**
 * menu.js – Loads menu items from localStorage (managed by admin)
 * and renders them with category filtering.
 */

const DEFAULT_MENU = [
  { id: 1, name: "Classic Smash Burger", category: "Burgers", price: 149, emoji: "🍔", desc: "Double smash patty, cheddar, caramelised onions, secret sauce.", available: true },
  { id: 2, name: "Spicy Chicken Burger", category: "Burgers", price: 139, emoji: "🌶️", desc: "Crispy fried chicken, chilli mayo, pickles & lettuce.", available: true },
  { id: 3, name: "Veggie Delight Burger", category: "Burgers", price: 119, emoji: "🥦", desc: "Grilled veggie patty, hummus spread, fresh veggies.", available: true },
  { id: 4, name: "Loaded Fries", category: "Sides", price: 89, emoji: "🍟", desc: "Crispy golden fries loaded with cheese sauce & jalapeños.", available: true },
  { id: 5, name: "Onion Rings", category: "Sides", price: 69, emoji: "🧅", desc: "Beer-battered crispy onion rings with dipping sauce.", available: true },
  { id: 6, name: "Coleslaw", category: "Sides", price: 49, emoji: "🥗", desc: "Creamy homemade coleslaw, fresh & crunchy.", available: true },
  { id: 7, name: "Masala Chai", category: "Drinks", price: 39, emoji: "☕", desc: "Hand-brewed spiced Indian tea.",  available: true },
  { id: 8, name: "Cold Coffee", category: "Drinks", price: 69, emoji: "🧋", desc: "Blended cold coffee with a shot of espresso.", available: true },
  { id: 9, name: "Fresh Lime Soda", category: "Drinks", price: 49, emoji: "🥤", desc: "Refreshing lime soda, sweet or salted.", available: true },
  { id: 10, name: "Chocolate Lava Cake", category: "Desserts", price: 99, emoji: "🍫", desc: "Warm chocolate cake with a gooey molten centre.", available: true },
  { id: 11, name: "Ice Cream Sundae", category: "Desserts", price: 79, emoji: "🍨", desc: "Two scoops of ice cream with toppings of your choice.", available: true },
];

function getMenuItems() {
  try {
    const stored = localStorage.getItem('fuelbite_menu');
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  // Seed defaults on first visit
  localStorage.setItem('fuelbite_menu', JSON.stringify(DEFAULT_MENU));
  return DEFAULT_MENU;
}

function getCategories(items) {
  const cats = ['All', ...new Set(items.map(i => i.category))];
  return cats;
}

let activeCategory = 'All';

function renderCategoryTabs(items) {
  const tabs = document.getElementById('categoryTabs');
  if (!tabs) return;
  tabs.innerHTML = getCategories(items).map(cat => `
    <button class="tab-btn ${cat === activeCategory ? 'active' : ''}"
      onclick="filterCategory('${cat}')">${cat}</button>
  `).join('');
}

function renderMenuGrid(items) {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  const filtered = activeCategory === 'All'
    ? items
    : items.filter(i => i.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="loading-spinner"><i class="fas fa-utensils"></i> No items in this category.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => renderCard(item)).join('');
}

function renderCard(item) {
  const cartQty = getCartQty(item.id);
  const qtyControl = cartQty > 0
    ? `<div class="qty-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${cartQty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
       </div>`
    : `<button class="add-btn" onclick="addToCart(${item.id})" aria-label="Add ${item.name}">+</button>`;

  return `
    <div class="menu-card" id="card-${item.id}">
      <div class="card-emoji">${item.emoji || '🍽️'}</div>
      <div class="card-body">
        <div class="card-name">${escapeHtml(item.name)}</div>
        <div class="card-desc">${escapeHtml(item.desc || '')}</div>
        <div class="card-footer">
          <span class="card-price">₹${item.price}</span>
          ${item.available
            ? qtyControl
            : `<span class="unavailable-badge">Unavailable</span>`}
        </div>
      </div>
    </div>`;
}

function filterCategory(cat) {
  activeCategory = cat;
  const items = getMenuItems();
  renderCategoryTabs(items);
  renderMenuGrid(items);
}

function refreshMenu() {
  const items = getMenuItems();
  renderCategoryTabs(items);
  renderMenuGrid(items);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

// Init
document.addEventListener('DOMContentLoaded', refreshMenu);
