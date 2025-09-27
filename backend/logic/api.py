from fastapi import FastAPI, Query
import os
import numpy as np
import hashlib
from dotenv import load_dotenv
from pinecone import Pinecone
from google import genai
from logic.utils import embed_texts, gemini_client
from collections import Counter


load_dotenv()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
INDEX_NAME = "space-biology"
index = pc.Index(INDEX_NAME)

# Initialize Gemini client
try:
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
except:
    gemini_client = None

def create_dummy_embedding(text, dim=1024):
    """Create consistent dummy embedding for queries"""
    text_hash = hashlib.md5(text.encode()).hexdigest()
    seed = int(text_hash[:8], 16)
    np.random.seed(seed)
    embedding = np.random.normal(0, 1, dim)
    embedding = embedding / np.linalg.norm(embedding)
    return embedding.tolist()

def embed_texts(texts):
    """Use dummy embeddings for queries (matching your ingested data)"""
    return [create_dummy_embedding(text) for text in texts]

app = FastAPI(title="Space Biology Knowledge Engine (Gemini + Pinecone)")

@app.get("/search")
def search(q: str = Query(...), top_k: int = 5, source: str | None = None):
    """Search across 600+ NASA publications"""
    emb = embed_texts([q])[0]
    query = {"vector": emb, "top_k": top_k, "include_metadata": True}
    if source:
        query["filter"] = {"source": {"$eq": source}}
    else:
        query["filter"] = {"source": {"$eq": "nasa_publications"}}
    
    res = index.query(**query)
    return [
        {
            "id": m["id"],
            "title": m["metadata"]["title"],
            "link": m["metadata"].get("link", ""),
            "abstract": m["metadata"].get("abstract", ""),
            "source": m["metadata"]["source"],
            "score": m["score"],
            "row_id": m["metadata"].get("row_id", "")
        }
        for m in res["matches"]
    ]

@app.get("/qa")
def qa(q: str = Query(...), top_k: int = 5, source: str | None = None):
    """Q&A across 600+ NASA publications"""
    emb = embed_texts([q])[0]
    query = {"vector": emb, "top_k": top_k, "include_metadata": True}
    if source:
        query["filter"] = {"source": {"$eq": source}}
    else:
        query["filter"] = {"source": {"$eq": "nasa_publications"}}
    res = index.query(**query)
    context = "\n\n".join([
        f"Title: {m['metadata']['title']}\nLink: {m['metadata'].get('link', 'N/A')}" 
        for m in res["matches"]
    ])
    try:
        if gemini_client:
            prompt = f"Use the following NASA space biology publications to answer:\n\n{context}\n\nQuestion: {q}\nAnswer in 3 sentences and cite specific titles."
            resp = gemini_client.models.generate_content(
                model="gemini-2.0-flash", contents=prompt
            )
            answer = resp.text
        else:
            answer = f"Based on the search results, here are the most relevant publications for '{q}'. Please check the links for detailed information."
    except Exception as e:
        answer = f"Found {len(res['matches'])} relevant publications. Gemini API unavailable: {str(e)}"
    
    return {
        "answer": answer,
        "sources": [m["metadata"]["title"] for m in res["matches"]],
        "links": [m["metadata"].get("link", "") for m in res["matches"]],
        "total_results": len(res["matches"])
    }

# -------------------
# Knowledge Graph APIs with Image Support
# -------------------
try:
    from logic.kg_neo4j_images import (
        save_publication_with_images, 
        get_images_for_publication,
        search_publications_with_images,
        get_knowledge_graph_stats,
        test_neo4j_connection,
        NEO4J_AVAILABLE
    )
except ImportError:
    NEO4J_AVAILABLE = False
    print("Neo4j image module not available")

