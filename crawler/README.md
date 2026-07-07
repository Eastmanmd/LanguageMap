# Historical Language Agent — Starter Pipeline

Three files, one SQLite database (`languages.db`, created automatically).

## Files

- **db.py** — shared storage layer. `facts` table keyed on (language, region, period, source) so conflicting sources coexist instead of overwriting each other. Also holds the `crawl_queue`.
- **harvest_wikidata.py** — Stage 1. Pulls language → "indigenous to" region facts (with ISO codes and coordinates) from Wikidata's SPARQL endpoint, paginated with a politeness delay.
- **extract_llm.py** — Stage 2. Pops URLs from the queue, strips the page to plain text, asks Claude to return strict JSON facts, validates each with pydantic, and stores what survives.

## Setup

```bash
pip install requests beautifulsoup4 anthropic pydantic
export ANTHROPIC_API_KEY=sk-ant-...
```

## Run

```bash
# Stage 1: bulk structured harvest (start here — no API key needed)
python harvest_wikidata.py --limit 1000

# Stage 2: LLM extraction from prose pages
python extract_llm.py --seed https://en.wikipedia.org/wiki/Gothic_language
python extract_llm.py --seed https://en.wikipedia.org/wiki/Etruscan_language
python extract_llm.py --run 5
```

## Inspect results

```bash
sqlite3 languages.db "SELECT language, region, period_start, period_end, extractor FROM facts LIMIT 20;"
```

## Next steps to grow it into a full agent

1. **Link discovery** — in `extract_llm.py`, collect links from each page (e.g., other `/wiki/*_language` URLs) and add them to `crawl_queue` for autonomous crawling. Add a per-domain budget and a max-depth counter.
2. **Robots.txt** — check `urllib.robotparser` before fetching arbitrary domains.
3. **Conflict resolution** — facts from both extractors for the same (language, region) pair can be compared; prefer higher confidence or more sources.
4. **Geocoding** — regions from the LLM stage lack coordinates; resolve them via Wikidata lookups or a geocoder.
