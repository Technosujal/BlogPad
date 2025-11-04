const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const OpenAI = require('openai');
require('dotenv').config();

// OpenAI configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
});

const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogpad';
mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true },
    subscription_plan: { type: String, default: 'free' },
    subscription_expires_at: { type: Date },
    payment_status: { type: String, default: 'none' },
    billing_cycle: { type: String, default: 'monthly' },
    trial_used: { type: Boolean, default: false },
    posts_count: { type: Number, default: 0 },
    monthly_posts_count: { type: Number, default: 0 },
    last_reset_date: { type: Date, default: Date.now },
    // Gamification fields
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    writing_streak: { type: Number, default: 0 },
    longest_streak: { type: Number, default: 0 },
    last_post_date: { type: Date },
    last_login_date: { type: Date },
    total_words: { type: Number, default: 0 },
    achievements: [{ type: String }],
    unlocked_themes: { type: [String], default: ['default'] },
    unlocked_features: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now }
});

// Subscription limits and pricing
const SUBSCRIPTION_LIMITS = {
    free: { monthly_posts: 5, total_posts: 10 },
    premium: { monthly_posts: 100, total_posts: -1 },
    business: { monthly_posts: -1, total_posts: -1 }
};

const SUBSCRIPTION_PRICING = {
    premium: { monthly: 9, yearly: 90 },
    business: { monthly: 19, yearly: 190 }
};

// Blog Post Schema
const blogPostSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    category: { type: String, default: 'General' },
    tags: [{ type: String }],
    featured_image: { type: String },
    is_public: { type: Boolean, default: true },
    slug: { type: String, unique: true },
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Comment Schema
const commentSchema = new mongoose.Schema({
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Follow Schema
const followSchema = new mongoose.Schema({
    follower_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now }
});

// Like Schema
const likeSchema = new mongoose.Schema({
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'heart'], default: 'like' },
    created_at: { type: Date, default: Date.now }
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    category: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Achievement Schema
const achievementSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    achievement_id: { type: String, required: true },
    unlocked_at: { type: Date, default: Date.now }
});

