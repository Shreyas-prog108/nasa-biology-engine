import os
import base64
import hashlib
from dotenv import load_dotenv

load_dotenv()

try:
    from neo4j import GraphDatabase
    NEO4J_URI=os.getenv("NEO4J_URI","bolt://localhost:7687")
    NEO4J_USER=os.getenv("NEO4J_USER","neo4j")
    NEO4J_PASSWORD=os.getenv("NEO4J_PASSWORD","password")
    
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    NEO4J_AVAILABLE = True
except ImportError:
    print("Neo4j package not installed. Run: pip install neo4j")
    NEO4J_AVAILABLE = False
    driver = None
except Exception as e:
    print(f"Neo4j connection failed: {e}")
    NEO4J_AVAILABLE = False
    driver = None

def encode_image_to_base64(image_path):
    """Convert image file to base64 string for storage"""
    try:
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded_string
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

def create_image_hash(image_data):
    """Create unique hash for image deduplication"""
    return hashlib.md5(image_data.encode()).hexdigest()

def add_publication_with_images(tx, pub_id, title, abstract, images=None):
    """Add publication node with associated images"""
    # Create publication node
    tx.run("""
        MERGE (p:Publication {id: $pub_id})
        SET p.title = $title, p.abstract = $abstract, p.created_at = datetime()
        """, pub_id=pub_id, title=title, abstract=abstract)
    
    # Add images if provided
    if images:
        for img in images:
            img_hash = create_image_hash(img['data'])
            tx.run("""
                MERGE (i:Image {hash: $hash})
                SET i.filename = $filename, 
                    i.data = $data, 
                    i.type = $img_type,
                    i.created_at = datetime()
                """, hash=img_hash, filename=img['filename'], 
                     data=img['data'], img_type=img.get('type', 'unknown'))
            
            # Link publication to image
            tx.run("""
                MATCH (p:Publication {id: $pub_id})
                MATCH (i:Image {hash: $hash})
                MERGE (p)-[:HAS_IMAGE]->(i)
                """, pub_id=pub_id, hash=img_hash)

def add_entity_with_image(tx, entity_name, entity_type, image_data=None):
    """Add entity (like protein, cell, organism) with associated image"""
    # Create entity node
    tx.run("""
        MERGE (e:Entity {name: $name})
        SET e.type = $type, e.created_at = datetime()
        """, name=entity_name, type=entity_type)
    
    if image_data:
        img_hash = create_image_hash(image_data['data'])
        tx.run("""
            MERGE (i:Image {hash: $hash})
            SET i.filename = $filename, 
                i.data = $data, 
                i.type = $img_type,
                i.created_at = datetime()
            """, hash=img_hash, filename=image_data['filename'], 
                 data=image_data['data'], img_type=image_data.get('type', 'entity'))
        
        # Link entity to image
        tx.run("""
            MATCH (e:Entity {name: $name})
            MATCH (i:Image {hash: $hash})
            MERGE (e)-[:REPRESENTED_BY]->(i)
            """, name=entity_name, hash=img_hash)

def add_research_finding(tx, finding_text, publication_id, confidence=0.5):
    """Add research finding extracted from text"""
    finding_hash = hashlib.md5(finding_text.encode()).hexdigest()
    tx.run("""
        MERGE (f:Finding {hash: $hash})
        SET f.text = $text, f.confidence = $confidence, f.created_at = datetime()
        """, hash=finding_hash, text=finding_text, confidence=confidence)
    
    # Link to publication
    tx.run("""
        MATCH (p:Publication {id: $pub_id})
        MATCH (f:Finding {hash: $hash})
        MERGE (p)-[:CONTAINS_FINDING]->(f)
        """, pub_id=publication_id, hash=finding_hash)

def link_entities_to_findings(tx, entity_name, finding_hash, relationship="MENTIONED_IN"):
    """Link entities to research findings"""
    tx.run("""
        MATCH (e:Entity {name: $entity_name})
        MATCH (f:Finding {hash: $finding_hash})
        MERGE (e)-[r:RELATION {type: $rel_type}]->(f)
        """, entity_name=entity_name, finding_hash=finding_hash, rel_type=relationship)

def get_images_for_publication(tx, pub_id):
    """Retrieve all images for a publication"""
    result = tx.run("""
        MATCH (p:Publication {id: $pub_id})-[:HAS_IMAGE]->(i:Image)
        RETURN i.filename as filename, i.data as data, i.type as type, i.hash as hash
        """, pub_id=pub_id)
    return [record.data() for record in result]

