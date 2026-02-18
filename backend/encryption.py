"""Encryption utilities for sensitive data."""
import os
import base64
import secrets
from dotenv import load_dotenv
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Load environment variables
load_dotenv()

# Get encryption key from environment - FAIL if not set
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise RuntimeError("ENCRYPTION_KEY environment variable must be set!")

# Use a random salt stored in env or generate one per encryption
ENCRYPTION_SALT = os.getenv("ENCRYPTION_SALT")


def derive_key(key: str, salt: bytes) -> bytes:
    """Derive a Fernet key from password and salt."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480000,
    )
    return base64.urlsafe_b64encode(kdf.derive(key.encode()))


def encrypt_value(value: str) -> str:
    """Encrypt a string value with random salt.
    
    Format: base64(salt + encrypted_data)
    """
    if not value:
        return value
    
    # Generate random salt for each encryption
    salt = secrets.token_bytes(16)
    
    # Derive key with this salt
    key = derive_key(ENCRYPTION_KEY, salt)
    f = Fernet(key)
    
    # Encrypt
    encrypted = f.encrypt(value.encode())
    
    # Combine salt + encrypted and encode
    combined = salt + encrypted
    return base64.urlsafe_b64encode(combined).decode()


def decrypt_value(encrypted_value: str) -> str:
    """Decrypt an encrypted string value.
    
    Raises exception on failure instead of returning plaintext.
    """
    if not encrypted_value:
        return encrypted_value
    
    try:
        # Decode from base64
        combined = base64.urlsafe_b64decode(encrypted_value.encode())
        
        # Extract salt (first 16 bytes) and encrypted data
        salt = combined[:16]
        encrypted = combined[16:]
        
        # Derive key with the salt
        key = derive_key(ENCRYPTION_KEY, salt)
        f = Fernet(key)
        
        # Decrypt
        return f.decrypt(encrypted).decode()
    except (InvalidToken, Exception) as e:
        raise ValueError(f"Failed to decrypt value: {e}")
