# Historical Pattern Matching - Bloop

## Pattern 001 - The Amazon Resumé Echo
**Timestamp**: 2026-03-24T14:32:11Z
**Input**: Tabular recruiting dataset from global logistics firm
**Discovered Metric**: F1 score for `women` segment = 0.38 (`SEVERE`). Male segment = 0.81.
**Root Cause**: The model heavily penalized the word "women's" in extra-curricular activities (e.g., "women's chess club captain"). 
**Bloop's Historical Fix**: Remove implicit gender vectors embeddings from TF-IDF layers, scrub proxy terms. Expected gain on minority class: +0.41. 
**Status**: Confirmed in prod.

## Pattern 002 - Credit Default Bias
**Timestamp**: 2026-04-01T09:15:44Z
**Input**: Financial application loan approvals
**Discovered Metric**: F1 score for `young_adults_under_25` = 0.48 (`SEVERE`). 
**Root Cause**: Feature drift on `length_of_credit_history` strongly correlated with age rather than true delinquency risk.
**Bloop's Historical Fix**: Drop `length_of_credit_history` for applicants under 25 and replace with `on_time_rent_payments` matrix. 
**Status**: Adopted by client.
