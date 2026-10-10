# Counsel Repos — Technical Documentation

Welcome to the comprehensive technical documentation for **Counsel Repos**, an enterprise-grade Legal Practice Management & SaaS Multi-Tenant Platform built for law firms, general counsels, and institutional legal departments.

---

## Documentation Navigation

| Document | Description | Direct Link |
| :--- | :--- | :--- |
| **Tech Stack** | Full breakdown of runtime, frameworks, libraries, build tools, and testing suites. | [TECH_STACK.md](file:///d:/Projects/Gautam_Github/Counsel-rep/counsel-rep/docs/TECH_STACK.md) |
| **Folder Structure** | In-depth directory layout, file-level responsibilities, component hierarchy, and services. | [FOLDER_STRUCTURE.md](file:///d:/Projects/Gautam_Github/Counsel-rep/counsel-rep/docs/FOLDER_STRUCTURE.md) |
| **System Architecture** | High-level system architecture, multi-tenant isolation model, RBAC layers, and diagrams. | [ARCHITECTURE.md](file:///d:/Projects/Gautam_Github/Counsel-rep/counsel-rep/docs/ARCHITECTURE.md) |
| **Database Schema** | Full relational entity definitions, constraints, foreign keys, and Mermaid ERD. | [DATABASE_SCHEMA.md](file:///d:/Projects/Gautam_Github/Counsel-rep/counsel-rep/docs/DATABASE_SCHEMA.md) |
| **Data Flow Diagrams** | Mermaid diagrams mapping document pipelines, legal holds, trust accounting, and tenant billing. | [DATA_FLOW.md](file:///d:/Projects/Gautam_Github/Counsel-rep/counsel-rep/docs/DATA_FLOW.md) |
| **Process Flow Diagrams** | Operational workflows for ethical walls, spoliation hold release, WIP billing, and SaaS licensing. | [PROCESS_FLOW.md](file:///d:/Projects/Gautam_Github/Counsel-rep/counsel-rep/docs/PROCESS_FLOW.md) |
| **Installation & Deployment** | Step-by-step local development setup, environment variables, Docker, and cloud deployment. | [DEPLOYMENT_GUIDE.md](file:///d:/Projects/Gautam_Github/Counsel-rep/counsel-rep/docs/DEPLOYMENT_GUIDE.md) |

---

## Core System Highlights

1. **Multi-Tenant SaaS Licensing & Quota Engine**:
   - Dynamic tiering (`STARTER`, `PROFESSIONAL`, `ENTERPRISE`, `SOVEREIGN`) with seat quota limits, storage capacity meters, and customizable Indian Rupee (INR ₹) billing.
   - Real-time annual subscription calculation strictly adhering to $12 \times \text{Monthly Fee}$.

2. **Domain-Driven RBAC & Zero-Trust Isolation**:
   - 4 Core Roles (`Administrator`, `Lawyer`, `Paralegal`, `Client`) across 7 distinct permission domains (`Matters`, `Documents`, `Billing`, `Trust`, `Conflicts`, `Audit`, `System`).
   - Tenant-level data scoping ensuring zero cross-pollination between law firm subscribers or external clients.

3. **Legal Compliance & Ethical Walls**:
   - ABA Model Rule 1.10 ethical wall screening with imputed disqualification.
   - Legal hold preservation with tamper-proof cryptographic hashing and dual-sign-off spoliation release guards.

4. **Legal Financial & Trust Accounting Engine**:
   - IOLTA / Trust evergreen retainer deficit protection and three-way reconciliation.
   - Automated conversion of WIP time/expense entries to LEDES-1998B format compliant invoices.
   - Native Indian numbering system formatting (Crores, Lakhs, Thousands: `₹12,34,567.00`).
