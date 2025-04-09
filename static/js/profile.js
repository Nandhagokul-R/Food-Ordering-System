// profile.js - User profile management functionality

// Initialize profile page
function initializeProfile() {
  const profileForm = document.getElementById('profile-form');
  const addressContainer = document.getElementById('address-list');
  const newAddressForm = document.getElementById('new-address-form');
  
  if (profileForm) {
    // Setup profile form submission
    profileForm.addEventListener('submit', function(event) {
      event.preventDefault();
      updateProfile();
    });
  }
  
  if (addressContainer) {
    // Load user addresses
    fetchAddresses();
  }
  
  if (newAddressForm) {
    // Setup new address form submission
    newAddressForm.addEventListener('submit', function(event) {
      event.preventDefault();
      addNewAddress();
    });
  }
}

// Fetch user profile data
function fetchProfile() {
  fetch('/api/profile')
    .then(handleHttpError)
    .then(response => response.json())
    .then(user => {
      // Populate form fields
      document.getElementById('username').value = user.username || '';
      document.getElementById('email').value = user.email || '';
      document.getElementById('first-name').value = user.first_name || '';
      document.getElementById('last-name').value = user.last_name || '';
      document.getElementById('phone-number').value = user.phone_number || '';
    })
    .catch(error => {
      console.error('Error fetching profile:', error);
      showError('Error loading profile data. Please try again later.');
    });
}

// Update user profile
function updateProfile() {
  const email = document.getElementById('email').value;
  const firstName = document.getElementById('first-name').value;
  const lastName = document.getElementById('last-name').value;
  const phoneNumber = document.getElementById('phone-number').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validate inputs
  if (!email || !firstName || !lastName) {
    showError('Please fill in all required fields');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }
  
  // Check password confirmation if a new password is provided
  if (password && password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }
  
  // Prepare profile data
  const profileData = {
    email: email,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber
  };
  
  // Add password only if provided
  if (password) {
    profileData.password = password;
  }
  
  // Show loading state
  const submitButton = document.querySelector('#profile-form button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
  
  // Send update request
  fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    // Show success message
    showSuccess('Profile updated successfully');
    
    // Reset password fields
    document.getElementById('password').value = '';
    document.getElementById('confirm-password').value = '';
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  })
  .catch(error => {
    console.error('Error updating profile:', error);
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  });
}

// Fetch user addresses
function fetchAddresses() {
  const addressContainer = document.getElementById('address-list');
  if (!addressContainer) return;
  
  // Show loading
  addressContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  
  fetch('/api/addresses')
    .then(handleHttpError)
    .then(response => response.json())
    .then(data => {
      if (!data.addresses || data.addresses.length === 0) {
        addressContainer.innerHTML = `
          <div class="alert alert-info">
            You don't have any saved addresses yet. Add an address using the form below.
          </div>
        `;
        return;
      }
      
      // Render addresses
      addressContainer.innerHTML = '';
      
      data.addresses.forEach(address => {
        const addressCard = createAddressCard(address);
        addressContainer.appendChild(addressCard);
      });
      
      // Setup event listeners for edit and delete buttons
      setupAddressControls();
    })
    .catch(error => {
      console.error('Error fetching addresses:', error);
      addressContainer.innerHTML = '<div class="alert alert-danger">Error loading addresses. Please try again later.</div>';
    });
}

// Create address card element
function createAddressCard(address) {
  const card = document.createElement('div');
  card.className = 'card mb-3 address-card';
  card.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6 class="card-title mb-1">
            ${address.address_line1}
            ${address.is_default ? '<span class="badge bg-primary ms-2">Default</span>' : ''}
          </h6>
          ${address.address_line2 ? `<p class="mb-1 small">${address.address_line2}</p>` : ''}
          <p class="mb-0 small">${address.city}, ${address.state} ${address.postal_code}</p>
        </div>
        <div class="btn-group">
          <button type="button" class="btn btn-outline-secondary btn-sm edit-address-btn" data-address-id="${address.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button type="button" class="btn btn-outline-danger btn-sm delete-address-btn" data-address-id="${address.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

// Setup event listeners for address controls
function setupAddressControls() {
  // Edit address buttons
  const editButtons = document.querySelectorAll('.edit-address-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const addressId = this.dataset.addressId;
      editAddress(addressId);
    });
  });
  
  // Delete address buttons
  const deleteButtons = document.querySelectorAll('.delete-address-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const addressId = this.dataset.addressId;
      deleteAddress(addressId);
    });
  });
}

