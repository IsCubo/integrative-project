// EventSync Pro - Login Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Login form elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-button');
    const registerLink = document.querySelector('.register-attendee-link');

    // Form validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        return password.length >= 6;
    }

    function showError(input, message) {
        input.classList.add('error');
        let errorDiv = input.parentNode.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            input.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }

    function clearError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }

    // Real-time validation
    emailInput.addEventListener('input', function() {
        if (this.value && !validateEmail(this.value)) {
            showError(this, 'Please enter a valid email address');
        } else {
            clearError(this);
        }
    });

    passwordInput.addEventListener('input', function() {
        if (this.value && !validatePassword(this.value)) {
            showError(this, 'Password must be at least 6 characters long');
        } else {
            clearError(this);
        }
    });

    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        let hasErrors = false;

        // Clear previous errors
        clearError(emailInput);
        clearError(passwordInput);

        // Validate email
        if (!email) {
            showError(emailInput, 'Email is required');
            hasErrors = true;
        } else if (!validateEmail(email)) {
            showError(emailInput, 'Please enter a valid email address');
            hasErrors = true;
        }

        // Validate password
        if (!password) {
            showError(passwordInput, 'Password is required');
            hasErrors = true;
        } else if (!validatePassword(password)) {
            showError(passwordInput, 'Password must be at least 6 characters long');
            hasErrors = true;
        }

        // If no errors, proceed with login
        if (!hasErrors) {
            performLogin(email, password);
        }
    });

    // Login function
    function performLogin(email, password) {
        // Add loading state
        loginButton.classList.add('loading');
        loginButton.disabled = true;

        // Simulate API call
        setTimeout(() => {
            // Mock authentication - replace with actual API call
            if (email === 'admin@eventsync.com' && password === 'admin123') {
                showNotification('Login successful! Redirecting...', 'success');
                // Redirect to dashboard (simulate)
                setTimeout(() => {
                    window.location.href = '#dashboard'; // Replace with actual dashboard URL
                }, 1500);
            } else {
                showNotification('Invalid email or password. Please try again.', 'error');
                loginButton.classList.remove('loading');
                loginButton.disabled = false;
            }
        }, 2000);
    }

    // Register link functionality
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        showNotification('Redirecting to registration page...', 'info');
        // Add navigation logic here
        setTimeout(() => {
            window.location.href = '#register'; // Replace with actual register URL
        }, 1000);
    });

    // Demo credentials helper
    function addDemoCredentials() {
        const demoLink = document.createElement('div');
        demoLink.innerHTML = `
            <div style="text-align: center; margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 8px; border: 1px solid #0ea5e9;">
                <p style="font-size: 0.875rem; color: #0284c7; margin-bottom: 0.5rem; font-weight: 500;">Demo Credentials:</p>
                <p style="font-size: 0.75rem; color: #0369a1; margin: 0;">Email: admin@eventsync.com</p>
                <p style="font-size: 0.75rem; color: #0369a1; margin: 0;">Password: admin123</p>
            </div>
        `;
        
        const formCard = document.querySelector('.login-form-card');
        formCard.appendChild(demoLink);
    }

    // Add demo credentials in development
    addDemoCredentials();

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Enter key to submit form when focused on inputs
        if (e.key === 'Enter' && (emailInput === document.activeElement || passwordInput === document.activeElement)) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // Input focus effects
    const inputs = [emailInput, passwordInput];
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            this.parentNode.classList.remove('focused');
        });
    });
});

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    });

    // Colors based on type
    const colors = {
        info: '#4285f4',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

/**
 * Auto-fill function for demonstration credentials
 * Useful during development, testing, and demonstrations
 * 
 * Included credentials:
 * - Email: admin@eventsync.com
 * - Password: admin123
 * 
 * Usage: EventSyncLogin.autoFillDemoCredentials() from console
 */
function autoFillDemoCredentials() {
    // Find email field by ID and assign test value
    document.getElementById('email').value = 'admin@eventsync.com';
    
    // Find password field by ID and assign test value
    document.getElementById('password').value = 'admin123';
}

/**
 * Expose functions to global scope for testing and debugging
 * 
 * Allows access from:
 * - Browser console: EventSyncLogin.autoFillDemoCredentials()
 * - External scripts: window.EventSyncLogin.showNotification()
 * - Automated testing tools
 * - Development debugging
 */
window.EventSyncLogin = {
    // Function to automatically fill demo credentials
    autoFillDemoCredentials,
    
    // Notification system to display messages to user
    showNotification
};
