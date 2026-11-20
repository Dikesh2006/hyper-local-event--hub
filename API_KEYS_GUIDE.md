# API Keys & Environment Variables Guide

This guide explains all environment variables, secrets, and API keys used in the **Hyper Local Event Hub** application, including how to configure them for local development and production deployment.

---

## 📁 Environment File Locations

Create `.env` files in both the `backend/` and `frontend/` folders:

```bash
minnor/
├── backend/
│   ├── .env          # <--- Backend configuration (Database, JWT, Razorpay Secrets)
│   ├── .env.example  # <--- Committed template
├── frontend/
│   ├── .env          # <--- Frontend configuration (VITE_RAZORPAY_KEY_ID)
│   ├── .env.example  # <--- Committed template
```

---

## 🔑 Environment Variables & API Keys Reference

| Variable Name | Required | Default / Sample Value | Description & Purpose |
|---|---|---|---|
| `PORT` | Yes | `4000` | Port on which the Express REST API server runs. |
| `NODE_ENV` | Yes | `development` | Environment mode (`development` or `production`). |
| `MONGO_URI` | Yes | `mongodb://127.0.0.1:27017/minnor` | MongoDB connection URI (Local MongoDB or Atlas Cloud). |
| `JWT_SECRET` | Yes | `super_secret_jwt_key_2026` | Cryptographic secret key used to sign and verify JWT authentication tokens. |
| `RAZORPAY_KEY_ID` | Optional | `rzp_test_...` | Public API Key ID provided by Razorpay for processing test payments. |
| `RAZORPAY_KEY_SECRET` | Optional | `your_razorpay_secret` | Private Secret Key provided by Razorpay to verify payment signatures. |
| `CLOUDINARY_CLOUD_NAME` | Optional | `my_cloud_name` | Cloudinary account cloud name for hosting media and ticket posters. |
| `CLOUDINARY_API_KEY` | Optional | `123456789012345` | Cloudinary API key for authentication. |
| `CLOUDINARY_API_SECRET` | Optional | `abcde_secret_key` | Cloudinary API secret key for media uploads. |

---

## 🛠️ Step-by-Step API Key Setup Guide

### 1. MongoDB Connection String (`MONGO_URI`)

- **Option A: Local MongoDB**
  Ensure MongoDB Server is installed and running locally, then set:
  ```env
  MONGO_URI=mongodb://127.0.0.1:27017/minnor
  ```

- **Option B: MongoDB Atlas (Cloud Database)**
  1. Register at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  2. Create a free cluster.
  3. Create a Database User under **Database Access**.
  4. Whitelist IP `0.0.0.0/0` under **Network Access**.
  5. Click **Connect** -> **Connect your application** and copy the URI format:
  ```env
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/minnor?retryWrites=true&w=majority
  ```

---

### 2. JSON Web Token Secret (`JWT_SECRET`)

To generate a secure 256-bit random cryptographic secret key, run this standard command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated output string into your `.env` file:
```env
JWT_SECRET=f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```

---

### 3. Razorpay Payment Gateway Keys (Optional)

If integrating online payment processing:
1. Sign up on the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Test Mode**.
3. Navigate to **Settings** -> **API Keys** -> **Generate Key**.
4. Add the keys to `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 4. Cloudinary Image Upload Credentials (Optional)

For Cloud storage of event posters and hall photos:
1. Register at [Cloudinary Console](https://cloudinary.com/console).
2. Copy **Cloud Name**, **API Key**, and **API Secret** from Dashboard.
3. Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## ⚡ Quick `.env` Template Copy-Paste

```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/minnor
JWT_SECRET=super_secret_jwt_key_hyper_local_event_hub_2026
```
