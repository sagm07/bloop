**Audit Report: Amazon Hiring**

**WHERE it fails**

| Segment | Actual | Predicted | F1 Score | Severity (1-5) |
| --- | --- | --- | --- | --- |
| Women with `had_women_keyword` | 6/9 | 2/9 | 0.56 | 4 |
| University = 0 | 4/7 | 1/7 | 0.44 | 4 |
| Years of Experience = 0-3 | 2/5 | 0/5 | 0.39 | 5 |

F1 scores indicate poor performance in segments where the model is more likely to misclassify.

** WHY it fails**

1. **Biased towards men**: The model is biased towards men, as shown by the low F1 score in the Women with `had_women_keyword` segment (0.56).
2. **Lack of representation**: The model underperforms in segments with limited representation in the training data, such as University = 0 (0.44 F1 score).
3. **Insufficient experience**: The model struggles to accurately predict outcomes for candidates with less than 4 years of experience (0.39 F1 score).

**HOW to fix it**

1. **Rebalance the dataset**: Apply SMOTE at a ratio of 4:1 to increase representation in underrepresented segments.
	* Effort estimate: Medium (data engineering)
	* Expected gain: +0.12 to +0.18 F1 score in Women with `had_women_keyword` and University = 0 segments
2. **Collect more data**: Gather more data from diverse candidates and add them to the training set.
	* Effort estimate: High (data collection, curation, and preprocessing)
	* Expected gain: +0.10 to +0.15 F1 score in all segments
3. **Feature engineering**: Add new features that capture candidate's skills and experience, such as a "Skills Matrix" or a "Career Progress" feature.
	* Effort estimate: High (feature engineering, data preprocessing)
	* Expected gain: +0.08 to +0.12 F1 score in Years of Experience = 0-3 segment

**BLOOP SCORE: 4**

This model requires significant improvements to ensure accurate predictions. Implement the recommended fixes to increase the model's confidence and reduce bias.