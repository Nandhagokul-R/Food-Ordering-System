// users.js - Admin user management functionality

document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners for edit user buttons
    document.querySelectorAll('.edit-user').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.userId;
            fetchUserDetails(userId);
        });
    });

    // Setup save user changes button
    document.getElementById('saveUserBtn').addEventListener('click', saveUserChanges);
});

// Fetch user details for editing
function fetchUserDetails(userId) {
    fetch(`/api/admin/users/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            return response.json();
        })
        .then(user => {
            // Populate modal form with user details
            document.getElementById('userId').value = user.id;
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('firstName').value = user.first_name || '';
            document.getElementById('lastName').value = user.last_name || '';
            document.getElementById('phoneNumber').value = user.phone_number || '';
            document.getElementById('role').value = user.role;
        })
        .catch(error => {
            console.error('Error fetching user details:', error);
            showError('Failed to load user details. Please try again.');
        });
}

// Save user changes
function saveUserChanges() {
    const userId = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        phone_number: document.getElementById('phoneNumber').value,
        role: document.getElementById('role').value
    };

    // Show loading state
    const saveButton = document.getElementById('saveUserBtn');
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update user');
        }
        return response.json();
    })
    .then(data => {
        // Show success message and reload page
        showSuccess('User updated successfully');
        setTimeout(() => window.location.reload(), 1500);
    })
    .catch(error => {
        console.error('Error updating user:', error);
        showError('Failed to update user. Please try again.');
    })
    .finally(() => {
        // Reset button state
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    });
}

// Show error message
function showError(message) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    document.querySelector('.container').insertAdjacentHTML('afterbegin', alertHtml);
}

// Show success message
function showSuccess(message) {
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    document.querySelector('.container').insertAdjacentHTML('afterbegin', alertHtml);
}