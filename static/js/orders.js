// orders.js - Order processing and history functionality

// Initialize checkout page
function initializeCheckout() {
  const checkoutForm = document.getElementById('checkout-form');
  if (!checkoutForm) return;
  
  // Load cart summary
  updateCheckoutSummary();
  
  // Set up address selection
  const addressSelect = document.getElementById('address-select');
  const newAddressForm = document.getElementById('new-address-form');
  const useNewAddressCheckbox = document.getElementById('use-new-address');
  
  if (useNewAddressCheckbox && addressSelect && newAddressForm) {
    useNewAddressCheckbox.addEventListener('change', function() {
      if (this.checked) {
        addressSelect.disabled = true;
        newAddressForm.classList.remove('d-none');
      } else {
        addressSelect.disabled = false;
        newAddressForm.classList.add('d-none');
      }
    });
  }
  
  // Set up payment method selection
  const paymentMethods = document.querySelectorAll('input[name="payment_method"]');
  const cardDetailsForm = document.getElementById('card-details');
  
  if (paymentMethods && cardDetailsForm) {
    paymentMethods.forEach(method => {
      method.addEventListener('change', function() {
        if (this.value === 'credit_card' || this.value === 'debit_card') {
          cardDetailsForm.classList.remove('d-none');
        } else {
          cardDetailsForm.classList.add('d-none');
        }
      });
    });
  }
  
  // Set up tip calculation
  const tipOptions = document.querySelectorAll('input[name="tip_percentage"]');
  const customTipInput = document.getElementById('custom-tip');
  const tipAmountDisplay = document.getElementById('tip-amount');
  
  if (tipOptions && customTipInput && tipAmountDisplay) {
    // Get subtotal
    const subtotalElement = document.getElementById('checkout-subtotal');
    let subtotal = 0;
    if (subtotalElement) {
      subtotal = parseFloat(subtotalElement.dataset.value || 0);
    }
    
    // Function to update tip amount
    function updateTipAmount() {
      let tipAmount = 0;
      
      tipOptions.forEach(option => {
        if (option.checked && option.value !== 'custom') {
          const percentage = parseFloat(option.value) / 100;
          tipAmount = subtotal * percentage;
        }
      });
      
      // If custom tip is selected
      const customTipOption = document.querySelector('input[value="custom"]');
      if (customTipOption && customTipOption.checked) {
        tipAmount = parseFloat(customTipInput.value) || 0;
      }
      
      // Update display
      tipAmountDisplay.textContent = formatCurrency(tipAmount);
      
      // Update total
      updateTotal(tipAmount);
      
      return tipAmount;
    }
    
    // Add event listeners to tip options
    tipOptions.forEach(option => {
      option.addEventListener('change', function() {
        if (this.value === 'custom') {
          customTipInput.disabled = false;
          customTipInput.focus();
        } else {
          customTipInput.disabled = true;
        }
        
        updateTipAmount();
      });
    });
    
    // Add event listener to custom tip input
    customTipInput.addEventListener('input', updateTipAmount);
    
    // Initialize tip calculation
    updateTipAmount();
  }
  
  // Handle form submission
  checkoutForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Validate cart is not empty
    if (!appState.cart || appState.cart.length === 0) {
      showError('Your cart is empty. Please add items before checking out.');
      return;
    }
    
    // Get form data
    const formData = new FormData(checkoutForm);
    const orderData = {};
    
    // Get restaurant ID from first cart item
    if (appState.cart && appState.cart.length > 0) {
      orderData.restaurant_id = appState.currentRestaurant ? 
                               appState.currentRestaurant.id : 
                               document.getElementById('restaurant-id').value;
    }
    
    // Get payment method
    const paymentMethod = formData.get('payment_method');
    if (!paymentMethod) {
      showError('Please select a payment method.');
      return;
    }
    orderData.payment_method = paymentMethod;
    
    // Get delivery address
    let addressId;
    
    if (useNewAddressCheckbox && useNewAddressCheckbox.checked) {
      // Create new address first
      const addressData = {
        address_line1: formData.get('address_line1'),
        address_line2: formData.get('address_line2') || '',
        city: formData.get('city'),
        state: formData.get('state'),
        postal_code: formData.get('postal_code'),
        is_default: formData.get('set_as_default') === 'on'
      };
      
      // Validate required address fields
      if (!addressData.address_line1 || !addressData.city || !addressData.state || !addressData.postal_code) {
        showError('Please fill in all required address fields.');
        return;
      }
      
      // Create address and then place order
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
        orderData.delivery_address_id = data.address.id;
        placeOrder(orderData);
      })
      .catch(error => {
        console.error('Error creating address:', error);
      });
      
    } else {
      // Use existing address
      addressId = formData.get('address_id');
      if (!addressId) {
        showError('Please select a delivery address.');
        return;
      }
      
      orderData.delivery_address_id = addressId;
      
      // Get tip amount
      if (tipOptions) {
        let tipAmount = 0;
        
        tipOptions.forEach(option => {
          if (option.checked && option.value !== 'custom') {
            const percentage = parseFloat(option.value) / 100;
            const subtotalElement = document.getElementById('checkout-subtotal');
            const subtotal = parseFloat(subtotalElement.dataset.value || 0);
            tipAmount = subtotal * percentage;
          }
        });
        
        // If custom tip is selected
        const customTipOption = document.querySelector('input[value="custom"]');
        if (customTipOption && customTipOption.checked) {
          tipAmount = parseFloat(customTipInput.value) || 0;
        }
        
        orderData.tip = tipAmount;
      }
      
      // Get special instructions
      const specialInstructions = formData.get('special_instructions');
      if (specialInstructions) {
        orderData.special_instructions = specialInstructions;
      }
      
      // Place order
      placeOrder(orderData);
    }
  });
}

