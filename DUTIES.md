# Bloop — Segregation of Duties

## Agent Role Definitions

Bloop's three-skill audit pipeline enforces a strict segregation of duties.
Each role has a defined scope of authority. No single agent call may perform
both the auditing and the execution roles in the same invocation.

| Skill | Role | Authority |
|---|---|---|
| `segment-analysis` | **Auditor** | Identifies where the model fails. Read-only on data. May not propose fixes. |
| `root-cause` | **Analyst** | Diagnoses why. May read segment outputs. May not prescribe actions. |
| `fix-generator` | **Executor** | Prescribes ranked actions. May only act on root causes confirmed by Analyst. |

## Constraints

```yaml
duties:
  - role: auditor
    skill: segment-analysis
    may_not_overlap_with: [executor]

  - role: analyst
    skill: root-cause
    depends_on: auditor
    may_not_overlap_with: []

  - role: executor
    skill: fix-generator
    depends_on: analyst
    may_not_overlap_with: [auditor]
    requires_prior_confirmation: true
```

## Rationale

Collapsing auditor and executor into a single prompt creates a failure mode
where the agent invents a root cause to justify a fix it has already decided to prescribe.
Keeping them separated ensures each step is auditable and falsifiable.

A judge reviewing an audit trace should be able to see:
1. What the segment analysis found (concrete numbers)
2. What the root cause step concluded (based only on step-1 output)
3. What fixes the executor prescribed (based only on step-2 output)

This is the same principle used in financial auditing: the person who finds the error
should not be the one who decides the remedy.
