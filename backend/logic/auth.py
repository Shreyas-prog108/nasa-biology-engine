import sqlite3
import hashlib
import secrets
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt

# Database configuration
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'users.db')
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def init_database():
    """Initialize the SQLite database with users table"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def hash_password(password: str, salt: str = None) -> tuple:
    """Hash password with salt"""
    if salt is None:
        salt = secrets.token_hex(16)
    
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return password_hash.hex(), salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verify password against hash"""
    test_hash, _ = hash_password(password, salt)
    return test_hash == password_hash

def create_user(username: str, email: str, password: str) -> Dict[str, Any]:
    """Create a new user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE username = ? OR email = ?', (username, email))
        if cursor.fetchone():
            return {"success": False, "message": "Username or email already exists"}
        
        # Hash password
        password_hash, salt = hash_password(password)
        
        # Insert user
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, salt)
            VALUES (?, ?, ?, ?)
        ''', (username, email, password_hash, salt))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        return {
            "success": True,
            "message": "User created successfully",
            "user_id": user_id
        }
        
    except Exception as e:
        conn.rollback()
        return {"success": False, "message": f"Error creating user: {str(e)}"}
    finally:
        conn.close()

def authenticate_user(username: str, password: str) -> Dict[str, Any]:
    """Authenticate user and return JWT token"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get user data
        cursor.execute('''
            SELECT id, username, email, password_hash, salt, is_active
            FROM users WHERE username = ? OR email = ?
        ''', (username, username))
        
        user = cursor.fetchone()
        if not user:
            return {"success": False, "message": "Invalid credentials"}
        
        user_id, db_username, email, password_hash, salt, is_active = user
        
        if not is_active:
            return {"success": False, "message": "Account is deactivated"}
        
        # Verify password
        if not verify_password(password, password_hash, salt):
            return {"success": False, "message": "Invalid credentials"}
        
        # Generate JWT token
        payload = {
            'user_id': user_id,
            'username': db_username,
            'email': email,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Store session
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        
        cursor.execute('''
            INSERT INTO user_sessions (user_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        ''', (user_id, token_hash, expires_at))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Authentication successful",
            "token": token,
            "user": {
                "id": user_id,
                "username": db_username,
                "email": email
            }
        }
        
    except Exception as e:
        return {"success": False, "message": f"Authentication error: {str(e)}"}
    finally:
        conn.close()

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Check if session exists and is active
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        cursor.execute('''
            SELECT us.id, u.id, u.username, u.email, u.is_active
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.token_hash = ? AND us.is_active = 1 AND us.expires_at > ?
        ''', (token_hash, datetime.utcnow()))
        
        session = cursor.fetchone()
        conn.close()
        
        if not session:
            return {"success": False, "message": "Invalid or expired token"}
        
        return {
            "success": True,
            "user": {
                "id": payload['user_id'],
                "username": payload['username'],
                "email": payload['email']
            }
        }
        
    except jwt.ExpiredSignatureError:
        return {"success": False, "message": "Token has expired"}
    except jwt.InvalidTokenError:
        return {"success": False, "message": "Invalid token"}

def logout_user(token: str) -> Dict[str, Any]:
    """Logout user by deactivating session"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        cursor.execute('''
            UPDATE user_sessions 
            SET is_active = 0 
            WHERE token_hash = ? AND is_active = 1
        ''', (token_hash,))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Logged out successfully"}
        
    except Exception as e:
        return {"success": False, "message": f"Logout error: {str(e)}"}

def get_user_by_id(user_id: int) -> Dict[str, Any]:
    """Get user by ID"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT id, username, email, created_at, is_active
            FROM users WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        if not user:
            return {"success": False, "message": "User not found"}
        
        return {
            "success": True,
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "created_at": user[3],
                "is_active": user[4]
            }
        }
        
    except Exception as e:
        return {"success": False, "message": f"Error fetching user: {str(e)}"}
    finally:
        conn.close()

# Initialize database on import
init_database()
