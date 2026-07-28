import os
import chromadb
from sentence_transformers import SentenceTransformer

script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "..", "data", "embeddings")

client = chromadb.PersistentClient(path=db_path)
collection = client.get_collection("case_studies")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

def retrieve(query_text: str, n_results: int = 3) -> str:
    """Query ChromaDB and return top-N context chunks as a single string."""
    embedding = embed_model.encode(query_text).tolist()
    results = collection.query(query_embeddings=[embedding], n_results=n_results)
    return " ".join(results['documents'][0])
