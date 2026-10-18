"""TODO(you) — concept A: splitting text into overlapping chunks.

Why chunk at all? An embedding is ONE vector for a whole text. Embed all of Johan's
44 KB page as one vector and it becomes a blurry average of 20 topics, so a precise
question matches it weakly. Small chunks = sharp vectors = precise retrieval, and the
LLM only receives the few paragraphs that matter.

Why overlap? If a fact straddles a cut ("...Tenma operated on | the boy instead of the
mayor..."), neither chunk contains the whole sentence. Overlapping windows make sure
every short span of text appears whole in at least one chunk.

Self-check:  python rag/chunking.py
"""

from common import CHUNK_OVERLAP, CHUNK_WORDS


def chunk_section(text: str, size: int = CHUNK_WORDS, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split `text` into windows of at most `size` words, each sharing `overlap` words
    with the previous one.
    
    Rules:
      - empty / whitespace-only text  -> []
      - text of <= size words          -> [the whole text] (one chunk)
      - otherwise windows start every (size - overlap) words: 0, 180, 360, ... for 220/40
      - stop as soon as a window reaches the end of the text: never emit a last window
        that only repeats words already covered by the previous one
      - join words back with a single space

    Hints:
      - text.split() splits on any whitespace and drops empty strings
      - the step between window starts is `size - overlap`
      - range(start, stop, step) and list slicing words[a:b] are all you need (~8 lines)
    """
    # TODO(you): implement the sliding window described above.
    chunks=[]
    start=0
    end=size
    words=text.split()
    # if(len(words)<= size):
    #    return " ".join(words)
    if not words:
       return []
    while True:
      chunks.append(" ".join(words[start:end])) 
      if(end >= len(words)):
        break
      start= end-overlap
      end= start + size
    
    return chunks
    raise NotImplementedError("chunk_section: your turn! See the docstring.")


if __name__ == "__main__":
    words = [f"w{i}" for i in range(500)]

    assert chunk_section("") == [], "empty text -> no chunks"
    assert chunk_section("   \n ") == [], "whitespace only -> no chunks"
    assert chunk_section("a b c") == ["a b c"], "short text -> one chunk"

    chunks = chunk_section(" ".join(words), size=220, overlap=40)
    starts = [c.split()[0] for c in chunks]
    assert starts == ["w0", "w180", "w360"], f"windows should start at w0, w180, w360, got {starts}"
    assert all(len(c.split()) <= 220 for c in chunks), "a chunk is longer than `size`"
    assert chunks[-1].split()[-1] == "w499", "the last chunk must reach the end of the text"
    assert chunks[0].split()[-40:] == chunks[1].split()[:40], "consecutive chunks must share 40 words"

    # 400 words: windows 0-219 and 180-399 already cover everything -> no 3rd chunk
    assert len(chunk_section(" ".join(words[:400]), size=220, overlap=40)) == 2, \
        "don't emit a window that only repeats covered words"

    print("chunk_section: all checks passed")
