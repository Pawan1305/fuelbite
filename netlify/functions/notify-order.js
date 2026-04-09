/**
 * Netlify Function: notify-order
 *
 * Sends a WhatsApp message to the restaurant owner when an order is placed.
 * Uses CallMeBot free WhatsApp API (https://www.callmebot.com/blog/free-api-whatsapp-messages/)
 *
 * Environment variables to set in Netlify Dashboard:
 *   WHATSAPP_PHONE     – Owner's WhatsApp number with country code, no + (e.g. 919876543210)
 *   CALLMEBOT_API_KEY  – API key from callmebot.com (free, ~1 minute setup)
 *
 * CALLMEBOT SETUP (one-time):
 *   1. Save +34 644 65 24 27 in your contacts as "CallMeBot"
 *   2. Send "I allow callmebot to send me messages" to that number on WhatsApp
 *   3. You'll receive your API key via WhatsApp
 *   4. Set CALLMEBOT_API_KEY in Netlify environment variables
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let order;
  try {
    order = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const PHONE   = process.env.WHATSAPP_PHONE;
  const API_KEY = process.env.CALLMEBOT_API_KEY;

  if (!PHONE || !API_KEY) {
    // Gracefully degrade — order still goes through
    console.log('WhatsApp env vars not set. Order data:', JSON.stringify(order));
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, note: 'WhatsApp not configured' })
    };
  }

  // Build WhatsApp message
  const itemLines = (order.items || [])
    .map(i => `  • ${i.name} x${i.qty} = ₹${i.price * i.qty}`)
    .join('\n');

  const message = [
    '🔥 *New FuelBite Order!*',
    `👤 Customer: ${order.customerName}`,
    `📱 Phone: ${order.customerPhone}`,
    `📍 Table/Address: ${order.address || 'N/A'}`,
    '',
    '🛒 *Items:*',
    itemLines,
    '',
    `💰 *Total: ₹${order.total}*`,
    `🕐 ${order.orderedAt}`
  ].join('\n');

  const encodedMsg = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodedMsg}&apikey=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('CallMeBot error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('WhatsApp fetch error:', err);
    // Don't fail the order – just log
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true })
  };
};
