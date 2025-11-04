let selectedPlan = null;
let selectedBilling = 'monthly';
let planPrice = 0;

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    // Add page load animation
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.body.style.transition = 'all 0.6s ease-out';
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
    
    loadPlanDetails();
    initializeFormValidation();
    initializePaymentTabs();
    checkAuth();
    
    // Add hover animations to UPI apps
    const upiApps = document.querySelectorAll('.upi-app');
    upiApps.forEach((app, index) => {
        app.style.animationDelay = `${0.1 * index}s`;
        app.style.animation = 'fadeInUp 0.6s ease-out both';
        
        app.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.1) rotate(2deg)';
        });
        
        app.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1) rotate(0deg)';
        });
    });
    
    // Add form field animations
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
            this.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2), 0 4px 15px rgba(0,0,0,0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '';
        });
    });
});

// Initialize payment method tabs
function initializePaymentTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const paymentSections = document.querySelectorAll('.payment-section');
    
    // Add staggered animation to tabs
    tabBtns.forEach((btn, index) => {
        btn.style.animationDelay = `${0.1 * index}s`;
        btn.style.animation = 'slideInUp 0.6s ease-out both';
        
        btn.addEventListener('click', function() {
            const method = this.dataset.method;
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Update active tab with animation
            tabBtns.forEach(tab => {
                tab.classList.remove('active');
                if (tab !== this) {
                    tab.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        tab.style.transform = '';
                    }, 200);
                }
            });
            this.classList.add('active');
            
            // Hide current sections with fade out
            paymentSections.forEach(section => {
                if (section.classList.contains('active')) {
                    section.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        section.classList.remove('active');
                        section.style.animation = '';
                    }, 300);
                }
            });
            
            // Show new section with delay
            setTimeout(() => {
                const newSection = document.getElementById(method + 'Payment');
                newSection.classList.add('active');
                newSection.style.animation = 'slideInFade 0.5s ease-out';
            }, 300);
        });
    });
    
    // Add CSS for new animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

// Handle UPI payment confirmation
function confirmUPIPayment() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    const transactionId = document.getElementById('transactionId').value.trim();
    
    // Validate transaction ID with animation
    if (!transactionId) {
        showAnimatedAlert('Please enter the transaction ID from your payment app', 'warning');
        shakeElement(document.getElementById('transactionId'));
        return;
    }
    
    if (transactionId.length < 8) {
        showAnimatedAlert('Please enter a valid transaction ID (minimum 8 characters)', 'warning');
        shakeElement(document.getElementById('transactionId'));
        return;
    }
    
    // Show loading state with animation
    btn.disabled = true;
    btn.style.transform = 'scale(0.98)';
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    // Add ripple effect
    addRippleEffect(btn);
    
    setTimeout(() => {
        // Simulate successful payment
        btn.innerHTML = '<i class="fas fa-check"></i> Payment Done!';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        showAnimatedAlert('Payment successful! Your subscription has been activated.', 'success');
        
        // Store subscription in localStorage
        localStorage.setItem('subscription', JSON.stringify({
            plan: selectedPlan,
            billing: selectedBilling,
            price: planPrice,
            status: 'active',
            activatedAt: new Date().toISOString()
        }));
        
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
    }, 1000);
}

// Handle Bank Transfer confirmation
function confirmBankTransfer() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.style.transform = 'scale(0.98)';
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Add ripple effect
    addRippleEffect(btn);
    
    setTimeout(() => {
        // Simulate successful payment
        btn.innerHTML = '<i class="fas fa-check"></i> Payment Done!';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        showAnimatedAlert('Payment successful! Your subscription has been activated.', 'success');
        
        // Store subscription in localStorage
        localStorage.setItem('subscription', JSON.stringify({
            plan: selectedPlan,
            billing: selectedBilling,
            price: planPrice,
            status: 'active',
            activatedAt: new Date().toISOString()
        }));
        
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
    }, 1000);
}

