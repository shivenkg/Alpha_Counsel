# Process Flow Diagrams

This document outlines the core business and compliance processes enforced across **Counsel Repos**.

---

## 1. Legal Hold Preservation & Two-Person Release Process

To comply with Federal Rule of Civil Procedure 37(e) and strict spoliation prevention standards, a legal hold can only be released through a mandatory **two-person authorization protocol**.

```mermaid
flowchart TD
    A([Litigation or Investigation Initiated]) --> B[Lead Litigation Partner Creates Legal Hold]
    B --> C[Assign Custodians & Matters to Hold]
    C --> D[Vault Documents Locked: Read-Only Mode]
    D --> E[Custodians Acknowledge Preservation Obligation]

    E --> F{Litigation Concluded or Settled?}
    F -- No --> G[Hold Remains Active: Deletions Permanently Blocked]
    G --> D

    F -- Yes --> H[Primary Partner Submits Release Request with Justification]
    H --> I[Secondary Partner Receives Independent Review Notification]
    I --> J{Secondary Partner Approves?}
    J -- Rejected --> K[Hold Remains Active with Review Logged]
    K --> G
    J -- Approved --> L[Dual-Authorized Release Finalized]
    L --> M[Forensic Audit Log Recorded with Tamper-Proof Cryptographic Hash]
    M --> N([Documents Return to Standard Retention Schedule])
```

---

## 2. Conflict of Interest Check & Ethical Wall Enforcement

```mermaid
flowchart TD
    NewClient([New Matter Onboarding Request]) --> SearchParties[Run Conflict Search Across Firm Database]
    SearchParties --> ConflictFound{Adverse or Related Party Found?}

    ConflictFound -- No --> ClearMatter[Issue Conflict Clearance Certificate]
    ClearMatter --> ProceedMatter([Proceed to Engagement & Fee Agreement])

    ConflictFound -- Yes --> CheckDisqualification{Can Conflict Be Cured with an Ethical Wall?}
    CheckDisqualification -- No --> DeclineEngagement([Mandatory Disqualification: Decline Representation])

    CheckDisqualification -- Yes --> DraftWall[Draft Ethical Wall Rule under ABA Model Rule 1.10]
    DraftWall --> ScreenPersonnel[Screen Disqualified Lawyers & Paralegals]
    ScreenPersonnel --> LockVault[Automate Vault & Billing Access Restrictions]
    LockVault --> PartnerSignoff[General Counsel Sign-Off & Formal Client Notification]
    PartnerSignoff --> MonitorCompliance[Continuous Access Monitoring & Audit Logging]
```

---

## 3. WIP Tracking to LEDES-1998B Invoicing Lifecycle

```mermaid
flowchart LR
    A[Lawyer Logs Billable Time & UTBMS Activity Code] --> B[Paralegal Logs Case Expenses & UTBMS Expense Code]
    B --> C[Work In Progress WIP Ledger Updated]
    C --> D[Billing Cycle Cutoff Date Reached]
    D --> E[Pre-Bill Review by Responsible Partner]
    E --> F{Write-Downs or Adjustments Required?}
    F -- Yes --> G[Apply Realization Rate Adjustment & Record Reason]
    G --> H[Final Invoice Generated]
    F -- No --> H
    H --> I{Auto-Pay from Client IOLTA Retainer?}
    I -- Yes --> J[Debit IOLTA Account & Credit Operating Account]
    I -- No --> K[Issue LEDES-1998B File to Institutional Client Portal]
    J --> L([Invoice Marked Paid & LEDES-1998B Audit Archive Created])
    K --> M[Client Electronic Remittance Received]
    M --> L
```

---

## 4. SaaS Subscription Customization & Quota Surcharges

```mermaid
flowchart TD
    A([Law Firm Administrator Opens Customizer Modal]) --> B[Select Base SaaS Tier: Starter / Pro / Enterprise / Sovereign]
    B --> C[Review Base Inclusions: Fee, Users, Storage]
    C --> D[Adjust User Seats Slider]
    D --> E{Selected Seats > Base Quota?}
    E -- Yes --> F[Calculate Add-On User Surcharges at Discounted Rate]
    E -- No --> G[Seat Surcharge = 0]

    F & G --> H[Adjust Vault Storage Slider]
    H --> I{Selected Storage > Base Quota?}
    I -- Yes --> J[Calculate Storage Surcharges in 50 GB Increments]
    I -- No --> K[Storage Surcharge = 0]

    J & K --> L[Compute Total Monthly Subscription = Base + Seats + Storage]
    L --> M[Compute Annual Subscription = Total Monthly * 12]
    M --> N[Admin Reviews Detailed Breakdown & Confirms Upgrade]
    N --> O[Update Tenant Record & Immediately Provision Expanded Quotas]
    O --> P([Updated Active Limits & Live Ledger Reflected Immediately])
```
