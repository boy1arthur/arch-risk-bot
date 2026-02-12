# 🚀 MVP Production Deploy Plan (v0)

Arch Risk Bot의 첫 번째 프로덕션 배포를 위한 최소 실행 계획입니다.

## 1. 배포 플랫폼: Railway
가장 빠른 배포와 안정적인 Node.js 지원을 위해 **Railway**를 선택합니다.

## 2. 배포 절차
1. **GitHub 연동**: Railway 대시보드에서 `arch-risk-bot` 리포지토리를 연결합니다.
2. **서비스 설정**:
   - `Root Directory`: `apps/webhook` (모노레포의 개별 앱으로 설정)
   - `Build Command`: `pnpm install && pnpm build`
   - `Start Command`: `pnpm start`
3. **Environment Variables**: 아래 세부 섹션의 환경 변수를 주입합니다.

## 3. 필스 환경 변수 (Secrets)
| Key | Value Description |
| :--- | :--- |
| `APP_ID` | GitHub App ID |
| `PRIVATE_KEY` | GitHub App Private Key (Base64 인코딩 또는 전체 텍스트) |
| `WEBHOOK_SECRET` | GitHub Webhook Secret |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `NODE_ENV` | `production` |

## 4. 모니터링 및 상태 확인
- **Health Check**: `/` 또는 `/api/github/webhooks` 경로가 `200 OK`(또는 Probot 기본 응답)를 반환하는지 확인.
- **Logs**: Railway의 실시간 로그 탭을 통해 Webhook Delivery 성공 여부 트래킹.
- **Alert basics**: 배포 실패 시 이메일/Slack 알림 설정(Railway 기본 기능 활용).

## 5. 보안 가이드
- `PRIVATE_KEY`는 절대 코드에 포함하지 말고 Railway Secrets로만 관리합니다.
- Webhook Secret을 통한 페이로드 검증이 활성화되어 있는지 확인합니다.
