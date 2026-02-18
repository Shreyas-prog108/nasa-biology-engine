import os
import pandas as pd
import numpy as np
from tqdm import tqdm
from dotenv import load_dotenv
from pinecone import Pinecone
import time

load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("space-biology")

# Import embedding function from utils
from logic.utils import embed_texts

def clear_index():
    """Clear the index to start fresh"""
    print("🧹 Clearing index to start fresh...")
    try:
        index.delete(delete_all=True)
        print("✅ Index cleared!")
    except Exception as e:
        print(f"⚠️  Could not clear index: {e}")

def embed_with_retry(text, max_retries=5):
    """Embed text with rate limit handling"""
    for attempt in range(max_retries):
        try:
            return embed_texts([text])[0]
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                # Rate limited - wait and retry
                wait_time = min(60 * (2 ** attempt), 120)  # Exponential backoff, max 2 min
                print(f"\n   ⏳ Rate limited. Waiting {wait_time}s before retry {attempt+1}/{max_retries}...")
                time.sleep(wait_time)
            else:
                print(f"\n   ❌ Embedding error: {e}")
                return None
    return None

def ingest_all_publications(batch_size=100):
    """Ingest ALL publications with REAL Gemini embeddings"""
    df = pd.read_csv("data/publications.csv")
    
    print(f"🚀 Processing ALL {len(df)} publications with Gemini embeddings...")
    print("⚠️  This will take longer than dummy embeddings but provides REAL semantic search!")
    print("   (Rate limited to ~100 requests/minute on free tier)")
    
    vectors = []
    processed = 0
    skipped = 0
    rate_limit_hits = 0
    last_request_time = 0
    
    for i, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
        title = str(row.get("Title", "")).strip()
        link = str(row.get("Link", "")).strip()
        
        if not title or title == "nan":
            skipped += 1
            continue
        
        # Rate limiting - ensure we don't exceed 100 requests per minute
        current_time = time.time()
        time_since_last = current_time - last_request_time
        if time_since_last < 0.65:  # ~92 requests per minute (leaving buffer)
            time.sleep(0.65 - time_since_last)
        
        # Create unique ID for each publication
        unique_id = f"publication-{i:04d}"
        
        # Create REAL embedding from title using Gemini
        embedding = embed_with_retry(title)
        last_request_time = time.time()
        
        if embedding is None:
            skipped += 1
            continue
        
        metadata = {
            "title": title,
            "link": link,
            "source": "nasa_publications",
            "row_id": i,
            "embedding_type": "gemini"  # Mark as real embedding
        }
        
        vectors.append((unique_id, embedding, metadata))
        processed += 1
        
        # Upload in batches
        if len(vectors) >= batch_size:
            try:
                index.upsert(vectors=vectors)
                vectors = []
            except Exception as e:
                print(f"❌ Upload error: {e}")
    
    # Final upload
    if vectors:
        try:
            index.upsert(vectors=vectors)
        except Exception as e:
            print(f"❌ Final upload error: {e}")
    
    print(f"\n🎉 Ingestion Complete!")
    print(f"   ✅ Processed: {processed} publications")
    print(f"   ⚠️  Skipped: {skipped} (empty titles or embedding errors)")
    
    return processed

def verify_ingestion():
    """Verify all data was ingested correctly with a semantic search test"""
    try:
        stats = index.describe_index_stats()
        total_count = stats.get('total_vector_count', 0)
        
        print(f"\n📊 Final Verification:")
        print(f"   • Total vectors in Pinecone: {total_count}")
        print(f"   • Dimension: {stats.get('dimension', 0)}")
        
        # Test semantic search
        print(f"\n🔍 Testing semantic search:")
        from logic.utils import embed_texts
        
        test_query = "microgravity effects on bone"
        test_embedding = embed_texts([test_query])[0]
        
        results = index.query(
            vector=test_embedding,
            top_k=3,
            include_metadata=True,
            filter={"source": {"$eq": "nasa_publications"}}
        )
        
        print(f"   Query: '{test_query}'")
        for i, match in enumerate(results['matches'], 1):
            title = match['metadata'].get('title', 'No title')
            score = match['score']
            print(f"   {i}. [{score:.3f}] {title[:70]}...")
        
        return total_count
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return 0

if __name__ == "__main__":
    print("🚀 CLEAN INGESTION WITH REAL GEMINI EMBEDDINGS")
    print("=" * 60)
    print("⚠️  This will use Gemini API credits!")
    print("   Estimated: ~600 embedding calls (one per publication)")
    print("   Time: ~8-10 minutes due to rate limiting (100 req/min)")
    print("=" * 60)
    
    confirm = input("\nProceed with re-indexing? (yes/no): ")
    if confirm.lower() != "yes":
        print("Aborted.")
        exit()
    
    # Step 1: Clear existing data
    clear_index()
    
    # Step 2: Ingest all publications with real embeddings
    processed = ingest_all_publications()
    
    # Step 3: Verify ingestion
    total_in_db = verify_ingestion()
    
    print(f"\n{'='*60}")
    if total_in_db == processed:
        print("✅ SUCCESS! All publications re-indexed with real embeddings!")
        print("   Semantic search is now working correctly!")
    else:
        print(f"⚠️  Expected {processed}, got {total_in_db} in database")
    
    print("🔍 Your NASA publications now have REAL semantic understanding!")
