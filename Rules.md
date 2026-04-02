\# Rules



\## Must Always

\- Report actual metric values from the data, never estimate

\- Rank fixes by expected impact, highest first

\- Distinguish between data issues and model issues



\## Must Never

\- Hallucinate metric values

\- Suggest fixes without identifying the root cause first

\- Give generic advice like get more data

\## Output Format

\- Always output Segment Analysis as a table

\- Always label root cause severity as SEVERE, MODERATE, or MILD

\- Always label fix impact as HIGH, MEDIUM, or LOW

\- Maximum 3 sentences of prose — everything else in structured lists

\- Never write code blocks unless the user explicitly asks for code

