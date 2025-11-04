const fs = require('fs');
const path = require('path');

// Simple JSON file database for development
class LocalDB {
    constructor() {
        this.dbPath = path.join(__dirname, 'data');
        this.ensureDataDir();
    }

    ensureDataDir() {
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
    }

    getFilePath(collection) {
        return path.join(this.dbPath, `${collection}.json`);
    }

    readCollection(collection) {
        const filePath = this.getFilePath(collection);
        if (!fs.existsSync(filePath)) {
            return [];
        }
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    writeCollection(collection, data) {
        const filePath = this.getFilePath(collection);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // User operations
    async findUser(query) {
        const users = this.readCollection('users');
        return users.find(user => {
            if (query.username) return user.username === query.username;
            if (query.email) return user.email === query.email;
            if (query._id) return user._id === query._id;
            if (query.$or) {
                return query.$or.some(condition => {
                    if (condition.username) return user.username === condition.username;
                    if (condition.email) return user.email === condition.email;
                    return false;
                });
            }
            return false;
        });
    }

    async createUser(userData) {
        const users = this.readCollection('users');
        const newUser = {
            _id: this.generateId(),
            ...userData,
            created_at: new Date(),
            posts_count: 0,
            monthly_posts_count: 0,
            last_reset_date: new Date(),
            xp: 0,
            level: 1,
            writing_streak: 0,
            longest_streak: 0,
            total_words: 0,
            achievements: [],
            unlocked_themes: ['default'],
            unlocked_features: []
        };
        users.push(newUser);
        this.writeCollection('users', users);
        return newUser;
    }

    async updateUser(userId, updates) {
        const users = this.readCollection('users');
        const userIndex = users.findIndex(user => user._id === userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            this.writeCollection('users', users);
            return users[userIndex];
        }
        return null;
    }

    // Post operations
    async findPosts(query) {
        const posts = this.readCollection('posts');
        if (query.user_id) {
            return posts.filter(post => post.user_id === query.user_id);
        }
        return posts;
    }

    async createPost(postData) {
        const posts = this.readCollection('posts');
        const newPost = {
            _id: this.generateId(),
            ...postData,
            created_at: new Date(),
            updated_at: new Date(),
            likes_count: 0,
            comments_count: 0,
            is_public: true,
            tags: postData.tags || []
        };
        posts.push(newPost);
        this.writeCollection('posts', posts);
        return newPost;
    }

    async updatePost(postId, userId, updates) {
        const posts = this.readCollection('posts');
        const postIndex = posts.findIndex(post => post._id === postId && post.user_id === userId);
        if (postIndex !== -1) {
            posts[postIndex] = { ...posts[postIndex], ...updates, updated_at: new Date() };
            this.writeCollection('posts', posts);
            return posts[postIndex];
        }
        return null;
    }

    async deletePost(postId, userId) {
        const posts = this.readCollection('posts');
        const postIndex = posts.findIndex(post => post._id === postId && post.user_id === userId);
        if (postIndex !== -1) {
            const deletedPost = posts[postIndex];
            posts.splice(postIndex, 1);
            this.writeCollection('posts', posts);
            return deletedPost;
        }
        return null;
    }
}

module.exports = new LocalDB();