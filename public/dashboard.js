let currentPostId = null;
let posts = [];
let currentUser = null;
let currentSection = 'home';

// DOM elements
const menuItems = document.querySelectorAll('.menu-item');
const contentSections = document.querySelectorAll('.content-section');
const darkModeToggle = document.getElementById('darkModeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.querySelector('.sidebar');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadPosts();
    initializeEventListeners();
    await refreshAllStats();
    loadUserProfile();
    initializeSettings();
    initWordCount();
    initRichEditor();
    loadSavedAvatar();
    setupAutoSave();
    initializeDarkMode();
    initAIAssistant();
    initTypingPractice();
    initializeFeedback();
    initializeDiscover();
    initializeGamification();
});

// Refresh all stats after data is loaded
async function refreshAllStats() {
    loadDashboardStats();
    loadRecentPosts();
    loadEnhancedStats();
}

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/auth/user', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.user) {
            window.location.href = '/';
            return;
        }
        
        currentUser = data.user;
        updateUserInfo();
        updateUsageDisplay();
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = '/';
    }
}

// Update user info in sidebar
function updateUserInfo() {
    const sidebarUserName = document.getElementById('sidebarUserName');
    if (sidebarUserName && currentUser) {
        sidebarUserName.textContent = currentUser.name;
    }
}

// Update usage display
function updateUsageDisplay() {
    if (!currentUser || !currentUser.limits) return;
    
    const usageInfo = document.getElementById('usageInfo');
    if (usageInfo) {
        const { monthly_posts_count, posts_count, limits, subscription_plan } = currentUser;
        const monthlyLimit = limits.monthly_posts === -1 ? '∞' : limits.monthly_posts;
        const totalLimit = limits.total_posts === -1 ? '∞' : limits.total_posts;
        
        usageInfo.innerHTML = `
            <div class="usage-card">
                <h4>Plan: ${subscription_plan.toUpperCase()}</h4>
                <div class="usage-stats">
                    <div class="usage-item">
                        <span>This Month:</span>
                        <span>${monthly_posts_count}/${monthlyLimit}</span>
                    </div>
                    <div class="usage-item">
                        <span>Total Posts:</span>
                        <span>${posts_count}/${totalLimit}</span>
                    </div>
                </div>
                ${subscription_plan === 'free' ? '<button onclick="showUpgradeModal()" class="upgrade-btn">Upgrade Plan</button>' : ''}
                ${subscription_plan !== 'free' ? `<button onclick="manageSubscription()" class="manage-btn">Manage Subscription</button>` : ''}
                ${subscription_plan !== 'free' && currentUser.payment_status === 'trial' ? '<div class="trial-notice">Free trial active</div>' : ''}
            </div>
        `;
    }
}

// Show upgrade modal
function showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const canTrial = currentUser && !currentUser.trial_used && currentUser.subscription_plan === 'free';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Choose Your Plan</h3>
            <div class="billing-toggle">
                <label class="toggle-label">
                    <input type="radio" name="billing" value="monthly" checked onchange="updatePricing()"> Monthly
                </label>
                <label class="toggle-label">
                    <input type="radio" name="billing" value="yearly" onchange="updatePricing()"> Yearly <span class="discount">Save 17%</span>
                </label>
            </div>
            <div class="plans">
                <div class="plan-card" data-plan="premium">
                    <h4>Premium</h4>
                    <p class="plan-price">$<span class="price-amount">9</span>/<span class="price-period">month</span></p>
                    <ul>
                        <li>100 posts per month</li>
                        <li>Unlimited total posts</li>
                        <li>Priority support</li>
                        <li>Advanced analytics</li>
                    </ul>
                    <button onclick="selectPlan('premium')" class="upgrade-plan-btn">
                        ${canTrial ? 'Start Free Trial' : 'Subscribe Now'}
                    </button>
                </div>
                <div class="plan-card" data-plan="business">
                    <h4>Business</h4>
                    <p class="plan-price">$<span class="price-amount">19</span>/<span class="price-period">month</span></p>
                    <ul>
                        <li>Unlimited posts</li>
                        <li>Multiple authors</li>
                        <li>White-label options</li>
                        <li>24/7 phone support</li>
                    </ul>
                    <button onclick="selectPlan('business')" class="upgrade-plan-btn">
                        ${canTrial ? 'Start Free Trial' : 'Subscribe Now'}
                    </button>
                </div>
            </div>
            <button onclick="closeModal()" class="close-modal">×</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Update pricing display
function updatePricing() {
    const billingCycle = document.querySelector('input[name="billing"]:checked').value;
    const premiumCard = document.querySelector('[data-plan="premium"]');
    const businessCard = document.querySelector('[data-plan="business"]');
    
    if (billingCycle === 'yearly') {
        premiumCard.querySelector('.price-amount').textContent = '90';
        premiumCard.querySelector('.price-period').textContent = 'year';
        businessCard.querySelector('.price-amount').textContent = '190';
        businessCard.querySelector('.price-period').textContent = 'year';
    } else {
        premiumCard.querySelector('.price-amount').textContent = '9';
        premiumCard.querySelector('.price-period').textContent = 'month';
        businessCard.querySelector('.price-amount').textContent = '19';
        businessCard.querySelector('.price-period').textContent = 'month';
    }
}

// Upgrade to plan function
function upgradeToPlan(plan, price) {
    const billingCycle = 'monthly';
    const paymentUrl = `payment.html?plan=${plan}&billing=${billingCycle}&price=${price}`;
    window.location.href = paymentUrl;
}

// Select plan (for modal)
async function selectPlan(plan) {
    const billingCycle = document.querySelector('input[name="billing"]:checked')?.value || 'monthly';
    const prices = { premium: billingCycle === 'yearly' ? 90 : 9, business: billingCycle === 'yearly' ? 190 : 19 };
    const price = prices[plan];
    
    upgradeToPlan(plan, price);
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// Initialize settings
function initializeSettings() {
    // Load saved settings
    loadSettings();
    
    // Add event listeners
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    const fontFamilySelect = document.getElementById('fontFamilySelect');
    const autoSave = document.getElementById('autoSave');
    const wordCount = document.getElementById('wordCount');
    const spellCheck = document.getElementById('spellCheck');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const twoFactorBtn = document.getElementById('twoFactorBtn');
    
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', (e) => {
            applyEditorFontSize(e.target.value);
            saveSettings();
        });
    }
    
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', (e) => {
            applyEditorFont(e.target.value);
            saveSettings();
        });
    }
    
    if (autoSave) {
        autoSave.addEventListener('change', saveSettings);
    }
    
    if (wordCount) {
        wordCount.addEventListener('change', (e) => {
            toggleWordCount(e.target.checked);
            saveSettings();
        });
    }
    
    if (spellCheck) {
        spellCheck.addEventListener('change', (e) => {
            toggleSpellCheck(e.target.checked);
            saveSettings();
        });
    }
    
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearCache);
    }
    
    if (importDataBtn) {
        importDataBtn.addEventListener('click', importData);
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', deleteAccount);
    }
    
    if (twoFactorBtn) {
        twoFactorBtn.addEventListener('click', setupTwoFactor);
    }
}

// Load settings from localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('blogpad-settings') || '{}');
    
    // Apply font settings
    if (settings.fontSize) {
        document.getElementById('fontSizeSelect').value = settings.fontSize;
        applyEditorFontSize(settings.fontSize);
    }
    
    if (settings.fontFamily) {
        document.getElementById('fontFamilySelect').value = settings.fontFamily;
        applyEditorFont(settings.fontFamily);
    }
    
    // Apply checkbox settings
    if (settings.autoSave !== undefined) {
        document.getElementById('autoSave').checked = settings.autoSave;
    }
    
    if (settings.wordCount !== undefined) {
        document.getElementById('wordCount').checked = settings.wordCount;
        toggleWordCount(settings.wordCount);
    }
    
    if (settings.spellCheck !== undefined) {
        document.getElementById('spellCheck').checked = settings.spellCheck;
        toggleSpellCheck(settings.spellCheck);
    }
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        fontSize: document.getElementById('fontSizeSelect')?.value,
        fontFamily: document.getElementById('fontFamilySelect')?.value,
        autoSave: document.getElementById('autoSave')?.checked,
        wordCount: document.getElementById('wordCount')?.checked,
        spellCheck: document.getElementById('spellCheck')?.checked,
        emailNotifications: document.getElementById('emailNotifications')?.checked,
        writingReminders: document.getElementById('writingReminders')?.checked,
        reminderTime: document.getElementById('reminderTime')?.value,
        publicProfile: document.getElementById('publicProfile')?.checked,
        analyticsTracking: document.getElementById('analyticsTracking')?.checked
    };
    
    localStorage.setItem('blogpad-settings', JSON.stringify(settings));
}

// Apply editor font size
function applyEditorFontSize(size) {
    const editor = document.getElementById('postContent');
    if (editor) {
        editor.style.fontSize = size + 'px';
    }
}

// Apply editor font family
function applyEditorFont(font) {
    const editor = document.getElementById('postContent');
    if (editor) {
        editor.style.fontFamily = font;
    }
}

// Toggle word count display
function toggleWordCount(show) {
    console.log('Word count display:', show);
}

// Toggle spell check
function toggleSpellCheck(enabled) {
    const editor = document.getElementById('postContent');
    if (editor) {
        editor.spellcheck = enabled;
    }
}

// Clear cache
function clearCache() {
    if (confirm('This will clear all cached data. Continue?')) {
        localStorage.clear();
        sessionStorage.clear();
        alert('Cache cleared successfully!');
        location.reload();
    }
}

// Import data
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    console.log('Imported data:', data);
                    alert('Data imported successfully!');
                } catch (error) {
                    alert('Invalid file format');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Setup two-factor authentication
function setupTwoFactor() {
    alert('Two-factor authentication setup will be implemented in a future update.');
}

// Delete account
function deleteAccount() {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation === 'DELETE') {
        if (confirm('This action cannot be undone. Are you absolutely sure?')) {
            alert('Account deletion will be implemented in a future update.');
        }
    }
}

// Update word count in editor
function updateWordCount() {
    const content = document.getElementById('postContent')?.textContent || '';
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const readingTime = Math.ceil(words / 200);
    
    const wordCountEl = document.getElementById('wordCount');
    const charCountEl = document.getElementById('charCount');
    const readingTimeEl = document.getElementById('readingTime');
    
    if (wordCountEl) wordCountEl.textContent = `${words} words`;
    if (charCountEl) charCountEl.textContent = `${chars} characters`;
    if (readingTimeEl) readingTimeEl.textContent = `${readingTime} min read`;
}

// Rich text formatting
function formatText(command, value = null) {
    const editor = document.getElementById('postContent');
    if (editor) {
        document.execCommand(command, false, value);
        editor.focus();
        updateWordCount();
    }
}

// Insert link
function insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
        formatText('createLink', url);
    }
}

