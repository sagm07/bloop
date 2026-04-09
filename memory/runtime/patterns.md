# Bloop — Learned Failure Patterns

This file is maintained by the bootstrap and teardown hooks.
It is loaded at the start of every session so Bloop enters already knowing what it has seen before.

## Pattern Registry

| Pattern | Frequency Seen | Typical F1 Impact | Canonical Fix |
|---|---|---|---|
| Class imbalance (minority < 10%) | High | -0.15 to -0.30 on minority class | SMOTE at 4:1, adjust threshold to 0.35 |
| Train/test distribution shift | Medium | -0.10 to -0.25 overall | Feature drift audit, retrain on recent data |
| Label noise in crowdsourced labels | Medium | -0.08 to -0.20 on noisy classes | Confident learning, cross-annotator agreement filter |
| Feature leakage from target variable | Low | Inflates train F1 by +0.20, collapses in production | Remove leaky feature, retrain from scratch |
| Threshold miscalibration (default 0.5) | High | -0.12 to -0.18 on minority class | Tune threshold on validation set with F1 objective |

<!-- New patterns appended by teardown hook -->
