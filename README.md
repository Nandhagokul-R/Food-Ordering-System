# Food Delivery Application

## Overview

This is a comprehensive food delivery web application built with Flask and PostgreSQL. The application enables restaurant menu management, order processing, and includes an administrative control panel.

## Features

- User Authentication (Register, Login, Logout)
- Restaurant Browsing and Menu Viewing
- Shopping Cart Functionality
- Order Placement and Tracking
- User Profile Management
- Admin Dashboard for Menu Management

## Technology Stack

- **Backend**: Python Flask
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Authentication**: Flask-Login, JWT

## Getting Started

1. Make sure you're running the application through Replit
2. The application should automatically start on port 5000
3. Access the application through the Replit webview

## Admin Access

To access the admin features:
- Username: admin
- Password: admin@123

## API Endpoints

The application provides both web interfaces and API endpoints:

- `/api/restaurants` - Get all restaurants
- `/api/restaurants/<id>` - Get details for a specific restaurant
- `/api/cart` - Manage cart operations
- `/api/orders` - View and manage orders
- `/api/profile` - User profile management

## Development

The database is automatically populated with demo data on startup, including:
- Demo user account
- Admin user account
- Sample restaurants and menu items

## Troubleshooting

If you can't access the application, try:
1. Restarting the Replit server
2. Check that port 5000 is being correctly used and exposed
3. Ensure that all database tables are correctly created

## Design

The application follows responsive design principles and is optimized for all screen sizes from mobile to desktop.