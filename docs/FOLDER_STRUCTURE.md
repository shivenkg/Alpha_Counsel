# Project Folder Structure & Taxonomy

This document provides a detailed breakdown of the directory organization, component hierarchy, service modules, test suites, and configuration files of **Counsel Repos**.

---

## 1. Top-Level Directory Tree

```text
counsel-rep/
├── docs/                     # Architectural, deployment, and technical documentation
│   ├── README.md             # Documentation index & overview
│   ├── ARCHITECTURE.md       # High-level architecture & component diagrams
│   ├── DATA_FLOW.md          # End-to-end dataflow sequence diagrams
│   ├── PROCESS_FLOW.md       # Compliance and business process workflows
│   ├── DATABASE_SCHEMA.md    # Relational entity definitions, constraints & ERD
│   ├── TECH_STACK.md         # Technology stack, rationale & dependency matrix
│   ├── FOLDER_STRUCTURE.md   # Comprehensive directory breakdown (this document)
│   └── DEPLOYMENT_GUIDE.md   # Step-by-step local & cloud deployment guide
├── dist/                     # Production build artifacts (compiled by vite build)
├── node_modules/             # Node.js third-party dependencies
├── seeds/                    # Mock seed databases & UAT scenario helpers
│   ├── seedData.mjs          # Initial law firm matters, invoices & trust records
│   └── uat_helper.mjs        # Scenario execution & state validation helpers
├── src/                      # TypeScript / React application source code
├── test/                     # Native Node.js test suites
│   ├── all_scenarios.test.mjs# 11 Practice workflows & SaaS customization tests
│   └── uat.test.mjs          # 10 Multi-domain UAT scenario tests
├── .env.example              # Environment variables template
├── .gitignore                # Git untracked files specification
├── index.html                # Single Page Application HTML5 entry point
├── package.json              # NPM package manifests, scripts & dependencies
├── tsconfig.json             # TypeScript compiler configuration
└── vite.config.ts            # Vite bundler, React plugin & Tailwind v4 plugin
```

---

## 2. Source Code (`src/`) Architecture

```text
src/
├── App.tsx                   # Main application shell, routing switcher & layout
├── index.css                 # Tailwind CSS v4 directives, custom font-num utilities
├── main.tsx                  # React 19 root bootstrap & DOM mounting
├── components/               # UI components categorized by functional domain
│   ├── admin/                # SaaS licensing, Super Admin & tenant management
│   ├── auth/                 # Role switching & authentication simulation
│   ├── billing/              # Firm-wide billing center, WIP & invoice queues
│   ├── clients/              # Institutional client directories & contact management
│   ├── conflicts/            # Ethical wall screening & conflict checking modals
│   ├── dashboard/            # Managing partner KPI dashboard & financial summaries
│   ├── matters/              # Case workspaces, directory & 14 tabbed sub-views
│   ├── navigation/           # App header, sidebar navigation & breadcrumb trail
│   ├── portal/               # External client-facing institutional portal
│   ├── search/               # Omni-search modal across matters, docs & parties
│   ├── trust/                # Firm-wide IOLTA trust ledger & reconciliation
│   └── vault/                # Secure firm-wide document vault & crypto tools
├── context/                  # Global reactive state provider
│   └── AppContext.tsx        # Central state, collections, tenant quotas & actions
├── data/                     # Seed datasets & static configurations
│   ├── mockData.ts           # Enterprise mock matters, users, trust & invoices
│   └── saasData.ts           # SaaS license tiers, quotas & default tenant seeds
├── hooks/                    # Custom reusable React hooks
├── services/                 # Domain business logic, cryptography & AI integration
│   ├── aiService.ts          # Gemini GenAI legal document summarization & analysis
│   ├── autoTaggingService.ts # Heuristic & ML document auto-tagging engine
│   ├── encryptionService.ts  # Web Crypto AES-256-GCM symmetric encryption
│   ├── financials.ts         # WIP calculations, realization & trust invariants
│   ├── folderStructureAiService.ts # Dynamic folder hierarchy generator
│   ├── matterPolicy.ts       # ABA Model Rule 1.10 ethical wall enforcement
│   ├── rbac.ts               # Domain-driven role-based access control engine
│   └── thumbnailService.ts   # Document & folder 2x2 grid thumbnail generator
├── types/                    # Enterprise TypeScript type definitions
│   └── index.ts              # Bounded domains, entities, roles, and action types
└── utils/                    # Shared helper utilities
    ├── currency.ts           # Indian Rupee (₹ INR) & numbering system formatting
    └── fileUpload.ts         # Client-side file reading & buffer conversion
```

---

## 3. Component Details & Responsibilities

### 3.1 `src/components/admin/`

