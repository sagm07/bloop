---
name: wiki-lint
description: "Review, merge duplicates, and organize the Wiki."
version: "1.0.0"
role: maintainer
allowed-tools: Read Write
inputs:
  - name: all_wiki_pages
    type: string
    required: true
outputs:
  - name: lint_report
    type: string
---

# Wiki Lint

## Role
You are the **Maintainer**. Your job is to keep the LLM Wiki organized.

## Steps
1. Analyze the contents of all existing wiki pages.
2. Identify pages that are fundamentally describing the exact same ML failure pattern and should be merged.
3. Output a structured JSON or bullet list of recommended merges.

## Constraints
- This skill is designed for asynchronous background maintenance, not real-time auditing.
