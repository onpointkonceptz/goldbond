// GOLDBOND LABORATORIES - Main JavaScript File

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const dropdown = document.querySelector('.dropdown');
const dropbtn = document.querySelector('.dropbtn');

// Hamburger Menu Toggle
if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close menu when clicking a link (except dropdown button)
document.querySelectorAll('.nav-menu a:not(.dropbtn)').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    });
});

// Mobile dropdown toggle - IMPROVED
if (dropbtn) {
    dropbtn.addEventListener('click', (e) => {
        if (window.innerWidth <= 968) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
        }
    });
}

// Close dropdown when clicking dropdown content links
document.querySelectorAll('.dropdown-content a').forEach(link => {
    link.addEventListener('click', () => {
        if (dropdown) {
            dropdown.classList.remove('active');
        }
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 968) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') {
            e.preventDefault();
            return;
        }
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll Animation for Elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with animation
document.querySelectorAll('.service-item, .benefit, .testimonial-card, .content-card, .feature-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Counter Animation for Stats
const animateCounter = (element, target, duration = 2000) => {
    let start = 0;
    const increment = target / (duration / 16);
    
    const updateCounter = () => {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start).toLocaleString() + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString() + '+';
        }
    };
    
    updateCounter();
};

// Observe stats section
const statsSection = document.querySelector('.stats');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-item h3').forEach(stat => {
                    const target = parseInt(stat.textContent.replace(/\D/g, ''));
                    if (target) {
                        animateCounter(stat, target);
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(statsSection);
}

// Active Navigation Link
const setActiveNav = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        if (linkHref && linkHref.includes(currentPage)) {
            link.classList.add('active');
        }
    });
};

setActiveNav();

// Sticky Header Effect
let lastScroll = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// Form Validation Helpers
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePhone = (phone) => {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Show Notification
const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#D4AF37' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#06b6d4'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        max-width: 400px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
};

// Loading Spinner
const showLoading = () => {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        flex-direction: column;
        gap: 1rem;
    `;
    loader.innerHTML = `
        <div style="
            width: 50px;
            height: 50px;
            border: 5px solid rgba(212, 175, 55, 0.3);
            border-top-color: #D4AF37;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <p style="color: #D4AF37; font-weight: 600; margin: 0;">Loading...</p>
    `;
    document.body.appendChild(loader);
};

const hideLoading = () => {
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
};

// Authentication Helper Functions
const isAuthenticated = () => {
    return !!(localStorage.getItem('authToken') || localStorage.getItem('currentUser'));
};

const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};

const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showNotification('Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.href = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
    }, 1500);
};

// Dashboard Navigation Helper
const redirectToDashboard = () => {
    const isInPages = window.location.pathname.includes('/pages/');
    const dashboardUrl = isInPages ? 'dashboard.html' : 'pages/dashboard.html';
    window.location.href = dashboardUrl;
};

// Check Authentication on Protected Pages
const checkAuthOnProtectedPages = () => {
    const protectedPages = ['dashboard.html', 'results.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !isAuthenticated()) {
        showNotification('Please login to access this page', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
};

// Handle Login Success (Updated to redirect to dashboard)
const handleLoginSuccess = (userData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (userData.token) {
        localStorage.setItem('authToken', userData.token);
    }
    showNotification('Login successful! Redirecting to dashboard...', 'success');
    setTimeout(() => {
        redirectToDashboard();
    }, 1500);
};

// Handle Registration Success
const handleRegistrationSuccess = (userData) => {
    showNotification('Registration successful! Please login.', 'success');
    setTimeout(() => {
        window.location.href = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
    }, 2000);
};

// Update Test Results Button to redirect to dashboard
const updateTestResultsRedirect = () => {
    const testResultsBtns = document.querySelectorAll('.btn-test-results, a[href*="results.html"]');
    testResultsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isAuthenticated()) {
                redirectToDashboard();
            } else {
                showNotification('Please login to view test results', 'warning');
                setTimeout(() => {
                    window.location.href = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
                }, 2000);
            }
        });
    });
};

// Add CSS Animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Dashboard compatibility styles */
    .dashboard-sidebar.open {
        transform: translateX(0) !important;
    }
    
    @media (max-width: 968px) {
        .dashboard-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
    }
`;
document.head.appendChild(style);

// Gallery Lightbox (if on gallery page)
const initGalleryLightbox = () => {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const imgSrc = item.querySelector('img')?.src;
            if (imgSrc) {
                const lightbox = document.createElement('div');
                lightbox.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    cursor: pointer;
                `;
                lightbox.innerHTML = `
                    <img src="${imgSrc}" style="max-width: 90%; max-height: 90%; border-radius: 10px; border: 3px solid #D4AF37;" />
                    <button style="
                        position: absolute;
                        top: 20px;
                        right: 30px;
                        background: #D4AF37;
                        color: white;
                        border: none;
                        font-size: 2rem;
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                `;
                document.body.appendChild(lightbox);
                
                lightbox.addEventListener('click', () => lightbox.remove());
            }
        });
    });
};

// Initialize gallery if on gallery page
if (window.location.pathname.includes('gallery.html')) {
    initGalleryLightbox();
}

// Print functionality for test results
const printResults = () => {
    window.print();
};

// Download results as PDF (basic implementation)
const downloadResults = () => {
    showNotification('Preparing download...', 'success');
    // In production, this would connect to backend to generate PDF
    setTimeout(() => {
        showNotification('Download started!', 'success');
    }, 1000);
};

// Lazy loading for images
document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('GOLDBOND LABORATORIES - Website Initialized');
    
    // Check authentication on protected pages
    checkAuthOnProtectedPages();
    
    // Update test results button redirects
    updateTestResultsRedirect();
    
    // Set minimum date for appointment booking
    const appointmentDateInput = document.getElementById('appointmentDate');
    if (appointmentDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        appointmentDateInput.setAttribute('min', tomorrowStr);
    }
    
    // ✨ MAKE LOGO CLICKABLE - WORKS ON ALL PAGES ✨
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', (e) => {
            // Detect if we're in a subfolder
            const isInPages = window.location.pathname.includes('/pages/');
            const homeUrl = isInPages ? '../index.html' : 'index.html';
            window.location.href = homeUrl;
        });
    }
    
    // Handle login form if present (updated to redirect to dashboard)
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            };
            
            showLoading();
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                hideLoading();
                
                if (response.ok) {
                    const data = await response.json();
                    handleLoginSuccess(data.user);
                } else {
                    const error = await response.json();
                    showNotification(error.message || 'Login failed', 'error');
                }
            } catch (error) {
                hideLoading();
                console.error('Login error:', error);
                showNotification('Unable to login. Please try again later.', 'error');
            }
        });
    }
    
    // Check if already logged in and redirect appropriately
    const checkExistingLogin = () => {
        const currentPage = window.location.pathname.split('/').pop();
        const savedUser = getCurrentUser();
        
        if (savedUser && currentPage === 'login.html') {
            showNotification('You are already logged in. Redirecting to dashboard...', 'success');
            setTimeout(() => {
                redirectToDashboard();
            }, 1500);
        }
    };
    
    checkExistingLogin();
});

// Export functions for use in other scripts
window.GOLDBOND = {
    validateEmail,
    validatePhone,
    showNotification,
    showLoading,
    hideLoading,
    printResults,
    downloadResults,
    isAuthenticated,
    getCurrentUser,
    logout,
    redirectToDashboard,
    handleLoginSuccess,
    handleRegistrationSuccess
};