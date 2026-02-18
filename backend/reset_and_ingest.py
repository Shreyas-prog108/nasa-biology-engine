"""
Cleanup and Re-ingest Script for Pinecone Embeddings

This script:
1. Clears all existing entries from the Pinecone index
2. Re-processes all publications from the CSV
3. Generates fresh Gemini embeddings
4. Pushes all embeddings to Pinecone
"""
import os
import sys
import pandas as pd
from tqdm import tqdm
from dotenv import load_dotenv
from pinecone import Pinecone
import time

# Load environment variables
load_dotenv()

# Check environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not PINECONE_API_KEY:
    print("❌ Error: PINECONE_API_KEY not found in environment variables")
    sys.exit(1)

if not GEMINI_API_KEY:
    print("❌ Error: GEMINI_API_KEY not found in environment variables")
    sys.exit(1)

# Initialize Pinecone
print("🔌 Connecting to Pinecone...")
pc = Pinecone(api_key=PINECONE_API_KEY)
INDEX_NAME = "space-biology"

try:
    index = pc.Index(INDEX_NAME)
    print(f"✅ Connected to Pinecone index: {INDEX_NAME}")
except Exception as e:
    print(f"❌ Error connecting to Pinecone index: {e}")
    sys.exit(1)

# Import embedding function
from logic.utils import embed_texts


def get_index_stats():
    """Get current index statistics"""
    try:
        stats = index.describe_index_stats()
        return stats
    except Exception as e:
        print(f"⚠️  Could not get index stats: {e}")
        return None


def clear_all_entries():
    """Clear all entries from the Pinecone index"""
    print("\n" + "="*60)
    print("🧹 STEP 1: CLEARING ALL ENTRIES FROM PINECONE")
    print("="*60)
    
    stats = get_index_stats()
    if stats:
        count = stats.get('total_vector_count', 0)
        print(f"📊 Current vector count: {count}")
    
    try:
        # Delete all vectors
        index.delete(delete_all=True)
        print("✅ All entries deleted successfully!")
        
        # Verify deletion
        time.sleep(2)  # Give it a moment to propagate
        stats = get_index_stats()
        if stats:
            new_count = stats.get('total_vector_count', 0)
            print(f"📊 Vector count after cleanup: {new_count}")
            if new_count == 0:
                print("✅ Index is now empty!")
            else:
                print(f"⚠️  Warning: Index still has {new_count} vectors")
        
        return True
    except Exception as e:
        print(f"❌ Error clearing index: {e}")
        return False


def embed_with_retry(text, max_retries=5):
    """Embed text with rate limit handling and retry logic"""
    for attempt in range(max_retries):
        try:
            return embed_texts([text])[0]
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                # Rate limited - wait and retry with exponential backoff
                wait_time = min(60 * (2 ** attempt), 300)  # Max 5 minutes
                print(f"\n   ⏳ Rate limited. Waiting {wait_time}s before retry {attempt+1}/{max_retries}...")
                time.sleep(wait_time)
            else:
                print(f"\n   ❌ Embedding error: {e}")
                return None
    return None


