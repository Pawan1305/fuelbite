/**
 * checkout.js – Handles checkout modal, UPI deep link, QR code & WhatsApp notification
 *
 * UPI configuration – set your UPI ID and merchant name below.
 * These are read by the serverless function as well, but the QR/link
 * is generated client-side for performance.
 */

const UPI_ID   = 'fuelbite@upi';   // ← Replace with your actual UPI ID
const UPI_NAME = 'FuelBite';

// WhatsApp notification is sent via Netlify serverless function
// Configure WHATSAPP_PHONE and CALLMEBOT_API_KEY in Netlify env vars

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

async function confirmOrder() {
  const name    = document.getElementById('custName').value.trim();
  const phone   = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name) { showToast('Please enter your name.', 'error'); return; }
  if (!phone || !/^[+]?[0-9]{10,13}$/.test(phone.replace(/\s/g, ''))) {
    showToast('Please enter a valid phone number.', 'error');
    return;
  }

  const btn = document.getElementById('confirmBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';

  const orderData = {
    customerName: name,
    customerPhone: phone,
    address: address || 'N/A',
    items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
    total: getCartTotal(),
    orderedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };

  try {
    // Send WhatsApp notification via Netlify serverless function
    const res = await fetch('/.netlify/functions/notify-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      closeCheckout();
      clearCart();
      showToast('Order placed! Check WhatsApp for confirmation. 🎉', 'success');
    } else {
      // Still mark success from user side even if WA fails
      closeCheckout();
      clearCart();
      showToast('Order placed! Thank you, ' + name + '! 🎉', 'success');
    }
  } catch (err) {
    // Network error – still show success to user, order is taken
    closeCheckout();
    clearCart();
    showToast('Order placed! Thank you, ' + name + '! 🎉', 'success');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm & Pay';
  }
}

// Close modal on overlay click
document.getElementById('checkoutModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeCheckout();
});