// XP Activity Schema
const xpActivitySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activity_type: { type: String, required: true },
    xp_earned: { type: Number, required: true },
    description: { type: String },
    created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const BlogPost = mongoose.model('BlogPost', blogPostSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Follow = mongoose.model('Follow', followSchema);
const Like = mongoose.model('Like', likeSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const Achievement = mongoose.model('Achievement', achievementSchema);
const XPActivity = mongoose.model('XPActivity', xpActivitySchema);

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? [
        'https://blogpad-sujal.vercel.app',
        'https://techno-blogpad.vercel.app',
        'https://sujal-blogpad.vercel.app',
        'https://blogpad-2024.vercel.app',
        'https://my-blogpad-app.vercel.app'
    ] : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

// Serve static files with no-cache headers
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

// Check usage limits
const checkUsageLimits = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Reset monthly count if new month
        const now = new Date();
        const lastReset = new Date(user.last_reset_date);
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            user.monthly_posts_count = 0;
            user.last_reset_date = now;
            await user.save();
        }

        const limits = SUBSCRIPTION_LIMITS[user.subscription_plan];
        
        // Check monthly limit
        if (limits.monthly_posts !== -1 && user.monthly_posts_count >= limits.monthly_posts) {
            return res.status(403).json({ 
                error: 'Monthly post limit reached',
                limit: limits.monthly_posts,
                current: user.monthly_posts_count,
                plan: user.subscription_plan
            });
        }

        // Check total limit
        if (limits.total_posts !== -1 && user.posts_count >= limits.total_posts) {
            return res.status(403).json({ 
                error: 'Total post limit reached',
                limit: limits.total_posts,
                current: user.posts_count,
                plan: user.subscription_plan
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Usage check error:', error);
        res.status(500).json({ error: 'Failed to check usage limits' });
    }
};

// User registration
app.post('/auth/register', async (req, res) => {
    console.log('Registration attempt:', { body: req.body, env: process.env.NODE_ENV });
    const { username, email, password, name, plan = 'free', billing_cycle = 'monthly' } = req.body;
    
    if (!username || !email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    try {
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Validate subscription plan
        const validPlans = ['free', 'premium', 'business'];
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ error: 'Invalid subscription plan' });
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Calculate trial expiry for paid plans (7 days)
        let subscriptionExpiresAt = null;
        if (plan !== 'free') {
            subscriptionExpiresAt = new Date();
            subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + 7);
        }
        
        // Create new user
        const newUser = new User({
            username,
            email,
            password_hash: passwordHash,
            name,
            subscription_plan: plan,
            subscription_expires_at: subscriptionExpiresAt
        });
        
        await newUser.save();
        
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
        res.status(500).json({ 
            error: 'Registration failed', 
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
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
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });
        
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

// Get current user with usage stats
app.get('/auth/user', async (req, res) => {
    if (req.session.userId && req.session.user) {
        try {
            const user = await User.findById(req.session.userId);
            if (user) {
                // Check for daily login bonus
                const today = new Date().toDateString();
                const lastLogin = user.last_login_date ? new Date(user.last_login_date).toDateString() : null;
                
                if (lastLogin !== today) {
                    await awardXP(user._id, 'daily_login', 'Daily login bonus');
                    user.last_login_date = new Date();
                    await user.save();
                }
                
                // Refresh user data after potential XP award
                const updatedUser = await User.findById(req.session.userId);
                
                const limits = SUBSCRIPTION_LIMITS[updatedUser.subscription_plan];
                const userData = {
                    ...req.session.user,
                    subscription_plan: updatedUser.subscription_plan,
                    payment_status: updatedUser.payment_status,
                    billing_cycle: updatedUser.billing_cycle,
                    trial_used: updatedUser.trial_used,
                    posts_count: updatedUser.posts_count,
                    monthly_posts_count: updatedUser.monthly_posts_count,
                    limits: limits,
                    subscription_expires_at: updatedUser.subscription_expires_at,
                    // Gamification data
                    xp: updatedUser.xp || 0,
                    level: updatedUser.level || 1,
                    writing_streak: updatedUser.writing_streak || 0,
                    longest_streak: updatedUser.longest_streak || 0,
                    total_words: updatedUser.total_words || 0,
                    achievements: updatedUser.achievements || [],
                    unlocked_themes: updatedUser.unlocked_themes || ['default'],
                    unlocked_features: updatedUser.unlocked_features || []
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

// Get usage statistics
app.get('/api/usage', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const limits = SUBSCRIPTION_LIMITS[user.subscription_plan];
        
        res.json({
            subscription_plan: user.subscription_plan,
            posts_count: user.posts_count,
            monthly_posts_count: user.monthly_posts_count,
            limits: limits,
            subscription_expires_at: user.subscription_expires_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get usage stats' });
    }
});

// Start subscription (trial or payment)
app.post('/api/start-subscription', requireAuth, async (req, res) => {
    const { plan, billing_cycle = 'monthly' } = req.body;
    
    if (!['premium', 'business'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid subscription plan' });
    }
    
    try {
        const user = await User.findById(req.session.userId);
        
        // Check if user can start trial
        if (!user.trial_used && user.subscription_plan === 'free') {
            // Start free trial
            user.subscription_plan = plan;
            user.billing_cycle = billing_cycle;
            user.payment_status = 'trial';
            user.trial_used = true;
            
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 7);
            user.subscription_expires_at = trialEnd;
            
            await user.save();
            
            res.json({ 
                message: 'Free trial started successfully',
                plan: plan,
                trial_ends: trialEnd,
                payment_required: false
            });
        } else {
            // Require payment
            const price = SUBSCRIPTION_PRICING[plan][billing_cycle];
            
            res.json({
                message: 'Payment required',
                plan: plan,
                billing_cycle: billing_cycle,
                price: price,
                payment_required: true,
                payment_url: `/payment?plan=${plan}&billing=${billing_cycle}&price=${price}`
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to start subscription' });
    }
});

// Process payment
app.post('/api/process-payment', requireAuth, async (req, res) => {
    const { plan, billing_cycle, payment_method, card_details } = req.body;
    
    try {
        const user = await User.findById(req.session.userId);
        
        // Simulate payment processing (replace with real payment gateway)
        const paymentSuccess = simulatePayment(card_details);
        
        if (paymentSuccess) {
            user.subscription_plan = plan;
            user.billing_cycle = billing_cycle;
            user.payment_status = 'paid';
            
            // Set subscription expiry
            const expiryDate = new Date();
            if (billing_cycle === 'yearly') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
            }
            user.subscription_expires_at = expiryDate;
            
            await user.save();
            
            res.json({
                success: true,
                message: 'Payment successful! Subscription activated.',
                plan: plan,
                expires_at: expiryDate
            });
        } else {
            user.payment_status = 'failed';
            await user.save();
            
            res.status(400).json({ error: 'Payment failed. Please try again.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Payment processing failed' });
    }
});

// Cancel subscription
app.post('/api/cancel-subscription', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        
        if (user.subscription_plan === 'free') {
            return res.status(400).json({ error: 'No active subscription to cancel' });
        }
        
        // Keep access until expiry, then downgrade
        user.payment_status = 'cancelled';
        await user.save();
        
        res.json({ 
            message: 'Subscription cancelled. Access will continue until expiry date.',
            expires_at: user.subscription_expires_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Gamification System
const ACHIEVEMENTS = {
    first_post: { name: 'First Steps', description: 'Published your first post', xp: 50, icon: 'fas fa-pen-fancy' },
    word_warrior: { name: 'Word Warrior', description: 'Wrote 1000+ words in a single post', xp: 100, icon: 'fas fa-sword' },
    streak_7: { name: 'Week Warrior', description: 'Maintained 7-day writing streak', xp: 200, icon: 'fas fa-fire' },
    streak_30: { name: 'Monthly Master', description: 'Maintained 30-day writing streak', xp: 500, icon: 'fas fa-crown' },
    posts_10: { name: 'Prolific Writer', description: 'Published 10 posts', xp: 150, icon: 'fas fa-star' },
    posts_50: { name: 'Blog Master', description: 'Published 50 posts', xp: 300, icon: 'fas fa-trophy' },
    posts_100: { name: 'Legend', description: 'Published 100 posts', xp: 1000, icon: 'fas fa-crown' },
    social_butterfly: { name: 'Social Butterfly', description: 'Received 50 likes', xp: 100, icon: 'fas fa-heart' },
    engagement_king: { name: 'Engagement King', description: 'Received 100 comments', xp: 200, icon: 'fas fa-comments' }
};

const XP_REWARDS = {
    post_create: 25,
    post_update: 10,
    daily_login: 5,
    streak_bonus: 15,
    comment_received: 5,
    like_received: 2
};

function calculateLevel(xp) {
    return Math.floor(xp / 100) + 1;
}

function getXPForNextLevel(level) {
    return level * 100;
}

async function awardXP(userId, activityType, description = '') {
    try {
        const user = await User.findById(userId);
        if (!user) return;
        
        const xpEarned = XP_REWARDS[activityType] || 0;
        const oldLevel = user.level;
        
        user.xp += xpEarned;
        user.level = calculateLevel(user.xp);
        
        await user.save();
        
        // Log XP activity
        await new XPActivity({
            user_id: userId,
            activity_type: activityType,
            xp_earned: xpEarned,
            description: description
        }).save();
        
        // Check for level up achievements
        if (user.level > oldLevel) {
            await checkAchievements(userId);
        }
        
        return { xpEarned, newXP: user.xp, newLevel: user.level, leveledUp: user.level > oldLevel };
    } catch (error) {
        console.error('XP award error:', error);
    }
}

async function checkAchievements(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) return;
        
        const posts = await BlogPost.find({ user_id: userId });
        const totalLikes = await Like.countDocuments({ post_id: { $in: posts.map(p => p._id) } });
        const totalComments = await Comment.countDocuments({ post_id: { $in: posts.map(p => p._id) } });
        
        const newAchievements = [];
        
        // Check various achievements
        if (user.posts_count >= 1 && !user.achievements.includes('first_post')) {
            newAchievements.push('first_post');
        }
        if (user.posts_count >= 10 && !user.achievements.includes('posts_10')) {
            newAchievements.push('posts_10');
        }
        if (user.posts_count >= 50 && !user.achievements.includes('posts_50')) {
            newAchievements.push('posts_50');
        }
        if (user.posts_count >= 100 && !user.achievements.includes('posts_100')) {
            newAchievements.push('posts_100');
        }
        if (user.writing_streak >= 7 && !user.achievements.includes('streak_7')) {
            newAchievements.push('streak_7');
        }
        if (user.writing_streak >= 30 && !user.achievements.includes('streak_30')) {
            newAchievements.push('streak_30');
        }
        if (totalLikes >= 50 && !user.achievements.includes('social_butterfly')) {
            newAchievements.push('social_butterfly');
        }
        if (totalComments >= 100 && !user.achievements.includes('engagement_king')) {
            newAchievements.push('engagement_king');
        }
        
        // Award achievements
        for (const achievementId of newAchievements) {
            user.achievements.push(achievementId);
            user.xp += ACHIEVEMENTS[achievementId].xp;
            
            await new Achievement({
                user_id: userId,
                achievement_id: achievementId
            }).save();
        }
        
        if (newAchievements.length > 0) {
            user.level = calculateLevel(user.xp);
            await user.save();
        }
        
        return newAchievements;
    } catch (error) {
        console.error('Achievement check error:', error);
        return [];
    }
}

async function updateWritingStreak(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastPostDate = user.last_post_date ? new Date(user.last_post_date) : null;
        
        if (lastPostDate) {
            lastPostDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today - lastPostDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                // Consecutive day
                user.writing_streak += 1;
                if (user.writing_streak > user.longest_streak) {
                    user.longest_streak = user.writing_streak;
                }
                await awardXP(userId, 'streak_bonus', `${user.writing_streak} day streak`);
            } else if (daysDiff > 1) {
                // Streak broken
                user.writing_streak = 1;
            }
            // Same day posts don't affect streak
        } else {
            // First post ever
            user.writing_streak = 1;
            user.longest_streak = 1;
        }
        
        user.last_post_date = new Date();
        await user.save();
        
        return user.writing_streak;
    } catch (error) {
        console.error('Streak update error:', error);
        return 0;
    }
}

// Simulate payment processing (replace with real gateway like Stripe)
function simulatePayment(cardDetails) {
    // Simple validation for demo
    if (!cardDetails || !cardDetails.number || !cardDetails.cvv || !cardDetails.expiry) {
        return false;
    }
    
    // Simulate success/failure (90% success rate)
    return Math.random() > 0.1;
}

// Blog API routes
app.get('/api/posts', requireAuth, async (req, res) => {
    try {
        const posts = await BlogPost.find({ user_id: req.session.userId })
            .sort({ updated_at: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

app.post('/api/posts', requireAuth, checkUsageLimits, async (req, res) => {
    const { title, content } = req.body;
    
    if (!title && !content) {
        return res.status(400).json({ error: 'Title or content is required' });
    }
    
    try {
        const postTitle = title || 'Untitled';
        const slug = generateSlug(postTitle) + '-' + Date.now();
        const wordCount = (content || '').split(/\s+/).filter(word => word.length > 0).length;
        
        const newPost = new BlogPost({
            user_id: req.session.userId,
            title: postTitle,
            content: content || '',
            slug: slug
        });
        
        await newPost.save();
        
        // Update user stats
        req.user.posts_count += 1;
        req.user.monthly_posts_count += 1;
        req.user.total_words += wordCount;
        await req.user.save();
        
        // Gamification: Award XP and update streak
        const xpResult = await awardXP(req.session.userId, 'post_create', `Created post: ${postTitle}`);
        const streak = await updateWritingStreak(req.session.userId);
        
        // Check for word count achievement
        if (wordCount >= 1000) {
            const user = await User.findById(req.session.userId);
            if (!user.achievements.includes('word_warrior')) {
                user.achievements.push('word_warrior');
                user.xp += ACHIEVEMENTS.word_warrior.xp;
                user.level = calculateLevel(user.xp);
                await user.save();
                
                await new Achievement({
                    user_id: req.session.userId,
                    achievement_id: 'word_warrior'
                }).save();
            }
        }
        
        await checkAchievements(req.session.userId);
        
        res.json({
            ...newPost.toObject(),
            id: newPost._id,
            gamification: {
                xpEarned: xpResult?.xpEarned || 0,
                newXP: xpResult?.newXP || 0,
                newLevel: xpResult?.newLevel || 1,
                leveledUp: xpResult?.leveledUp || false,
                streak: streak
            }
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
        const oldPost = await BlogPost.findOne({ _id: id, user_id: req.session.userId });
        if (!oldPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const oldWordCount = (oldPost.content || '').split(/\s+/).filter(word => word.length > 0).length;
        const newWordCount = (content || '').split(/\s+/).filter(word => word.length > 0).length;
        const wordDiff = newWordCount - oldWordCount;
        
        const updatedPost = await BlogPost.findOneAndUpdate(
            { _id: id, user_id: req.session.userId },
            { title, content, updated_at: new Date() },
            { new: true }
        );
        
        // Update user word count
        if (wordDiff !== 0) {
            await User.findByIdAndUpdate(req.session.userId, {
                $inc: { total_words: wordDiff }
            });
        }
        
        // Award XP for updating
        const xpResult = await awardXP(req.session.userId, 'post_update', `Updated post: ${title}`);
        
        res.json({
            ...updatedPost.toObject(),
            gamification: {
                xpEarned: xpResult?.xpEarned || 0,
                newXP: xpResult?.newXP || 0
            }
        });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const deletedPost = await BlogPost.findOneAndDelete({
            _id: id,
            user_id: req.session.userId
        });
        
        if (!deletedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const wordCount = (deletedPost.content || '').split(/\s+/).filter(word => word.length > 0).length;
        
        // Update user stats
        const user = await User.findById(req.session.userId);
        if (user.posts_count > 0) {
            user.posts_count -= 1;
        }
        if (user.total_words >= wordCount) {
            user.total_words -= wordCount;
        }
        await user.save();
        
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Social Features API

// Comments
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post_id: req.params.id })
            .populate('user_id', 'username name')
            .sort({ created_at: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
    try {
        const comment = new Comment({
            post_id: req.params.id,
            user_id: req.session.userId,
            content: req.body.content
        });
        await comment.save();
        await comment.populate('user_id', 'username name');
        
        // Award XP to post author for receiving comment
        const post = await BlogPost.findById(req.params.id);
        if (post && post.user_id.toString() !== req.session.userId) {
            await awardXP(post.user_id, 'comment_received', `Comment on "${post.title}"`);
        }
        
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Likes
app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
    try {
        const existing = await Like.findOne({ post_id: req.params.id, user_id: req.session.userId });
        if (existing) {
            await Like.deleteOne({ _id: existing._id });
            res.json({ liked: false });
        } else {
            await new Like({ post_id: req.params.id, user_id: req.session.userId, type: req.body.type || 'like' }).save();
            
            // Award XP to post author for receiving like
            const post = await BlogPost.findById(req.params.id);
            if (post && post.user_id.toString() !== req.session.userId) {
                await awardXP(post.user_id, 'like_received', `Like on "${post.title}"`);
            }
            
            res.json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

app.get('/api/posts/:id/likes', async (req, res) => {
    try {
        const count = await Like.countDocuments({ post_id: req.params.id });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get likes' });
    }
});

// Follow System
app.post('/api/users/:id/follow', requireAuth, async (req, res) => {
    try {
        const existing = await Follow.findOne({ follower_id: req.session.userId, following_id: req.params.id });
        if (existing) {
            await Follow.deleteOne({ _id: existing._id });
            res.json({ following: false });
        } else {
            await new Follow({ follower_id: req.session.userId, following_id: req.params.id }).save();
            res.json({ following: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle follow' });
    }
});

app.get('/api/users/:id/followers', async (req, res) => {
    try {
        const count = await Follow.countDocuments({ following_id: req.params.id });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get followers' });
    }
});

// Search bloggers API
app.get('/api/search/bloggers', async (req, res) => {
    try {
        const { query, sort = 'recent', limit = 20 } = req.query;
        
        let searchCriteria = {};
        if (query && query.trim()) {
            searchCriteria = {
                $or: [
                    { name: { $regex: query.trim(), $options: 'i' } },
                    { username: { $regex: query.trim(), $options: 'i' } }
                ]
            };
        }
        
        let sortCriteria = {};
        switch (sort) {
            case 'popular':
                sortCriteria = { posts_count: -1 };
                break;
            case 'posts':
                sortCriteria = { posts_count: -1 };
                break;
            case 'followers':
                sortCriteria = { posts_count: -1 };
                break;
            default:
                sortCriteria = { created_at: -1 };
        }
        
        const bloggers = await User.find(searchCriteria)
            .select('username name posts_count created_at')
            .sort(sortCriteria)
            .limit(parseInt(limit));
        
        const bloggersWithStats = await Promise.all(
            bloggers.map(async (blogger) => {
                const recentPosts = await BlogPost.find({ 
                    user_id: blogger._id 
                })
                .select('title created_at')
                .sort({ created_at: -1 })
                .limit(3);
                
                return {
                    id: blogger._id,
                    username: blogger.username,
                    name: blogger.name,
                    posts_count: blogger.posts_count,
                    member_since: blogger.created_at,
                    recent_posts: recentPosts,
                    avatar_initial: blogger.name.charAt(0).toUpperCase()
                };
            })
        );
        
        console.log(`Found ${bloggers.length} bloggers for query: "${query}"`); // Debug log
        
        res.json({
            bloggers: bloggersWithStats,
            total: bloggersWithStats.length
        });
    } catch (error) {
        console.error('Blogger search error:', error);
        res.status(500).json({ error: 'Failed to search bloggers' });
    }
});

// Get blogger profile
app.get('/api/bloggers/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const blogger = await User.findOne({ username })
            .select('username name posts_count created_at');
        
        if (!blogger) {
            return res.status(404).json({ error: 'Blogger not found' });
        }
        
        // Show all posts if it's the current user, only public posts for others
        const isOwnProfile = req.session.userId && req.session.userId.toString() === blogger._id.toString();
        const postQuery = { user_id: blogger._id };
        if (!isOwnProfile) {
            postQuery.is_public = true;
        }
        
        const posts = await BlogPost.find(postQuery)
            .select('title content created_at category tags')
            .sort({ created_at: -1 })
            .limit(10);
        
        res.json({
            blogger: {
                id: blogger._id,
                username: blogger.username,
                name: blogger.name,
                posts_count: blogger.posts_count,
                member_since: blogger.created_at,
                avatar_initial: blogger.name.charAt(0).toUpperCase()
            },
            posts: posts
        });
    } catch (error) {
        console.error('Get blogger error:', error);
        res.status(500).json({ error: 'Failed to get blogger profile' });
    }
});

// Feedback API
app.post('/api/feedback', requireAuth, async (req, res) => {
    try {
        const { rating, category, title, message } = req.body;
        
        const feedback = new Feedback({
            user_id: req.session.userId,
            rating,
            category,
            title,
            message
        });
        
        await feedback.save();
        res.json({ success: true, message: 'Feedback saved successfully' });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

app.get('/api/feedback', async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .populate('user_id', 'name')
            .sort({ created_at: -1 })
            .limit(10);
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load feedback' });
    }
});

// AI Writing Assistant
app.post('/api/ai-assist', requireAuth, async (req, res) => {
    const { text, action } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
        return res.status(503).json({ 
            error: 'AI service not configured. Please add your OpenAI API key to the .env file.' 
        });
    }
    
    try {
        let prompt = '';
        
        switch (action) {
            case 'grammar':
                prompt = `Please check the following text for grammar, spelling, and punctuation errors. Return only the corrected text without explanations:\n\n${text}`;
                break;
            case 'improve':
                prompt = `Please improve the following text to make it more engaging, clear, and well-written while maintaining the original meaning:\n\n${text}`;
                break;
            case 'suggestions':
                prompt = `Please provide 3 brief suggestions to improve this text (grammar, clarity, style):\n\n${text}`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.3
        });
        
        const result = completion.choices[0].message.content.trim();
        
        res.json({ result, action });
    } catch (error) {
        console.error('AI assist error:', error);
        if (error.code === 'insufficient_quota') {
            res.status(503).json({ error: 'AI quota exceeded. Please check your OpenAI billing at platform.openai.com' });
        } else if (error.status === 401) {
            res.status(503).json({ error: 'Invalid API key. Please check your OpenAI account.' });
        } else {
            res.status(500).json({ error: 'AI assistance failed. Please try again.' });
        }
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

app.get('/payment', (req, res) => {
    res.sendFile(__dirname + '/public/payment.html');
});

// Public blog routes
app.get('/blog/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).send('Blog not found');
        }
        
        const posts = await BlogPost.find({ user_id: user._id, is_public: true })
            .sort({ created_at: -1 });
        
        const blogHtml = generatePublicBlog(user, posts);
        res.send(blogHtml);
    } catch (error) {
        res.status(500).send('Error loading blog');
    }
});

app.get('/blog/:username/:slug', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).send('Blog not found');
        }
        
        const post = await BlogPost.findOne({ 
            user_id: user._id, 
            slug: req.params.slug, 
            is_public: true 
        });
        
        if (!post) {
            return res.status(404).send('Post not found');
        }
        
        const postHtml = generatePublicPost(user, post);
        res.send(postHtml);
    } catch (error) {
        res.status(500).send('Error loading post');
    }
});

// Generate public blog HTML
function generatePublicBlog(user, posts) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${user.name}'s Blog</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 3rem; }
                .blog-title { font-size: 2.5rem; margin-bottom: 0.5rem; }
                .blog-subtitle { color: #666; }
                .post { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; }
                .post-title { font-size: 1.8rem; margin-bottom: 0.5rem; }
                .post-title a { text-decoration: none; color: #333; }
                .post-meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
                .post-excerpt { margin-bottom: 1rem; }
                .read-more { color: #667eea; text-decoration: none; }
                .tags { margin-top: 1rem; }
                .tag { background: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.8rem; margin-right: 0.5rem; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="blog-title">${user.name}'s Blog</h1>
                <p class="blog-subtitle">@${user.username}</p>
            </div>
            
            ${posts.map(post => `
                <article class="post">
                    <h2 class="post-title">
                        <a href="/blog/${user.username}/${post.slug}">${post.title}</a>
                    </h2>
                    <div class="post-meta">
                        ${new Date(post.created_at).toLocaleDateString()} • ${post.category}
                    </div>
                    <div class="post-excerpt">
                        ${post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                    </div>
                    <a href="/blog/${user.username}/${post.slug}" class="read-more">Read more →</a>
                    <div class="tags">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </article>
            `).join('')}
        </body>
        </html>
    `;
}

// Generate public post HTML
function generatePublicPost(user, post) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${post.title} - ${user.name}'s Blog</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 2rem; }
                .blog-title { font-size: 1.5rem; margin-bottom: 0.5rem; }
                .post-title { font-size: 2.5rem; margin-bottom: 1rem; }
                .post-meta { color: #666; margin-bottom: 2rem; text-align: center; }
                .post-content { font-size: 1.1rem; margin-bottom: 2rem; }
                .social-actions { display: flex; gap: 1rem; justify-content: center; margin: 2rem 0; padding: 1rem; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
                .social-btn { padding: 0.5rem 1rem; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
                .like-btn { background: #ff6b6b; color: white; }
                .share-btn { background: #4ecdc4; color: white; }
                .twitter-btn { background: #1da1f2; color: white; }
                .facebook-btn { background: #4267b2; color: white; }
                .linkedin-btn { background: #0077b5; color: white; }
                .comments { margin-top: 2rem; }
                .comment { background: #f9f9f9; padding: 1rem; margin-bottom: 1rem; border-radius: 5px; }
                .comment-author { font-weight: bold; margin-bottom: 0.5rem; }
                .comment-form { margin-top: 1rem; }
                .comment-form textarea { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 5px; }
                .comment-form button { background: #667eea; color: white; padding: 0.5rem 1rem; border: none; border-radius: 5px; cursor: pointer; margin-top: 0.5rem; }
                .tags { margin-top: 2rem; }
                .tag { background: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.8rem; margin-right: 0.5rem; }
                .back-link { margin-top: 2rem; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="blog-title">
                    <a href="/blog/${user.username}" style="text-decoration: none; color: #333;">${user.name}'s Blog</a>
                </div>
            </div>
            
            <article>
                <h1 class="post-title">${post.title}</h1>
                <div class="post-meta">
                    ${new Date(post.created_at).toLocaleDateString()} • ${post.category}
                </div>
                <div class="post-content">
                    ${post.content}
                </div>
                <div class="tags">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </article>
            
            <div class="social-actions">
                <button class="social-btn like-btn" onclick="toggleLike('${post._id}')">
                    ❤️ <span id="like-count">0</span>
                </button>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent('http://localhost:5000/blog/' + user.username + '/' + post.slug)}" class="social-btn twitter-btn" target="_blank">
                    🐦 Twitter
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('http://localhost:5000/blog/' + user.username + '/' + post.slug)}" class="social-btn facebook-btn" target="_blank">
                    📘 Facebook
                </a>
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('http://localhost:5000/blog/' + user.username + '/' + post.slug)}" class="social-btn linkedin-btn" target="_blank">
                    💼 LinkedIn
                </a>
            </div>
            
            <div class="comments">
                <h3>💬 Comments</h3>
                <div id="comments-list"></div>
                <div class="comment-form">
                    <textarea id="comment-text" placeholder="Add a comment..." rows="3"></textarea>
                    <button onclick="addComment('${post._id}')">Post Comment</button>
                </div>
            </div>
            
            <div class="back-link">
                <a href="/blog/${user.username}">← Back to blog</a>
            </div>
            
            <script>
                async function toggleLike(postId) {
                    try {
                        const response = await fetch('/api/posts/' + postId + '/like', { method: 'POST' });
                        const data = await response.json();
                        loadLikes(postId);
                    } catch (error) {
                        alert('Please log in to like posts');
                    }
                }
                
                async function loadLikes(postId) {
                    try {
                        const response = await fetch('/api/posts/' + postId + '/likes');
                        const data = await response.json();
                        document.getElementById('like-count').textContent = data.count;
                    } catch (error) {
                        console.error('Failed to load likes');
                    }
                }
                
                async function loadComments(postId) {
                    try {
                        const response = await fetch('/api/posts/' + postId + '/comments');
                        const comments = await response.json();
                        const list = document.getElementById('comments-list');
                        list.innerHTML = comments.map(comment => 
                            '<div class="comment"><div class="comment-author">' + comment.user_id.name + '</div>' + comment.content + '</div>'
                        ).join('');
                    } catch (error) {
                        console.error('Failed to load comments');
                    }
                }
                
                async function addComment(postId) {
                    const text = document.getElementById('comment-text').value;
                    if (!text.trim()) return;
                    
                    try {
                        const response = await fetch('/api/posts/' + postId + '/comments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: text })
                        });
                        
                        if (response.ok) {
                            document.getElementById('comment-text').value = '';
                            loadComments(postId);
                        } else {
                            alert('Please log in to comment');
                        }
                    } catch (error) {
                        alert('Please log in to comment');
                    }
                }
                
                // Load initial data
                loadLikes('${post._id}');
                loadComments('${post._id}');
            </script>
        </body>
        </html>
    `;
}

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        res.json({ 
            success: isConnected, 
            status: mongoose.connection.readyState,
            time: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Gamification API Routes

// Get user gamification stats
app.get('/api/gamification/stats', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const xp = user.xp || 0;
        const level = user.level || 1;
        const xpForNext = level * 100;
        const xpProgress = xp - ((level - 1) * 100);
        
        res.json({
            xp: xp,
            level: level,
            xpForNext: xpForNext,
            xpProgress: Math.max(0, xpProgress),
            writing_streak: user.writing_streak || 0,
            longest_streak: user.longest_streak || 0,
            total_words: user.total_words || 0,
            achievements: user.achievements || [],
            unlocked_themes: user.unlocked_themes || ['default'],
            unlocked_features: user.unlocked_features || []
        });
    } catch (error) {
        console.error('Gamification stats error:', error);
        res.status(500).json({ error: 'Failed to get gamification stats' });
    }
});

// Get leaderboard
app.get('/api/gamification/leaderboard', async (req, res) => {
    try {
        const { type = 'xp', limit = 10 } = req.query;
        
        let sortField = 'xp';
        if (type === 'streak') sortField = 'writing_streak';
        if (type === 'posts') sortField = 'posts_count';
        if (type === 'words') sortField = 'total_words';
        
        const users = await User.find({})
            .select('username name xp level writing_streak posts_count total_words')
            .sort({ [sortField]: -1 })
            .limit(parseInt(limit));
        
        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            username: user.username,
            name: user.name,
            xp: user.xp,
            level: user.level,
            writing_streak: user.writing_streak,
            posts_count: user.posts_count,
            total_words: user.total_words
        }));
        
        res.json({ leaderboard, type });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// Get achievements list
app.get('/api/gamification/achievements', (req, res) => {
    res.json({ achievements: ACHIEVEMENTS });
});

// Get recent XP activities
app.get('/api/gamification/activities', requireAuth, async (req, res) => {
    try {
        const activities = await XPActivity.find({ user_id: req.session.userId })
            .sort({ created_at: -1 })
            .limit(20);
        
        res.json({ activities });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get activities' });
    }
});

// Unlock theme
app.post('/api/gamification/unlock-theme', requireAuth, async (req, res) => {
    try {
        const { theme } = req.body;
        const user = await User.findById(req.session.userId);
        
        // Check if user has enough XP or achievements to unlock theme
        const themeRequirements = {
            'dark': { xp: 100 },
            'neon': { xp: 500 },
            'vintage': { achievement: 'posts_10' },
            'minimal': { xp: 200 }
        };
        
        const requirement = themeRequirements[theme];
        if (!requirement) {
            return res.status(400).json({ error: 'Invalid theme' });
        }
        
        let canUnlock = false;
        if (requirement.xp && user.xp >= requirement.xp) canUnlock = true;
        if (requirement.achievement && user.achievements.includes(requirement.achievement)) canUnlock = true;
        
        if (!canUnlock) {
            return res.status(403).json({ error: 'Requirements not met' });
        }
        
        if (!user.unlocked_themes.includes(theme)) {
            user.unlocked_themes.push(theme);
            await user.save();
        }
        
        res.json({ message: 'Theme unlocked successfully', theme });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unlock theme' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Visit http://localhost:${port} to access the application`);
});