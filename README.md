# arch-risk-bot

초기 MVP를 빠르게 검증하기 위한 **모노레포(Monorepo)** 구조입니다.

## Repository Structure

```text
arch-risk-bot/
  apps/
    github-app/        # GitHub webhook server
  packages/
    analysis-engine/   # Risk detection + AI diagnosis + patch generation
    shared/            # Shared types/utilities
  docs/
  .github/
    workflows/         # CI workflows
  README.md
  LICENSE
```

## Getting Started

```bash
git clone https://github.com/<owner>/arch-risk-bot.git
cd arch-risk-bot
```

## Development Notes

- 초기 단계에서는 단일 레포를 유지합니다.
- 시스템이 커지면 서비스/패키지 단위 분리를 검토합니다.
