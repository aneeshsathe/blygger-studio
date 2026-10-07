"""Controlled trigger prototype over the real schema; never a production migration.

Contract: relevant committed effects move domain counters in the same SQLite
transaction. Judgment is an explicit expected-domain set per witness, independent
of the trigger generator. This covers named cases, not all renderer dependencies
or Cloudflare billing/provider behavior. Calibration removes one delete trigger.
Run from any directory: python3 models/d1-polling-cache/trigger_probe.py
"""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOMAINS = ("items", "reading", "subscriptions", "hoppers", "signals", "settings", "feed")
db = sqlite3.connect(":memory:")
for path in sorted((ROOT / "migrations").glob("*.sql")):
    db.executescript(path.read_text())
db.execute("CREATE TABLE probe_changes (id INTEGER PRIMARY KEY CHECK(id=1), "
           + ", ".join(f"{d} INTEGER NOT NULL DEFAULT 0" for d in DOMAINS) + ")")
db.execute("INSERT INTO probe_changes(id) VALUES(1)")

# This is a conservative prototype: some changes over-track intentionally.
BASE = {
    "items": {"items", "reading"}, "versions": {"items", "reading", "feed"},
    "media": {"items", "feed"}, "settings": {"settings"},
    "subscriptions": {"subscriptions"}, "imported_items": {"reading", "hoppers"},
    "hoppers": {"hoppers"}, "hopper_items": {"hoppers"}, "signals": {"signals"},
}
EXTRA = {
    "items": ({"kind", "status", "version", "created", "updated", "forked_from", "fork_cite"}, {"feed"}),
    "subscriptions": ({"id", "origin", "title"}, {"reading", "hoppers", "feed"}),
    "imported_items": ({"subscription_id", "remote_id", "kind", "page"}, {"feed"}),
}
FEED_SETTINGS = {"site_title", "author_name", "author_bio", "site_url", "timezone"}
trigger_sql = []

def changed_columns(columns):
    return " OR ".join(f'OLD."{c}" IS NOT NEW."{c}"' for c in sorted(columns))

for table, base in BASE.items():
    columns = {r[1] for r in db.execute(f'PRAGMA table_info("{table}")')}
    for event in ("INSERT", "UPDATE", "DELETE"):
        expr = {d: "1" if d in base else "0" for d in DOMAINS}
        if table in EXTRA:
            fields, domains = EXTRA[table]
            condition = f"({changed_columns(fields)})" if event == "UPDATE" else "1"
            for domain in domains:
                if domain not in base:
                    expr[domain] = f"CASE WHEN {condition} THEN 1 ELSE 0 END"
        if table == "settings":
            keys = ",".join(f"'{key}'" for key in sorted(FEED_SETTINGS))
            sides = ("OLD", "NEW") if event == "UPDATE" else ("NEW",) if event == "INSERT" else ("OLD",)
            condition = " OR ".join(f"{side}.key IN ({keys})" for side in sides)
            expr["feed"] = f"CASE WHEN {condition} THEN 1 ELSE 0 END"
        assignments = ", ".join(f"{d}={d}+({expr[d]})" for d in DOMAINS if expr[d] != "0")
        guard = f" WHEN {changed_columns(columns)}" if event == "UPDATE" else ""
        sql = (f"CREATE TRIGGER probe_{table}_{event.lower()} AFTER {event} ON {table}{guard} "
               f"BEGIN UPDATE probe_changes SET {assignments} WHERE id=1; END;")
        trigger_sql.append(sql)
        db.executescript(sql)

(Path(__file__).parent / "trigger-prototype.sql").write_text(
    "-- Controlled prototype ONLY. Not a production migration.\n" + "\n".join(trigger_sql) + "\n")

def state():
    return dict(zip(DOMAINS, db.execute("SELECT " + ",".join(DOMAINS) + " FROM probe_changes WHERE id=1").fetchone()))

receipts = []

def witness(name, sql, args, expected):
    before = state()
    db.execute(sql, args)
    after = state()
    observed = {d for d in DOMAINS if after[d] > before[d]}
    assert observed == set(expected), (name, observed, expected)
    receipts.append({"name": name, "domains": sorted(observed)})

