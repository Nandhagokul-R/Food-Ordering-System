// auth.js - Authentication functionality

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // Validate inputs
  if (!username || !password) {
    showError('Please enter both username and password');
    return;
  }
  
  // Send login request
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      password
    })
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    // Store user in app state
    appState.user = data.user;
    
    // Show success message
    showSuccess('Login successful! Redirecting...');
    
    // Redirect to home page after successful login
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  })
  .catch(error => {
    console.error('Login error:', error);
  });
}

// Handle registration form submission
function handleRegistration(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const firstName = document.getElementById('first-name').value;
  const lastName = document.getElementById('last-name').value;
  const phoneNumber = document.getElementById('phone-number').value;
  
  // Validate inputs
  if (!username || !email || !password || !confirmPassword || !firstName || !lastName) {
    showError('Please fill in all required fields');
    return;
  }
  
  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  // Validate password strength
  if (password.length < 8) {
    showError('Password must be at least 8 characters long');
    return;
  }
  
  // Send registration request
  fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber
    })
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    // Store user in app state
    appState.user = data.user;
    
    // Show success message
    showSuccess('Registration successful! Redirecting...');
    
    // Redirect to home page after successful registration
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  })
  .catch(error => {
    console.error('Registration error:', error);
  });
}

// Handle logout
function handleLogout() {
  // Send logout request
  fetch('/logout')
    .then(() => {
      // Clear user from app state
      appState.user = null;
      
      // Redirect to home page after successful logout
      window.location.href = '/';
    })
    .catch(error => {
      console.error('Logout error:', error);
    });
}

// Initialize auth forms
document.addEventListener('DOMContentLoaded', function() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Registration form
  const registrationForm = document.getElementById('registration-form');
  if (registrationForm) {
    registrationForm.addEventListener('submit', handleRegistration);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});
