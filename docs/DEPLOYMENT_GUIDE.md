# Deployment & Installation Guide

This guide provides end-to-end instructions for installing, configuring, running locally, containerizing, and deploying **Counsel Repos** across various production cloud and on-premise environments.

---

## 1. Prerequisites

Ensure the following runtimes and tools are installed on your workstation or host server:

| Requirement | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.12.0 LTS` | `22.x LTS` | Node.js JavaScript runtime |
| **npm** | `>= 10.5.0` | Latest bundled | Package manager |
| **Git** | `>= 2.40.0` | Latest | Version control |
| **Docker** (optional) | `>= 24.0.0` | Latest | For containerized deployment |
| **Docker Compose** | `>= 2.20.0` | Latest | For multi-container orchestration |

---

## 2. Local Environment Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/gautam303in/counsel-rep.git
cd counsel-rep
```

### Step 2: Configure Environment Variables

Create your local `.env` configuration file from the template:

```bash
# On Linux/macOS
cp .env.example .env

# On Windows PowerShell
Copy-Item .env.example .env
```

Populate the required environment variables inside `.env`:

```ini
# Application Port & Host
PORT=3000
HOST=0.0.0.0

# Gemini AI API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Application Environment Mode
NODE_ENV=development

# Multi-Tenant & Encryption Salts (Production)
ENCRYPTION_KEY_SALT=your_secure_hex_salt_at_least_32_chars
```

> [!NOTE]
> When `VITE_GEMINI_API_KEY` is not provided or invalid, Counsel Repos gracefully activates a resilient local offline mock engine for document summaries, auto-tagging, and litigation chronology parsing.

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run Development Server

```bash
npm run dev
```

The application will start with Hot Module Replacement (HMR) enabled:

- **Local URL**: `http://localhost:3000/`
- **Network URL**: `http://<your-local-ip>:3000/`

---

## 3. Running Automated Tests & Validation

Counsel Repos includes a complete Node.js native test harness covering multi-tenant RBAC, ABA ethical walls, legal hold cryptographic integrity, trust accounting invariants, Indian Rupee milestone invoicing, and SaaS customization:

```bash
# Run all 21 automated workflow and UAT scenarios
npm test

# Run UAT scenarios only
npm run test:uat

# Run SaaS and practice workflow scenarios only
npm run test:scenarios

# Perform strict TypeScript compilation check
npm run lint
```

---

## 4. Production Build & Local Preview

To compile the application bundle for production:

```bash
# 1. Clean previous build artifacts
npm run clean

# 2. Compile optimized static bundle
npm run build

# 3. Preview production bundle locally
npm run preview
```

The production output is placed in the `dist/` directory:

- `dist/index.html`: Minified single-page application entrypoint
- `dist/assets/index-[hash].js`: Code-split, tree-shaken JavaScript bundle
- `dist/assets/index-[hash].css`: Compiled Tailwind CSS v4 stylesheets

---

## 5. Containerized Deployment (Docker)

### Dockerfile

Create or use the multi-stage `Dockerfile`:

```dockerfile
# Stage 1: Build Phase
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Production Web Server (Nginx)
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration (`nginx.conf`)

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # Single Page App Routing (HTML5 History fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff2|woff|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### Build and Run Docker Container

```bash
# Build Docker image
docker build -t counsel-repos:latest .

# Run container on port 8080
docker run -d -p 8080:80 --name counsel-repos-prod counsel-repos:latest

# Verify health status
docker ps
```

---

## 6. Docker Compose Deployment

```yaml
version: '3.8'

services:
  counsel-repos:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: counsel_repos_app
    restart: always
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
      - VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
```

Launch with:

```bash
docker compose up -d
```

---

## 7. Cloud Deployment Options

### Option A: Vercel / Netlify Deployment

1. Connect your GitHub repository to Vercel or Netlify.
2. Set Build Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Configure Environment Variables in the project settings:
   - `VITE_GEMINI_API_KEY`: `<Your Gemini API Key>`
4. For Single Page App routing, configure rewrite rules in `vercel.json`:

   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Option B: AWS S3 + CloudFront

1. Build production assets: `npm run build`.
2. Sync `dist/` directory to an AWS S3 bucket configured for static website hosting:

   ```bash
   aws s3 sync dist/ s3://counsel-repos-production/ --delete
   ```

3. Set up an **AWS CloudFront Distribution** pointing to the S3 bucket with:
   - HTTPS redirect enabled (ACM SSL certificate).
   - Custom Error Response: HTTP 403 & 404 $\rightarrow$ Return `/index.html` with HTTP 200 (SPA routing).
   - Invalidation on deployment: `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`.

### Option C: Google Cloud Run

```bash
# Submit build to Google Cloud Build
gcloud builds submit --tag gcr.io/<PROJECT_ID>/counsel-repos:latest

# Deploy to Cloud Run
gcloud run deploy counsel-repos \
  --image gcr.io/<PROJECT_ID>/counsel-repos:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 80 \
  --set-env-vars "NODE_ENV=production"
```

---

## 8. SSL / TLS Hardening & Security Checklist

- [ ] **HTTPS Enforcement**: Ensure HTTP redirects to HTTPS on port 443 with TLS 1.3.
- [ ] **HSTS**: Set `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- [ ] **Content Security Policy (CSP)**: Restrict scripts, styles, and font sources to self and trusted CDNs.
- [ ] **Anti-Spoliation Audit Trail**: Ensure local storage and server-side log targets are append-only.
- [ ] **Zero-Cross-Pollination**: Verify tenant isolation keys are strictly validated in multi-tenant contexts.
