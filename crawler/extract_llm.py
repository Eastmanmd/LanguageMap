"""
Stage 2: Crawl pages from the queue and use an LLM (Claude API) to extract
structured historical-language facts from messy prose.

Setup:
  pip install requests beautifulsoup4 anthropic pydantic
  export ANTHROPIC_API_KEY=sk-ant-...

Seed the queue, then run:
  python extract_llm.py --seed https://en.wikipedia.org/wiki/Gothic_language
  python extract_llm.py --run 5
"""
import argparse
import json
import time
from typing import Optional

import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel, ValidationError

import anthropic

from db import connect, insert_fact

USER_AGENT = "LangHistoryAgent/0.1 (personal research project)"
MODEL = "claude-sonnet-4-6"

EXTRACTION_PROMPT = """\
You extract historical linguistics facts from web page text.

Return ONLY a JSON array (no prose, no markdown fences). Each element:
{
  "language": str,            // language name
  "iso_code": str|null,       // ISO 639-3 if stated, else null
  "region": str,              // place where it was spoken
  "period_start": int|null,   // year, negative for BCE, null if unknown
  "period_end": int|null,     // null if still spoken or unknown
  "confidence": float         // 0-1, your certainty the page supports this
}

Rules:
- Only include claims the text actually supports. No outside knowledge.
- One element per (language, region, period) combination.
- If the page contains no such facts, return [].

PAGE TEXT:
"""


class Fact(BaseModel):
    language: str
    iso_code: Optional[str] = None
    region: str
    period_start: Optional[int] = None
    period_end: Optional[int] = None
    confidence: float = 0.5


def fetch_text(url: str, max_chars: int = 20000) -> str:
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(" ", strip=True)[:max_chars]


def extract_facts(page_text: str) -> list[Fact]:
    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
    msg = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        messages=[{"role": "user",
                   "content": EXTRACTION_PROMPT + page_text}],
    )
    raw = msg.content[0].text.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```")
    try:
        items = json.loads(raw)
    except json.JSONDecodeError:
        print("  ! LLM returned non-JSON, skipping page")
        return []
    facts = []
    for item in items:
        try:
            facts.append(Fact(**item))
        except ValidationError as e:
            print(f"  ! rejected malformed fact: {e}")
    return facts


def seed(conn, url: str):
    conn.execute(
        "INSERT OR IGNORE INTO crawl_queue (url) VALUES (?)", (url,))
    conn.commit()
    print(f"queued: {url}")


def run(conn, n_pages: int):
    for _ in range(n_pages):
        row = conn.execute(
            "SELECT url FROM crawl_queue WHERE status='pending' LIMIT 1"
        ).fetchone()
        if not row:
            print("queue empty")
            return
        url = row[0]
        print(f"processing {url}")
        try:
            text = fetch_text(url)
            facts = extract_facts(text)
            inserted = 0
            for f in facts:
                if insert_fact(conn, {**f.model_dump(),
                                      "source_url": url,
                                      "extractor": "llm"}):
                    inserted += 1
            conn.execute(
                "UPDATE crawl_queue SET status='done' WHERE url=?", (url,))
            print(f"  {len(facts)} facts extracted, {inserted} new")
        except Exception as e:
            conn.execute(
                "UPDATE crawl_queue SET status='failed' WHERE url=?", (url,))
            print(f"  ! failed: {e}")
        conn.commit()
        time.sleep(1)  # politeness delay


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", help="add a URL to the crawl queue")
    ap.add_argument("--run", type=int, default=0,
                    help="process N pages from the queue")
    args = ap.parse_args()
    conn = connect()
    if args.seed:
        seed(conn, args.seed)
    if args.run:
        run(conn, args.run)
