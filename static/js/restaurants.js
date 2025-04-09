// restaurants.js - Restaurant listing and detail functionality

// Fetch restaurants from API with filters
function fetchRestaurants(searchTerm = '') {
  const restaurantList = document.getElementById('restaurant-list');
  if (!restaurantList) return;
  
  // Show loading indicator
  restaurantList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  
  // Build query parameters
  let queryParams = new URLSearchParams();
  
  // Add search term if provided
  if (searchTerm) {
    queryParams.append('search', searchTerm);
  }
  
  // Add cuisine filters
  appState.filters.cuisine.forEach(cuisine => {
    queryParams.append('cuisine', cuisine);
  });
  
  // Add price range filters
  appState.filters.priceRange.forEach(priceRange => {
    queryParams.append('price_range', priceRange);
  });
  
  // Add rating filter
  if (appState.filters.rating > 0) {
    queryParams.append('rating', appState.filters.rating);
  }
  
  // Fetch restaurants from API
  fetch(`/api/restaurants?${queryParams.toString()}`)
    .then(handleHttpError)
    .then(response => response.json())
    .then(data => {
      if (data.restaurants.length === 0) {
        restaurantList.innerHTML = '<div class="alert alert-info">No restaurants found matching your criteria.</div>';
        return;
      }
      
      // Render restaurant cards
      restaurantList.innerHTML = '';
      data.restaurants.forEach(restaurant => {
        const card = createRestaurantCard(restaurant);
        restaurantList.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Error fetching restaurants:', error);
      restaurantList.innerHTML = '<div class="alert alert-danger">Error loading restaurants. Please try again later.</div>';
    });
}

// Create restaurant card element
function createRestaurantCard(restaurant) {
  const card = document.createElement('div');
  card.className = 'col-md-6 col-lg-4 mb-4';
  card.innerHTML = `
    <div class="card h-100 shadow-sm">
      <img src="${restaurant.image_url || 'https://via.placeholder.com/300x200?text=Restaurant'}" 
           class="card-img-top" alt="${restaurant.name}" 
           style="height: 200px; object-fit: cover;">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="card-title mb-0">${restaurant.name}</h5>
          <span class="badge bg-primary">${restaurant.cuisine_type}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="text-warning">
            ${formatRating(restaurant.rating)}
          </div>
          <span class="text-muted">${formatPriceRange(restaurant.price_range)}</span>
        </div>
        <p class="card-text text-muted small">${restaurant.description.substring(0, 100)}${restaurant.description.length > 100 ? '...' : ''}</p>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">${restaurant.delivery_time_min}-${restaurant.delivery_time_max} min</small>
          <small class="text-muted">Delivery: ${formatCurrency(restaurant.delivery_fee)}</small>
        </div>
      </div>
      <div class="card-footer bg-transparent border-top-0">
        <a href="/restaurants/${restaurant.id}" class="btn btn-primary btn-sm w-100">View Menu</a>
      </div>
    </div>
  `;
  return card;
}

// Fetch restaurant detail from API
function fetchRestaurantDetail(restaurantId) {
  const restaurantDetail = document.getElementById('restaurant-detail');
  if (!restaurantDetail) return;
  
  // Show loading indicator
  const menuContainer = document.getElementById('menu-container');
  if (menuContainer) {
    menuContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  }
  
  // Fetch restaurant detail from API
  fetch(`/api/restaurants/${restaurantId}`)
    .then(handleHttpError)
    .then(response => response.json())
    .then(restaurant => {
      // Store current restaurant in app state
      appState.currentRestaurant = restaurant;
      
      // Update restaurant header information
      updateRestaurantHeader(restaurant);
      
      // Render menu categories and items
      renderMenu(restaurant);
    })
    .catch(error => {
      console.error('Error fetching restaurant detail:', error);
      if (menuContainer) {
        menuContainer.innerHTML = '<div class="alert alert-danger">Error loading restaurant menu. Please try again later.</div>';
      }
    });
}

// Update restaurant header information
function updateRestaurantHeader(restaurant) {
  const restaurantName = document.getElementById('restaurant-name');
  const restaurantImage = document.getElementById('restaurant-image');
  const restaurantCuisine = document.getElementById('restaurant-cuisine');
  const restaurantRating = document.getElementById('restaurant-rating');
  const restaurantPrice = document.getElementById('restaurant-price');
  const restaurantDeliveryTime = document.getElementById('restaurant-delivery-time');
  const restaurantDeliveryFee = document.getElementById('restaurant-delivery-fee');
  const restaurantDescription = document.getElementById('restaurant-description');
  
  if (restaurantName) restaurantName.textContent = restaurant.name;
  if (restaurantImage) restaurantImage.src = restaurant.image_url || 'https://via.placeholder.com/800x300?text=Restaurant';
  if (restaurantCuisine) restaurantCuisine.textContent = restaurant.cuisine_type;
  if (restaurantRating) restaurantRating.innerHTML = formatRating(restaurant.rating);
  if (restaurantPrice) restaurantPrice.textContent = formatPriceRange(restaurant.price_range);
  if (restaurantDeliveryTime) restaurantDeliveryTime.textContent = `${restaurant.delivery_time_min}-${restaurant.delivery_time_max} min`;
  if (restaurantDeliveryFee) restaurantDeliveryFee.textContent = formatCurrency(restaurant.delivery_fee);
  if (restaurantDescription) restaurantDescription.textContent = restaurant.description;
}

// Render menu categories and items
function renderMenu(restaurant) {
  const menuContainer = document.getElementById('menu-container');
  if (!menuContainer) return;
  
  // Clear menu container
  menuContainer.innerHTML = '';
  
  // Check if restaurant has menu categories
  if (!restaurant.categories || restaurant.categories.length === 0) {
    menuContainer.innerHTML = '<div class="alert alert-info">No menu items available for this restaurant.</div>';
    return;
  }
  
  // Create category navigation
  const categoryNav = document.createElement('div');
  categoryNav.className = 'category-nav mb-4 sticky-top bg-white py-2 border-bottom';
  categoryNav.innerHTML = `
    <div class="d-flex gap-2 overflow-auto">
      ${restaurant.categories.map(category => `
        <button class="btn btn-outline-primary category-btn" data-category-id="${category.id}">
          ${category.name}
        </button>
      `).join('')}
    </div>
  `;
  menuContainer.appendChild(categoryNav);
  
  // Create menu sections for each category
  restaurant.categories.forEach(category => {
    const categorySection = document.createElement('div');
    categorySection.className = 'menu-category mb-5';
    categorySection.id = `category-${category.id}`;
    
    categorySection.innerHTML = `
      <h3 class="mb-3">${category.name}</h3>
      ${category.description ? `<p class="text-muted mb-4">${category.description}</p>` : ''}
      <div class="row" id="menu-items-${category.id}"></div>
    `;
    
    menuContainer.appendChild(categorySection);
    
    // Add menu items to category
    const menuItemsContainer = document.getElementById(`menu-items-${category.id}`);
    
    if (!category.menu_items || category.menu_items.length === 0) {
      menuItemsContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No items available in this category.</div></div>';
      return;
    }
    
    category.menu_items.forEach(item => {
      const itemCard = createMenuItemCard(item);
      menuItemsContainer.appendChild(itemCard);
    });
  });
  
  // Add event listeners to category navigation buttons
  const categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      const categoryId = this.dataset.categoryId;
      const categorySection = document.getElementById(`category-${categoryId}`);
      
      // Scroll to category section
      categorySection.scrollIntoView({ behavior: 'smooth' });
      
      // Update active category button
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Set first category as active
  if (categoryButtons.length > 0) {
    categoryButtons[0].classList.add('active');
  }
}

// Create menu item card element
function createMenuItemCard(item) {
  const card = document.createElement('div');
  card.className = 'col-md-6 mb-4';
  
  // Prepare dietary tags
  let dietaryTags = [];
  if (item.is_vegetarian) dietaryTags.push('<span class="badge bg-success me-1">Vegetarian</span>');
  if (item.is_vegan) dietaryTags.push('<span class="badge bg-success me-1">Vegan</span>');
  if (item.is_gluten_free) dietaryTags.push('<span class="badge bg-warning me-1">Gluten-Free</span>');
  
  // Prepare spice level indicator
  let spiceLevel = '';
  if (item.spice_level > 0) {
    spiceLevel = '<div class="text-danger">';
    for (let i = 0; i < item.spice_level; i++) {
      spiceLevel += '<i class="fas fa-pepper-hot"></i>';
    }
    spiceLevel += '</div>';
  }
  
  card.innerHTML = `
    <div class="card h-100 menu-item-card" data-item-id="${item.id}">
      <div class="row g-0">
        <div class="col-4">
          <img src="${item.image_url || 'https://via.placeholder.com/150?text=Food'}" 
               class="img-fluid rounded-start h-100" 
               alt="${item.name}" 
               style="object-fit: cover;">
        </div>
        <div class="col-8">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title">${item.name}</h5>
              ${spiceLevel}
            </div>
            <p class="card-text small text-muted">${item.description}</p>
            <div class="d-flex flex-wrap mb-2">
              ${dietaryTags.join('')}
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0">${formatCurrency(item.price)}</h6>
              <button class="btn btn-sm btn-outline-primary add-to-cart-btn" data-item-id="${item.id}">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

// Initialize menu item modal
function initializeMenuItemModal() {
  // Create modal if it doesn't exist
  if (!document.getElementById('menu-item-modal')) {
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = 'menu-item-modal';
    modalElement.tabIndex = '-1';
    modalElement.setAttribute('aria-labelledby', 'menu-item-modal-label');
    modalElement.setAttribute('aria-hidden', 'true');
    
    modalElement.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="menu-item-modal-label">Item Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="menu-item-modal-body">
            <!-- Content will be dynamically inserted here -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="add-to-cart-confirm">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modalElement);
  }
}

// Show menu item modal
function showMenuItemModal(itemId) {
  // Find the menu item in the current restaurant
  const restaurant = appState.currentRestaurant;
  if (!restaurant) return;
  
  let menuItem = null;
  
  // Find the menu item in the restaurant's categories
  for (const category of restaurant.categories) {
    const item = category.menu_items.find(item => item.id === itemId);
    if (item) {
      menuItem = item;
      break;
    }
  }
  
  if (!menuItem) {
    console.error(`Menu item with ID ${itemId} not found`);
    return;
  }
  
  // Populate modal content
  const modalBody = document.getElementById('menu-item-modal-body');
  const modalTitle = document.getElementById('menu-item-modal-label');
  
  modalTitle.textContent = menuItem.name;
  
  // Prepare dietary tags
  let dietaryTags = [];
  if (menuItem.is_vegetarian) dietaryTags.push('<span class="badge bg-success me-1">Vegetarian</span>');
  if (menuItem.is_vegan) dietaryTags.push('<span class="badge bg-success me-1">Vegan</span>');
  if (menuItem.is_gluten_free) dietaryTags.push('<span class="badge bg-warning me-1">Gluten-Free</span>');
  
  // Prepare spice level indicator
  let spiceLevel = '';
  if (menuItem.spice_level > 0) {
    spiceLevel = '<div class="text-danger">';
    for (let i = 0; i < menuItem.spice_level; i++) {
      spiceLevel += '<i class="fas fa-pepper-hot"></i>';
    }
    spiceLevel += '</div>';
  }
  
  // Construct modal content
  let modalContent = `
    <div class="row mb-4">
      <div class="col-md-4">
        <img src="${menuItem.image_url || 'https://via.placeholder.com/300?text=Food'}" 
             class="img-fluid rounded" 
             alt="${menuItem.name}">
      </div>
      <div class="col-md-8">
        <div class="d-flex align-items-center mb-2">
          <h5 class="mb-0 me-2">${formatCurrency(menuItem.price)}</h5>
          ${spiceLevel}
        </div>
        <div class="mb-2">
          ${dietaryTags.length > 0 ? dietaryTags.join('') : ''}
        </div>
        <p>${menuItem.description}</p>
      </div>
    </div>
  `;
  
  // Add customization groups if available
  if (menuItem.customization_groups && menuItem.customization_groups.length > 0) {
    modalContent += '<form id="customization-form">';
    
    menuItem.customization_groups.forEach(group => {
      modalContent += `
        <div class="customization-group mb-4" data-group-id="${group.id}">
          <h6>${group.name} ${group.is_required ? '<span class="text-danger">*</span>' : ''}</h6>
          ${group.description ? `<p class="text-muted small">${group.description}</p>` : ''}
          <p class="small text-muted mb-3">
            ${group.min_selections > 0 ? `Select at least ${group.min_selections}` : 'Select up to ' + group.max_selections}
          </p>
      `;
      
      if (group.options && group.options.length > 0) {
        if (group.max_selections === 1) {
          // Radio buttons for single selection
          modalContent += '<div class="form-group">';
          group.options.forEach(option => {
            modalContent += `
              <div class="form-check">
                <input type="radio" 
                       class="form-check-input" 
                       name="group_${group.id}" 
                       id="option_${option.id}" 
                       value="${option.id}"
                       data-price="${option.price}"
                       ${option.is_default ? 'checked' : ''}
                       ${group.is_required ? 'required' : ''}>
                <label class="form-check-label d-flex justify-content-between" for="option_${option.id}">
                  <span>${option.name}</span>
                  ${option.price > 0 ? `<span>+${formatCurrency(option.price)}</span>` : ''}
                </label>
              </div>
            `;
          });
          modalContent += '</div>';
        } else {
          // Checkboxes for multiple selection
          modalContent += '<div class="form-group">';
          group.options.forEach(option => {
            modalContent += `
              <div class="form-check">
                <input type="checkbox" 
                       class="form-check-input" 
                       name="group_${group.id}" 
                       id="option_${option.id}" 
                       value="${option.id}"
                       data-price="${option.price}"
                       data-group-id="${group.id}"
                       data-max-selections="${group.max_selections}"
                       ${option.is_default ? 'checked' : ''}>
                <label class="form-check-label d-flex justify-content-between" for="option_${option.id}">
                  <span>${option.name}</span>
                  ${option.price > 0 ? `<span>+${formatCurrency(option.price)}</span>` : ''}
                </label>
              </div>
            `;
          });
          modalContent += '</div>';
        }
      }
      
      modalContent += '</div>';
    });
    
    // Add special instructions
    modalContent += `
      <div class="form-group mb-4">
        <label for="special-instructions" class="form-label">Special Instructions (optional)</label>
        <textarea class="form-control" id="special-instructions" rows="2" placeholder="Any special requests?"></textarea>
      </div>
    `;
    
    // Add quantity selector
    modalContent += `
      <div class="form-group mb-4">
        <label for="item-quantity" class="form-label">Quantity</label>
        <div class="input-group quantity-control">
          <button type="button" class="btn btn-outline-secondary" id="decrease-quantity">-</button>
          <input type="number" class="form-control text-center" id="item-quantity" value="1" min="1" max="99">
          <button type="button" class="btn btn-outline-secondary" id="increase-quantity">+</button>
        </div>
      </div>
    `;
    
    modalContent += '</form>';
  } else {
    // Simple form for items without customization
    modalContent += `
      <form id="customization-form">
        <div class="form-group mb-4">
          <label for="special-instructions" class="form-label">Special Instructions (optional)</label>
          <textarea class="form-control" id="special-instructions" rows="2" placeholder="Any special requests?"></textarea>
        </div>
        
        <div class="form-group mb-4">
          <label for="item-quantity" class="form-label">Quantity</label>
          <div class="input-group quantity-control">
            <button type="button" class="btn btn-outline-secondary" id="decrease-quantity">-</button>
            <input type="number" class="form-control text-center" id="item-quantity" value="1" min="1" max="99">
            <button type="button" class="btn btn-outline-secondary" id="increase-quantity">+</button>
          </div>
        </div>
      </form>
    `;
  }
  
  modalBody.innerHTML = modalContent;
  
  // Set up quantity control buttons
  const decreaseBtn = document.getElementById('decrease-quantity');
  const increaseBtn = document.getElementById('increase-quantity');
  const quantityInput = document.getElementById('item-quantity');
  
  decreaseBtn.addEventListener('click', function() {
    if (parseInt(quantityInput.value) > 1) {
      quantityInput.value = parseInt(quantityInput.value) - 1;
    }
  });
  
  increaseBtn.addEventListener('click', function() {
    if (parseInt(quantityInput.value) < 99) {
      quantityInput.value = parseInt(quantityInput.value) + 1;
    }
  });
  
  // Setup checkbox limitations for multi-select groups
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const groupId = this.dataset.groupId;
      const maxSelections = parseInt(this.dataset.maxSelections);
      
      const checkedBoxes = document.querySelectorAll(`input[type="checkbox"][data-group-id="${groupId}"]:checked`);
      
      if (checkedBoxes.length > maxSelections) {
        this.checked = false;
        alert(`You can only select up to ${maxSelections} option${maxSelections > 1 ? 's' : ''} from this group.`);
      }
    });
  });
  
  // Set up add to cart button
  const addToCartBtn = document.getElementById('add-to-cart-confirm');
  addToCartBtn.dataset.itemId = itemId;
  
  addToCartBtn.addEventListener('click', function() {
    addItemToCart(menuItem);
  });
  
  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById('menu-item-modal'));
  modal.show();
}

// Add item to cart
function addItemToCart(menuItem) {
  // Get form values
  const form = document.getElementById('customization-form');
  const specialInstructions = document.getElementById('special-instructions').value;
  const quantity = parseInt(document.getElementById('item-quantity').value);
  
  // Validate quantity
  if (isNaN(quantity) || quantity < 1) {
    alert('Please enter a valid quantity');
    return;
  }
  
  // Get selected customizations
  const customizations = [];
  
  if (menuItem.customization_groups && menuItem.customization_groups.length > 0) {
    for (const group of menuItem.customization_groups) {
      // Get selected options for this group
      const selectedOptions = [];
      
      if (group.max_selections === 1) {
        // Radio buttons
        const selectedOption = document.querySelector(`input[name="group_${group.id}"]:checked`);
        if (selectedOption) {
          const optionId = parseInt(selectedOption.value);
          const price = parseFloat(selectedOption.dataset.price);
          
          selectedOptions.push({
            option_id: optionId,
            price: price
          });
        } else if (group.is_required) {
          alert(`Please select an option from ${group.name}`);
          return;
        }
      } else {
        // Checkboxes
        const selectedCheckboxes = document.querySelectorAll(`input[name="group_${group.id}"]:checked`);
        
        if (selectedCheckboxes.length < group.min_selections && group.min_selections > 0) {
          alert(`Please select at least ${group.min_selections} option${group.min_selections > 1 ? 's' : ''} from ${group.name}`);
          return;
        }
        
        selectedCheckboxes.forEach(checkbox => {
          const optionId = parseInt(checkbox.value);
          const price = parseFloat(checkbox.dataset.price);
          
          selectedOptions.push({
            option_id: optionId,
            price: price
          });
        });
      }
      
      customizations.push(...selectedOptions);
    }
  }
  
  // Create cart item
  const cartItem = {
    menu_item_id: menuItem.id,
    quantity: quantity,
    special_instructions: specialInstructions,
    customizations: customizations
  };
  
  // Send to API
  fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cartItem)
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    // Update app state
    appState.cart = data.cart;
    
    // Update cart count
    updateCartCount();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('menu-item-modal'));
    modal.hide();
    
    // Show success message
    showSuccess('Item added to cart!');
  })
  .catch(error => {
    console.error('Error adding item to cart:', error);
  });
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize menu item modal
  initializeMenuItemModal();
  
  // Set up event delegation for add to cart buttons
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('add-to-cart-btn') || 
        event.target.closest('.add-to-cart-btn')) {
      const button = event.target.classList.contains('add-to-cart-btn') ? 
                     event.target : 
                     event.target.closest('.add-to-cart-btn');
      
      const itemId = parseInt(button.dataset.itemId);
      showMenuItemModal(itemId);
    }
  });
  
  // Set up sorting functionality
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const [sortBy, sortOrder] = this.value.split('-');
      
      // Update URL with sort parameters
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', sortBy);
      url.searchParams.set('sort_order', sortOrder);
      
      window.history.replaceState({}, '', url);
      
      // Refetch restaurants with new sorting
      fetchRestaurants();
    });
  }
});