// Update checkout summary
function updateCheckoutSummary() {
  const summaryContainer = document.getElementById('checkout-summary');
  if (!summaryContainer) return;
  
  // Show loading
  summaryContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  
  // Fetch cart from server
  fetch('/api/cart')
    .then(handleHttpError)
    .then(response => response.json())
    .then(data => {
      appState.cart = data.cart || [];
      
      if (appState.cart.length === 0) {
        summaryContainer.innerHTML = `
          <div class="alert alert-warning">
            Your cart is empty. Please add items before checking out.
          </div>
        `;
        
        // Disable checkout button
        const checkoutButton = document.querySelector('button[type="submit"]');
        if (checkoutButton) {
          checkoutButton.disabled = true;
        }
        
        return;
      }
      
      // Calculate subtotal, tax, delivery fee and total
      const subtotal = appState.cart.reduce((sum, item) => sum + item.total_price, 0);
      const tax = subtotal * 0.0825; // 8.25% tax
      // Assuming delivery fee is from restaurant
      const deliveryFee = 3.99; // Default delivery fee
      const total = subtotal + tax + deliveryFee;
      
      // Render summary
      summaryContainer.innerHTML = `
        <h5 class="mb-3">Order Summary</h5>
        <div class="list-group mb-3">
          ${appState.cart.map(item => `
            <div class="list-group-item d-flex justify-content-between lh-sm">
              <div>
                <h6 class="my-0">${item.name} x ${item.quantity}</h6>
                <small class="text-muted">${item.special_instructions || 'No special instructions'}</small>
                ${item.customizations && item.customizations.length > 0 
                  ? `<small class="d-block text-muted">
                      ${item.customizations.map(cust => 
                        `<div>${cust.name || `Option #${cust.option_id}`}</div>`
                      ).join('')}
                    </small>`
                  : ''
                }
              </div>
              <span class="text-muted">${formatCurrency(item.total_price)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span>Subtotal</span>
              <span id="checkout-subtotal" data-value="${subtotal}">${formatCurrency(subtotal)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Tax</span>
              <span>${formatCurrency(tax)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Delivery Fee</span>
              <span>${formatCurrency(deliveryFee)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Tip</span>
              <span id="tip-amount">${formatCurrency(0)}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between">
              <strong>Total</strong>
              <strong id="total-amount" data-base-value="${total}">${formatCurrency(total)}</strong>
            </div>
          </div>
        </div>
      `;
      
      // Enable checkout button
      const checkoutButton = document.querySelector('button[type="submit"]');
      if (checkoutButton) {
        checkoutButton.disabled = false;
      }
    })
    .catch(error => {
      console.error('Error loading cart for checkout:', error);
      summaryContainer.innerHTML = '<div class="alert alert-danger">Error loading your order. Please try again later.</div>';
    });
}

// Update total with tip
function updateTotal(tipAmount) {
  const totalElement = document.getElementById('total-amount');
  if (!totalElement) return;
  
  const baseTotal = parseFloat(totalElement.dataset.baseValue || 0);
  const newTotal = baseTotal + tipAmount;
  
  totalElement.textContent = formatCurrency(newTotal);
}

// Place order
function placeOrder(orderData) {
  // Show loading
  const checkoutButton = document.querySelector('button[type="submit"]');
  if (checkoutButton) {
    checkoutButton.disabled = true;
    checkoutButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
  }
  
  // Send order to server
  fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  })
  .then(handleHttpError)
  .then(response => response.json())
  .then(data => {
    // Show success message
    showSuccess('Order placed successfully!');
    
    // Redirect to order confirmation page
    window.location.href = `/orders/${data.order.id}/confirmation`;
  })
  .catch(error => {
    console.error('Error placing order:', error);
    
    // Re-enable checkout button
    if (checkoutButton) {
      checkoutButton.disabled = false;
      checkoutButton.innerHTML = 'Place Order';
    }
  });
}

// Fetch order history
function fetchOrderHistory() {
  const orderHistoryContainer = document.getElementById('order-history-list');
  if (!orderHistoryContainer) return;
  
  // Show loading
  orderHistoryContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  
  // Fetch orders from server
  fetch('/api/orders')
    .then(handleHttpError)
    .then(response => response.json())
    .then(data => {
      if (!data.orders || data.orders.length === 0) {
        orderHistoryContainer.innerHTML = `
          <div class="alert alert-info text-center my-5">
            <i class="fas fa-receipt fa-3x mb-3"></i>
            <h4>No orders yet</h4>
            <p>You haven't placed any orders yet. Browse our restaurants and place your first order!</p>
            <a href="/restaurants" class="btn btn-primary mt-3">Browse Restaurants</a>
          </div>
        `;
        return;
      }
      
      // Render order history
      orderHistoryContainer.innerHTML = '';
      
      data.orders.forEach(order => {
        const orderCard = createOrderHistoryCard(order);
        orderHistoryContainer.appendChild(orderCard);
      });
    })
    .catch(error => {
      console.error('Error fetching order history:', error);
      orderHistoryContainer.innerHTML = '<div class="alert alert-danger">Error loading your order history. Please try again later.</div>';
    });
}

// Create order history card
function createOrderHistoryCard(order) {
  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Get status badge color
  let statusColor = 'secondary';
  switch (order.status) {
    case 'pending':
      statusColor = 'warning';
      break;
    case 'preparing':
      statusColor = 'info';
      break;
    case 'ready_for_pickup':
      statusColor = 'primary';
      break;
    case 'out_for_delivery':
      statusColor = 'primary';
      break;
    case 'delivered':
      statusColor = 'success';
      break;
    case 'cancelled':
      statusColor = 'danger';
      break;
  }
  
  // Format status text
  const statusText = order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  const card = document.createElement('div');
  card.className = 'card mb-4 order-card';
  card.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center">
      <div>
        <h5 class="mb-0">Order #${order.id}</h5>
        <div class="text-muted small">${formattedDate} at ${formattedTime}</div>
      </div>
      <span class="badge bg-${statusColor}">${statusText}</span>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-8">
          <h6>Items</h6>
          <ul class="list-group list-group-flush mb-3">
            ${order.items && order.items.length > 0 
              ? order.items.map(item => `
                <li class="list-group-item px-0 py-2 border-0">
                  <div class="d-flex justify-content-between">
                    <span>${item.quantity} x ${item.menu_item ? item.menu_item.name : `Item #${item.menu_item_id}`}</span>
                    <span>${formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  ${item.special_instructions 
                    ? `<small class="text-muted">${item.special_instructions}</small>` 
                    : ''}
                </li>
              `).join('')
              : '<li class="list-group-item px-0 py-2 border-0">No items available</li>'
            }
          </ul>
        </div>
        <div class="col-md-4">
          <h6>Order Details</h6>
          <ul class="list-group list-group-flush">
            <li class="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
              <span>Subtotal</span>
              <span>${formatCurrency(order.subtotal)}</span>
            </li>
            <li class="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
              <span>Tax</span>
              <span>${formatCurrency(order.tax)}</span>
            </li>
            <li class="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
              <span>Delivery Fee</span>
              <span>${formatCurrency(order.delivery_fee)}</span>
            </li>
            <li class="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
              <span>Tip</span>
              <span>${formatCurrency(order.tip)}</span>
            </li>
            <li class="list-group-item px-0 py-2 border-0 d-flex justify-content-between">
              <strong>Total</strong>
              <strong>${formatCurrency(order.total)}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="card-footer bg-transparent">
      <a href="/orders/${order.id}/confirmation" class="btn btn-outline-primary btn-sm">View Details</a>
    </div>
  `;
  
  return card;
}

// Initialize order details page
function initializeOrderDetails() {
  const orderDetailContainer = document.getElementById('order-detail');
  if (!orderDetailContainer) return;
  
  const orderId = orderDetailContainer.dataset.orderId;
  if (!orderId) return;
  
  // Show loading
  orderDetailContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  
  // Fetch order details from server
  fetch(`/api/orders/${orderId}`)
    .then(handleHttpError)
    .then(response => response.json())
    .then(order => {
      // Render order details
      renderOrderDetails(order, orderDetailContainer);
    })
    .catch(error => {
      console.error('Error fetching order details:', error);
      orderDetailContainer.innerHTML = '<div class="alert alert-danger">Error loading order details. Please try again later.</div>';
    });
}

// Render order details
function renderOrderDetails(order, container) {
  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Get status badge color
  let statusColor = 'secondary';
  switch (order.status) {
    case 'pending':
      statusColor = 'warning';
      break;
    case 'preparing':
      statusColor = 'info';
      break;
    case 'ready_for_pickup':
      statusColor = 'primary';
      break;
    case 'out_for_delivery':
      statusColor = 'primary';
      break;
    case 'delivered':
      statusColor = 'success';
      break;
    case 'cancelled':
      statusColor = 'danger';
      break;
  }
  
  // Format status text
  const statusText = order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Format estimated delivery time if present
  let estimatedDeliveryText = 'Not available';
  if (order.estimated_delivery_time) {
    const deliveryTime = new Date(order.estimated_delivery_time);
    estimatedDeliveryText = deliveryTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  container.innerHTML = `
    <div class="card mb-4">
      <div class="card-header bg-transparent">
        <div class="d-flex justify-content-between align-items-center">
          <h4 class="mb-0">Order #${order.id}</h4>
          <span class="badge bg-${statusColor}">${statusText}</span>
        </div>
        <div class="text-muted">${formattedDate} at ${formattedTime}</div>
      </div>
      
      <div class="card-body">
        <div class="row mb-4">
          <div class="col-md-6 mb-3 mb-md-0">
            <h5>Delivery Details</h5>
            <p class="mb-1"><strong>Estimated Delivery:</strong> ${estimatedDeliveryText}</p>
            <p class="mb-1"><strong>Address:</strong></p>
            <p class="mb-0">
              ${order.delivery_address.address_line1}<br>
              ${order.delivery_address.address_line2 ? order.delivery_address.address_line2 + '<br>' : ''}
              ${order.delivery_address.city}, ${order.delivery_address.state} ${order.delivery_address.postal_code}
            </p>
          </div>
          
          <div class="col-md-6">
            <h5>Restaurant</h5>
            <p class="mb-1"><strong>${order.restaurant.name}</strong></p>
            <p class="mb-1">${order.restaurant.address_line1}</p>
            <p class="mb-0">${order.restaurant.city}, ${order.restaurant.state} ${order.restaurant.postal_code}</p>
          </div>
        </div>
        
        <h5>Order Items</h5>
        <div class="list-group mb-4">
          ${order.items && order.items.length > 0 
            ? order.items.map(item => `
              <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-0">${item.quantity} x ${item.menu_item.name}</h6>
                    ${item.special_instructions 
                      ? `<small class="text-muted">${item.special_instructions}</small>` 
                      : ''}
                    
                    ${item.customizations && item.customizations.length > 0 
                      ? `<div class="small text-muted mt-1">
                          ${item.customizations.map(cust => 
                            `<div>${cust.option.name} (+${formatCurrency(cust.price)})</div>`
                          ).join('')}
                        </div>`
                      : ''
                    }
                  </div>
                  <div class="text-end">
                    <div>${formatCurrency(item.price * item.quantity)}</div>
                    <small class="text-muted">${formatCurrency(item.price)} each</small>
                  </div>
                </div>
              </div>
            `).join('')
            : '<div class="list-group-item">No items available</div>'
          }
        </div>
        
        <div class="row">
          <div class="col-md-6 mb-4 mb-md-0">
            <h5>Payment Information</h5>
            <p class="mb-1"><strong>Payment Method:</strong> ${order.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            ${order.special_instructions 
              ? `<p class="mb-0"><strong>Special Instructions:</strong> ${order.special_instructions}</p>`
              : ''
            }
          </div>
          
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Order Summary</h5>
                <div class="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>${formatCurrency(order.subtotal)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Tax</span>
                  <span>${formatCurrency(order.tax)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Delivery Fee</span>
                  <span>${formatCurrency(order.delivery_fee)}</span>
                </div>
                <div class="d-flex justify-content-between mb-3">
                  <span>Tip</span>
                  <span>${formatCurrency(order.tip)}</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between">
                  <strong>Total</strong>
                  <strong>${formatCurrency(order.total)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card-footer bg-transparent">
        <a href="/orders" class="btn btn-secondary">Back to Orders</a>
      </div>
    </div>
  `;
}

// Initialize orders functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize checkout page if on checkout page
  if (document.getElementById('checkout-form')) {
    initializeCheckout();
  }
  
  // Initialize order history if on order history page
  if (document.getElementById('order-history-list')) {
    fetchOrderHistory();
  }
  
  // Initialize order details if on order details page
  if (document.getElementById('order-detail')) {
    initializeOrderDetails();
  }
});
