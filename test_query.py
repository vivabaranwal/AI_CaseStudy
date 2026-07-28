import os
import chromadb
from sentence_transformers import SentenceTransformer

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, "data", "embeddings")

    # 1. Connect to your local ChromaDB
    client = chromadb.PersistentClient(path=db_path)
    collection = client.get_collection("case_studies")

    # 2. Define your search phrase
    query_text = "corporate burnout, stress, and work-life balance at infosys"
    print(f"Searching database for: '{query_text}'...\n")

    # 3. Initialize the same model you used to build the index
    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_embedding = model.encode(query_text).tolist()

    # 4. Query the database for the top 2 matches
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=2
    )

   # 5. Print out what the database found
    for i in range(len(results['ids'][0])):
        print(f"Match #{i+1}:")
        print(f"  - ID: {results['ids'][0][i]}")
        print(f"  - Company/Title: {results['metadatas'][0][i]}")
        print(f"  - Extracted Text Snippet: {results['documents'][0][i][:150]}...")
        print("-" * 50)

if __name__ == "__main__":
    main()