from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
import enum

class UserRole(enum.Enum):
    CUSTOMER = "customer"
    RESTAURANT_OWNER = "restaurant_owner"
    ADMIN = "admin"

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    phone_number = db.Column(db.String(20))
    role = db.Column(db.Enum(UserRole), default=UserRole.CUSTOMER)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    addresses = db.relationship('Address', back_populates='user', cascade='all, delete-orphan')
    orders = db.relationship('Order', back_populates='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'role': self.role.value,
            'created_at': self.created_at.isoformat(),
        }

class Address(db.Model):
    __tablename__ = 'addresses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    address_line1 = db.Column(db.String(128), nullable=False)
    address_line2 = db.Column(db.String(128))
    city = db.Column(db.String(64), nullable=False)
    state = db.Column(db.String(64), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='addresses')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'address_line1': self.address_line1,
            'address_line2': self.address_line2,
            'city': self.city,
            'state': self.state,
            'postal_code': self.postal_code,
            'is_default': self.is_default,
        }

class Restaurant(db.Model):
    __tablename__ = 'restaurants'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    address_line1 = db.Column(db.String(128), nullable=False)
    address_line2 = db.Column(db.String(128))
    city = db.Column(db.String(64), nullable=False)
    state = db.Column(db.String(64), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    cuisine_type = db.Column(db.String(64), nullable=False)
    price_range = db.Column(db.Integer, nullable=False)  # 1-4, representing $ to $$$$
    rating = db.Column(db.Float, default=0.0)
    delivery_fee = db.Column(db.Float, default=0.0)
    delivery_time_min = db.Column(db.Integer, default=30)  # in minutes
    delivery_time_max = db.Column(db.Integer, default=45)  # in minutes
    is_active = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    menu_categories = db.relationship('MenuCategory', back_populates='restaurant', cascade='all, delete-orphan')
    orders = db.relationship('Order', back_populates='restaurant', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'address_line1': self.address_line1,
            'address_line2': self.address_line2,
            'city': self.city,
            'state': self.state,
            'postal_code': self.postal_code,
            'phone_number': self.phone_number,
            'email': self.email,
            'cuisine_type': self.cuisine_type,
            'price_range': self.price_range,
            'rating': self.rating,
            'delivery_fee': self.delivery_fee,
            'delivery_time_min': self.delivery_time_min,
            'delivery_time_max': self.delivery_time_max,
            'is_active': self.is_active,
            'image_url': self.image_url,
        }

class MenuCategory(db.Model):
    __tablename__ = 'menu_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    restaurant = db.relationship('Restaurant', back_populates='menu_categories')
    menu_items = db.relationship('MenuItem', back_populates='category', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'restaurant_id': self.restaurant_id,
            'name': self.name,
            'description': self.description,
            'order': self.order,
        }

class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('menu_categories.id'), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(256))
    is_vegetarian = db.Column(db.Boolean, default=False)
    is_vegan = db.Column(db.Boolean, default=False)
    is_gluten_free = db.Column(db.Boolean, default=False)
    spice_level = db.Column(db.Integer, default=0)  # 0-4, representing no spice to very spicy
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('MenuCategory', back_populates='menu_items')
    customization_groups = db.relationship('CustomizationGroup', back_populates='menu_item', cascade='all, delete-orphan')
    order_items = db.relationship('OrderItem', back_populates='menu_item')
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image_url': self.image_url,
            'is_vegetarian': self.is_vegetarian,
            'is_vegan': self.is_vegan,
            'is_gluten_free': self.is_gluten_free,
            'spice_level': self.spice_level,
            'is_available': self.is_available,
        }

class CustomizationGroup(db.Model):
    __tablename__ = 'customization_groups'
    
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.Text)
    is_required = db.Column(db.Boolean, default=False)
    min_selections = db.Column(db.Integer, default=0)
    max_selections = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    menu_item = db.relationship('MenuItem', back_populates='customization_groups')
    options = db.relationship('CustomizationOption', back_populates='group', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'menu_item_id': self.menu_item_id,
            'name': self.name,
            'description': self.description,
            'is_required': self.is_required,
            'min_selections': self.min_selections,
            'max_selections': self.max_selections,
        }

class CustomizationOption(db.Model):
    __tablename__ = 'customization_options'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('customization_groups.id'), nullable=False)
    name = db.Column(db.String(64), nullable=False)
    price = db.Column(db.Float, default=0.0)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    group = db.relationship('CustomizationGroup', back_populates='options')
    order_item_customizations = db.relationship('OrderItemCustomization', back_populates='option')
    
    def to_dict(self):
        return {
            'id': self.id,
            'group_id': self.group_id,
            'name': self.name,
            'price': self.price,
            'is_default': self.is_default,
        }

class OrderStatus(enum.Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentMethod(enum.Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    CASH = "cash"

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    status = db.Column(db.Enum(OrderStatus), default=OrderStatus.PENDING)
    subtotal = db.Column(db.Float, nullable=False)
    tax = db.Column(db.Float, nullable=False)
    delivery_fee = db.Column(db.Float, nullable=False)
    tip = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    delivery_address_id = db.Column(db.Integer, db.ForeignKey('addresses.id'), nullable=False)
    special_instructions = db.Column(db.Text)
    estimated_delivery_time = db.Column(db.DateTime)
    actual_delivery_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='orders')
    restaurant = db.relationship('Restaurant', back_populates='orders')
    delivery_address = db.relationship('Address')
    order_items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'restaurant_id': self.restaurant_id,
            'status': self.status.value,
            'subtotal': self.subtotal,
            'tax': self.tax,
            'delivery_fee': self.delivery_fee,
            'tip': self.tip,
            'total': self.total,
            'payment_method': self.payment_method.value,
            'delivery_address_id': self.delivery_address_id,
            'special_instructions': self.special_instructions,
            'estimated_delivery_time': self.estimated_delivery_time.isoformat() if self.estimated_delivery_time else None,
            'actual_delivery_time': self.actual_delivery_time.isoformat() if self.actual_delivery_time else None,
            'created_at': self.created_at.isoformat(),
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price = db.Column(db.Float, nullable=False)  # Price at the time of ordering
    special_instructions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = db.relationship('Order', back_populates='order_items')
    menu_item = db.relationship('MenuItem', back_populates='order_items')
    customizations = db.relationship('OrderItemCustomization', back_populates='order_item', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'menu_item_id': self.menu_item_id,
            'quantity': self.quantity,
            'price': self.price,
            'special_instructions': self.special_instructions,
        }

class OrderItemCustomization(db.Model):
    __tablename__ = 'order_item_customizations'
    
    id = db.Column(db.Integer, primary_key=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.id'), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey('customization_options.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)  # Price at the time of ordering
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order_item = db.relationship('OrderItem', back_populates='customizations')
    option = db.relationship('CustomizationOption', back_populates='order_item_customizations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_item_id': self.order_item_id,
            'option_id': self.option_id,
            'price': self.price,
        }
