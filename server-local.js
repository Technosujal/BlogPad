const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const localDB = require('./db-local');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    }
}));

// Serve static files
app.use(express.static('public', {
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
};

// User registration
app.post('/auth/register', async (req, res) => {
    const { username, email, password, name } = req.body;
    
    if (!username || !email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    try {
        // Check if user already exists
        const existingUser = await localDB.findUser({ username });
        const existingEmail = await localDB.findUser({ email });
        
        if (existingUser || existingEmail) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create new user
        const newUser = await localDB.createUser({
            username,
            email,
            password_hash: passwordHash,
            name,
            subscription_plan: 'free'
        });
        
        // Set session
        const userData = {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            name: newUser.name,
            subscription_plan: newUser.subscription_plan
        };
        
        req.session.userId = newUser._id;
        req.session.user = userData;
        
        res.json({ 
            message: 'Registration successful', 
            user: userData 
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
        // Find user by username or email
        const user = await localDB.findUser({ username }) || await localDB.findUser({ email: username });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        
        // Set session
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            name: user.name
        };
        
        req.session.userId = user._id;
        req.session.user = userData;
        
        res.json({ 
            message: 'Login successful', 
            user: userData 
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// User logout
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// Get current user
app.get('/auth/user', async (req, res) => {
    if (req.session.userId && req.session.user) {
        try {
            const user = await localDB.findUser({ _id: req.session.userId });
            if (user) {
                const userData = {
                    ...req.session.user,
                    subscription_plan: user.subscription_plan || 'free',
                    posts_count: user.posts_count || 0,
                    monthly_posts_count: user.monthly_posts_count || 0,
                    xp: user.xp || 0,
                    level: user.level || 1,
                    writing_streak: user.writing_streak || 0,
                    achievements: user.achievements || []
                };
                res.json({ user: userData });
            } else {
                res.json({ user: null });
            }
        } catch (error) {
            res.json({ user: req.session.user });
        }
    } else {
        res.json({ user: null });
    }
});

// Blog API routes
app.get('/api/posts', requireAuth, async (req, res) => {
    try {
        const posts = await localDB.findPosts({ user_id: req.session.userId });
        // Sort by updated_at descending
        posts.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

app.post('/api/posts', requireAuth, async (req, res) => {
    const { title, content } = req.body;
    
    if (!title && !content) {
        return res.status(400).json({ error: 'Title or content is required' });
    }
    
    try {
        const postTitle = title || 'Untitled';
        const slug = generateSlug(postTitle) + '-' + Date.now();
        
        const newPost = await localDB.createPost({
            user_id: req.session.userId,
            title: postTitle,
            content: content || '',
            slug: slug,
            category: 'General'
        });
        
        // Update user stats
        const user = await localDB.findUser({ _id: req.session.userId });
        await localDB.updateUser(req.session.userId, {
            posts_count: (user.posts_count || 0) + 1,
            monthly_posts_count: (user.monthly_posts_count || 0) + 1
        });
        
        res.json({
            ...newPost,
            id: newPost._id
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Generate slug helper function
function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

app.put('/api/posts/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    
    try {
        const updatedPost = await localDB.updatePost(id, req.session.userId, {
            title,
            content
        });
        
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const deletedPost = await localDB.deletePost(id, req.session.userId);
        
        if (!deletedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Update user stats
        const user = await localDB.findUser({ _id: req.session.userId });
        if (user.posts_count > 0) {
            await localDB.updateUser(req.session.userId, {
                posts_count: user.posts_count - 1
            });
        }
        
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/landing.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Visit http://localhost:${port} to access the application`);
    console.log('Using local JSON file database for development');
});