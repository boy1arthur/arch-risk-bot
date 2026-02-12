# 🚀 Arch Risk Bot - Startup Progress

**Current Status**: Core Engine Porting + Webhook Integration (In-Progress)
**Last Sync**: 2026-02-13

## 📊 Development Status
- **Main Branch**: Baseline monorepo with Turborepo/Probot scaffold.
- **`feat/ai-engine-core`**: Core engine ported, guardrails implemented, v1 template wired.
- **Pending**: PR review & merge of `feat/ai-engine-core` to `main`.

## 🛡️ Locked MVP Guardrails
1. **Suggestion-Only**: No auto-commits or file modifications. Only PR comments with diff suggestions.
2. **Changed Files Only**: Analysis is limited to Python files listed in the PR diff.
3. **Exclusion Rules**: Ignore `node_modules`, `dist`, `build`, `vendor`, `.venv`, `generated`.
4. **Safety Limits**: Max 20 files, Max 2,000 lines total. Timeout at 10s per AI request.
5. **Fail-safe**: If limits exceed, post a "Summary-only" warning instead of deep analysis.

## 📅 Next 7 Days Execution Plan (3 Tasks/Day)

### Day 1: Finalize Core & Guardrails (Done)
- [x] Wire v1 Concise Template to Webhook handler.
- [x] Implement Folder/Line-count Guardrails.
- [x] Create E2E Demo Scenario & Sample code.

### Day 2: Environment & Documentation
- [ ] Draft `docs/github-app-setup.md` (Permissions & Events).
- [ ] Finalize `docs/mvp-acceptance-checklist.md`.
- [ ] Push all doc updates and request Codex review on PR.

### Day 3: Local E2E Validation
- [ ] Run Smee.io local test with `risky_module.py`.
- [ ] Verify "Large PR" warning behavior.
- [ ] Fix any AI response parsing bugs (JSON safety).

### Day 4: Production Setup
- [ ] Finalize `docs/deploy-v0.md` (Railway deployment focus).
- [ ] Configure Production GitHub App with proper secrets.
- [ ] Set up basic Health Check endpoint in Webhook server.

### Day 5: Deployment & Integration
- [ ] Execute Railway deployment.
- [ ] Verify Webhook delivery in Production logs.
- [ ] Test integration with a real external repository.

### Day 6: Reliability & Polish
- [ ] Refine AI prompts for higher quality suggestions.
- [ ] Implement retry logic for Gemini API temporary failures.
- [ ] Update README with "Add to GitHub" button & instructions.

### Day 7: MVP Handover & Launch
- [ ] Run full Acceptance Test Checklist.
- [ ] Record final demo video/recording.
- [ ] Merge `feat/ai-engine-core` to `main` and declare V1.0.0-mvp.

## 🤖 Requests for Codex
- Review the `docs/` folder for clarity and consistency.
- Generate PR descriptions based on `.ai/progress.md` updates.
- Monitor for any architectural drift during the porting phase.
