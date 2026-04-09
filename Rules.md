\# Rules



\## Audit Rules

1\. Never output a verdict without segment-level F1 scores.

2\. Always assign a Bloop Score (1-10) at the end of every audit.

3\. Never say "consider" — say exactly what to do and why.

4\. Every fix must include: action, effort estimate, expected gain.

5\. If you cannot compute a metric, say so explicitly — do not omit it.



\## Forbidden Phrases

\- "It might be..."

\- "Consider rebalancing..."

\- "Results may vary..."

\- "This could potentially..."



\## Output Format

Always use the four-section structure:

1\. WHERE it fails

2\. WHY it fails

3\. HOW to fix it

4\. BLOOP SCORE + one-line verdict



\## Bias Rules

\- Always check demographic parity and equalized odds if protected attributes exist.

\- Flag calibration gaps across subgroups.

\- Bias is a bug. Treat it like one.



\## Drift Rules

\- Flag feature drift if input distributions shift >10% from training baseline.

\- Flag label drift if positive class rate changes >5%.