def get_entity_with_images(tx, entity_name):
    """Get entity and its associated images"""
    result = tx.run("""
        MATCH (e:Entity {name: $name})
        OPTIONAL MATCH (e)-[:REPRESENTED_BY]->(i:Image)
        RETURN e.name as entity_name, e.type as entity_type,
               collect({filename: i.filename, data: i.data, type: i.type}) as images
        """, name=entity_name)
    return result.single()

def search_publications_with_images(tx, search_term, limit=10):
    """Search publications and return those with images"""
    result = tx.run("""
        MATCH (p:Publication)
        WHERE p.title CONTAINS $search_term OR p.abstract CONTAINS $search_term
        OPTIONAL MATCH (p)-[:HAS_IMAGE]->(i:Image)
        RETURN p.id as pub_id, p.title as title, 
               collect({filename: i.filename, hash: i.hash, type: i.type}) as images
        LIMIT $limit
        """, search_term=search_term, limit=limit)
    return [record.data() for record in result]

def get_knowledge_graph_stats(tx):
    """Get statistics about the knowledge graph"""
    result = tx.run("""
        MATCH (p:Publication) WITH count(p) as pub_count
        MATCH (e:Entity) WITH pub_count, count(e) as entity_count
        MATCH (i:Image) WITH pub_count, entity_count, count(i) as image_count
        MATCH (f:Finding) WITH pub_count, entity_count, image_count, count(f) as finding_count
        RETURN pub_count, entity_count, image_count, finding_count
        """)
    return result.single().data()

# Utility functions for the API
def save_publication_with_images(pub_id, title, abstract, image_files=None):
    """High-level function to save publication with images"""
    if not NEO4J_AVAILABLE:
        return {"error": "Neo4j not available"}
    
    try:
        images = []
        if image_files:
            for img_file in image_files:
                img_data = encode_image_to_base64(img_file['path'])
                if img_data:
                    images.append({
                        'filename': img_file['filename'],
                        'data': img_data,
                        'type': img_file.get('type', 'publication_image')
                    })
        
        with driver.session() as session:
            session.write_transaction(
                add_publication_with_images, 
                pub_id, title, abstract, images
            )
        
        return {"success": True, "images_saved": len(images)}
    except Exception as e:
        return {"error": str(e)}

def create_knowledge_graph_from_publications(publications_data):
    """Process publications and create knowledge graph with images"""
    if not NEO4J_AVAILABLE:
        return {"error": "Neo4j not available"}
    
    processed = 0
    errors = []
    
    try:
        with driver.session() as session:
            for pub in publications_data:
                try:
                    # Extract entities from title/abstract (basic approach)
                    entities = extract_entities_from_text(pub.get('title', '') + ' ' + pub.get('abstract', ''))
                    
                    # Save publication
                    session.write_transaction(
                        add_publication_with_images,
                        pub['id'], pub['title'], pub.get('abstract', ''),
                        pub.get('images', [])
                    )
                    
                    # Save entities
                    for entity in entities:
                        session.write_transaction(
                            add_entity_with_image,
                            entity, "biological_entity"
                        )
                    
                    processed += 1
                except Exception as e:
                    errors.append(f"Error processing {pub.get('id', 'unknown')}: {str(e)}")
        
        return {
            "processed": processed,
            "errors": errors,
            "success": len(errors) == 0
        }
    except Exception as e:
        return {"error": str(e)}

def extract_entities_from_text(text):
    """Basic entity extraction (capitalized words > 3 chars)"""
    words = text.split()
    entities = []
    for word in words:
        clean_word = word.strip('.,()[]').strip()
        if (len(clean_word) > 3 and 
            clean_word[0].isupper() and 
            clean_word.lower() not in ['and', 'the', 'for', 'with', 'from', 'effects', 'study', 'analysis']):
            entities.append(clean_word)
    return list(set(entities))

# Test function
def test_neo4j_connection():
    """Test if Neo4j is working"""
    if not NEO4J_AVAILABLE:
        return False
    
    try:
        with driver.session() as session:
            result = session.run("RETURN 'Hello Neo4j' as message")
            return result.single()["message"] == "Hello Neo4j"
    except Exception as e:
        print(f"Neo4j test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Neo4j connection...")
    if test_neo4j_connection():
        print("✅ Neo4j connection successful!")
    else:
        print("❌ Neo4j connection failed. Make sure Neo4j is running and credentials are correct.")
