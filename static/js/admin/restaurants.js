// Handle restaurant management functionality

// Function to manage menu items
function manageMenuItems(restaurantId) {
    window.location.href = `/admin/restaurants/${restaurantId}/menu-items`;
}

function editRestaurant(restaurantId) {
    fetch(`/api/admin/restaurants/${restaurantId}`)
        .then(response => response.json())
        .then(restaurant => {
            // Populate the edit modal with restaurant data
            const editModal = new bootstrap.Modal(document.getElementById('editRestaurantModal'));
            const form = document.getElementById('editRestaurantForm');
            
            // Set form action
            form.action = `/api/admin/restaurants/${restaurantId}`;
            
            // Populate form fields
            form.querySelector('[name="name"]').value = restaurant.name;
            form.querySelector('[name="description"]').value = restaurant.description;
            form.querySelector('[name="cuisine_type"]').value = restaurant.cuisine_type;
            form.querySelector('[name="delivery_fee"]').value = restaurant.delivery_fee;
            form.querySelector('[name="delivery_time_min"]').value = restaurant.delivery_time_min;
            form.querySelector('[name="delivery_time_max"]').value = restaurant.delivery_time_max;
            form.querySelector('[name="price_range"]').value = restaurant.price_range;
            form.querySelector('[name="image_url"]').value = restaurant.image_url;
            form.querySelector('[name="is_active"]').checked = restaurant.is_active;
            
            // Update image preview if available
            const imagePreview = document.getElementById('editImagePreview');
            if (restaurant.image_url) {
                imagePreview.src = restaurant.image_url;
                imagePreview.style.display = 'block';
            } else {
                imagePreview.src = 'https://via.placeholder.com/200x200?text=No+Image';
                imagePreview.style.display = 'block';
            }
            
            // Show the modal
            editModal.show();
        })
        .catch(error => {
            console.error('Error fetching restaurant details:', error);
            alert('Error loading restaurant details');
        });
}

// Handle image URL changes for preview
function updateImagePreview(input, previewId) {
    const preview = document.getElementById(previewId);
    const imageUrl = input.value.trim();
    
    if (imageUrl) {
        preview.src = imageUrl;
        preview.style.display = 'block';
    } else {
        preview.src = 'https://via.placeholder.com/200x200?text=No+Image';
        preview.style.display = 'block';
    }
}

// Handle form submission for editing restaurant
document.getElementById('editRestaurantForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    // Convert numeric fields
    data.delivery_time_min = parseInt(data.delivery_time_min);
    data.delivery_time_max = parseInt(data.delivery_time_max);
    data.delivery_fee = parseFloat(data.delivery_fee);
    data.is_active = formData.has('is_active');
    
    fetch(this.action, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Error updating restaurant');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating restaurant');
    });
});

// Initialize image preview handlers
document.addEventListener('DOMContentLoaded', function() {
    const addImageUrl = document.querySelector('#addRestaurantForm [name="image_url"]');
    const editImageUrl = document.querySelector('#editRestaurantForm [name="image_url"]');
    
    if (addImageUrl) {
        addImageUrl.addEventListener('input', () => updateImagePreview(addImageUrl, 'addImagePreview'));
    }
    
    if (editImageUrl) {
        editImageUrl.addEventListener('input', () => updateImagePreview(editImageUrl, 'editImagePreview'));
    }

    // Add menu items button to each restaurant row
    const actionCells = document.querySelectorAll('table tbody tr td:last-child');
    actionCells.forEach(cell => {
        const restaurantId = cell.querySelector('.btn-outline-primary').onclick.toString()
            .match(/editRestaurant\((\d+)\)/)[1];
        
        const menuButton = document.createElement('button');
        menuButton.className = 'btn btn-sm btn-outline-success me-1';
        menuButton.innerHTML = '<i class="fas fa-utensils"></i>';
        menuButton.onclick = () => manageMenuItems(restaurantId);
        menuButton.title = 'Manage Menu Items';
        
        // Insert the menu button before the edit button
        cell.insertBefore(menuButton, cell.firstChild);
    });
});