"""Resume ingestion from where it left off."""
import os
import pandas as pd
from tqdm import tqdm
from dotenv import load_dotenv
from pinecone import Pinecone
import time

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("space-biology")

from logic.utils import embed_texts


def get_existing_ids():
    """Get list of already indexed publication IDs"""
    try:
        # Query with a dummy vector to get IDs
        stats = index.describe_index_stats()
        if stats.total_vector_count == 0:
            return set()
        
        # Fetch all IDs using query
        existing_ids = set()
        # We'll track by row_id in metadata instead
        return existing_ids
    except:
        return set()


def get_indexed_row_ids():
    """Get row_ids of already indexed publications"""
    try:
        # Query a sample to check metadata
        sample = index.query(
            vector=[0.1] * 1024,
            top_k=100,
            include_metadata=True
        )
        indexed_rows = set()
        for match in sample['matches']:
            if 'row_id' in match['metadata']:
                indexed_rows.add(match['metadata']['row_id'])
        return indexed_rows
    except:
        return set()


def ingest_remaining(start_from=400):
    """Ingest publications starting from a specific row"""
    df = pd.read_csv("data/publications.csv")
    
    total = len(df)
    remaining = total - start_from
    
    print(f"🚀 Resuming ingestion from row {start_from}")
    print(f"   Total: {total}, Remaining: {remaining}")
    
    vectors = []
    processed = 0
    skipped = 0
    
    for i in tqdm(range(start_from, total), desc="Processing"):
        row = df.iloc[i]
        title = str(row.get("Title", "")).strip()
        link = str(row.get("Link", "")).strip()
        
        if not title or title == "nan":
            skipped += 1
            continue
        
        # Rate limiting
        time.sleep(0.65)
        
        unique_id = f"publication-{i:04d}"
        
        try:
            embedding = embed_texts([title])[0]
        except Exception as e:
            if "429" in str(e):
                print(f"\n⏳ Rate limited at row {i}. Stopping here.")
                print(f"   Run again later to resume from row {i}")
                break
            print(f"\n   ❌ Error at row {i}: {e}")
            skipped += 1
            continue
        
        metadata = {
            "title": title,
            "link": link,
            "source": "nasa_publications",
            "row_id": i,
            "embedding_type": "gemini"
        }
        
        vectors.append((unique_id, embedding, metadata))
        processed += 1
        
        # Upload in batches
        if len(vectors) >= 50:
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
    
    print(f"\n🎉 Progress: {processed} more publications indexed")
    print(f"   Skipped: {skipped}")
    
    return processed


def verify():
    """Check final count"""
    stats = index.describe_index_stats()
    print(f"\n📊 Total indexed: {stats.total_vector_count} / 607")
    return stats.total_vector_count


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 RESUME INGESTION (starting from row 400)")
    print("=" * 60)
    
    current = verify()
    
    if current >= 607:
        print("✅ All publications already indexed!")
        exit()
    
    confirm = input(f"\nContinue from row {current}? (yes/no): ")
    if confirm.lower() != "yes":
        print("Aborted.")
        exit()
    
    ingest_remaining(start_from=current)
    final = verify()
    
    print(f"\n{'='*60}")
    if final >= 607:
        print("✅ COMPLETE! All 607 publications indexed!")
    else:
        print(f"⏳ Partial: {final}/607 (hit rate limit, retry later)")
