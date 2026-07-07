"""SQLite storage for historical language-region facts."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "languages.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS facts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    language      TEXT NOT NULL,
    iso_code      TEXT,               -- ISO 639-3 if known
    region        TEXT NOT NULL,      -- place name as stated by source
    lat           REAL,
    lon           REAL,
    period_start  INTEGER,            -- year, negative = BCE
    period_end    INTEGER,            -- NULL = still spoken / unknown
    source_url    TEXT NOT NULL,
    extractor     TEXT NOT NULL,      -- 'wikidata' | 'llm'
    confidence    REAL DEFAULT 1.0,
    created_at    TEXT DEFAULT (datetime('now')),
    UNIQUE(language, region, period_start, period_end, source_url)
);

CREATE TABLE IF NOT EXISTS crawl_queue (
    url        TEXT PRIMARY KEY,
    status     TEXT DEFAULT 'pending',   -- pending | done | failed
    added_at   TEXT DEFAULT (datetime('now'))
);
"""


def connect(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA)
    return conn


def insert_fact(conn: sqlite3.Connection, fact: dict) -> bool:
    """Insert a fact dict; returns True if inserted, False if duplicate."""
    try:
        conn.execute(
            """INSERT INTO facts
               (language, iso_code, region, lat, lon,
                period_start, period_end, source_url, extractor, confidence)
               VALUES (:language, :iso_code, :region, :lat, :lon,
                       :period_start, :period_end, :source_url,
                       :extractor, :confidence)""",
            {
                "iso_code": None, "lat": None, "lon": None,
                "period_start": None, "period_end": None,
                "confidence": 1.0, **fact,
            },
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
