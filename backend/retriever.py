# retriever.py — Single responsibility: ChromaDB semantic search

import chromadb
from sentence_transformers import SentenceTransformer
from .config import CHROMA_PATH, CHROMA_COLLECTION, EMBED_MODEL

client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(CHROMA_COLLECTION)
embed_model = SentenceTransformer(EMBED_MODEL)

def retrieve(query_text: str, n_results: int = 3) -> str:
    """
    Query ChromaDB with semantic search.
    Returns top-N matching case study chunks as a single string.
    Uses all-MiniLM-L6-v2 to match build_index.py embedding model.
    """
    if not query_text or not query_text.strip():
        return ""

    embedding = embed_model.encode(query_text).tolist()
    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(n_results, collection.count())
    )

    if not results or not results['documents'] or not results['documents'][0]:
        return ""

    return " ".join(results['documents'][0])
