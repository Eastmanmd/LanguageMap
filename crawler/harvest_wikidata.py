"""
Stage 1: Harvest language -> region facts from Wikidata via SPARQL.

Wikidata properties used:
  P31/P279*  instance of (subclass of) language (Q34770)
  P220       ISO 639-3 code
  P2341      indigenous to  (region where historically/natively spoken)
  P625       coordinate location (of the region item)

Run:  python harvest_wikidata.py [--limit 500]
"""
import argparse
import time

import requests

from db import connect, insert_fact

ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "LangHistoryAgent/0.1 (personal research project)"

# LIMIT/OFFSET pagination keeps each query cheap enough to avoid timeouts.
QUERY = """
SELECT ?lang ?langLabel ?iso ?region ?regionLabel ?coord WHERE {
  ?lang wdt:P31/wdt:P279* wd:Q34770 .        # a language
  ?lang wdt:P2341 ?region .                   # indigenous to
  OPTIONAL { ?lang wdt:P220 ?iso . }          # ISO 639-3
  OPTIONAL { ?region wdt:P625 ?coord . }      # region coordinates
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT %(limit)d OFFSET %(offset)d
"""


def parse_point(wkt: str):
    """'Point(lon lat)' -> (lat, lon) or (None, None)."""
    try:
        lon, lat = wkt.strip("Point()").split()
        return float(lat), float(lon)
    except Exception:
        return None, None


def fetch_page(limit: int, offset: int) -> list[dict]:
    resp = requests.get(
        ENDPOINT,
        params={"query": QUERY % {"limit": limit, "offset": offset},
                "format": "json"},
        headers={"User-Agent": USER_AGENT},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["results"]["bindings"]


def main(total_limit: int, page_size: int = 200):
    conn = connect()
    inserted = 0
    for offset in range(0, total_limit, page_size):
        rows = fetch_page(min(page_size, total_limit - offset), offset)
        if not rows:
            break
        for row in rows:
            lat, lon = (None, None)
            if "coord" in row:
                lat, lon = parse_point(row["coord"]["value"])
            fact = {
                "language": row["langLabel"]["value"],
                "iso_code": row.get("iso", {}).get("value"),
                "region": row["regionLabel"]["value"],
                "lat": lat,
                "lon": lon,
                "source_url": row["lang"]["value"],  # Wikidata entity URL
                "extractor": "wikidata",
            }
            if insert_fact(conn, fact):
                inserted += 1
        print(f"offset {offset}: {len(rows)} rows fetched, "
              f"{inserted} total inserted")
        time.sleep(1)  # politeness delay for the public endpoint
    print(f"Done. {inserted} new facts stored.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=500,
                    help="max rows to harvest (default 500)")
    args = ap.parse_args()
    main(args.limit)