// Handle image upload
function initImageUpload() {
    const uploadBtn = document.getElementById('uploadImageBtn');
    const fileInput = document.getElementById('imageUpload');
    const preview = document.getElementById('imagePreview');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '200px';
                    img.style.borderRadius = '8px';
                    
                    preview.innerHTML = '';
                    preview.appendChild(img);
                    
                    // Store image data
                    window.currentImage = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Generate slug from title
function generateSlug(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

// Initialize word count listener
function initWordCount() {
    const postContent = document.getElementById('postContent');
    if (postContent) {
        postContent.addEventListener('input', updateWordCount);
        updateWordCount();
    }
}

// Initialize rich editor
function initRichEditor() {
    initImageUpload();
    
    const editor = document.getElementById('postContent');
    if (editor) {
        editor.addEventListener('input', updateWordCount);
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    }
}

// Update word count in real-time
function updateWordCount() {
    const contentEl = document.getElementById('postContent');
    const titleEl = document.getElementById('postTitle');
    
    if (!contentEl || !titleEl) return;
    
    const content = contentEl.textContent || contentEl.value || '';
    const title = titleEl.value || '';
    
    // Calculate words
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const titleWords = title.trim() ? title.trim().split(/\s+/).length : 0;
    const totalWords = words + titleWords;
    
    // Calculate characters
    const characters = content.length + title.length;
    
    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(totalWords / 200) || 1;
    
    // Update display
    const wordCountEl = document.getElementById('wordCount');
    const charCountEl = document.getElementById('charCount');
    const readingTimeEl = document.getElementById('readingTime');
    
    if (wordCountEl) wordCountEl.textContent = `${totalWords} words`;
    if (charCountEl) charCountEl.textContent = `${characters} characters`;
    if (readingTimeEl) readingTimeEl.textContent = `${readingTime} min read`;
}

// Auto-save functionality
let autoSaveTimeout;
function setupAutoSave() {
    const postContent = document.getElementById('postContent');
    const postTitle = document.getElementById('postTitle');
    
    function triggerAutoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const settings = JSON.parse(localStorage.getItem('blogpad-settings') || '{}');
            if (settings.autoSave && currentPostId) {
                savePost(true); // Silent save
            }
        }, 3000); // Auto-save after 3 seconds of inactivity
    }
    
    if (postContent) postContent.addEventListener('input', triggerAutoSave);
    if (postTitle) postTitle.addEventListener('input', triggerAutoSave);
}

// Manage subscription
function manageSubscription() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const { subscription_plan, payment_status, subscription_expires_at } = currentUser;
    const expiryDate = new Date(subscription_expires_at).toLocaleDateString();
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Manage Subscription</h3>
            <div class="subscription-info">
                <div class="current-plan">
                    <h4>Current Plan: ${subscription_plan.toUpperCase()}</h4>
                    <p>Status: ${payment_status}</p>
                    <p>Expires: ${expiryDate}</p>
                </div>
                
                <div class="subscription-actions">
                    ${payment_status === 'trial' ? '<button onclick="showUpgradeModal()" class="btn btn-primary">Upgrade Now</button>' : ''}
                    ${payment_status === 'paid' ? '<button onclick="cancelSubscription()" class="btn btn-danger">Cancel Subscription</button>' : ''}
                    <button onclick="showUpgradeModal()" class="btn btn-secondary">Change Plan</button>
                </div>
            </div>
            <button onclick="closeModal()" class="close-modal">×</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Cancel subscription
async function cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access when your current period ends.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/cancel-subscription', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            closeModal();
            await checkAuth();
        } else {
            alert(data.error || 'Failed to cancel subscription');
        }
    } catch (error) {
        alert('Failed to cancel subscription. Please try again.');
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Editor functionality
    const saveBtn = document.getElementById('savePostBtn');
    const deleteBtn = document.getElementById('deletePostBtn');
    const newPostBtn = document.getElementById('newPostBtn');
    const quickWriteBtn = document.getElementById('quickWriteBtn');
    const postContent = document.getElementById('postContent');

    if (saveBtn) saveBtn.addEventListener('click', savePost);
    if (deleteBtn) deleteBtn.addEventListener('click', deletePost);
    if (newPostBtn) newPostBtn.addEventListener('click', createNewPost);
    if (quickWriteBtn) quickWriteBtn.addEventListener('click', () => switchSection('editor'));
    
    // Real-time word count
    if (postContent) {
        postContent.addEventListener('input', updateWordCount);
        updateWordCount(); // Initial count
    }

    // Search functionality
    const searchInput = document.getElementById('searchPosts');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterPosts(e.target.value);
        });
    }

    // Settings
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            setTheme(e.target.value);
        });
    }

    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportUserData);
    }
}

// Switch between dashboard sections
function switchSection(section) {
    // Show loading screen for home section
    if (section === 'home') {
        showLoadingScreen();
        setTimeout(() => {
            hideLoadingScreen();
            performSectionSwitch(section);
        }, 1500);
    } else {
        performSectionSwitch(section);
    }
}

function performSectionSwitch(section) {
    currentSection = section;
    
    // Update menu items
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });

    // Update content sections
    contentSections.forEach(contentSection => {
        contentSection.classList.remove('active');
        if (contentSection.id === section + 'Section') {
            contentSection.classList.add('active');
        }
    });

    // Load section-specific data
    if (section === 'posts') {
        loadAllPosts();
    } else if (section === 'profile') {
        loadUserProfile();
    } else if (section === 'gamification') {
        loadGamificationData();
        loadAchievementsTab();
    }

    // Close mobile menu if open
    if (sidebar) {
        sidebar.classList.remove('open');
    }
}

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// Load all posts for the user
async function loadPosts() {
    try {
        const response = await fetch('/api/posts', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load posts');
        }
        
        posts = await response.json();
        renderPostsList();
        
    } catch (error) {
        console.error('Error loading posts:', error);
        const postsList = document.getElementById('postsList');
        if (postsList) {
            postsList.innerHTML = '<div class="empty-state">Failed to load posts</div>';
        }
    }
}

// Render posts list in editor sidebar
function renderPostsList() {
    const postsList = document.getElementById('postsList');
    if (!postsList) return;

    if (posts.length === 0) {
        postsList.innerHTML = '<div class="empty-state">No posts yet. Create your first post!</div>';
        return;
    }
    
    postsList.innerHTML = posts.map(post => {
        const preview = post.content ? post.content.substring(0, 80) + '...' : 'No content';
        const date = new Date(post.created_at).toLocaleDateString();
        const isActive = currentPostId === post.id ? 'active' : '';
        
        return `
            <div class="post-item ${isActive}" data-post-id="${post.id}">
                <h4>${post.title || 'Untitled'}</h4>
                <div class="post-preview">${preview}</div>
                <div class="post-date">${date}</div>
            </div>
        `;
    }).join('');
    
    // Add click listeners to post items
    document.querySelectorAll('.post-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const postId = parseInt(e.currentTarget.dataset.postId);
            const post = posts.find(p => p.id === postId);
            if (post) {
                loadPost(post);
            }
        });
    });
}

// Load dashboard stats
function loadDashboardStats() {
    const totalPosts = document.getElementById('totalPosts');
    const postsThisMonth = document.getElementById('postsThisMonth');
    const lastPostDays = document.getElementById('lastPostDays');

    // Use database counts from currentUser, fallback to posts array
    const totalCount = currentUser?.posts_count ?? posts.length;
    const monthlyCount = currentUser?.monthly_posts_count ?? 0;

    if (totalPosts) {
        totalPosts.textContent = totalCount;
    }

    if (postsThisMonth) {
        postsThisMonth.textContent = monthlyCount;
    }

    if (lastPostDays) {
        if (posts.length > 0) {
            const latestPost = posts[0];
            const daysDiff = Math.floor((new Date() - new Date(latestPost.updated_at)) / (1000 * 60 * 60 * 24));
            lastPostDays.textContent = daysDiff;
        } else {
            lastPostDays.textContent = 0;
        }
    }
}

