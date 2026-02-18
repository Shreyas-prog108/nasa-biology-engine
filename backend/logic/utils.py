"""Embedding utilities using Gemini API."""
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Initialize Gemini client
try:
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    print("✅ Gemini client initialized successfully")
except Exception as e:
    gemini_client = None
    print(f"⚠️  Warning: Gemini client initialization failed: {e}")


def embed_texts(texts, target_dim=1024):
    """
    Generate embeddings using Gemini API and truncate to target dimension.
    
    Args:
        texts: List of strings to embed
        target_dim: Target dimension (default 1024 to match Pinecone index)
        
    Returns:
        List of embedding vectors (truncated to target_dim)
    """
    if gemini_client is None:
        raise RuntimeError("Gemini client not initialized. Check GEMINI_API_KEY.")
    
    embeddings = []
    for text in texts:
        # Truncate text if too long (Gemini has token limits)
        truncated_text = text[:8000] if len(text) > 8000 else text
        
        result = gemini_client.models.embed_content(
            model="models/gemini-embedding-001",
            contents=truncated_text
        )
        
        # Extract embedding values and truncate to target dimension
        embedding = result.embeddings[0].values[:target_dim]
        embeddings.append(embedding)
    
    return embeddings