// Copy UPI ID function
function copyUPIId() {
    const upiId = '9682146011@superyes';
    const btn = event.target.closest('.copy-btn');
    
    navigator.clipboard.writeText(upiId).then(() => {
        // Animate button
        btn.style.transform = 'scale(0.9)';
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        
        showAnimatedAlert('UPI ID copied to clipboard!', 'success');
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i>';
            btn.style.background = '';
            btn.style.transform = '';
        }, 2000);
    }).catch(() => {
        showAnimatedAlert('Failed to copy UPI ID', 'error');
    });
}

// Pay Now UPI function
function payNowUPI() {
    const btn = event.target;
    const upiId = '9682146011@superyes';
    const amount = Math.round(planPrice * 83); // Convert USD to INR
    const note = 'BlogPad Subscription Payment';
    
    // Animate button
    btn.style.transform = 'scale(0.95)';
    addRippleEffect(btn);
    
    const upiLink = `upi://pay?pa=${upiId}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
    
    // Try to open UPI app
    window.location.href = upiLink;
    
    // Show animated message
    showAnimatedAlert('Opening UPI app...', 'info');
    
    // Fallback message
    setTimeout(() => {
        showAnimatedAlert('If UPI app did not open, please copy the UPI ID and pay manually.', 'warning');
        btn.style.transform = '';
    }, 2000);
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/auth/user', { credentials: 'include' });
        const data = await response.json();
        
        if (!data.user) {
            window.location.href = '/';
            return;
        }
    } catch (error) {
        window.location.href = '/';
    }
}

// Load plan details from URL parameters
function loadPlanDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    selectedPlan = urlParams.get('plan') || 'premium';
    selectedBilling = urlParams.get('billing') || 'monthly';
    planPrice = parseFloat(urlParams.get('price')) || 9;
    
    const planName = document.getElementById('planName');
    const planPriceEl = document.getElementById('planPrice');
    const totalPrice = document.getElementById('totalPrice');
    const planFeatures = document.getElementById('planFeatures');
    const bankAmount = document.getElementById('bankAmount');
    
    if (planName) {
        planName.textContent = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1) + ' Plan';
        // Add typing animation
        animateText(planName);
    }
    
    if (planPriceEl) {
        planPriceEl.textContent = `$${planPrice}.00/${selectedBilling}`;
        animateNumber(planPriceEl, planPrice);
    }
    
    if (totalPrice) {
        totalPrice.textContent = `$${planPrice}.00`;
        animateNumber(totalPrice, planPrice);
    }
    
    // Update UPI amount (convert USD to INR approximately)
    const upiAmount = document.getElementById('upiAmount');
    if (upiAmount) {
        const inrAmount = Math.round(planPrice * 83); // Approximate USD to INR conversion
        upiAmount.textContent = inrAmount;
        animateNumber(upiAmount, inrAmount);
    }
    
    // Update bank amount
    if (bankAmount) {
        const inrAmount = Math.round(planPrice * 83);
        bankAmount.textContent = inrAmount;
        animateNumber(bankAmount, inrAmount);
    }
    
    if (planFeatures) {
        const features = {
            premium: [
                '100 posts per month',
                'Unlimited total posts',
                'Priority support',
                'Advanced analytics'
            ],
            business: [
                'Unlimited posts',
                'Multiple authors',
                'White-label options',
                '24/7 phone support',
                'Custom integrations'
            ]
        };
        
        planFeatures.innerHTML = `
            <ul>
                ${features[selectedPlan].map((feature, index) => 
                    `<li style="animation: fadeInLeft 0.6s ease-out ${0.1 * index}s both">${feature}</li>`
                ).join('')}
            </ul>
        `;
    }
}

// Animate text typing effect
function animateText(element) {
    const text = element.textContent;
    element.textContent = '';
    let i = 0;
    
    const typeWriter = () => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    };
    
    setTimeout(typeWriter, 500);
}

// Animate number counting
function animateNumber(element, targetNumber) {
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (targetNumber - start) * progress);
        
        if (element.id === 'upiAmount' || element.id === 'bankAmount') {
            element.textContent = current;
        } else {
            element.textContent = `$${current}.00${element.textContent.includes('/') ? '/' + selectedBilling : ''}`;
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    setTimeout(() => requestAnimationFrame(animate), 800);
}

// Initialize form validation and formatting
function initializeFormValidation() {
    const cardNumber = document.getElementById('cardNumber');
    const expiryDate = document.getElementById('expiryDate');
    const cvv = document.getElementById('cvv');
    const paymentForm = document.getElementById('paymentForm');
    
    // Format card number
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Format expiry date
    if (expiryDate) {
        expiryDate.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Format CVV
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Handle form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }
}

// Handle payment submission
async function handlePayment(e) {
    e.preventDefault();
    
    const payBtn = document.getElementById('payBtn');
    const errorDiv = document.getElementById('paymentError');
    
    // Clear previous errors
    errorDiv.textContent = '';
    
    // Get form data
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const zipCode = document.getElementById('zipCode').value;
    
    // Validate form
    if (!validatePaymentForm(cardNumber, expiryDate, cvv, cardName, address, city, zipCode)) {
        return;
    }
    
    // Disable button and show loading
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const response = await fetch('/api/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                plan: selectedPlan,
                billing_cycle: selectedBilling,
                payment_method: 'card',
                card_details: {
                    number: cardNumber,
                    expiry: expiryDate,
                    cvv: cvv,
                    name: cardName
                },
                billing_address: {
                    address: address,
                    city: city,
                    zip_code: zipCode
                }
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Payment successful
            showSuccessMessage();
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 3000);
        } else {
            errorDiv.textContent = data.error || 'Payment failed. Please try again.';
        }
    } catch (error) {
        console.error('Payment error:', error);
        errorDiv.textContent = 'Payment processing failed. Please try again.';
    } finally {
        // Re-enable button
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-lock"></i> Pay Securely';
    }
}

// Validate payment form
function validatePaymentForm(cardNumber, expiryDate, cvv, cardName, address, city, zipCode) {
    const errorDiv = document.getElementById('paymentError');
    
    if (!cardNumber || cardNumber.length < 13) {
        errorDiv.textContent = 'Please enter a valid card number';
        return false;
    }
    
    if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) {
        errorDiv.textContent = 'Please enter a valid expiry date (MM/YY)';
        return false;
    }
    
    if (!cvv || cvv.length < 3) {
        errorDiv.textContent = 'Please enter a valid CVV';
        return false;
    }
    
    if (!cardName.trim()) {
        errorDiv.textContent = 'Please enter the cardholder name';
        return false;
    }
    
    if (!address.trim() || !city.trim() || !zipCode.trim()) {
        errorDiv.textContent = 'Please fill in all billing address fields';
        return false;
    }
    
    return true;
}

// Show success message
function showSuccessMessage() {
    const container = document.querySelector('.payment-container');
    container.innerHTML = `
        <div class="success-message">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Payment Successful!</h2>
            <p>Your ${selectedPlan} subscription has been activated.</p>
            <p>Redirecting to dashboard...</p>
        </div>
    `;
}

// Go back to dashboard
function goBack() {
    const container = document.querySelector('.payment-container');
    container.style.animation = 'slideOutDown 0.5s ease-in';
    setTimeout(() => {
        window.location.href = '/dashboard';
    }, 500);
}

// Utility functions for animations
function showAnimatedAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.animated-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `animated-alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas ${getAlertIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="alert-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        animation: slideInRight 0.5s ease-out;
        max-width: 400px;
        font-weight: 600;
    `;
    
    // Set colors based on type
    const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    };
    
    alert.style.background = colors[type];
    alert.style.color = 'white';
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => alert.remove(), 500);
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

function addRippleEffect(button) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (rect.width / 2 - size / 2) + 'px';
    ripple.style.top = (rect.height / 2 - size / 2) + 'px';
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Add additional CSS animations
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes slideOutDown {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(50px);
        }
    }
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .alert-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .alert-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s;
    }
    
    .alert-close:hover {
        background: rgba(255,255,255,0.2);
    }
`;
document.head.appendChild(additionalStyles);