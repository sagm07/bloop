---
name: write-report
description: "Writes audit findings to reports/segment_report.md and commits to git"
allowed-tools: Bash Write
---

# Write Report

After every audit:
1. Create reports/ directory if missing
2. Write findings to reports/segment_report.md
3. Run: git add reports/segment_report.md && git commit -m "bloop audit: scored X/10"