@app.get("/neo4j/status")
def neo4j_status():
    """Check Neo4j connection status"""
    if not NEO4J_AVAILABLE:
        return {"status": "unavailable", "message": "Neo4j package not installed"}
    
    try:
        connected = test_neo4j_connection()
        return {
            "status": "connected" if connected else "disconnected",
            "available": NEO4J_AVAILABLE,
            "message": "Neo4j ready for image storage" if connected else "Check Neo4j server"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/neo4j/publication")
def store_publication_with_images(
    pub_id: str,
    title: str,
    abstract: str = "",
    image_urls: list = None
):
    """Store publication with images in Neo4j"""
    if not NEO4J_AVAILABLE:
        return {"error": "Neo4j not available"}
    
    # For now, we'll store image URLs. Later you can extend to handle file uploads
    image_data = []
    if image_urls:
        for i, url in enumerate(image_urls):
            image_data.append({
                'filename': f"image_{i}.jpg",
                'url': url,
                'type': 'publication_image'
            })
    
    try:
        result = save_publication_with_images(pub_id, title, abstract, image_data)
        return result
    except Exception as e:
        return {"error": str(e)}

@app.get("/neo4j/publication/{pub_id}/images")
def get_publication_images(pub_id: str):
    """Retrieve images for a specific publication"""
    if not NEO4J_AVAILABLE:
        return {"error": "Neo4j not available"}
    
    try:
        from logic.kg_neo4j_images import driver
        with driver.session() as session:
            images = session.read_transaction(get_images_for_publication, pub_id)
            return {"publication_id": pub_id, "images": images}
    except Exception as e:
        return {"error": str(e)}

@app.get("/neo4j/search")
def search_kg_with_images(query: str, limit: int = 10):
    """Search knowledge graph and return publications with images"""
    if not NEO4J_AVAILABLE:
        return {"error": "Neo4j not available"}
    
    try:
        from logic.kg_neo4j_images import driver
        with driver.session() as session:
            results = session.read_transaction(
                search_publications_with_images, query, limit
            )
            return {"query": query, "results": results}
    except Exception as e:
        return {"error": str(e)}

@app.get("/neo4j/stats")
def get_kg_statistics():
    """Get knowledge graph statistics"""
    if not NEO4J_AVAILABLE:
        return {"error": "Neo4j not available"}
    
    try:
        from logic.kg_neo4j_images import driver
        with driver.session() as session:
            stats = session.read_transaction(get_knowledge_graph_stats)
            return {"knowledge_graph_stats": stats}
    except Exception as e:
        return {"error": str(e)}

# -------------------
# Basic Knowledge Graph APIs (Pinecone-based fallback)
# -------------------
@app.get("/knowledge-graph/entities")
def kg_entities(top_n: int = 20):
    """Extract entities from publication titles (basic NLP)"""
    try:
        sample_results = index.query(
            vector=[0.1] * 1024,
            top_k=min(100, top_n * 5),
            include_metadata=True,
            filter={"source": {"$eq": "nasa_publications"}}
        )
        entities = Counter()
        for match in sample_results['matches']:
            title = match['metadata']['title']
            words = title.split()
            for word in words:
                clean_word = word.strip('.,()[]').strip()
                if (len(clean_word) > 2 and 
                    clean_word[0].isupper() and 
                    clean_word.lower() not in ['and', 'the', 'for', 'with', 'from', 'effects', 'study']):
                    entities[clean_word] += 1
        
        return {
            "entities": [{"name": name, "count": count} for name, count in entities.most_common(top_n)],
            "total_publications_analyzed": len(sample_results['matches']),
            "note": "Basic entity extraction from titles. Install Neo4j for advanced knowledge graph."
        }
    except Exception as e:
        return {"error": f"Entity extraction failed: {str(e)}"}

@app.get("/knowledge-graph/topics")
def kg_topics(top_n: int = 10):
    """Identify common research topics"""
    try:
        sample_results = index.query(
            vector=[0.1] * 1024,
            top_k=min(200, top_n * 10),
            include_metadata=True,
            filter={"source": {"$eq": "nasa_publications"}}
        )
        topics = {
            "microgravity": ["microgravity", "weightlessness", "gravity"],
            "radiation": ["radiation", "cosmic", "particle"],
            "bone": ["bone", "skeletal", "osteo"],
            "muscle": ["muscle", "muscular", "atrophy"],
            "cardiovascular": ["cardiovascular", "heart", "blood"],
            "plant": ["plant", "botany", "growth"],
            "cell": ["cell", "cellular", "molecular"],
            "astronaut": ["astronaut", "crew", "human"],
            "space": ["space", "spaceflight", "orbital"],
            "biology": ["biology", "biological", "biomedical"]
        }
        
        topic_counts = Counter()
        
        for match in sample_results['matches']:
            title = match['metadata']['title'].lower()
            for topic, keywords in topics.items():
                if any(keyword in title for keyword in keywords):
                    topic_counts[topic] += 1
        
        return {
            "topics": dict(topic_counts.most_common(top_n)),
            "total_analyzed": len(sample_results['matches']),
            "note": "Topic analysis based on keyword matching"
        }
    except Exception as e:
        return {"error": f"Topic analysis failed: {str(e)}"}

# -------------------
# Analytics API
# -------------------
@app.get("/trends")
def trends():
    """Get publication trends and statistics from Pinecone database"""
    try:
        stats = index.describe_index_stats()
        total_pubs = stats.get('total_vector_count', 0)
        sample_results = index.query(
            vector=[0.1] * 1024,
            top_k=min(100, total_pubs),
            include_metadata=True,
            filter={"source": {"$eq": "nasa_publications"}}
        )
        all_titles = [match['metadata']['title'] for match in sample_results['matches']]
        common_terms = Counter()
        
        for title in all_titles:
            words = [word.lower().strip('.,()[]') for word in title.split() 
                    if len(word) > 3 and word.lower() not in ['and', 'the', 'for', 'with', 'from']]
            common_terms.update(words)
        
        return {
            "total_publications": total_pubs,
            "sample_size": len(all_titles),
            "common_terms": dict(common_terms.most_common(10)),
            "database_stats": {
                "vector_count": total_pubs,
                "dimension": stats.get('dimension', 0),
                "index_fullness": stats.get('index_fullness', 0)
            }
        }
    except Exception as e:
        return {"error": f"Analytics unavailable: {str(e)}"}