def ingest_all_publications(batch_size=100):
    """Ingest all publications with fresh Gemini embeddings"""
    print("\n" + "="*60)
    print("🚀 STEP 2: INGESTING ALL PUBLICATIONS")
    print("="*60)
    
    # Load publications
    try:
        df = pd.read_csv("data/publications.csv")
        print(f"📚 Loaded {len(df)} publications from CSV")
    except Exception as e:
        print(f"❌ Error loading publications.csv: {e}")
        return 0
    
    print("⚠️  This will generate REAL Gemini embeddings for all publications")
    print("   Estimated time: ~8-12 minutes (rate limited to ~100 req/min)")
    print("-"*60)
    
    vectors = []
    processed = 0
    skipped = 0
    errors = 0
    last_request_time = 0
    
    # Progress bar
    pbar = tqdm(df.iterrows(), total=len(df), desc="Processing", unit="pub")
    
    for i, row in pbar:
        title = str(row.get("Title", "")).strip()
        link = str(row.get("Link", "")).strip()
        
        # Skip empty titles
        if not title or title == "nan":
            skipped += 1
            continue
        
        # Rate limiting - ensure we don't exceed quota
        current_time = time.time()
        time_since_last = current_time - last_request_time
        if time_since_last < 0.65:  # ~92 requests per minute
            time.sleep(0.65 - time_since_last)
        
        # Create unique ID
        unique_id = f"publication-{i:04d}"
        
        # Generate embedding
        embedding = embed_with_retry(title)
        last_request_time = time.time()
        
        if embedding is None:
            errors += 1
            skipped += 1
            continue
        
        # Prepare metadata
        metadata = {
            "title": title,
            "link": link,
            "source": "nasa_publications",
            "row_id": i,
            "embedding_type": "gemini",
            "embedding_model": "gemini-embedding-001"
        }
        
        vectors.append((unique_id, embedding, metadata))
        processed += 1
        
        # Update progress bar description
        pbar.set_postfix({"Processed": processed, "Skipped": skipped})
        
        # Upload in batches
        if len(vectors) >= batch_size:
            try:
                index.upsert(vectors=vectors)
                vectors = []
            except Exception as e:
                print(f"\n❌ Batch upload error: {e}")
    
    pbar.close()
    
    # Final upload for remaining vectors
    if vectors:
        try:
            index.upsert(vectors=vectors)
        except Exception as e:
            print(f"\n❌ Final upload error: {e}")
    
    print(f"\n🎉 Ingestion Complete!")
    print(f"   ✅ Successfully processed: {processed}")
    print(f"   ⚠️  Skipped/Errors: {skipped}")
    
    return processed


def verify_ingestion():
    """Verify that all data was ingested correctly"""
    print("\n" + "="*60)
    print("🔍 STEP 3: VERIFICATION")
    print("="*60)
    
    try:
        stats = index.describe_index_stats()
        total_count = stats.get('total_vector_count', 0)
        dimension = stats.get('dimension', 0)
        
        print(f"📊 Index Statistics:")
        print(f"   • Total vectors in Pinecone: {total_count}")
        print(f"   • Dimension: {dimension}")
        
        # Test semantic search
        print(f"\n🔍 Testing semantic search:")
        test_query = "microgravity effects on bone"
        test_embedding = embed_texts([test_query])[0]
        
        results = index.query(
            vector=test_embedding,
            top_k=3,
            include_metadata=True,
            filter={"source": {"$eq": "nasa_publications"}}
        )
        
        print(f"   Test Query: '{test_query}'")
        print(f"   Results:")
        for i, match in enumerate(results['matches'], 1):
            title = match['metadata'].get('title', 'No title')
            score = match['score']
            print(f"   {i}. [{score:.3f}] {title[:65]}...")
        
        return total_count
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return 0


def main():
    """Main execution function"""
    print("="*60)
    print("🚀 PINECONE CLEANUP & RE-INGESTION")
    print("="*60)
    print("This script will:")
    print("  1. Delete ALL existing vectors from Pinecone")
    print("  2. Generate fresh Gemini embeddings for all publications")
    print("  3. Upload all embeddings to Pinecone")
    print("="*60)
    
    # Confirmation (auto-confirm for this run)
    print("\n⚠️  Auto-confirming for cleanup and re-ingestion...")
    # confirm = input("\n⚠️  Are you sure you want to proceed? (yes/no): ")
    # if confirm.lower() != "yes":
    #     print("❌ Aborted by user.")
    #     sys.exit(0)
    
    # Step 1: Clear existing data
    if not clear_all_entries():
        print("❌ Failed to clear index. Aborting.")
        sys.exit(1)
    
    # Step 2: Ingest all publications
    processed = ingest_all_publications()
    
    if processed == 0:
        print("❌ No publications were processed. Something went wrong.")
        sys.exit(1)
    
    # Step 3: Verify ingestion
    total_in_db = verify_ingestion()
    
    # Final summary
    print("\n" + "="*60)
    print("📋 FINAL SUMMARY")
    print("="*60)
    print(f"   • Publications processed: {processed}")
    print(f"   • Total vectors in Pinecone: {total_in_db}")
    
    if total_in_db == processed:
        print("\n✅ SUCCESS! All publications re-indexed with fresh embeddings!")
        print("   Your semantic search is now fully functional!")
    else:
        print(f"\n⚠️  Mismatch detected!")
        print(f"   Expected: {processed}")
        print(f"   Got: {total_in_db}")
    
    print("="*60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user. Cleaning up...")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
