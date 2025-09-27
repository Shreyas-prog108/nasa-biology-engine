import os
import numpy as np
import hashlib
from dotenv import load_dotenv

load_dotenv()

def create_dummy_embedding(text, dim=1024):
    """Create consistent dummy embedding - same as in instant_ingest.py"""
    # Use hash of text to create reproducible "embedding"
    text_hash = hashlib.md5(text.encode()).hexdigest()
    
    # Convert hash to numbers
    seed = int(text_hash[:8], 16)
    np.random.seed(seed)
    
    # Generate normalized random vector
    embedding = np.random.normal(0, 1, dim)
    embedding = embedding / np.linalg.norm(embedding)  # Normalize
    
    return embedding.tolist()

def embed_texts(texts, dim=1024):
    """Use dummy embeddings for instant testing"""
    return [create_dummy_embedding(text, dim) for text in texts]

# Keep original Gemini client for when you get quota back
try:
    from google import genai
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
except:
    gemini_client = None
