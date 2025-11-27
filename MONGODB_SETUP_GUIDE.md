# MongoDB Atlas IP Whitelist Setup

## Problem
Your backend server cannot connect to MongoDB Atlas because your IP address is not whitelisted.

## Quick Fix (5 minutes)

### Step 1: Get Your Current IP Address
```powershell
curl.exe ifconfig.me
```

### Step 2: Whitelist IP in MongoDB Atlas

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Login** with account: `sardheesh` / [your password]
3. **Select your project** (LEARNAID)
4. **Click "Network Access"** in the left sidebar
5. **Click "Add IP Address"** button
6. **Choose one option**:
   
   **Option A: Add Your Current IP (Secure)**
   - Click "Add Current IP Address"
   - Click "Confirm"
   
   **Option B: Allow All IPs (Development Only - Less Secure)**
   - Enter IP: `0.0.0.0/0`
   - Add comment: "Development - All IPs"
   - Click "Confirm"

### Step 3: Restart Backend Server

Once IP is whitelisted, restart your backend:

```powershell
cd C:\Users\vishn\OneDrive\Desktop\LEARNAID-123\backend
node src/server.js
```

## Verification

Test if backend is running:
```powershell
curl.exe http://localhost:5000/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "..."
}
```

## Important Notes

⚠️ **For Production**: Only whitelist specific IP addresses, never use `0.0.0.0/0`

✅ **For Development**: Using `0.0.0.0/0` is acceptable but remember to restrict it before deployment

🔄 **Dynamic IPs**: If your IP changes frequently, you may need to re-whitelist or use `0.0.0.0/0` for development

## Alternative: Install MongoDB Locally

If you prefer local development without Atlas:

1. **Download MongoDB Community**: https://www.mongodb.com/try/download/community
2. **Install MongoDB** (accept defaults)
3. **Start MongoDB Service**:
   ```powershell
   net start MongoDB
   ```
4. **Update `.env`** file:
   ```
   MONGODB_URI=mongodb://localhost:27017/learnaid
   ```

## Current Configuration

- **MongoDB Atlas Cluster**: learnaid.b3q6npo.mongodb.net
- **Database**: learnaid
- **User**: sardheesh
- **Connection String**: In `backend/.env` file

## Troubleshooting

### Error: "Could not connect to any servers"
- Your IP is not whitelisted → Follow Step 2 above

### Error: "Authentication failed"
- Check username/password in connection string
- Verify database user exists in Atlas

### Error: "Network timeout"
- Check your internet connection
- Verify Atlas cluster is running (not paused)

## Quick Start After Setup

1. Whitelist IP in Atlas
2. Start backend: `cd backend; node src/server.js`
3. Start frontend: `npm run dev`
4. Open browser: http://localhost:3001
5. Login with demo credentials from login page
