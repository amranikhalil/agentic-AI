"""Retrieval over the index built by ingest.py, plus TODO(you) — concept C: top-k search.

Usage:  python rag/retriever.py                       self-check top_k on toy data
        python rag/retriever.py "who is Johan's sister?"   query the real index
"""
import json
import sys

import numpy as np

from common import EMBED_MODEL, INDEX_DIR


def top_k(query_vec: np.ndarray, matrix: np.ndarray, k: int) -> list[tuple[int, float]]:
    """Return the k rows of `matrix` most similar to `query_vec`, best first, as
    [(row index, score), ...].

    `matrix` has shape (n_chunks, 384) and `query_vec` shape (384,), all normalized,
    so the cosine similarity of every chunk with the query is ONE matrix-vector product.

    Rules:
      - scores are plain Python floats, sorted from highest to lowest
      - if k > number of rows, return all rows

    Hints:
      - matrix @ query_vec  -> one score per chunk, shape (n_chunks,)
      - np.argsort sorts ascending; reverse with [::-1]
      - bonus: np.argpartition finds the top k without sorting all n scores
        (O(n) instead of O(n log n)). Irrelevant for 2k chunks, matters at 10M.
    """
    # TODO(you)
    raise NotImplementedError("top_k: your turn! See the docstring.")


class Retriever:
    """Loads the index once; search() embeds a question and returns the best chunks."""

    def __init__(self) -> None:
        meta = json.loads((INDEX_DIR / "meta.json").read_text(encoding="utf-8"))
        # Vectors from two different models live in different spaces: comparing them gives
        # garbage scores without any error. Fail loudly instead.
        if meta["model"] != EMBED_MODEL:
            raise RuntimeError(f"Index built with {meta['model']} but EMBED_MODEL is {EMBED_MODEL}: re-run ingest.py")
        self.meta = meta
        self.matrix = np.load(INDEX_DIR / "embeddings.npy")
        with (INDEX_DIR / "chunks.jsonl").open(encoding="utf-8") as f:
            self.chunks = [json.loads(line) for line in f]

    def search(self, query: str, k: int = 4) -> list[dict]:
        from embeddings import embed_query  # imported here so the toy self-check runs without the model

        return [
            {**self.chunks[i], "score": round(score, 4)}
            for i, score in top_k(embed_query(query), self.matrix, k)
        ]


if __name__ == "__main__":
    if len(sys.argv) > 1:
        for hit in Retriever().search(" ".join(sys.argv[1:])):
            print(f"{hit['score']:.3f}  {hit['page']} > {hit['section']}")
        sys.exit()

    # Toy check: 3 "chunks" in 2-D, query pointing mostly along the x axis.
    M = np.array([[0.0, 1.0], [1.0, 0.0], [0.6, 0.8]], dtype=np.float32)
    q = np.array([0.8, 0.6], dtype=np.float32)
    result = top_k(q, M, 2)
    assert [i for i, _ in result] == [2, 1], f"expected rows [2, 1], got {result}"
    assert all(isinstance(s, float) for _, s in result), "scores must be Python floats (JSON-serializable)"
    assert abs(result[0][1] - 0.96) < 1e-6, f"row 2 should score 0.6*0.8 + 0.8*0.6 = 0.96, got {result[0][1]}"
    assert len(top_k(q, M, 10)) == 3, "k larger than the number of rows -> return all rows"
    print("top_k: all checks passed")