// Load recent posts for home section
function loadRecentPosts() {
    const recentPostsList = document.getElementById('recentPostsList');
    if (!recentPostsList) return;

    if (posts.length === 0) {
        recentPostsList.innerHTML = '<div class="empty-state">No posts yet. Start writing!</div>';
        return;
    }

    const recentPosts = posts.slice(0, 3);
    recentPostsList.innerHTML = recentPosts.map(post => {
        const preview = post.content ? post.content.substring(0, 120) + '...' : 'No content';
        const date = new Date(post.created_at).toLocaleDateString();
        const wordCount = post.content ? post.content.split(' ').length : 0;
        const postId = post.id || post._id;
        
        return `
            <div class="recent-post-item" data-post-id="${postId}">
                <div class="post-header">
                    <h4>${post.title || 'Untitled'}</h4>
                    <div class="post-actions">
                        <button class="action-btn edit-btn" onclick="editRecentPost('${postId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteRecentPost('${postId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="post-preview">${preview}</div>
                <div class="post-meta">
                    <span class="post-date">${date}</span>
                    <span class="word-count">${wordCount} words</span>
                </div>
                <div class="social-actions">
                    <button class="social-btn like-btn" onclick="toggleLike('${postId}')" title="Like">
                        <i class="fas fa-heart"></i> <span class="like-count">0</span>
                    </button>
                    <button class="social-btn share-btn" onclick="sharePost('${postId}', 'twitter')" title="Share on Twitter">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="social-btn share-btn" onclick="sharePost('${postId}', 'facebook')" title="Share on Facebook">
                        <i class="fab fa-facebook"></i>
                    </button>
                    <button class="social-btn share-btn" onclick="sharePost('${postId}', 'linkedin')" title="Share on LinkedIn">
                        <i class="fab fa-linkedin"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners for post content (not buttons)
    document.querySelectorAll('.recent-post-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.action-btn') || e.target.closest('.social-btn')) return;
            
            const postId = e.currentTarget.dataset.postId;
            const post = posts.find(p => (p.id || p._id) == postId);
            if (post) {
                loadPost(post);
                switchSection('editor');
            }
        });
    });
    
    // Load like counts for each post
    recentPosts.forEach(post => {
        loadLikeCount(post.id || post._id);
    });
}

// Edit recent post
function editRecentPost(postId) {
    const post = posts.find(p => (p.id || p._id) == postId);
    if (post) {
        loadPost(post);
        switchSection('editor');
    }
}

// Delete recent post
async function deleteRecentPost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            posts = posts.filter(p => (p.id || p._id) != postId);
            loadRecentPosts();
            loadDashboardStats();
            loadAllPosts();
        } else {
            alert('Failed to delete post');
        }
    } catch (error) {
        alert('Failed to delete post');
    }
}

// Load enhanced dashboard stats
function loadEnhancedStats() {
    // Writing streak calculation
    const streakDays = calculateWritingStreak();
    const streakElement = document.getElementById('streakDays');
    const streakMessage = document.getElementById('streakMessage');
    
    if (streakElement) {
        streakElement.textContent = streakDays;
        if (streakMessage) {
            if (streakDays === 0) {
                streakMessage.textContent = 'Start writing to build your streak!';
            } else if (streakDays === 1) {
                streakMessage.textContent = 'Great start! Keep it going!';
            } else {
                streakMessage.textContent = `Amazing! ${streakDays} days in a row!`;
            }
        }
    }
    
    // Quick stats
    const totalWords = posts.reduce((sum, post) => {
        return sum + (post.content ? post.content.split(' ').length : 0);
    }, 0);
    
    const postCount = currentUser ? (currentUser.posts_count || posts.length) : posts.length;
    const avgWords = postCount > 0 ? Math.round(totalWords / postCount) : 0;
    
    const longestPost = posts.reduce((max, post) => {
        const wordCount = post.content ? post.content.split(' ').length : 0;
        return Math.max(max, wordCount);
    }, 0);
    
    const today = new Date().toDateString();
    const publishedToday = posts.filter(post => {
        return new Date(post.created_at).toDateString() === today;
    }).length;
    
    // Update UI
    const totalWordsEl = document.getElementById('totalWords');
    const avgWordsEl = document.getElementById('avgWordsPerPost');
    const longestPostEl = document.getElementById('longestPost');
    const publishedTodayEl = document.getElementById('publishedToday');
    
    if (totalWordsEl) totalWordsEl.textContent = totalWords.toLocaleString();
    if (avgWordsEl) avgWordsEl.textContent = avgWords;
    if (longestPostEl) longestPostEl.textContent = longestPost;
    if (publishedTodayEl) publishedTodayEl.textContent = publishedToday;
}

// Calculate writing streak
function calculateWritingStreak() {
    if (posts.length === 0) return 0;
    
    const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if there's a post today or yesterday to start counting
    const todayStr = today.toDateString();
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    const hasPostToday = sortedPosts.some(post => 
        new Date(post.created_at).toDateString() === todayStr
    );
    const hasPostYesterday = sortedPosts.some(post => 
        new Date(post.created_at).toDateString() === yesterdayStr
    );
    
    // Start from today if there's a post today, otherwise from yesterday
    if (!hasPostToday && !hasPostYesterday) {
        return 0; // No recent posts
    }
    
    if (!hasPostToday) {
        currentDate.setDate(currentDate.getDate() - 1); // Start from yesterday
    }
    
    // Count consecutive days with posts
    for (let i = 0; i < 365; i++) { // Check up to a year
        const dateStr = currentDate.toDateString();
        const hasPost = sortedPosts.some(post => 
            new Date(post.created_at).toDateString() === dateStr
        );
        
        if (hasPost) {
            streak++;
        } else {
            break; // Streak broken
        }
        
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
}

// Load all posts for posts section
function loadAllPosts() {
    const allPostsList = document.getElementById('allPostsList');
    if (!allPostsList) return;

    if (posts.length === 0) {
        allPostsList.innerHTML = '<div class="empty-state">No posts yet. Start writing!</div>';
        return;
    }

    allPostsList.innerHTML = posts.map(post => {
        const preview = post.content ? post.content.substring(0, 150) + '...' : 'No content';
        const date = new Date(post.created_at).toLocaleDateString();
        const wordCount = post.content ? post.content.split(' ').length : 0;
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <h3>${post.title || 'Untitled'}</h3>
                <div class="post-excerpt">${preview}</div>
                <div class="post-meta">
                    <span>${wordCount} words</span>
                    <span>${date}</span>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.post-card').forEach(item => {
        item.addEventListener('click', (e) => {
            const postId = parseInt(e.currentTarget.dataset.postId);
            const post = posts.find(p => p.id === postId);
            if (post) {
                loadPost(post);
                switchSection('editor');
            }
        });
    });
}

// Filter posts based on search
function filterPosts(searchTerm) {
    const filteredPosts = posts.filter(post => 
        (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const allPostsList = document.getElementById('allPostsList');
    if (!allPostsList) return;

    if (filteredPosts.length === 0) {
        allPostsList.innerHTML = '<div class="empty-state">No posts found matching your search.</div>';
        return;
    }

    allPostsList.innerHTML = filteredPosts.map(post => {
        const preview = post.content ? post.content.substring(0, 150) + '...' : 'No content';
        const date = new Date(post.created_at).toLocaleDateString();
        const wordCount = post.content ? post.content.split(' ').length : 0;
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <h3>${post.title || 'Untitled'}</h3>
                <div class="post-excerpt">${preview}</div>
                <div class="post-meta">
                    <span>${wordCount} words</span>
                    <span>${date}</span>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.post-card').forEach(item => {
        item.addEventListener('click', (e) => {
            const postId = parseInt(e.currentTarget.dataset.postId);
            const post = posts.find(p => p.id === postId);
            if (post) {
                loadPost(post);
                switchSection('editor');
            }
        });
    });
}

// Load user profile information
function loadUserProfile() {
    if (!currentUser) return;

    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileUsername = document.getElementById('profileUsername');
    const joinDate = document.getElementById('joinDate');
    const subscriptionBadge = document.getElementById('subscriptionBadge');
    const streakBadge = document.getElementById('streakBadge');
    const subscriptionInfo = document.getElementById('subscriptionInfo');
    const monthlyPosts = document.getElementById('monthlyPosts');
    const lastActive = document.getElementById('lastActive');

    if (profileName) profileName.textContent = currentUser.name;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profileUsername) profileUsername.textContent = `@${currentUser.username}`;
    
    if (joinDate) {
        const date = currentUser.created_at ? 
            new Date(currentUser.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 
            new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        joinDate.textContent = date;
    }
    
    // Update subscription info
    if (subscriptionBadge && currentUser.subscription_plan) {
        subscriptionBadge.textContent = currentUser.subscription_plan.toUpperCase() + ' Plan';
        subscriptionBadge.className = `badge ${currentUser.subscription_plan}-plan`;
    }
    
    if (subscriptionInfo && currentUser.subscription_plan) {
        subscriptionInfo.textContent = currentUser.subscription_plan.toUpperCase() + ' Plan';
    }
    
    // Update streak info
    const streak = calculateWritingStreak();
    if (streakBadge) {
        streakBadge.textContent = `${streak} Day Streak`;
    }
    
    // Update monthly posts
    if (monthlyPosts && currentUser.monthly_posts_count !== undefined) {
        monthlyPosts.textContent = currentUser.monthly_posts_count;
    }
    
    // Update last active
    if (lastActive) {
        lastActive.textContent = 'Today';
    }
    
    // Load saved bio
    const savedBio = localStorage.getItem('user-bio');
    const bioElement = document.getElementById('profileBio');
    if (savedBio && bioElement) {
        bioElement.textContent = savedBio;
    }
    
    // Load profile stats
    loadProfileStats();
    loadAchievements();
    loadActivityTimeline();
}

// Load profile statistics
function loadProfileStats() {
    const totalWords = posts.reduce((sum, post) => {
        return sum + (post.content ? post.content.split(' ').length : 0);
    }, 0);
    
    const streak = calculateWritingStreak();
    const daysActive = calculateDaysActive();
    
    const profileTotalPosts = document.getElementById('profileTotalPosts');
    const profileTotalWords = document.getElementById('profileTotalWords');
    const profileStreak = document.getElementById('profileStreak');
    const profileDaysActive = document.getElementById('profileDaysActive');
    
    if (profileTotalPosts && currentUser) {
        profileTotalPosts.textContent = currentUser.posts_count || posts.length;
    }
    if (profileTotalWords) profileTotalWords.textContent = totalWords.toLocaleString();
    if (profileStreak) profileStreak.textContent = streak;
    if (profileDaysActive) profileDaysActive.textContent = daysActive;
}

// Calculate days active
function calculateDaysActive() {
    if (posts.length === 0) return 0;
    
    const uniqueDays = new Set();
    posts.forEach(post => {
        const date = new Date(post.created_at).toDateString();
        uniqueDays.add(date);
    });
    
    return uniqueDays.size;
}

// Load achievements
function loadAchievements() {
    const achievements = [
        { id: 'first-post', icon: 'fas fa-pen-fancy', name: 'First Post', condition: () => posts.length >= 1 },
        { id: 'streak-7', icon: 'fas fa-fire', name: '7 Day Streak', condition: () => calculateWritingStreak() >= 7 },
        { id: 'posts-10', icon: 'fas fa-star', name: '10 Posts', condition: () => posts.length >= 10 },
        { id: 'posts-100', icon: 'fas fa-crown', name: '100 Posts', condition: () => posts.length >= 100 }
    ];
    
    const achievementsList = document.getElementById('achievementsList');
    if (achievementsList) {
        achievementsList.innerHTML = achievements.map(achievement => {
            const unlocked = achievement.condition();
            return `
                <div class="achievement ${unlocked ? 'unlocked' : 'locked'}">
                    <i class="${achievement.icon}"></i>
                    <span>${achievement.name}</span>
                </div>
            `;
        }).join('');
    }
}

// Load activity timeline
function loadActivityTimeline() {
    const activities = [];
    
    // Add recent posts to timeline
    const recentPosts = posts.slice(0, 5).map(post => ({
        icon: 'fas fa-plus',
        text: `Created "${post.title || 'Untitled'}"`,
        time: new Date(post.created_at).toLocaleDateString()
    }));
    
    activities.push(...recentPosts);
    
    // Add subscription activity if exists
    const subscription = JSON.parse(localStorage.getItem('subscription') || 'null');
    if (subscription && subscription.activatedAt) {
        activities.push({
            icon: 'fas fa-crown',
            text: `Upgraded to ${subscription.plan.toUpperCase()} plan`,
            time: new Date(subscription.activatedAt).toLocaleDateString()
        });
    }
    
    // Add join date
    if (currentUser && currentUser.created_at) {
        activities.push({
            icon: 'fas fa-user-plus',
            text: 'Joined BlogPad',
            time: new Date(currentUser.created_at).toLocaleDateString()
        });
    } else {
        // Fallback join activity
        activities.push({
            icon: 'fas fa-user-plus',
            text: 'Joined BlogPad',
            time: new Date().toLocaleDateString()
        });
    }
    
    // Add sample activities if no posts exist
    if (posts.length === 0) {
        activities.unshift(
            {
                icon: 'fas fa-star',
                text: 'Account created successfully',
                time: new Date().toLocaleDateString()
            },
            {
                icon: 'fas fa-cog',
                text: 'Profile setup completed',
                time: new Date().toLocaleDateString()
            }
        );
    }
    
    const activityTimeline = document.getElementById('activityTimeline');
    if (activityTimeline) {
        activityTimeline.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <span class="activity-text">${activity.text}</span>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }
}

// Edit profile function
function editProfile() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Edit Profile</h3>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editName">Full Name</label>
                    <input type="text" id="editName" value="${currentUser.name}" required>
                </div>
                <div class="form-group">
                    <label for="editBio">Bio</label>
                    <textarea id="editBio" rows="3" placeholder="Tell us about yourself..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
            <button onclick="closeModal()" class="close-modal">×</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editProfileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('editName').value;
        const bio = document.getElementById('editBio').value;
        
        currentUser.name = name;
        localStorage.setItem('user-bio', bio);
        
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileBio').textContent = bio || 'Welcome to my blog! I love sharing my thoughts and experiences through writing.';
        
        closeModal();
        alert('Profile updated successfully!');
    });
}

// Edit bio function
function editBio() {
    const currentBio = document.getElementById('profileBio').textContent;
    const newBio = prompt('Edit your bio:', currentBio);
    if (newBio !== null) {
        document.getElementById('profileBio').textContent = newBio || 'Welcome to my blog! I love sharing my thoughts and experiences through writing.';
        localStorage.setItem('user-bio', newBio);
    }
}

// Change avatar function
function changeAvatar() {
    const hasPhoto = localStorage.getItem('user-avatar');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content camera-modal">
            <h3>Update Profile Photo</h3>
            <div class="camera-options">
                <button onclick="openCamera()" class="btn btn-primary">
                    <i class="fas fa-camera"></i> Take Photo
                </button>
                <button onclick="uploadPhoto()" class="btn btn-secondary">
                    <i class="fas fa-upload"></i> Upload Photo
                </button>
                ${hasPhoto ? '<button onclick="removePhoto()" class="btn btn-danger"><i class="fas fa-trash"></i> Remove Photo</button>' : ''}
            </div>
            <div id="cameraContainer" style="display: none;">
                <video id="cameraVideo" autoplay playsinline></video>
                <canvas id="cameraCanvas" style="display: none;"></canvas>
                <div class="camera-controls">
                    <button onclick="capturePhoto()" class="btn btn-primary">
                        <i class="fas fa-camera"></i> Capture
                    </button>
                    <button onclick="stopCamera()" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
            <div id="photoPreview" style="display: none;">
                <img id="previewImage" style="max-width: 300px; border-radius: 50%;">
                <div class="preview-controls">
                    <button onclick="savePhoto()" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Photo
                    </button>
                    <button onclick="retakePhoto()" class="btn btn-secondary">
                        <i class="fas fa-redo"></i> Retake
                    </button>
                </div>
            </div>
            <button onclick="closeModal()" class="close-modal">×</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Open camera
async function openCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            } 
        });
        
        const video = document.getElementById('cameraVideo');
        const container = document.getElementById('cameraContainer');
        const options = document.querySelector('.camera-options');
        
        video.srcObject = stream;
        container.style.display = 'block';
        options.style.display = 'none';
        
        window.currentStream = stream;
    } catch (error) {
        alert('Camera access denied or not available. Please use upload option.');
        console.error('Camera error:', error);
    }
}

// Upload photo
function uploadPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                showPhotoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// Capture photo from camera
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    
    stopCamera();
    showPhotoPreview(dataURL);
}

// Show photo preview
function showPhotoPreview(dataURL) {
    const preview = document.getElementById('photoPreview');
    const image = document.getElementById('previewImage');
    const container = document.getElementById('cameraContainer');
    const options = document.querySelector('.camera-options');
    
    image.src = dataURL;
    preview.style.display = 'block';
    container.style.display = 'none';
    options.style.display = 'none';
    
    window.capturedPhoto = dataURL;
}

// Save photo
function savePhoto() {
    if (window.capturedPhoto) {
        // Save to localStorage (in production, upload to server)
        localStorage.setItem('user-avatar', window.capturedPhoto);
        
        // Update avatar display
        updateAvatarDisplay(window.capturedPhoto);
        
        closeModal();
        alert('Profile photo updated successfully!');
    }
}

// Retake photo
function retakePhoto() {
    const preview = document.getElementById('photoPreview');
    const options = document.querySelector('.camera-options');
    
    preview.style.display = 'none';
    options.style.display = 'block';
    
    window.capturedPhoto = null;
}

// Stop camera
function stopCamera() {
    if (window.currentStream) {
        window.currentStream.getTracks().forEach(track => track.stop());
        window.currentStream = null;
    }
    
    const container = document.getElementById('cameraContainer');
    const options = document.querySelector('.camera-options');
    
    container.style.display = 'none';
    options.style.display = 'block';
}

// Update avatar display
function updateAvatarDisplay(imageData) {
    const profileAvatar = document.querySelector('.profile-avatar');
    const userAvatars = document.querySelectorAll('.user-avatar');
    
    // Update profile avatar (keep camera button)
    if (profileAvatar) {
        profileAvatar.innerHTML = `
            <img src="${imageData}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
            <button class="avatar-edit" onclick="changeAvatar()">
                <i class="fas fa-camera"></i>
            </button>
        `;
    }
    
    // Update other avatars (sidebar, etc.)
    userAvatars.forEach(avatar => {
        avatar.innerHTML = `<img src="${imageData}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    });
}

// Remove photo function
function removePhoto() {
    if (confirm('Are you sure you want to remove your profile photo?')) {
        localStorage.removeItem('user-avatar');
        
        // Reset to default avatar
        const profileAvatar = document.querySelector('.profile-avatar');
        const userAvatars = document.querySelectorAll('.user-avatar');
        
        if (profileAvatar) {
            profileAvatar.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <button class="avatar-edit" onclick="changeAvatar()">
                    <i class="fas fa-camera"></i>
                </button>
            `;
        }
        
        userAvatars.forEach(avatar => {
            avatar.innerHTML = '<i class="fas fa-user-circle"></i>';
        });
        
        closeModal();
        alert('Profile photo removed successfully!');
    }
}

// Load saved avatar on page load
function loadSavedAvatar() {
    const savedAvatar = localStorage.getItem('user-avatar');
    if (savedAvatar) {
        updateAvatarDisplay(savedAvatar);
    }
}

// Print blog function
function printBlog() {
    const printWindow = window.open('', '_blank');
    const blogContent = generatePrintableBlog();
    
    printWindow.document.write(blogContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Generate printable blog content
function generatePrintableBlog() {
    const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${currentUser.name}'s Blog - BlogPad</title>
            <style>
                body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .blog-title { font-size: 2.5em; margin: 0; color: #333; }
                .blog-subtitle { color: #666; margin: 10px 0; }
                .post { margin-bottom: 40px; page-break-inside: avoid; }
                .post-title { font-size: 1.8em; color: #333; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                .post-meta { color: #666; font-size: 0.9em; margin-bottom: 15px; }
                .post-content { text-align: justify; }
                .footer { margin-top: 50px; text-align: center; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="blog-title">${currentUser.name}'s Blog</h1>
                <p class="blog-subtitle">@${currentUser.username} • ${currentUser.email}</p>
                <p class="blog-subtitle">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${sortedPosts.map(post => `
                <article class="post">
                    <h2 class="post-title">${post.title || 'Untitled'}</h2>
                    <div class="post-meta">
                        Published on ${new Date(post.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })} • ${post.content ? post.content.split(' ').length : 0} words
                    </div>
                    <div class="post-content">
                        ${(post.content || 'No content available.').replace(/\n/g, '<br>')}
                    </div>
                </article>
            `).join('')}
            
            <div class="footer">
                <p>Generated by BlogPad • Total Posts: ${posts.length} • Total Words: ${posts.reduce((sum, post) => sum + (post.content ? post.content.split(' ').length : 0), 0).toLocaleString()}</p>
            </div>
        </body>
        </html>
    `;
}

// Load a post into the editor
function loadPost(post) {
    const titleInput = document.getElementById('postTitle');
    const contentEditor = document.getElementById('postContent');
    const deleteBtn = document.getElementById('deletePostBtn');

    currentPostId = post.id || post._id;
    if (titleInput) titleInput.value = post.title || '';
    if (contentEditor) {
        if (contentEditor.contentEditable === 'true') {
            contentEditor.innerHTML = post.content || '';
        } else {
            contentEditor.value = post.content || '';
        }
    }
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    
    updateWordCount();
    renderPostsList();
}

// Create a new post
function createNewPost() {
    const titleInput = document.getElementById('postTitle');
    const contentEditor = document.getElementById('postContent');
    const deleteBtn = document.getElementById('deletePostBtn');

    currentPostId = null;
    if (titleInput) {
        titleInput.value = '';
        titleInput.focus();
    }
    if (contentEditor) contentEditor.value = '';
    if (deleteBtn) deleteBtn.style.display = 'none';
    
    renderPostsList();
}

// Save current post
async function savePost() {
    const titleInput = document.getElementById('postTitle');
    const contentEditor = document.getElementById('postContent');
    const saveBtn = document.getElementById('savePostBtn');

    if (!titleInput || !contentEditor) return;

    const title = titleInput.value.trim();
    const content = (contentEditor.textContent || contentEditor.value || '').trim();
    const isPublic = document.getElementById('isPublic')?.checked || false;
    const category = document.getElementById('postCategory')?.value || 'General';
    const tags = document.getElementById('postTags')?.value || '';
    
    if (!title && !content) {
        alert('Please enter a title or content before saving.');
        return;
    }
    
    const postTitle = title || 'Untitled';
    
    try {
        let response;
        if (currentPostId) {
            response = await fetch(`/api/posts/${currentPostId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    title: postTitle, 
                    content, 
                    isPublic, 
                    category, 
                    tags 
                })
            });
        } else {
            response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    title: postTitle, 
                    content, 
                    isPublic, 
                    category, 
                    tags 
                })
            });
        }
        
        if (!response.ok) {
            throw new Error('Failed to save post');
        }
        
        const savedPost = await response.json();
        
        if (currentPostId) {
            const index = posts.findIndex(p => (p.id || p._id) == currentPostId);
            if (index !== -1) {
                posts[index] = { ...savedPost, id: savedPost._id || savedPost.id };
            }
        } else {
            const newPost = { ...savedPost, id: savedPost._id || savedPost.id };
            posts.unshift(newPost);
            currentPostId = newPost.id;
            
            // Update user counts locally
            if (currentUser) {
                currentUser.posts_count = (currentUser.posts_count || 0) + 1;
                currentUser.monthly_posts_count = (currentUser.monthly_posts_count || 0) + 1;
            }
            
            // Handle gamification rewards
            if (savedPost.gamification) {
                const { xpEarned, leveledUp, streak } = savedPost.gamification;
                
                if (xpEarned > 0) {
                    showXPGain(xpEarned);
                }
                
                if (leveledUp) {
                    alert(`Level Up! You're now level ${savedPost.gamification.newLevel}!`);
                }
                
                // Update gamification UI
                loadGamificationData();
            }
        }
        
        renderPostsList();
        await refreshAllStats();
        updateUsageDisplay();
        
        // Update streak display immediately
        updateStreakDisplay();
        
        if (saveBtn) {
            const deleteBtn = document.getElementById('deletePostBtn');
            if (deleteBtn) deleteBtn.style.display = 'inline-flex';
            
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            saveBtn.style.background = '#28a745';
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.style.background = '';
            }, 2000);
        }
        
    } catch (error) {
        console.error('Error saving post:', error);
        alert('Failed to save post. Please try again.');
    }
}

