---
name: segment-analysis
description: Find which classes or slices the model fails on
allowed-tools: Bash Read Write
---

# Segment Analysis

1. Load model predictions and ground truth labels
2. Compute per-class precision, recall, F1
3. Identify the bottom 3 worst-performing segments
4. Surface any slice with F1 below 0.5 as critical failure
5. Output a ranked table: segment, metric, delta from average