---
name: fix-generator
description: Produce specific ranked actions to fix identified root causes
allowed-tools: Bash Read Write
---

# Fix Generator

1. Map each root cause to a concrete fix
2. Rank fixes by expected impact on model performance
3. For each fix provide action, expected gain, effort level
4. Never suggest a fix without linking it to a root cause
5. Output as a numbered action plan