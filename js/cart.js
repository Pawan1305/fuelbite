/**
 * cart.js – Cart state management
 */

let cart = []; // [{id, name, price, emoji, qty}]

function getCart() { return cart; }

function getCartQty(itemId) {
  const item = cart.find(c => c.id === itemId);
  return item ? item.qty : 0;
}

function getCartTotal() {
  return cart.reduce((sum, c) => sum + c.price * c.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, c) => sum + c.qty, 0);
}

function addToCart(itemId) {
  const items = getMenuItems();
  const item = items.find(i => i.id === itemId);
  if (!item || !item.available) return;

  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, emoji: item.emoji, qty: 1 });
  }
  updateCartUI();
  refreshMenu();
  showToast(`${item.name} added to cart!`, 'success');
}

function changeQty(itemId, delta) {
  const existing = cart.find(c => c.id === itemId);
  if (!existing) return;
  existing.qty += delta;
  if (existing.qty <= 0) {
    cart = cart.filter(c => c.id !== itemId);
  }
  updateCartUI();
  refreshMenu();
}

function removeFromCart(itemId) {
  cart = cart.filter(c => c.id !== itemId);
  updateCartUI();
  refreshMenu();
}

function clearCart() {
  cart = [];
  updateCartUI();
  refreshMenu();
}

function updateCartUI() {
  // Badge
  const count = getCartCount();
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = count;

  // Cart items list
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotalEl = document.getElementById('cartTotal');

  if (!cartItemsEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<div class="empty-cart">
      <i class="fas fa-shopping-basket"></i>
      <p>Your cart is empty</p>
    </div>`;
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  cartItemsEl.innerHTML = cart.map(c => `
    <div class="cart-item">
      <span style="font-size:1.4rem">${c.emoji || '🍽️'}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(c.name)}</div>
        <div class="cart-item-price">₹${c.price} each</div>
      </div>
      <div class="cart-item-qty">
        <button class="cart-qty-btn" onclick="changeQty(${c.id}, -1)">−</button>
        <span>${c.qty}</span>
        <button class="cart-qty-btn" onclick="changeQty(${c.id}, 1)">+</button>
      </div>
      <div class="cart-item-total">₹${c.price * c.qty}</div>
    </div>
  `).join('');

  if (cartFooter) cartFooter.style.display = 'block';
  if (cartTotalEl) cartTotalEl.textContent = `₹${getCartTotal()}`;
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}
