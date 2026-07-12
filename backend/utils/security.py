import os
import base64
import hashlib
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from sqlalchemy.types import TypeDecorator, String, JSON

# Resolve Encryption Key
key_env = os.getenv("ENCRYPTION_KEY")
if key_env:
    try:
        ENCRYPTION_KEY = base64.b64decode(key_env)
        if len(ENCRYPTION_KEY) != 32:
            raise ValueError()
    except Exception:
        try:
            ENCRYPTION_KEY = bytes.fromhex(key_env)
            if len(ENCRYPTION_KEY) != 32:
                raise ValueError()
        except Exception:
            ENCRYPTION_KEY = hashlib.sha256(key_env.encode('utf-8')).digest()
else:
    # Use standard static key for SSJewellery database encryption
    db_secret = "supersecret_SSJewellery_key_123"
    ENCRYPTION_KEY = hashlib.sha256(db_secret.encode('utf-8')).digest()

def get_deterministic_iv(plain_text):
    """Derive a 16-byte IV deterministically from the plaintext."""
    h = hashlib.sha256(plain_text.encode('utf-8')).digest()
    return h[:16]

def encrypt(plain_text):
    """Encrypt plain_text using AES-256-CBC with a synthetic deterministic IV."""
    if plain_text is None:
        return None
    plain_str = str(plain_text)
    if not plain_str:
        return plain_str
    if plain_str.startswith("BB_ENC:"):
        return plain_str
        
    try:
        iv = get_deterministic_iv(plain_str)
        cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(plain_str.encode('utf-8')) + padder.finalize()
        
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        combined = iv + ciphertext
        encoded = base64.b64encode(combined).decode('utf-8')
        return f"BB_ENC:{encoded}"
    except Exception as e:
        print(f"Encryption error: {e}")
        return plain_str

def decrypt(cipher_text):
    """Decrypt cipher_text using AES-256-CBC."""
    if cipher_text is None:
        return None
    cipher_str = str(cipher_text)
    if not cipher_str.startswith("BB_ENC:"):
        return cipher_str
        
    try:
        encoded = cipher_str[len("BB_ENC:"):]
        combined = base64.b64decode(encoded.encode('utf-8'))
        
        iv = combined[:16]
        ciphertext = combined[16:]
        
        cipher = Cipher(algorithms.AES(ENCRYPTION_KEY), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        
        padded_data = decryptor.update(ciphertext) + decryptor.finalize()
        
        unpadder = padding.PKCS7(128).unpadder()
        plain_text = unpadder.update(padded_data) + unpadder.finalize()
        
        return plain_text.decode('utf-8')
    except Exception as e:
        print(f"Decryption error: {e}")
        return cipher_str

def mask_email(email):
    """Mask email as ir**********@gmail.com."""
    if not email or "@" not in email:
        return email
    username, domain = email.split("@", 1)
    if len(username) <= 2:
        masked_username = username + "*" * 10
    else:
        masked_username = username[:2] + "*" * 10
    return f"{masked_username}@{domain}"

def mask_phone(phone):
    """Mask phone as 98******10."""
    if not phone:
        return phone
    clean_phone = str(phone).strip()
    if len(clean_phone) >= 4:
        return f"{clean_phone[:2]}{'*' * 6}{clean_phone[-2:]}"
    return "**" * len(clean_phone)

def mask_name(name):
    """Mask customer name like Rahul Sharma -> Ra*** Sh****."""
    if not name:
        return name
    parts = name.split()
    masked_parts = []
    for part in parts:
        if len(part) <= 2:
            masked_parts.append(part[0] + "*" * len(part[1:]))
        else:
            masked_parts.append(part[:2] + "*" * (len(part) - 2))
    return " ".join(masked_parts)

def mask_address(address_str):
    """Mask address like 45 Green Meadows Apartment -> 45 Green ****** Apartment."""
    if not address_str:
        return address_str
    words = address_str.split()
    if len(words) <= 2:
        return words[0] + " ******" if words else "******"
    first_part = " ".join(words[:2])
    last_part = words[-1]
    return f"{first_part} ****** {last_part}"

def mask_city(city):
    """Mask city name."""
    if not city:
        return city
    return city[:2] + "*" * (len(city) - 2) if len(city) > 2 else city + "***"

def mask_state(state):
    """Mask state name."""
    if not state:
        return state
    return state[:2] + "*" * (len(state) - 2) if len(state) > 2 else state + "***"

def mask_pincode(pincode):
    """Mask pincode."""
    if not pincode:
        return pincode
    p = str(pincode).strip()
    if len(p) >= 4:
        return p[:2] + "*" * (len(p) - 2)
    return "**" * len(p)

def encryptSensitiveData(plain_text):
    """Encrypt plain_text using central security configuration."""
    return encrypt(plain_text)

def decryptSensitiveData(cipher_text):
    """Decrypt cipher_text using central security configuration."""
    return decrypt(cipher_text)

class EncryptedString(TypeDecorator):
    """SQLAlchemy TypeDecorator for automatically encrypting/decrypting String columns."""
    impl = String
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return encryptSensitiveData(value)
        
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return decryptSensitiveData(value)

class EncryptedJSON(TypeDecorator):
    """SQLAlchemy TypeDecorator for automatically encrypting/decrypting JSON columns."""
    impl = JSON
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        serialized = json.dumps(value)
        encrypted_str = encryptSensitiveData(serialized)
        return {"encrypted_data": encrypted_str}
        
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, dict) and "encrypted_data" in value:
            decrypted_str = decryptSensitiveData(value["encrypted_data"])
            try:
                return json.loads(decrypted_str)
            except Exception:
                return value
        return value
