// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        const resetIcon = () => {
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans[0].style.transform = 'rotate(0deg)';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'rotate(0deg)';
        };

        mobileMenuBtn.addEventListener('click', function() {
            // The shared CSS reveals the menu via the `active` class.
            const isOpen = mobileMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active', isOpen);

            // Animate hamburger icon
            const spans = mobileMenuBtn.querySelectorAll('span');
            if (!isOpen) {
                resetIcon();
            } else {
                spans[0].style.transform = 'rotate(45deg) translate(8px, 8px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(8px, -8px)';
            }
        });

        // Close mobile menu when clicking on a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                resetIcon();
            });
        });
    }
});

// Navbar Scroll Detection
let lastScrollTop = 0;
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', function() {
    if (!navbar) return;
    
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// Smooth scrolling for anchor links
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

// Add animation to elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections and cards
document.querySelectorAll('section, .group, [class*="card"]').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease-in-out';
    observer.observe(el);
});

// Form Handling (for contact forms if not already handled inline)
function setupFormHandlers() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Let the form handle its own submission if it has a specific handler
            if (this.id === 'contact-form') {
                // This is handled inline in contact.html
                return;
            }
        });
    });
}

// Call form setup
setupFormHandlers();

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Scroll to top button functionality
function createScrollToTopButton() {
    const button = document.createElement('button');
    button.id = 'scroll-to-top';
    button.innerHTML = '↑';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background-color: #25D366;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 40;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    document.body.appendChild(button);

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });

    button.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize scroll to top button
createScrollToTopButton();

// Contact Form Specific Validation
function validateContactForm() {
    const fullName = document.getElementById('fullName');
    const phoneNumber = document.getElementById('phoneNumber');
    const nationality = document.getElementById('nationality');
    const serviceType = document.getElementById('serviceType');

    if (!fullName || !phoneNumber || !nationality || !serviceType) {
        return true; // Form elements not found on this page
    }

    let isValid = true;

    // Validate Full Name
    if (!fullName.value.trim()) {
        showFieldError('fullName', 'Full name is required');
        isValid = false;
    } else {
        clearFieldError('fullName');
    }

    // Validate Phone Number
    if (!phoneNumber.value.trim()) {
        showFieldError('phoneNumber', 'Phone number is required');
        isValid = false;
    } else if (!/^\+?[\d\s\-()]{7,}$/.test(phoneNumber.value)) {
        showFieldError('phoneNumber', 'Please enter a valid phone number');
        isValid = false;
    } else {
        clearFieldError('phoneNumber');
    }

    // Validate Nationality
    if (!nationality.value.trim()) {
        showFieldError('nationality', 'Nationality is required');
        isValid = false;
    } else {
        clearFieldError('nationality');
    }

    // Validate Service Type
    if (!serviceType.value) {
        showFieldError('serviceType', 'Please select a service type');
        isValid = false;
    } else {
        clearFieldError('serviceType');
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

function clearFieldError(fieldId) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
        errorEl.classList.add('hidden');
    }
}

// Real-time error clearing on input
['fullName', 'phoneNumber', 'nationality', 'serviceType'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', function() {
            clearFieldError(fieldId);
        });
    }
});

// Blog Filter Animation
function filterBlog(category) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    // Get all article cards
    const cards = grid.querySelectorAll('a');
    
    // Filter cards
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        
        setTimeout(() => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                }, 10);
            } else {
                card.style.display = 'none';
            }
        }, 300);
    });
}

// Add transition to article cards
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('blog-grid');
    if (grid) {
        grid.querySelectorAll('a').forEach(card => {
            card.style.transition = 'opacity 0.3s ease';
        });
    }
});

// Theme Toggle (Optional - for dark mode support)
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Apply theme
    if (newTheme === 'dark') {
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#f1f5f9';
    } else {
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#111827';
    }
}

// Initialize theme on page load
window.addEventListener('load', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

// Performance monitoring (optional)
window.addEventListener('load', function() {
    if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time:', pageLoadTime + 'ms');
    }
});

// Log script loaded
console.log('✓ IKAMETI Static Website - Main Script Loaded');
