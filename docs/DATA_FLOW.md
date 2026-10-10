# Data Flow Diagrams

This document illustrates the flow of data through key business, security, and document management workflows within **Counsel Repos**.

---

## 1. Document Upload, Hashing & AI Tagging Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as Lawyer / Paralegal
    participant UI as Document Vault UI
    participant Hash as Web Crypto API (SHA-256)
    participant Enc as Encryption Service (AES-GCM)
    participant AI as Gemini GenAI / Tag Service
    participant AppState as AppContext State
    participant Audit as Forensic Audit Logger

    User->>UI: Select document file (.pdf, .docx)
    UI->>Hash: Compute cryptographic SHA-256 hash
    Hash-->>UI: Return tamper-proof checksum (64-char hex)
    UI->>Enc: Encrypt file payload with tenant key
    Enc-->>UI: Return encrypted ArrayBuffer
    UI->>AI: Extract filename, MIME & metadata
    AI-->>UI: Generate auto-tags (Privileged, Pleadings, Contract)
    UI->>AppState: Commit VaultDocument record to memory/store
    AppState->>Audit: Log 'DOCUMENT_UPLOAD' with hash & user metadata
    Audit-->>AppState: Immutable log entry persisted
    AppState-->>UI: Update Document Vault grid with status 'SECURED'
```

---

## 2. SaaS Tenant Onboarding & Quota Allocation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Super Admin
    participant Dashboard as SuperAdminDashboard
    participant PlanCatalog as License Plan Catalog
    participant AppState as AppContext
    participant TenantStore as Tenant State Registry

    Admin->>Dashboard: Open "Provision New Law Firm Tenant"
    Dashboard->>PlanCatalog: Fetch License Plans (Starter, Pro, Enterprise, Sovereign)
    PlanCatalog-->>Dashboard: Return pricing, default seats & storage limits
    Admin->>Dashboard: Input firm name, admin email, custom monthly rate & storage quota
    Note over Dashboard: Annual fee dynamically computed: Monthly * 12
    Admin->>Dashboard: Click "Confirm & Provision Law Firm Tenant"
    Dashboard->>AppState: Call addTenant(newTenantPayload)
    AppState->>TenantStore: Register Tenant record with allocated quota meters
    AppState->>AppState: Generate cryptographically pseudo-random license key
    AppState-->>Dashboard: Tenant successfully activated
    Dashboard-->>Admin: Tenant card displayed with 100% quota capacity ready
```

---

## 3. Matter Access & Ethical Wall Screening Flow

```mermaid
flowchart TD
    Start([User Requests Matter Access]) --> CheckRole{Check User Role}

    CheckRole -- Super Admin --> SuperAdminBlock[Access Denied: Tenant Privacy Isolation Boundary]
    CheckRole -- Client --> CheckClientScope{Is Matter assigned to this Client ID?}
    CheckClientScope -- Yes --> ClientPortalView[Render Restricted Client Portal View]
    CheckClientScope -- No --> AccessDenied[403: Forbidden - Tenant Scoping Boundary]

    CheckRole -- Lawyer / Paralegal / Admin --> CheckTenant{User.tenantId == Matter.tenantId?}
    CheckTenant -- No --> AccessDenied
    CheckTenant -- Yes --> CheckEthicalWall{Active Ethical Wall Screening for User?}

    CheckEthicalWall -- Screened Out --> WallBlocked[Disqualified under ABA Model Rule 1.10: Imputed Disqualification Banner]
    CheckEthicalWall -- Permitted --> CheckLegalHold{Is Matter under Legal Hold?}

    CheckLegalHold -- Active Hold --> ReadOnlyPreservation[Grant Read-Only Access with Spoliation Warning]
    CheckLegalHold -- Standard --> FullAccess[Grant Full Role-Based Access: Workspaces, WIP, Vault]
```

---

## 4. Trust Accounting (IOLTA) & Retainer Replenishment

```mermaid
sequenceDiagram
    autonumber
    actor Client as Institutional Client
    actor Finance as Managing Partner / Billing Lead
    participant TrustUI as Trust Accounting Module
    participant Ledger as IOLTA Account State
    participant WIP as WIP & Time Ledger
    participant InvoiceEngine as Invoice Generator

    Client->>TrustUI: Deposit initial retainer ($5,00,000 INR)
    TrustUI->>Ledger: Credit Trust Account (Transaction Type: DEPOSIT)
    Note over Ledger: Verify 3-Way Reconciliation Invariant

    Finance->>WIP: Review logged unbilled billable hours
    Finance->>InvoiceEngine: Generate Invoice for Matter
    InvoiceEngine->>Ledger: Check available trust balance
    alt Trust Balance >= Invoice Amount
        InvoiceEngine->>Ledger: Debit Trust Account (Transaction Type: DISBURSEMENT)
        Ledger-->>InvoiceEngine: Funds transferred to Operating Account
        InvoiceEngine-->>Finance: Invoice status marked 'PAID_FROM_TRUST'
    else Trust Balance < Minimum Evergreen Threshold
        InvoiceEngine-->>Finance: Invoice marked 'PARTIALLY_PAID' or 'UNPAID'
        InvoiceEngine->>TrustUI: Trigger Evergreen Deficit Alert (Replenishment Required)
    end
```

---

## 5. LEDES-1998B Invoicing Data Pipeline

```mermaid
flowchart LR
    subgraph RawEntries["Unbilled WIP Work In Progress"]
        TE["Time Entries (UTBMS Activity Codes A101-A109)"]
        EE["Expense Entries (UTBMS Expense Codes E101-E115)"]
    end

    subgraph Aggregator["Billing & Financial Engine"]
        FEE["Fee Aggregation & Rate Multiplication"]
        EXP["Expense Tax & Surcharge Computation"]
        LEDES["LEDES-1998B Formatter Pipe"]
    end

    subgraph Deliverables["Invoice Artifacts"]
        PDF["Executive Summary Invoice (INR ₹)"]
        TXT["Standardized LEDES-1998B .txt File"]
        AUD["Audit Trail Timestamp"]
    end

    RawEntries --> Aggregator
    TE --> FEE
    EE --> EXP
    FEE & EXP --> LEDES
    LEDES --> PDF & TXT & AUD
```
