// Main.js - Core functionality for the food delivery app

// Global state for the application
const appState = {
  user: null,
  cart: [],
  currentRestaurant: null,
  filters: {
    cuisine: [],
    priceRange: [],
    rating: 0
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  checkAuthStatus();
  
  // Initialize cart from session
  fetchCart();
  
  // Set up navigation event listeners
  setupNavigation();
  
  // Set up search functionality if on restaurant list page
  if (document.getElementById('search-form')) {
    setupSearch();
  }
  
  // Set up filter functionality if on restaurant list page
  if (document.getElementById('filter-form')) {
    setupFilters();
  }
  
  // Initialize restaurant cards if on restaurant list page
  if (document.getElementById('restaurant-list')) {
    fetchRestaurants();
  }
  
  // Initialize restaurant detail page if on restaurant detail page
  if (document.getElementById('restaurant-detail')) {
    const restaurantId = document.getElementById('restaurant-detail').dataset.restaurantId;
    fetchRestaurantDetail(restaurantId);
  }
  
  // Initialize cart page if on cart page
  if (document.getElementById('cart-items')) {
    updateCartUI();
  }
  
  // Initialize checkout page if on checkout page
  if (document.getElementById('checkout-form')) {
    initializeCheckout();
  }
  
  // Initialize profile page if on profile page
  if (document.getElementById('profile-form')) {
    initializeProfile();
  }
  
  // Initialize order history page if on order history page
  if (document.getElementById('order-history')) {
    fetchOrderHistory();
  }
});

// Check if user is logged in
function checkAuthStatus() {
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    const userId = userInfo.dataset.userId;
    if (userId) {
      // User is logged in
      appState.user = {
        id: userId,
        username: userInfo.dataset.username
      };
      updateAuthUI(true);
    } else {
      // User is not logged in
      updateAuthUI(false);
    }
  }
}

// Update UI based on authentication status
function updateAuthUI(isLoggedIn) {
  const authLinks = document.querySelectorAll('.auth-link');
  const userLinks = document.querySelectorAll('.user-link');
  
  if (isLoggedIn) {
    authLinks.forEach(link => link.classList.add('d-none'));
    userLinks.forEach(link => link.classList.remove('d-none'));
    
    // Update cart count
    updateCartCount();
  } else {
    authLinks.forEach(link => link.classList.remove('d-none'));
    userLinks.forEach(link => link.classList.add('d-none'));
  }
}

// Set up navigation
function setupNavigation() {
  // Mobile navigation toggle
  const navbarToggler = document.querySelector('.navbar-toggler');
  if (navbarToggler) {
    navbarToggler.addEventListener('click', function() {
      const navbarNav = document.querySelector('.navbar-collapse');
      navbarNav.classList.toggle('show');
    });
  }
}

// Fetch cart from session
function fetchCart() {
  fetch('/api/cart')
    .then(response => response.json())
    .then(data => {
      appState.cart = data.cart || [];
      updateCartCount();
      
      // If on cart page, update cart UI
      if (document.getElementById('cart-items')) {
        updateCartUI();
      }
    })
    .catch(error => {
      console.error('Error fetching cart:', error);
    });
}

// Update cart count in the header
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const count = appState.cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
    
    if (count > 0) {
      cartCount.classList.remove('d-none');
    } else {
      cartCount.classList.add('d-none');
    }
  }
}

// Set up search functionality
function setupSearch() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        fetchRestaurants(searchTerm);
      } else {
        fetchRestaurants();
      }
    });
  }
}

// Set up filter functionality
function setupFilters() {
  const filterForm = document.getElementById('filter-form');
  const cuisineFilters = document.querySelectorAll('input[name="cuisine"]');
  const priceFilters = document.querySelectorAll('input[name="price_range"]');
  const ratingFilter = document.getElementById('rating-filter');
  
  if (filterForm) {
    // Set up cuisine filter change events
    cuisineFilters.forEach(filter => {
      filter.addEventListener('change', function() {
        appState.filters.cuisine = Array.from(cuisineFilters)
          .filter(f => f.checked)
          .map(f => f.value);
        fetchRestaurants();
      });
    });
    
    // Set up price range filter change events
    priceFilters.forEach(filter => {
      filter.addEventListener('change', function() {
        appState.filters.priceRange = Array.from(priceFilters)
          .filter(f => f.checked)
          .map(f => f.value);
        fetchRestaurants();
      });
    });
    
    // Set up rating filter change events
    if (ratingFilter) {
      ratingFilter.addEventListener('change', function() {
        appState.filters.rating = parseFloat(ratingFilter.value);
        fetchRestaurants();
      });
    }
  }
}

// Format price range (1-4) as $ symbols
function formatPriceRange(priceRange) {
  return '$'.repeat(priceRange);
}

// Format rating as stars
function formatRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  let starsHtml = '';
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }
  
  // Half star
  if (halfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }
  
  return starsHtml;
}

// Format currency
function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}

// Show error message
function showError(message) {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'alert alert-danger alert-dismissible fade show';
  errorContainer.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Find a container to show the error in
  const container = document.querySelector('.container');
  if (container) {
    container.prepend(errorContainer);
  } else {
    document.body.prepend(errorContainer);
  }
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    errorContainer.remove();
  }, 5000);
}

// Show success message
function showSuccess(message) {
  const successContainer = document.createElement('div');
  successContainer.className = 'alert alert-success alert-dismissible fade show';
  successContainer.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Find a container to show the success message in
  const container = document.querySelector('.container');
  if (container) {
    container.prepend(successContainer);
  } else {
    document.body.prepend(successContainer);
  }
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    successContainer.remove();
  }, 5000);
}

// Handle HTTP errors
function handleHttpError(response) {
  if (!response.ok) {
    return response.json().then(data => {
      const errorMessage = data.error || 'An error occurred. Please try again.';
      showError(errorMessage);
      throw new Error(errorMessage);
    });
  }
  return response;
}

// Export functions for use in other files
window.appState = appState;
window.formatPriceRange = formatPriceRange;
window.formatRating = formatRating;
window.formatCurrency = formatCurrency;
window.showError = showError;
window.showSuccess = showSuccess;
window.handleHttpError = handleHttpError;
window.updateCartCount = updateCartCount;
