"""TODO(you) — concept B: turning text into vectors with a Hugging Face model.

An embedding model maps a text to a point in a 384-dimensional space, placed so that
texts with similar *meaning* land close together ("Johan's twin" ≈ "Nina Fortner's brother"
even with no shared words — that's what keyword search can't do).

Two details matter for retrieval quality:
  1. Query prefix: BAAI/bge-small-en-v1.5 was trained with the instruction in QUERY_PREFIX
     put in front of *queries* (short questions) but NOT of passages (long answers). The
     asymmetry helps it match a question to the passage that answers it.
     Model card: https://huggingface.co/BAAI/bge-small-en-v1.5
  2. Normalization: scale every vector to length 1. Then cosine similarity (the angle
     between two vectors) is just a dot product, which is what retriever.top_k() computes.

Self-check:  python rag/embeddings.py   (first run downloads the model, ~130 MB)
"""
import numpy as np
from sentence_transformers import SentenceTransformer

from common import EMBED_MODEL, QUERY_PREFIX

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Load the model once and reuse it: loading takes seconds, encoding takes milliseconds."""
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def embed_passages(texts: list[str]) -> np.ndarray:
    """Embed wiki chunks. Returns a float32 array of shape (len(texts), 384), every row of length 1.

    Hints:
      - get_model().encode(...) takes a list of strings and returns a numpy array
      - look at its arguments: normalize_embeddings, batch_size (32 is fine),
        show_progress_bar (nice for ~1-2k chunks)
      - passages get NO prefix
      - .astype(np.float32) halves the file size vs float64, with no loss that matters
    """
    # TODO(you)
    model= get_model()
    return model.encode(texts, normalize_embeddings=True, batch_size=32).astype(np.float32) 
    raise NotImplementedError("embed_passages: your turn! See the docstring.")


def embed_query(query: str) -> np.ndarray:
    """Embed one user question. Returns a float32 vector of shape (384,), of length 1.

    Hints:
      - same encode() call, but the query needs QUERY_PREFIX in front of it
      - encode() on a single string returns a 1-D array directly
      - must be normalized exactly like the passages, or the scores aren't comparable
    """
    model= get_model()
    text= QUERY_PREFIX + query
    return model.encode(text, normalize_embeddings=True, batch_size=32).astype(np.float32)
    
    # TODO(you)
    raise NotImplementedError("embed_query: your turn! See the docstring.")


if __name__ == "__main__":
    passages = [
        "Nina Fortner is the twin sister of Johan Liebert.",
        "Kenzo Tenma is a Japanese neurosurgeon working in Düsseldorf.",
        "Inspector Lunge memorizes everything by typing with his fingers.",
    ]
    P = embed_passages(passages)
    assert P.shape == (3, 384), f"expected shape (3, 384), got {P.shape}"
    assert P.dtype == np.float32, f"expected float32, got {P.dtype}"
    assert np.allclose(np.linalg.norm(P, axis=1), 1, atol=1e-3), "passage vectors must have length 1"

    q = embed_query("Who is Johan's sister?")
    assert q.shape == (384,), f"expected shape (384,), got {q.shape}"
    assert abs(np.linalg.norm(q) - 1) < 1e-3, "query vector must have length 1"

    scores = P @ q
    for s, p in sorted(zip(scores, passages), reverse=True):
        print(f"{s:.3f}  {p}")
    assert scores.argmax() == 0, "the Nina passage should score highest"
    print("embeddings: all checks passed")
