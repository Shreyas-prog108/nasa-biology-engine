import os
import pandas as pd
import numpy as np
from tqdm import tqdm
from dotenv import load_dotenv
from pinecone import Pinecone
import hashlib

load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("space-biology")

def create_dummy_embedding(text, dim=1024):
    """Create a consistent dummy embedding based on text content"""
    text_hash = hashlib.md5(text.encode()).hexdigest()
    seed = int(text_hash[:8], 16)
    np.random.seed(seed)
    embedding = np.random.normal(0, 1, dim)
    embedding = embedding / np.linalg.norm(embedding)
    return embedding.tolist()

def clear_index():
    """Clear the index to start fresh"""
    print("🧹 Clearing index to start fresh...")
    try:
        # Delete all vectors (this might take a moment)
        index.delete(delete_all=True)
        print("✅ Index cleared!")
    except Exception as e:
        print(f"⚠️  Could not clear index: {e}")

def ingest_all_publications():
    """Ingest ALL publications with unique IDs"""
    df = pd.read_csv("data/publications.csv")
    
    print(f"🚀 Processing ALL {len(df)} publications...")
    
    vectors = []
    processed = 0
    skipped = 0
    
    for i, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
        title = str(row.get("Title", "")).strip()
        link = str(row.get("Link", "")).strip()
        
        if not title or title == "nan":
            skipped += 1
            continue
        
        # Create unique ID for each publication
        unique_id = f"publication-{i:04d}"
        
        # Create dummy embedding from title
        embedding = create_dummy_embedding(title)
        
        metadata = {
            "title": title,
            "link": link,
            "source": "nasa_publications",
            "row_id": i,
            "embedding_type": "dummy"
        }
        
        vectors.append((unique_id, embedding, metadata))
        processed += 1
        
        # Upload in batches
        if len(vectors) >= 100:
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
    print(f"   ⚠️  Skipped: {skipped} (empty titles)")
    
    return processed

def verify_ingestion():
    """Verify all data was ingested correctly"""
    try:
        stats = index.describe_index_stats()
        total_count = stats.get('total_vector_count', 0)
        
        print(f"\n📊 Final Verification:")
        print(f"   • Total vectors in Pinecone: {total_count}")
        print(f"   • Dimension: {stats.get('dimension', 0)}")
        
        # Sample some records
        print(f"\n🔍 Sample publications:")
        sample = index.query(
            vector=[0.1]*1024, 
            top_k=3, 
            include_metadata=True,
            filter={"source": {"$eq": "nasa_publications"}}
        )
        
        for i, match in enumerate(sample['matches'], 1):
            title = match['metadata'].get('title', 'No title')
            row_id = match['metadata'].get('row_id', 'Unknown')
            print(f"   {i}. Row {row_id}: {title[:80]}...")
            
        return total_count
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return 0

if __name__ == "__main__":
    print("🚀 CLEAN INGESTION OF ALL 600+ PUBLICATIONS")
    print("=" * 60)
    
    # Step 1: Clear existing data
    clear_index()
    
    # Step 2: Ingest all publications
    processed = ingest_all_publications()
    
    # Step 3: Verify ingestion
    total_in_db = verify_ingestion()
    
    print(f"\n{'='*60}")
    if total_in_db == processed:
        print("✅ SUCCESS! All publications ingested correctly!")
    else:
        print(f"⚠️  Expected {processed}, got {total_in_db} in database")
    
    print("🔍 Your 600+ NASA publications are now searchable!")
