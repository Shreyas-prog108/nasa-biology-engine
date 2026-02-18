"""Fast ingestion for paid API - no rate limiting."""
import os
import pandas as pd
from tqdm import tqdm
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("space-biology")

from logic.utils import embed_texts


def clear_index():
    """Clear the index to start fresh"""
    print("🧹 Clearing index...")
    try:
        index.delete(delete_all=True)
        print("✅ Index cleared!")
    except Exception as e:
        print(f"⚠️  Could not clear index: {e}")


def ingest_all():
    """Ingest all publications at full speed (paid API)"""
    df = pd.read_csv("data/publications.csv")
    
    print(f"🚀 Processing ALL {len(df)} publications with Gemini embeddings...")
    print("   Paid API - no rate limiting!\n")
    
    vectors = []
    processed = 0
    skipped = 0
    
    for i, row in tqdm(df.iterrows(), total=len(df), desc="Processing"):
        title = str(row.get("Title", "")).strip()
        link = str(row.get("Link", "")).strip()
        
        if not title or title == "nan":
            skipped += 1
            continue
        
        unique_id = f"publication-{i:04d}"
        
        try:
            embedding = embed_texts([title])[0]
        except Exception as e:
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
        
        # Upload in batches of 100
        if len(vectors) >= 100:
            try:
                index.upsert(vectors=vectors)
                vectors = []
            except Exception as e:
                print(f"\n❌ Upload error: {e}")
    
    # Final upload
    if vectors:
        try:
            index.upsert(vectors=vectors)
        except Exception as e:
            print(f"\n❌ Final upload error: {e}")
    
    print(f"\n🎉 Ingestion Complete!")
    print(f"   ✅ Processed: {processed}")
    print(f"   ⚠️  Skipped: {skipped}")
    
    return processed


def verify():
    """Verify and test"""
    stats = index.describe_index_stats()
    print(f"\n📊 Verification:")
    print(f"   • Total vectors: {stats.total_vector_count}")
    print(f"   • Dimension: {stats.dimension}")
    
    if stats.total_vector_count > 0:
        print(f"\n🔍 Testing semantic search...")
        test_emb = embed_texts(["microgravity effects on bone"])[0]
        results = index.query(
            vector=test_emb,
            top_k=3,
            include_metadata=True
        )
        for i, m in enumerate(results['matches'], 1):
            title = m['metadata']['title'][:55]
            print(f"   {i}. [{m['score']:.3f}] {title}...")
    
    return stats.total_vector_count


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 FULL SPEED INGESTION (PAID API)")
    print("=" * 60)
    
    # Clear and re-index everything
    clear_index()
    processed = ingest_all()
    total = verify()
    
    print(f"\n{'='*60}")
    if total == 607:
        print("✅ SUCCESS! All 607 publications indexed!")
    else:
        print(f"⚠️  Expected 607, got {total}")