// Edit address
function editAddress(addressId) {
  // Fetch address details
  fetch(`/api/addresses/${addressId}`)
    .then(handleHttpError)
    .then(response => response.json())
    .then(address => {
      // Create edit form modal if it doesn't exist
      if (!document.getElementById('edit-address-modal')) {
        const modalElement = document.createElement('div');
        modalElement.className = 'modal fade';
        modalElement.id = 'edit-address-modal';
        modalElement.tabIndex = '-1';
        modalElement.setAttribute('aria-labelledby', 'edit-address-modal-label');
        modalElement.setAttribute('aria-hidden', 'true');
        
        modalElement.innerHTML = `
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="edit-address-modal-label">Edit Address</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="edit-address-form">
                  <input type="hidden" id="edit-address-id">
                  
                  <div class="mb-3">
                    <label for="edit-address-line1" class="form-label">Address Line 1</label>
                    <input type="text" class="form-control" id="edit-address-line1" required>
                  </div>
                  
                  <div class="mb-3">
                    <label for="edit-address-line2" class="form-label">Address Line 2 (Optional)</label>
                    <input type="text" class="form-control" id="edit-address-line2">
                  </div>
                  
                  <div class="row mb-3">
                    <div class="col">
                      <label for="edit-city" class="form-label">City</label>
                      <input type="text" class="form-control" id="edit-city" required>
                    </div>
                    <div class="col">
                      <label for="edit-state" class="form-label">State</label>
                      <input type="text" class="form-control" id="edit-state" required>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="edit-postal-code" class="form-label">Postal Code</label>
                    <input type="text" class="form-control" id="edit-postal-code" required>
                  </div>
                  
                  <div class="form-check mb-3">
                    <input type="checkbox" class="form-check-input" id="edit-is-default">
                    <label class="form-check-label" for="edit-is-default">Set as default address</label>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="save-address-btn">Save Changes</button>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(modalElement);
        
        // Add event listener to save button
        document.getElementById('save-address-btn').addEventListener('click', function() {
          saveAddressChanges();
        });
      }
      
      // Populate form with address data
      document.getElementById('edit-address-id').value = address.id;
      document.getElementById('edit-address-line1').value = address.address_line1;
      document.getElementById('edit-address-line2').value = address.address_line2 || '';
      document.getElementById('edit-city').value = address.city;
      document.getElementById('edit-state').value = address.state;
      document.getElementById('edit-postal-code').value = address.postal_code;
      document.getElementById('edit-is-default').checked = address.is_default;
      
      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('edit-address-modal'));
      modal.show();
    })
    .catch(error => {
      console.error('Error fetching address details:', error);
      showError('Error loading address details. Please try again later.');
    });
}

// Save address changes
function saveAddressChanges() {
  const addressId = document.getElementById('edit-address-id').value;
  const addressLine1 = document.getElementById('edit-address-line1').value;
  const addressLine2 = document.getElementById('edit-address-line2').value;
  const city = document.getElementById('edit-city').value;
  const state = document.getElementById('edit-state').value;
  const postalCode = document.getElementById('edit-postal-code').value;
  const isDefault = document.getElementById('edit-is-default').checked;
  
  // Validate inputs
  if (!addressLine1 || !city || !state || !postalCode) {
    showError('Please fill in all required fields');
    return;
  }
  
  // Prepare address data
  const addressData = {
    address_line1: addressLine1,
    address_line2: addressLine2,
    city: city,
    state: state,
    postal_code: postalCode,
    is_default: isDefault
  };
  
  // Show loading state
  const saveButton = document.getElementById('save-address-btn');
  const originalButtonText = saveButton.innerHTML;
  saveButton.disabled = true;
  saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
  
  // Send update request
  fetch(`/api/addresses/${addressId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(addressData)
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    // Show success message
    showSuccess('Address updated successfully');
    
    // Hide modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('edit-address-modal'));
    modal.hide();
    
    // Refresh address list
    fetchAddresses();
    
    // Reset button state
    saveButton.disabled = false;
    saveButton.innerHTML = originalButtonText;
  })
  .catch(error => {
    console.error('Error updating address:', error);
    
    // Reset button state
    saveButton.disabled = false;
    saveButton.innerHTML = originalButtonText;
  });
}

// Delete address
function deleteAddress(addressId) {
  if (!confirm('Are you sure you want to delete this address?')) {
    return;
  }
  
  fetch(`/api/addresses/${addressId}`, {
    method: 'DELETE'
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    // Show success message
    showSuccess('Address deleted successfully');
    
    // Refresh address list
    fetchAddresses();
  })
  .catch(error => {
    console.error('Error deleting address:', error);
    showError('Error deleting address. Please try again later.');
  });
}

// Add new address
function addNewAddress() {
  const addressLine1 = document.getElementById('address-line1').value;
  const addressLine2 = document.getElementById('address-line2').value;
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
  const postalCode = document.getElementById('postal-code').value;
  const isDefault = document.getElementById('is-default').checked;
  
  // Validate inputs
  if (!addressLine1 || !city || !state || !postalCode) {
    showError('Please fill in all required fields');
    return;
  }
  
  // Prepare address data
  const addressData = {
    address_line1: addressLine1,
    address_line2: addressLine2,
    city: city,
    state: state,
    postal_code: postalCode,
    is_default: isDefault
  };
  
  // Show loading state
  const submitButton = document.querySelector('#new-address-form button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
  
  // Send create request
  fetch('/api/addresses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(addressData)
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    // Show success message
    showSuccess('Address added successfully');
    
    // Reset form
    document.getElementById('new-address-form').reset();
    
    // Refresh address list
    fetchAddresses();
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  })
  .catch(error => {
    console.error('Error adding address:', error);
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  });
}

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('profile-form')) {
    initializeProfile();
    fetchProfile();
  }
});
