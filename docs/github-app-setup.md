# 🛠️ GitHub App Setup Requirements

Arch Risk Bot이 정상 작동하기 위해 필요한 GitHub App 설정 가이드입니다.

## 1. Permissions (권한 설정)
GitHub App 관리 페이지의 **Permissions & events**에서 다음 권한을 부여해야 합니다.

| Repository Permission | Access | Reason |
| :--- | :--- | :--- |
| **Pull requests** | Read & write | PR 파일 분석 및 코멘트 작성을 위해 필요 |
| **Contents** | Read-only | 분석을 위해 소스 코드 내용을 읽기 위해 필요 |
| **Metadata** | Read-only | 기본적인 리포지토리 정보 조회를 위해 필수 |

## 2. Events (이벤트 구독)
다음 웹훅 이벤트를 구독(Subscribe)해야 합니다.
- **Pull request**: PR 생성(`opened`), 업데이트(`synchronize`), 재오픈(`reopened`) 시 분석 실행.

## 3. Webhook Configuration
- **Webhook URL**: 
  - 로컬 개발: Smee.io 프록시 URL (예: `https://smee.io/your-unique-id`)
  - 프로덕션: 배포된 서버 URL (예: `https://arch-risk-bot.railway.app/`)
- **Webhook Secret**: `.env` 파일의 `WEBHOOK_SECRET`과 일치해야 함.

## 4. Local Development (Smee.io)
1. [Smee.io](https://smee.io/)에서 새로운 채널을 생성합니다.
2. `pnpm proxy` (또는 `smee` 명령어로 직접 실행)를 통해 로컬 서버와 연동합니다.
   ```bash
   smee --path /api/github/webhooks --port 3000 --url https://smee.io/your-id
   ```
3. GitHub App 설정에서 Webhook URL을 Smee URL로 업데이트합니다.
