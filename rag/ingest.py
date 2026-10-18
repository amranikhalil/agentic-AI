"""Step 3: embed every chunk and save the index to rag/index/.

Usage:  python rag/ingest.py

Embedding is the slow part (~1-3 min on CPU), so it runs once here, offline, and the
server only loads the result. The index is just numpy + JSON: for a couple thousand
chunks a brute-force dot product takes about a millisecond, so a vector database
(FAISS, Qdrant...) would add a dependency without making anything faster yet.
"""
import json
import shutil
from datetime import datetime, timezone

import numpy as np

from common import CHUNK_OVERLAP, CHUNK_WORDS, CHUNKS_FILE, CORPUS_DIR, EMBED_MODEL, INDEX_DIR
from embeddings import embed_passages


def main() -> None:
    if not CHUNKS_FILE.exists():
        raise SystemExit(f"{CHUNKS_FILE} not found. Run clean_chunk.py first.")
    with CHUNKS_FILE.open(encoding="utf-8") as f:
        chunks = [json.loads(line) for line in f]

    vectors = embed_passages([c["text"] for c in chunks])

    INDEX_DIR.mkdir(exist_ok=True)
    np.save(INDEX_DIR / "embeddings.npy", vectors)
    shutil.copyfile(CHUNKS_FILE, INDEX_DIR / "chunks.jsonl")  # row i of the matrix = line i of this file

    # Everything that influences retrieval results, written next to the index. When we
    # compare two eval runs later (step 2+), this says what changed between them.
    manifest = json.loads((CORPUS_DIR / "manifest.json").read_text(encoding="utf-8"))
    meta = {
        "model": EMBED_MODEL,
        "dim": int(vectors.shape[1]),
        "chunks": len(chunks),
        "chunk_words": CHUNK_WORDS,
        "chunk_overlap": CHUNK_OVERLAP,
        "corpus_fetched_at": manifest["fetched_at"],
        "built_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    (INDEX_DIR / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"Indexed {len(chunks)} chunks -> {INDEX_DIR}")


if __name__ == "__main__":
    main()
