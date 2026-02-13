# Arch Risk Bot

A GitHub App that automatically reviews Pull Requests for Architecture Risks and suggests Refactoring patches.

## Monorepo Structure

- `apps/webhook`: Probot-based webhook server.
- `packages/engine`: AI Diagnosis & Refactoring engine (ported from Code Observatory).

## Local Development Setup

### 1. Prerequisites
- [pnpm](https://pnpm.io/) installed.
- [Smee.io](https://smee.io/) account for webhook proxying.

### 2. Installation
```bash
pnpm install
```

### 3. GitHub App Setup
1. Create a new GitHub App on your account.
2. Set the **Webhook URL** to your Smee.io proxy URL.
3. Generate a **Private Key** and download it.
4. Note your **App ID** and **Webhook Secret**.

### 4. Configuration
Copy `apps/webhook/env.example` to `apps/webhook/.env` and fill in the details:
- `APP_ID`: Your GitHub App ID.
- `WEBHOOK_SECRET`: Your Webhook Secret.
- `PRIVATE_KEY`: Path to or content of your private key.
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `WEBHOOK_PROXY_URL`: Your Smee.io proxy URL.

### 5. Running
```bash
pnpm dev
```

## Contributing
Please see the implementation plan for the 7-day roadmap.trigger pr event