// Delete current post
async function deletePost() {
    if (!currentPostId) return;
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/${currentPostId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete post');
        }
        
        posts = posts.filter(p => p.id !== currentPostId);
        renderPostsList();
        loadDashboardStats();
        loadRecentPosts();
        
        if (posts.length > 0) {
            loadPost(posts[0]);
        } else {
            createNewPost();
        }
        
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
    }
}

// Dark mode functionality
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Export user data
async function exportUserData() {
    try {
        const data = {
            user: currentUser,
            posts: posts,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blog-data-${currentUser.username}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Your data has been exported successfully!');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Failed to export data. Please try again.');
    }
}

// AI Writing Assistant functionality
function initAIAssistant() {
    const aiBtn = document.getElementById('aiAssistBtn');
    const aiPanel = document.getElementById('aiAssistPanel');
    const closeBtn = document.getElementById('closeAiPanel');
    const applyBtn = document.getElementById('applyAiResult');
    
    if (aiBtn) {
        aiBtn.addEventListener('click', () => {
            aiPanel.style.display = aiPanel.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            aiPanel.style.display = 'none';
        });
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyAIResult);
    }
}

// AI assist function
async function aiAssist(action) {
    const editor = document.getElementById('postContent');
    const selectedText = getSelectedText() || editor.textContent;
    
    if (!selectedText.trim()) {
        alert('Please select some text or write content first.');
        return;
    }
    
    const loading = document.getElementById('aiLoading');
    const result = document.getElementById('aiResult');
    const resultContent = document.getElementById('aiResultContent');
    const resultTitle = document.getElementById('aiResultTitle');
    
    loading.style.display = 'block';
    result.style.display = 'none';
    
    try {
        const response = await fetch('/api/ai-assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ text: selectedText, action })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loading.style.display = 'none';
            result.style.display = 'block';
            
            switch (action) {
                case 'grammar':
                    resultTitle.textContent = 'Grammar Check Result';
                    resultContent.innerHTML = `<div class="corrected-text">${data.result}</div>`;
                    window.aiSuggestion = data.result;
                    break;
                case 'improve':
                    resultTitle.textContent = 'Improved Text';
                    resultContent.innerHTML = `<div class="improved-text">${data.result}</div>`;
                    window.aiSuggestion = data.result;
                    break;
                case 'suggestions':
                    resultTitle.textContent = 'Writing Suggestions';
                    resultContent.innerHTML = `<div class="suggestions">${data.result}</div>`;
                    document.getElementById('applyAiResult').style.display = 'none';
                    break;
            }
        } else {
            throw new Error(data.error || 'AI assistance failed');
        }
    } catch (error) {
        loading.style.display = 'none';
        alert(error.message || 'AI assistance failed. Please try again.');
    }
}

