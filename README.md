# 🔥 FuelBite Restaurant Website

A fully static restaurant website deployable on **Netlify free tier** with:
- 🛒 Add-to-cart & checkout
- 📱 UPI deep link on mobile / QR code on desktop
- 💬 WhatsApp order notification to owner
- 🔐 Admin panel to manage menu (password hidden from users)

---

## 📁 Project Structure

```
fuelBite/
├── index.html               ← Customer-facing menu & ordering
├── css/
│   ├── style.css            ← Main site styles
│   └── admin.css            ← Admin panel styles
├── js/
│   ├── menu.js              ← Menu rendering & filtering
│   ├── cart.js              ← Cart state management
│   └── checkout.js          ← UPI/QR payment + order confirm
├── admin/
│   ├── login.html           ← Admin login page
│   └── dashboard.html       ← Menu management dashboard
├── netlify/
│   └── functions/
│       ├── admin-auth.js    ← Server-side credential check (password NEVER in frontend)
│       └── notify-order.js  ← Sends WhatsApp notification via CallMeBot
├── netlify.toml             ← Netlify configuration
├── .env.example             ← Template for environment variables
├── .gitignore
└── package.json
```

---

## 🚀 Deploy to Netlify (Free)

### Step 1 – Push to GitHub
```bash
cd fuelBite
git init
git add .
git commit -m "Initial commit"
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fuelbite.git
git push -u origin main
```

### Step 2 – Connect to Netlify
1. Go to [netlify.com](https://netlify.com) → **New site from Git**
2. Select your GitHub repo
3. Build settings are auto-detected from `netlify.toml`
4. Click **Deploy**

### Step 3 – Set Environment Variables
In Netlify Dashboard → **Site Settings → Environment Variables**, add:

| Key | Value | Description |
|-----|-------|-------------|
| `ADMIN_USER` | `admin` | Admin username |
| `ADMIN_PASS` | `YourStrongPassword123!` | Admin password (never exposed to frontend) |
| `AUTH_SECRET` | `<random 64-char hex>` | Token secret – generate with `openssl rand -hex 32` |
| `WHATSAPP_PHONE` | `919876543210` | Your WhatsApp number (country code + number, no +) |
| `CALLMEBOT_API_KEY` | `123456` | CallMeBot API key (see below) |

---

## 💬 WhatsApp Setup (CallMeBot – Free)

1. Save **+34 644 65 24 27** in your contacts as "CallMeBot"
2. Send this message to that number on WhatsApp:
   ```
   I allow callmebot to send me messages
   ```
3. You'll receive your personal API key via WhatsApp within a minute
4. Set `CALLMEBOT_API_KEY` in Netlify env vars

---

## 💳 UPI Setup

1. Open `js/checkout.js`
2. Change line 11:
   ```js
   const UPI_ID = 'fuelbite@upi'; // ← Replace with your actual UPI ID
   ```
3. Optionally change `UPI_NAME` on line 12

---

## 🔐 Admin Panel

Navigate to `yourdomain.netlify.app/admin/login.html`

- **Username**: set via `ADMIN_USER` env var (default: `admin`)  
- **Password**: set via `ADMIN_PASS` env var  
- Password is **never stored or sent to the frontend** — authentication happens server-side

### Admin can:
- ✅ Add new menu items (name, category, price, emoji, description)
- ✏️ Edit existing items
- 👁️ Toggle item availability (show/hide from menu)
- 🗑️ Delete items

---

## 🛠️ Local Development

```bash
npm install
# Create .env from example and fill in your values
cp .env.example .env
npm run dev  # starts netlify dev on http://localhost:8888
```

---

## 📱 Payment Flow

| Device | Behaviour |
|--------|-----------|
| **Mobile** | "Pay via UPI" button opens installed UPI apps (PhonePe, GPay, Paytm, etc.) |
| **Desktop** | QR code displayed — scan with any UPI app on your phone |

After payment, customer clicks **Confirm & Pay** → WhatsApp notification sent to owner.