witness("create draft", "INSERT INTO items(id,created,updated) VALUES('a','t','t')", (), {"items", "reading", "feed"})
witness("publish state", "UPDATE items SET status='public',version=1 WHERE id='a'", (), {"items", "reading", "feed"})
witness("working copy with unchanged timestamp", "UPDATE items SET content_md='new draft' WHERE id='a'", (), {"items", "reading"})
witness("no-op update", "UPDATE items SET content_md=content_md WHERE id='a'", (), set())
witness("insert subscription", "INSERT INTO subscriptions(id,kind,origin,feed_url,created) VALUES('s','blyg','https://a/','https://a/feed.xml','t')", (), {"subscriptions", "reading", "hoppers", "feed"})
witness("304 poll diagnostics", "UPDATE subscriptions SET last_poll_at='later' WHERE id='s'", (), {"subscriptions"})
witness("nullable diagnostic changes", "UPDATE subscriptions SET etag='x' WHERE id='s'", (), {"subscriptions"})
witness("diagnostic returns to null", "UPDATE subscriptions SET etag=NULL WHERE id='s'", (), {"subscriptions"})
witness("rename provenance source", "UPDATE subscriptions SET title='renamed' WHERE id='s'", (), {"subscriptions", "reading", "hoppers", "feed"})
witness("old-dated arrival", "INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,updated,observed_at) VALUES('s','r','fragment','current',1,'old','now')", (), {"reading", "hoppers", "feed"})
witness("direct cron HTML repair", "UPDATE imported_items SET content_html='repaired' WHERE remote_id='r'", (), {"reading", "hoppers"})
witness("provenance kind changes", "UPDATE imported_items SET kind='thread' WHERE remote_id='r'", (), {"reading", "hoppers", "feed"})
witness("published version", "INSERT INTO versions(item_id,version,content_md,content_hash,published_at) VALUES('a',1,'body','hash','t')", (), {"items", "reading", "feed"})
witness("feed setting", "INSERT INTO settings(key,value) VALUES('site_title','title')", (), {"settings", "feed"})
witness("update-state setting", "INSERT INTO settings(key,value) VALUES('update_checked_at','t')", (), {"settings"})
witness("key moves out of feed set", "UPDATE settings SET key='other' WHERE key='site_title'", (), {"settings", "feed"})
witness("withdrawal", "UPDATE items SET status='withdrawn',kind='withdrawn',version=2 WHERE id='a'", (), {"items", "reading", "feed"})
witness("physical delete", "DELETE FROM imported_items WHERE remote_id='r'", (), {"reading", "hoppers", "feed"})
db.commit()

before = state()
db.execute("BEGIN")
db.execute("UPDATE subscriptions SET title='rolled back' WHERE id='s'")
assert state()["feed"] > before["feed"]
db.rollback()
assert state() == before
assert db.execute("SELECT title FROM subscriptions WHERE id='s'").fetchone()[0] == 'renamed'
receipts.append({"name": "transaction rollback restores source and revisions", "passed": True})

before = state()
db.execute("INSERT INTO security_budgets(key,window,used) VALUES('k',1,1)")
assert state() == before
receipts.append({"name": "security budget does not dirty content", "passed": True})

# Fail-safe obligation: a missing fixed row must not silently accept untracked
# changes. The simple UPDATE-only prototype deliberately exposes that gap.
db.commit()
db.execute("BEGIN")
db.execute("DELETE FROM probe_changes")
db.execute("UPDATE subscriptions SET title='untracked' WHERE id='s'")
assert db.execute("SELECT COUNT(*) FROM probe_changes").fetchone()[0] == 0
db.rollback()
receipts.append({"name": "missing state row permits untracked write", "result": "gap reproduced; production needs fail-closed guard or enforced restoration"})

# Calibrate one concrete repair at the same boundary. A production version
# needs this protection for every tracked effect, not just this test table.
db.executescript("""CREATE TRIGGER probe_subscriptions_missing_state
BEFORE UPDATE ON subscriptions WHEN NOT EXISTS (SELECT 1 FROM probe_changes WHERE id=1)
BEGIN SELECT RAISE(ABORT, 'missing change state'); END;""")
db.execute("BEGIN")
db.execute("DELETE FROM probe_changes")
try:
    db.execute("UPDATE subscriptions SET title='must fail' WHERE id='s'")
except sqlite3.IntegrityError as error:
    assert str(error) == 'missing change state'
    assert db.execute("SELECT title FROM subscriptions WHERE id='s'").fetchone()[0] == 'renamed'
else:
    raise AssertionError("missing-state repair did not reject source write")
db.rollback()
receipts.append({"name": "missing-state repair rejects source mutation", "passed": True,
                 "limits": "one-table repair witness; production coverage not established"})

# Known wrong trigger: deletion not recorded. Independent expected set rejects it.
db.execute("DROP TRIGGER probe_items_delete")
try:
    witness("missing delete trigger mutant", "DELETE FROM items WHERE id='a'", (), {"items", "reading", "feed"})
except AssertionError:
    receipts.append({"name": "missing delete trigger mutant", "result": "expected domain assertion failure"})
else:
    raise AssertionError("calibration mutant survived")

before = db.total_changes
db.executemany("INSERT INTO imported_items(subscription_id,remote_id,kind,state,version,observed_at) VALUES('s',?,'fragment','current',1,'now')",
               [(f"bulk-{i}",) for i in range(100)])
delta = db.total_changes - before
assert delta == 200  # 100 source inserts + 100 fixed-state-row updates.
receipts.append({"name": "100-row import write amplification", "source_rows": 100,
                 "sqlite_total_changes": delta, "counter_row_updates": 100,
                 "limits": "not D1 billed rows; index writes and provider accounting unmeasured"})

print(json.dumps({"sqlite_version": sqlite3.sqlite_version, "trigger_count": len(trigger_sql),
                  "receipts": receipts,
                  "limits": ["prototype deliberately over-tracks some updates", "not a complete dependency matrix",
                             "not production entry-point or D1/R2 witness", "trigger billing unmeasured"]}, indent=2))
