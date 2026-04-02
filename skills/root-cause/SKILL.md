---
name: root-cause
description: Diagnose why the model is failing on identified segments
allowed-tools: Bash Read Write
---

# Root Cause Analysis

1. Check for class imbalance in failing segments
2. Check for label noise using confidence score distribution
3. Check for feature leakage or missing values
4. Check for distribution shift between train and test
5. Output a ranked list of root causes with evidence