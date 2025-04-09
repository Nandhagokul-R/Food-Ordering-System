import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create SQLAlchemy base class
class Base(DeclarativeBase):
    pass

# Initialize SQLAlchemy with the base class
db = SQLAlchemy(model_class=Base)

# Create the Flask app
app = Flask(__name__)

# Set secret key for session management
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Configure the middleware for handling proxies
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///food_delivery.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hour
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

# Create database tables
with app.app_context():
    # Import models
    import models
    
    # Create tables
    db.create_all()
    
    # Initialize demo data if database is empty
    from utils import initialize_demo_data
    initialize_demo_data()
