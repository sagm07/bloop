# Bloop — Calibration Examples

These examples demonstrate the correct behavior expected from Bloop audits.
They serve as in-context few-shot calibration: sharp, quantified output vs. vague output.

---

## Example 1 — Good Bloop Output (DR Dataset)

**Input:** `examples/diabetic-retinopathy.csv`

**Output:**
```
## WHERE IT FAILS

| Segment            | F1   | Severity |
|--------------------|------|----------|
| dark + junior      | 0.12 | CRITICAL |
| dark + any         | 0.21 | CRITICAL |
| normal + any       | 0.78 | OK       |

## WHY IT FAILS

1. [CRITICAL] Image quality is a proxy for label quality. Dark images are systematically
   misclassified (F1=0.12). Junior photographers produce 100% of dark-image false negatives.
   This is not a model problem — it is a data collection protocol failure.

2. [WARNING] Class imbalance: 64% positive, 36% negative. Model is tuned for balanced
   distribution but real prevalence in screening populations is 15-20%. Threshold
   calibration has not been performed.

## HOW TO FIX IT

1. [HIGH IMPACT, Low Effort] Retrain on image-quality-stratified batches. Remove
   dark-image samples from training until photographer training protocol is enforced.
   Expected F1 gain on dark segment: +0.25 to +0.35.

2. [HIGH IMPACT, Low Effort] Tune threshold from 0.5 to 0.30 on validation set.
   Expected minority class recall gain: +0.12.

3. [MEDIUM IMPACT, Medium Effort] Enforce image quality check at ingestion. Reject
   dark images below luminance threshold automatically.

## BLOOP SCORE: 2/10
"Do not ship this to a clinic. It will miss every dark-image positive case."
```

---

## Example 2 — Good Bloop Output (COMPAS Dataset)

**Input:** `examples/compas-recidivism.csv`

**Output:**
```
## WHERE IT FAILS

| Segment             | F1   | FPR  | TPR  | Severity |
|---------------------|------|------|------|----------|
| African-American    | 0.61 | 0.42 | 0.82 | CRITICAL |
| Caucasian           | 0.63 | 0.18 | 0.55 | WARNING  |

## WHY IT FAILS

1. [CRITICAL] Equalized odds violation. False positive rate for African-American
   defendants (0.42) is 2.3x that of Caucasian defendants (0.18). The model
   over-predicts recidivism for Black defendants even when they do not reoffend.
   This is a textbook disparate impact failure.

2. [WARNING] Prior count is the strongest predictor feature, but prior count itself
   is historically biased by over-policing. The model encodes historical bias
   as a feature, not a risk signal.

## HOW TO FIX IT

1. [HIGH IMPACT, Medium Effort] Apply equalized odds post-processing: set
   group-specific thresholds to equalize FPR across race. Expected FPR gap
   reduction: 60-80%.

2. [MEDIUM IMPACT, High Effort] Remove prior_count as a feature and substitute
   with charge severity only. Breaks the historical bias loop.

## BLOOP SCORE: 1/10
"This model incarcerates by race. It should not be used in any jurisdiction."
```

---

## Example 3 — Bad Bloop Output (What Bloop Never Does)

**Bad output Bloop rejects:**
```
The model seems to have some bias issues that you might want to look into.
Consider rebalancing your dataset. The accuracy could potentially be improved
with more data or better features. Overall the model is decent but has room
for improvement.
```

**Why this is wrong:** No segment tables. No F1 scores cited. No root causes with evidence.
No specific fixes with expected gains. Vague language ("seems to", "might want to",
"could potentially"). Bloop never produces this.
