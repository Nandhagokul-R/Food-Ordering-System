// cart.js - Cart management functionality

// Update cart UI
function updateCartUI() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartSummaryContainer = document.getElementById('cart-summary');
  
  if (!cartItemsContainer) return;
  
  // Show loading
  cartItemsContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  
  // Fetch cart from server
  fetch('/api/cart')
    .then(handleHttpError)
    .then(response => response.json())
    .then(data => {
      appState.cart = data.cart || [];
      
      if (appState.cart.length === 0) {
        cartItemsContainer.innerHTML = `
          <div class="alert alert-info text-center my-5">
            <i class="fas fa-shopping-cart fa-3x mb-3"></i>
            <h4>Your cart is empty</h4>
            <p>Explore our restaurants and add some delicious food to your cart.</p>
            <a href="/restaurants" class="btn btn-primary mt-3">Browse Restaurants</a>
          </div>
        `;
        
        if (cartSummaryContainer) {
          cartSummaryContainer.innerHTML = '';
        }
        
        // Hide checkout button if present
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
          checkoutBtn.classList.add('d-none');
        }
        
        return;
      }
      
      // Calculate subtotal, tax, delivery fee and total
      const subtotal = appState.cart.reduce((sum, item) => sum + item.total_price, 0);
      const tax = subtotal * 0.0825; // 8.25% tax
      // Assuming delivery fee is from restaurant
      const deliveryFee = 3.99; // Default delivery fee
      const total = subtotal + tax + deliveryFee;
      
      // Render cart items
      cartItemsContainer.innerHTML = '';
      
      appState.cart.forEach((item, index) => {
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'card mb-3 cart-item';
        cartItemEl.innerHTML = `
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-8">
                <h5 class="card-title">${item.name}</h5>
                <p class="card-text text-muted small">${item.special_instructions || 'No special instructions'}</p>
                
                ${item.customizations && item.customizations.length > 0 
                  ? `<div class="small text-muted mb-2">
                      ${item.customizations.map(cust => 
                        `<div>${cust.name || `Option #${cust.option_id}`} (+${formatCurrency(cust.price)})</div>`
                      ).join('')}
                    </div>`
                  : ''
                }
                
                <div class="input-group input-group-sm w-md-50 mt-2">
                  <button class="btn btn-outline-secondary cart-decrease" data-index="${index}">-</button>
                  <input type="number" class="form-control text-center cart-quantity" value="${item.quantity}" min="1" max="99" data-index="${index}">
                  <button class="btn btn-outline-secondary cart-increase" data-index="${index}">+</button>
                </div>
              </div>
              <div class="col-md-3 text-md-end mt-2 mt-md-0">
                <h6 class="mb-0">${formatCurrency(item.total_price)}</h6>
                <small class="text-muted">${formatCurrency(item.price)} each</small>
              </div>
              <div class="col-md-1 text-md-end mt-2 mt-md-0">
                <button class="btn btn-outline-danger btn-sm remove-item" data-index="${index}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        
        cartItemsContainer.appendChild(cartItemEl);
      });
      
      // Render cart summary
      if (cartSummaryContainer) {
        cartSummaryContainer.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Order Summary</h5>
              <div class="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${formatCurrency(subtotal)}</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Tax</span>
                <span>${formatCurrency(tax)}</span>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span>Delivery Fee</span>
                <span>${formatCurrency(deliveryFee)}</span>
              </div>
              <hr>
              <div class="d-flex justify-content-between mb-3">
                <strong>Estimated Total</strong>
                <strong>${formatCurrency(total)}</strong>
              </div>
              
              <a href="/checkout" id="checkout-btn" class="btn btn-primary w-100">Proceed to Checkout</a>
              <button id="clear-cart-btn" class="btn btn-outline-secondary w-100 mt-2">Clear Cart</button>
            </div>
          </div>
        `;
      }
      
      // Show checkout button if hidden
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.classList.remove('d-none');
      }
      
      // Add event listeners to cart controls
      addCartControlListeners();
    })
    .catch(error => {
      console.error('Error loading cart:', error);
      cartItemsContainer.innerHTML = '<div class="alert alert-danger">Error loading cart. Please try again later.</div>';
    });
}

// Add event listeners to cart controls
function addCartControlListeners() {
  // Quantity decrease buttons
  const decreaseButtons = document.querySelectorAll('.cart-decrease');
  decreaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      const quantityInput = document.querySelector(`.cart-quantity[data-index="${index}"]`);
      
      if (parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
        updateCartItemQuantity(index, parseInt(quantityInput.value));
      }
    });
  });
  
  // Quantity increase buttons
  const increaseButtons = document.querySelectorAll('.cart-increase');
  increaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      const quantityInput = document.querySelector(`.cart-quantity[data-index="${index}"]`);
      
      if (parseInt(quantityInput.value) < 99) {
        quantityInput.value = parseInt(quantityInput.value) + 1;
        updateCartItemQuantity(index, parseInt(quantityInput.value));
      }
    });
  });
  
  // Quantity input fields
  const quantityInputs = document.querySelectorAll('.cart-quantity');
  quantityInputs.forEach(input => {
    input.addEventListener('change', function() {
      const index = parseInt(this.dataset.index);
      let quantity = parseInt(this.value);
      
      if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
        this.value = 1;
      } else if (quantity > 99) {
        quantity = 99;
        this.value = 99;
      }
      
      updateCartItemQuantity(index, quantity);
    });
  });
  
  // Remove item buttons
  const removeButtons = document.querySelectorAll('.remove-item');
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      removeCartItem(index);
    });
  });
  
  // Clear cart button
  const clearCartButton = document.getElementById('clear-cart-btn');
  if (clearCartButton) {
    clearCartButton.addEventListener('click', clearCart);
  }
}

// Update cart item quantity
function updateCartItemQuantity(index, quantity) {
  fetch('/api/cart', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      index: index,
      quantity: quantity
    })
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    appState.cart = data.cart;
    updateCartUI();
    updateCartCount();
  })
  .catch(error => {
    console.error('Error updating cart:', error);
  });
}

// Remove item from cart
function removeCartItem(index) {
  fetch('/api/cart', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      index: index
    })
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    appState.cart = data.cart;
    showSuccess('Item removed from cart');
    updateCartUI();
    updateCartCount();
  })
  .catch(error => {
    console.error('Error removing item from cart:', error);
  });
}

// Clear entire cart
function clearCart() {
  if (!confirm('Are you sure you want to clear your cart?')) {
    return;
  }
  
  fetch('/api/cart/clear', {
    method: 'POST'
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    appState.cart = data.cart;
    showSuccess('Cart cleared');
    updateCartUI();
    updateCartCount();
  })
  .catch(error => {
    console.error('Error clearing cart:', error);
  });
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('cart-items')) {
    updateCartUI();
  }
});
