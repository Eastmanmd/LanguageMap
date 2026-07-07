"""
Batch harvester for Nigerian language facts, built on the same idea as
harvest_wikidata.py / extract_llm.py but targeting the LanguageMap app's
schema (classification, ethnic group, description) instead of historical
region/period facts.

Strategy (cheap, no LLM/API-key required for this stage):
  1. Guess an English Wikipedia title for each language slug ("<Name> language").
  2. Batch-fetch intro extracts + Wikidata QID via MediaWiki's `extracts` API
     (BATCH_SIZE titles per call, with redirects followed).
  3. For titles that don't resolve, fall back to a single-title search query.
  4. Walk each Wikidata item's classification chain via P279 ("subclass of"),
     one BFS layer at a time so shared ancestors (e.g. "Chadic languages")
     are only fetched once no matter how many languages share them --
     O(depth) batched calls instead of O(languages x depth).
  5. Write one JSON object keyed by slug to raw_language_facts.json:
       { wiki_title, extract, shortdesc, iso639_3, classification_chain }
     or {"unresolved": true} if nothing was found.

This raw file is intentionally uninterpreted -- turning it into
languages.json-schema entries (classification string, ethnicGroups,
similarLanguages, polished description) is a separate synthesis step.

Run:
  python harvest_language_profiles.py --slugs slugs.json --out raw_language_facts.json
"""
import argparse
import json
import time
from pathlib import Path

import requests

WIKI_API = "https://en.wikipedia.org/w/api.php"
WD_API = "https://www.wikidata.org/w/api.php"
USER_AGENT = "LanguageMapProfileHarvester/0.1 (personal research project)"
BATCH_SIZE = 20
MAX_CHAIN_DEPTH = 8
# Meta/taxonomic nodes that show up above real language families -- stop here.
STOPLIST = {
    "language", "languoid", "human language", "natural language",
    "spoken language", "Nostratic", "Borean", "Proto-Human", "macrolanguage",
}


def guess_title(slug: str) -> str:
    words = slug.replace("_", "-").split("-")
    return " ".join(w.capitalize() for w in words) + " language"


def chunked(seq, size):
    seq = list(seq)
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def fetch_extracts(titles):
    """titles -> {original_title: {resolved_title, extract, shortdesc, qid}}

    Resolves forward from each originally-requested title (through
    normalization, then any redirect chain) to its final page, so multiple
    input titles that happen to funnel into the same target page each get
    their own correct entry instead of colliding in a reverse lookup."""
    resp = request_with_retry(
        "GET",
        WIKI_API,
        params={
            "action": "query",
            "format": "json",
            "formatversion": 2,
            "prop": "extracts|pageprops",
            "exintro": 1,
            "explaintext": 1,
            "exsentences": 4,
            "redirects": 1,
            "titles": "|".join(titles),
        },
        headers={"User-Agent": USER_AGENT},
        timeout=30,
    )
    data = resp.json()
    query = data.get("query", {})
    normalized_from = {n["from"]: n["to"] for n in query.get("normalized", [])}
    redirect_from = {r["from"]: r["to"] for r in query.get("redirects", [])}
    pages_by_title = {
        p["title"]: p for p in query.get("pages", []) if not p.get("missing")
    }

    out = {}
    for original in titles:
        cur = normalized_from.get(original, original)
        for _ in range(5):  # follow chained redirects, capped
            if cur in redirect_from:
                cur = redirect_from[cur]
            else:
                break
        page = pages_by_title.get(cur)
        if not page:
            continue
        props = page.get("pageprops", {})
        out[original] = {
            "resolved_title": page.get("title"),
            "extract": page.get("extract", "").strip(),
            "shortdesc": props.get("wikibase-shortdesc"),
            "qid": props.get("wikibase_item"),
        }
    return out


def search_fallback(query_text):
    resp = request_with_retry(
        "GET",
        WIKI_API,
        params={
            "action": "query",
            "format": "json",
            "formatversion": 2,
            "list": "search",
            "srlimit": 1,
            "srsearch": query_text,
        },
        headers={"User-Agent": USER_AGENT},
        timeout=30,
    )
    results = resp.json().get("query", {}).get("search", [])
    return results[0]["title"] if results else None


def request_with_retry(method, url, **kwargs):
    for attempt in range(8):
        resp = requests.request(method, url, **kwargs)
        if resp.status_code in (429, 503):
            wait = min(3 * 2**attempt, 90)
            print(f"  ! {resp.status_code}, backing off {wait}s")
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp
    resp.raise_for_status()
    return resp


