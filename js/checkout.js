/**
 * checkout.js – Handles checkout modal, UPI deep link, QR code & WhatsApp notification
 *
 * UPI configuration – set your UPI ID and merchant name below.
 * These are read by the serverless function as well, but the QR/link
 * is generated client-side for performance.
 */

const UPI_ID   = 'pawan.punnu.k@oksbi';
const UPI_NAME = 'FuelBite';
const OWNER_WHATSAPP = '919053346151'; // ← Replace with owner's WhatsApp number (country code + number, no + or spaces)

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function openCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }
  // Close cart sidebar
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('active');

  renderOrderSummary();
  renderPayment();

  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('active');
}

function renderOrderSummary() {
  const el = document.getElementById('orderSummary');
  if (!el) return;
  el.innerHTML = `
    <h4>Order Summary</h4>
    ${cart.map(c => `
      <div class="summary-item">
        <span>${escapeHtml(c.name)} × ${c.qty}</span>
        <span>₹${c.price * c.qty}</span>
      </div>`).join('')}
    <div class="summary-total">
      <span>Total</span>
      <span>₹${getCartTotal()}</span>
    </div>`;
}

function buildUpiString(amount) {
  return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('FuelBite Order')}`;
}

function renderPayment() {
  const el = document.getElementById('paymentContent');
  if (!el) return;
  const amount = getCartTotal();

  if (isMobile()) {
    // UPI deep link – opens installed UPI apps
    el.innerHTML = `
      <a class="upi-btn" id="upiLink" href="${buildUpiString(amount)}">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png"
          alt="UPI" height="22" style="filter:brightness(10)"/>
        Pay ₹${amount} via UPI
      </a>
      <p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">
        Opens PhonePe, GPay, Paytm or any UPI app
      </p>`;
  } else {
    // Desktop – generate QR via QR Server API (free, no key needed)
    const upiLink = buildUpiString(amount);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=000000&margin=8`;
    el.innerHTML = `
      <div class="qr-wrap">
        <img src="${qrUrl}" alt="UPI QR Code" width="180" height="180" loading="lazy"/>
        <div class="qr-label">
          Scan with any UPI app (PhonePe, GPay, Paytm…)<br/>
          <strong>Amount: ₹${amount}</strong>
        </div>
      </div>`;
  }
}

/** Save order to localStorage so admin can track it */
function saveOrder(orderData) {
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem('fuelbite_orders') || '[]'); } catch(e) {}
  const order = {
    ...orderData,
    id: 'FB' + Date.now().toString().slice(-6),
    status: 'pending'
  };
  orders.unshift(order); // newest first
  localStorage.setItem('fuelbite_orders', JSON.stringify(orders));
  return order;
}

/** Payment success sound – three rising tones via Web Audio API (no audio file needed) */
function playPaymentSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [{ f: 660, t: 0 }, { f: 880, t: 0.15 }, { f: 1320, t: 0.3 }].forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.28, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.28);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.3);
    });
  } catch(e) { /* audio not supported */ }
}

/**
 * sendOrderViaWhatsApp – validates form, saves order, plays sound,
 * then opens WhatsApp with full order details + payment screenshot reminder.
 */
function sendOrderViaWhatsApp() {
  const name    = document.getElementById('custName').value.trim();
  const phone   = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name) { showToast('Please enter your name.', 'error'); return; }
  if (!phone || !/^[+]?[0-9]{10,13}$/.test(phone.replace(/\s/g, ''))) {
    showToast('Please enter a valid phone number.', 'error');
    return;
  }

  const orderData = {
    customerName: name,
    customerPhone: phone,
    address: address || 'N/A',
    items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
    total: getCartTotal(),
    orderedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };

  const order = saveOrder(orderData);

  // Build WhatsApp message
  const itemLines = orderData.items
    .map(i => `• ${i.name} ×${i.qty}  =  ₹${i.price * i.qty}`)
    .join('\n');
  const message = [
    `*New FuelBite Order – ${order.id}*`,
    ``,
    `*Name:* ${name}`,
    `*Phone:* ${phone}`,
    `*Table/Address:* ${orderData.address}`,
    ``,
    `*Items:*`,
    itemLines,
    ``,
    `*Total: ₹${orderData.total}*`,
    `*Ordered At:* ${orderData.orderedAt}`,
    ``,
    `*Please also send a screenshot of your payment confirmation.*`
  ].join('\n');

  // Play success sound then close & redirect
  playPaymentSound();
  closeCheckout();
  clearCart();
  showToast(`Order ${order.id} placed! Opening WhatsApp… 🎉`, 'success');

  setTimeout(() => {
    const waUrl = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }, 350);
}

// Close modal on overlay click
document.getElementById('checkoutModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeCheckout();
});
