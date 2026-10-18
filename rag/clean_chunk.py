"""Step 2: turn raw wikitext into clean, chunked passages in rag/corpus/chunks.jsonl.

Usage:  python rag/clean_chunk.py                    build chunks.jsonl
        python rag/clean_chunk.py --show "Johan Liebert"   print one page's chunks to inspect them

Wikitext is markup ([[links]], {{templates}}, <ref>…</ref>, '''bold'''). Embedding it raw
would waste the model's 512 tokens on syntax, and the LLM would receive noise, so we convert
it to plain text with mwparserfromhell (a real wikitext parser: regexes break on nested
templates).
"""
import argparse
import json
import re

import mwparserfromhell

from chunking import chunk_section
from common import CHUNKS_FILE, MIN_CHUNK_WORDS, RAW_DIR, WIKI_PAGE_URL

# Sections that are images, citations or navigation, not story content.
SKIP_SECTIONS = {"gallery", "references", "external links", "see also", "navigation"}
# Infobox fields that are layout, not facts.
SKIP_FIELDS = {"image", "image1", "caption", "caption1", "title1", "previous", "next"}

HEADING = re.compile(r"^(={2,4})\s*(.+?)\s*\1\s*$", re.MULTILINE)
BR = re.compile(r"<br\s*/?>", re.IGNORECASE)


def _remove(code, node) -> None:
    try:
        code.remove(node)
    except ValueError:
        pass  # already gone: it was nested inside a node we removed earlier


def _replace(code, node, value: str) -> None:
    try:
        code.replace(node, value)
    except ValueError:
        pass


def to_text(wikitext: str) -> str:
    """Wikitext -> plain text."""
    code = mwparserfromhell.parse(BR.sub("; ", wikitext))
    for tag in code.filter_tags():
        if str(tag.tag).lower() in {"ref", "gallery"}:   # citations and image lists
            _remove(code, tag)
    for template in code.filter_templates():
        # {{Quote|text|speaker}}: the dialogue itself is valuable content. Every other
        # template (infobox, navigation, spoiler banner) is dropped by strip_code() below;
        # infobox facts are extracted separately by infobox_facts().
        if str(template.name).strip().lower() == "quote" and template.has(1):
            _replace(code, template, f'"{template.get(1).value.strip_code().strip()}"')
    for link in code.filter_wikilinks():
        if str(link.title).lower().startswith(("file:", "image:", "category:")):
            _remove(code, link)
    text = code.strip_code(normalize=True, collapse=True)
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n\s*\n+", "\n\n", text).strip()


def infobox_facts(wikitext: str) -> tuple[str, str]:
    """Return (page type, facts text) from the page's {{Infobox X}} template.

    The infobox holds the dense facts (family, aliases, age, episode number, director)
    that the prose often doesn't repeat, so it becomes its own small "Facts" chunk.
    """
    for template in mwparserfromhell.parse(BR.sub("; ", wikitext)).filter_templates(recursive=False):
        name = str(template.name).replace("_", " ").strip()   # both "Infobox Episode" and "Infobox_Episode" exist
        if not name.lower().startswith("infobox"):
            continue
        page_type = name[len("infobox"):].strip().lower() or "other"   # "character", "episode", ...
        facts = []
        for param in template.params:
            field = str(param.name).strip()
            value = to_text(str(param.value)).strip(" ;")
            if field.lower() not in SKIP_FIELDS and value:
                facts.append(f"{field.replace('_', ' ')}: {value}")
        return page_type, "\n".join(facts)
    return "other", ""


def split_sections(wikitext: str) -> list[tuple[str, str]]:
    """[(section path, wikitext body)], e.g. ("Biography > Kinderheim 511 massacre", "...").

    Keeping the heading path matters: a chunk saying "he escaped" is ambiguous on its own,
    "Johan Liebert > Biography > After escaping Eisler Memorial" is not.
    """
    sections = []
    path: list[str] = []
    last_end, current = 0, "Introduction"
    for match in HEADING.finditer(wikitext):
        sections.append((current, wikitext[last_end:match.start()]))
        level = len(match.group(1)) - 2           # "==" -> 0, "===" -> 1, "====" -> 2
        heading = to_text(match.group(2))         # headings contain links: "=== [[Nina Fortner]] ==="
        path = path[:level] + [heading]
        current, last_end = " > ".join(path), match.end()
    sections.append((current, wikitext[last_end:]))
    return sections


def page_chunks(page: dict) -> list[dict]:
    title, wikitext = page["title"], page["wikitext"]
    url = WIKI_PAGE_URL + title.replace(" ", "_")
    page_type, facts = infobox_facts(wikitext)

    sections = split_sections(wikitext)
    if facts:
        sections.insert(0, ("Facts", None))

    chunks = []
    for section, body in sections:
        if section.split(" > ")[0].lower() in SKIP_SECTIONS:
            continue
        text = facts if body is None else to_text(body)
        for piece in chunk_section(text):
            if len(piece.split()) < MIN_CHUNK_WORDS:
                continue  # leftovers like "See also: X" match everything and help nothing
            chunks.append({
                "id": f"{page['pageid']}-{len(chunks)}",
                "page": title,
                "section": section,
                "type": page_type,
                "url": url,
                # The page/section prefix is part of what gets embedded: it adds context
                # the paragraph itself lacks ("he" -> which character, which arc).
                "text": f"{title} > {section}\n{piece}",
            })
    return chunks


def load_pages() -> list[dict]:
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted(RAW_DIR.glob("*.json"))]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--show", metavar="TITLE", help="print the chunks of one page instead of writing the file")
    args = parser.parse_args()

    pages = load_pages()
    if not pages:
        raise SystemExit(f"No pages in {RAW_DIR}. Run fetch_corpus.py first.")

    if args.show:
        page = next((p for p in pages if p["title"].lower() == args.show.lower()), None)
        if page is None:
            raise SystemExit(f"No page titled {args.show!r}")
        for chunk in page_chunks(page):
            print(f"--- {chunk['id']} ({len(chunk['text'].split())} words)\n{chunk['text']}\n")
        return

    all_chunks = [chunk for page in pages for chunk in page_chunks(page)]
    with CHUNKS_FILE.open("w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")
    words = [len(c["text"].split()) for c in all_chunks]
    print(f"{len(pages)} pages -> {len(all_chunks)} chunks "
          f"(avg {sum(words) / len(words):.0f} words, max {max(words)}) -> {CHUNKS_FILE}")


if __name__ == "__main__":
    main()
