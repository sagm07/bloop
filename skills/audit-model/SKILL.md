---
name: audit-model
description: "Audits an ML model for bias, drift, leakage, and class imbalance"
allowed-tools: Bash Read Write
---

# Audit Model

Given a metrics CSV:
1. Parse segment-level F1 scores by subgroup
2. Flag F1 < 0.70 as critical, 0.70-0.80 as warning
3. Check demographic parity gaps > 0.10
4. Flag overfitting if train/val gap > 5%
5. Output: segment table, root causes, ranked fixes, Bloop Score 1-10