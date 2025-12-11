# LearnAID Login Guide - Quick Reference

## 🚀 How to Start the Application

### 1. Start Backend Server
```powershell
cd backend
node src/server.js
```
**Expected Output:**
```
🎓 LearnAIA Backend Server Started
Environment: development
Port: 5000
Database: Connected
```

### 2. Start Frontend Server  
```powershell
# In a NEW terminal window
npm run dev
```
**Expected Output:**
```
▲ Next.js 14.2.33
- Local: http://localhost:3001
✓ Ready
```

## 🔑 Login Credentials (Development Mode)

### Admin Login
- **Email:** `admin@learnaid.edu`
- **Password:** `admin123`
- **Dashboard:** `/admin`

### Faculty Login
- **Email:** `priya.sharma@learnaid.edu`
- **Password:** `faculty123`
- **Dashboard:** `/faculty`

### Student Login
- **Email:** `arjun.patel@student.learnaid.edu`
- **Password:** `student123`
- **Dashboard:** `/student`

## 🌐 Access Points

- **Homepage:** http://localhost:3001
- **Login Page:** http://localhost:3001/login
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/health

## ✅ How to Login

1. **Go to:** http://localhost:3001/login
2. **Click on Role Card:** Admin / Faculty / Student (at the top)
3. **Click "Use" Button:** In the development credentials section below
4. **Click "Sign In":** The form will auto-fill with credentials
5. **Wait:** You'll be redirected to your dashboard

## 🔍 Troubleshooting

### Issue: "Failed to connect to server"
**Solution:** 
- Make sure backend is running on port 5000
- Check: `curl http://localhost:5000/health`
- Restart backend if needed

### Issue: "Login failed"  
**Solution:**
- Verify MongoDB is connected (check backend terminal)
- Ensure you're using the exact credentials above
- Check browser console for errors (F12)

### Issue: Page won't load
**Solution:**
- Make sure frontend is running on port 3001
- Clear browser cache (Ctrl+Shift+R)
- Check for TypeScript errors in VS Code

## 📝 Current Status Check

**Backend Running?** 
```powershell
curl http://localhost:5000/health
# Should return: {"status":"OK"}
```

**Frontend Running?**
- Open browser: http://localhost:3001
- Should show LearnAID homepage

**Both servers must be running simultaneously for login to work!**

## 🎯 Quick Test Login Flow

1. Open two PowerShell terminals
2. Terminal 1: `cd backend; node src/server.js` 
3. Terminal 2: `npm run dev`
4. Browser: Go to http://localhost:3001/login
5. Click "Admin" card at top
6. Click "Use" button in Admin credentials section
7. Click "Sign In"
8. You should land on Admin Dashboard

---

**Remember:** The credentials shown on the login page are for development only. Remove them before production deployment!