def wd_get_entities(qids, props):
    out = {}
    for batch in chunked(qids, 50):
        resp = request_with_retry(
            "GET",
            WD_API,
            params={
                "action": "wbgetentities",
                "format": "json",
                "ids": "|".join(batch),
                "props": props,
                "languages": "en",
            },
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        out.update(resp.json().get("entities", {}))
        time.sleep(1.2)
    return out


def label_of(entity):
    return entity.get("labels", {}).get("en", {}).get("value")


def iso_of(entity):
    claims = entity.get("claims", {})
    if "P220" in claims:
        try:
            return claims["P220"][0]["mainsnak"]["datavalue"]["value"]
        except (KeyError, IndexError):
            return None
    return None


def parent_of(entity):
    claims = entity.get("claims", {})
    if "P279" in claims:
        try:
            return claims["P279"][0]["mainsnak"]["datavalue"]["value"]["id"]
        except (KeyError, IndexError):
            return None
    return None


def build_classification_chains(qids):
    """BFS up the P279 chain for a set of Wikidata QIDs, one layer at a
    time, so shared ancestors are only fetched once. Returns
    {qid: [own_label, parent_label, grandparent_label, ...]} (leaf-first)."""
    qids = [q for q in qids if q]
    entity_cache = {}
    chains = {qid: [] for qid in qids}
    frontier = {qid: qid for qid in qids}  # leaf qid -> current qid to expand
    iso_by_qid = {}

    for depth in range(MAX_CHAIN_DEPTH):
        to_fetch = sorted({q for q in frontier.values() if q not in entity_cache})
        if not to_fetch:
            break
        fetched = wd_get_entities(to_fetch, "labels|claims")
        entity_cache.update(fetched)

        if depth == 0:
            for leaf_qid in qids:
                ent = entity_cache.get(leaf_qid, {})
                iso_by_qid[leaf_qid] = iso_of(ent)

        next_frontier = {}
        for leaf_qid, current_qid in frontier.items():
            ent = entity_cache.get(current_qid)
            if not ent:
                continue
            label = label_of(ent)
            if label in STOPLIST:
                continue
            if label:
                chains[leaf_qid].append(label)
            parent = parent_of(ent)
            if parent:
                next_frontier[leaf_qid] = parent
        frontier = next_frontier
        if not frontier:
            break

    return chains, iso_by_qid


def main(slugs_path: str, out_path: str):
    slugs = json.loads(Path(slugs_path).read_text())
    print(f"{len(slugs)} slugs to resolve")

    slug_to_title = {s: guess_title(s) for s in slugs}
    resolved = {}  # title -> facts

    for batch in chunked(list(slug_to_title.values()), BATCH_SIZE):
        resolved.update(fetch_extracts(batch))
        print(f"  batch fetched, {len(resolved)} resolved so far")
        time.sleep(0.5)

    for slug, title in slug_to_title.items():
        if title not in resolved:
            found_title = search_fallback(f"{slug} language Nigeria")
            if found_title:
                extra = fetch_extracts([found_title])
                if found_title in extra:
                    resolved[title] = extra[found_title]
            time.sleep(0.5)

    qids = sorted({v["qid"] for v in resolved.values() if v.get("qid")})
    print(f"{len(qids)} wikidata items to classify")
    chains, iso_by_qid = build_classification_chains(qids)

    facts = {}
    for slug, title in slug_to_title.items():
        info = resolved.get(title)
        if not info:
            facts[slug] = {"unresolved": True}
            continue
        qid = info.get("qid")
        chain = list(reversed(chains.get(qid, []))) if qid else []
        facts[slug] = {
            "wiki_title": info.get("resolved_title"),
            "extract": info.get("extract"),
            "shortdesc": info.get("shortdesc"),
            "iso639_3": iso_by_qid.get(qid),
            "classification_chain": chain,
        }

    Path(out_path).write_text(json.dumps(facts, indent=2, ensure_ascii=False))
    n_resolved = sum(1 for f in facts.values() if not f.get("unresolved"))
    print(f"Done. {n_resolved}/{len(slugs)} resolved. Wrote {out_path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--slugs", required=True, help="JSON file: array of language slugs")
    ap.add_argument("--out", default="raw_language_facts.json")
    args = ap.parse_args()
    main(args.slugs, args.out)
