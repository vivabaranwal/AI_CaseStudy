# config.py — Central configuration. Change values here only.
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
GEMINI_MODEL = "gemini-2.5-flash-lite"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

# ChromaDB
CHROMA_PATH = "../data/embeddings/"
CHROMA_COLLECTION = "case_studies"
EMBED_MODEL = "all-MiniLM-L6-v2"

# Generation
MAX_URL_CHARS = 3000
DEFAULT_CITATION = "apa7"
DEFAULT_LENGTH = "standard"
DEFAULT_TONE = "academic"
DEFAULT_HOOK = "cinematic"
DEFAULT_CASE_FORMAT = "ifqm"

# Output
OUTPUTS_DIR = "../outputs/"
