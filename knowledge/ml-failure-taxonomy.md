# ML Failure Taxonomy

> Bloop's pre-loaded domain expertise. This file is read at bootstrap time and injected into every audit as structured prior knowledge. It classifies ML failure modes, their observable symptoms, known fixes, and expected F1 gains from applying each fix.

---

## 1. Class Imbalance

**Definition:** The training set has a heavily skewed class distribution (minority class < 15% of total).

**Observable Symptoms:**
- Overall accuracy high (>85%), minority class F1 < 0.5
- Model predicts majority class with high confidence on nearly all samples
- Confusion matrix shows very few true positives for minority class

**Known Fixes (ranked by impact):**
| Fix | Expected F1 Gain | Effort |
|---|---|---|
| Tune classification threshold (0.5 → 0.3) | +0.08 to +0.15 | Low |
| SMOTE oversampling at 4:1 ratio | +0.10 to +0.18 | Low |
| Class-weighted loss (weight = n_majority / n_minority) | +0.08 to +0.12 | Low |
| Undersample majority class | +0.05 to +0.10 | Low |
| Ensemble with balanced bagging | +0.12 to +0.20 | Medium |

---

## 2. Distribution Shift (Covariate Shift)

**Definition:** Feature distributions in production differ significantly from training data.

**Observable Symptoms:**
- Train F1 >> Test F1 (gap > 0.10)
- Model performance degrades over time (time-series performance plot)
- PSI (Population Stability Index) > 0.2 on key features

**Known Fixes (ranked by impact):**
| Fix | Expected F1 Gain | Effort |
|---|---|---|
| Retrain on recent data (sliding window) | +0.10 to +0.20 | Medium |
| Importance-weighted resampling (IWERM) | +0.08 to +0.15 | High |
| Feature drift monitoring + alert thresholds | Prevents degradation | Medium |
| Domain adaptation layer | +0.05 to +0.15 | High |

---

## 3. Label Noise

**Definition:** A significant fraction of training labels are incorrect, either from annotation error or systematic mislabeling.

**Observable Symptoms:**
- Training loss does not converge cleanly (oscillates)
- High variance between cross-validation folds
- Model is overconfident on incorrect predictions

**Known Fixes (ranked by impact):**
| Fix | Expected F1 Gain | Effort |
|---|---|---|
| Confident learning (cleanlab) to identify noisy labels | +0.08 to +0.18 | Medium |
| Cross-annotator agreement filter (keep only consensus labels) | +0.10 to +0.20 | High |
| Relabel top-N most uncertain samples | +0.05 to +0.12 | High |

---

## 4. Feature Leakage

**Definition:** One or more features in the training set contain information from the future or from the target variable itself.

**Observable Symptoms:**
- Training F1 abnormally high (> 0.95)
- Production F1 collapses completely (< 0.5)
- High feature importance for a feature that logically shouldn't predict the target

**Known Fixes:**
| Fix | Expected F1 Gain | Effort |
|---|---|---|
| Identify and remove leaky feature | Restores realistic baseline | Low |
| Temporal split validation (no future data in train) | Prevents re-introduction | Low |
| Feature importance audit before every release | Ongoing prevention | Low |

---

## 5. Threshold Miscalibration

**Definition:** The default prediction threshold (0.5) is not optimal for this class distribution or cost structure.

**Observable Symptoms:**
- Recall on minority class very low (< 0.4) while precision is high
- Business cost of false negatives >> false positives (or vice versa)
- ROC-AUC is reasonable but F1 is poor

**Known Fixes:**
| Fix | Expected F1 Gain | Effort |
|---|---|---|
| Threshold search on validation set (maximize F1) | +0.08 to +0.15 | Low |
| Cost-sensitive threshold (minimize business cost function) | +0.05 to +0.20 | Low |
| Precision-Recall curve analysis | Informs optimal threshold | Low |

---

## 6. Demographic Bias (Disparate Impact)

**Definition:** The model performs significantly differently across demographic subgroups (race, gender, age).

**Observable Symptoms:**
- F1 gap > 0.10 between subgroups on same task
- Demographic parity ratio < 0.8 (adverse impact threshold)
- Equalized odds violation: TPR or FPR differs by group

**Known Fixes:**
| Fix | Expected F1 Gain | Effort |
|---|---|---|
| Adversarial debiasing during training | Reduces gap by 40-60% | High |
| Post-processing threshold adjustment per group | Equalizes TPR/FPR | Medium |
| Re-examine feature set for proxies | Removes indirect discrimination | Medium |
| Fairness-constrained optimization | Enforces parity constraint | High |

---

## Bloop Score Reference

| Score | Interpretation |
|---|---|
| 1–3 | Do not ship. Multiple critical failures. |
| 4–6 | Fixable but needs significant work before deployment. |
| 7–9 | Good with minor issues. Ship after addressing flagged items. |
| 10 | Ship it. |
