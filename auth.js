// Auth page functionality
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');
const authTabs = document.querySelectorAll('.auth-tab');

// Tab switching
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update active tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding form
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('signupForm').classList.remove('active');
        
        if (tabName === 'login') {
            document.getElementById('loginForm').classList.add('active');
        } else {
            document.getElementById('signupForm').classList.add('active');
        }
    });
});

// Login
if (loginFormElement) {
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        showMessage(loginMessage, 'Logging in...', 'info');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            showMessage(loginMessage, error.message, 'error');
        } else {
            showMessage(loginMessage, 'Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'library.html';
            }, 1000);
        }
    });
}

// Signup
if (signupFormElement) {
    signupFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        
        if (password !== passwordConfirm) {
            showMessage(signupMessage, 'Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage(signupMessage, 'Password must be at least 6 characters', 'error');
            return;
        }
        
        showMessage(signupMessage, 'Creating account...', 'info');
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) {
            showMessage(signupMessage, error.message, 'error');
        } else {
            showMessage(signupMessage, 'Account created! Please check your email to verify.', 'success');
            setTimeout(() => {
                // Switch to login tab
                document.querySelector('[data-tab="login"]').click();
            }, 3000);
        }
    });
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `auth-message ${type}`;
    element.style.display = 'block';
}
