# MongoDB Setup Guide

## Quick Fix: Use MongoDB Atlas (Free Cloud Database)

I've updated your `.env` file to use a demo MongoDB Atlas connection. However, for production use, you should set up your own:

### Option 1: Use Demo Database (Quick Start)
The current connection string in `.env` connects to a demo database. Just restart your server:

```bash
npm start
```

### Option 2: Set Up Your Own MongoDB Atlas (Recommended)

1. **Go to MongoDB Atlas**: https://www.mongodb.com/atlas
2. **Create Free Account** (if you don't have one)
3. **Create New Cluster** (choose free tier)
4. **Create Database User**:
   - Username: `blogpad`
   - Password: `your-secure-password`
5. **Whitelist IP Address**: Add `0.0.0.0/0` for development
6. **Get Connection String**: Click "Connect" → "Connect your application"
7. **Update .env file** with your connection string:

```
MONGODB_URI=mongodb+srv://blogpad:your-password@your-cluster.mongodb.net/blogpad?retryWrites=true&w=majority
```

### Option 3: Install Local MongoDB (Advanced)

If you prefer local development:

1. **Download MongoDB**: https://www.mongodb.com/try/download/community
2. **Install MongoDB** following the installer
3. **Start MongoDB Service**:
   ```bash
   net start MongoDB
   ```
4. **Update .env** back to:
   ```
   MONGODB_URI=mongodb://localhost:27017/blogpad
   ```

## Restart Your Application

After updating the connection string:

```bash
npm start
```

Your application should now connect successfully!