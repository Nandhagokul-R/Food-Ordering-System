document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkout-form');
    const useNewAddressCheckbox = document.getElementById('use-new-address');
    const newAddressForm = document.getElementById('new-address-form');
    const addressSelect = document.getElementById('address-select');
    const paymentMethodInputs = document.querySelectorAll('input[name="payment_method"]');
    const cardDetails = document.getElementById('card-details');
    const customTipRadio = document.getElementById('tip-custom');
    const customTipInput = document.getElementById('custom-tip');
    const tipAmountDisplay = document.getElementById('tip-amount');
    const restaurantId = document.getElementById('restaurant-id').value;

    // Load order summary when page loads
    loadOrderSummary();

    // Toggle new address form
    if (useNewAddressCheckbox) {
        useNewAddressCheckbox.addEventListener('change', function() {
            newAddressForm.classList.toggle('d-none', !this.checked);
            if (addressSelect) {
                addressSelect.disabled = this.checked;
            }
        });
    }

    // Handle custom tip
    document.querySelectorAll('input[name="tip_percentage"]').forEach(radio => {
        radio.addEventListener('change', function() {
            customTipInput.disabled = this.value !== 'custom';
            if (this.value === 'custom') {
                customTipInput.focus();
            }
        });
    });

    // Update tip amount and total when tip changes
    function updateTipAndTotal() {
        const subtotalElement = document.querySelector('#summary-total');
        const tipPercentageValue = document.querySelector('input[name="tip_percentage"]:checked').value;
        const subtotal = parseFloat(subtotalElement.textContent.replace('$', ''));
        
        let tipAmount = 0;
        if (tipPercentageValue === 'custom') {
            tipAmount = parseFloat(customTipInput.value || 0);
        } else {
            tipAmount = subtotal * (parseInt(tipPercentageValue) / 100);
        }
        
        // Update tip display
        tipAmountDisplay.textContent = `$${tipAmount.toFixed(2)}`;
        
        // Update total
        const total = subtotal + tipAmount;
        document.querySelector('#summary-total').textContent = `$${total.toFixed(2)}`;
    }
    
    // Add event listeners for tip updates
    customTipInput.addEventListener('input', updateTipAndTotal);
    
    document.querySelectorAll('input[name="tip_percentage"]').forEach(radio => {
        radio.addEventListener('change', updateTipAndTotal);
    });

    // Toggle card details based on payment method
    paymentMethodInputs.forEach(input => {
        input.addEventListener('change', function() {
            cardDetails.classList.toggle('d-none', this.value === 'cash' || this.value === 'paypal');
        });
    });

    // Handle form submission
    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!csrfToken) {
            console.error('CSRF token not found');
            alert('Security token missing. Please refresh the page and try again.');
            return;
        }

        const formData = new FormData(this);
        // First, handle new address if needed
        let deliveryAddressId = formData.get('address_id');
        
        if (useNewAddressCheckbox && useNewAddressCheckbox.checked) {
            try {
                const addressResponse = await fetch('/api/addresses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({
                        address_line1: formData.get('address_line1'),
                        address_line2: formData.get('address_line2'),
                        city: formData.get('city'),
                        state: formData.get('state'),
                        postal_code: formData.get('postal_code'),
                        is_default: formData.get('set_as_default') === 'on'
                    })
                });
                
                if (!addressResponse.ok) {
                    throw new Error('Failed to create new address');
                }
                
                const addressData = await addressResponse.json();
                deliveryAddressId = addressData.address.id;
            } catch (error) {
                console.error('Error creating address:', error);
                alert('Failed to create new address. Please try again.');
                return;
            }
        }
        
        // Calculate tip amount
        let tipAmount = 0;
        const tipPercentage = formData.get('tip_percentage');
        if (tipPercentage === 'custom') {
            tipAmount = parseFloat(customTipInput.value) || 0;
        } else {
            const subtotalElement = document.querySelector('#summary-total');
            const subtotal = parseFloat(subtotalElement.textContent.replace('$', ''));
            tipAmount = (subtotal * (parseInt(tipPercentage) / 100));
        }
        
        const orderData = {
            restaurant_id: restaurantId,
            delivery_address_id: deliveryAddressId,
            payment_method: formData.get('payment_method'),
            tip: tipAmount,
            special_instructions: formData.get('special_instructions')
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'same-origin',
                body: JSON.stringify(orderData)
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                const errorText = await response.text();
                if (errorText.trim().startsWith('<')) {
                    throw new Error('Server returned HTML instead of JSON. Please refresh the page and try again.');
                }
                throw new Error('Unable to process server response. Please try again later.');
            }

            if (!response.ok) {
                const errorMessage = typeof responseData === 'object'
                    ? (responseData.message || responseData.error || JSON.stringify(responseData))
                    : responseData;
                throw new Error(errorMessage);
            }

            if (typeof responseData === 'object' && responseData.order_id) {
                // Show success alert
                const successAlert = document.getElementById('success-alert');
                successAlert.classList.remove('d-none');
                
                // Disable the form
                const form = document.getElementById('checkout-form');
                const submitButton = form.querySelector('button[type="submit"]');
                form.classList.add('opacity-50');
                submitButton.disabled = true;
                
                // Clear the cart from session storage
                sessionStorage.removeItem('cart');
                
                // Scroll to top to show the success message
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Redirect to order confirmation page
                setTimeout(() => {
                    window.location.href = `/orders/${responseData.order.id}/confirmation`;
                }, 3000);
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            const errorMessage = error.message || 'Failed to create order. Please try again.';
            alert(errorMessage);
        }
    });

    // Load order summary from cart
    async function loadOrderSummary() {
        try {
            const response = await fetch(`/api/cart/summary?restaurant_id=${restaurantId}`);
            if (!response.ok) {
                throw new Error('Failed to load cart summary');
            }

            const data = await response.json();
            updateOrderSummary(data);
        } catch (error) {
            console.error('Error loading cart summary:', error);
        }
    }

    // Update order summary display
    function updateOrderSummary(data) {
        const summaryHtml = `
            <div class="card">
                <div class="card-header bg-transparent">
                    <h5 class="mb-0">Order Summary</h5>
                </div>
                <div class="card-body">
                    <div class="items-list mb-3">
                        ${data.items.map(item => `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Subtotal</span>
                        <span>$${data.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Delivery Fee</span>
                        <span>$${data.delivery_fee.toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Tax</span>
                        <span>$${data.tax.toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Tip</span>
                        <span id="summary-tip">$0.00</span>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between fw-bold">
                        <span>Total</span>
                        <span id="summary-total">$${data.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('checkout-summary').innerHTML = summaryHtml;
    }
});