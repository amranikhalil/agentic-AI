"""Step 1: download the Monster wiki pages into rag/corpus/raw/.

Usage:  python rag/fetch_corpus.py [--refresh]

Pages already on disk are skipped, so re-running is cheap and the wiki is only
scraped once. --refresh downloads everything again.
"""
import argparse
import json
import time
from datetime import datetime, timezone

import requests

from common import RAW_DIR, CORPUS_DIR, USER_AGENT, WIKI_API

# Subpages (/Gallery, /Appearances, /Transcript, short /Plot stubs) and navigation pages
# are mostly lists, images or duplicated content: they add noise to retrieval, not facts.
SKIP_SUFFIXES = ("(Disambiguation)",)
SKIP_PREFIXES = ("List of", "Manual of Style")

session = requests.Session()
session.headers["User-Agent"] = USER_AGENT


def api(**params) -> dict:
    params |= {"format": "json", "formatversion": 2}
    response = session.get(WIKI_API, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    if "error" in data:
        raise RuntimeError(f"Wiki API error for {params}: {data['error']}")
    return data


def list_titles() -> list[str]:
    """All article titles (namespace 0, no redirects), following API pagination."""
    titles: list[str] = []
    cont: dict = {}
    while True:
        data = api(action="query", list="allpages", apnamespace=0,
                   apfilterredir="nonredirects", aplimit=500, **cont)
        titles += [p["title"] for p in data["query"]["allpages"]]
        if "continue" not in data:
            return titles
        cont = data["continue"]


def keep(title: str) -> bool:
    return "/" not in title and not title.endswith(SKIP_SUFFIXES) and not title.startswith(SKIP_PREFIXES)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="re-download pages already on disk")
    args = parser.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    all_titles = list_titles()
    titles = [t for t in all_titles if keep(t)]
    print(f"{len(all_titles)} articles on the wiki, keeping {len(titles)}")

    # Files are named by pageid (titles contain ':' '?' that Windows rejects), so map
    # the titles we already have on disk to skip them without calling the API.
    on_disk = {}
    if not args.refresh:
        for path in RAW_DIR.glob("*.json"):
            data = json.loads(path.read_text(encoding="utf-8"))
            on_disk[data["title"]] = data

    pages = []
    for i, title in enumerate(titles, 1):
        data = on_disk.get(title)
        if data is None:
            data = api(action="parse", page=title, prop="wikitext|revid")["parse"]
            (RAW_DIR / f"{data['pageid']}.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            print(f"[{i}/{len(titles)}] {title}")
            time.sleep(0.5)  # be polite to Fandom's servers
        pages.append({"title": data["title"], "pageid": data["pageid"], "revid": data["revid"]})

    # The revision ids pin exactly which version of each page we indexed: if an eval score
    # changes later, this tells us whether the data changed or our code did.
    manifest = {
        "source": WIKI_API,
        "license": "CC BY-SA (Fandom)",
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "pages": pages,
    }
    (CORPUS_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Done: {len(pages)} pages in {RAW_DIR}")


if __name__ == "__main__":
    main()