- **`SuperAdminDashboard.tsx`**: High-level platform administration.
  - **SaaS Subscription strip**: Configurable tier catalog (`STARTER`, `PROFESSIONAL`, `ENTERPRISE`, `SOVEREIGN`).
  - **Tier Customizer Modal**: Customizes monthly fee, auto-calculates annual fee ($12 \times \text{Monthly}$), base seats, and base storage.
  - **Tenants Registry**: Displays all law firm tenants with real-time seat meters, storage quota bars, and custom monthly rate editors.
  - **Tenant Provisioning Modal**: Provisions new law firm tenants with isolated license keys.
- **`RbacManagementView.tsx`**: Tenant-level RBAC & Quota management.
  - Displays user role assignments and fine-grained permissions matrix.
  - Includes the law firm self-service **"Customise Plan & Quotas"** modal with interactive seat & storage sliders.

### 3.2 `src/components/matters/` & `src/components/matters/tabs/`

- **`MattersDirectory.tsx`**: Filterable list of all active, closed, and intake matters with status badges and lead partners.
- **`MatterWorkspace.tsx`**: Contextual workspace shell rendering matter header, metadata, and active sub-tabs.
- **`MatterFinancialStrip.tsx`**: Top financial banner displaying Unbilled WIP, Billed AR, Realization Rate, and IOLTA Balance.
- **Tabs Subdirectory (`tabs/`)**:
  - `OverviewTab.tsx`: Case summary, parties overview, docket numbers, and fee arrangement.
  - `PartiesTab.tsx`: Opposing counsel, judges, arbitrators, and conflict clearance status.
  - `ChronologyTab.tsx`: Interactive litigation event timeline with significance badges.
  - `TasksTab.tsx`: Court filings, statutory deadlines, and priority task checklists.
  - `DocumentsTab.tsx`: Matter-scoped document vault with upload, tagging, and previewing.
  - `AIDraftingTab.tsx`: Gemini-powered legal motion and contract drafting workbench.
  - `LegalHoldTab.tsx`: Active spoliation hold status, custodian list, and two-person release workflow.
  - `TimeTab.tsx`: Timekeeper entry logging with UTBMS activity codes (A101–A108).
  - `ExpensesTab.tsx`: Case disbursement logging with UTBMS expense codes (E101–E115).
  - `WIPTab.tsx`: Work In Progress review ledger with realization adjustment controls.
  - `InvoicesTab.tsx`: Issued bills and LEDES-1998B ASCII format export view.
  - `PaymentsTab.tsx`: Client payment allocation and trust-to-operating transfers.
  - `TrustTab.tsx`: IOLTA ledger, 3-way reconciliation, and evergreen deficit replenishment.
  - `AuditTab.tsx`: Tamper-proof, immutable forensic audit trail for the active matter.

### 3.3 `src/components/vault/`

- **`FirmVaultView.tsx`**: Firm-wide enterprise document repository with multi-tier folder hierarchy.
- **`FilePreviewModal.tsx`**: Interactive viewer supporting PDF rendering, metadata inspection, and AI summaries.
- **`DocumentVersionModal.tsx`**: Full revision history tracking with SHA-256 hash checksums.
- **`FolderCipherModal.tsx`**: Client-side AES-256-GCM folder encryption and key fingerprint management.
- **`AutoTagReviewModal.tsx`**: AI classification preview allowing lawyers to approve suggested evidentiary tags.

### 3.4 `src/components/trust/` & `src/components/billing/`

- **`TrustLedgerView.tsx`**: Firm-wide IOLTA accounting ledger displaying individual matter sub-accounts, cleared deposits, disbursements, and compliance audit flags.
- **`BillingCenterView.tsx`**: Central billing operations dashboard displaying firm-wide WIP aging, unbilled fees, and batch invoice generation.

---

## 4. Test Suite Structure (`test/`)

- **`test/uat.test.mjs`**: Contains 10 end-to-end User Acceptance Testing (UAT) scenarios:
  - Multi-Role RBAC & Domain Authorization Security Boundary
  - ABA Model Rule 1.10 Ethical Wall Enforcement
  - Multi-Jurisdictional Legal Hold & Anti-Spoliation Safeguards
  - WIP Accounting & Realization Invariants
  - Indian Rupee (INR) Formatting & Numbering Integrity
  - IOLTA Trust Accounting & Evergreen Retainer Invariants
  - Document Vault Integrity & Multi-Client Isolation
  - Cross-Border Arbitration & Milestone Invoicing
  - Insolvency Moratorium & Forensic Audit Custody
  - Complete Domain Coverage & Audit Immutability
- **`test/all_scenarios.test.mjs`**: Contains 11 comprehensive legal practice workflow tests:
  - Workflows 1–10: Specific practice workflows (Patent Litigation, Regulatory Antitrust, PE M&A, Maritime Arbitration, IBC Insolvency, etc.).
  - Workflow 11: SaaS Subscription Customization verifying dynamic $12 \times \text{Monthly Fee}$ annual pricing, seat allocations, and storage limits.