// Get selected text from editor
function getSelectedText() {
    const selection = window.getSelection();
    return selection.toString();
}

// Apply AI result to editor
function applyAIResult() {
    if (!window.aiSuggestion) return;
    
    const editor = document.getElementById('postContent');
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0 && selection.toString()) {
        // Replace selected text
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(window.aiSuggestion));
    } else {
        // Replace all content if no selection
        editor.textContent = window.aiSuggestion;
    }
    
    updateWordCount();
    document.getElementById('aiAssistPanel').style.display = 'none';
    window.aiSuggestion = null;
}

// Load like count for a post
async function loadLikeCount(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/likes`);
        const data = await response.json();
        
        const likeCountEl = document.querySelector(`[data-post-id="${postId}"] .like-count`);
        if (likeCountEl) {
            likeCountEl.textContent = data.count;
        }
    } catch (error) {
        console.error('Failed to load like count:', error);
    }
}

// Social Features

// Share post on social media
function sharePost(postId, platform) {
    const post = posts.find(p => (p.id || p._id) == postId);
    if (!post) return;
    
    const url = `${window.location.origin}/blog/${currentUser.username}/${post.slug || post._id}`;
    const text = `Check out my latest post: ${post.title}`;
    
    let shareUrl = '';
    switch (platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// Toggle like on post
async function toggleLike(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
            // Update UI
            const likeBtn = document.querySelector(`[data-post-id="${postId}"] .like-btn`);
            if (likeBtn) {
                likeBtn.classList.toggle('liked', data.liked);
                likeBtn.innerHTML = data.liked ? '❤️ Liked' : '🤍 Like';
            }
        }
    } catch (error) {
        console.error('Failed to toggle like:', error);
    }
}

// Follow/unfollow user
async function toggleFollow(userId) {
    try {
        const response = await fetch(`/api/users/${userId}/follow`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
            const followBtn = document.querySelector(`[data-user-id="${userId}"] .follow-btn`);
            if (followBtn) {
                followBtn.classList.toggle('following', data.following);
                followBtn.textContent = data.following ? 'Following' : 'Follow';
            }
        }
    } catch (error) {
        console.error('Failed to toggle follow:', error);
    }
}

// Add comment to post
async function addComment(postId, content) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            const comment = await response.json();
            // Update comments UI
            loadComments(postId);
        }
    } catch (error) {
        console.error('Failed to add comment:', error);
    }
}

// Load comments for post
async function loadComments(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        const comments = await response.json();
        
        const commentsList = document.getElementById(`comments-${postId}`);
        if (commentsList) {
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment">
                    <strong>${comment.user_id.name}</strong>
                    <p>${comment.content}</p>
                    <small>${new Date(comment.created_at).toLocaleDateString()}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load comments:', error);
    }
}

// Typing Practice functionality
let typingTest = {
    text: '',
    currentIndex: 0,
    startTime: null,
    endTime: null,
    errors: 0,
    isActive: false,
    timer: null,
    timeLimit: 60
};

const typingTexts = {
    easy: [
        "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet. Practice makes perfect when you type every day. Writing skills improve with consistent effort and dedication. Simple words help build confidence in typing speed and accuracy.",
        "A journey of a thousand miles begins with a single step. Every great achievement starts small and grows over time. Success comes to those who practice regularly and never give up on their goals. Building good habits takes time but pays off in the long run.",
        "Learning to type faster is like learning to ride a bike. Once you master the basics, everything becomes much easier. Your fingers will remember where each key is located. Muscle memory develops through repetition and consistent practice sessions."
    ],
    medium: [
        "Technology has revolutionized the way we communicate, work, and live our daily lives in the modern world. Social media platforms connect people across continents instantly. Digital transformation affects every industry from healthcare to education. Innovation drives progress and creates new opportunities for growth and development.",
        "Writing is not just about putting words on paper; it's about expressing thoughts, emotions, and ideas clearly. Good writers understand their audience and adapt their style accordingly. Effective communication requires practice, patience, and a willingness to revise and improve your work continuously.",
        "The art of blogging requires creativity, consistency, and the ability to connect with your audience effectively. Successful bloggers share valuable content that resonates with their readers. Building an engaged community takes time, effort, and authentic storytelling that provides real value to people."
    ],
    hard: [
        "Sophisticated algorithms and machine learning techniques are transforming industries across the globe at an unprecedented pace. Artificial intelligence systems can now process vast amounts of data and identify patterns that humans might miss. These technological advances create both exciting opportunities and significant challenges for businesses and workers worldwide.",
        "The implementation of artificial intelligence in various sectors has created both opportunities and challenges for professionals worldwide. Healthcare systems use AI for diagnosis and treatment planning. Financial institutions employ machine learning for fraud detection and risk assessment. Educational platforms leverage intelligent tutoring systems to personalize learning experiences.",
        "Cybersecurity measures must evolve continuously to protect against increasingly sophisticated threats in our interconnected digital landscape. Hackers develop new attack vectors faster than traditional security systems can adapt. Organizations need comprehensive strategies that include employee training, advanced monitoring tools, and incident response protocols to maintain robust defenses."
    ]
};

function initTypingPractice() {
    const startBtn = document.getElementById('startTypingBtn');
    const resetBtn = document.getElementById('resetTypingBtn');
    const typingInput = document.getElementById('typingInput');
    const difficultySelect = document.getElementById('difficultySelect');
    
    if (startBtn) startBtn.addEventListener('click', startTypingTest);
    if (resetBtn) resetBtn.addEventListener('click', resetTypingTest);
    if (typingInput) typingInput.addEventListener('input', handleTypingInput);
    if (difficultySelect) difficultySelect.addEventListener('change', loadNewText);
    
    loadNewText();
}

function loadNewText() {
    const difficulty = document.getElementById('difficultySelect').value;
    const texts = typingTexts[difficulty];
    typingTest.text = texts[Math.floor(Math.random() * texts.length)];
    
    displayTypingText();
    resetTypingTest(false); // Don't hide results when auto-loading
}

function displayTypingText() {
    const textContainer = document.getElementById('typingText');
    textContainer.innerHTML = typingTest.text
        .split('')
        .map((char, index) => `<span class="char" data-index="${index}">${char}</span>`)
        .join('');
}

function startTypingTest() {
    // Hide results and load new text
    document.getElementById('typingResults').style.display = 'none';
    loadNewText();
    
    // Play start sound (2 beeps)
    playDoubleBeep(1000);
    
    typingTest.isActive = true;
    typingTest.startTime = new Date();
    typingTest.currentIndex = 0;
    typingTest.errors = 0;
    
    const input = document.getElementById('typingInput');
    const startBtn = document.getElementById('startTypingBtn');
    
    input.disabled = false;
    input.focus();
    input.value = '';
    startBtn.textContent = 'Testing...';
    startBtn.disabled = true;
    
    startTimer();
    highlightCurrentChar();
}

function startTimer() {
    let timeLeft = typingTest.timeLimit;
    const timeDisplay = document.getElementById('timeRemaining');
    
    typingTest.timer = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            endTypingTest();
        }
    }, 1000);
}

function handleTypingInput(e) {
    if (!typingTest.isActive) return;
    
    const input = e.target.value;
    const expectedText = typingTest.text.substring(0, input.length);
    
    // Clear previous markings
    document.querySelectorAll('.char').forEach(char => {
        char.classList.remove('correct', 'incorrect');
    });
    
    let errors = 0;
    for (let i = 0; i < input.length; i++) {
        const char = document.querySelector(`[data-index="${i}"]`);
        if (input[i] === typingTest.text[i]) {
            char.classList.add('correct');
        } else {
            char.classList.add('incorrect');
            errors++;
        }
    }
    
    typingTest.currentIndex = input.length;
    typingTest.errors = errors;
    
    if (input.length >= typingTest.text.length) {
        endTypingTest();
        return;
    }
    
    highlightCurrentChar();
    updateStats();
}

function markCharCorrect(index) {
    const char = document.querySelector(`[data-index="${index}"]`);
    char.classList.add('correct');
    char.classList.remove('incorrect', 'current');
}

function markCharIncorrect(index) {
    const char = document.querySelector(`[data-index="${index}"]`);
    char.classList.add('incorrect');
    char.classList.remove('correct', 'current');
}

function highlightCurrentChar() {
    document.querySelectorAll('.char.current').forEach(char => {
        char.classList.remove('current');
    });
    
    const currentChar = document.querySelector(`[data-index="${typingTest.currentIndex}"]`);
    if (currentChar) {
        currentChar.classList.add('current');
    }
}

function updateStats() {
    if (!typingTest.startTime) return;
    
    const elapsed = (new Date() - typingTest.startTime) / 1000 / 60;
    const correctChars = typingTest.currentIndex - typingTest.errors;
    const wpm = elapsed > 0 ? Math.round((correctChars / 5) / elapsed) : 0;
    const accuracy = typingTest.currentIndex > 0 ? Math.round((correctChars / typingTest.currentIndex) * 100) : 100;
    
    document.getElementById('currentWPM').textContent = wpm;
    document.getElementById('currentAccuracy').textContent = accuracy;
}

function endTypingTest() {
    typingTest.isActive = false;
    typingTest.endTime = new Date();
    
    clearInterval(typingTest.timer);
    
    // Play end sound (2 beeps)
    playDoubleBeep(800);
    
    const input = document.getElementById('typingInput');
    const startBtn = document.getElementById('startTypingBtn');
    
    input.disabled = true;
    startBtn.textContent = 'Start Test';
    startBtn.disabled = false;
    
    showResults();
}

function showResults() {
    const elapsed = (typingTest.endTime - typingTest.startTime) / 1000 / 60;
    const correctChars = typingTest.currentIndex - typingTest.errors;
    
    // Calculate WPM based on actual time elapsed, not full 60 seconds
    const wpm = elapsed > 0 ? Math.round((correctChars / 5) / elapsed) : 0;
    const accuracy = typingTest.currentIndex > 0 ? Math.round((correctChars / typingTest.currentIndex) * 100) : 100;
    
    document.getElementById('finalWPM').textContent = wpm;
    document.getElementById('finalAccuracy').textContent = accuracy + '%';
    document.getElementById('correctChars').textContent = correctChars;
    document.getElementById('totalChars').textContent = typingTest.currentIndex;
    
    document.getElementById('typingResults').style.display = 'block';
    
    // Save to localStorage
    const stats = JSON.parse(localStorage.getItem('typing-stats') || '[]');
    stats.push({
        date: new Date().toISOString(),
        wpm: wpm,
        accuracy: accuracy,
        difficulty: document.getElementById('difficultySelect').value,
        timeElapsed: Math.round(elapsed * 60)
    });
    localStorage.setItem('typing-stats', JSON.stringify(stats.slice(-10))); // Keep last 10 results
}

function resetTypingTest(hideResults = true) {
    typingTest.isActive = false;
    typingTest.currentIndex = 0;
    typingTest.errors = 0;
    typingTest.startTime = null;
    typingTest.endTime = null;
    
    clearInterval(typingTest.timer);
    
    const input = document.getElementById('typingInput');
    const startBtn = document.getElementById('startTypingBtn');
    
    input.disabled = true;
    input.value = '';
    startBtn.textContent = 'Start Test';
    startBtn.disabled = false;
    
    document.getElementById('currentWPM').textContent = '0';
    document.getElementById('currentAccuracy').textContent = '100';
    document.getElementById('timeRemaining').textContent = '60';
    
    if (hideResults) {
        document.getElementById('typingResults').style.display = 'none';
    }
    
    document.querySelectorAll('.char').forEach(char => {
        char.classList.remove('correct', 'incorrect', 'current');
    });
}

// Sound functions
function playSound(frequency, duration, type = 'sine') {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.log('Audio not supported');
    }
}

function playDoubleBeep(frequency) {
    playSound(frequency, 0.1, 'sine');
    setTimeout(() => {
        playSound(frequency, 0.1, 'sine');
    }, 120);
}

// Feedback functionality
function initializeFeedback() {
    const stars = document.querySelectorAll('.star-rating .star');
    const ratingText = document.getElementById('ratingText');
    let selectedRating = 0;
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            updateStarDisplay(selectedRating);
            updateRatingText(selectedRating);
        });
        
        star.addEventListener('mouseover', () => {
            updateStarDisplay(index + 1);
        });
    });
    
    document.querySelector('.star-rating').addEventListener('mouseleave', () => {
        updateStarDisplay(selectedRating);
    });
    
    function updateStarDisplay(rating) {
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }
    
    function updateRatingText(rating) {
        const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        ratingText.textContent = texts[rating] || 'Click to rate';
    }
    
    // Feedback form submission
    document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (selectedRating === 0) {
            alert('Please select a rating');
            return;
        }
        
        const formData = {
            rating: selectedRating,
            category: document.getElementById('feedbackCategory').value,
            title: document.getElementById('feedbackTitle').value,
            message: document.getElementById('feedbackMessage').value
        };
        
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                addFeedbackToList(formData);
                alert('Thank you for your feedback! We appreciate your input.');
                
                // Reset form
                document.getElementById('feedbackForm').reset();
                selectedRating = 0;
                updateStarDisplay(0);
                ratingText.textContent = 'Click to rate';
            } else {
                throw new Error('Failed to save feedback');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            alert('Failed to submit feedback: ' + (error.message || 'Please try again.'));
        }
    });
}

function addFeedbackToList(feedbackData) {
    const feedbackList = document.querySelector('.feedback-list');
    const userName = currentUser ? currentUser.name : 'Anonymous User';
    
    // Create stars HTML
    const starsHtml = Array.from({length: 5}, (_, i) => 
        `<span class="star ${i < feedbackData.rating ? 'filled' : ''}">★</span>`
    ).join('');
    
    // Create new feedback item
    const feedbackItem = document.createElement('div');
    feedbackItem.className = 'feedback-item new-feedback';
    feedbackItem.innerHTML = `
        <div class="feedback-header">
            <div class="user-info">
                <span class="user-name">${userName}</span>
                <div class="user-rating">
                    ${starsHtml}
                </div>
            </div>
            <span class="feedback-date">Just now</span>
        </div>
        <p class="feedback-text">"${feedbackData.message}"</p>
        <div class="feedback-category">
            <span class="category-badge">${feedbackData.category}</span>
        </div>
    `;
    
    // Add to top of list
    feedbackList.insertBefore(feedbackItem, feedbackList.firstChild);
    
    // Add animation
    setTimeout(() => {
        feedbackItem.classList.remove('new-feedback');
    }, 100);
}

// Discover functionality
let publicBlogs = [];

// Load public blogs from API
async function loadPublicBlogs() {
    try {
        const response = await fetch('/api/public-posts', {
            credentials: 'include'
        });
        
        if (response.ok) {
            publicBlogs = await response.json();
            displayPublicBlogs(publicBlogs);
        } else {
            console.error('Failed to load public blogs');
            displayPublicBlogs([]);
        }
    } catch (error) {
        console.error('Error loading public blogs:', error);
        displayPublicBlogs([]);
    }
}

function searchPublicBlogs() {
    try {
        const searchInput = document.getElementById('discoverSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        if (!searchInput || !categoryFilter || !sortFilter) {
            console.error('Search elements not found');
            return;
        }
        
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const sort = sortFilter.value;
        
        console.log('Searching with:', { searchTerm, category, sort, totalBlogs: publicBlogs.length });
        
        let filteredBlogs = publicBlogs.filter(blog => {
            const matchesSearch = !searchTerm || 
                                blog.title.toLowerCase().includes(searchTerm) || 
                                (blog.user_id?.name || '').toLowerCase().includes(searchTerm) ||
                                (blog.content || '').toLowerCase().includes(searchTerm);
            const matchesCategory = !category || (blog.category && blog.category.toLowerCase() === category);
            return matchesSearch && matchesCategory;
        });
        
        // Sort blogs
        if (sort === 'recent') {
            filteredBlogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sort === 'popular') {
            filteredBlogs.sort((a, b) => (b.views || 0) - (a.views || 0));
        } else if (sort === 'oldest') {
            filteredBlogs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        
        console.log('Filtered blogs:', filteredBlogs.length);
        displayPublicBlogs(filteredBlogs);
        
    } catch (error) {
        console.error('Error in searchPublicBlogs:', error);
    }
}

function displayPublicBlogs(blogs) {
    const blogsList = document.getElementById('publicBlogsList');
    
    if (blogs.length === 0) {
        blogsList.innerHTML = '<div class="empty-state">No public blogs found. Be the first to share your story!</div>';
        return;
    }
    
    blogsList.innerHTML = blogs.map(blog => {
        const authorName = blog.user_id?.name || 'Anonymous';
        const tags = blog.tags ? blog.tags.split(',').map(tag => tag.trim()) : [blog.category || 'General'];
        const excerpt = blog.content ? blog.content.substring(0, 200) + '...' : 'No content preview available.';
        
        return `
            <div class="blog-card">
                <div class="blog-header">
                    <h3>${blog.title || 'Untitled'}</h3>
                    <div class="blog-meta">
                        <span class="author">by ${authorName}</span>
                        <span class="date">${formatDate(blog.created_at)}</span>
                    </div>
                </div>
                <div class="blog-excerpt">
                    ${excerpt}
                </div>
                <div class="blog-footer">
                    <div class="blog-stats">
                        <span><i class="fas fa-eye"></i> ${blog.views || 0} views</span>
                        <span><i class="fas fa-heart"></i> ${blog.likes || 0} likes</span>
                        <span><i class="fas fa-comment"></i> ${blog.comments || 0} comments</span>
                    </div>
                    <div class="blog-tags">
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <button onclick="viewBlog('${blog._id || blog.id}')" class="btn btn-secondary">
                    <i class="fas fa-book-open"></i> Read More
                </button>
            </div>
        `;
    }).join('');
}

function viewBlog(blogId) {
    const blog = publicBlogs.find(b => (b._id || b.id) === blogId);
    if (!blog) return;
    
    const authorName = blog.user_id?.name || 'Anonymous';
    const tags = blog.tags ? blog.tags.split(',').map(tag => tag.trim()) : [blog.category || 'General'];
    
    document.getElementById('blogViewerTitle').textContent = blog.title || 'Untitled';
    document.getElementById('blogViewerAuthor').textContent = `by ${authorName}`;
    document.getElementById('blogViewerDate').textContent = `Published on ${formatDate(blog.created_at)}`;
    document.getElementById('blogViewerContent').innerHTML = (blog.content || 'No content available.').replace(/\n/g, '<br><br>');
    document.getElementById('likeCount').textContent = blog.likes || 0;
    document.getElementById('blogViewerTags').innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    // Store current blog ID for like functionality
    window.currentViewingBlogId = blogId;
    
    // Load comments for this blog
    loadComments(blogId);
    
    document.getElementById('blogViewerModal').style.display = 'flex';
}

function closeBlogViewer() {
    document.getElementById('blogViewerModal').style.display = 'none';
}

function likeBlog() {
    const likeCount = document.getElementById('likeCount');
    const currentLikes = parseInt(likeCount.textContent);
    likeCount.textContent = currentLikes + 1;
    
    const likeBtn = document.querySelector('.like-btn');
    likeBtn.style.color = '#e91e63';
    likeBtn.innerHTML = '<i class="fas fa-heart"></i> ' + (currentLikes + 1);
}

function shareBlog() {
    const title = document.getElementById('blogViewerTitle').textContent;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        alert('Blog link copied to clipboard!');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

// Initialize discover section
function initializeDiscover() {
    loadPublicBlogs();
    
    // Add search button click listener
    const searchBtn = document.querySelector('.discover-search .btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchPublicBlogs);
    }
    
    // Add search on enter key
    const searchInput = document.getElementById('discoverSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchPublicBlogs();
            }
        });
    }
    
    // Add filter change listeners
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', searchPublicBlogs);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', searchPublicBlogs);
    }
    
    // Initialize blogger search
    const bloggerSearchBtn = document.querySelector('.blogger-search .btn');
    if (bloggerSearchBtn) {
        bloggerSearchBtn.addEventListener('click', searchBloggers);
    }
    
    const bloggerSearchInput = document.getElementById('bloggerSearch');
    if (bloggerSearchInput) {
        bloggerSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBloggers();
            }
        });
    }
    
    const bloggerSortFilter = document.getElementById('bloggerSortFilter');
    if (bloggerSortFilter) {
        bloggerSortFilter.addEventListener('change', searchBloggers);
    }
}

// Comments functionality
let currentBlogComments = [];

async function loadComments(blogId) {
    try {
        const response = await fetch(`/api/posts/${blogId}/comments`);
        if (response.ok) {
            currentBlogComments = await response.json();
            displayComments();
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function displayComments() {
    const commentsList = document.getElementById('commentsList');
    const commentCount = document.getElementById('commentCount');
    
    commentCount.textContent = currentBlogComments.length;
    
    if (currentBlogComments.length === 0) {
        commentsList.innerHTML = '<div class="empty-state">No comments yet. Be the first to comment!</div>';
        return;
    }
    
    commentsList.innerHTML = currentBlogComments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${comment.user?.name || 'Anonymous'}</span>
                <span class="comment-date">${formatDate(comment.created_at)}</span>
            </div>
            <div class="comment-text">${comment.content}</div>
            <div class="comment-actions">
                <button class="comment-action" onclick="replyToComment('${comment._id}')">
                    <i class="fas fa-reply"></i> Reply
                </button>
                ${currentUser && comment.user_id === currentUser._id ? 
                    `<button class="comment-action" onclick="deleteComment('${comment._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>` : ''}
            </div>
            <div id="reply-form-${comment._id}" class="reply-form">
                <textarea placeholder="Write a reply..." rows="2"></textarea>
                <button onclick="submitReply('${comment._id}')" class="btn btn-sm btn-primary">Reply</button>
            </div>
        </div>
    `).join('');
}

async function addComment() {
    const commentInput = document.getElementById('commentInput');
    const content = commentInput.value.trim();
    
    if (!content) {
        alert('Please write a comment');
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/${window.currentViewingBlogId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            const newComment = await response.json();
            currentBlogComments.unshift(newComment);
            displayComments();
            commentInput.value = '';
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

function replyToComment(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    replyForm.style.display = replyForm.style.display === 'block' ? 'none' : 'block';
}

async function submitReply(parentId) {
    const replyForm = document.getElementById(`reply-form-${parentId}`);
    const textarea = replyForm.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`/api/posts/${window.currentViewingBlogId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content, parentId })
        });
        
        if (response.ok) {
            loadComments(window.currentViewingBlogId);
            textarea.value = '';
            replyForm.style.display = 'none';
        }
    } catch (error) {
        console.error('Error submitting reply:', error);
    }
}

