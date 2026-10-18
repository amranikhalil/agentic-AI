"""Settings shared by every step of the RAG pipeline: fetch -> clean/chunk -> ingest -> serve."""
from pathlib import Path

RAG_DIR = Path(__file__).resolve().parent
CORPUS_DIR = RAG_DIR / "corpus"   # downloaded + cleaned data (not committed, rebuildable)
RAW_DIR = CORPUS_DIR / "raw"      # one JSON per wiki page, exactly as the API returned it
CHUNKS_FILE = CORPUS_DIR / "chunks.jsonl"
INDEX_DIR = RAG_DIR / "index"     # embeddings + chunk metadata used by the server

# Source: Naoki Urasawa's Monster Wiki on Fandom (content licensed CC BY-SA).
WIKI_API = "https://monstermanga.fandom.com/api.php"
WIKI_PAGE_URL = "https://monstermanga.fandom.com/wiki/"
USER_AGENT = "multi-agent-app-rag/0.1 (personal learning project)"

# Embedding model from the Hugging Face Hub. bge models were trained with an instruction
# prefix on the *query* side only (see the model card), so passages are embedded as-is.
EMBED_MODEL = "BAAI/bge-small-en-v1.5"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "

# Chunking. bge-small reads at most 512 tokens; ~220 English words is ~300 tokens,
# leaving room for the "Page > Section" prefix without the model silently truncating.
CHUNK_WORDS = 220
CHUNK_OVERLAP = 40
MIN_CHUNK_WORDS = 15
