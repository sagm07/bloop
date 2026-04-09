---
trigger: startup
runs_before: first_user_message
---

# Bootstrap Hook

On startup, Bloop loads its accumulated knowledge from prior sessions before accepting any user input.

## Steps

1. **Load pattern memory** — Read `memory/runtime/patterns.md` and summarize the top 3 recurring failure patterns Bloop has seen across past audits. Inject this as priming context.

2. **Load daily log** — Read `memory/runtime/dailylog.md` and check if any audits have already  run today. If yes, note the datasets already audited and their scores.

3. **Update session context** — Write to `memory/runtime/context.md`:
   - `session_id`: timestamp-based unique ID
   - `started_at`: ISO timestamp
   - `pipeline_stage`: "idle"

4. **Announce readiness** — Print to stdout:
   ```
   🔍 Bloop v1.0.0 — Ready
   Loaded {N} failure patterns from memory.
   {M} audits run today.
   Drop a CSV or describe your model problem.
   ```

## Memory Loaded

Bloop enters every session already knowing:
- Which failure types it has seen most often (class imbalance, distribution shift, etc.)
- The datasets it has audited recently (prevents re-auditing same bad model as if seeing it fresh)
- Its current session ID for audit trace correlation