// Social functionality
function showSocialTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.social-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Load tab content
    if (tabName === 'following') loadFollowing();
    else if (tabName === 'followers') loadFollowers();
    else if (tabName === 'bookmarks') loadBookmarks();
    else if (tabName === 'notifications') loadNotifications();
}

async function followAuthor() {
    const blog = publicBlogs.find(b => (b._id || b.id) === window.currentViewingBlogId);
    if (!blog || !blog.user_id) return;
    
    // Store in localStorage
    const following = JSON.parse(localStorage.getItem('following') || '[]');
    const authorId = blog.user_id._id || blog.user_id.id;
    const isAlreadyFollowing = following.some(f => f.id === authorId);
    
    if (!isAlreadyFollowing) {
        const authorData = {
            id: authorId,
            name: blog.user_id.name,
            username: blog.user_id.username,
            posts_count: 1,
            followers_count: 0,
            followedAt: new Date().toISOString()
        };
        
        following.push(authorData);
        localStorage.setItem('following', JSON.stringify(following));
    }
    
    try {
        const response = await fetch(`/api/users/${authorId}/follow`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const followBtn = document.querySelector('.follow-btn');
        followBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
        followBtn.style.background = '#28a745';
        
        alert('Now following this author!');
    } catch (error) {
        console.error('Error following user:', error);
        alert('Following saved locally!');
    }
}

async function bookmarkBlog() {
    try {
        const response = await fetch(`/api/posts/${window.currentViewingBlogId}/bookmark`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const bookmarkBtn = document.querySelector('.bookmark-btn');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
            bookmarkBtn.style.background = 'var(--warning-color)';
        }
    } catch (error) {
        console.error('Error bookmarking blog:', error);
    }
}

async function loadFollowing() {
    try {
        // Get following from localStorage as fallback
        const localFollowing = JSON.parse(localStorage.getItem('following') || '[]');
        
        const response = await fetch('/api/social/following', { credentials: 'include' });
        if (response.ok) {
            const following = await response.json();
            displayUsers(following, 'followingList');
        } else {
            // Use localStorage data if API fails
            displayUsers(localFollowing, 'followingList');
        }
    } catch (error) {
        console.error('Error loading following:', error);
        // Fallback to localStorage
        const localFollowing = JSON.parse(localStorage.getItem('following') || '[]');
        displayUsers(localFollowing, 'followingList');
    }
}

async function loadFollowers() {
    try {
        const response = await fetch('/api/social/followers', { credentials: 'include' });
        if (response.ok) {
            const followers = await response.json();
            displayUsers(followers, 'followersList');
        }
    } catch (error) {
        console.error('Error loading followers:', error);
    }
}

function displayUsers(users, containerId) {
    const container = document.getElementById(containerId);
    
    if (users.length === 0) {
        container.innerHTML = '<div class="empty-state">No users found.</div>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <h4>${user.name}</h4>
                    <p class="user-username">@${user.username}</p>
                    <div class="user-stats">
                        ${user.posts_count || 0} posts • ${user.followers_count || 0} followers
                    </div>
                    <div class="follow-date">
                        Following since ${user.followedAt ? new Date(user.followedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                </div>
            </div>
            <div class="user-actions">
                <button onclick="viewBloggerProfile('${user.username}')" class="btn btn-primary">
                    <i class="fas fa-user"></i> View Profile
                </button>
                <button onclick="unfollowUser('${user.id || user._id}')" class="btn btn-secondary">
                    <i class="fas fa-user-minus"></i> Unfollow
                </button>
            </div>
        </div>
    `).join('');
}

async function loadBookmarks() {
    try {
        const response = await fetch('/api/social/bookmarks', { credentials: 'include' });
        if (response.ok) {
            const bookmarks = await response.json();
            displayBookmarks(bookmarks);
        }
    } catch (error) {
        console.error('Error loading bookmarks:', error);
    }
}

function displayBookmarks(bookmarks) {
    const container = document.getElementById('bookmarksList');
    
    if (bookmarks.length === 0) {
        container.innerHTML = '<div class="empty-state">No bookmarked blogs yet.</div>';
        return;
    }
    
    container.innerHTML = bookmarks.map(bookmark => `
        <div class="bookmark-item">
            <h4>${bookmark.title}</h4>
            <p>by ${bookmark.user?.name || 'Anonymous'}</p>
            <p class="bookmark-date">Bookmarked ${formatDate(bookmark.bookmarked_at)}</p>
            <button onclick="viewBlog('${bookmark._id}')" class="btn btn-primary">Read</button>
        </div>
    `).join('');
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/social/notifications', { credentials: 'include' });
        if (response.ok) {
            const notifications = await response.json();
            displayNotifications(notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-state">No notifications yet.</div>';
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}">
            <div class="notification-text">${notif.message}</div>
            <div class="notification-time">${formatDate(notif.created_at)}</div>
        </div>
    `).join('');
}

// Discover tab functionality
function showDiscoverTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.discover-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.discover-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Load tab content
    if (tabName === 'blogs') {
        loadPublicBlogs();
    } else if (tabName === 'bloggers') {
        // Clear previous results
        document.getElementById('bloggersList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Search for Bloggers</h3>
                <p>Enter a name or username to find other bloggers on the platform</p>
            </div>
        `;
    }
}

// Search bloggers functionality
async function searchBloggers() {
    const searchInput = document.getElementById('bloggerSearch');
    const sortFilter = document.getElementById('bloggerSortFilter');
    const bloggersList = document.getElementById('bloggersList');
    
    const query = searchInput.value.trim();
    const sort = sortFilter.value;
    
    if (!query) {
        bloggersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Enter Search Term</h3>
                <p>Please enter a name or username to search for bloggers</p>
            </div>
        `;
        return;
    }
    
    // Show loading
    bloggersList.innerHTML = '<div class="loading">Searching for bloggers...</div>';
    
    try {
        const response = await fetch(`/api/search/bloggers?query=${encodeURIComponent(query)}&sort=${sort}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayBloggers(data.bloggers);
        } else {
            throw new Error('Search failed');
        }
    } catch (error) {
        console.error('Error searching bloggers:', error);
        bloggersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Search Failed</h3>
                <p>Unable to search bloggers. Please check your connection and try again.</p>
            </div>
        `;
    }
}

// Display bloggers search results
function displayBloggers(bloggers) {
    const bloggersList = document.getElementById('bloggersList');
    
    if (bloggers.length === 0) {
        bloggersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>No Bloggers Found</h3>
                <p>Try searching with different keywords or check the spelling</p>
            </div>
        `;
        return;
    }
    
    bloggersList.innerHTML = bloggers.map(blogger => {
        const memberSince = new Date(blogger.member_since).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
        
        const recentPostTitles = blogger.recent_posts.map(post => post.title).join(', ') || 'No recent posts';
        
        return `
            <div class="blogger-card">
                <div class="blogger-header">
                    <div class="blogger-avatar">
                        ${blogger.avatar_initial}
                    </div>
                    <div class="blogger-info">
                        <h3>${blogger.name}</h3>
                        <div class="blogger-username">@${blogger.username}</div>
                    </div>
                </div>
                
                <div class="blogger-stats">
                    <span><i class="fas fa-file-alt"></i> ${blogger.posts_count} posts</span>
                    <span><i class="fas fa-calendar"></i> Since ${memberSince}</span>
                </div>
                
                <div class="blogger-bio">
                    Recent posts: ${recentPostTitles.length > 60 ? recentPostTitles.substring(0, 60) + '...' : recentPostTitles}
                </div>
                
                <div class="blogger-actions">
                    <button onclick="viewBloggerProfile('${blogger.username}')" class="btn btn-primary">
                        <i class="fas fa-user"></i> View Profile
                    </button>
                    <button onclick="followBlogger('${blogger.id}')" class="btn btn-secondary">
                        <i class="fas fa-user-plus"></i> Follow
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// View blogger profile
async function viewBloggerProfile(username) {
    try {
        const response = await fetch(`/api/bloggers/${username}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            showBloggerProfileModal(data.blogger, data.posts);
        } else {
            alert('Failed to load blogger profile');
        }
    } catch (error) {
        console.error('Error loading blogger profile:', error);
        alert('Failed to load blogger profile');
    }
}

// Show blogger profile modal
function showBloggerProfileModal(blogger, posts) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const memberSince = new Date(blogger.member_since).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    modal.innerHTML = `
        <div class="modal-content blogger-profile-modal">
            <div class="blogger-profile-header">
                <div class="blogger-avatar-large">
                    ${blogger.avatar_initial}
                </div>
                <div class="blogger-details">
                    <h2>${blogger.name}</h2>
                    <p class="blogger-username">@${blogger.username}</p>
                    <div class="blogger-stats-row">
                        <span><i class="fas fa-file-alt"></i> ${blogger.posts_count} posts</span>
                        <span><i class="fas fa-calendar"></i> Member since ${memberSince}</span>
                    </div>
                </div>
                <div class="profile-actions">
                    <button onclick="followBlogger('${blogger.id}')" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i> Follow
                    </button>
                    <button onclick="visitBloggerBlog('${blogger.username}')" class="btn btn-secondary">
                        <i class="fas fa-external-link-alt"></i> Visit Blog
                    </button>
                </div>
            </div>
            
            <div class="blogger-posts-section">
                <h3>Recent Posts (${posts.length})</h3>
                <div class="blogger-posts-list">
                    ${posts.length > 0 ? posts.map(post => {
                        const excerpt = post.content ? post.content.substring(0, 100) + '...' : 'No content preview';
                        const date = new Date(post.created_at).toLocaleDateString();
                        
                        return `
                            <div class="blogger-post-item">
                                <h4>${post.title || 'Untitled'}</h4>
                                <p class="post-excerpt">${excerpt}</p>
                                <div class="post-meta">
                                    <span>${date}</span>
                                    <span class="category">${post.category || 'General'}</span>
                                </div>
                            </div>
                        `;
                    }).join('') : '<div class="empty-state">No posts available</div>'}
                </div>
            </div>
            
            <button onclick="closeBloggerProfile()" class="close-modal">×</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    window.currentBloggerModal = modal;
}

// Close blogger profile modal
function closeBloggerProfile() {
    if (window.currentBloggerModal) {
        window.currentBloggerModal.remove();
        window.currentBloggerModal = null;
    }
}

// Follow blogger
async function followBlogger(bloggerId) {
    try {
        // Get current blogger info from search results
        const bloggerCard = document.querySelector(`[onclick*="followBlogger('${bloggerId}')"]`).closest('.blogger-card');
        const bloggerName = bloggerCard.querySelector('h3').textContent;
        const bloggerUsername = bloggerCard.querySelector('.blogger-username').textContent;
        
        // Store in localStorage
        const following = JSON.parse(localStorage.getItem('following') || '[]');
        const isAlreadyFollowing = following.some(f => f.id === bloggerId);
        
        if (!isAlreadyFollowing) {
            const bloggerData = {
                id: bloggerId,
                name: bloggerName,
                username: bloggerUsername.replace('@', ''),
                posts_count: parseInt(bloggerCard.querySelector('[class*="posts"]').textContent.match(/\d+/)[0]) || 0,
                followers_count: 0,
                followedAt: new Date().toISOString()
            };
            
            following.push(bloggerData);
            localStorage.setItem('following', JSON.stringify(following));
        }
        
        const response = await fetch(`/api/users/${bloggerId}/follow`, {
            method: 'POST',
            credentials: 'include'
        });
        
        let isFollowing = !isAlreadyFollowing;
        if (response.ok) {
            const data = await response.json();
            isFollowing = data.following;
        }
        
        // Update all follow buttons for this user
        const followBtns = document.querySelectorAll(`[onclick*="followBlogger('${bloggerId}')"]`);
        followBtns.forEach(btn => {
            if (isFollowing) {
                btn.innerHTML = '<i class="fas fa-user-check"></i> Following';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-success');
            } else {
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-secondary');
            }
        });
        
        alert(isFollowing ? 'Now following this blogger!' : 'Unfollowed blogger');
        
    } catch (error) {
        console.error('Error following blogger:', error);
        alert('Failed to follow blogger');
    }
}

// Visit blogger's public blog
function visitBloggerBlog(username) {
    window.open(`/blog/${username}`, '_blank');
}

// Gamification Functions

// Load gamification data
async function loadGamificationData() {
    try {
        // Use current user data if available, otherwise fetch from API
        if (currentUser) {
            updateGamificationUI(currentUser);
        }
        
        const response = await fetch('/api/gamification/stats', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            updateGamificationUI(data);
        }
    } catch (error) {
        console.error('Error loading gamification data:', error);
        // Fallback to current user data
        if (currentUser) {
            updateGamificationUI(currentUser);
        }
    }
}

// Update gamification UI
function updateGamificationUI(data) {
    // Update level and XP
    const userLevel = document.getElementById('userLevel');
    const xpProgress = document.getElementById('xpProgress');
    const xpText = document.getElementById('xpText');
    
    if (userLevel) userLevel.textContent = data.level || 1;
    if (xpProgress && xpText) {
        const currentXP = data.xp || 0;
        const level = data.level || 1;
        const xpForCurrentLevel = (level - 1) * 100;
        const xpForNextLevel = level * 100;
        const xpProgress_val = currentXP - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const progressPercent = (xpProgress_val / xpNeeded) * 100;
        
        xpProgress.style.width = Math.min(progressPercent, 100) + '%';
        xpText.textContent = `${xpProgress_val} / ${xpNeeded} XP`;
    }
    
    // Update streak
    const currentStreak = document.getElementById('currentStreak');
    const longestStreak = document.getElementById('longestStreak');
    
    if (currentStreak) currentStreak.textContent = data.writing_streak || 0;
    if (longestStreak) longestStreak.textContent = data.longest_streak || 0;
    
    // Update stats
    const totalWordsGamification = document.getElementById('totalWordsGamification');
    const achievementCount = document.getElementById('achievementCount');
    
    if (totalWordsGamification) totalWordsGamification.textContent = (data.total_words || 0).toLocaleString();
    if (achievementCount) achievementCount.textContent = (data.achievements || []).length;
}

// Show gamification tab
function showGamificationTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.gamification-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.gamification-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Load tab content
    if (tabName === 'achievements') loadAchievementsTab();
    else if (tabName === 'leaderboard') loadLeaderboard();
    else if (tabName === 'rewards') loadRewardsTab();
    else if (tabName === 'activities') loadActivitiesTab();
}

// Load achievements tab
async function loadAchievementsTab() {
    try {
        // Use current user data first
        const userAchievements = currentUser ? currentUser.achievements : [];
        displayAchievements(userAchievements, null);
        
        // Then try to fetch updated data
        const response = await fetch('/api/gamification/stats', { credentials: 'include' });
        if (response.ok) {
            const stats = await response.json();
            displayAchievements(stats.achievements, null);
        }
    } catch (error) {
        console.error('Error loading achievements:', error);
        // Fallback to current user data
        const userAchievements = currentUser ? currentUser.achievements : [];
        displayAchievements(userAchievements, null);
    }
}

// Display achievements
function displayAchievements(unlockedAchievements, allAchievements) {
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (!achievementsGrid) return;
    
    const achievements = {
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
    
    achievementsGrid.innerHTML = Object.entries(achievements).map(([id, achievement]) => {
        const isUnlocked = (unlockedAchievements || []).includes(id);
        
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-xp">+${achievement.xp} XP</div>
            </div>
        `;
    }).join('');
}

// Load leaderboard
async function loadLeaderboard() {
    const type = document.getElementById('leaderboardType').value;
    
    try {
        const response = await fetch(`/api/gamification/leaderboard?type=${type}&limit=10`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayLeaderboard(data.leaderboard, type);
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Display leaderboard
function displayLeaderboard(leaderboard, type) {
    const leaderboardList = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="empty-state">No data available</div>';
        return;
    }
    
    leaderboardList.innerHTML = leaderboard.map(user => {
        const isTop3 = user.rank <= 3;
        
        return `
            <div class="leaderboard-item">
                <div class="leaderboard-rank ${isTop3 ? 'top-3' : ''}">
                    ${user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank}
                </div>
                <div class="leaderboard-user">
                    <div class="leaderboard-name">${user.name}</div>
                    <div class="leaderboard-username">@${user.username}</div>
                </div>
                <div class="leaderboard-stats">
                    <div class="leaderboard-stat">
                        <span class="leaderboard-stat-value">${getStatValue(user, type)}</span>
                        <span class="leaderboard-stat-label">${getStatLabel(type)}</span>
                    </div>
                    <div class="leaderboard-stat">
                        <span class="leaderboard-stat-value">Lv.${user.level}</span>
                        <span class="leaderboard-stat-label">Level</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get stat value for leaderboard
function getStatValue(user, type) {
    switch (type) {
        case 'xp': return user.xp.toLocaleString();
        case 'streak': return user.writing_streak;
        case 'posts': return user.posts_count;
        case 'words': return user.total_words.toLocaleString();
        default: return user.xp.toLocaleString();
    }
}

// Get stat label for leaderboard
function getStatLabel(type) {
    switch (type) {
        case 'xp': return 'XP';
        case 'streak': return 'Streak';
        case 'posts': return 'Posts';
        case 'words': return 'Words';
        default: return 'XP';
    }
}

// Load rewards tab
function loadRewardsTab() {
    if (!currentUser) return;
    
    const unlockedThemes = currentUser.unlocked_themes || ['default'];
    const themesGrid = document.getElementById('themesGrid');
    
    // Update theme cards
    const themeCards = themesGrid.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        const theme = card.dataset.theme;
        if (unlockedThemes.includes(theme)) {
            card.classList.add('unlocked');
            const requirement = card.querySelector('.theme-requirement');
            if (requirement) {
                requirement.textContent = 'Unlocked';
                requirement.style.color = '#ffd700';
            }
        }
    });
}

// Load activities tab
async function loadActivitiesTab() {
    try {
        const response = await fetch('/api/gamification/activities', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            displayActivities(data.activities);
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Display activities
function displayActivities(activities) {
    const activitiesList = document.getElementById('activitiesList');
    
    if (activities.length === 0) {
        activitiesList.innerHTML = '<div class="empty-state">No recent activities</div>';
        return;
    }
    
    activitiesList.innerHTML = activities.map(activity => {
        const date = new Date(activity.created_at).toLocaleDateString();
        
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-description">${activity.description || activity.activity_type}</div>
                    <div class="activity-time">${date}</div>
                </div>
                <div class="activity-xp">+${activity.xp_earned} XP</div>
            </div>
        `;
    }).join('');
}

// Unlock theme
async function unlockTheme(theme) {
    try {
        const response = await fetch('/api/gamification/unlock-theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ theme })
        });
        
        if (response.ok) {
            alert('Theme unlocked successfully!');
            loadRewardsTab();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to unlock theme');
        }
    } catch (error) {
        console.error('Error unlocking theme:', error);
        alert('Failed to unlock theme');
    }
}

// Show XP gain popup
function showXPGain(xp) {
    const popup = document.createElement('div');
    popup.className = 'xp-gain-popup';
    popup.textContent = `+${xp} XP`;
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 2000);
}

// Show achievement unlock notification
function showAchievementUnlock(achievementId, achievementData) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-unlock-content">
            <i class="${achievementData.icon}"></i>
            <h3>Achievement Unlocked!</h3>
            <h4>${achievementData.name}</h4>
            <p>${achievementData.description}</p>
            <div class="xp-reward">+${achievementData.xp} XP</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Update streak display
function updateStreakDisplay() {
    const streak = calculateWritingStreak();
    
    // Update all streak displays
    const streakElements = [
        document.getElementById('streakDays'),
        document.getElementById('currentStreak'),
        document.getElementById('profileStreak')
    ];
    
    streakElements.forEach(el => {
        if (el) el.textContent = streak;
    });
    
    // Update streak message
    const streakMessage = document.getElementById('streakMessage');
    if (streakMessage) {
        if (streak === 0) {
            streakMessage.textContent = 'Start writing to build your streak!';
        } else if (streak === 1) {
            streakMessage.textContent = 'Great start! Keep it going!';
        } else {
            streakMessage.textContent = `Amazing! ${streak} days in a row!`;
        }
    }
    
    // Update streak badge
    const streakBadge = document.getElementById('streakBadge');
    if (streakBadge) {
        streakBadge.textContent = `${streak} Day Streak`;
    }
}

// Initialize gamification when dashboard loads
function initializeGamification() {
    console.log('Initializing gamification...');
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
        console.log('Loading gamification data...');
        loadGamificationData();
        
        // Add theme card click listeners
        document.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                if (!card.classList.contains('unlocked')) {
                    unlockTheme(theme);
                }
            });
        });
        
        // Test display with mock data if no user data
        if (!currentUser || (!currentUser.xp && !currentUser.level)) {
            console.log('No gamification data found, using defaults');
            updateGamificationUI({
                xp: 5,
                level: 1,
                writing_streak: 0,
                longest_streak: 0,
                total_words: 0,
                achievements: []
            });
        }
    }, 500);
}

// Unfollow user function
async function unfollowUser(userId) {
    try {
        // Remove from localStorage
        const following = JSON.parse(localStorage.getItem('following') || '[]');
        const updatedFollowing = following.filter(f => f.id !== userId);
        localStorage.setItem('following', JSON.stringify(updatedFollowing));
        
        // Try API call
        const response = await fetch(`/api/users/${userId}/follow`, {
            method: 'POST',
            credentials: 'include'
        });
        
        alert('Unfollowed successfully!');
        
        // Reload following list
        loadFollowing();
        
    } catch (error) {
        console.error('Error unfollowing user:', error);
        alert('Unfollowed locally!');
        loadFollowing();
    }
}

// Logout functionality
async function handleLogout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/';
        } else {
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}