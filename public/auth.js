// DOM elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const userSection = document.getElementById('userSection');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuthStatus();
    
    // Event listeners for form switching
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showRegistrationForm();
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    // Form submit handlers
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/user', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.user) {
            // User is logged in
            showUserSection(data.user);
        } else {
            // User is not logged in
            showLoginForm();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    if (loginSection) loginSection.style.display = 'block';
    if (registerSection) registerSection.style.display = 'none';
    if (userSection) userSection.style.display = 'none';
}

// Show registration form
function showRegistrationForm() {
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'block';
    if (userSection) userSection.style.display = 'none';
}

// Show user section
function showUserSection(user) {
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'none';
    if (userSection) userSection.style.display = 'block';
    
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = user.name;
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.textContent = '';
    
    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password';
        return;
    }
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Redirect to dashboard on successful login
            window.location.href = '/dashboard';
        } else {
            errorDiv.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Login failed. Please try again.';
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    
    errorDiv.textContent = '';
    
    if (!name || !username || !email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters long';
        return;
    }
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name, username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Redirect to dashboard on successful registration
            window.location.href = '/dashboard';
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Registration failed. Please try again.';
    }
}

// Handle logout
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