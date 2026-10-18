"""Step 4: HTTP retrieval service the Node backend calls.

Usage:  python rag/server.py        (http://127.0.0.1:8001, docs at /docs)

Why a separate Python service instead of doing it in Node? The Hugging Face ecosystem
(sentence-transformers, datasets, evaluation libraries) is Python. Keeping retrieval
behind a small API also means the eval harness (step 3) can test retrieval on its own,
and the embedding model can change without touching the TypeScript code.
"""
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel, Field

from embeddings import get_model
from retriever import Retriever

state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load index + model once at startup: per request it would cost seconds.
    state["retriever"] = Retriever()
    get_model()
    print(f"Loaded {len(state['retriever'].chunks)} chunks")
    yield


app = FastAPI(title="Monster wiki retriever", lifespan=lifespan)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    k: int = Field(default=4, ge=1, le=20)


class Hit(BaseModel):
    id: str
    page: str
    section: str
    type: str
    url: str
    text: str
    score: float


class SearchResponse(BaseModel):
    results: list[Hit]


@app.get("/health")
def health() -> dict:
    return {"status": "ok", **state["retriever"].meta}


# A plain `def` (not async): encoding is CPU-bound, so FastAPI runs it in a thread pool
# instead of blocking the event loop.
@app.post("/search")
def search(request: SearchRequest) -> SearchResponse:
    return SearchResponse(results=state["retriever"].search(request.query, request.k))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
