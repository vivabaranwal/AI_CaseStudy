# config.py — Central configuration. Change values here only.
import os
from dotenv import load_dotenv

# Anchor every path to this file so the app works from any working directory.
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

# Load environment variables from .env file (absolute path, not CWD-relative)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

# Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

# ChromaDB
CHROMA_PATH = os.path.join(PROJECT_ROOT, "data", "embeddings")
CHROMA_COLLECTION = "case_studies"
EMBED_MODEL = "all-MiniLM-L6-v2"

# Upload limits
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB per file
MAX_PDF_PAGES = 300

# Generation
MAX_URL_CHARS = 3000
# Characters of uploaded-document text passed to the model. Gemini 2.5 Flash has
# a large context window, so this can be generous without risking overflow.
MAX_DOC_CHARS = 20000
DEFAULT_CITATION = "apa7"
DEFAULT_LENGTH = "standard"
DEFAULT_TONE = "academic"
DEFAULT_HOOK = "cinematic"
DEFAULT_CASE_FORMAT = "ifqm"

# Output
OUTPUTS_DIR = os.environ.get("OUTPUTS_DIR", os.path.join(PROJECT_ROOT, "outputs"))
