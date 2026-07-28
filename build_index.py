import os
import json
import chromadb
from sentence_transformers import SentenceTransformer

def main():
    # 1. Setup exact paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, "data", "training_data.json")
    db_path = os.path.join(script_dir, "data", "embeddings")

    # 2. Load the augmented data
    print("Loading training data...")
    if not os.path.exists(data_path):
        print(f"[ERROR] Cannot find {data_path}")
        return
        
    with open(data_path, 'r', encoding='utf-8') as f:
        cases = json.load(f)

    # 3. Initialize the embedding model (Downloads a small, fast model)
    print("Initializing Embedding Model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # 4. Setup ChromaDB
    print("Creating ChromaDB database...")
    client = chromadb.PersistentClient(path=db_path)
    
    # Clear the collection if it already exists so we don't duplicate data
    try:
        client.delete_collection("case_studies")
    except:
        pass
        
    collection = client.create_collection("case_studies")

    # 5. Process and store each case
    print(f"Embedding {len(cases)} cases into the database. This takes a minute...\n")
    for i, case in enumerate(cases):
        
        # Safely extract text from the nested JSON structure
        background = case.get("context", {}).get("company_background", "")
        challenge = case.get("narrative_arc", {}).get("core_challenge", "")
        company_name = case.get("protagonist", {}).get("organization", "Unknown")
        
        # Combine the text to create a rich search fingerprint
        text_to_embed = f"{background} {challenge}"
        
        # Create the mathematical embedding
        embedding = model.encode(text_to_embed).tolist()
        
        # Save to database
        collection.add(
            ids=[str(i)],
            embeddings=[embedding],
            metadatas=[{
                "company": company_name,
                "title": case.get("title", "Unknown Case")
            }],
            documents=[text_to_embed]
        )
        
        if (i + 1) % 10 == 0:
            print(f"  -> Processed {i + 1}/{len(cases)} cases...")

    print(f"\nDone! ChromaDB saved successfully to: {db_path}")

if __name__ == "__main__":
    main()
