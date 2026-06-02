from app import db
from models import *
from werkzeug.security import generate_password_hash
import logging
import random

# Function to initialize demo data
def initialize_demo_data():
    # Check if there's already data in the database
    if Restaurant.query.count() > 0:
        logging.info("Database already contains data, skipping initialization")
        return
    
    logging.info("Initializing demo data...")
    
    # Create demo users
    demo_user = User(
        username="demo_user",
        email="demo@example.com",
        first_name="Demo",
        last_name="User",
        phone_number="555-123-4567",
        password_hash=generate_password_hash("password123")
    )
    
    # Create admin user
    admin_user = User(
        username="admin",
        email="admin@fooddelivery.com",
        first_name="Admin",
        last_name="User",
        phone_number="555-987-6543",
        password_hash=generate_password_hash("admin@123"),
        role=UserRole.ADMIN
    )
    
    # Create demo user address
    demo_address = Address(
        user=demo_user,
        address_line1="123 Main St",
        city="San Francisco",
        state="CA",
        postal_code="94105",
        is_default=True
    )
    
    db.session.add(demo_user)
    db.session.add(admin_user)
    db.session.add(demo_address)
    
    # Create restaurants
    restaurants = [
        {
            "name": "Burger Palace",
            "description": "Gourmet burgers with fresh ingredients and homemade sauces.",
            "address_line1": "456 Market St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94103",
            "phone_number": "555-987-6543",
            "email": "info@burgerpalace.com",
            "cuisine_type": "American",
            "price_range": 2,
            "rating": 4.5,
            "delivery_fee": 3.99,
            "delivery_time_min": 25,
            "delivery_time_max": 40,
            "image_url": "https://res.cloudinary.com/dk-find-out/image/upload/q_80,w_1920,f_auto/DCTM_Penguin_UK_DK_AL526630_wkmzns.jpg"
        },
        {
            "name": "Pizza Haven",
            "description": "Authentic Italian pizza made in wood-fired ovens.",
            "address_line1": "789 Mission St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94105",
            "phone_number": "555-456-7890",
            "email": "contact@pizzahaven.com",
            "cuisine_type": "Italian",
            "price_range": 2,
            "rating": 4.3,
            "delivery_fee": 2.99,
            "delivery_time_min": 20,
            "delivery_time_max": 35,
            "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591"
        },
        {
            "name": "Sushi Kingdom",
            "description": "Fresh and innovative sushi created by master chefs.",
            "address_line1": "321 Folsom St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94107",
            "phone_number": "555-789-0123",
            "email": "eat@sushikingdom.com",
            "cuisine_type": "Japanese",
            "price_range": 3,
            "rating": 4.7,
            "delivery_fee": 4.99,
            "delivery_time_min": 30,
            "delivery_time_max": 45,
            "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c"
        },
        {
            "name": "Taco Fiesta",
            "description": "Authentic Mexican street food with fresh, local ingredients.",
            "address_line1": "654 Howard St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94105",
            "phone_number": "555-321-6540",
            "email": "hola@tacofiesta.com",
            "cuisine_type": "Mexican",
            "price_range": 1,
            "rating": 4.2,
            "delivery_fee": 1.99,
            "delivery_time_min": 15,
            "delivery_time_max": 30,
            "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47"
        },
        {
            "name": "Thai Spice",
            "description": "Authentic Thai cuisine with the perfect balance of flavors.",
            "address_line1": "987 Bryant St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94103",
            "phone_number": "555-654-3210",
            "email": "info@thaispice.com",
            "cuisine_type": "Thai",
            "price_range": 2,
            "rating": 4.4,
            "delivery_fee": 3.49,
            "delivery_time_min": 25,
            "delivery_time_max": 40,
            "image_url": "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4"
        },
        {
            "name": "Indian Curry House",
            "description": "Traditional Indian curries and tandoori specialties.",
            "address_line1": "432 Valencia St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94103",
            "phone_number": "555-234-5678",
            "email": "info@indiancurryhouse.com",
            "cuisine_type": "Indian",
            "price_range": 2,
            "rating": 4.6,
            "delivery_fee": 3.99,
            "delivery_time_min": 30,
            "delivery_time_max": 45,
            "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe"
        },
        {
            "name": "Mediterranean Delight",
            "description": "Fresh Mediterranean cuisine featuring kebabs, falafel, and hummus.",
            "address_line1": "765 Polk St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94109",
            "phone_number": "555-876-5432",
            "email": "info@meddelight.com",
            "cuisine_type": "Mediterranean",
            "price_range": 2,
            "rating": 4.5,
            "delivery_fee": 3.49,
            "delivery_time_min": 25,
            "delivery_time_max": 40,
            "image_url": "https://images.unsplash.com/photo-1544378730-8b5104b41021"
        },
        {
            "name": "Pho Express",
            "description": "Authentic Vietnamese pho and banh mi sandwiches.",
            "address_line1": "543 Larkin St",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94102",
            "phone_number": "555-345-6789",
            "email": "info@phoexpress.com",
            "cuisine_type": "Vietnamese",
            "price_range": 1,
            "rating": 4.3,
            "delivery_fee": 2.99,
            "delivery_time_min": 20,
            "delivery_time_max": 35,
            "image_url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43"
        }
    ]
    
    restaurant_objects = []
    
    for restaurant_data in restaurants:
        restaurant = Restaurant(**restaurant_data)
        restaurant_objects.append(restaurant)
        db.session.add(restaurant)
    
    # Create menu categories and items for each restaurant
    for idx, restaurant in enumerate(restaurant_objects):
        categories = []
        
        if idx == 0:  # Karam Restaurant
            categories = [
                {
                    "name": "Burgers",
                    "description": "Our signature gourmet burgers",
                    "order": 1
                },
                {
                    "name": "Sides",
                    "description": "Perfect companions to your burger",
                    "order": 2
                },
                {
                    "name": "Drinks",
                    "description": "Refreshing beverages",
                    "order": 3
                }
            ]
        elif idx == 1:  # Pizza Haven
            categories = [
                {
                    "name": "Pizzas",
                    "description": "Wood-fired artisanal pizzas",
                    "order": 1
                },
                {
                    "name": "Pasta",
                    "description": "Fresh homemade pasta dishes",
                    "order": 2
                },
                {
                    "name": "Salads",
                    "description": "Fresh Italian salads",
                    "order": 3
                }
            ]
        elif idx == 2:  # Sushi Kingdom
            categories = [
                {
                    "name": "Sushi Rolls",
                    "description": "Fresh and creative sushi rolls",
                    "order": 1
                },
                {
                    "name": "Sashimi",
                    "description": "Premium quality raw fish",
                    "order": 2
                },
                {
                    "name": "Hot Dishes",
                    "description": "Traditional Japanese hot dishes",
                    "order": 3
                }
            ]
        elif idx == 3:  # Taco Fiesta
            categories = [
                {
                    "name": "Tacos",
                    "description": "Authentic Mexican tacos",
                    "order": 1
                },
                {
                    "name": "Burritos",
                    "description": "Fresh and filling burritos",
                    "order": 2
                },
                {
                    "name": "Sides",
                    "description": "Mexican sides and appetizers",
                    "order": 3
                }
            ]
        elif idx == 4:  # Thai Spice
            categories = [
                {
                    "name": "Curries",
                    "description": "Authentic Thai curries",
                    "order": 1
                },
                {
                    "name": "Noodles",
                    "description": "Traditional Thai noodle dishes",
                    "order": 2
                },
                {
                    "name": "Stir Fry",
                    "description": "Wok-fried specialties",
                    "order": 3
                }
            ]
        elif idx == 5:  # Indian Curry House
            categories = [
                {
                    "name": "Curries",
                    "description": "Traditional Indian curries",
                    "order": 1
                },
                {
                    "name": "Tandoor",
                    "description": "Tandoor-cooked specialties",
                    "order": 2
                },
                {
                    "name": "Breads",
                    "description": "Fresh Indian breads",
                    "order": 3
                }
            ]
        elif idx == 6:  # Mediterranean Delight
            categories = [
                {
                    "name": "Kebabs",
                    "description": "Grilled meat and vegetable kebabs",
                    "order": 1
                },
                {
                    "name": "Mezze",
                    "description": "Mediterranean appetizers",
                    "order": 2
                },
                {
                    "name": "Wraps",
                    "description": "Fresh pita wraps",
                    "order": 3
                }
            ]
        elif idx == 7:  # Pho Express
            categories = [
                {
                    "name": "Pho",
                    "description": "Traditional Vietnamese noodle soup",
                    "order": 1
                },
                {
                    "name": "Banh Mi",
                    "description": "Vietnamese sandwiches",
                    "order": 2
                },
                {
                    "name": "Rice Dishes",
                    "description": "Vietnamese rice specialties",
                    "order": 3
                }
            ]
        
        category_objects = []
        for category_data in categories:
            category = MenuCategory(restaurant=restaurant, **category_data)
            category_objects.append(category)
            db.session.add(category)
    
    # Create menu items for each restaurant
    for idx, restaurant in enumerate(restaurant_objects):
        if idx == 0:  # Burger Palace
            menu_items = [
                {
                    "category": category_objects[0],  # Burgers
                    "name": "Classic Cheeseburger",
                    "description": "100% Angus beef patty with cheddar cheese, lettuce, tomato, and our special sauce.",
                    "price": 9.99,
                    "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
                    "is_vegetarian": False,
                    "spice_level": 0
                },
                {
                    "category": category_objects[0],  # Burgers
                    "name": "Bacon Deluxe",
                    "description": "100% Angus beef patty with crispy bacon, cheddar cheese, caramelized onions, and BBQ sauce.",
                    "price": 12.99,
                    "image_url": "https://images.unsplash.com/photo-1566217688581-b2191944c2f9",
                    "is_vegetarian": False,
                    "spice_level": 1
                },
                {
                    "category": category_objects[0],  # Burgers
                    "name": "Veggie Burger",
                    "description": "House-made plant-based patty with avocado, lettuce, tomato, and vegan aioli.",
                    "price": 10.99,
                    "image_url": "https://images.unsplash.com/photo-1520072959219-c595dc870360",
                    "is_vegetarian": True,
                    "spice_level": 0
                }
            ]
        elif idx == 1:  # Pizza Haven
            menu_items = [
                {
                    "category": category_objects[0],  # Pizzas
                    "name": "Margherita Pizza",
                    "description": "Fresh mozzarella, tomatoes, basil, and extra virgin olive oil.",
                    "price": 14.99,
                    "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
                    "is_vegetarian": True,
                    "spice_level": 0
                },
                {
                    "category": category_objects[1],  # Pasta
                    "name": "Fettuccine Alfredo",
                    "description": "Fresh fettuccine in creamy parmesan sauce.",
                    "price": 13.99,
                    "image_url": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a",
                    "is_vegetarian": True,
                    "spice_level": 0
                }
            ]
        elif idx == 2:  # Sushi Kingdom
            menu_items = [
                {
                    "category": category_objects[0],  # Sushi Rolls
                    "name": "Dragon Roll",
                    "description": "Eel and cucumber roll topped with avocado and eel sauce.",
                    "price": 15.99,
                    "image_url": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
                    "is_vegetarian": False,
                    "spice_level": 0
                },
                {
                    "category": category_objects[1],  # Sashimi
                    "name": "Salmon Sashimi",
                    "description": "Fresh premium salmon sashimi.",
                    "price": 16.99,
                    "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
                    "is_vegetarian": False,
                    "spice_level": 0
                }
            ]
        elif idx == 3:  # Taco Fiesta
            menu_items = [
                {
                    "category": category_objects[0],  # Tacos
                    "name": "Carne Asada Tacos",
                    "description": "Grilled steak tacos with onions, cilantro, and lime.",
                    "price": 8.99,
                    "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47",
                    "is_vegetarian": False,
                    "spice_level": 2
                },
                {
                    "category": category_objects[1],  # Burritos
                    "name": "Veggie Burrito",
                    "description": "Rice, beans, grilled vegetables, guacamole, and pico de gallo.",
                    "price": 9.99,
                    "image_url": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f",
                    "is_vegetarian": True,
                    "spice_level": 1
                }
            ]
        elif idx == 4:  # Thai Spice
            menu_items = [
                {
                    "category": category_objects[0],  # Curries
                    "name": "Green Curry",
                    "description": "Thai green curry with bamboo shoots, bell peppers, and basil.",
                    "price": 12.99,
                    "image_url": "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4",
                    "is_vegetarian": False,
                    "spice_level": 3
                },
                {
                    "category": category_objects[1],  # Noodles
                    "name": "Pad Thai",
                    "description": "Stir-fried rice noodles with tofu, shrimp, peanuts, and tamarind sauce.",
                    "price": 11.99,
                    "image_url": "https://images.unsplash.com/photo-1559314809-0d155014e29e",
                    "is_vegetarian": False,
                    "spice_level": 2
                }
            ]
        elif idx == 5:  # Indian Curry House
            menu_items = [
                {
                    "category": category_objects[0],  # Curries
                    "name": "Butter Chicken",
                    "description": "Tender chicken in rich tomato-cream curry sauce.",
                    "price": 14.99,
                    "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe",
                    "is_vegetarian": False,
                    "spice_level": 2
                },
                {
                    "category": category_objects[1],  # Tandoor
                    "name": "Paneer Tikka",
                    "description": "Marinated and grilled cottage cheese with vegetables.",
                    "price": 12.99,
                    "image_url": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8",
                    "is_vegetarian": True,
                    "spice_level": 2
                }
            ]
        elif idx == 6:  # Mediterranean Delight
            menu_items = [
                {
                    "category": category_objects[0],  # Kebabs
                    "name": "Mixed Grill Kebab",
                    "description": "Assorted grilled meats with vegetables and rice.",
                    "price": 16.99,
                    "image_url": "https://images.unsplash.com/photo-1544378730-8b5104b41021",
                    "is_vegetarian": False,
                    "spice_level": 1
                },
                {
                    "category": category_objects[1],  # Mezze
                    "name": "Mezze Platter",
                    "description": "Hummus, baba ganoush, falafel, and pita bread.",
                    "price": 13.99,
                    "image_url": "https://images.unsplash.com/photo-1542528180-a1208c5169a5",
                    "is_vegetarian": True,
                    "spice_level": 0
                }
            ]
        elif idx == 7:  # Pho Express
            menu_items = [
                {
                    "category": category_objects[0],  # Pho
                    "name": "Pho Tai",
                    "description": "Vietnamese beef noodle soup with rare steak.",
                    "price": 11.99,
                    "image_url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43",
                    "is_vegetarian": False,
                    "spice_level": 1
                },
                {
                    "category": category_objects[1],  # Banh Mi
                    "name": "Grilled Pork Banh Mi",
                    "description": "Vietnamese sandwich with grilled pork, pickled vegetables, and pate.",
                    "price": 8.99,
                    "image_url": "https://images.unsplash.com/photo-1600454309261-3dc9b7597637",
                    "is_vegetarian": False,
                    "spice_level": 1
                }
            ]
        
        for menu_item_data in menu_items:
            menu_item = MenuItem(**menu_item_data)
            db.session.add(menu_item)
    
    for item_data in burger_menu_items:
        item = MenuItem(**item_data)
        db.session.add(item)
        
        # Add customization groups and options for burgers
        if item.name in ["Classic Cheeseburger", "Bacon Deluxe", "Veggie Burger"]:
            # Patty customization
            patty_group = CustomizationGroup(
                menu_item=item,
                name="Patty Options",
                description="Choose your patty",
                is_required=False,
                min_selections=0,
                max_selections=1
            )
            db.session.add(patty_group)
            
            patty_options = [
                {
                    "name": "Single Patty",
                    "price": 0.0,
                    "is_default": True
                },
                {
                    "name": "Double Patty",
                    "price": 3.0,
                    "is_default": False
                }
            ]
            
            for option_data in patty_options:
                option = CustomizationOption(group=patty_group, **option_data)
                db.session.add(option)
            
            # Cheese customization
            cheese_group = CustomizationGroup(
                menu_item=item,
                name="Cheese Options",
                description="Choose your cheese",
                is_required=False,
                min_selections=0,
                max_selections=1
            )
            db.session.add(cheese_group)
            
            cheese_options = [
                {
                    "name": "Cheddar",
                    "price": 0.0,
                    "is_default": True
                },
                {
                    "name": "American",
                    "price": 0.0,
                    "is_default": False
                },
                {
                    "name": "Swiss",
                    "price": 0.5,
                    "is_default": False
                },
                {
                    "name": "Pepper Jack",
                    "price": 0.5,
                    "is_default": False
                }
            ]
            
            for option_data in cheese_options:
                option = CustomizationOption(group=cheese_group, **option_data)
                db.session.add(option)
            
            # Toppings customization
            toppings_group = CustomizationGroup(
                menu_item=item,
                name="Extra Toppings",
                description="Add extra toppings",
                is_required=False,
                min_selections=0,
                max_selections=5
            )
            db.session.add(toppings_group)
            
            toppings_options = [
                {
                    "name": "Bacon",
                    "price": 1.5,
                    "is_default": False
                },
                {
                    "name": "Avocado",
                    "price": 1.5,
                    "is_default": False
                },
                {
                    "name": "Fried Egg",
                    "price": 1.0,
                    "is_default": False
                },
                {
                    "name": "Caramelized Onions",
                    "price": 0.75,
                    "is_default": False
                },
                {
                    "name": "Jalapeños",
                    "price": 0.5,
                    "is_default": False
                }
            ]
            
            for option_data in toppings_options:
                option = CustomizationOption(group=toppings_group, **option_data)
                db.session.add(option)
        
        # Add customization for fries
        if item.name == "French Fries":
            size_group = CustomizationGroup(
                menu_item=item,
                name="Size",
                description="Choose your size",
                is_required=True,
                min_selections=1,
                max_selections=1
            )
            db.session.add(size_group)
            
            size_options = [
                {
                    "name": "Regular",
                    "price": 0.0,
                    "is_default": True
                },
                {
                    "name": "Large",
                    "price": 1.5,
                    "is_default": False
                }
            ]
            
            for option_data in size_options:
                option = CustomizationOption(group=size_group, **option_data)
                db.session.add(option)
            
            # Add dips
            dips_group = CustomizationGroup(
                menu_item=item,
                name="Dipping Sauce",
                description="Choose your dipping sauce",
                is_required=False,
                min_selections=0,
                max_selections=3
            )
            db.session.add(dips_group)
            
            dips_options = [
                {
                    "name": "Ketchup",
                    "price": 0.0,
                    "is_default": False
                },
                {
                    "name": "Ranch",
                    "price": 0.5,
                    "is_default": False
                },
                {
                    "name": "Garlic Aioli",
                    "price": 0.5,
                    "is_default": False
                },
                {
                    "name": "BBQ Sauce",
                    "price": 0.5,
                    "is_default": False
                }
            ]
            
            for option_data in dips_options:
                option = CustomizationOption(group=dips_group, **option_data)
                db.session.add(option)
        
        # Add customization for milkshakes
        if item.name == "Milkshake":
            flavor_group = CustomizationGroup(
                menu_item=item,
                name="Flavor",
                description="Choose your flavor",
                is_required=True,
                min_selections=1,
                max_selections=1
            )
            db.session.add(flavor_group)
            
            flavor_options = [
                {
                    "name": "Vanilla",
                    "price": 0.0,
                    "is_default": True
                },
                {
                    "name": "Chocolate",
                    "price": 0.0,
                    "is_default": False
                },
                {
                    "name": "Strawberry",
                    "price": 0.0,
                    "is_default": False
                }
            ]
            
            for option_data in flavor_options:
                option = CustomizationOption(group=flavor_group, **option_data)
                db.session.add(option)
    
    # Create menu categories and items for Pizza Haven
    pizza_haven = restaurant_objects[1]
    
    pizza_categories = [
        {
            "name": "Pizzas",
            "description": "Our signature wood-fired pizzas",
            "order": 1
        },
        {
            "name": "Pasta",
            "description": "Authentic Italian pasta dishes",
            "order": 2
        },
        {
            "name": "Sides",
            "description": "Perfect companions to your meal",
            "order": 3
        },
        {
            "name": "Desserts",
            "description": "Sweet treats to finish your meal",
            "order": 4
        }
    ]
    
    pizza_category_objects = []
    
    for category_data in pizza_categories:
        category = MenuCategory(restaurant=pizza_haven, **category_data)
        pizza_category_objects.append(category)
        db.session.add(category)
    
    # Create some menu items for Pizza Haven
    pizza_menu_items = [
        {
            "category": pizza_category_objects[0],  # Pizzas
            "name": "Margherita",
            "description": "Fresh mozzarella, tomato sauce, and basil.",
            "price": 12.99,
            "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
            "is_vegetarian": True,
            "spice_level": 0,
        },
        {
            "category": pizza_category_objects[0],  # Pizzas
            "name": "Pepperoni",
            "description": "Classic pepperoni with mozzarella cheese and tomato sauce.",
            "price": 14.99,
            "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e",
            "is_vegetarian": False,
            "spice_level": 1,
        },
        {
            "category": pizza_category_objects[1],  # Pasta
            "name": "Spaghetti Carbonara",
            "description": "Spaghetti with a creamy sauce, bacon, and parmesan cheese.",
            "price": 13.99,
            "image_url": "https://images.unsplash.com/photo-1608756687911-aa1599ab3bd9",
            "is_vegetarian": False,
            "spice_level": 0,
        }
    ]
    
    for item_data in pizza_menu_items:
        item = MenuItem(**item_data)
        db.session.add(item)
        
        # Add customization for pizzas
        if item.name in ["Margherita", "Pepperoni"]:
            # Size customization
            size_group = CustomizationGroup(
                menu_item=item,
                name="Size",
                description="Choose your pizza size",
                is_required=True,
                min_selections=1,
                max_selections=1
            )
            db.session.add(size_group)
            
            size_options = [
                {
                    "name": "Medium (12\")",
                    "price": 0.0,
                    "is_default": True
                },
                {
                    "name": "Large (14\")",
                    "price": 3.0,
                    "is_default": False
                },
                {
                    "name": "X-Large (16\")",
                    "price": 5.0,
                    "is_default": False
                }
            ]
            
            for option_data in size_options:
                option = CustomizationOption(group=size_group, **option_data)
                db.session.add(option)
            
            # Crust customization
            crust_group = CustomizationGroup(
                menu_item=item,
                name="Crust",
                description="Choose your crust type",
                is_required=True,
                min_selections=1,
                max_selections=1
            )
            db.session.add(crust_group)
            
            crust_options = [
                {
                    "name": "Traditional",
                    "price": 0.0,
                    "is_default": True
                },
                {
                    "name": "Thin",
                    "price": 0.0,
                    "is_default": False
                },
                {
                    "name": "Gluten-Free",
                    "price": 2.0,
                    "is_default": False
                }
            ]
            
            for option_data in crust_options:
                option = CustomizationOption(group=crust_group, **option_data)
                db.session.add(option)
            
            # Extra toppings
            toppings_group = CustomizationGroup(
                menu_item=item,
                name="Extra Toppings",
                description="Add extra toppings",
                is_required=False,
                min_selections=0,
                max_selections=5
            )
            db.session.add(toppings_group)
            
            toppings_options = [
                {
                    "name": "Pepperoni",
                    "price": 1.5,
                    "is_default": False
                },
                {
                    "name": "Mushrooms",
                    "price": 1.0,
                    "is_default": False
                },
                {
                    "name": "Bell Peppers",
                    "price": 1.0,
                    "is_default": False
                },
                {
                    "name": "Onions",
                    "price": 1.0,
                    "is_default": False
                },
                {
                    "name": "Extra Cheese",
                    "price": 1.5,
                    "is_default": False
                }
            ]
            
            for option_data in toppings_options:
                option = CustomizationOption(group=toppings_group, **option_data)
                db.session.add(option)
    
    # Commit all changes to the database
    db.session.commit()
    logging.info("Demo data initialized successfully")
