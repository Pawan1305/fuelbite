/**
 * Netlify Function: admin-auth
 * 
 * Validates admin credentials against environment variables.
 * NEVER exposes ADMIN_PASS to the front-end.
 *
 * Environment variables to set in Netlify Dashboard:
 *   ADMIN_USER  – admin username (default: admin)
 *   ADMIN_PASS  – admin password (set a strong password!)
 *   AUTH_SECRET – a random secret string used to sign tokens (e.g. openssl rand -hex 32)
 */

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { user, pass } = body;

  const ADMIN_USER   = process.env.ADMIN_USER   || 'admin';
  const ADMIN_PASS   = process.env.ADMIN_PASS;
  const AUTH_SECRET  = process.env.AUTH_SECRET  || 'change-me-in-netlify-env';

  // Password must be set via env var
  if (!ADMIN_PASS) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: ADMIN_PASS not set.' })
    };
  }

  // Constant-time comparison to prevent timing attacks
  const userMatch = timingSafeEqual(user || '', ADMIN_USER);
  const passMatch = timingSafeEqual(pass || '', ADMIN_PASS);

  if (!userMatch || !passMatch) {
    // Artificial delay to slow brute-force
    await delay(400 + Math.random() * 300);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials.' })
    };
  }

  // Issue a simple session token (base64 of secret + timestamp)
  // For production, use a proper JWT library — but this is sufficient for small deployments
  const payload = `${AUTH_SECRET}:${Date.now()}:admin`;
  const token = Buffer.from(payload).toString('base64');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  };
};

/** Constant-time string comparison to prevent timing attacks */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    // Still iterate to keep timing consistent
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
