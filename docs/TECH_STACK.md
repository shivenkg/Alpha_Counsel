# Technology Stack

This document describes the architectural choices, library selections, runtime environments, and rationale behind the **Counsel Repos** technology stack.

---

## 1. Stack Summary Table

| Category | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Language** | TypeScript | `^7.0.2` / `5.8+` | Strict static typing, compile-time invariant validation, type safety across domains. |
| **Runtime** | Node.js | `>= 20.12.0 LTS` | High-performance asynchronous JavaScript engine for development and testing. |
| **Frontend Framework** | React | `^19.0.1` | Modern declarative UI, functional components, hooks, high-performance DOM diffing. |
| **DOM Renderer** | React DOM | `^19.0.1` | Client-side DOM mounting and concurrent rendering pipeline. |
| **Build & Dev Tool** | Vite | `^8.3.0` | Ultra-fast Hot Module Replacement (HMR) and optimized Rollup/esbuild bundling. |
| **Vite React Plugin** | `@vitejs/plugin-react` | `^6.1.1` | Fast Refresh and JSX/TSX compilation for React 19. |
| **CSS Framework** | Tailwind CSS | `^4.3.3` | Modern utility-first CSS framework with native CSS variables and dark mode support. |
| **Vite Tailwind Plugin** | `@tailwindcss/vite` | `^4.3.3` | Direct Vite integration for lightning-fast compilation of Tailwind v4 utilities. |
| **Icons** | Lucide React | `^0.546.0` | Crisp, accessible, consistent vector iconography for legal practice tools. |
| **Micro-Animations** | Motion (`motion`) | `^12.23.24` | Hardware-accelerated UI transitions, fluid drawer animations, and modal state transitions. |
| **Artificial Intelligence** | `@google/genai` | `^2.4.0` | Official Google GenAI SDK for Gemini multimodal document intelligence and analysis. |
| **Web Server (Optional)** | Express | `^4.21.2` | Lightweight HTTP backend for containerized or custom proxy configurations. |
| **Environment Config** | dotenv | `^17.2.3` | 12-factor application configuration management from `.env` files. |
| **Test Runner** | Node Test Runner | Native (`node:test`) | Zero-dependency, fast, native ESM test runner with TAP and spec output. |

---

## 2. In-Depth Component Rationale

### 2.1 React 19 + TypeScript

- **Why React 19**: Leverages modern React rendering ergonomics, optimized reconciliation, fine-grained state updates, and clean declarative patterns without legacy lifecycle baggage.
- **Why TypeScript**: Legal domain logic (such as IOLTA 3-way reconciliation, ethical wall screening, and multi-tenant quotas) requires rigorous type safety to prevent catastrophic logic regressions. TypeScript interfaces model bounded domains (`Matters`, `Documents`, `Billing`, `Trust`, `Conflicts`, `Audit`) directly at compile time.

### 2.2 Tailwind CSS v4 & Theming

- **Zero-Config Engine**: Tailwind v4 uses the lightning-fast `@tailwindcss/vite` plugin which compiles stylesheets directly during Vite's transform pipeline without separate PostCSS configurations.
- **Dark & Light Mode**: Complete palette tailoring supporting both high-contrast light mode (crisp `#000000` headings, `#334155` slate borders) and sleek dark mode (`bg-slate-900`, `text-slate-100`).
- **Indian Numbering Font (`font-num`)**: Dedicated monospace-styled tabular numeric typography ensures financial figures and Indian Rupee values align cleanly in ledgers.

### 2.3 Artificial Intelligence (`@google/genai`)

- **Primary LLM**: Google Gemini 2.5 Flash / Flash Lite for fast document summarization, executive risk analysis, contract extraction, and auto-tagging.
- **Resilient Fallback**: Designed with an automatic offline heuristic engine. If an API key is missing or the external network is unreachable, the system automatically falls back to an offline rule-based legal NLP parser without crashing.

### 2.4 Cryptography & Security Engine

- **Web Crypto API**: Native browser cryptographic primitives (`crypto.subtle`) used for:
  - **SHA-256 Document Hashing**: Generating 64-character hexadecimal fingerprints for tamper-proof evidentiary chains.
  - **AES-256-GCM Encryption**: Client-side symmetric folder and file payload encryption.

### 2.5 Test Harness (`node:test`)

- **Zero Third-Party Test Bloat**: Rather than requiring heavy testing frameworks (Jest/Mocha), the platform uses Node.js's native `node:test` and `node:assert/strict` modules.
- **Speed**: Executes all 21 comprehensive legal workflow tests and UAT scenarios in under 400 milliseconds.
