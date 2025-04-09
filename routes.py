from flask import render_template, request, jsonify, session, redirect, url_for, flash
from app import app, db, jwt
from models import *
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json
import logging
from functools import wraps
import os
from werkzeug.utils import secure_filename

# Helper functions
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None

# Web Routes (HTML)
@app.route('/')
def index():
    return render_template('index.html', user=get_current_user())

@app.route('/login', methods=['GET'])
def login():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('auth/login.html')

@app.route('/register', methods=['GET'])
def register():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('auth/register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

@app.route('/restaurants')
def restaurants():
    return render_template('restaurants/list.html', user=get_current_user())

@app.route('/restaurants/<int:restaurant_id>')
def restaurant_detail(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    return render_template('restaurants/detail.html', restaurant=restaurant, user=get_current_user())

@app.route('/cart')
@login_required
def cart():
    return render_template('cart/cart.html', user=get_current_user())

@app.route('/checkout')
@login_required
def checkout():
    if 'cart' not in session or not session['cart']:
        flash('Your cart is empty', 'error')
        return redirect(url_for('cart'))
    
    user = get_current_user()
    addresses = Address.query.filter_by(user_id=user.id).all()
    
    return render_template('orders/checkout.html', user=user, addresses=addresses)

@app.route('/orders/<int:order_id>/confirmation')
@login_required
def order_confirmation(order_id):
    order = Order.query.get_or_404(order_id)
    if order.user_id != session['user_id']:
        flash('You do not have permission to view this order', 'error')
        return redirect(url_for('index'))
    
    return render_template('orders/confirmation.html', order=order, user=get_current_user())

@app.route('/orders')
@login_required
def order_history():
    user = get_current_user()
    orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).all()
    return render_template('orders/history.html', orders=orders, user=user)

@app.route('/profile')
@login_required
def profile():
    user = get_current_user()
    addresses = Address.query.filter_by(user_id=user.id).all()
    return render_template('profile/profile.html', user=user, addresses=addresses)

# Admin Routes
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or user.role != UserRole.ADMIN:
            flash('You do not have permission to access this page', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    return render_template('admin/dashboard.html', user=get_current_user())

@app.route('/admin/restaurants')
@login_required
@admin_required
def admin_restaurants():
    restaurants = Restaurant.query.all()
    return render_template('admin/restaurants.html', restaurants=restaurants, user=get_current_user())

@app.route('/admin/restaurants/<int:restaurant_id>/menu')
@login_required
@admin_required
def admin_menu(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    categories = MenuCategory.query.filter_by(restaurant_id=restaurant_id).order_by(MenuCategory.order).all()
    return render_template('admin/menu.html', restaurant=restaurant, categories=categories, user=get_current_user())

@app.route('/admin/menu-items/add', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_add_menu_item():
    if request.method == 'GET':
        restaurants = Restaurant.query.all()
        categories = MenuCategory.query.all()
        return render_template('admin/add_menu_item.html', restaurants=restaurants, categories=categories, user=get_current_user())
    
    elif request.method == 'POST':
        try:
            # Get form data
            name = request.form.get('name')
            description = request.form.get('description')
            price = float(request.form.get('price'))
            category_id = int(request.form.get('category_id'))
            is_vegetarian = 'is_vegetarian' in request.form
            is_vegan = 'is_vegan' in request.form
            is_gluten_free = 'is_gluten_free' in request.form
            spice_level = int(request.form.get('spice_level', 0))
            
            # Handle image upload
            image_url = request.form.get('image_url')
            if 'image' in request.files and request.files['image'].filename:
                image = request.files['image']
                filename = secure_filename(image.filename)
                # Make sure static/uploads directory exists
                os.makedirs('static/uploads', exist_ok=True)
                image_path = os.path.join('static/uploads', filename)
                image.save(image_path)
                image_url = '/' + image_path  # Save relative URL
            
            # Create menu item
            menu_item = MenuItem(
                category_id=category_id,
                name=name,
                description=description,
                price=price,
                image_url=image_url,
                is_vegetarian=is_vegetarian,
                is_vegan=is_vegan,
                is_gluten_free=is_gluten_free,
                spice_level=spice_level,
                is_available=True
            )
            
            db.session.add(menu_item)
            db.session.commit()
            
            flash(f'Menu item "{name}" added successfully', 'success')
            return redirect(url_for('admin_menu', restaurant_id=MenuCategory.query.get(category_id).restaurant_id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error adding menu item: {str(e)}', 'error')
            return redirect(url_for('admin_add_menu_item'))

@app.route('/admin/menu-items/<int:item_id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_edit_menu_item(item_id):
    menu_item = MenuItem.query.get_or_404(item_id)
    
    if request.method == 'GET':
        restaurants = Restaurant.query.all()
        categories = MenuCategory.query.all()
        return render_template('admin/edit_menu_item.html', 
                              menu_item=menu_item, 
                              restaurants=restaurants, 
                              categories=categories, 
                              user=get_current_user())
    
    elif request.method == 'POST':
        try:
            # Update menu item data
            menu_item.name = request.form.get('name')
            menu_item.description = request.form.get('description')
            menu_item.price = float(request.form.get('price'))
            menu_item.category_id = int(request.form.get('category_id'))
            menu_item.is_vegetarian = 'is_vegetarian' in request.form
            menu_item.is_vegan = 'is_vegan' in request.form
            menu_item.is_gluten_free = 'is_gluten_free' in request.form
            menu_item.spice_level = int(request.form.get('spice_level', 0))
            menu_item.is_available = 'is_available' in request.form
            
            # Handle image upload
            if 'image' in request.files and request.files['image'].filename:
                image = request.files['image']
                filename = secure_filename(image.filename)
                # Make sure static/uploads directory exists
                os.makedirs('static/uploads', exist_ok=True)
                image_path = os.path.join('static/uploads', filename)
                image.save(image_path)
                menu_item.image_url = '/' + image_path  # Save relative URL
            elif request.form.get('image_url'):
                menu_item.image_url = request.form.get('image_url')
            
            db.session.commit()
            
            flash(f'Menu item "{menu_item.name}" updated successfully', 'success')
            return redirect(url_for('admin_menu', restaurant_id=MenuCategory.query.get(menu_item.category_id).restaurant_id))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating menu item: {str(e)}', 'error')
            return redirect(url_for('admin_edit_menu_item', item_id=item_id))

@app.route('/admin/menu-items/<int:item_id>/delete', methods=['POST'])
@login_required
@admin_required
def admin_delete_menu_item(item_id):
    menu_item = MenuItem.query.get_or_404(item_id)
    restaurant_id = MenuCategory.query.get(menu_item.category_id).restaurant_id
    
    try:
        db.session.delete(menu_item)
        db.session.commit()
        flash(f'Menu item "{menu_item.name}" deleted successfully', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting menu item: {str(e)}', 'error')
    
    return redirect(url_for('admin_menu', restaurant_id=restaurant_id))

# API Routes (JSON)
@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.json
    
    # Validate required fields
    required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        phone_number=data.get('phone_number', '')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Create session
    session['user_id'] = user.id
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.json
    
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password are required'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Create session
    session['user_id'] = user.id
    
    # Create JWT token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200

@app.route('/api/restaurants', methods=['GET'])
def api_restaurants():
    query = Restaurant.query
    
    # Apply filters
    if 'cuisine' in request.args:
        cuisines = request.args.getlist('cuisine')
        if cuisines:
            query = query.filter(Restaurant.cuisine_type.in_(cuisines))
    
    if 'price_range' in request.args:
        price_ranges = request.args.getlist('price_range')
        if price_ranges and all(pr.isdigit() for pr in price_ranges):
            price_ranges = [int(pr) for pr in price_ranges]
            query = query.filter(Restaurant.price_range.in_(price_ranges))
    
    if 'rating' in request.args:
        min_rating = request.args.get('rating')
        if min_rating and min_rating.replace('.', '', 1).isdigit():
            query = query.filter(Restaurant.rating >= float(min_rating))
    
    # Apply search
    if 'search' in request.args:
        search_term = request.args.get('search')
        if search_term:
            query = query.filter(
                db.or_(
                    Restaurant.name.ilike(f'%{search_term}%'),
                    Restaurant.description.ilike(f'%{search_term}%'),
                    Restaurant.cuisine_type.ilike(f'%{search_term}%')
                )
            )
    
    # Apply sorting
    sort_by = request.args.get('sort_by', 'rating')
    sort_order = request.args.get('sort_order', 'desc')
    
    if sort_by == 'name':
        if sort_order == 'asc':
            query = query.order_by(Restaurant.name.asc())
        else:
            query = query.order_by(Restaurant.name.desc())
    elif sort_by == 'price':
        if sort_order == 'asc':
            query = query.order_by(Restaurant.price_range.asc())
        else:
            query = query.order_by(Restaurant.price_range.desc())
    else:  # default: rating
        if sort_order == 'asc':
            query = query.order_by(Restaurant.rating.asc())
        else:
            query = query.order_by(Restaurant.rating.desc())
    
    # Get results
    restaurants = query.all()
    
    return jsonify({
        'count': len(restaurants),
        'restaurants': [restaurant.to_dict() for restaurant in restaurants]
    }), 200

@app.route('/api/restaurants/<int:restaurant_id>', methods=['GET'])
def api_restaurant_detail(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    
    # Get menu categories and items
    categories = MenuCategory.query.filter_by(restaurant_id=restaurant_id).order_by(MenuCategory.order).all()
    
    result = restaurant.to_dict()
    result['categories'] = []
    
    for category in categories:
        cat_dict = category.to_dict()
        cat_dict['menu_items'] = []
        
        menu_items = MenuItem.query.filter_by(category_id=category.id).all()
        for item in menu_items:
            item_dict = item.to_dict()
            item_dict['customization_groups'] = []
            
            # Get customization groups and options
            customization_groups = CustomizationGroup.query.filter_by(menu_item_id=item.id).all()
            for group in customization_groups:
                group_dict = group.to_dict()
                group_dict['options'] = []
                
                options = CustomizationOption.query.filter_by(group_id=group.id).all()
                for option in options:
                    group_dict['options'].append(option.to_dict())
                
                item_dict['customization_groups'].append(group_dict)
            
            cat_dict['menu_items'].append(item_dict)
        
        result['categories'].append(cat_dict)
    
    return jsonify(result), 200

@app.route('/api/cart', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_cart():
    if request.method == 'GET':
        cart = session.get('cart', [])
        return jsonify({'cart': cart}), 200
    
    elif request.method == 'POST':
        data = request.json
        
        if not data or 'menu_item_id' not in data or 'quantity' not in data:
            return jsonify({'error': 'Menu item ID and quantity are required'}), 400
        
        menu_item = MenuItem.query.get_or_404(data['menu_item_id'])
        
        item = {
            'menu_item_id': menu_item.id,
            'name': menu_item.name,
            'price': menu_item.price,
            'quantity': data['quantity'],
            'special_instructions': data.get('special_instructions', ''),
            'customizations': data.get('customizations', [])
        }
        
        # Calculate total price including customizations
        total_price = menu_item.price
        for customization in item['customizations']:
            option = CustomizationOption.query.get_or_404(customization['option_id'])
            total_price += option.price
        
        item['total_price'] = total_price * item['quantity']
        
        # Add to cart
        cart = session.get('cart', [])
        
        # Check if item is already in cart
        for i, cart_item in enumerate(cart):
            if (cart_item['menu_item_id'] == item['menu_item_id'] and 
                cart_item['special_instructions'] == item['special_instructions'] and
                len(cart_item['customizations']) == len(item['customizations'])):
                
                # Check if customizations are the same
                customizations_match = True
                for cust in item['customizations']:
                    if cust not in cart_item['customizations']:
                        customizations_match = False
                        break
                
                if customizations_match:
                    # Update quantity instead of adding new item
                    cart[i]['quantity'] += item['quantity']
                    cart[i]['total_price'] = cart[i]['price'] * cart[i]['quantity']
                    session['cart'] = cart
                    return jsonify({'message': 'Cart updated', 'cart': cart}), 200
        
        # If item is not in cart, add it
        cart.append(item)
        session['cart'] = cart
        
        return jsonify({'message': 'Item added to cart', 'cart': cart}), 201
    
    elif request.method == 'PUT':
        data = request.json
        
        if not data or 'index' not in data or 'quantity' not in data:
            return jsonify({'error': 'Item index and quantity are required'}), 400
        
        cart = session.get('cart', [])
        
        if data['index'] < 0 or data['index'] >= len(cart):
            return jsonify({'error': 'Invalid item index'}), 400
        
        # Update quantity
        cart[data['index']]['quantity'] = data['quantity']
        cart[data['index']]['total_price'] = cart[data['index']]['price'] * data['quantity']
        
        session['cart'] = cart
        
        return jsonify({'message': 'Cart updated', 'cart': cart}), 200
    
    elif request.method == 'DELETE':
        data = request.json
        
        if not data or 'index' not in data:
            return jsonify({'error': 'Item index is required'}), 400
        
        cart = session.get('cart', [])
        
        if data['index'] < 0 or data['index'] >= len(cart):
            return jsonify({'error': 'Invalid item index'}), 400
        
        # Remove item
        cart.pop(data['index'])
        session['cart'] = cart
        
        return jsonify({'message': 'Item removed from cart', 'cart': cart}), 200

@app.route('/api/cart/clear', methods=['POST'])
def api_clear_cart():
    session['cart'] = []
    return jsonify({'message': 'Cart cleared', 'cart': []}), 200

@app.route('/api/addresses', methods=['GET', 'POST'])
@jwt_required(optional=True)
def api_addresses():
    user_id = get_jwt_identity()
    if not user_id and 'user_id' in session:
        user_id = session['user_id']
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    if request.method == 'GET':
        addresses = Address.query.filter_by(user_id=user_id).all()
        return jsonify({
            'addresses': [address.to_dict() for address in addresses]
        }), 200
    
    elif request.method == 'POST':
        data = request.json
        
        # Validate required fields
        required_fields = ['address_line1', 'city', 'state', 'postal_code']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create new address
        address = Address(
            user_id=user_id,
            address_line1=data['address_line1'],
            address_line2=data.get('address_line2', ''),
            city=data['city'],
            state=data['state'],
            postal_code=data['postal_code'],
            is_default=data.get('is_default', False)
        )
        
        # If this is the first address or is_default is True, make sure it's the only default
        if address.is_default:
            existing_default = Address.query.filter_by(user_id=user_id, is_default=True).all()
            for addr in existing_default:
                addr.is_default = False
        
        db.session.add(address)
        db.session.commit()
        
        return jsonify({
            'message': 'Address added successfully',
            'address': address.to_dict()
        }), 201

@app.route('/api/addresses/<int:address_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required(optional=True)
def api_address_detail(address_id):
    user_id = get_jwt_identity()
    if not user_id and 'user_id' in session:
        user_id = session['user_id']
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    address = Address.query.get_or_404(address_id)
    
    # Check if address belongs to user
    if address.user_id != user_id:
        return jsonify({'error': 'You do not have permission to access this address'}), 403
    
    if request.method == 'GET':
        return jsonify(address.to_dict()), 200
    
    elif request.method == 'PUT':
        data = request.json
        
        # Update address fields
        if 'address_line1' in data:
            address.address_line1 = data['address_line1']
        if 'address_line2' in data:
            address.address_line2 = data['address_line2']
        if 'city' in data:
            address.city = data['city']
        if 'state' in data:
            address.state = data['state']
        if 'postal_code' in data:
            address.postal_code = data['postal_code']
        if 'is_default' in data and data['is_default']:
            # If setting as default, update other addresses
            existing_default = Address.query.filter_by(user_id=user_id, is_default=True).all()
            for addr in existing_default:
                addr.is_default = False
            address.is_default = True
        
        db.session.commit()
        
        return jsonify({
            'message': 'Address updated successfully',
            'address': address.to_dict()
        }), 200
    
    elif request.method == 'DELETE':
        db.session.delete(address)
        db.session.commit()
        
        return jsonify({'message': 'Address deleted successfully'}), 200

@app.route('/api/orders', methods=['GET', 'POST'])
@jwt_required(optional=True)
def api_orders():
    user_id = get_jwt_identity()
    if not user_id and 'user_id' in session:
        user_id = session['user_id']
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    if request.method == 'GET':
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        
        result = []
        for order in orders:
            order_dict = order.to_dict()
            order_dict['items'] = []
            
            order_items = OrderItem.query.filter_by(order_id=order.id).all()
            for item in order_items:
                item_dict = item.to_dict()
                item_dict['customizations'] = []
                
                customizations = OrderItemCustomization.query.filter_by(order_item_id=item.id).all()
                for customization in customizations:
                    item_dict['customizations'].append(customization.to_dict())
                
                order_dict['items'].append(item_dict)
            
            result.append(order_dict)
        
        return jsonify({
            'orders': result
        }), 200
    
    elif request.method == 'POST':
        data = request.json
        
        # Validate required fields
        required_fields = ['restaurant_id', 'payment_method', 'delivery_address_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if cart is empty
        cart = session.get('cart', [])
        if not cart:
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Get restaurant
        restaurant = Restaurant.query.get_or_404(data['restaurant_id'])
        
        # Calculate order totals
        subtotal = sum(item['total_price'] for item in cart)
        tax = subtotal * 0.0825  # 8.25% tax rate
        delivery_fee = restaurant.delivery_fee
        tip = data.get('tip', 0.0)
        total = subtotal + tax + delivery_fee + tip
        
        # Create order
        order = Order(
            user_id=user_id,
            restaurant_id=restaurant.id,
            subtotal=subtotal,
            tax=tax,
            delivery_fee=delivery_fee,
            tip=tip,
            total=total,
            payment_method=PaymentMethod(data['payment_method']),
            delivery_address_id=data['delivery_address_id'],
            special_instructions=data.get('special_instructions', ''),
            estimated_delivery_time=datetime.utcnow() + timedelta(minutes=restaurant.delivery_time_max)
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID without committing
        
        # Create order items
        for item in cart:
            menu_item = MenuItem.query.get_or_404(item['menu_item_id'])
            
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=menu_item.id,
                quantity=item['quantity'],
                price=menu_item.price,
                special_instructions=item.get('special_instructions', '')
            )
            
            db.session.add(order_item)
            db.session.flush()  # Get order item ID
            
            # Create order item customizations
            for customization in item.get('customizations', []):
                option = CustomizationOption.query.get_or_404(customization['option_id'])
                
                order_item_customization = OrderItemCustomization(
                    order_item_id=order_item.id,
                    option_id=option.id,
                    price=option.price
                )
                
                db.session.add(order_item_customization)
        
        db.session.commit()
        
        # Clear cart
        session['cart'] = []
        
        return jsonify({
            'message': 'Order placed successfully',
            'order': order.to_dict()
        }), 201

@app.route('/api/orders/<int:order_id>', methods=['GET'])
@jwt_required(optional=True)
def api_order_detail(order_id):
    user_id = get_jwt_identity()
    if not user_id and 'user_id' in session:
        user_id = session['user_id']
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    order = Order.query.get_or_404(order_id)
    
    # Check if order belongs to user
    if order.user_id != user_id:
        return jsonify({'error': 'You do not have permission to access this order'}), 403
    
    order_dict = order.to_dict()
    order_dict['items'] = []
    
    order_items = OrderItem.query.filter_by(order_id=order.id).all()
    for item in order_items:
        item_dict = item.to_dict()
        item_dict['menu_item'] = MenuItem.query.get(item.menu_item_id).to_dict()
        item_dict['customizations'] = []
        
        customizations = OrderItemCustomization.query.filter_by(order_item_id=item.id).all()
        for customization in customizations:
            cust_dict = customization.to_dict()
            option = CustomizationOption.query.get(customization.option_id)
            cust_dict['option'] = option.to_dict()
            item_dict['customizations'].append(cust_dict)
        
        order_dict['items'].append(item_dict)
    
    order_dict['restaurant'] = Restaurant.query.get(order.restaurant_id).to_dict()
    order_dict['delivery_address'] = Address.query.get(order.delivery_address_id).to_dict()
    
    return jsonify(order_dict), 200

@app.route('/api/profile', methods=['GET', 'PUT'])
@jwt_required(optional=True)
def api_profile():
    user_id = get_jwt_identity()
    if not user_id and 'user_id' in session:
        user_id = session['user_id']
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    user = User.query.get_or_404(user_id)
    
    if request.method == 'GET':
        return jsonify(user.to_dict()), 200
    
    elif request.method == 'PUT':
        data = request.json
        
        # Update user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        if 'email' in data:
            # Check if email is already taken
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email']
        
        # Update password if provided
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
