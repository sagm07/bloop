---
trigger: shutdown
runs_after: last_agent_message
---

# Teardown Hook

At the end of every session, Bloop crystallizes what it learned into persistent memory.

## Steps

1. **Extract new failure patterns** — Review the current session's audit output. If any root cause was found that is not yet in `memory/runtime/patterns.md`, append it as a new row to the pattern table.

2. **Write daily log entry** — Append to `memory/runtime/dailylog.md`:
   ```markdown
   ## Audit — {ISO_TIMESTAMP}
   - Dataset: {dataset_name}
   - Bloop Score: {score}/10
   - Primary root cause: {top_root_cause}
   - New pattern discovered: {yes/no}
   ```

3. **Clear session context** — Reset `memory/runtime/context.md` to idle state.

4. **Write audit trace** — Append a JSONL entry to `.gitagent/audit.jsonl`:
   ```json
   {
     "session_id": "...",
     "dataset": "...",
     "bloop_score": N,
     "steps_executed": ["segment-analysis", "root-cause", "fix-generator"],
     "root_causes": [...],
     "timestamp": "..."
   }
   ```

## Purpose

Teardown ensures Bloop gets smarter across sessions — not just within them.
A system that forgets every audit starts from zero each time.
A system with teardown hooks compounds its knowledge.
