// Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeBillingToggle();
    initializePlanButtons();
    initializeMobileMenu();
    initializeScrollEffects();
});

// Billing Toggle (Monthly/Yearly)
function initializeBillingToggle() {
    const billingToggle = document.getElementById('billingToggle');
    const monthlyLabels = document.querySelectorAll('.monthly-label');
    const yearlyLabels = document.querySelectorAll('.yearly-label');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');

    if (billingToggle) {
        billingToggle.addEventListener('change', function() {
            const isYearly = this.checked;
            
            // Toggle label active states
            monthlyLabels.forEach(label => {
                label.classList.toggle('active', !isYearly);
            });
            yearlyLabels.forEach(label => {
                label.classList.toggle('active', isYearly);
            });
            
            // Toggle price visibility
            monthlyPrices.forEach(price => {
                price.style.display = isYearly ? 'none' : 'inline';
            });
            yearlyPrices.forEach(price => {
                price.style.display = isYearly ? 'inline' : 'none';
            });
            
            // Update plan button prices
            updatePlanButtonPrices(isYearly);
        });
    }
}

// Update plan button prices based on billing cycle
function updatePlanButtonPrices(isYearly) {
    const planButtons = document.querySelectorAll('.plan-button');
    
    planButtons.forEach(button => {
        const plan = button.dataset.plan;
        const monthlyPrice = parseInt(button.dataset.price);
        
        if (plan === 'free') return;
        
        const yearlyPrice = Math.round(monthlyPrice * 0.8); // 20% discount
        const price = isYearly ? yearlyPrice : monthlyPrice;
        
        button.dataset.currentPrice = price;
        button.dataset.billingCycle = isYearly ? 'yearly' : 'monthly';
    });
}

// Plan Button Handlers
function initializePlanButtons() {
    const planButtons = document.querySelectorAll('.plan-button');
    
    planButtons.forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.dataset.plan;
            const price = this.dataset.currentPrice || this.dataset.price;
            const billingCycle = this.dataset.billingCycle || 'monthly';
            
            handlePlanSelection(plan, price, billingCycle);
        });
    });
}

// Handle plan selection
function handlePlanSelection(plan, price, billingCycle) {
    if (plan === 'free') {
        // Redirect to registration for free plan
        window.location.href = '/register?plan=free';
        return;
    }
    
    // For paid plans, show subscription modal or redirect to payment
    showSubscriptionModal(plan, price, billingCycle);
}

// Show subscription modal (placeholder for now)
function showSubscriptionModal(plan, price, billingCycle) {
    // This would typically integrate with a payment processor like Stripe
    const message = `You selected the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan at $${price}/${billingCycle}.\n\nRedirecting to secure checkout...`;
    
    if (confirm(message)) {
        // For now, redirect to registration with plan info
        const params = new URLSearchParams({
            plan: plan,
            price: price,
            billing: billingCycle
        });
        window.location.href = `/register?${params.toString()}`;
    }
}

// Mobile Menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
}

// Scroll Effects
function initializeScrollEffects() {
    // Add navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility function to scroll to pricing section
function scrollToPricing() {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
        pricingSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add scrolled class styles
const additionalStyles = `
.navbar.scrolled {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
    .nav-menu.active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border-top: 1px solid var(--border-light);
        padding: 1rem 2rem;
        gap: 1rem;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);